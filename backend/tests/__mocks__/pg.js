// PostgreSQL mock for testing

const mockQuery = jest.fn();
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