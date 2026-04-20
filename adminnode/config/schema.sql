-- ============================================
-- Crackers Shop Admin Panel — Database Schema
-- Database: crackers_shop
-- ============================================

CREATE DATABASE IF NOT EXISTS crackers_shop;
USE crackers_shop;

-- ----------------------------
-- 1. Admin Users Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'admin',
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 2. Categories Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 3. Products Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  content_unit VARCHAR(50) DEFAULT '1 Box',
  stock_status ENUM('In Stock', 'Out of Stock') DEFAULT 'In Stock',
  description TEXT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ----------------------------
-- 4. Customers Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  pincode VARCHAR(10) DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 5. Orders Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  sub_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  order_type ENUM('ONLINE', 'BILLING') DEFAULT 'ONLINE',
  status VARCHAR(50) DEFAULT 'Pending',
  payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
  notes TEXT DEFAULT NULL,
  order_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ----------------------------
-- 6. Order Items Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ----------------------------
-- 7. Banners Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(255) NOT NULL,
  link VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 8. Brand Logos Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  logo VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- 9. Geography Tables
-- ----------------------------
CREATE TABLE IF NOT EXISTS states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  state_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- ----------------------------
-- 10. Order Statuses Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS order_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#64748b',
  sort_order INT DEFAULT 0
);

-- ----------------------------
-- 11. Contact Enquiries Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- 12. SEO Headings Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS seo_headings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(100) NOT NULL,
  heading TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 13. SEO Details Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS seo_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seo_heading_id INT DEFAULT NULL,
  page_name VARCHAR(100) NOT NULL,
  meta_title VARCHAR(255) DEFAULT NULL,
  meta_description TEXT DEFAULT NULL,
  meta_keywords VARCHAR(500) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  alt_key VARCHAR(255) DEFAULT NULL,
  url VARCHAR(255) DEFAULT NULL,
  canonical VARCHAR(255) DEFAULT NULL,
  feet_content LONGTEXT DEFAULT NULL,
  INDEX idx_seo_details_heading_id (seo_heading_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 14. Blog Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  meta_title VARCHAR(255) DEFAULT NULL,
  meta_description TEXT DEFAULT NULL,
  meta_keywords TEXT DEFAULT NULL,
  content LONGTEXT DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  is_published TINYINT(1) DEFAULT 0,
  published_at DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 15. Site Settings Table (key-value)
-- ----------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  setting_group VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- 16. Store Config Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS store_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_store_open TINYINT(1) DEFAULT 1,
  min_order_value DECIMAL(10, 2) DEFAULT 2000.00,
  global_discount DECIMAL(5, 2) DEFAULT 15.00,
  off_banner_image VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- SEED DATA
-- ============================================

-- Default Admin User (password: admin123)
INSERT IGNORE INTO admin_users (name, email, password, role) VALUES
('System Admin', 'admin@sparkle.com', '$2a$10$jzK9XCmwfei1hpgJWfMELehybCL9xbNSMWtmZe7jN/ZfoBrlgqQQm', 'admin');

-- Default Order Statuses
INSERT IGNORE INTO order_statuses (name, sort_order) VALUES
('Pending', 1), ('Dispatch', 2), ('Complete', 3), 
('Payment Pending', 4), ('Printed', 5), ('Paid', 6),
('Call Not Pick', 7), ('Later Call', 8), ('Dont Call', 9);

-- Default Categories
INSERT IGNORE INTO categories (data_id, name, sort_order) VALUES
('CAT-01', 'Sparklers', 1),
('CAT-02', 'Rockets', 2),
('CAT-03', 'Fountains', 3),
('CAT-04', 'Chakras', 4),
('CAT-05', 'Bombs', 5),
('CAT-06', 'Garlands', 6);

-- Default States
INSERT IGNORE INTO states (name) VALUES
('Tamil Nadu'), ('Kerala'), ('Karnataka'), ('Andhra Pradesh'), ('Telangana');

-- Default Cities
INSERT IGNORE INTO cities (state_id, name, code) VALUES
(1, 'Coimbatore', 'CBE'),
(1, 'Sivakasi', 'SVK'),
(1, 'Chennai', 'CHE'),
(1, 'Madurai', 'MDU'),
(2, 'Kochi', 'KCH'),
(3, 'Bangalore', 'BLR');

-- Default Areas
INSERT IGNORE INTO areas (city_id, name, pincode) VALUES
(1, 'Gandhipuram', '641012'),
(1, 'Town Hall', '641001'),
(1, 'RS Puram', '641002'),
(2, 'Sivakasi Town', '626123');

-- Default Store Config
INSERT IGNORE INTO store_config (is_store_open, min_order_value, global_discount) VALUES
(1, 2000.00, 15.00);

-- Default Site Settings
INSERT IGNORE INTO settings (setting_key, setting_value, setting_group) VALUES
('company_name', 'Sparkle Fireworks', 'brand'),
('seo_title', 'Sparkle Fireworks | Best Crackers Online', 'brand'),
('main_logo', '', 'brand'),
('favicon', '', 'brand'),
('primary_phone', '+91 98765 43210', 'contact'),
('whatsapp_number', '', 'contact'),
('footer_content', '', 'contact'),
('email', 'support@sparklefireworks.com', 'contact'),
('address', '123 Sparkle Street, Sivakasi, Tamil Nadu, India', 'contact'),
('facebook_url', '', 'social'),
('instagram_url', '', 'social'),
('twitter_url', '', 'social'),
('linkedin_url', '', 'social'),
('youtube_url', '', 'social'),
('offer_text_html', '', 'seo'),
('google_analytics_id', '', 'seo'),
('color_primary', '#f8fafc', 'theme'),
('color_secondary', '#ffffff', 'theme'),
('color_tertiary', '#f59e0b', 'theme'),
('color_quaternary', '#ec4899', 'theme'),
('terms_content', '<h2>1. Introduction</h2><p>Welcome to our fireworks store...</p>', 'legal'),
('about_heading', 'Lighting up your celebrations since 1995.', 'about'),
('about_description', '', 'about'),
('hero_eyebrow', 'WELCOME TO SPARKLE', 'homepage'),
('hero_heading', 'Premium Fireworks for Every Occasion', 'homepage'),
('hero_cta_text', 'Shop Now', 'homepage'),
('hero_cta_link', '/products', 'homepage'),
('bank_name', 'HDFC Bank', 'payment'),
('bank_account', '0000111122223333', 'payment'),
('bank_ifsc', 'HDFC0001234', 'payment'),
('bank_holder', 'Sparkle Fireworks Pvt Ltd', 'payment'),
('bank_branch', 'Sivakasi Main', 'payment'),
('gpay_number', '+91 9876543210', 'payment'),
('phonepe_number', '+91 9876543210', 'payment');

-- Default SEO Headings
INSERT IGNORE INTO seo_headings (page_name) VALUES
('Home Page'), ('Products Page'), ('About Page'), ('Contact Page');

-- Default SEO Details
INSERT IGNORE INTO seo_details (
  seo_heading_id,
  page_name,
  meta_title,
  meta_description,
  meta_keywords,
  name,
  description,
  alt_key,
  url,
  canonical,
  feet_content
)
SELECT
  id,
  page_name,
  'Buy Best Crackers Online',
  'Premium quality fireworks from Sivakasi at best prices.',
  'crackers, fireworks, diwali',
  'Home SEO',
  'Premium quality fireworks from Sivakasi at best prices.',
  'Premium crackers home banner',
  '/',
  '/',
  '<p>Premium quality fireworks from Sivakasi at best prices.</p>'
FROM seo_headings
WHERE page_name = 'Home Page'
LIMIT 1;
