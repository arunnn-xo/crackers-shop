const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/orders — List all orders with customer name
router.get('/', async (req, res) => {
  try {
    const { status, type, start_date, end_date, search, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All' && status !== 'All Status') {
      query += ' AND o.status = ?';
      params.push(status);
    }
    if (type && type !== 'All' && type !== 'All Types') {
      query += ' AND o.order_type = ?';
      params.push(type);
    }
    if (start_date) {
      query += ' AND o.order_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND o.order_date <= ?';
      params.push(end_date);
    }
    if (search) {
      query += ' AND (o.order_no LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count
    const countQuery = query.replace('SELECT o.*, c.name as customer_name, c.phone as customer_phone', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Paginate
    const offset = (page - 1) * limit;
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
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

// GET /api/orders/today — Today's orders
router.get('/today', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE o.order_date = CURDATE()
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/stats — Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE payment_status = "Paid"');
    const [[{ todayBilling }]] = await pool.query('SELECT COALESCE(SUM(total), 0) as todayBilling FROM orders WHERE order_date = CURDATE()');
    const [[{ pendingOrders }]] = await pool.query('SELECT COUNT(*) as pendingOrders FROM orders WHERE status = "Pending"');
    const [[{ completedOrders }]] = await pool.query('SELECT COUNT(*) as completedOrders FROM orders WHERE status = "Complete"');

    res.json({ success: true, data: { totalOrders, totalRevenue, todayBilling, pendingOrders, completedOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id — Single order with items
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?
    `, [req.params.id]);

    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    const [items] = await pool.query(`
      SELECT oi.*, p.name as product_name FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders — Create new order
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { customer_id, items, order_type, shipping = 0, discount = 0, notes } = req.body;
    
    // Generate order number
    const orderNo = `ORD-${Date.now().toString().slice(-8)}`;
    
    // Calculate totals
    let subTotal = 0;
    for (const item of items) {
      subTotal += item.price * item.quantity;
    }
    const total = subTotal + shipping - discount;

    const [result] = await connection.query(
      'INSERT INTO orders (order_no, customer_id, sub_total, shipping, discount, total, order_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderNo, customer_id, subTotal, shipping, discount, total, order_type || 'ONLINE', notes]
    );

    // Insert order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Order created', orderNo, id: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/orders/:id/status — Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
