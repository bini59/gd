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
}

module.exports = TestDatabase;