const axios = require('axios');
const axiosRetry = require('axios-retry');
const logger = require('../config/logger');
const pool = require('../config/database');

class CharacterMapping {
  constructor() {
    this.apiKey = process.env.NEOPLE_API_KEY;
    this.baseURL = process.env.NEOPLE_API_BASE_URL || 'https://api.neople.co.kr';
    
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
        retryDelay: axiosRetry.exponentialDelay
      });
    } else {
      // axios-retry v4+ requires different import
      const axiosRetryLib = axiosRetry.default || axiosRetry;
      axiosRetryLib(this.client, {
        retries: 3,
        retryDelay: axiosRetryLib.exponentialDelay
      });
    }
  }

  async getCharacterDetail(characterId) {
    try {
      const response = await this.client.get(`/df/characters/${characterId}`);
      const characterData = response.data;

      if (!characterData.characterId) {
        throw new Error('Invalid character data received');
      }

      return {
        characterId: characterData.characterId,
        characterName: characterData.characterName,
        jobName: characterData.jobName,
        adventureFame: characterData.adventureFame,
        serverId: characterData.serverId,
        accountId: characterData.accountId
      };

    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Character not found');
      }
      throw new Error(`Failed to get character detail: ${error.message}`);
    }
  }

  async groupByAccount(charactersData) {
    const grouped = {};
    
    for (const character of charactersData) {
      if (!character.accountId) {
        logger.warn('Character has no accountId, skipping:', character.characterId);
        continue;
      }

      if (!grouped[character.accountId]) {
        grouped[character.accountId] = [];
      }
      
      grouped[character.accountId].push(character);
    }

    return grouped;
  }

  async processCharacter(characterData) {
    if (!characterData.accountId) {
      throw new Error('Missing accountId');
    }

    if (!characterData.characterId) {
      throw new Error('Missing characterId');
    }

    return await this.upsertCharacter(characterData);
  }

  async filterValidCharacters(charactersData) {
    return charactersData.filter(character => 
      character.accountId && 
      character.characterId && 
      character.characterName
    );
  }

  async upsertCharacter(characterData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO account_char (
          account_id, 
          char_id, 
          character_name, 
          fame, 
          server_id, 
          job_name, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (account_id, char_id) 
        DO UPDATE SET 
          character_name = EXCLUDED.character_name,
          fame = EXCLUDED.fame,
          server_id = EXCLUDED.server_id,
          job_name = EXCLUDED.job_name,
          updated_at = NOW()
        RETURNING *
      `, [
        characterData.accountId,
        characterData.characterId,
        characterData.characterName,
        characterData.adventureFame || characterData.fame,
        characterData.serverId,
        characterData.jobName
      ]);

      await client.query('COMMIT');
      
      logger.debug('Character upserted successfully:', {
        accountId: characterData.accountId,
        characterId: characterData.characterId
      });

      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to upsert character:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertBatch(charactersData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const results = [];
      
      for (const characterData of charactersData) {
        // Validate required fields
        if (!characterData.account_id || !characterData.char_id) {
          throw new Error('Missing required fields: account_id or char_id');
        }

        if (typeof characterData.fame !== 'number') {
          throw new Error('Fame must be a number');
        }

        const result = await client.query(`
          INSERT INTO account_char (
            account_id, 
            char_id, 
            character_name, 
            fame, 
            server_id, 
            job_name, 
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (account_id, char_id) 
          DO UPDATE SET 
            character_name = EXCLUDED.character_name,
            fame = EXCLUDED.fame,
            server_id = EXCLUDED.server_id,
            job_name = EXCLUDED.job_name,
            updated_at = NOW()
          RETURNING *
        `, [
          characterData.account_id,
          characterData.char_id,
          characterData.character_name,
          characterData.fame,
          characterData.server_id,
          characterData.job_name
        ]);

        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      
      logger.info(`Batch upserted ${results.length} characters`);
      return results;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Batch upsert failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getCharacter(accountId, characterId) {
    try {
      const result = await pool.query(
        'SELECT * FROM account_char WHERE account_id = $1 AND char_id = $2',
        [accountId, characterId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get character:', error);
      throw error;
    }
  }

  async getCharacterCount() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM account_char');
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to get character count:', error);
      throw error;
    }
  }
}

module.exports = new CharacterMapping();