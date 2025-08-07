# DockingMate Playwright Testing API Server

Express-based API server for comprehensive end-to-end testing of the DockingMate frontend application using Playwright with RESTful APIs and real-time WebSocket updates.

## Project Structure

```
playwright-testing/
├── server.js                    # Main Express server
├── api/
│   ├── routes/                  # API route handlers
│   │   ├── test-routes.js       # Test execution endpoints
│   │   ├── report-routes.js     # Report management endpoints
│   │   └── config-routes.js     # Configuration endpoints
│   ├── services/                # Business logic services
│   │   └── test-manager.js      # Test execution management
│   └── middleware/              # Express middleware
│       ├── auth.js              # Authentication & rate limiting
│       └── websocket.js         # WebSocket event handling
├── tests/
│   ├── auth/                    # Authentication tests
│   ├── berth/                   # Berth-related tests
│   ├── cart/                    # Shopping cart tests
│   ├── dashboard/               # Dashboard functionality tests
│   ├── profile/                 # User profile tests
│   ├── general/                 # General pages tests
│   └── blog/                    # Blog functionality tests
├── fixtures/                    # Test data and fixtures
├── utils/                       # Helper utilities
├── public/                      # Static web interface
│   └── index.html               # API documentation UI
├── Dockerfile                   # Docker container configuration
├── docker-compose.yml           # Multi-service Docker setup
├── nginx.conf                   # Nginx reverse proxy config
└── playwright.config.js         # Playwright configuration
```

## Features Tested

### Authentication
- User login/logout
- User registration
- Password reset flow
- Form validation
- Session persistence

### Berth Management
- Berth search and filtering
- Berth creation and editing
- Berth detail viewing
- Availability calendar
- Pricing and booking

### Dashboard
- User statistics display
- Recent activity
- Quick actions
- Navigation

### Shopping Cart
- Add/remove items
- Update quantities
- Apply promo codes
- Checkout process

### User Profile
- Profile information editing
- Password changes
- Notification preferences
- Account settings

### General Pages
- Homepage functionality
- Contact form
- Navigation
- Footer links

### Blog System
- Blog listing
- Post detail viewing
- Search and filtering
- Comments system

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git

### Local Setup

1. **Clone and Install Dependencies**
   ```bash
   cd playwright-testing
   npm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the API Server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

5. **Access the API**
   - API Server: http://localhost:3001
   - Web Interface: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Docker Setup

1. **Build and Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access Services**
   - API Server: http://localhost:3001
   - DockingMate App: http://localhost:3000
   - Nginx (Load Balancer): http://localhost:80

3. **Scale API Server**
   ```bash
   docker-compose up --scale playwright-api-server=3
   ```

## API Endpoints

### Test Execution
```bash
# Start a test run
curl -X POST http://localhost:3001/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"browser": "chromium", "suite": "auth"}'

# Check test status
curl http://localhost:3001/api/tests/status/{runId}

# Stop a test run
curl -X POST http://localhost:3001/api/tests/stop/{runId}

# Get running tests
curl http://localhost:3001/api/tests/running

# Get test history
curl http://localhost:3001/api/tests/history
```

### Reports & Results
```bash
# Get latest report
curl http://localhost:3001/api/reports/latest

# Get report history
curl http://localhost:3001/api/reports/history

# Get screenshots
curl http://localhost:3001/api/reports/screenshots

# Download specific report
curl http://localhost:3001/api/reports/download/{filename}
```

### Configuration
```bash
# Get current config
curl http://localhost:3001/api/config

# Update configuration
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"environment": {"headless": false}}'

# Validate configuration
curl http://localhost:3001/api/config/validate
```

## WebSocket Events

The API server provides real-time updates via WebSocket connections:

```javascript
const socket = io('http://localhost:3001');

// Subscribe to test room for specific test run
socket.emit('join-test-room', runId);

// Listen for test events
socket.on('test-started', (data) => {
  console.log('Test started:', data);
});

socket.on('test-progress', (data) => {
  console.log('Test progress:', data.progress);
});

socket.on('test-output', (data) => {
  console.log('Test output:', data.message);
});

socket.on('test-completed', (data) => {
  console.log('Test completed:', data.results);
});

// Subscribe to general notifications
socket.emit('subscribe-notifications');
socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# Scale API server
docker-compose up --scale playwright-api-server=3

# View service logs
docker-compose logs playwright-api-server
docker-compose logs dockingmate-app

# Stop services
docker-compose down

# Remove volumes and clean up
docker-compose down -v
```

## Configuration

### Environment Variables (.env)
```env
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
API_BASE_URL=http://localhost:8000
HEADLESS=true
```

### Playwright Configuration
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile device testing
- Automatic screenshots on failure
- Video recording for failed tests
- Trace collection on retry

## Test Data Management

Test data is centralized in `fixtures/test-data.js`:
- User credentials
- Berth information
- Contact form data
- Blog content

## Helper Utilities

### AuthHelpers
- Login/logout functionality
- User registration
- Password reset
- Session management

### PageHelpers
- Common UI interactions
- Loading state handling
- Screenshot capture
- API response waiting

## Reporting

Tests generate multiple report formats:
- HTML report (default)
- JSON results
- JUnit XML for CI/CD

View reports:
```bash
npm run report
```

## CI/CD Integration

The test suite is ready for CI/CD integration with:
- Docker containerization
- Headless execution
- Multiple report formats
- Failure screenshots
- Environment variable configuration

Example GitHub Actions workflow:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm test
      - uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Page Object Model**: Use helper classes for complex interactions
2. **Data-driven Testing**: Utilize fixtures for test data
3. **Wait Strategies**: Implement proper waiting for elements and API calls
4. **Error Handling**: Capture screenshots and traces on failures
5. **Parallel Execution**: Tests run in parallel for faster execution
6. **Cross-browser Testing**: Verify functionality across different browsers

## Troubleshooting

### Common Issues

1. **Application not starting**
   - Ensure DockingMate frontend is running on port 3000
   - Check Docker containers are healthy

2. **Tests failing**
   - Verify environment variables
   - Check application logs
   - Review test screenshots in test-results/

3. **Docker issues**
   - Ensure Docker daemon is running
   - Check port conflicts
   - Verify Docker Compose version

### Debug Mode
```bash
npm run test:debug
```

### Viewing Test Results
```bash
# Open HTML report
npm run report

# Check individual screenshots
ls test-results/
```

## Contributing

1. Add new tests following existing patterns
2. Update test data in fixtures as needed
3. Ensure tests are deterministic and can run in parallel
4. Include proper error handling and assertions
5. Update documentation for new features

## Support

For issues and questions:
- Check existing test failures in test-results/
- Review Playwright documentation
- Examine application logs
- Verify environment configuration