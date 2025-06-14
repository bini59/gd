// PostgreSQL mock for testing

const mockQuery = jest.fn((sql, params) => {
  // Mock different SQL operations with realistic PostgreSQL responses
  if (sql && typeof sql === 'string') {
    // INSERT operations
    if (sql.includes('INSERT INTO sync_logs')) {
      return Promise.resolve({
        rows: [{ id: 1 }],
        command: 'INSERT',
        rowCount: 1
      });
    }
    
    if (sql.includes('INSERT INTO account_char')) {
      return Promise.resolve({
        rows: [],
        command: 'INSERT',
        rowCount: 1
      });
    }
    
    if (sql.includes('INSERT INTO sync_fail')) {
      return Promise.resolve({
        rows: [{ id: 1 }],
        command: 'INSERT', 
        rowCount: 1
      });
    }
    
    // UPDATE operations
    if (sql.includes('UPDATE sync_logs')) {
      return Promise.resolve({
        rows: [],
        command: 'UPDATE',
        rowCount: 1
      });
    }
    
    if (sql.includes('UPDATE account_char')) {
      return Promise.resolve({
        rows: [],
        command: 'UPDATE',
        rowCount: 1
      });
    }
    
    // SELECT operations
    if (sql.includes('SELECT') && sql.includes('char_eligibility')) {
      return Promise.resolve({
        rows: [
          {
            account_id: 'account_001',
            char_id: 'char_001',
            character_name: 'Test Character',
            fame: 60000,
            job_name: 'Test Job',
            nabel_eligible: true,
            nightmare_eligible: true,
            goddess_eligible: true
          }
        ],
        command: 'SELECT',
        rowCount: 1
      });
    }
    
    if (sql.includes('SELECT') && sql.includes('sync_logs')) {
      return Promise.resolve({
        rows: [
          {
            id: 1,
            status: 'success',
            message: 'Test sync completed',
            records_processed: 100,
            records_failed: 0,
            duration: 5000,
            created_at: new Date().toISOString()
          }
        ],
        command: 'SELECT',
        rowCount: 1
      });
    }
    
    if (sql.includes('SELECT refresh_char_eligibility')) {
      return Promise.resolve({
        rows: [],
        command: 'SELECT',
        rowCount: 0
      });
    }
    
    if (sql.includes('TRUNCATE') || sql.includes('DROP') || sql.includes('CREATE')) {
      return Promise.resolve({
        rows: [],
        command: sql.split(' ')[0].toUpperCase(),
        rowCount: 0
      });
    }
    
    if (sql.includes('REFRESH MATERIALIZED VIEW')) {
      return Promise.resolve({
        rows: [],
        command: 'REFRESH',
        rowCount: 0
      });
    }
  }
  
  // Default response for any other queries
  return Promise.resolve({
    rows: [],
    command: 'SELECT',
    rowCount: 0
  });
});

const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockEnd = jest.fn();
const mockOn = jest.fn();

const mockClient = {
  query: mockQuery,
  release: mockRelease,
  on: mockOn
};

const mockPool = {
  query: mockQuery,
  connect: mockConnect.mockResolvedValue(mockClient),
  end: mockEnd,
  on: mockOn
};

const Pool = jest.fn(() => mockPool);

module.exports = {
  Pool,
  // Export mocks for test setup
  __mockPool: mockPool,
  __mockClient: mockClient,
  __mockQuery: mockQuery,
  __mockConnect: mockConnect,
  __mockRelease: mockRelease,
  __mockEnd: mockEnd
};