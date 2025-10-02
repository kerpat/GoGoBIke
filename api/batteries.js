// api/batteries.js (Полная и правильная версия)

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware для проверки токена
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Ошибка верификации токена' });
  }
};

// --- Маршруты для работы с аккумуляторами ---

// GET /api/batteries - Получить все аккумуляторы
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('batteries')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({ batteries: data });
  } catch (err) {
    console.error('Ошибка получения аккумуляторов:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batteries - Создать новый аккумулятор
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, power, description } = req.body;

    // --- ВОТ ВАЛИДАЦИЯ, КОТОРАЯ СЕЙЧАС СРАБАТЫВАЕТ ПО ОШИБКЕ ---
    if (!name || !power) {
      return res.status(400).json({ error: 'Name and power are required' });
    }
    // --- КОНЕЦ ВАЛИДАЦИИ ---

    const { data, error } = await supabase
      .from('batteries')
      .insert([{ name, power, description }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ battery: data });
  } catch (err) {
    console.error('Ошибка создания аккумулятора:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/batteries/:id - Обновить существующий аккумулятор
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, power, description } = req.body;

    if (!name || !power) {
      return res.status(400).json({ error: 'Name and power are required' });
    }

    const { data, error } = await supabase
      .from('batteries')
      .update({ name, power, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ battery: data });
  } catch (err) {
    console.error('Ошибка обновления аккумулятора:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/batteries/:id - Удалить аккумулятор
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('batteries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Аккумулятор успешно удален' });
  } catch (err) {
    console.error('Ошибка удаления аккумулятора:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;