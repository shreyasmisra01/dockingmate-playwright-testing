// WebSocket middleware for Playwright test events
class WebSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);
      
      // Store client information
      this.connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        rooms: new Set()
      });

      // Handle test room subscription
      socket.on('join-test-room', (runId) => {
        if (!runId) {
          socket.emit('error', { message: 'Run ID is required' });
          return;
        }

        const roomName = `test-${runId}`;
        socket.join(roomName);
        
        // Update client info
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.add(roomName);
        }

        console.log(`Client ${socket.id} joined test room: ${roomName}`);
        
        // Acknowledge subscription
        socket.emit('test-room-joined', { runId, room: roomName });
      });

      // Handle test room unsubscription
      socket.on('leave-test-room', (runId) => {
        if (!runId) {
          socket.emit('error', { message: 'Run ID is required' });
          return;
        }

        const roomName = `test-${runId}`;
        socket.leave(roomName);
        
        // Update client info
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.delete(roomName);
        }

        console.log(`Client ${socket.id} left test room: ${roomName}`);
        
        // Acknowledge unsubscription
        socket.emit('test-room-left', { runId, room: roomName });
      });

      // Handle general notifications subscription
      socket.on('subscribe-notifications', () => {
        socket.join('notifications');
        
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.add('notifications');
        }

        console.log(`Client ${socket.id} subscribed to notifications`);
        socket.emit('notifications-subscribed');
      });

      // Handle ping/pong for connection keep-alive
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle client disconnect
      socket.on('disconnect', (reason) => {
        console.log(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error from client ${socket.id}:`, error);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Playwright Test API',
        clientId: socket.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Emit test started event
  emitTestStarted(testRun) {
    this.io.emit('test-started', {
      runId: testRun.id,
      startTime: testRun.startTime,
      options: testRun.options,
      status: 'started'
    });

    // Also emit to notifications room
    this.io.to('notifications').emit('notification', {
      type: 'test-started',
      message: `Test run ${testRun.id} started`,
      timestamp: new Date().toISOString()
    });
  }

  // Emit test progress event
  emitTestProgress(runId, progress) {
    this.io.to(`test-${runId}`).emit('test-progress', {
      runId,
      progress,
      timestamp: new Date().toISOString()
    });
  }

  // Emit test output event
  emitTestOutput(runId, output) {
    this.io.to(`test-${runId}`).emit('test-output', {
      runId,
      ...output,
      timestamp: new Date().toISOString()
    });
  }

  // Emit test completed event
  emitTestCompleted(testRun) {
    this.io.emit('test-completed', {
      runId: testRun.id,
      status: testRun.status,
      endTime: testRun.endTime,
      duration: testRun.duration,
      results: testRun.results,
      exitCode: testRun.exitCode
    });

    this.io.to('notifications').emit('notification', {
      type: 'test-completed',
      message: `Test run ${testRun.id} completed with status: ${testRun.status}`,
      timestamp: new Date().toISOString()
    });
  }

  // Emit test failed event
  emitTestFailed(runId, error) {
    this.io.emit('test-failed', {
      runId,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    this.io.to('notifications').emit('notification', {
      type: 'test-failed',
      message: `Test run ${runId} failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }

  // Emit test stopped event
  emitTestStopped(runId) {
    this.io.emit('test-stopped', {
      runId,
      timestamp: new Date().toISOString()
    });

    this.io.to('notifications').emit('notification', {
      type: 'test-stopped',
      message: `Test run ${runId} was stopped`,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected clients info
  getConnectedClients() {
    const clients = Array.from(this.connectedClients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      rooms: Array.from(client.rooms)
    }));

    return {
      total: clients.length,
      clients
    };
  }

  // Broadcast system message
  broadcastSystemMessage(message, type = 'info') {
    this.io.emit('system-message', {
      type,
      message,
      timestamp: new Date().toISOString()
    });

    this.io.to('notifications').emit('notification', {
      type: 'system',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Send message to specific room
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Disconnect all clients (for server shutdown)
  disconnectAll() {
    this.io.emit('server-shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Give clients time to receive the message
    setTimeout(() => {
      this.io.disconnectSockets(true);
    }, 1000);
  }
}

module.exports = WebSocketHandler;