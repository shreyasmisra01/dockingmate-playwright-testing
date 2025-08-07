const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TestManager {
  constructor(io) {
    this.io = io;
    this.runningTests = new Map();
    this.testHistory = [];
    this.maxHistorySize = 100;
  }

  async runTests(options = {}) {
    const runId = uuidv4();
    const startTime = new Date();
    
    const testRun = {
      id: runId,
      status: 'running',
      startTime,
      options,
      progress: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        current: null
      },
      logs: [],
      results: null
    };

    this.runningTests.set(runId, testRun);
    this.addToHistory(testRun);

    try {
      // Build Playwright command
      const command = this.buildPlaywrightCommand(options);
      
      // Emit test started event
      this.io.emit('test-started', {
        runId,
        startTime,
        options,
        command: command.join(' ')
      });

      const process = spawn(command[0], command.slice(1), {
        cwd: path.join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      testRun.process = process;

      // Handle stdout
      process.stdout.on('data', (data) => {
        const output = data.toString();
        testRun.logs.push({
          type: 'stdout',
          message: output,
          timestamp: new Date()
        });
        
        // Parse test progress
        this.parseTestProgress(output, testRun);
        
        // Emit real-time updates
        this.io.to(`test-${runId}`).emit('test-output', {
          runId,
          type: 'stdout',
          message: output,
          progress: testRun.progress
        });
      });

      // Handle stderr
      process.stderr.on('data', (data) => {
        const output = data.toString();
        testRun.logs.push({
          type: 'stderr',
          message: output,
          timestamp: new Date()
        });
        
        this.io.to(`test-${runId}`).emit('test-output', {
          runId,
          type: 'stderr',
          message: output
        });
      });

      // Handle process completion
      process.on('close', async (code) => {
        testRun.endTime = new Date();
        testRun.duration = testRun.endTime - testRun.startTime;
        testRun.exitCode = code;
        testRun.status = code === 0 ? 'completed' : 'failed';
        
        // Parse final results
        try {
          testRun.results = await this.parseTestResults();
        } catch (error) {
          console.error('Error parsing test results:', error);
        }

        this.runningTests.delete(runId);
        
        // Emit completion event
        this.io.emit('test-completed', {
          runId,
          status: testRun.status,
          endTime: testRun.endTime,
          duration: testRun.duration,
          results: testRun.results,
          exitCode: code
        });
      });

      return { runId, status: 'started', startTime };
    } catch (error) {
      testRun.status = 'error';
      testRun.error = error.message;
      this.runningTests.delete(runId);
      
      this.io.emit('test-failed', {
        runId,
        error: error.message
      });
      
      throw error;
    }
  }

  buildPlaywrightCommand(options) {
    const command = ['npx', 'playwright', 'test'];
    
    // Add test file or suite (not both)
    if (options.testFile) {
      command.push(options.testFile);
    } else if (options.suite) {
      command.push(`tests/${options.suite}/`);
    }
    
    // Add browser selection
    if (options.browser && options.browser !== 'all') {
      command.push('--project', options.browser);
    }
    
    // Add headed mode
    if (options.headed) {
      command.push('--headed');
    }
    
    // Add debug mode
    if (options.debug) {
      command.push('--debug');
    }
    
    // Add reporter
    if (options.reporter) {
      command.push('--reporter', options.reporter);
    } else {
      command.push('--reporter', 'json');
    }
    
    // Add workers
    if (options.workers) {
      command.push('--workers', options.workers.toString());
    }
    
    // Add timeout
    if (options.timeout) {
      command.push('--timeout', options.timeout.toString());
    }
    
    // Add retries
    if (options.retries) {
      command.push('--retries', options.retries.toString());
    }

    return command;
  }

  parseTestProgress(output, testRun) {
    // Parse Playwright output for progress information
    const runningMatch = output.match(/Running (\d+) test(?:s)? using (\d+) worker(?:s)?/);
    if (runningMatch) {
      testRun.progress.total = parseInt(runningMatch[1]);
    }

    // Parse individual test results
    const testMatch = output.match(/\s+[✓✗⊖]\s+(.+?)\s+\[(.+?)\]/);
    if (testMatch) {
      const testName = testMatch[1];
      const browser = testMatch[2];
      testRun.progress.current = `${testName} [${browser}]`;
      
      if (output.includes('✓')) {
        testRun.progress.passed++;
      } else if (output.includes('✗')) {
        testRun.progress.failed++;
      } else if (output.includes('⊖')) {
        testRun.progress.skipped++;
      }
    }

    // Emit progress update
    this.io.to(`test-${testRun.id}`).emit('test-progress', {
      runId: testRun.id,
      progress: testRun.progress
    });
  }

  async parseTestResults() {
    const resultsPath = path.join(__dirname, '../../test-results/results.json');
    
    try {
      if (await fs.pathExists(resultsPath)) {
        const results = await fs.readJson(resultsPath);
        return results;
      }
    } catch (error) {
      console.error('Error reading test results:', error);
    }
    
    return null;
  }

  async stopTest(runId) {
    const testRun = this.runningTests.get(runId);
    
    if (!testRun) {
      throw new Error(`Test run ${runId} not found`);
    }
    
    if (testRun.process) {
      testRun.process.kill('SIGTERM');
      testRun.status = 'stopped';
      testRun.endTime = new Date();
      
      this.io.emit('test-stopped', {
        runId,
        endTime: testRun.endTime
      });
      
      this.runningTests.delete(runId);
    }
    
    return { runId, status: 'stopped' };
  }

  getTestStatus(runId) {
    const runningTest = this.runningTests.get(runId);
    if (runningTest) {
      return {
        ...runningTest,
        process: undefined // Don't send process object
      };
    }
    
    const historicalTest = this.testHistory.find(test => test.id === runId);
    if (historicalTest) {
      return historicalTest;
    }
    
    return null;
  }

  getRunningTests() {
    return Array.from(this.runningTests.values()).map(test => ({
      ...test,
      process: undefined
    }));
  }

  getTestHistory() {
    return this.testHistory;
  }

  addToHistory(testRun) {
    this.testHistory.unshift({
      ...testRun,
      process: undefined
    });
    
    // Limit history size
    if (this.testHistory.length > this.maxHistorySize) {
      this.testHistory = this.testHistory.slice(0, this.maxHistorySize);
    }
  }

  async getAvailableTests() {
    const testsDir = path.join(__dirname, '../../tests');
    const testSuites = {};
    
    try {
      const suites = await fs.readdir(testsDir);
      
      for (const suite of suites) {
        const suitePath = path.join(testsDir, suite);
        const stat = await fs.stat(suitePath);
        
        if (stat.isDirectory()) {
          const testFiles = await fs.readdir(suitePath);
          testSuites[suite] = testFiles
            .filter(file => file.endsWith('.spec.js'))
            .map(file => ({
              name: file,
              path: `tests/${suite}/${file}`,
              fullPath: path.join(suitePath, file)
            }));
        }
      }
    } catch (error) {
      console.error('Error reading test directory:', error);
    }
    
    return testSuites;
  }

  async getTestSuites() {
    const tests = await this.getAvailableTests();
    return Object.keys(tests);
  }
}

module.exports = TestManager;