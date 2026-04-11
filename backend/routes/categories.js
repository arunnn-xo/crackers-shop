const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/categories — List all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/categories/:id — Get single category
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/categories — Create category
router.post('/', auth, async (req, res) => {
  try {
    const { data_id, name, image, sort_order } = req.body;
    const [result] = await pool.query(
      'INSERT INTO categories (data_id, name, image, sort_order) VALUES (?, ?, ?, ?)',
      [data_id, name, image || null, sort_order || 0]
    );
    res.status(201).json({ success: true, message: 'Category created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id — Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const { data_id, name, image, sort_order, is_active } = req.body;
    await pool.query(
      'UPDATE categories SET data_id = ?, name = ?, image = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [data_id, name, image, sort_order, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/categories/:id — Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
