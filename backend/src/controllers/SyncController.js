const pool = require('../config/database');
const logger = require('../config/logger');
const FameScanner = require('../services/FameScanner');

class SyncController {
  async runSync(req, res, next) {
    try {
      // Simple admin check - in production this would use proper JWT validation
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      
      // Mock admin validation - replace with real JWT validation
      if (token !== 'valid_admin_token') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const user = { role: 'admin' }; // Mock user object

      const result = await FameScanner.startManualSync(user);
      
      res.json(result);

    } catch (error) {
      if (error.message === 'Sync already in progress') {
        return res.status(409).json({ error: error.message });
      }
      
      if (error.message === 'Insufficient permissions') {
        return res.status(403).json({ error: error.message });
      }

      logger.error('Sync execution failed:', error);
      next(error);
    }
  }

  async getSyncLogs(req, res, next) {
    try {
      // Simple admin check
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      if (token !== 'valid_admin_token') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query('SELECT COUNT(*) as total FROM sync_logs');
      const total = parseInt(countResult?.rows?.[0]?.total || 0);

      // Get logs with pagination
      const logsResult = await pool.query(`
        SELECT 
          id,
          status,
          message,
          records_processed,
          records_failed,
          duration,
          created_at
        FROM sync_logs 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const logs = (logsResult?.rows || []).map(row => ({
        id: row.id,
        status: row.status,
        message: row.message,
        records_processed: row.records_processed || 0,
        records_failed: row.records_failed || 0,
        duration: row.duration,
        created_at: row.created_at
      }));

      res.json({
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Failed to get sync logs:', error);
      next(error);
    }
  }

  async getSyncStatus(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const isRunning = FameScanner.isRunning;
      
      // Get last sync info
      const lastSyncResult = await pool.query(`
        SELECT 
          status,
          message,
          records_processed,
          records_failed,
          duration,
          created_at
        FROM sync_logs 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      const lastSync = lastSyncResult?.rows?.[0] || null;

      // Get sync statistics
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_syncs,
          COUNT(*) FILTER (WHERE status = 'success') as successful_syncs,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
          AVG(duration) FILTER (WHERE duration IS NOT NULL) as avg_duration
        FROM sync_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
      `);

      const stats = statsResult?.rows?.[0] || {};

      res.json({
        isRunning,
        lastSync: lastSync ? {
          status: lastSync.status,
          message: lastSync.message,
          recordsProcessed: lastSync.records_processed || 0,
          recordsFailed: lastSync.records_failed || 0,
          duration: lastSync.duration,
          createdAt: lastSync.created_at
        } : null,
        statistics: {
          totalSyncs: parseInt(stats.total_syncs),
          successfulSyncs: parseInt(stats.successful_syncs),
          failedSyncs: parseInt(stats.failed_syncs),
          successRate: stats.total_syncs > 0 
            ? Math.round((stats.successful_syncs / stats.total_syncs) * 100) 
            : 0,
          avgDuration: stats.avg_duration ? Math.round(stats.avg_duration) : null
        }
      });

    } catch (error) {
      logger.error('Failed to get sync status:', error);
      next(error);
    }
  }

  async getSyncFailLogs(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const result = await pool.query(`
        SELECT 
          id,
          char_id,
          error_message,
          error_data,
          failed_at
        FROM sync_fail 
        ORDER BY failed_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const failLogs = (result?.rows || []).map(row => ({
        id: row.id,
        characterId: row.char_id,
        errorMessage: row.error_message,
        errorData: row.error_data,
        failedAt: row.failed_at
      }));

      res.json({ failLogs });

    } catch (error) {
      logger.error('Failed to get sync fail logs:', error);
      next(error);
    }
  }
}

module.exports = new SyncController();