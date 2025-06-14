// Jest 전역 설정
require('dotenv').config({ path: '.env.test' });

// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// 테스트용 데이터베이스 URL 설정
if (!process.env.TEST_DATABASE_URL) {
  process.env.TEST_DATABASE_URL = 'postgresql://postgres:password@localhost:5432/gd_test_db';
}

// 전역 테스트 타임아웃 설정
jest.setTimeout(30000);

// 테스트 후 정리 함수
afterAll(async () => {
  // DB 연결 정리
  const pool = require('../src/config/database');
  await pool.end();
});