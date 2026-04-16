const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

const createValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeOrderType = (orderType) => String(orderType || 'ONLINE').toUpperCase();
const normalizePaymentStatus = (paymentStatus) => paymentStatus || 'Pending';

const validateOrderItems = (items) => {
  const normalizedItems = Array.isArray(items) ? items : [];

  if (normalizedItems.length === 0) {
    throw createValidationError('At least one order item is required.');
  }

  let subTotal = 0;

  const parsedItems = normalizedItems.map((item) => {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!productId) {
      throw createValidationError('Each order item must include a product ID.');
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw createValidationError('Each order item must include a valid quantity.');
    }

    if (!Number.isFinite(price) || price < 0) {
      throw createValidationError('Each order item must include a valid price.');
    }

    const total = quantity * price;
    subTotal += total;

    return {
      product_id: productId,
      quantity,
      price,
      total,
    };
  });

  return { parsedItems, subTotal };
};

const validateAmounts = (shipping, discount) => {
  const normalizedShipping = Number(shipping || 0);
  const normalizedDiscount = Number(discount || 0);

  if (!Number.isFinite(normalizedShipping) || normalizedShipping < 0) {
    throw createValidationError('Shipping amount must be a valid non-negative number.');
  }

  if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0) {
    throw createValidationError('Discount amount must be a valid non-negative number.');
  }

  return { normalizedShipping, normalizedDiscount };
};

const validatePaymentStatus = (paymentStatus) => {
  const normalizedPaymentStatus = normalizePaymentStatus(paymentStatus);
  if (!['Pending', 'Paid', 'Failed'].includes(normalizedPaymentStatus)) {
    throw createValidationError('Invalid payment status.');
  }
  return normalizedPaymentStatus;
};

const validateOrderStatus = (status) => {
  const normalizedStatus = String(status || '').trim();
  if (!normalizedStatus) {
    throw createValidationError('Order status is required.');
  }
  return normalizedStatus;
};

const ensureBillingOrder = async (connection, orderId) => {
  const [rows] = await connection.query('SELECT id, order_type FROM orders WHERE id = ? LIMIT 1', [orderId]);
  if (rows.length === 0) {
    throw createValidationError('Order not found.', 404);
  }
  if (rows[0].order_type !== 'BILLING') {
    throw createValidationError('Only billing orders can be updated from this workflow.', 400);
  }
  return rows[0];
};

const insertOrderItems = async (connection, orderId, items) => {
  for (const item of items) {
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
      [orderId, item.product_id, item.quantity, item.price, item.total]
    );
  }
};

// GET /api/orders — List all orders with customer name
router.get('/', async (req, res) => {
  try {
    const {
      status,
      type,
      payment_status,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20,
    } = req.query;

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

    if (payment_status && payment_status !== 'All' && payment_status !== 'All Status') {
      query += ' AND o.payment_status = ?';
      params.push(payment_status);
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
      query += ' AND (o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace(
      'SELECT o.*, c.name as customer_name, c.phone as customer_phone',
      'SELECT COUNT(*) as total'
    );
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    const offset = (Number(page) - 1) * Number(limit);
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/today — Today's orders
router.get('/today', async (req, res) => {
  try {
    const { status, type, payment_status, search } = req.query;
    let query = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = CURDATE()
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

    if (payment_status && payment_status !== 'All' && payment_status !== 'All Status') {
      query += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (search) {
      query += ' AND (o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/today/stats — Today's order stats
router.get('/today/stats', async (req, res) => {
  try {
    const { status, type, payment_status, search } = req.query;

    let baseQuery = `
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = CURDATE()
    `;
    const params = [];

    if (status && status !== 'All' && status !== 'All Status') {
      baseQuery += ' AND o.status = ?';
      params.push(status);
    }

    if (type && type !== 'All' && type !== 'All Types') {
      baseQuery += ' AND o.order_type = ?';
      params.push(type);
    }

    if (payment_status && payment_status !== 'All' && payment_status !== 'All Status') {
      baseQuery += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (search) {
      baseQuery += ' AND (o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ totalOrders }]] = await pool.query(`SELECT COUNT(*) as totalOrders ${baseQuery}`, params);
    const [[{ totalRevenue }]] = await pool.query(`SELECT COALESCE(SUM(o.total), 0) as totalRevenue ${baseQuery}`, params);

    const pendingParams = [...params, 'Pending'];
    const [[{ pendingPayments }]] = await pool.query(
      `SELECT COUNT(*) as pendingPayments ${baseQuery} AND o.payment_status = ?`,
      pendingParams
    );

    const completedParams = [...params, 'Complete'];
    const [[{ completedOrders }]] = await pool.query(
      `SELECT COUNT(*) as completedOrders ${baseQuery} AND o.status = ?`,
      completedParams
    );

    res.json({ success: true, data: { totalOrders, totalRevenue, pendingPayments, completedOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/stats — Dashboard/billing stats
router.get('/stats', async (req, res) => {
  try {
    const { type, status, payment_status, start_date, end_date, search } = req.query;
    let baseQuery = `
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'All' && type !== 'All Types') {
      baseQuery += ' AND o.order_type = ?';
      params.push(String(type).toUpperCase());
    }

    if (status && status !== 'All' && status !== 'All Status') {
      baseQuery += ' AND o.status = ?';
      params.push(status);
    }

    if (payment_status && payment_status !== 'All' && payment_status !== 'All Status') {
      baseQuery += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (start_date) {
      baseQuery += ' AND o.order_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      baseQuery += ' AND o.order_date <= ?';
      params.push(end_date);
    }

    if (search) {
      baseQuery += ' AND (o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ totalOrders }]] = await pool.query(`SELECT COUNT(*) as totalOrders ${baseQuery}`, params);
    const [[{ totalRevenue }]] = await pool.query(`SELECT COALESCE(SUM(o.total), 0) as totalRevenue ${baseQuery}`, params);
    const [[{ todayBilling }]] = await pool.query(
      `SELECT COALESCE(SUM(o.total), 0) as todayBilling ${baseQuery} AND o.order_date = CURDATE()`,
      params
    );
    const [[{ pendingOrders }]] = await pool.query(
      `SELECT COUNT(*) as pendingOrders ${baseQuery} AND o.payment_status = ?`,
      [...params, 'Pending']
    );
    const [[{ completedOrders }]] = await pool.query(
      `SELECT COUNT(*) as completedOrders ${baseQuery} AND o.status = ?`,
      [...params, 'Complete']
    );

    res.json({ success: true, data: { totalOrders, totalRevenue, todayBilling, pendingOrders, completedOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id — Single order with items
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query(
      `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
             c.city as customer_city, c.state as customer_state, c.pincode as customer_pincode
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `,
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [items] = await pool.query(
      `
      SELECT oi.*, COALESCE(p.name, CONCAT('Product #', oi.product_id)) as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `,
      [req.params.id]
    );

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders — Create new order
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { customer_id, items, order_type, shipping = 0, discount = 0, notes, payment_status, status } = req.body;
    const normalizedOrderType = normalizeOrderType(order_type);
    const normalizedCustomerId = Number(customer_id);
    const normalizedPaymentStatus = validatePaymentStatus(payment_status);
    const normalizedStatus = validateOrderStatus(status || 'Pending');

    if (!normalizedCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer is required.' });
    }

    if (!['ONLINE', 'BILLING'].includes(normalizedOrderType)) {
      return res.status(400).json({ success: false, message: 'Invalid order type.' });
    }

    const { parsedItems, subTotal } = validateOrderItems(items);
    const { normalizedShipping, normalizedDiscount } = validateAmounts(shipping, discount);
    const total = subTotal + normalizedShipping - normalizedDiscount;

    if (total < 0) {
      throw createValidationError('Total amount cannot be negative.');
    }

    await connection.beginTransaction();

    if (normalizedOrderType === 'ONLINE') {
      const [[storeConfig = {}]] = await connection.query(
        'SELECT is_store_open, min_order_value FROM store_config WHERE id = 1 LIMIT 1'
      );

      if (Number(storeConfig.is_store_open ?? 1) !== 1) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Online ordering is currently unavailable.' });
      }

      const minimumOrderValue = Number(storeConfig.min_order_value ?? 0);
      if (subTotal < minimumOrderValue) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Minimum order value is ${minimumOrderValue}.`,
        });
      }
    }

    const orderNo = `ORD-${Date.now().toString().slice(-8)}`;
    const [result] = await connection.query(
      `INSERT INTO orders
        (order_no, customer_id, sub_total, shipping, discount, total, order_type, status, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        normalizedCustomerId,
        subTotal,
        normalizedShipping,
        normalizedDiscount,
        total,
        normalizedOrderType,
        normalizedStatus,
        normalizedPaymentStatus,
        notes?.trim() || null,
      ]
    );

    await insertOrderItems(connection, result.insertId, parsedItems);

    await connection.commit();
    res.status(201).json({ success: true, message: 'Order created', orderNo, id: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/orders/:id — Update existing billing order
router.put('/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { customer_id, items, shipping = 0, discount = 0, notes, status, payment_status } = req.body;
    const normalizedCustomerId = Number(customer_id);
    const normalizedPaymentStatus = validatePaymentStatus(payment_status);
    const normalizedStatus = validateOrderStatus(status || 'Pending');

    if (!normalizedCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer is required.' });
    }

    const { parsedItems, subTotal } = validateOrderItems(items);
    const { normalizedShipping, normalizedDiscount } = validateAmounts(shipping, discount);
    const total = subTotal + normalizedShipping - normalizedDiscount;

    if (total < 0) {
      throw createValidationError('Total amount cannot be negative.');
    }

    await connection.beginTransaction();
    await ensureBillingOrder(connection, req.params.id);

    await connection.query(
      `UPDATE orders
       SET customer_id = ?, sub_total = ?, shipping = ?, discount = ?, total = ?, status = ?, payment_status = ?, notes = ?
       WHERE id = ?`,
      [
        normalizedCustomerId,
        subTotal,
        normalizedShipping,
        normalizedDiscount,
        total,
        normalizedStatus,
        normalizedPaymentStatus,
        notes?.trim() || null,
        req.params.id,
      ]
    );

    await connection.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    await insertOrderItems(connection, req.params.id, parsedItems);

    await connection.commit();
    res.json({ success: true, message: 'Billing invoice updated' });
  } catch (error) {
    await connection.rollback();
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/orders/:id/status — Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const status = validateOrderStatus(req.body.status);
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/payment-status — Update payment status
router.put('/:id/payment-status', auth, async (req, res) => {
  try {
    const paymentStatus = validatePaymentStatus(req.body.payment_status);
    const [result] = await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, message: 'Payment status updated' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = router;
