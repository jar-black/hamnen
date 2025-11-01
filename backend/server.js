const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const appsRouter = require('./routes/apps');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Make io available to routes/controllers
app.set('io', io);

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

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });

  // Allow clients to subscribe to specific app updates
  socket.on('subscribe:app', (appId) => {
    socket.join(`app:${appId}`);
    logger.debug(`Client ${socket.id} subscribed to app: ${appId}`);
  });

  socket.on('unsubscribe:app', (appId) => {
    socket.leave(`app:${appId}`);
    logger.debug(`Client ${socket.id} unsubscribed from app: ${appId}`);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Hamnen backend server running on port ${PORT}`);
  logger.info(`WebSocket server enabled`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log level: ${process.env.LOG_LEVEL || 'http'}`);
});
