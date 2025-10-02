
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

function getPaymentMethodFromYookassa(paymentObject) {
    const methodType = paymentObject.payment_method?.type;
    
    switch(methodType) {
        case 'bank_card':
            return 'card';
        case 'sbp':
            return 'sbp';
        case 'yoo_money':
            return 'yoo_money';
        default:
            return 'card'; // По умолчанию
    }
}

async function processSucceededPayment(notification) {
    console.log('--- НАЧАЛО ОБРАБОТКИ УСПЕШНОГО ПЛАТЕЖА (v_final) ---');
    const payment = notification.object;
    const metadata = payment.metadata || {};

    const { userId, tariffId, payment_type, debit_from_balance } = metadata;
    const cardPaymentAmount = Number.parseFloat(payment.amount?.value ?? '0');
    const yookassaPaymentId = payment.id;
    const supabaseAdmin = createSupabaseAdmin();

    // Сохраняем метод оплаты, если он есть и userId указан
    if (payment.payment_method?.id && userId) {
        console.log(`[СОХРАНЕНИЕ МЕТОДА] для userId: ${userId}, method_id: ${payment.payment_method.id}`);
        await supabaseAdmin.from('clients').update({ 
            yookassa_payment_method_id: payment.payment_method.id, 
            autopay_enabled: true 
        }).eq('id', userId);
    }

    if (payment_type === 'save_card') {
        console.log('[ЗАВЕРШЕНИЕ] Платеж для привязки карты.');
        return;
    }

    if (tariffId) {
        console.log(`[АРЕНДА] Обработка для userId: ${userId}`);
        const amountToDebit = Number.parseFloat(debit_from_balance) || 0;
        if (amountToDebit > 0) {
            console.log(`[АРЕНДА] Списываем с баланса ${amountToDebit} ₽`);
            const { error } = await supabaseAdmin.rpc('add_to_balance', { client_id_to_update: userId, amount_to_add: -amountToDebit });
            if (error) { /* ... логика возврата ... */ throw new Error('Failed to debit from balance.'); }
        }

        // Твоя логика создания аренды (скопирована из твоего старого файла)
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

        // Определяем способ оплаты из данных ЮKassa
        const paymentMethod = getPaymentMethodFromYookassa(payment);
        
        // Запись платежа с карты/СБП
        await supabaseAdmin.from('payments').insert({ 
            client_id: userId, 
            rental_id: newRental.id, 
            amount_rub: cardPaymentAmount, 
            status: 'succeeded', 
            payment_type: 'rental',
            method: paymentMethod,
            yookassa_payment_id: yookassaPaymentId 
        });
        
        // Запись платежа с баланса (если было списание)
        if (amountToDebit > 0) {
            await supabaseAdmin.from('payments').insert({ 
                client_id: userId, 
                rental_id: newRental.id, 
                amount_rub: amountToDebit, 
                status: 'succeeded', 
                payment_type: 'rental',
                method: 'balance',
                description: 'Частичная оплата с баланса' 
            });
        }

        console.log(`[АРЕНДА] Успешно создана аренда #${newRental.id}`);
        return;
    }

    if (payment_type === 'booking') {
        console.log(`[БРОНЬ] Обработка для userId: ${userId}`);
        const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const { data: newBooking } = await supabaseAdmin.from('bookings').insert({ user_id: userId, expires_at: expires_at, status: 'active', cost_rub: cardPaymentAmount }).select('id').single();

        console.log(`[БРОНЬ -> БАЛАНС] Пополняем баланс на ${cardPaymentAmount} ₽`);
        await supabaseAdmin.rpc('add_to_balance', { client_id_to_update: userId, amount_to_add: cardPaymentAmount });

        // Определяем способ оплаты из данных ЮKassa
        const paymentMethod = getPaymentMethodFromYookassa(payment);
        
        await supabaseAdmin.from('payments').insert({ 
            client_id: userId, 
            booking_id: newBooking.id, 
            amount_rub: cardPaymentAmount, 
            status: 'succeeded', 
            payment_type: 'booking',
            method: paymentMethod,
            yookassa_payment_id: yookassaPaymentId 
        });
        console.log(`[БРОНЬ] Успешно создана бронь #${newBooking.id}`);
        return;
    }

    // --- ОБЫЧНОЕ ПОПОЛНЕНИЕ БАЛАНСА (из твоего рабочего файла) ---
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

    // Определяем способ оплаты из данных ЮKassa
    const paymentMethod = getPaymentMethodFromYookassa(payment);

    await supabaseAdmin.from('payments').insert({
        client_id: userId,
        amount_rub: cardPaymentAmount,
        status: 'succeeded',
        payment_type: 'top-up',
        method: paymentMethod,
        yookassa_payment_id: yookassaPaymentId
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
