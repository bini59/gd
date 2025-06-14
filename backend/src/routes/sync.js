const express = require('express');
const router = express.Router();
const SyncController = require('../controllers/SyncController');

// POST /api/sync/run - Run manual sync
router.post('/run', SyncController.runSync);

// GET /api/sync/logs - Get sync logs
router.get('/logs', SyncController.getSyncLogs);

// GET /api/sync/status - Get current sync status
router.get('/status', SyncController.getSyncStatus);

// GET /api/sync/fail-logs - Get sync failure logs
router.get('/fail-logs', SyncController.getSyncFailLogs);

module.exports = router;