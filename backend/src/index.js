const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
  process.exit(1);
});

module.exports = server;