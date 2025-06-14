const { Pool } = require('pg');

const config = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// 테스트 환경에서는 테스트 DB 사용
if (process.env.NODE_ENV === 'test') {
  config.connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
}

const pool = new Pool(config);

// 연결 확인
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;