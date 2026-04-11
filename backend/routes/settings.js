const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// ==========================================
// SETTINGS (key-value store)
// ==========================================

// GET /api/settings — Get all settings or by group
router.get('/', async (req, res) => {
  try {
    const { group } = req.query;
    let query = 'SELECT * FROM settings';
    const params = [];
    if (group) {
      query += ' WHERE setting_group = ?';
      params.push(group);
    }
    const [rows] = await pool.query(query, params);
    
    // Convert to object for easier frontend consumption
    const settingsMap = {};
    rows.forEach(row => { settingsMap[row.setting_key] = row.setting_value; });
    
    res.json({ success: true, data: settingsMap, raw: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings — Bulk update settings
router.put('/', auth, async (req, res) => {
  try {
    const settings = req.body; // { key: value, key: value, ... }
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// STORE CONFIG (on/off, min order, discount)
// ==========================================

// GET /api/settings/store
router.get('/store', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM store_config LIMIT 1');
    res.json({ success: true, data: rows[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings/store
router.put('/store', auth, async (req, res) => {
  try {
    const { is_store_open, min_order_value, global_discount } = req.body;
    await pool.query(
      'UPDATE store_config SET is_store_open=?, min_order_value=?, global_discount=? WHERE id=1',
      [is_store_open, min_order_value, global_discount]
    );
    res.json({ success: true, message: 'Store config updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ORDER STATUSES
// ==========================================

// GET /api/settings/order-statuses
router.get('/order-statuses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM order_statuses ORDER BY sort_order ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/settings/order-statuses
router.post('/order-statuses', auth, async (req, res) => {
  try {
    const { name, color, sort_order } = req.body;
    const [result] = await pool.query(
      'INSERT INTO order_statuses (name, color, sort_order) VALUES (?, ?, ?)',
      [name, color || '#64748b', sort_order || 0]
    );
    res.status(201).json({ success: true, message: 'Status created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/settings/order-statuses/:id
router.delete('/order-statuses/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM order_statuses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Status deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// GEOGRAPHY (States, Cities, Areas)
// ==========================================

// States
router.get('/states', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM states ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/states', auth, async (req, res) => {
  try {
    const [result] = await pool.query('INSERT INTO states (name) VALUES (?)', [req.body.name]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/states/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM states WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'State deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cities
router.get('/cities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT c.*, s.name as state_name FROM cities c LEFT JOIN states s ON c.state_id = s.id ORDER BY c.name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/cities', auth, async (req, res) => {
  try {
    const { state_id, name, code } = req.body;
    const [result] = await pool.query('INSERT INTO cities (state_id, name, code) VALUES (?, ?, ?)', [state_id, name, code]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Areas
router.get('/areas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT a.*, c.name as city_name FROM areas a LEFT JOIN cities c ON a.city_id = c.id ORDER BY a.name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/areas', auth, async (req, res) => {
  try {
    const { city_id, name, pincode } = req.body;
    const [result] = await pool.query('INSERT INTO areas (city_id, name, pincode) VALUES (?, ?, ?)', [city_id, name, pincode]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// SEO, BLOGS, BRANDS, ENQUIRIES
// ==========================================

// SEO Headings
router.get('/seo-headings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seo_headings');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seo-headings', auth, async (req, res) => {
  try {
    const { page_name, heading } = req.body;
    const [result] = await pool.query('INSERT INTO seo_headings (page_name, heading) VALUES (?, ?)', [page_name, heading]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SEO Details
router.get('/seo-details', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seo_details');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seo-details', auth, async (req, res) => {
  try {
    const { page_name, meta_title, meta_description, meta_keywords } = req.body;
    const [result] = await pool.query(
      'INSERT INTO seo_details (page_name, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?)',
      [page_name, meta_title, meta_description, meta_keywords]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Blogs
router.get('/blogs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/blogs', auth, async (req, res) => {
  try {
    const { title, slug, meta_title, meta_description, content, is_published } = req.body;
    const [result] = await pool.query(
      'INSERT INTO blogs (title, slug, meta_title, meta_description, content, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, meta_title, meta_description, content, is_published || 0, is_published ? new Date() : null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Brands
router.get('/brands', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY sort_order ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/brands', auth, async (req, res) => {
  try {
    const { name, logo, sort_order } = req.body;
    const [result] = await pool.query('INSERT INTO brands (name, logo, sort_order) VALUES (?, ?, ?)', [name, logo, sort_order || 0]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries
router.get('/enquiries', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/enquiries', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const [result] = await pool.query(
      'INSERT INTO enquiries (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone, message]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
