const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Handle all battery actions
router.post('/', verifyToken, async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'get-batteries') {
      const { data, error } = await supabase
        .from('batteries')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      res.json({ batteries: data });
    } else if (action === 'create-battery') {
      const { name, power, description } = req.body;

      const { data, error } = await supabase
        .from('batteries')
        .insert([{ name, power, description }])
        .select()
        .single();

      if (error) throw error;

      res.json({ battery: data });
    } else if (action === 'update-battery') {
      const { id, name, power, description } = req.body;

      const { data, error } = await supabase
        .from('batteries')
        .update({ name, power, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ battery: data });
    } else if (action === 'delete-battery') {
      const { id } = req.body;

      const { error } = await supabase
        .from('batteries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Battery deleted successfully' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Error in batteries API:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create battery
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { name, power, description } = req.body;

    const { data, error } = await supabase
      .from('batteries')
      .insert([{ name, power, description }])
      .select()
      .single();

    if (error) throw error;

    res.json({ battery: data });
  } catch (err) {
    console.error('Error creating battery:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update battery
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, power, description } = req.body;

    const { data, error } = await supabase
      .from('batteries')
      .update({ name, power, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ battery: data });
  } catch (err) {
    console.error('Error updating battery:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete battery
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('batteries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Battery deleted successfully' });
  } catch (err) {
    console.error('Error deleting battery:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;