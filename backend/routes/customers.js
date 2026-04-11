const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const { search, city, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/top — Top customers by order value
router.get('/top', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(o.id) as total_orders, COALESCE(SUM(o.total), 0) as total_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      ORDER BY total_value DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/customers
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode } = req.body;
    const [result] = await pool.query(
      'INSERT INTO customers (name, email, phone, address, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, address, city, state, pincode]
    );
    res.status(201).json({ success: true, message: 'Customer created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode } = req.body;
    await pool.query(
      'UPDATE customers SET name=?, email=?, phone=?, address=?, city=?, state=?, pincode=? WHERE id=?',
      [name, email, phone, address, city, state, pincode, req.params.id]
    );
    res.json({ success: true, message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
