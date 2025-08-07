#!/usr/bin/env node

const { io } = require('socket.io-client');

// WebSocket Demo Client
console.log('🔌 WebSocket Demo - DockingMate Testing API');
console.log('==========================================');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log(`✅ Connected to server with ID: ${socket.id}`);
  
  // Subscribe to general notifications
  socket.emit('subscribe-notifications');
  console.log('📡 Subscribed to general notifications');
  
  console.log('🎯 Listening for test events...\n');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connected', (data) => {
  console.log('🎉 Server welcome:', data.message);
});

socket.on('test-started', (data) => {
  console.log(`🚀 Test Started: ${data.runId}`);
  console.log(`   Browser: ${data.options.browser || 'default'}`);
  console.log(`   Suite: ${data.options.suite || 'all'}`);
  console.log(`   Started: ${data.startTime}\n`);
  
  // Join the specific test room for detailed updates
  socket.emit('join-test-room', data.runId);
});

socket.on('test-progress', (data) => {
  const progress = data.progress;
  console.log(`📊 Progress Update: ${data.runId}`);
  console.log(`   Total: ${progress.total} | Passed: ${progress.passed} | Failed: ${progress.failed} | Skipped: ${progress.skipped}`);
  if (progress.current) {
    console.log(`   Current: ${progress.current}`);
  }
  console.log();
});

socket.on('test-output', (data) => {
  if (data.type === 'stdout') {
    console.log(`📝 Output: ${data.message.trim()}`);
  } else if (data.type === 'stderr') {
    console.log(`⚠️  Error: ${data.message.trim()}`);
  }
});

socket.on('test-completed', (data) => {
  console.log(`✅ Test Completed: ${data.runId}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Duration: ${data.duration}ms`);
  console.log(`   Exit Code: ${data.exitCode}`);
  if (data.results) {
    console.log(`   Results available: Yes`);
  }
  console.log();
});

socket.on('test-failed', (data) => {
  console.log(`❌ Test Failed: ${data.runId}`);
  console.log(`   Error: ${data.error}`);
  console.log();
});

socket.on('test-stopped', (data) => {
  console.log(`⏹️  Test Stopped: ${data.runId}`);
  console.log();
});

socket.on('notification', (data) => {
  console.log(`🔔 Notification: ${data.message}`);
  console.log(`   Type: ${data.type}`);
  console.log();
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('💡 Now you can start tests via API and see real-time updates here!');
console.log('   Example: curl -X POST http://localhost:3001/api/tests/run -H "Content-Type: application/json" -d \'{"browser": "chromium", "suite": "general"}\'');
console.log('   Press Ctrl+C to exit\n');