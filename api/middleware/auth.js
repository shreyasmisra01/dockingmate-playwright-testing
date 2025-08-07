const rateLimit = require('express-rate-limit');

// API key authentication middleware (optional, for production use)
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;
  
  // Skip authentication in development mode or if no API key is set
  if (process.env.NODE_ENV === 'development' || !validApiKey) {
    return next();
  }
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the X-API-Key header'
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// Rate limiting for test execution endpoints
const testExecutionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 test runs per 5 minutes
  message: {
    error: 'Too many test runs',
    message: 'You can only start 10 test runs per 5 minutes. Please wait before starting another test.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Rate limiting for report endpoints
const reportLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit to 30 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Too many report requests. Please wait before making more requests.'
  }
});

// Logging middleware for test operations
const testOperationLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Request validation middleware
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: 'Content-Type must be application/json'
      });
    }
  }
  
  next();
};

// CORS preflight handler
const handleCors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

// Error handling middleware for async functions
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request timeout middleware
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        error: 'Request timeout',
        message: `Request timed out after ${timeout}ms`
      });
    });
    
    next();
  };
};

module.exports = {
  apiKeyAuth,
  testExecutionLimiter,
  reportLimiter,
  testOperationLogger,
  validateContentType,
  handleCors,
  asyncHandler,
  requestTimeout
};