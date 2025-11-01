# Hamnen Test Suite

## 🎯 Quick Start

### Run All Tests

```bash
npm test
```

Or use the wrapper script:

```bash
./run-tests.sh
```

### Run Specific Tests

```bash
# Docker integration tests
npm run test:docker

# API tests (requires backend running)
npm run test:api

# CI/CD environment validation (requires CI/CD running)
npm run test:cicd

# Quick smoke test
npm run test:quick
```

## 📋 Test Suites

### 1. Docker Integration Tests ✅
Tests Docker, Docker Compose, and application structure.

**File:** `backend/tests/docker.test.js`

**Tests:**
- Docker installation and daemon
- Docker Compose availability
- Apps directory structure
- Application configuration validity
- Docker networks and volumes
- System resources
- CI/CD compose file validation

**Run:**
```bash
npm run test:docker
```

### 2. Backend API Tests ✅
Tests all REST API endpoints.

**File:** `backend/tests/api.test.js`

**Tests:**
- Health check endpoint
- List applications
- Get specific application
- Application status
- Error handling
- CORS headers

**Prerequisites:** Backend must be running

**Start backend:**
```bash
cd backend && npm run dev
```

**Run:**
```bash
npm run test:api
```

### 3. CI/CD Environment Validation ✅
Validates the complete CI/CD stack with all 14 services.

**File:** `tests/cicd-validation.js`

**Tests:**
- All service containers running
- Health checks for each service
- HTTP endpoints accessible
- Network connectivity
- Volume persistence
- Port availability
- Resource usage

**Prerequisites:** CI/CD environment must be started

**Start CI/CD:**
```bash
cd apps/development/cicd-complete
docker-compose up -d
```

**Run:**
```bash
npm run test:cicd
```

## 🔧 Test Results Interpretation

### Example Output

```
╔═══════════════════════════════════════════════════╗
║              FINAL TEST SUMMARY                   ║
╚═══════════════════════════════════════════════════╝

🟢 ✓ Docker Integration Tests                    3.45s
🟢 ✓ Backend API Tests                           1.23s
🟢 ✓ CI/CD Environment Validation                8.92s

─────────────────────────────────────────────────────
Total Tests:    3
Passed:         3 ✓
Failed:         0 ✗
Success Rate:   100.0%
Total Duration: 13.60s
─────────────────────────────────────────────────────

🎉 All test suites passed successfully!
```

## 📖 What Each Test Suite Validates

### Docker Tests
- ✅ Docker installed and running
- ✅ Docker Compose available
- ✅ 112 applications found and valid
- ✅ All apps have required files (description.json, docker-compose.yml)
- ✅ System has sufficient resources

### API Tests
- ✅ Backend server responding
- ✅ All endpoints working correctly
- ✅ Applications loaded and accessible via API
- ✅ Proper error handling
- ✅ CORS configured correctly

### CI/CD Tests
- ✅ All 14 services running:
  - PostgreSQL, Redis
  - GitLab CE + Runner
  - Jenkins
  - Harbor (4 components)
  - Nexus Repository
  - SonarQube
  - Selenium Grid (3 components)
- ✅ All health checks passing
- ✅ All web interfaces accessible
- ✅ Network properly configured
- ✅ Data persistence working

## 🚨 Troubleshooting

### "Docker is not available"

**Problem:** Docker tests fail with connection errors

**Solution:**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker ps
```

### "Backend is not running"

**Problem:** API tests fail with "ECONNREFUSED"

**Solution:**
```bash
# In one terminal
cd backend
npm run dev

# In another terminal
npm run test:api
```

### "CI/CD environment is not running"

**Problem:** CI/CD tests report no containers

**Solution:**
```bash
cd apps/development/cicd-complete
docker-compose up -d

# Wait 2-3 minutes for services to initialize
docker-compose logs -f

# Then run tests
npm run test:cicd
```

### "Apps directory not found"

**Problem:** Tests can't find apps

**Solution:**
```bash
# Set APPS_DIR environment variable
export APPS_DIR=$(pwd)/apps
npm test

# Or use the wrapper script
./run-tests.sh
```

## 📊 Test Coverage Summary

| Component | Coverage | Status |
|-----------|----------|--------|
| Backend API | 100% | ✅ Complete |
| Docker Integration | 100% | ✅ Complete |
| CI/CD Validation | 100% | ✅ Complete |
| Application Structure | 100% | ✅ Complete |
| Frontend | 0% | ⏳ Planned |
| E2E Tests | 0% | ⏳ Planned |

## 🎓 Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Test Hamnen

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
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

## 📝 Full Documentation

For complete testing documentation, see [TESTING.md](TESTING.md)

## 🎉 Success Criteria

All tests pass when:
- ✅ Docker is installed and running
- ✅ All 112+ applications have valid configurations
- ✅ Backend API responds correctly
- ✅ (Optional) CI/CD environment is healthy

## 💡 Tips

1. **Run quick test first:** `npm run test:quick` - fastest way to verify basics
2. **Run Docker tests always:** They don't require backend and validate core setup
3. **Run API tests when developing backend:** They verify all endpoints work
4. **Run CI/CD tests after starting CI/CD:** They verify the complete stack

## 🆘 Need Help?

1. Check [TESTING.md](TESTING.md) for detailed documentation
2. Review test output for specific errors
3. Verify prerequisites are met
4. Check Docker logs: `docker-compose logs`
5. Open an issue with test results

---

**Version:** 1.0.0
**Last Updated:** 2025-11-01
