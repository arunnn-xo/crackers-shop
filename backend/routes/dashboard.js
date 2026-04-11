const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/dashboard — Dashboard stats
router.get('/', async (req, res) => {
  try {
    const [[{ totalCategories }]] = await pool.query('SELECT COUNT(*) as totalCategories FROM categories');
    const [[{ totalBanners }]] = await pool.query('SELECT COUNT(*) as totalBanners FROM banners');
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products');
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalCustomers }]] = await pool.query('SELECT COUNT(*) as totalCustomers FROM customers');
    const [[{ totalIncome }]] = await pool.query('SELECT COALESCE(SUM(total), 0) as totalIncome FROM orders WHERE payment_status = "Paid"');
    
    const [storeConfig] = await pool.query('SELECT global_discount FROM store_config LIMIT 1');
    const globalDiscount = storeConfig[0]?.global_discount || 0;

    // Monthly revenue for chart
    const [revenueData] = await pool.query(`
      SELECT 
        DATE_FORMAT(order_date, '%b') as name,
        COALESCE(SUM(total), 0) as revenue
      FROM orders 
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY MONTH(order_date), DATE_FORMAT(order_date, '%b')
      ORDER BY MONTH(order_date)
    `);

    // Order status distribution
    const [statusData] = await pool.query(`
      SELECT status as name, COUNT(*) as value FROM orders GROUP BY status
    `);

    // Recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.*, c.name as customer_name FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.created_at DESC LIMIT 5
    `);

    // New customers
    const [newCustomers] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      data: {
        stats: { totalCategories, totalBanners, globalDiscount: `${globalDiscount}%`, totalProducts, totalOrders, totalIncome },
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
