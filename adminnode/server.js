const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection (auto-tests on startup)
require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// API ROUTES
// ==========================================
const apiKeyAuth = require('./middleware/apiKeyAuth');

const registerApiRoute = (paths, routePath) => {
  const router = require(routePath);
  paths.forEach((apiPath) => {
    if (apiPath.includes('Get')) {
      app.use(apiPath, apiKeyAuth, router);
    } else {
      app.use(apiPath, router);
    }
  });
};

registerApiRoute(['/api/auth'], './routes/auth');
registerApiRoute(['/api/dashboard', '/api/Getdashboard'], './routes/dashboard');
registerApiRoute(['/api/categories', '/api/Getcategories'], './routes/categories');
registerApiRoute(['/api/products', '/api/Getproducts'], './routes/products');
registerApiRoute(['/api/orders', '/api/Getorders'], './routes/orders');
registerApiRoute(['/api/customers', '/api/Getcustomers'], './routes/customers');
registerApiRoute(['/api/banners', '/api/Getbanners'], './routes/banners');
registerApiRoute(['/api/settings', '/api/Getsettings'], './routes/settings');

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '🎆 Crackers Admin Panel Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`\n🎆 ==========================================`);
  console.log(`   Crackers Admin Panel — Backend Server`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health`);
  console.log(`   Database:   ${process.env.DB_NAME || 'crackers_shop'}`);
  console.log(`🎆 ==========================================\n`);
});
