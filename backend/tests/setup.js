// Jest 전역 설정
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEOPLE_API_KEY = 'test_api_key';
process.env.NEOPLE_API_BASE_URL = 'https://api.neople.co.kr';
process.env.JWT_SECRET = 'test_jwt_secret';

// Mock pg module globally
jest.mock('pg');

// 전역 테스트 타임아웃 설정
jest.setTimeout(10000);

// Console 출력 제한 (테스트 중 로그 스팸 방지)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 테스트 후 정리 함수
afterAll(async () => {
  // Cleanup any global resources
  jest.clearAllMocks();
});