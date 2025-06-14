const { Pool } = require('pg');

class TestDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 5
    });
  }

  async setup() {
    const client = await this.pool.connect();
    try {
      // 테스트 데이터베이스 초기화
      await client.query('DROP SCHEMA IF EXISTS public CASCADE');
      await client.query('CREATE SCHEMA public');
      
      // 스키마 생성
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
    } finally {
      client.release();
    }
  }

  async cleanup() {
    const client = await this.pool.connect();
    try {
      // 모든 테이블 데이터 삭제
      await client.query('TRUNCATE account_char, sync_fail, sync_logs CASCADE');
      await client.query('REFRESH MATERIALIZED VIEW char_eligibility');
    } finally {
      client.release();
    }
  }

  async teardown() {
    await this.pool.end();
  }

  getPool() {
    return this.pool;
  }

  async insertCharacters(testCharacters) {
    const client = await this.pool.connect();
    try {
      for (const char of testCharacters) {
        await client.query(`
          INSERT INTO account_char (account_id, char_id, character_name, fame, job_name, server_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (account_id, char_id) DO NOTHING
        `, [char.account_id, char.char_id, char.character_name, char.fame, char.job_name, char.server_id]);
      }
    } finally {
      client.release();
    }
  }

  async insertCharacter(characterData) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO account_char (account_id, char_id, character_name, fame, job_name, server_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (account_id, char_id) DO NOTHING
      `, [
        characterData.account_id,
        characterData.char_id,
        characterData.character_name,
        characterData.fame,
        characterData.job_name,
        characterData.server_id
      ]);
    } finally {
      client.release();
    }
  }

  async getCharacter(accountId, characterId) {
    const result = await this.pool.query(
      'SELECT * FROM account_char WHERE account_id = $1 AND char_id = $2',
      [accountId, characterId]
    );
    return result.rows[0] || null;
  }

  async updateCharacter(accountId, characterId, updates) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE account_char 
        SET character_name = $3, fame = $4, updated_at = NOW()
        WHERE account_id = $1 AND char_id = $2
      `, [accountId, characterId, updates.character_name, updates.fame]);
    } finally {
      client.release();
    }
  }

  async refreshEligibilityView() {
    await this.pool.query('REFRESH MATERIALIZED VIEW char_eligibility');
  }

  async getCharacterCount() {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM account_char');
    return parseInt(result.rows[0].count);
  }

  async getErrorLogs() {
    const result = await this.pool.query('SELECT * FROM sync_fail ORDER BY failed_at DESC');
    return result.rows;
  }

  async getSyncFailLogs() {
    const result = await this.pool.query('SELECT * FROM sync_fail ORDER BY failed_at DESC');
    return result.rows;
  }

  async updateCharacterFame(accountId, characterId, newFame) {
    await this.pool.query(
      'UPDATE account_char SET fame = $3, updated_at = NOW() WHERE account_id = $1 AND char_id = $2',
      [accountId, characterId, newFame]
    );
  }
}

module.exports = TestDatabase;