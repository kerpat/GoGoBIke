
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
    console.log('--- НАЧАЛО ОБРАБОТКИ УСПЕШНОГО ПЛАТЕЖА ---');
    const payment = notification.object;
    const metadata = payment.metadata || {};

    // Достаем все возможные метаданные
    const { userId, tariffId, payment_type, debit_from_balance, rentalId, days } = metadata;
    const cardPaymentAmount = Number.parseFloat(payment.amount?.value ?? '0');
    const yookassaPaymentId = payment.id;
    const supabaseAdmin = createSupabaseAdmin();

    // Сохранение способа оплаты (если он новый)
    if (payment.payment_method?.saved && userId) {
        console.log(`[СОХРАНЕНИЕ МЕТОДА] для userId: ${userId}`);
        const paymentDetailsToSave = {
            payment_method_details: {
                type: payment.payment_method.type,
                title: payment.payment_method.title,
                card: payment.payment_method.card
            }
        };
        await supabaseAdmin.from('clients').update({
            yookassa_payment_method_id: payment.payment_method.id,
            autopay_enabled: true,
            extra: paymentDetailsToSave
        }).eq('id', userId);
    }

    if (payment_type === 'save_card') {
        console.log('[ЗАВЕРШЕНО] Платеж для привязки карты.');
        return;
    }

    // --- НАЧАЛО ИСПРАВЛЕНИЯ: ДОБАВЛЕН БЛОК ДЛЯ ПРОДЛЕНИЯ АРЕНДЫ ---
    if (payment_type === 'renewal') {
        console.log(`[ПРОДЛЕНИЕ] Обработка для userId: ${userId}, rentalId: ${rentalId}`);
        if (!rentalId || !days) {
            throw new Error(`Webhook: продление не удалось, отсутствуют rentalId или days в метаданных.`);
        }

        const amountToDebit = Number.parseFloat(debit_from_balance) || 0;

        // 1. Списываем с баланса, если была частичная оплата
        if (amountToDebit > 0) {
            console.log(`[ПРОДЛЕНИЕ] Списываем с баланса ${amountToDebit} ₽`);
            const { error } = await supabaseAdmin.rpc('add_to_balance', { client_id_to_update: userId, amount_to_add: -amountToDebit });
            if (error) {
                console.error(`[КРИТИКАЛ] НЕ УДАЛОСЬ СПИСАТЬ С БАЛАНСА ПРИ ПРОДЛЕНИИ для ${userId}:`, error.message);
                throw new Error('Failed to debit from balance during renewal.');
            }
        }

        // 2. Получаем текущую аренду для вычисления новой даты окончания
        const { data: currentRental, error: rentalError } = await supabaseAdmin
            .from('rentals')
            .select('current_period_ends_at, total_paid_rub')
            .eq('id', rentalId)
            .single();

        if (rentalError || !currentRental) {
            throw new Error(`Webhook: Не найдена аренда #${rentalId} для продления.`);
        }

        // 3. Вычисляем новую дату окончания и общую оплаченную сумму
        const newEndDate = new Date(currentRental.current_period_ends_at);
        newEndDate.setDate(newEndDate.getDate() + parseInt(days, 10));
        const totalPaid = (currentRental.total_paid_rub || 0) + cardPaymentAmount + amountToDebit;

        // 4. Обновляем аренду в базе данных
        const { error: updateError } = await supabaseAdmin
            .from('rentals')
            .update({
                current_period_ends_at: newEndDate.toISOString(),
                total_paid_rub: totalPaid,
                status: 'active' // Устанавливаем статус 'active', если он был 'overdue'
            })
            .eq('id', rentalId);

        if (updateError) {
            throw new Error(`Webhook: Не удалось обновить аренду #${rentalId}. Ошибка: ${updateError.message}`);
        }

        // 5. Логируем платежи
        await supabaseAdmin.from('payments').insert({
            client_id: userId, rental_id: rentalId, amount_rub: cardPaymentAmount,
            status: 'succeeded', payment_type: 'renewal_card_part', yookassa_payment_id: yookassaPaymentId
        });
        if (amountToDebit > 0) {
            await supabaseAdmin.from('payments').insert({
                client_id: userId, rental_id: rentalId, amount_rub: amountToDebit,
                status: 'succeeded', payment_type: 'renewal_balance_part', description: 'Частичная оплата продления с баланса'
            });
        }

        console.log(`[ПРОДЛЕНИЕ] Успешно продлена аренда #${rentalId}`);
        return; // Важно: завершаем выполнение здесь
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---


    if (tariffId) { // Логика для НАЧАЛА новой аренды
        console.log(`[АРЕНДА] Обработка для userId: ${userId}`);
        // ... (ваш существующий код для создания аренды остается без изменений) ...
        const amountToDebit = Number.parseFloat(debit_from_balance) || 0;
        if (amountToDebit > 0) {
            console.log(`[АРЕНДА] Списываем с баланса ${amountToDebit} ₽`);
            const { error } = await supabaseAdmin.rpc('add_to_balance', { client_id_to_update: userId, amount_to_add: -amountToDebit });
            if (error) { throw new Error('Failed to debit from balance.'); }
        }

        const { data: availableBikes, error: bikesError } = await supabaseAdmin.from('bikes').select('id').eq('status', 'available').eq('tariff_id', tariffId);
        if (bikesError || !availableBikes || availableBikes.length === 0) { throw new Error(`Нет свободных велосипедов для тарифа ${tariffId}.`); }
        const bikeId = availableBikes[0].id;
        await supabaseAdmin.from('bikes').update({ status: 'rented' }).eq('id', bikeId);
        const { data: tariffData } = await supabaseAdmin.from('tariffs').select('duration_days').eq('id', tariffId).single();
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (tariffData?.duration_days || 7));
        const totalPaid = cardPaymentAmount + amountToDebit;
        const { data: newRental } = await supabaseAdmin.from('rentals').insert({ user_id: userId, bike_id: bikeId, tariff_id: tariffId, starts_at: startDate.toISOString(), current_period_ends_at: endDate.toISOString(), status: 'awaiting_battery_assignment', total_paid_rub: totalPaid }).select('id').single();

        await supabaseAdmin.from('payments').insert({ client_id: userId, rental_id: newRental.id, amount_rub: cardPaymentAmount, status: 'succeeded', payment_type: 'initial_card_part', yookassa_payment_id: yookassaPaymentId });
        if (amountToDebit > 0) {
            await supabaseAdmin.from('payments').insert({ client_id: userId, rental_id: newRental.id, amount_rub: amountToDebit, status: 'succeeded', payment_type: 'initial_balance_part', description: 'Частичная оплата с баланса' });
        }

        console.log(`[АРЕНДА] Успешно создана аренда #${newRental.id}`);
        return;
    }

    if (payment_type === 'booking') { // Логика для бронирования
        console.log(`[БРОНЬ] Обработка для userId: ${userId}`);
        // ... (ваш существующий код для бронирования остается без изменений) ...
        const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const { data: newBooking } = await supabaseAdmin.from('bookings').insert({ user_id: userId, expires_at: expires_at, status: 'active', cost_rub: cardPaymentAmount }).select('id').single();

        console.log(`[БРОНЬ -> БАЛАНС] Пополняем баланс на ${cardPaymentAmount} ₽`);
        await supabaseAdmin.rpc('add_to_balance', { client_id_to_update: userId, amount_to_add: cardPaymentAmount });

        await supabaseAdmin.from('payments').insert({ client_id: userId, booking_id: newBooking.id, amount_rub: cardPaymentAmount, status: 'succeeded', payment_type: 'booking', yookassa_payment_id: yookassaPaymentId });
        console.log(`[БРОНЬ] Успешно создана бронь #${newBooking.id}`);
        return;
    }

    // --- ОБЫЧНОЕ ПОПОЛНЕНИЕ БАЛАНСА ---
    console.log(`[ПОПОЛНЕНИЕ] Обработка для userId: ${userId} на сумму ${cardPaymentAmount} ₽`);
    if (!userId) {
        console.warn('Webhook: userId не найден, пополнение пропускается.');
        return;
    }

    const { error: balanceError } = await supabaseAdmin.rpc('add_to_balance', {
        client_id_to_update: userId,
        amount_to_add: cardPaymentAmount
    });

    if (balanceError) {
        console.error(`[КРИТИКАЛ] НЕ УДАЛОСЬ ПОПОЛНИТЬ БАЛАНС для ${userId}:`, balanceError.message);
        throw new Error(`Failed to credit balance for client ${userId}`);
    }

    await supabaseAdmin.from('payments').insert({
        client_id: userId, amount_rub: cardPaymentAmount,
        status: 'succeeded', payment_type: 'top-up', yookassa_payment_id: yookassaPaymentId
    });

    console.log(`[ПОПОЛНЕНИЕ] Баланс для userId ${userId} успешно пополнен.`);
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
