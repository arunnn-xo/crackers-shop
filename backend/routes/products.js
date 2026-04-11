const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/products — List all products with category name
router.get('/', async (req, res) => {
  try {
    const { category, stock, search, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    if (stock) {
      query += ' AND p.stock_status = ?';
      params.push(stock);
    }
    if (search) {
      query += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    // Count total
    const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY p.sort_order ASC, p.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      data: rows, 
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products
router.post('/', auth, async (req, res) => {
  try {
    const { category_id, name, image, price, sale_price, content_unit, stock_status, description, sort_order } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (category_id, name, image, price, sale_price, content_unit, stock_status, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, image, price, sale_price, content_unit || '1 Box', stock_status || 'In Stock', description, sort_order || 0]
    );
    res.status(201).json({ success: true, message: 'Product created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { category_id, name, image, price, sale_price, content_unit, stock_status, description, sort_order, is_active } = req.body;
    await pool.query(
      'UPDATE products SET category_id=?, name=?, image=?, price=?, sale_price=?, content_unit=?, stock_status=?, description=?, sort_order=?, is_active=? WHERE id=?',
      [category_id, name, image, price, sale_price, content_unit, stock_status, description, sort_order, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products — Delete all products
router.delete('/', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products');
    res.json({ success: true, message: 'All products deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
