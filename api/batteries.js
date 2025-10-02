const { createClient } = require('@supabase/supabase-js');

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
            console.error('Failed to parse request body:', err);
            return {};
        }
    }
    return body;
}

async function handleGetBatteries() {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('batteries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch batteries: ' + error.message);
    }

    return { status: 200, body: { batteries: data } };
}

async function handleCreateBattery({ name, power, description }) {
    if (!name) {
        return { status: 400, body: { error: 'Name is required.' } };
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('batteries')
        .insert([{ name, power, description }])
        .select()
        .single();

    if (error) {
        throw new Error('Failed to create battery: ' + error.message);
    }

    return { status: 201, body: { battery: data } };
}

async function handleUpdateBattery({ id, name, power, description }) {
    if (!id) {
        return { status: 400, body: { error: 'ID is required.' } };
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('batteries')
        .update({ name, power, description, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error('Failed to update battery: ' + error.message);
    }

    return { status: 200, body: { battery: data } };
}

async function handleDeleteBattery({ id }) {
    if (!id) {
        return { status: 400, body: { error: 'ID is required.' } };
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('batteries')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error('Failed to delete battery: ' + error.message);
    }

    return { status: 200, body: { message: 'Battery deleted successfully.' } };
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const body = parseRequestBody(req.body);
        const { action } = body;

        let result;
        switch (action) {
            case 'get-batteries':
                result = await handleGetBatteries();
                break;
            case 'create-battery':
                result = await handleCreateBattery(body);
                break;
            case 'update-battery':
                result = await handleUpdateBattery(body);
                break;
            case 'delete-battery':
                result = await handleDeleteBattery(body);
                break;
            default:
                result = { status: 400, body: { error: 'Invalid action' } };
        }

        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Batteries handler error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;
module.exports.default = handler;