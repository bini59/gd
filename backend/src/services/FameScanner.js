const axios = require('axios');
const axiosRetry = require('axios-retry');
const logger = require('../config/logger');
const pool = require('../config/database');

class FameScanner {
  constructor() {
    this.apiKey = process.env.NEOPLE_API_KEY;
    this.baseURL = process.env.NEOPLE_API_BASE_URL || 'https://api.neople.co.kr';
    this.isRunning = false;
    
    // Configure axios with retry
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        apikey: this.apiKey
      }
    });
    
    if (typeof axiosRetry === 'function') {
      axiosRetry(this.client, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) => {
          return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                 (error.response && error.response.status >= 500);
        }
      });
    } else {
      // axios-retry v4+ requires different import
      const axiosRetryLib = axiosRetry.default || axiosRetry;
      axiosRetryLib(this.client, {
        retries: 3,
        retryDelay: axiosRetryLib.exponentialDelay,
        retryCondition: (error) => {
          return axiosRetryLib.isNetworkOrIdempotentRequestError(error) ||
                 (error.response && error.response.status >= 500);
        }
      });
    }
  }

  async startManualSync(user) {
    if (!user || user.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    if (this.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;

    try {
      // Log sync start
      const syncLogResult = await pool.query(
        'INSERT INTO sync_logs (status, message) VALUES ($1, $2) RETURNING id',
        ['running', 'Manual sync started']
      );
      const syncLogId = syncLogResult?.rows?.[0]?.id || 1;

      logger.info('Manual sync started', { syncLogId });

      // Scan all fame ranges
      const fameRanges = this.generateFameRanges(40000, 62000, 10000);
      
      for (const [minFame, maxFame] of fameRanges) {
        try {
          const result = await this.scanFameRange(minFame, maxFame);
          processedCount += result.processedCount;
          failedCount += result.failedCount;
        } catch (error) {
          logger.error(`Failed to scan fame range ${minFame}-${maxFame}:`, error);
          failedCount++;
        }
      }

      const duration = Date.now() - startTime;

      // Update sync log
      await pool.query(
        'UPDATE sync_logs SET status = $1, message = $2, records_processed = $3, records_failed = $4, duration = $5 WHERE id = $6',
        ['success', 'Manual sync completed', processedCount, failedCount, duration, syncLogId]
      );

      // Refresh materialized view
      await pool.query('SELECT refresh_char_eligibility()');

      logger.info('Manual sync completed', { 
        processedCount, 
        failedCount, 
        duration: `${duration}ms` 
      });

      return {
        success: true,
        message: 'Sync completed successfully',
        stats: {
          processedCount,
          failedCount,
          duration
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log sync failure
      await pool.query(
        'UPDATE sync_logs SET status = $1, message = $2, duration = $3 WHERE status = $4',
        ['failed', `Sync failed: ${error.message}`, duration, 'running']
      );

      logger.error('Manual sync failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  generateFameRanges(minFame, maxFame, chunkSize) {
    const ranges = [];
    for (let start = minFame; start < maxFame; start += chunkSize) {
      const end = Math.min(start + chunkSize, maxFame);
      ranges.push([start, end]);
    }
    return ranges;
  }

  async scanFameRange(minFame, maxFame) {
    logger.info(`Scanning fame range: ${minFame} - ${maxFame}`);
    
    let processedCount = 0;
    let failedCount = 0;
    let next = null;

    do {
      try {
        const params = {
          limit: 200,
          adventureFame: `${minFame},${maxFame}`
        };

        if (next) {
          params.next = next;
        }

        const response = await this.client.get('/df/servers/bakal/characters', { params });
        const { rows, next: nextToken } = response.data;

        // Process each character
        for (const character of rows) {
          try {
            await this.processCharacter(character.characterId);
            processedCount++;
          } catch (error) {
            logger.error(`Failed to process character ${character.characterId}:`, error);
            await this.logFailedCharacter(character.characterId, error);
            failedCount++;
          }
        }

        next = nextToken;
        
        // Rate limiting - respect API limits
        await this.delay(100);

      } catch (error) {
        logger.error('Failed to fetch characters:', error);
        throw new Error(`Neople API Error: ${error.message}`);
      }
    } while (next);

    return { processedCount, failedCount };
  }

  async processCharacter(characterId) {
    try {
      const response = await this.client.get(`/df/characters/${characterId}`);
      const characterData = response.data;

      // Insert or update character
      await pool.query(`
        INSERT INTO account_char (account_id, char_id, character_name, fame, server_id, job_name, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (account_id, char_id) 
        DO UPDATE SET 
          character_name = EXCLUDED.character_name,
          fame = EXCLUDED.fame,
          server_id = EXCLUDED.server_id,
          job_name = EXCLUDED.job_name,
          updated_at = NOW()
      `, [
        characterData.accountId,
        characterData.characterId,
        characterData.characterName,
        characterData.adventureFame,
        characterData.serverId,
        characterData.jobName
      ]);

      return characterData;

    } catch (error) {
      throw new Error(`Character processing failed: ${error.message}`);
    }
  }

  async processBatch(characterIds) {
    const results = {
      successCount: 0,
      failCount: 0,
      processed: []
    };

    for (const characterId of characterIds) {
      try {
        const character = await this.processCharacter(characterId);
        results.successCount++;
        results.processed.push(character);
      } catch (error) {
        await this.logFailedCharacter(characterId, error);
        results.failCount++;
      }
    }

    return results;
  }

  async logFailedCharacter(characterId, error) {
    try {
      await pool.query(
        'INSERT INTO sync_fail (char_id, error_message, error_data, failed_at) VALUES ($1, $2, $3, NOW())',
        [characterId, error.message, JSON.stringify({ error: error.stack })]
      );
    } catch (logError) {
      logger.error('Failed to log character failure:', logError);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new FameScanner();