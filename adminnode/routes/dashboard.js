const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// GET /api/dashboard — Dashboard stats
router.get('/', async (req, res) => {
  try {
    const [[{ totalCategories }]] = await pool.query('SELECT COUNT(*) as totalCategories FROM categories');
    const [[{ totalBanners }]] = await pool.query('SELECT COUNT(*) as totalBanners FROM banners');
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products');
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalCustomers }]] = await pool.query('SELECT COUNT(*) as totalCustomers FROM customers');
    // totalRevenue (all orders sum)
    const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders');

    // Screenshot metrics requirements
    const [[{ todaysBilling, todaysOrders }]] = await pool.query('SELECT COALESCE(SUM(total), 0) as todaysBilling, COUNT(*) as todaysOrders FROM orders WHERE order_date = CURDATE()');
    const [[{ pendingOrders }]] = await pool.query('SELECT COUNT(*) as pendingOrders FROM orders WHERE status = "Pending"');
    const [[{ completedOrders }]] = await pool.query('SELECT COUNT(*) as completedOrders FROM orders WHERE status = "Complete" OR status = "Delivered"');
    
    const [storeConfig] = await pool.query('SELECT global_discount FROM store_config LIMIT 1');
    const globalDiscount = Number(storeConfig[0]?.global_discount || 0);

    // Monthly revenue for chart
    const [revenueRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as monthKey,
        DATE_FORMAT(order_date, '%b') as name,
        COALESCE(SUM(total), 0) as revenue
      FROM orders 
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(order_date), MONTH(order_date), DATE_FORMAT(order_date, '%Y-%m'), DATE_FORMAT(order_date, '%b')
      ORDER BY YEAR(order_date), MONTH(order_date)
    `);

    const revenueMap = new Map(
      revenueRows.map((row) => [row.monthKey, { name: row.name, revenue: Number(row.revenue || 0) }])
    );

    const revenueData = [];
    const today = new Date();
    for (let index = 11; index >= 0; index -= 1) {
      const pointDate = new Date(today.getFullYear(), today.getMonth() - index, 1);
      const monthKey = getMonthKey(pointDate);
      const monthLabel = pointDate.toLocaleString('en-IN', { month: 'short' });
      const point = revenueMap.get(monthKey);
      revenueData.push({
        name: point?.name || monthLabel,
        revenue: point?.revenue || 0,
      });
    }

    // Order status distribution
    const [statusData] = await pool.query(`
      SELECT status as name, COUNT(*) as value FROM orders GROUP BY status
    `);

    // Recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.id, o.order_no, o.total, o.status, o.order_type, o.payment_status, o.created_at, c.name as customer_name
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.created_at DESC LIMIT 5
    `);

    // New customers
    const [newCustomers] = await pool.query(
      'SELECT id, name, city, phone, created_at FROM customers ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        stats: { totalCategories, totalBanners, globalDiscount, totalProducts, totalOrders, totalCustomers, totalRevenue, todaysBilling, todaysOrders, pendingOrders, completedOrders },
        revenueData,
        statusData,
        recentOrders,
        newCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
