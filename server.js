const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const testRoutes = require('./api/routes/test-routes');
const reportRoutes = require('./api/routes/report-routes');
const configRoutes = require('./api/routes/config-routes');
const TestManager = require('./api/services/test-manager');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(limiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for reports
app.use('/reports', express.static(path.join(__dirname, 'playwright-report')));
app.use('/test-results', express.static(path.join(__dirname, 'test-results')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Initialize TestManager with Socket.IO
const testManager = new TestManager(io);

// API Routes
app.use('/api/tests', testRoutes(testManager));
app.use('/api/reports', reportRoutes);
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'DockingMate Playwright Testing API Server',
    version: require('./package.json').version,
    endpoints: {
      health: 'GET /health',
      tests: {
        run: 'POST /api/tests/run',
        status: 'GET /api/tests/status/:runId',
        list: 'GET /api/tests/list',
        suites: 'GET /api/tests/suites',
        stop: 'POST /api/tests/stop/:runId'
      },
      reports: {
        latest: 'GET /api/reports/latest',
        history: 'GET /api/reports/history',
        download: 'GET /api/reports/download/:reportId'
      },
      config: {
        get: 'GET /api/config',
        update: 'PUT /api/config'
      }
    },
    websocket: {
      url: `ws://localhost:${PORT}`,
      events: ['test-started', 'test-progress', 'test-completed', 'test-failed']
    }
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join-test-room', (runId) => {
    socket.join(`test-${runId}`);
    console.log(`Client ${socket.id} joined test room: test-${runId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Ensure required directories exist
const requiredDirs = ['test-results', 'playwright-report', 'logs'];
requiredDirs.forEach(dir => {
  fs.ensureDirSync(path.join(__dirname, dir));
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 DockingMate Playwright Testing API Server`);
  console.log(`📍 Server running on http://${HOST}:${PORT}`);
  console.log(`🔗 WebSocket available on ws://${HOST}:${PORT}`);
  console.log(`📊 Reports available at http://${HOST}:${PORT}/reports`);
  console.log(`🏥 Health check at http://${HOST}:${PORT}/health`);
  console.log(`📚 API documentation at http://${HOST}:${PORT}`);
});

module.exports = { app, server, io };