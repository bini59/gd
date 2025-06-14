const pool = require('../config/database');
const logger = require('../config/logger');
const EligibilityEngine = require('../services/EligibilityEngine');

class AccountsController {
  async getAllAccounts(req, res, next) {
    try {
      const result = await pool.query(`
        SELECT 
          account_id,
          COUNT(*) as character_count,
          MAX(fame) as max_fame,
          AVG(fame) as avg_fame
        FROM account_char 
        GROUP BY account_id 
        ORDER BY max_fame DESC
      `);

      const accounts = result.rows.map(row => ({
        accountId: row.account_id,
        characterCount: parseInt(row.character_count),
        maxFame: row.max_fame,
        avgFame: Math.round(row.avg_fame)
      }));

      res.json({
        accounts,
        total: accounts.length
      });

    } catch (error) {
      logger.error('Failed to get accounts:', error);
      next(error);
    }
  }

  async getAccountEligibles(req, res, next) {
    try {
      const { id: accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({ error: 'Account ID is required' });
      }

      // Check if account exists
      const accountCheck = await pool.query(
        'SELECT COUNT(*) as count FROM account_char WHERE account_id = $1',
        [accountId]
      );

      if (parseInt(accountCheck.rows[0].count) === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get characters for the account
      const charactersResult = await pool.query(`
        SELECT 
          char_id,
          character_name,
          fame,
          job_name,
          server_id,
          updated_at
        FROM account_char 
        WHERE account_id = $1 
        ORDER BY fame DESC
      `, [accountId]);

      const characters = charactersResult.rows.map(row => ({
        characterId: row.char_id,
        characterName: row.character_name,
        fame: row.fame,
        jobName: row.job_name,
        serverId: row.server_id,
        updatedAt: row.updated_at
      }));

      // Calculate eligibility for all characters
      const accountEligibility = EligibilityEngine.calculateAccountEligibility(characters);

      // Format response according to API spec
      const response = {
        accountId,
        characters: accountEligibility.characters.map(char => ({
          charId: char.characterId,
          name: char.characterName,
          job: char.jobName,
          fame: char.fame,
          eligibility: {
            nabeel: char.eligibility.nabeel,
            nightmare: char.eligibility.nightmare,
            goddess: char.eligibility.goddess,
            azure: char.eligibility.azure,
            venus: char.eligibility.venus
          },
          slotStatus: {
            nightmareRank: char.slotStatus.nightmareRank || 0,
            venusRank: char.slotStatus.venusRank || 0
          }
        }))
      };

      // Set cache headers (10 minutes)
      res.set('Cache-Control', 'public, max-age=600');

      res.json(response);

    } catch (error) {
      logger.error('Failed to get account eligibles:', error);
      next(error);
    }
  }

  async getAccountSummary(req, res, next) {
    try {
      const { id: accountId } = req.params;

      // Get account summary with eligibility info from materialized view
      const result = await pool.query(`
        SELECT 
          account_id,
          char_id,
          character_name,
          fame,
          job_name,
          nabeel_eligible,
          nightmare_eligible,
          goddess_eligible,
          azure_eligible,
          venus_eligible,
          rank_in_account
        FROM char_eligibility 
        WHERE account_id = $1 
        ORDER BY fame DESC
      `, [accountId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const characters = result.rows;
      const topFameChar = characters[0];

      // Calculate slot status
      const nightmareEligible = characters.filter(c => c.nightmare_eligible && c.rank_in_account <= 4);
      const venusEligible = characters.filter(c => c.venus_eligible && c.rank_in_account <= 1);

      const summary = {
        accountId,
        characterCount: characters.length,
        topFame: topFameChar.fame,
        topFameCharacter: {
          name: topFameChar.character_name,
          job: topFameChar.job_name,
          fame: topFameChar.fame
        },
        slotStatus: {
          nightmare: {
            eligible: nightmareEligible.length,
            limit: 4
          },
          venus: {
            eligible: venusEligible.length,
            limit: 1
          }
        },
        contentEligibility: {
          nabeel: characters.some(c => c.nabeel_eligible),
          nightmare: nightmareEligible.length > 0,
          goddess: characters.some(c => c.goddess_eligible),
          azure: characters.some(c => c.azure_eligible),
          venus: venusEligible.length > 0
        }
      };

      res.json(summary);

    } catch (error) {
      logger.error('Failed to get account summary:', error);
      next(error);
    }
  }

  async searchAccounts(req, res, next) {
    try {
      const { q: searchTerm, limit = 20, offset = 0 } = req.query;

      if (!searchTerm || searchTerm.length < 2) {
        return res.status(400).json({ error: 'Search term must be at least 2 characters' });
      }

      const result = await pool.query(`
        SELECT DISTINCT
          account_id,
          COUNT(*) OVER (PARTITION BY account_id) as character_count,
          MAX(fame) OVER (PARTITION BY account_id) as max_fame
        FROM account_char 
        WHERE 
          character_name ILIKE $1 OR 
          job_name ILIKE $1 OR
          account_id ILIKE $1
        ORDER BY max_fame DESC
        LIMIT $2 OFFSET $3
      `, [`%${searchTerm}%`, limit, offset]);

      const accounts = result.rows.map(row => ({
        accountId: row.account_id,
        characterCount: parseInt(row.character_count),
        maxFame: row.max_fame
      }));

      res.json({
        accounts,
        searchTerm,
        total: accounts.length
      });

    } catch (error) {
      logger.error('Failed to search accounts:', error);
      next(error);
    }
  }
}

module.exports = new AccountsController();