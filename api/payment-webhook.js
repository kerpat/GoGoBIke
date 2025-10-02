
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function createSupabaseAdmin() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase service credentials are not configured.');
    }
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function parseRequestBody(body) {
    if (!body) return {};
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch (err) {
            console.error('Failed to parse webhook body:', err);
            return {};
        }
    }
    return body;
}

async function processSucceededPayment(notification) {
    console.log('--- НАЧАЛО ОБРАБОТКИ УСПЕШНОГО ПЛАТЕЖА (v3) ---');
    const payment = notification.object;
    const metadata = payment.metadata || {};
    const { userId, tariffId, payment_type, debit_from_balance } = metadata; // Добавили debit_from_balance
    const cardPaymentAmount = Number.parseFloat(payment.amount?.value ?? '0'); // Сумма, пришедшая с карты (3000 ₽)
    const amountToDebit = Number.parseFloat(debit_from_balance) || 0;       // Сумма для списания с баланса (750 ₽)
    const yookassaPaymentId = payment.id;

    const supabaseAdmin = createSupabaseAdmin();
    // +++ ВСТАВИТЬ ЭТОТ БЛОК +++
    // =================================================================
    // === ШАГ 1: ВСЕГДА ПРОВЕРЯЕМ И СОХРАНЯЕМ НОВЫЙ МЕТОД ОПЛАТЫ ===
    // =================================================================
    if (payment.payment_method?.saved && userId) {
        console.log(`[СОХРАНЕНИЕ МЕТОДА] Обнаружен новый сохраненный метод для userId: ${userId}`);
        const paymentMethodId = payment.payment_method.id;
        const paymentMethodDetails = payment.payment_method;

        const { data: clientData } = await supabaseAdmin.from('clients').select('extra').eq('id', userId).single();
        const extra = clientData.extra || {};
        extra.payment_method_details = paymentMethodDetails;

        const { error } = await supabaseAdmin
            .from('clients')
            .update({
                yookassa_payment_method_id: paymentMethodId,
                autopay_enabled: true,
                extra: extra
            })
            .eq('id', userId);

        if (error) {
            console.error(`[СОХРАНЕНИЕ МЕТОДА] Ошибка сохранения для userId ${userId}:`, error.message);
        } else {
            console.log(`[СОХРАНЕНИЕ МЕТОДА] Метод ${paymentMethodId} успешно сохранен для userId ${userId}.`);
        }
    }

    // Если это был платеж чисто для привязки карты, просто завершаем.
    if (payment_type === 'save_card') {
        console.log('[ЗАВЕРШЕНИЕ] Это был платеж только для привязки карты. Обработка завершена.');
        return;
    }

    // --- Логика для аренды (если есть tariffId) ---
    if (tariffId) {
        console.log(`[АРЕНДА-ГИБРИД] userId: ${userId}, с карты: ${cardPaymentAmount}, с баланса: ${amountToDebit}`);

        // 1. СПИСЫВАЕМ СРЕДСТВА С БАЛАНСА (ЕСЛИ НУЖНО)
        if (amountToDebit > 0) {
            const { error: balanceError } = await supabaseAdmin.rpc('add_to_balance', {
                client_id_to_update: userId,
                amount_to_add: -amountToDebit // Списываем, поэтому отрицательное значение
            });

            if (balanceError) {
                // КРИТИЧЕСКАЯ СИТУАЦИЯ: деньги с карты списались, а с баланса нет.
                // Нужно инициировать возврат и уведомить поддержку.
                console.error(`[КРИТИЧЕСКАЯ ОШИБКА] Не удалось списать с баланса ${amountToDebit} для userId ${userId} ПОСЛЕ оплаты картой. Инициирую возврат.`);
                // ... код для возврата платежа через API YooKassa ...
                const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64');
                await fetch('https://api.yookassa.ru/v3/refunds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}`, 'Idempotence-Key': crypto.randomUUID() },
                    body: JSON.stringify({ payment_id: yookassaPaymentId, amount: { value: cardPaymentAmount.toFixed(2), currency: 'RUB' }, description: 'Ошибка списания с баланса' })
                });
                throw new Error('Failed to debit from balance after card payment.');
            }
            console.log(`[АРЕНДА-ГИБРИД] Успешно списано с баланса ${amountToDebit} ₽ для userId ${userId}`);
        }

        // 2. Найти случайный свободный велосипед с нужным тарифом
        console.log(`[АРЕНДА-ГИБРИД] Поиск свободного велосипеда для тарифа ${tariffId}...`);
        const { data: availableBikes, error: bikesError } = await supabaseAdmin
            .from('bikes')
            .select('id')
            .eq('status', 'available')
            .eq('tariff_id', tariffId);

        if (bikesError) throw new Error(`Ошибка при поиске велосипедов: ${bikesError.message}`);

        if (!availableBikes || availableBikes.length === 0) {
            console.error(`[КРИТИЧЕСКАЯ ОШИБКА] Нет свободных велосипедов для тарифа ${tariffId}! Инициирую возврат.`);
            // Если велосипедов нет, нужно вернуть деньги
            const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64');
            await fetch('https://api.yookassa.ru/v3/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}`, 'Idempotence-Key': crypto.randomUUID() },
                body: JSON.stringify({ payment_id: yookassaPaymentId, amount: { value: cardPaymentAmount.toFixed(2), currency: 'RUB' }, description: 'Нет свободных велосипедов' })
            });
            // Отправляем уведомление пользователю
            const { data: client } = await supabaseAdmin.from('clients').select('extra').eq('id', userId).single();
            if (client?.extra?.telegram_user_id) {
                await sendTelegramMessage(client.extra.telegram_user_id, '❌ К сожалению, все велосипеды по вашему тарифу оказались заняты. Мы уже оформили полный возврат средств.');
            }
            throw new Error(`Нет свободных велосипедов для тарифа ${tariffId}. Платеж ${yookassaPaymentId} будет возвращен.`);
        }

        const randomBike = availableBikes[Math.floor(Math.random() * availableBikes.length)];
        const bikeId = randomBike.id;
        console.log(`[АРЕНДА-ГИБРИД] Найден и выбран велосипед #${bikeId}`);

        // 3. Обновить статус велосипеда на 'rented'
        const { error: bikeUpdateError } = await supabaseAdmin.from('bikes').update({ status: 'rented' }).eq('id', bikeId);
        if (bikeUpdateError) throw new Error(`Не удалось обновить статус велосипеда #${bikeId}: ${bikeUpdateError.message}`);
        console.log(`[АРЕНДА-ГИБРИД] Статус велосипеда #${bikeId} обновлен на 'rented'.`);

        // 4. Создать запись об аренде со статусом 'awaiting_contract_signing'
        const { data: tariffData } = await supabaseAdmin.from('tariffs').select('duration_days').eq('id', tariffId).single();
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (tariffData?.duration_days || 7));

        // 5. СОЗДАЕМ АРЕНДУ С ПОЛНОЙ СТОИМОСТЬЮ
        const totalPaid = cardPaymentAmount + amountToDebit; // 3000 + 750 = 3750

        const { data: newRental, error: rentalError } = await supabaseAdmin
            .from('rentals')
            .insert({
                user_id: userId,
                bike_id: bikeId,
                tariff_id: tariffId,
                starts_at: startDate.toISOString(),
                current_period_ends_at: endDate.toISOString(),
                status: 'awaiting_battery_assignment', // Статус ожидания выбора АКБ
                total_paid_rub: totalPaid // Записываем полную стоимость тарифа
            })
            .select('id')
            .single();

        if (rentalError) {
            // Откатываем статус велосипеда, если не удалось создать аренду
            await supabaseAdmin.from('bikes').update({ status: 'available' }).eq('id', bikeId);
            throw new Error(`Не удалось создать аренду: ${rentalError.message}`);
        }
        console.log(`[АРЕНДА-ГИБРИД] Создана аренда #${newRental.id} со статусом 'awaiting_battery_assignment'.`);

        // 6. ЗАПИСЫВАЕМ ПЛАТЕЖИ В ИСТОРИЮ (ДВЕ ТРАНЗАКЦИИ)
        // Первая - от YooKassa
        await supabaseAdmin.from('payments').insert({
            client_id: userId,
            rental_id: newRental.id,
            amount_rub: cardPaymentAmount, // 3000
            status: 'succeeded',
            payment_type: 'initial_card_part', // Более точный тип
            yookassa_payment_id: yookassaPaymentId
        });

        // Вторая - с внутреннего баланса
        if (amountToDebit > 0) {
            await supabaseAdmin.from('payments').insert({
                client_id: userId,
                rental_id: newRental.id,
                amount_rub: amountToDebit, // 750
                status: 'succeeded',
                payment_type: 'initial_balance_part', // Более точный тип
                description: 'Частичная оплата аренды с баланса'
            });
        }

        console.log(`[АРЕНДА-ГИБРИД] Аренда #${newRental.id} успешно создана.`);
        return; // Завершаем после обработки аренды
    }

    // --- Логика для бронирования (если есть payment_type === 'booking') ---
    if (payment_type === 'booking') {
        console.log(`[БРОНИРОВАНИЕ] userId: ${userId}, сумма: ${paymentAmount}`);

        // 1. Создаем бронь на 2 часа
        const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

        const { data: newBooking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                user_id: userId,
                expires_at: expires_at,
                status: 'active',
                cost_rub: paymentAmount
            })
            .select('id')
            .single();

        if (bookingError) {
            // Если бронь создать не удалось, это критично. Выбрасываем ошибку.
            throw new Error(`Не удалось создать бронь: ${bookingError.message}`);
        }
        console.log(`[БРОНИРОВАНИЕ] Создана бронь #${newBooking.id} до ${expires_at}.`);

        // +++ ВАЖНЕЙШЕЕ ИЗМЕНЕНИЕ: ПОПОЛНЯЕМ БАЛАНС ПОЛЬЗОВАТЕЛЯ +++
        console.log(`[БАЛАНС] Пополняем баланс для userId: ${userId} на сумму ${paymentAmount} ₽`);
        const { error: balanceError } = await supabaseAdmin.rpc('add_to_balance', {
            client_id_to_update: userId,
            amount_to_add: paymentAmount
        });

        if (balanceError) {
            // Это плохо, но не критично для YooKassa. Бронь создана. Логируем ошибку для ручного разбора.
            console.error(`[КРИТИЧЕСКАЯ ОШИБКА] Бронь #${newBooking.id} создана, но не удалось пополнить баланс для userId ${userId}:`, balanceError.message);
        } else {
            console.log(`[БАЛАНС] Баланс для userId: ${userId} успешно пополнен.`);
        }

        // 2. Записываем платеж в историю, как и раньше
        const { error: paymentError } = await supabaseAdmin.from('payments').insert({
            client_id: userId,
            booking_id: newBooking.id, // Связываем с бронью
            amount_rub: paymentAmount,
            status: 'succeeded',
            payment_type: 'booking',
            yookassa_payment_id: yookassaPaymentId,
            description: 'Оплата бронирования + пополнение баланса'
        });

        if (paymentError) {
            // Тоже логируем, но не останавливаем процесс
            console.error(`[ОШИБКА ЛОГА] Не удалось записать платеж бронирования: ${paymentError.message}`);
        }

        console.log(`[БРОНИРОВАНИЕ] Платеж ${yookassaPaymentId} успешно обработан и связан с бронью #${newBooking.id}.`);

        return; // Завершаем, так как это был целевой платеж за бронь
    }

    // --- Логика для стандартных пополнений (если это не аренда и не привязка карты) ---
    console.log(`Платеж ${yookassaPaymentId} обрабатывается как пополнение баланса.`);
    if (!userId) {
        console.warn('Webhook lacked userId metadata; skipping balance update.');
        return;
    }

    const { error: balanceError } = await supabaseAdmin.rpc('add_to_balance', {
        client_id_to_update: userId,
        amount_to_add: paymentAmount
    });

    if (balanceError) console.error(`Failed to credit balance for client ${userId}:`, balanceError.message);

    await supabaseAdmin.from('payments').insert({
        client_id: userId,
        amount_rub: paymentAmount,
        status: 'succeeded',
        payment_type: 'top-up',
        yookassa_payment_id: yookassaPaymentId
    });
}
async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const notification = parseRequestBody(req.body);

        if (notification.event !== 'payment.succeeded' || notification.object?.status !== 'succeeded') {
            res.status(200).send('OK. Event ignored.');
            return;
        }

        await processSucceededPayment(notification);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;
module.exports.default = handler;
