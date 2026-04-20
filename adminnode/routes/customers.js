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
    const normalizedStartDate = req.query.start_date?.trim() || null;
    const normalizedEndDate = req.query.end_date?.trim() || null;
    const requestedLimit = Number(req.query.limit);
    const normalizedLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), 100) : 10;

    let query = `
      SELECT
        c.id AS customer_id,
        c.name,
        c.phone,
        c.city,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total), 0) AS total_value,
        MAX(o.order_date) AS last_order_date
      FROM customers c
      INNER JOIN orders o ON c.id = o.customer_id
      WHERE o.payment_status = 'Paid'
    `;
    const params = [];

    if (normalizedStartDate) {
      query += ' AND o.order_date >= ?';
      params.push(normalizedStartDate);
    }

    if (normalizedEndDate) {
      query += ' AND o.order_date <= ?';
      params.push(normalizedEndDate);
    }

    query += `
      GROUP BY c.id, c.name, c.phone, c.city
      HAVING total_value > 0
      ORDER BY total_value DESC, total_orders DESC, c.name ASC
      LIMIT ?
    `;
    params.push(normalizedLimit);

    const [rows] = await pool.query(query, params);
    const data = rows.map((row) => ({
      ...row,
      total_orders: Number(row.total_orders || 0),
      total_value: Number(row.total_value || 0),
    }));

    const summary = data.reduce(
      (accumulator, row, index) => ({
        customer_count: accumulator.customer_count + 1,
        total_orders: accumulator.total_orders + row.total_orders,
        total_value: accumulator.total_value + row.total_value,
        top_customer_name: index === 0 ? row.name : accumulator.top_customer_name,
      }),
      { customer_count: 0, total_orders: 0, total_value: 0, top_customer_name: null }
    );

    res.json({
      success: true,
      data,
      summary,
      filters: {
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        limit: normalizedLimit,
      },
    });
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
    const name = req.body.name?.trim();
    const email = req.body.email?.trim() || null;
    const phone = req.body.phone?.trim();
    const address = req.body.address?.trim() || null;
    const city = req.body.city?.trim() || null;
    const state = req.body.state?.trim() || null;
    const pincode = req.body.pincode?.trim() || null;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

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
    const name = req.body.name?.trim();
    const email = req.body.email?.trim() || null;
    const phone = req.body.phone?.trim();
    const address = req.body.address?.trim() || null;
    const city = req.body.city?.trim() || null;
    const state = req.body.state?.trim() || null;
    const pincode = req.body.pincode?.trim() || null;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    await pool.query(
      'UPDATE customers SET name=?, email=?, phone=?, address=?, city=?, state=?, pincode=? WHERE id=?',
      [name, email, phone, address, city, state, pincode, req.params.id]
    );
    res.json({ success: true, message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
