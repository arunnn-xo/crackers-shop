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

const globalSettingsUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  req.uploadSubDir = 'settings';
  return upload.handleFieldsErrors([
    { name: 'main_logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ])(req, res, next);
};

const brandLogoUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  req.uploadSubDir = 'brands';
  return upload.handleErrors('logo')(req, res, next);
};

const seoDetailsUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  req.uploadSubDir = 'seo';
  return upload.handleErrors('image')(req, res, next);
};

const blogImageUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  req.uploadSubDir = 'blogs';
  return upload.handleErrors('image')(req, res, next);
};

const slugifyBlogName = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const getUniqueBlogSlug = async (blogName, excludeId = null) => {
  const baseSlug = slugifyBlogName(blogName) || `blog-${Date.now()}`;
  let slugCandidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = 'SELECT id FROM blogs WHERE slug = ?';
    const params = [slugCandidate];

    if (excludeId != null) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) {
      return slugCandidate;
    }

    slugCandidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const GLOBAL_SETTINGS_FIELDS = [
  { key: 'company_name', group: 'brand', defaultValue: 'Sparkle Fireworks' },
  { key: 'seo_title', group: 'brand', defaultValue: 'Sparkle Fireworks | Best Crackers Online' },
  { key: 'main_logo', group: 'brand', defaultValue: '' },
  { key: 'favicon', group: 'brand', defaultValue: '' },
  { key: 'primary_phone', group: 'contact', defaultValue: '+91 98765 43210' },
  { key: 'email', group: 'contact', defaultValue: '' },
  { key: 'address', group: 'contact', defaultValue: '' },
  { key: 'whatsapp_number', group: 'contact', defaultValue: '' },
  { key: 'footer_content', group: 'contact', defaultValue: '' },
  { key: 'facebook_url', group: 'social', defaultValue: '' },
  { key: 'instagram_url', group: 'social', defaultValue: '' },
  { key: 'twitter_url', group: 'social', defaultValue: '' },
  { key: 'linkedin_url', group: 'social', defaultValue: '' },
  { key: 'youtube_url', group: 'social', defaultValue: '' },
  { key: 'offer_text_html', group: 'seo', defaultValue: '' },
  { key: 'google_analytics_id', group: 'seo', defaultValue: '' },
];

const GLOBAL_SETTINGS_KEYS = new Set(GLOBAL_SETTINGS_FIELDS.map((field) => field.key));

const THEME_SETTINGS_FIELDS = [
  { key: 'color_primary', group: 'theme', defaultValue: '#f8fafc' },
  { key: 'color_secondary', group: 'theme', defaultValue: '#ffffff' },
  { key: 'color_tertiary', group: 'theme', defaultValue: '#f59e0b' },
  { key: 'color_quaternary', group: 'theme', defaultValue: '#ec4899' },
];

const THEME_SETTINGS_KEYS = new Set(THEME_SETTINGS_FIELDS.map((field) => field.key));
const FULL_HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

const getGlobalSettingsPayload = (settingsMap = {}) =>
  GLOBAL_SETTINGS_FIELDS.reduce((accumulator, field) => {
    accumulator[field.key] = settingsMap[field.key] ?? field.defaultValue;
    return accumulator;
  }, {});

const getThemeSettingsPayload = (settingsMap = {}) =>
  THEME_SETTINGS_FIELDS.reduce((accumulator, field) => {
    accumulator[field.key] = settingsMap[field.key] ?? field.defaultValue;
    return accumulator;
  }, {});

const getSettingsMapByKeys = async (keys = []) => {
  if (!keys.length) {
    return {};
  }

  const [rows] = await pool.query(
    `SELECT setting_key, setting_value
     FROM settings
     WHERE setting_key IN (?)`,
    [keys]
  );

  return rows.reduce((accumulator, row) => {
    accumulator[row.setting_key] = row.setting_value ?? '';
    return accumulator;
  }, {});
};

const getNormalizedThemePayload = (payload = {}) => {
  const normalizedPayload = {};

  for (const key of Object.keys(payload)) {
    if (!THEME_SETTINGS_KEYS.has(key)) {
      throw new Error(`Unknown theme setting key: ${key}`);
    }
  }

  for (const field of THEME_SETTINGS_FIELDS) {
    if (!(field.key in payload)) {
      throw new Error(`Missing theme setting key: ${field.key}`);
    }

    const value = String(payload[field.key] ?? '').trim().toLowerCase();
    if (!FULL_HEX_COLOR_REGEX.test(value)) {
      throw new Error(`Invalid color value for ${field.key}. Use #RRGGBB format.`);
    }

    normalizedPayload[field.key] = value;
  }

  return normalizedPayload;
};

const upsertSetting = async (key, value, group) => {
  await pool.query(
    `INSERT INTO settings (setting_key, setting_value, setting_group)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       setting_group = VALUES(setting_group)`,
    [key, value ?? '', group]
  );
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

router.get('/theme', async (req, res, next) => {
  if (req.path === '/theme' && req.baseUrl === '/api/settings') {
    return auth(req, res, next);
  }

  return next();
}, async (req, res) => {
  try {
    const settingsMap = await getSettingsMapByKeys(Array.from(THEME_SETTINGS_KEYS));

    res.json({
      success: true,
      data: getThemeSettingsPayload(settingsMap),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/theme', (req, res, next) => {
  if (req.baseUrl !== '/api/settings') {
    return res.status(404).json({ success: false, message: 'Route not found.' });
  }

  return auth(req, res, next);
}, async (req, res) => {
  try {
    const normalizedPayload = getNormalizedThemePayload(req.body || {});

    for (const field of THEME_SETTINGS_FIELDS) {
      await upsertSetting(field.key, normalizedPayload[field.key], field.group);
    }

    res.json({
      success: true,
      message: 'Theme settings saved successfully.',
      data: normalizedPayload,
    });
  } catch (error) {
    const isValidationError =
      error.message.startsWith('Unknown theme setting key:') ||
      error.message.startsWith('Missing theme setting key:') ||
      error.message.startsWith('Invalid color value for');

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: error.message,
    });
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

router.get('/global', auth, async (req, res) => {
  try {
    const settingsMap = await getSettingsMapByKeys(Array.from(GLOBAL_SETTINGS_KEYS));

    res.json({
      success: true,
      data: getGlobalSettingsPayload(settingsMap),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/global', auth, globalSettingsUpload, async (req, res) => {
  try {
    const files = req.files || {};
    const payload = {};

    for (const field of GLOBAL_SETTINGS_FIELDS) {
      payload[field.key] = req.body[field.key] ?? field.defaultValue;
    }

    const [existingRows] = await pool.query(
      `SELECT setting_key, setting_value
       FROM settings
       WHERE setting_key IN ('main_logo', 'favicon')`
    );
    const existingMap = existingRows.reduce((accumulator, row) => {
      accumulator[row.setting_key] = row.setting_value ?? '';
      return accumulator;
    }, {});

    const mainLogoFile = files.main_logo?.[0];
    const faviconFile = files.favicon?.[0];

    payload.main_logo = mainLogoFile
      ? `/uploads/settings/${mainLogoFile.filename}`
      : existingMap.main_logo || payload.main_logo || '';
    payload.favicon = faviconFile
      ? `/uploads/settings/${faviconFile.filename}`
      : existingMap.favicon || payload.favicon || '';

    for (const field of GLOBAL_SETTINGS_FIELDS) {
      await upsertSetting(field.key, payload[field.key], field.group);
    }

    res.json({
      success: true,
      message: 'Global settings saved successfully.',
      data: getGlobalSettingsPayload(payload),
    });
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
    const [rows] = await pool.query('SELECT * FROM seo_headings ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seo-headings', auth, async (req, res) => {
  try {
    const page_name = req.body.page_name?.trim();
    const heading = req.body.heading?.trim();

    if (!page_name) {
      return res.status(400).json({ success: false, message: 'Page name is required.' });
    }

    if (!heading) {
      return res.status(400).json({ success: false, message: 'Heading is required.' });
    }

    const [result] = await pool.query('INSERT INTO seo_headings (page_name, heading) VALUES (?, ?)', [page_name, heading]);
    res.status(201).json({ success: true, message: 'SEO heading created.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/seo-headings/:id', auth, async (req, res) => {
  try {
    const page_name = req.body.page_name?.trim();
    const heading = req.body.heading?.trim();

    if (!page_name) {
      return res.status(400).json({ success: false, message: 'Page name is required.' });
    }

    if (!heading) {
      return res.status(400).json({ success: false, message: 'Heading is required.' });
    }

    const [result] = await pool.query(
      'UPDATE seo_headings SET page_name = ?, heading = ? WHERE id = ?',
      [page_name, heading, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'SEO heading not found.' });
    }

    res.json({ success: true, message: 'SEO heading updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/seo-headings/:id', auth, async (req, res) => {
  try {
    const [[{ linkedSeoDetailsCount }]] = await pool.query(
      'SELECT COUNT(*) AS linkedSeoDetailsCount FROM seo_details WHERE seo_heading_id = ?',
      [req.params.id]
    );

    if (linkedSeoDetailsCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'This SEO heading is used by existing SEO details and cannot be deleted.',
      });
    }

    const [result] = await pool.query('DELETE FROM seo_headings WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'SEO heading not found.' });
    }

    res.json({ success: true, message: 'SEO heading deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SEO Details
router.get('/seo-details', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        sd.*,
        sh.page_name AS heading_page_name,
        sh.heading AS seo_heading_label
      FROM seo_details sd
      LEFT JOIN seo_headings sh ON sh.id = sd.seo_heading_id
      ORDER BY sd.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seo-details', auth, seoDetailsUpload, async (req, res) => {
  try {
    const seoHeadingId = Number(req.body.seo_heading_id);
    const meta_title = req.body.meta_title?.trim();
    const meta_description = req.body.meta_description?.trim();
    const meta_keywords = req.body.meta_keywords?.trim();
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const alt_key = req.body.alt_key?.trim();
    const url = req.body.url?.trim();
    const canonical = req.body.canonical?.trim() || null;
    const feet_content = req.body.feet_content?.trim();
    const image = req.file
      ? `/uploads/seo/${req.file.filename}`
      : req.body.existing_image?.trim() || req.body.image?.trim() || null;

    if (!Number.isInteger(seoHeadingId) || seoHeadingId <= 0) {
      return res.status(400).json({ success: false, message: 'SEO heading is required.' });
    }

    const [headingRows] = await pool.query(
      'SELECT id, page_name, heading FROM seo_headings WHERE id = ? LIMIT 1',
      [seoHeadingId]
    );

    if (headingRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected SEO heading is invalid.' });
    }

    if (!meta_title || !meta_description || !meta_keywords || !name || !description || !alt_key || !url || !feet_content) {
      return res.status(400).json({ success: false, message: 'All required SEO detail fields must be filled.' });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: 'SEO image is required.' });
    }

    const page_name = headingRows[0].page_name;
    const [result] = await pool.query(
      `INSERT INTO seo_details (
        seo_heading_id, page_name, meta_title, meta_description, meta_keywords,
        name, description, image, alt_key, url, canonical, feet_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seoHeadingId,
        page_name,
        meta_title,
        meta_description,
        meta_keywords,
        name,
        description,
        image,
        alt_key,
        url,
        canonical,
        feet_content,
      ]
    );
    res.status(201).json({ success: true, message: 'SEO detail created.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/seo-details/:id', auth, seoDetailsUpload, async (req, res) => {
  try {
    const seoHeadingId = Number(req.body.seo_heading_id);
    const meta_title = req.body.meta_title?.trim();
    const meta_description = req.body.meta_description?.trim();
    const meta_keywords = req.body.meta_keywords?.trim();
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const alt_key = req.body.alt_key?.trim();
    const url = req.body.url?.trim();
    const canonical = req.body.canonical?.trim() || null;
    const feet_content = req.body.feet_content?.trim();

    if (!Number.isInteger(seoHeadingId) || seoHeadingId <= 0) {
      return res.status(400).json({ success: false, message: 'SEO heading is required.' });
    }

    const [existingRows] = await pool.query('SELECT image FROM seo_details WHERE id = ? LIMIT 1', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'SEO detail not found.' });
    }

    const [headingRows] = await pool.query(
      'SELECT id, page_name, heading FROM seo_headings WHERE id = ? LIMIT 1',
      [seoHeadingId]
    );

    if (headingRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected SEO heading is invalid.' });
    }

    if (!meta_title || !meta_description || !meta_keywords || !name || !description || !alt_key || !url || !feet_content) {
      return res.status(400).json({ success: false, message: 'All required SEO detail fields must be filled.' });
    }

    const image = req.file
      ? `/uploads/seo/${req.file.filename}`
      : req.body.existing_image?.trim() || req.body.image?.trim() || existingRows[0].image;

    if (!image) {
      return res.status(400).json({ success: false, message: 'SEO image is required.' });
    }

    const page_name = headingRows[0].page_name;

    await pool.query(
      `UPDATE seo_details
       SET seo_heading_id = ?, page_name = ?, meta_title = ?, meta_description = ?, meta_keywords = ?,
           name = ?, description = ?, image = ?, alt_key = ?, url = ?, canonical = ?, feet_content = ?
       WHERE id = ?`,
      [
        seoHeadingId,
        page_name,
        meta_title,
        meta_description,
        meta_keywords,
        name,
        description,
        image,
        alt_key,
        url,
        canonical,
        feet_content,
        req.params.id,
      ]
    );

    res.json({ success: true, message: 'SEO detail updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/seo-details/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM seo_details WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'SEO detail not found.' });
    }

    res.json({ success: true, message: 'SEO detail deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Blogs
router.get('/blogs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, meta_title, meta_description, meta_keywords, content, image,
              is_published, published_at, created_at, updated_at
       FROM blogs
       ORDER BY COALESCE(published_at, created_at) DESC, id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/blogs', auth, blogImageUpload, async (req, res) => {
  try {
    const metaTitle = req.body.meta_title?.trim();
    const metaDescription = req.body.meta_description?.trim();
    const metaKeywords = req.body.meta_keywords?.trim();
    const blogName = req.body.blog_name?.trim() || req.body.title?.trim();
    const feetContent = req.body.feet_content?.trim() || req.body.content?.trim();
    const image = req.file ? `/uploads/blogs/${req.file.filename}` : req.body.image?.trim() || null;

    if (!metaTitle || !metaDescription || !metaKeywords || !blogName || !feetContent) {
      return res.status(400).json({ success: false, message: 'All required blog fields must be filled.' });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: 'Blog image is required.' });
    }

    const slug = await getUniqueBlogSlug(blogName);
    const publishedAt = new Date();

    const [result] = await pool.query(
      `INSERT INTO blogs (
        title, slug, meta_title, meta_description, meta_keywords, content, image, is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [blogName, slug, metaTitle, metaDescription, metaKeywords, feetContent, image, 1, publishedAt]
    );
    res.status(201).json({ success: true, message: 'Blog created.', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A blog with the generated slug already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/blogs/:id', auth, blogImageUpload, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    const metaTitle = req.body.meta_title?.trim();
    const metaDescription = req.body.meta_description?.trim();
    const metaKeywords = req.body.meta_keywords?.trim();
    const blogName = req.body.blog_name?.trim() || req.body.title?.trim();
    const feetContent = req.body.feet_content?.trim() || req.body.content?.trim();

    if (!Number.isInteger(blogId) || blogId <= 0) {
      return res.status(400).json({ success: false, message: 'Blog id is invalid.' });
    }

    if (!metaTitle || !metaDescription || !metaKeywords || !blogName || !feetContent) {
      return res.status(400).json({ success: false, message: 'All required blog fields must be filled.' });
    }

    const [existingRows] = await pool.query('SELECT image, published_at FROM blogs WHERE id = ? LIMIT 1', [blogId]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found.' });
    }

    const image = req.file
      ? `/uploads/blogs/${req.file.filename}`
      : req.body.existing_image?.trim() || existingRows[0].image;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Blog image is required.' });
    }

    const slug = await getUniqueBlogSlug(blogName, blogId);
    const publishedAt = existingRows[0].published_at || new Date();

    await pool.query(
      `UPDATE blogs
       SET title = ?, slug = ?, meta_title = ?, meta_description = ?, meta_keywords = ?,
           content = ?, image = ?, is_published = ?, published_at = ?
       WHERE id = ?`,
      [blogName, slug, metaTitle, metaDescription, metaKeywords, feetContent, image, 1, publishedAt, blogId]
    );

    res.json({ success: true, message: 'Blog updated.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A blog with the generated slug already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/blogs/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found.' });
    }

    res.json({ success: true, message: 'Blog deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Brands
router.get('/brands', async (req, res) => {
  try {
    const search = req.query.search?.trim();
    let query = `
      SELECT id, name, logo, sort_order, is_active, created_at
      FROM brands
      WHERE 1 = 1
    `;
    const params = [];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY sort_order ASC, id DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/brands', auth, brandLogoUpload, async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const logo = req.file ? `/uploads/brands/${req.file.filename}` : req.body.logo?.trim() || null;
    const sortOrder = Number(req.body.sort_order ?? 0);
    const isActive = Number(req.body.is_active ?? 1);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Brand name is required.' });
    }

    if (!logo) {
      return res.status(400).json({ success: false, message: 'Brand logo is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO brands (name, logo, sort_order, is_active) VALUES (?, ?, ?, ?)',
      [name, logo, Number.isFinite(sortOrder) ? sortOrder : 0, [0, 1].includes(isActive) ? isActive : 1]
    );
    res.status(201).json({ success: true, message: 'Brand created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/brands/:id', auth, brandLogoUpload, async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const sortOrder = Number(req.body.sort_order ?? 0);
    const isActive = Number(req.body.is_active ?? 1);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Brand name is required.' });
    }

    const [existingRows] = await pool.query('SELECT logo FROM brands WHERE id = ? LIMIT 1', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    const logo = req.file
      ? `/uploads/brands/${req.file.filename}`
      : req.body.logo?.trim() || existingRows[0].logo;

    await pool.query(
      'UPDATE brands SET name = ?, logo = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, logo, Number.isFinite(sortOrder) ? sortOrder : 0, [0, 1].includes(isActive) ? isActive : 1, req.params.id]
    );
    res.json({ success: true, message: 'Brand updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/brands/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries
router.get('/enquiries', auth, async (req, res) => {
  try {
    const { search, is_read, start_date, end_date } = req.query;
    let query = `
      SELECT id, name, email, phone, message, is_read, created_at
      FROM enquiries
      WHERE 1 = 1
    `;
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (is_read === '1' || is_read === '0') {
      query += ' AND is_read = ?';
      params.push(Number(is_read));
    }

    if (start_date) {
      query += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/enquiries/:id/read', auth, async (req, res) => {
  try {
    const isRead = req.body?.is_read;
    const normalizedIsRead = isRead === true || isRead === 1 || isRead === '1' ? 1 : isRead === false || isRead === 0 || isRead === '0' ? 0 : null;

    if (normalizedIsRead == null) {
      return res.status(400).json({ success: false, message: 'is_read must be true or false.' });
    }

    const [result] = await pool.query('UPDATE enquiries SET is_read = ? WHERE id = ?', [normalizedIsRead, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    res.json({ success: true, message: `Enquiry marked as ${normalizedIsRead ? 'read' : 'unread'}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/enquiries/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM enquiries WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    res.json({ success: true, message: 'Enquiry deleted.' });
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
