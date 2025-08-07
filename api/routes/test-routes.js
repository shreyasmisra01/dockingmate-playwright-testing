const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

function createTestRoutes(testManager) {
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

  // POST /api/tests/run - Run tests
  router.post('/run', [
    body('browser').optional().isIn(['chromium', 'firefox', 'webkit', 'all']),
    body('suite').optional().isString(),
    body('testFile').optional().isString(),
    body('headed').optional().isBoolean(),
    body('debug').optional().isBoolean(),
    body('reporter').optional().isString(),
    body('workers').optional().isInt({ min: 1, max: 10 }),
    body('timeout').optional().isInt({ min: 1000 }),
    body('retries').optional().isInt({ min: 0, max: 5 })
  ], handleValidationErrors, async (req, res) => {
    try {
      const options = req.body;
      const result = await testManager.runTests(options);
      
      res.status(202).json({
        message: 'Tests started successfully',
        ...result
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to start tests',
        message: error.message
      });
    }
  });

  // GET /api/tests/status/:runId - Get test run status
  router.get('/status/:runId', [
    param('runId').isUUID()
  ], handleValidationErrors, (req, res) => {
    const { runId } = req.params;
    const status = testManager.getTestStatus(runId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Test run not found'
      });
    }
    
    res.json(status);
  });

  // POST /api/tests/stop/:runId - Stop a running test
  router.post('/stop/:runId', [
    param('runId').isUUID()
  ], handleValidationErrors, async (req, res) => {
    try {
      const { runId } = req.params;
      const result = await testManager.stopTest(runId);
      
      res.json({
        message: 'Test stopped successfully',
        ...result
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to stop test',
        message: error.message
      });
    }
  });

  // GET /api/tests/running - Get all running tests
  router.get('/running', (req, res) => {
    const runningTests = testManager.getRunningTests();
    res.json({
      count: runningTests.length,
      tests: runningTests
    });
  });

  // GET /api/tests/history - Get test history
  router.get('/history', [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ], handleValidationErrors, (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = testManager.getTestHistory();
    const paginatedHistory = history.slice(offset, offset + limit);
    
    res.json({
      total: history.length,
      limit,
      offset,
      history: paginatedHistory
    });
  });

  // GET /api/tests/suites - Get available test suites
  router.get('/suites', async (req, res) => {
    try {
      const suites = await testManager.getTestSuites();
      res.json({
        suites
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get test suites',
        message: error.message
      });
    }
  });

  // GET /api/tests/list - Get all available tests
  router.get('/list', async (req, res) => {
    try {
      const tests = await testManager.getAvailableTests();
      res.json({
        tests
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get test list',
        message: error.message
      });
    }
  });

  // POST /api/tests/validate - Validate test configuration
  router.post('/validate', [
    body('browser').optional().isIn(['chromium', 'firefox', 'webkit', 'all']),
    body('suite').optional().isString(),
    body('testFile').optional().isString()
  ], handleValidationErrors, async (req, res) => {
    try {
      const { suite, testFile } = req.body;
      const availableTests = await testManager.getAvailableTests();
      
      const validation = {
        valid: true,
        errors: []
      };

      // Validate suite exists
      if (suite && !availableTests[suite]) {
        validation.valid = false;
        validation.errors.push(`Test suite '${suite}' does not exist`);
      }

      // Validate test file exists
      if (testFile) {
        const fileExists = Object.values(availableTests)
          .flat()
          .some(test => test.path === testFile);
        
        if (!fileExists) {
          validation.valid = false;
          validation.errors.push(`Test file '${testFile}' does not exist`);
        }
      }

      res.json(validation);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to validate configuration',
        message: error.message
      });
    }
  });

  // GET /api/tests/browsers - Get available browsers
  router.get('/browsers', (req, res) => {
    res.json({
      browsers: [
        { name: 'chromium', displayName: 'Chromium', default: true },
        { name: 'firefox', displayName: 'Firefox', default: false },
        { name: 'webkit', displayName: 'WebKit', default: false },
        { name: 'all', displayName: 'All Browsers', default: false }
      ]
    });
  });

  // GET /api/tests/reporters - Get available reporters
  router.get('/reporters', (req, res) => {
    res.json({
      reporters: [
        { name: 'json', displayName: 'JSON', default: true },
        { name: 'html', displayName: 'HTML', default: false },
        { name: 'junit', displayName: 'JUnit XML', default: false },
        { name: 'line', displayName: 'Line', default: false },
        { name: 'dot', displayName: 'Dot', default: false }
      ]
    });
  });

  // GET /api/tests/stats - Get test execution statistics
  router.get('/stats', (req, res) => {
    const history = testManager.getTestHistory();
    const running = testManager.getRunningTests();
    
    const stats = {
      total: history.length,
      running: running.length,
      completed: history.filter(t => t.status === 'completed').length,
      failed: history.filter(t => t.status === 'failed').length,
      stopped: history.filter(t => t.status === 'stopped').length,
      avgDuration: 0,
      successRate: 0
    };

    const completedTests = history.filter(t => t.duration);
    if (completedTests.length > 0) {
      stats.avgDuration = completedTests.reduce((sum, t) => sum + t.duration, 0) / completedTests.length;
    }

    if (stats.total > 0) {
      stats.successRate = (stats.completed / stats.total) * 100;
    }

    res.json(stats);
  });

  return router;
}

module.exports = createTestRoutes;