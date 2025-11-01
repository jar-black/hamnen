const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const appsRouter = require('./routes/apps');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// HTTP request logging with Morgan
app.use(morgan('combined', { stream: logger.stream }));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/apps', appsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Cache statistics endpoint
app.get('/api/cache/stats', (req, res) => {
  const cache = require('./utils/cache');
  res.json(cache.getStats());
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Hamnen backend server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log level: ${process.env.LOG_LEVEL || 'info'}`);
});
