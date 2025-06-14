const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');

router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    const duration = Date.now() - startTime;
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: `${duration}ms`
    });
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

module.exports = router;