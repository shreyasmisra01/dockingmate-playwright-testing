const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { param, query, validationResult } = require('express-validator');

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

// GET /api/reports/latest - Get latest test report
router.get('/latest', async (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '../../playwright-report');
    const resultsFile = path.join(__dirname, '../../test-results/results.json');
    
    let report = null;
    
    // Try to read JSON results first
    if (await fs.pathExists(resultsFile)) {
      report = await fs.readJson(resultsFile);
    }
    
    // Check if HTML report exists
    const htmlReportIndex = path.join(reportsDir, 'index.html');
    const hasHtmlReport = await fs.pathExists(htmlReportIndex);
    
    res.json({
      report,
      hasHtmlReport,
      htmlReportUrl: hasHtmlReport ? '/reports/index.html' : null,
      timestamp: report?.stats?.startTime || new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get latest report',
      message: error.message
    });
  }
});

// GET /api/reports/history - Get report history
router.get('/history', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const testResultsDir = path.join(__dirname, '../../test-results');
    const reports = [];
    
    if (await fs.pathExists(testResultsDir)) {
      const files = await fs.readdir(testResultsDir);
      const jsonFiles = files
        .filter(file => file.endsWith('.json') && file.includes('results'))
        .sort((a, b) => b.localeCompare(a)); // Sort by filename (timestamp) descending
      
      for (const file of jsonFiles.slice(offset, offset + limit)) {
        try {
          const filePath = path.join(testResultsDir, file);
          const stat = await fs.stat(filePath);
          const content = await fs.readJson(filePath);
          
          reports.push({
            filename: file,
            timestamp: stat.mtime,
            size: stat.size,
            summary: {
              tests: content.stats?.tests || 0,
              passed: content.stats?.passed || 0,
              failed: content.stats?.failed || 0,
              skipped: content.stats?.skipped || 0,
              duration: content.stats?.duration || 0
            }
          });
        } catch (error) {
          console.error(`Error reading report file ${file}:`, error);
        }
      }
    }
    
    res.json({
      total: reports.length,
      limit,
      offset,
      reports
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get report history',
      message: error.message
    });
  }
});

// GET /api/reports/download/:filename - Download specific report
router.get('/download/:filename', [
  param('filename').matches(/^[\w\-\.]+\.json$/)
], handleValidationErrors, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../test-results', filename);
    
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to download report',
      message: error.message
    });
  }
});

// GET /api/reports/screenshots - Get available screenshots
router.get('/screenshots', [
  query('testRunId').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { testRunId } = req.query;
    
    const testResultsDir = path.join(__dirname, '../../test-results');
    const screenshots = [];
    
    if (await fs.pathExists(testResultsDir)) {
      const files = await fs.readdir(testResultsDir);
      let imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg|gif)$/i.test(file)
      );
      
      // Filter by test run ID if provided
      if (testRunId) {
        imageFiles = imageFiles.filter(file => file.includes(testRunId));
      }
      
      // Sort by modification time (newest first)
      const fileStats = await Promise.all(
        imageFiles.map(async file => {
          const filePath = path.join(testResultsDir, file);
          const stat = await fs.stat(filePath);
          return { file, mtime: stat.mtime, size: stat.size };
        })
      );
      
      fileStats
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit)
        .forEach(({ file, mtime, size }) => {
          screenshots.push({
            filename: file,
            url: `/test-results/${file}`,
            timestamp: mtime,
            size
          });
        });
    }
    
    res.json({
      count: screenshots.length,
      screenshots
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get screenshots',
      message: error.message
    });
  }
});

// GET /api/reports/videos - Get available videos
router.get('/videos', [
  query('testRunId').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const { testRunId } = req.query;
    
    const testResultsDir = path.join(__dirname, '../../test-results');
    const videos = [];
    
    if (await fs.pathExists(testResultsDir)) {
      const files = await fs.readdir(testResultsDir);
      let videoFiles = files.filter(file => 
        /\.(mp4|webm|avi)$/i.test(file)
      );
      
      // Filter by test run ID if provided
      if (testRunId) {
        videoFiles = videoFiles.filter(file => file.includes(testRunId));
      }
      
      // Sort by modification time (newest first)
      const fileStats = await Promise.all(
        videoFiles.map(async file => {
          const filePath = path.join(testResultsDir, file);
          const stat = await fs.stat(filePath);
          return { file, mtime: stat.mtime, size: stat.size };
        })
      );
      
      fileStats
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit)
        .forEach(({ file, mtime, size }) => {
          videos.push({
            filename: file,
            url: `/test-results/${file}`,
            timestamp: mtime,
            size
          });
        });
    }
    
    res.json({
      count: videos.length,
      videos
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get videos',
      message: error.message
    });
  }
});

// DELETE /api/reports/cleanup - Clean up old reports
router.delete('/cleanup', [
  query('olderThan').optional().isInt({ min: 1 }),
  query('keepCount').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const olderThan = parseInt(req.query.olderThan) || 7; // days
    const keepCount = parseInt(req.query.keepCount) || 10;
    
    const testResultsDir = path.join(__dirname, '../../test-results');
    const cutoffDate = new Date(Date.now() - (olderThan * 24 * 60 * 60 * 1000));
    
    let deletedCount = 0;
    let totalSize = 0;
    
    if (await fs.pathExists(testResultsDir)) {
      const files = await fs.readdir(testResultsDir);
      
      // Get file stats with timestamps
      const fileStats = await Promise.all(
        files.map(async file => {
          const filePath = path.join(testResultsDir, file);
          const stat = await fs.stat(filePath);
          return { file, filePath, mtime: stat.mtime, size: stat.size };
        })
      );
      
      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime - a.mtime);
      
      // Delete files older than cutoff date, but keep minimum count
      for (let i = keepCount; i < fileStats.length; i++) {
        const { file, filePath, mtime, size } = fileStats[i];
        
        if (mtime < cutoffDate) {
          await fs.remove(filePath);
          deletedCount++;
          totalSize += size;
        }
      }
    }
    
    res.json({
      message: 'Cleanup completed',
      deletedFiles: deletedCount,
      freedSpace: totalSize
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cleanup reports',
      message: error.message
    });
  }
});

// GET /api/reports/summary - Get reports summary
router.get('/summary', async (req, res) => {
  try {
    const testResultsDir = path.join(__dirname, '../../test-results');
    const reportsDir = path.join(__dirname, '../../playwright-report');
    
    const summary = {
      totalReports: 0,
      totalSize: 0,
      screenshots: 0,
      videos: 0,
      hasHtmlReport: false,
      lastReportTime: null
    };
    
    // Count test results
    if (await fs.pathExists(testResultsDir)) {
      const files = await fs.readdir(testResultsDir);
      
      for (const file of files) {
        const filePath = path.join(testResultsDir, file);
        const stat = await fs.stat(filePath);
        
        summary.totalSize += stat.size;
        
        if (file.endsWith('.json')) {
          summary.totalReports++;
        } else if (/\.(png|jpg|jpeg|gif)$/i.test(file)) {
          summary.screenshots++;
        } else if (/\.(mp4|webm|avi)$/i.test(file)) {
          summary.videos++;
        }
        
        if (!summary.lastReportTime || stat.mtime > summary.lastReportTime) {
          summary.lastReportTime = stat.mtime;
        }
      }
    }
    
    // Check for HTML report
    const htmlReportIndex = path.join(reportsDir, 'index.html');
    summary.hasHtmlReport = await fs.pathExists(htmlReportIndex);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get reports summary',
      message: error.message
    });
  }
});

module.exports = router;