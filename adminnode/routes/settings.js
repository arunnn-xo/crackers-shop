const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

const storeConfigUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  req.uploadSubDir = 'settings';
  return upload.handleErrors('off_banner_image')(req, res, next);
};

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
router.put('/store', auth, storeConfigUpload, async (req, res) => {
  try {
    const { is_store_open, min_order_value, global_discount } = req.body;
    const normalizedStoreOpen = Number(is_store_open ?? 1);
    const normalizedMinOrderValue = Number(min_order_value ?? 0);
    const normalizedGlobalDiscount = Number(global_discount ?? 0);

    if (![0, 1].includes(normalizedStoreOpen)) {
      return res.status(400).json({ success: false, message: 'Store status must be 0 or 1.' });
    }

    if (!Number.isFinite(normalizedMinOrderValue) || normalizedMinOrderValue < 0) {
      return res.status(400).json({ success: false, message: 'Minimum order value must be a valid non-negative number.' });
    }

    if (!Number.isFinite(normalizedGlobalDiscount) || normalizedGlobalDiscount < 0 || normalizedGlobalDiscount > 100) {
      return res.status(400).json({ success: false, message: 'Global discount must be between 0 and 100.' });
    }

    const [existingRows] = await pool.query('SELECT off_banner_image FROM store_config WHERE id = 1 LIMIT 1');
    const offBannerImage = req.file
      ? `/uploads/settings/${req.file.filename}`
      : existingRows[0]?.off_banner_image || null;

    await pool.query(
      `INSERT INTO store_config (id, is_store_open, min_order_value, global_discount, off_banner_image)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_store_open = VALUES(is_store_open),
         min_order_value = VALUES(min_order_value),
         global_discount = VALUES(global_discount),
         off_banner_image = VALUES(off_banner_image)`,
      [normalizedStoreOpen, normalizedMinOrderValue, normalizedGlobalDiscount, offBannerImage]
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
    const [rows] = await pool.query(`
      SELECT os.*,
             (
               SELECT COUNT(*)
               FROM orders o
               WHERE o.status = os.name
             ) AS usage_count
      FROM order_statuses os
      ORDER BY os.sort_order ASC, os.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/settings/order-statuses
router.post('/order-statuses', auth, async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const color = req.body.color?.trim() || '#64748b';
    const requestedSortOrder = Number(req.body.sort_order ?? 0);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Status name is required.' });
    }

    const [[{ nextSortOrder }]] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSortOrder FROM order_statuses'
    );
    const sort_order = Number.isFinite(requestedSortOrder) && requestedSortOrder > 0 ? requestedSortOrder : nextSortOrder;

    const [result] = await pool.query(
      'INSERT INTO order_statuses (name, color, sort_order) VALUES (?, ?, ?)',
      [name, color, sort_order]
    );
    res.status(201).json({ success: true, message: 'Status created', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Status name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings/order-statuses/reorder
router.put('/order-statuses/reorder', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const statuses = Array.isArray(req.body.statuses) ? req.body.statuses : [];

    if (statuses.length === 0) {
      return res.status(400).json({ success: false, message: 'Statuses are required for reorder.' });
    }

    const ids = statuses.map((status) => Number(status.id)).filter(Boolean);
    if (ids.length !== statuses.length) {
      return res.status(400).json({ success: false, message: 'Invalid status ids provided.' });
    }

    const [existingRows] = await connection.query('SELECT id FROM order_statuses');
    if (existingRows.length !== statuses.length) {
      return res.status(400).json({ success: false, message: 'Reorder payload must include all existing statuses.' });
    }

    const existingIds = new Set(existingRows.map((row) => Number(row.id)));
    const hasUnknownIds = ids.some((id) => !existingIds.has(id));
    if (hasUnknownIds) {
      return res.status(400).json({ success: false, message: 'One or more statuses do not exist.' });
    }

    await connection.beginTransaction();

    for (let index = 0; index < statuses.length; index += 1) {
      await connection.query('UPDATE order_statuses SET sort_order = ? WHERE id = ?', [index + 1, ids[index]]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Status order updated.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/settings/order-statuses/:id
router.put('/order-statuses/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const name = req.body.name?.trim();
    const color = req.body.color?.trim() || '#64748b';
    const sort_order = Number(req.body.sort_order ?? 0);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Status name is required.' });
    }

    const [rows] = await connection.query('SELECT * FROM order_statuses WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Status not found.' });
    }

    const currentStatus = rows[0];

    await connection.beginTransaction();

    const [result] = await connection.query(
      'UPDATE order_statuses SET name = ?, color = ?, sort_order = ? WHERE id = ?',
      [name, color, Number.isFinite(sort_order) ? sort_order : 0, req.params.id]
    );

    if (currentStatus.name !== name) {
      await connection.query('UPDATE orders SET status = ? WHERE status = ?', [name, currentStatus.name]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Status updated.' });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Status name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// DELETE /api/settings/order-statuses/:id
router.delete('/order-statuses/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM order_statuses WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Status not found.' });
    }

    const statusName = rows[0].name;
    const [[{ usageCount }]] = await pool.query('SELECT COUNT(*) AS usageCount FROM orders WHERE status = ?', [statusName]);
    if (Number(usageCount) > 0) {
      return res.status(400).json({ success: false, message: 'This status is already used by existing orders and cannot be deleted.' });
    }

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
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'State name is required.' });
    }

    const [result] = await pool.query('INSERT INTO states (name) VALUES (?)', [name]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/states/:id', auth, async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'State name is required.' });
    }

    const [result] = await pool.query('UPDATE states SET name = ? WHERE id = ?', [name, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'State not found.' });
    }

    res.json({ success: true, message: 'State updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/states/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM states WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'State not found.' });
    }

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
    if (!state_id) {
      return res.status(400).json({ success: false, message: 'State is required.' });
    }

    const cityName = name?.trim();
    if (!cityName) {
      return res.status(400).json({ success: false, message: 'City name is required.' });
    }

    const [result] = await pool.query('INSERT INTO cities (state_id, name, code) VALUES (?, ?, ?)', [state_id, cityName, code?.trim() || null]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cities/:id', auth, async (req, res) => {
  try {
    const { state_id, name, code } = req.body;
    if (!state_id) {
      return res.status(400).json({ success: false, message: 'State is required.' });
    }

    const cityName = name?.trim();
    if (!cityName) {
      return res.status(400).json({ success: false, message: 'City name is required.' });
    }

    const [result] = await pool.query(
      'UPDATE cities SET state_id = ?, name = ?, code = ? WHERE id = ?',
      [state_id, cityName, code?.trim() || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'City not found.' });
    }

    res.json({ success: true, message: 'City updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cities/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM cities WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'City not found.' });
    }

    res.json({ success: true, message: 'City deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Areas
router.get('/areas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, c.name as city_name, c.state_id, s.name as state_name FROM areas a LEFT JOIN cities c ON a.city_id = c.id LEFT JOIN states s ON c.state_id = s.id ORDER BY a.name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/areas', auth, async (req, res) => {
  try {
    const { city_id, name, pincode } = req.body;
    if (!city_id) {
      return res.status(400).json({ success: false, message: 'City is required.' });
    }

    const areaName = name?.trim();
    if (!areaName) {
      return res.status(400).json({ success: false, message: 'Area name is required.' });
    }

    const [result] = await pool.query('INSERT INTO areas (city_id, name, pincode) VALUES (?, ?, ?)', [city_id, areaName, pincode?.trim() || null]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/areas/:id', auth, async (req, res) => {
  try {
    const { city_id, name, pincode } = req.body;
    if (!city_id) {
      return res.status(400).json({ success: false, message: 'City is required.' });
    }

    const areaName = name?.trim();
    if (!areaName) {
      return res.status(400).json({ success: false, message: 'Area name is required.' });
    }

    const [result] = await pool.query(
      'UPDATE areas SET city_id = ?, name = ?, pincode = ? WHERE id = ?',
      [city_id, areaName, pincode?.trim() || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Area not found.' });
    }

    res.json({ success: true, message: 'Area updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/areas/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM areas WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Area not found.' });
    }

    res.json({ success: true, message: 'Area deleted' });
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
