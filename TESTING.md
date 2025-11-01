# Hamnen Testing Guide

This document describes the testing infrastructure for Hamnen and how to run tests.

## Overview

Hamnen includes a comprehensive test suite that validates:

- **Backend API** - All REST endpoints and functionality
- **Docker Integration** - Docker and docker-compose functionality
- **Application Loading** - App discovery and configuration validation
- **CI/CD Environment** - Complete CI/CD stack validation (GitLab, Jenkins, Harbor, etc.)

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Docker integration tests only
npm run test:docker

# API tests only (requires backend to be running)
npm run test:api

# CI/CD environment validation (requires CI/CD to be running)
npm run test:cicd

# Quick smoke test
npm run test:quick
```

### Run Individual Test Files

```bash
# Backend API tests
node backend/tests/api.test.js

# Docker integration tests
node backend/tests/docker.test.js

# CI/CD validation
node tests/cicd-validation.js
```

## Test Suites

### 1. Docker Integration Tests

**File:** `backend/tests/docker.test.js`

**What it tests:**
- Docker installation and daemon status
- Docker Compose installation
- Apps directory structure
- Application configuration validity
- Docker network and volume capabilities
- Docker socket access
- System resources
- CI/CD compose file validation

**Prerequisites:**
- Docker installed and running
- Docker Compose installed
- User has access to Docker socket

**Run:**
```bash
npm run test:docker
```

**Expected output:**
```
═══════════════════════════════════════════════════
🐳 HAMNEN DOCKER INTEGRATION TESTS
═══════════════════════════════════════════════════
✓ Docker is installed
✓ Docker daemon is running
✓ Docker Compose is installed
...
```

### 2. Backend API Tests

**File:** `backend/tests/api.test.js`

**What it tests:**
- Health check endpoint (`/health`)
- List applications endpoint (`GET /api/apps`)
- Get specific application (`GET /api/apps/:name`)
- Application status
- Error handling (404 for non-existent apps)
- CORS headers

**Prerequisites:**
- Backend server must be running on port 3001

**Start backend:**
```bash
cd backend
npm run dev
```

**Run tests:**
```bash
npm run test:api
```

**Expected output:**
```
═══════════════════════════════════════════════════
🧪 HAMNEN BACKEND API TESTS
═══════════════════════════════════════════════════
✓ Health endpoint returns 200
✓ List apps endpoint returns 200
✓ At least one application is loaded
...
```

### 3. CI/CD Environment Validation

**File:** `tests/cicd-validation.js`

**What it tests:**
- All 14 CI/CD services are running:
  - PostgreSQL
  - Redis
  - GitLab CE
  - GitLab Runner
  - Jenkins
  - Harbor (Core, Portal, Registry, Proxy)
  - Nexus Repository
  - SonarQube
  - Selenium Grid (Hub, Chrome, Firefox)
- Health checks for each service
- HTTP endpoint accessibility
- Network connectivity
- Volume persistence
- Port availability
- Resource usage

**Prerequisites:**
- CI/CD environment must be running

**Start CI/CD environment:**
```bash
cd apps/development/cicd-complete
docker-compose up -d
```

**Run tests:**
```bash
npm run test:cicd
```

**Expected output:**
```
═══════════════════════════════════════════════════
🚀 CI/CD COMPLETE ENVIRONMENT VALIDATION
═══════════════════════════════════════════════════
✓ Found 14 CI/CD containers running
✓ GitLab container is running
✓ Jenkins container is running
...
```

## Master Test Runner

**File:** `test.js`

The master test runner orchestrates all test suites and provides a unified report.

**Usage:**

```bash
# Run all tests
node test.js

# Run specific suites
node test.js --docker      # Docker tests only
node test.js --api         # API tests only
node test.js --cicd        # CI/CD tests only
node test.js --quick       # Quick smoke test

# Show help
node test.js --help
```

**Features:**
- Runs multiple test suites
- Checks prerequisites (backend running, CI/CD running)
- Provides unified summary with success rates
- Color-coded output
- Individual test timing

## CI/CD Integration

### GitHub Actions / GitLab CI

Add to your `.github/workflows/test.yml` or `.gitlab-ci.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install

      - name: Run Docker tests
        run: npm run test:docker

      - name: Start backend
        run: |
          cd backend
          npm start &
          sleep 5

      - name: Run API tests
        run: npm run test:api
```

## Writing New Tests

### Adding a New Test Suite

1. Create a test file in `backend/tests/` or `tests/`:

```javascript
class MyTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      this.passed++;
    } else {
      console.log(`  ✗ ${message}`);
      this.failed++;
    }
  }

  async testSomething() {
    console.log('\n📍 Testing something...');
    this.assert(true, 'This test passes');
  }

  async runAll() {
    await this.testSomething();

    // Print summary
    console.log(`\nPassed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);

    process.exit(this.failed === 0 ? 0 : 1);
  }
}

if (require.main === module) {
  const tester = new MyTester();
  tester.runAll();
}

module.exports = MyTester;
```

2. Add it to `test.js`:

```javascript
await this.runTest(
  'My New Test Suite',
  path.join(__dirname, 'path/to/my.test.js'),
  false // or true if requires backend
);
```

3. Add npm script to `package.json`:

```json
{
  "scripts": {
    "test:mytest": "node path/to/my.test.js"
  }
}
```

## Troubleshooting

### Backend API Tests Fail

**Problem:** Connection refused errors

**Solution:**
```bash
# Start the backend first
cd backend
npm run dev
```

### Docker Tests Fail

**Problem:** "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker
sudo systemctl start docker

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### CI/CD Tests Fail

**Problem:** "CI/CD environment is not running"

**Solution:**
```bash
# Start the CI/CD environment
cd apps/development/cicd-complete
docker-compose up -d

# Wait for services to initialize (2-3 minutes)
docker-compose logs -f
```

### Port Already in Use

**Problem:** Tests fail because ports are occupied

**Solution:**
```bash
# Find what's using the port
lsof -i :3001

# Kill the process or change ports in docker-compose.yml
```

### Permission Denied on Docker Socket

**Problem:** Cannot access `/var/run/docker.sock`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended)
sudo npm test
```

## Test Coverage

Current test coverage includes:

- ✅ Backend health endpoint
- ✅ Application listing API
- ✅ Application status API
- ✅ Docker installation validation
- ✅ Docker Compose validation
- ✅ Application structure validation
- ✅ CI/CD service validation
- ✅ Network connectivity
- ✅ Volume persistence
- ⏳ Start/stop operations (planned)
- ⏳ Frontend tests (planned)
- ⏳ E2E tests (planned)

## Continuous Improvement

To add more tests:

1. Identify what needs testing
2. Create a new test file or extend existing ones
3. Follow the existing test pattern
4. Add to the master test runner
5. Document in this guide
6. Run tests to verify
7. Commit and push

## Resources

- [Jest Documentation](https://jestjs.io/) - For future unit test framework
- [Supertest](https://github.com/visionmedia/supertest) - For future HTTP testing
- [Docker Testing Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

If you encounter issues with the test suite:

1. Check this documentation
2. Review test output for specific errors
3. Check prerequisites are met
4. Review logs: `docker-compose logs`
5. Open an issue with test output

---

**Last Updated:** 2025-11-01
**Version:** 1.0.0
