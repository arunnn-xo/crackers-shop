const mysql = require('mysql2/promise');
require('dotenv').config();

const databaseName = process.env.DB_NAME || 'crackers_shop';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: databaseName,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const ensureSeoDetailsSchema = async (connection) => {
  const [tableRows] = await connection.query(`SHOW TABLES LIKE 'seo_details'`);
  if (tableRows.length === 0) {
    return;
  }

  const [columnRows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'seo_details'`,
    [databaseName]
  );

  const existingColumns = new Set(columnRows.map((row) => row.COLUMN_NAME));
  const alterClauses = [];

  if (!existingColumns.has('seo_heading_id')) {
    alterClauses.push('ADD COLUMN seo_heading_id INT DEFAULT NULL AFTER id');
  }
  if (!existingColumns.has('name')) {
    alterClauses.push('ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER meta_keywords');
  }
  if (!existingColumns.has('description')) {
    alterClauses.push('ADD COLUMN description TEXT DEFAULT NULL AFTER name');
  }
  if (!existingColumns.has('image')) {
    alterClauses.push('ADD COLUMN image VARCHAR(255) DEFAULT NULL AFTER description');
  }
  if (!existingColumns.has('alt_key')) {
    alterClauses.push('ADD COLUMN alt_key VARCHAR(255) DEFAULT NULL AFTER image');
  }
  if (!existingColumns.has('url')) {
    alterClauses.push('ADD COLUMN url VARCHAR(255) DEFAULT NULL AFTER alt_key');
  }
  if (!existingColumns.has('canonical')) {
    alterClauses.push('ADD COLUMN canonical VARCHAR(255) DEFAULT NULL AFTER url');
  }
  if (!existingColumns.has('feet_content')) {
    alterClauses.push('ADD COLUMN feet_content LONGTEXT DEFAULT NULL AFTER canonical');
  }

  if (alterClauses.length > 0) {
    await connection.query(`ALTER TABLE seo_details ${alterClauses.join(', ')}`);
    console.log('SEO details schema updated for legacy database.');
  }

  const [indexRows] = await connection.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'seo_details' AND INDEX_NAME = 'idx_seo_details_heading_id'`,
    [databaseName]
  );

  if (indexRows.length === 0) {
    await connection.query('ALTER TABLE seo_details ADD INDEX idx_seo_details_heading_id (seo_heading_id)');
  }

  await connection.query(`
    UPDATE seo_details sd
    INNER JOIN seo_headings sh ON sh.page_name = sd.page_name
    SET sd.seo_heading_id = sh.id
    WHERE sd.seo_heading_id IS NULL
  `);
};

const ensureBlogsSchema = async (connection) => {
  const [tableRows] = await connection.query(`SHOW TABLES LIKE 'blogs'`);
  if (tableRows.length === 0) {
    return;
  }

  const [columnRows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'blogs'`,
    [databaseName]
  );

  const existingColumns = new Set(columnRows.map((row) => row.COLUMN_NAME));
  const alterClauses = [];

  if (!existingColumns.has('meta_keywords')) {
    alterClauses.push('ADD COLUMN meta_keywords TEXT DEFAULT NULL AFTER meta_description');
  }

  if (alterClauses.length > 0) {
    await connection.query(`ALTER TABLE blogs ${alterClauses.join(', ')}`);
    console.log('Blogs schema updated for legacy database.');
  }
};

const ensureSettingsDefaults = async (connection) => {
  const [tableRows] = await connection.query(`SHOW TABLES LIKE 'settings'`);
  if (tableRows.length === 0) {
    return;
  }

  const settingsDefaults = [
    ['company_name', 'Sparkle Fireworks', 'brand'],
    ['seo_title', 'Sparkle Fireworks | Best Crackers Online', 'brand'],
    ['main_logo', '', 'brand'],
    ['favicon', '', 'brand'],
    ['primary_phone', '+91 98765 43210', 'contact'],
    ['whatsapp_number', '', 'contact'],
    ['footer_content', '', 'contact'],
    ['facebook_url', '', 'social'],
    ['instagram_url', '', 'social'],
    ['twitter_url', '', 'social'],
    ['linkedin_url', '', 'social'],
    ['youtube_url', '', 'social'],
    ['offer_text_html', '', 'seo'],
  ];

  for (const [key, value, group] of settingsDefaults) {
    await connection.query(
      'INSERT IGNORE INTO settings (setting_key, setting_value, setting_group) VALUES (?, ?, ?)',
      [key, value, group]
    );
  }
};

const initializeDatabase = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('MySQL connected successfully. Database:', databaseName);
    await ensureSeoDetailsSchema(connection);
    await ensureBlogsSchema(connection);
    await ensureSettingsDefaults(connection);
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.error('Make sure MySQL is running and the database exists.');
    console.error('Run: mysql -u root -e "CREATE DATABASE IF NOT EXISTS crackers_shop;"');
  } finally {
    connection?.release();
  }
};

initializeDatabase();

module.exports = pool;
