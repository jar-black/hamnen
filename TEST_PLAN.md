# Hamnen Application Launch Button Test Plan

## Overview

This test plan describes the automated testing process for verifying that all launch buttons work correctly for every application in Hamnen. The test ensures that applications can be started, verified as running, and properly cleaned up.

## Test Objectives

1. Verify that every application can be started via its launch button/API endpoint
2. Confirm that applications are properly running after startup
3. Validate health check endpoints (where applicable)
4. Ensure proper cleanup and removal of Docker containers
5. Identify any applications that fail to start or run correctly

## Test Scope

### In Scope
- All applications in the `apps/` directory organized by category:
  - AI (5 apps)
  - Automation (2 apps)
  - Backup (2 apps)
  - Dashboard (5 apps)
  - Database (8 apps)
  - Development (13 apps)
  - Docker Management (6 apps)
  - Download (6 apps)
  - Files (5 apps)
  - Media (13 apps)
  - Misc (1 app)
  - Monitoring (11 apps)
  - Network (8 apps)
  - Photos (2 apps)
  - Productivity (9 apps)
  - Security (4 apps)
  - Smart Home (7 apps)
  - VPN (3 apps)
  - Web (4 apps)

### Out of Scope
- Application functionality testing (only testing launch/start capability)
- Performance testing
- Load testing
- Security testing

## Test Environment

### Prerequisites
- Docker and Docker Compose installed
- Hamnen backend running (for API testing) or direct docker-compose access
- Sufficient system resources (CPU, memory, disk space)
- Network connectivity for pulling Docker images

### Environment Variables
- `APPS_DIR`: Path to applications directory (default: `./apps`)
- `CHECK_HEALTH`: Enable/disable health endpoint checks (default: `true`)

## Test Methodology

### Automated Test Script
The test plan is executed via the `test-all-apps.js` script, which performs the following steps for each application:

#### Step 1: Application Discovery
- Scan the `apps/` directory structure
- Load `description.json` for each application
- Verify `docker-compose.yml` exists
- Build list of applications to test

#### Step 2: Start Application
- Execute `docker-compose up -d` for the application
- Use project name: `hamnen_{category-appname}`
- Wait 5 seconds for initial startup
- Log any errors during startup

**Success Criteria:**
- `docker-compose up -d` exits with code 0
- No fatal errors in output

#### Step 3: Wait Period
- Wait 60 seconds for application to fully start
- Allow time for:
  - Container initialization
  - Service startup
  - Network configuration
  - Health checks to pass

**Success Criteria:**
- Wait completes without interruption

#### Step 4: Verify Running Status
- Execute `docker-compose ps --format json`
- Parse container status information
- Check that containers are in "running" state
- Log container names and states

**Success Criteria:**
- At least one container is running
- All containers for the app are in "running" state (not "exited" or "restarting")

#### Step 5: Health Check (Optional)
- Read `healthCheck` URL from `description.json`
- Perform HTTP request to health endpoint
- Check for successful HTTP response (2xx-3xx status codes)
- Timeout after 10 seconds

**Success Criteria:**
- HTTP status code between 200-399
- Response received within timeout

**Note:** Not all applications have health check endpoints. This step is skipped if:
- `CHECK_HEALTH` environment variable is set to `false`
- Application has no `healthCheck` defined in `description.json`

#### Step 6: Stop and Cleanup
- Execute `docker-compose down --volumes --remove-orphans`
- Remove all containers created for the application
- Remove volumes to ensure clean state
- Remove orphaned containers

**Success Criteria:**
- `docker-compose down` exits with code 0
- All containers are removed
- No orphaned resources remain

#### Step 7: Results Recording
- Record test results for each application:
  - Application ID and name
  - Success/failure status
  - Results of each step
  - Any error messages
  - Container information
  - Health check results (if applicable)

### Overall Test Success Criteria

An application test is considered **PASSED** if:
1. ✓ Start step completes successfully
2. ✓ At least one container is running after wait period
3. ✓ All containers are in "running" state (not partial startup)
4. ✓ Health check passes (if health check is enabled and URL is provided)
5. ✓ Stop/cleanup completes successfully

An application test is considered **FAILED** if:
- Any of the above criteria are not met
- An exception/error occurs during any step
- Containers fail to start
- Health check returns error status code

## Running the Tests

### Run All Applications
```bash
# Run test for all applications with health checks
node test-all-apps.js

# Run test for all applications without health checks
CHECK_HEALTH=false node test-all-apps.js

# Run in background and log to file
node test-all-apps.js > test-output.log 2>&1 &
```

### Run Specific Applications
```bash
# Test a single application
node test-all-apps.js web/nginx-demo

# Test multiple specific applications
node test-all-apps.js docker/portainer monitoring/grafana

# Test all applications in a category
node test-all-apps.js web/* docker/*
```

### Test Output

The script provides:
1. **Console Output**: Real-time test progress with colored indicators
   - 🔵 Blue: Test suite headers
   - 🔷 Cyan: Information messages
   - ✓ Green: Successful steps
   - ✗ Red: Failed steps
   - ⚠ Yellow: Warnings
   - Gray: Detailed/debug information

2. **JSON Results File**: `test-results.json` containing:
   - Total tests, passed, failed counts
   - Detailed results for each application
   - Step-by-step execution data
   - Error messages and container states

### Example Output
```
═══════════════════════════════════════════════════════════
   Hamnen Application Launch Button Test Suite
═══════════════════════════════════════════════════════════

Found 114 applications to test

Configuration:
  - Wait time: 60 seconds
  - Health checks: enabled
  - Apps directory: /home/user/hamnen/apps

Testing: Nginx Demo (web/nginx-demo)
Category: web
  Starting containers...
  ✓ Started successfully
  Waiting 60 seconds for application to fully start...
  ✓ Containers running: 1
    - hamnen_web-nginx-demo_nginx_1: running
  ✓ Health check passed (HTTP 200)
  ✓ Stopped and cleaned up
✓ PASSED: Nginx Demo

...

═══════════════════════════════════════════════════════════
   Test Summary
═══════════════════════════════════════════════════════════

Total tests:    114
Passed:         102
Failed:         12
Skipped:        0
Duration:       7800 seconds

Failed Applications:
  - PostgreSQL (database/postgresql): Health check failed: 503
  - GitLab (development/gitlab): No containers running

Detailed results written to: test-results.json
```

## Test Duration

### Estimated Time
- **Per Application**: ~65-70 seconds
  - Start: ~5 seconds
  - Wait: 60 seconds
  - Status check: ~1 second
  - Health check: ~2 seconds
  - Cleanup: ~3 seconds
  - Buffer: ~2 seconds

- **Total for All Apps**: ~2 hours (114 apps × 70 seconds)

### Optimization Options
1. Reduce wait time for applications with fast startup (may cause false negatives)
2. Disable health checks: `CHECK_HEALTH=false` (saves ~2 seconds per app)
3. Test in parallel (requires significant resources and careful implementation)
4. Test specific categories or apps rather than entire suite

## Interpreting Results

### Common Failure Modes

1. **Container Fails to Start**
   - **Cause**: Missing Docker image, port conflicts, resource constraints
   - **Resolution**: Check logs, verify docker-compose.yml, ensure ports are available

2. **Health Check Failure**
   - **Cause**: Application not fully initialized, incorrect health URL, dependency not ready
   - **Resolution**: Increase wait time, verify health endpoint, check application logs

3. **Partial Startup**
   - **Cause**: One service started but others failed (multi-container apps)
   - **Resolution**: Check docker-compose logs for failing service

4. **Cleanup Failure**
   - **Cause**: Containers stuck, volumes in use, network issues
   - **Resolution**: Manual cleanup with `docker-compose down -v`, check for orphaned containers

### False Positives/Negatives

**False Negative (Test fails but app works):**
- Health endpoint takes longer than 60 seconds to respond
- Health endpoint requires authentication
- Health endpoint URL is incorrect in description.json

**False Positive (Test passes but app has issues):**
- Container starts but application crashes after test completes
- Health endpoint responds but application functionality is broken
- Resource limitations cause issues after initial startup

## Maintenance

### Updating the Test Plan
When adding new applications:
1. Ensure `description.json` includes valid `healthCheck` URL
2. Verify `docker-compose.yml` follows Hamnen naming conventions
3. Test the specific application before adding to test suite

### Test Script Maintenance
Update `test-all-apps.js` if:
- Docker Compose command format changes
- New status checking mechanisms are needed
- Different cleanup procedures are required
- Additional test steps need to be added

## Troubleshooting

### Script Fails to Start
```bash
# Check Node.js version (requires Node.js 12+)
node --version

# Check if apps directory exists
ls -la apps/

# Check Docker access
docker ps
docker-compose version
```

### Test Hangs or Times Out
```bash
# Check running containers
docker ps

# Stop all test containers
docker ps -a | grep hamnen_ | awk '{print $1}' | xargs docker stop
docker ps -a | grep hamnen_ | awk '{print $1}' | xargs docker rm

# Check system resources
docker stats
```

### Permission Errors
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Make script executable
chmod +x test-all-apps.js
```

## Reporting

### Test Report Contents
1. Executive Summary
   - Total applications tested
   - Pass/fail counts
   - Overall success rate
   - Duration

2. Detailed Results
   - Per-application results
   - Step-by-step status
   - Error messages
   - Container information

3. Failed Applications Analysis
   - List of failed applications
   - Failure reasons
   - Recommended actions

4. Recommendations
   - Configuration changes needed
   - Documentation updates
   - Application fixes required

### Test Results File Format
```json
{
  "total": 114,
  "passed": 102,
  "failed": 12,
  "skipped": 0,
  "details": [
    {
      "app": "web/nginx-demo",
      "name": "Nginx Demo",
      "category": "web",
      "success": true,
      "steps": {
        "start": { "attempted": true, "success": true },
        "status": {
          "attempted": true,
          "success": true,
          "data": {
            "running": true,
            "allRunning": true,
            "containers": [...]
          }
        },
        "health": {
          "attempted": true,
          "success": true,
          "data": {
            "checked": true,
            "healthy": true,
            "statusCode": 200,
            "url": "http://localhost:8080"
          }
        },
        "stop": { "attempted": true, "success": true }
      },
      "errors": []
    }
  ]
}
```

## Continuous Integration

### CI/CD Integration
The test script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Test All Apps
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Run tests
        run: node test-all-apps.js
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results.json
```

## Conclusion

This test plan provides comprehensive automated testing of all Hamnen application launch buttons. It ensures that:
- All applications can be launched successfully
- Containers start and run properly
- Health checks pass (when available)
- Cleanup is performed correctly
- Results are documented for analysis

Regular execution of this test suite helps maintain the quality and reliability of the Hamnen application launcher.
