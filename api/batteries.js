const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createSupabaseAdmin = createClient(supabaseUrl, supabaseKey);

const verifyToken = async (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid token');
    }

    return user;
  } catch (err) {
    throw new Error('Token verification failed');
  }
};

const parseRequestBody = (body) => {
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
};

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await verifyToken(req);

    const { method } = req;
    const body = parseRequestBody(req.body);

    if (method === 'GET') {
      // GET /api/batteries - Получить все аккумуляторы
      const { data, error } = await supabase
        .from('batteries')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      res.status(200).json({ batteries: data });
    } else if (method === 'POST') {
      // POST /api/batteries - Создать новый аккумулятор
      const { name, power, description } = body;

      if (!name || !power) {
        return res.status(400).json({ error: 'Name and power are required' });
      }

      const { data, error } = await supabase
        .from('batteries')
        .insert([{ name, power, description }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ battery: data });
    } else if (method === 'PUT') {
      // PUT /api/batteries/:id - Обновить аккумулятор
      const { id } = req.query;
      const { name, power, description } = body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const { data, error } = await supabase
        .from('batteries')
        .update({ name, power, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ battery: data });
    } else if (method === 'DELETE') {
      // DELETE /api/batteries/:id - Удалить аккумулятор
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const { error } = await supabase
        .from('batteries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({ message: 'Battery deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Error in batteries API:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = handler;
module.exports.default = handler;