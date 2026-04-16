const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

const generateCategoryCode = async () => {
  const [[row]] = await pool.query(`
    SELECT data_id
    FROM categories
    WHERE data_id REGEXP '^CAT-[0-9]+$'
    ORDER BY CAST(SUBSTRING_INDEX(data_id, '-', -1) AS UNSIGNED) DESC
    LIMIT 1
  `);

  const lastNumber = row?.data_id ? Number(row.data_id.split('-').pop()) : 0;
  return `CAT-${String(lastNumber + 1).padStart(3, '0')}`;
};

// GET /api/categories — List all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, id DESC');
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
    const name = req.body.name?.trim();
    const data_id = req.body.data_id?.trim() || await generateCategoryCode();
    const image = req.body.image?.trim() || null;
    const sort_order = Number(req.body.sort_order) || 0;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (data_id, name, image, sort_order) VALUES (?, ?, ?, ?)',
      [data_id, name, image, sort_order]
    );
    res.status(201).json({
      success: true,
      message: 'Category created',
      id: result.insertId,
      data: { id: result.insertId, data_id, name, image, sort_order, is_active: 1 },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category Data ID already exists.' });
    }

    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id — Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const data_id = req.body.data_id?.trim();
    const name = req.body.name?.trim();
    const image = req.body.image?.trim() || null;
    const sort_order = Number(req.body.sort_order) || 0;
    const is_active = Number(req.body.is_active ?? 1);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    if (!data_id) {
      return res.status(400).json({ success: false, message: 'Category Data ID is required.' });
    }

    await pool.query(
      'UPDATE categories SET data_id = ?, name = ?, image = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [data_id, name, image, sort_order, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category Data ID already exists.' });
    }

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
