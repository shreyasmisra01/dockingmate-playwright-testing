require('dotenv').config();
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/config - Get current configuration
router.get('/', async (req, res) => {
  try {
    const config = {
      // Environment variables
      environment: {
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
        headless: process.env.HEADLESS === 'true',
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      
      // Test configuration
      test: {
        testUserEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
        testBerthName: process.env.TEST_BERTH_NAME || 'Test Berth',
        testLocation: process.env.TEST_LOCATION || 'Test Marina',
        defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT) || 30000,
        navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT) || 30000
      },
      
      // Server configuration
      server: {
        port: parseInt(process.env.PORT) || 3001,
        host: process.env.HOST || '0.0.0.0',
        corsOrigin: process.env.CORS_ORIGIN || '*'
      }
    };

    // Read Playwright config if it exists
    const playwrightConfigPath = path.join(__dirname, '../../playwright.config.js');
    if (await fs.pathExists(playwrightConfigPath)) {
      try {
        // Note: This is a simplified approach. In production, you might want to use a proper JS parser
        const configContent = await fs.readFile(playwrightConfigPath, 'utf8');
        config.playwrightConfig = {
          exists: true,
          path: playwrightConfigPath,
          lastModified: (await fs.stat(playwrightConfigPath)).mtime
        };
      } catch (error) {
        console.error('Error reading Playwright config:', error);
      }
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get configuration',
      message: error.message
    });
  }
});

// PUT /api/config - Update configuration
router.put('/', [
  body('environment.baseUrl').optional().isURL(),
  body('environment.apiBaseUrl').optional().isURL(),
  body('environment.headless').optional().isBoolean(),
  body('test.testUserEmail').optional().isEmail(),
  body('test.defaultTimeout').optional().isInt({ min: 1000, max: 300000 }),
  body('test.navigationTimeout').optional().isInt({ min: 1000, max: 300000 }),
  body('server.port').optional().isInt({ min: 1, max: 65535 }),
  body('server.host').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const updates = req.body;
    
    // Create .env content from updates
    const envUpdates = {};
    
    if (updates.environment) {
      if (updates.environment.baseUrl) envUpdates.BASE_URL = updates.environment.baseUrl;
      if (updates.environment.apiBaseUrl) envUpdates.API_BASE_URL = updates.environment.apiBaseUrl;
      if (typeof updates.environment.headless === 'boolean') envUpdates.HEADLESS = updates.environment.headless.toString();
    }
    
    if (updates.test) {
      if (updates.test.testUserEmail) envUpdates.TEST_USER_EMAIL = updates.test.testUserEmail;
      if (updates.test.testBerthName) envUpdates.TEST_BERTH_NAME = updates.test.testBerthName;
      if (updates.test.testLocation) envUpdates.TEST_LOCATION = updates.test.testLocation;
      if (updates.test.defaultTimeout) envUpdates.DEFAULT_TIMEOUT = updates.test.defaultTimeout.toString();
      if (updates.test.navigationTimeout) envUpdates.NAVIGATION_TIMEOUT = updates.test.navigationTimeout.toString();
    }
    
    if (updates.server) {
      if (updates.server.port) envUpdates.PORT = updates.server.port.toString();
      if (updates.server.host) envUpdates.HOST = updates.server.host;
      if (updates.server.corsOrigin) envUpdates.CORS_ORIGIN = updates.server.corsOrigin;
    }
    
    // Read current .env file
    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';
    
    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, 'utf8');
    }
    
    // Update or add environment variables
    const envLines = envContent.split('\n');
    const updatedLines = [];
    const updatedKeys = new Set();
    
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key] = trimmedLine.split('=');
        if (envUpdates.hasOwnProperty(key)) {
          updatedLines.push(`${key}=${envUpdates[key]}`);
          updatedKeys.add(key);
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    // Add new environment variables
    for (const [key, value] of Object.entries(envUpdates)) {
      if (!updatedKeys.has(key)) {
        updatedLines.push(`${key}=${value}`);
      }
    }
    
    // Write updated .env file
    await fs.writeFile(envPath, updatedLines.join('\n'));
    
    res.json({
      message: 'Configuration updated successfully',
      updated: envUpdates,
      note: 'Server restart may be required for some changes to take effect'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error.message
    });
  }
});

// GET /api/config/env - Get environment variables
router.get('/env', (req, res) => {
  const envVars = {
    BASE_URL: process.env.BASE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
    TEST_BERTH_NAME: process.env.TEST_BERTH_NAME,
    TEST_LOCATION: process.env.TEST_LOCATION,
    HEADLESS: process.env.HEADLESS,
    DEFAULT_TIMEOUT: process.env.DEFAULT_TIMEOUT,
    NAVIGATION_TIMEOUT: process.env.NAVIGATION_TIMEOUT,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    NODE_ENV: process.env.NODE_ENV
  };
  
  res.json({
    environment: envVars
  });
});

// POST /api/config/reset - Reset configuration to defaults
router.post('/reset', async (req, res) => {
  try {
    const defaultConfig = `# Base URL for the application
BASE_URL=http://localhost:3000

# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# API endpoints
API_BASE_URL=http://localhost:8000

# Test data
TEST_BERTH_NAME=Test Berth
TEST_LOCATION=Test Marina

# Browser settings
HEADLESS=true
SLOW_MO=0

# Timeouts (in milliseconds)
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000`;

    const envPath = path.join(__dirname, '../../.env');
    await fs.writeFile(envPath, defaultConfig);
    
    res.json({
      message: 'Configuration reset to defaults',
      note: 'Server restart required for changes to take effect'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset configuration',
      message: error.message
    });
  }
});

// GET /api/config/playwright - Get Playwright configuration
router.get('/playwright', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../playwright.config.js');
    
    if (!(await fs.pathExists(configPath))) {
      return res.status(404).json({
        error: 'Playwright configuration not found'
      });
    }
    
    const content = await fs.readFile(configPath, 'utf8');
    const stats = await fs.stat(configPath);
    
    res.json({
      path: configPath,
      lastModified: stats.mtime,
      size: stats.size,
      content: content
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Playwright configuration',
      message: error.message
    });
  }
});

// GET /api/config/validate - Validate current configuration
router.get('/validate', async (req, res) => {
  try {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Validate required environment variables
    const requiredVars = ['BASE_URL', 'TEST_USER_EMAIL'];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        validation.valid = false;
        validation.errors.push(`Missing required environment variable: ${varName}`);
      }
    }
    
    // Validate URLs
    const urlVars = ['BASE_URL', 'API_BASE_URL'];
    
    for (const varName of urlVars) {
      const url = process.env[varName];
      if (url) {
        try {
          new URL(url);
        } catch {
          validation.valid = false;
          validation.errors.push(`Invalid URL in ${varName}: ${url}`);
        }
      }
    }
    
    // Validate timeouts
    const timeoutVars = ['DEFAULT_TIMEOUT', 'NAVIGATION_TIMEOUT'];
    
    for (const varName of timeoutVars) {
      const timeout = process.env[varName];
      if (timeout) {
        const timeoutValue = parseInt(timeout);
        if (isNaN(timeoutValue) || timeoutValue < 1000 || timeoutValue > 300000) {
          validation.valid = false;
          validation.errors.push(`Invalid timeout in ${varName}: ${timeout} (should be between 1000-300000ms)`);
        }
      }
    }
    
    // Check if Playwright config exists
    const playwrightConfigPath = path.join(__dirname, '../../playwright.config.js');
    if (!(await fs.pathExists(playwrightConfigPath))) {
      validation.warnings.push('Playwright configuration file not found');
    }
    
    // Check if test directories exist
    const testDir = path.join(__dirname, '../../tests');
    if (!(await fs.pathExists(testDir))) {
      validation.valid = false;
      validation.errors.push('Tests directory not found');
    }
    
    res.json(validation);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate configuration',
      message: error.message
    });
  }
});

module.exports = router;