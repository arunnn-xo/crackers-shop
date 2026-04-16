const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/banners
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/banners
router.post('/', auth, upload.handleErrors('image'), async (req, res) => {
  try {
    const { name, link, sort_order, is_active } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Banner name is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Banner image is required.' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO banners (name, image, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), image, link?.trim() || null, Number(sort_order) || 0, Number(is_active ?? 1)]
    );
    res.status(201).json({ success: true, message: 'Banner created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/banners/:id
router.put('/:id', auth, upload.handleErrors('image'), async (req, res) => {
  try {
    const { name, link, sort_order, is_active } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Banner name is required.' });
    }

    let query = 'UPDATE banners SET name=?, link=?, sort_order=?, is_active=?';
    const params = [name.trim(), link?.trim() || null, Number(sort_order) || 0, Number(is_active ?? 1)];

    if (req.file) {
      query += ', image=?';
      params.push(`/uploads/${req.file.filename}`);
    }

    query += ' WHERE id=?';
    params.push(req.params.id);

    await pool.query(query, params);
    res.json({ success: true, message: 'Banner updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/banners/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
