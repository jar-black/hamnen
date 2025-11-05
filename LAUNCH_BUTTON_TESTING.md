# Launch Button Testing Guide

Quick guide for testing all application launch buttons in Hamnen.

## Quick Start

```bash
# Test a single application (~70 seconds)
./run-tests.sh web/nginx-demo

# Test a category
./run-tests.sh --category web

# List all apps
./run-tests.sh --list

# Test all apps (~2 hours)
./run-tests.sh
```

## What It Tests

Each application goes through:
1. Start with `docker-compose up -d`
2. Wait 60 seconds for startup
3. Verify containers are running  
4. Check health endpoint (optional)
5. Stop with `docker-compose down`
6. Clean up volumes

## Files

- `test-all-apps.js` - Main test script
- `run-tests.sh` - Convenient wrapper
- `TEST_PLAN.md` - Detailed documentation
- `test-results.json` - Results (generated)

## Options

```bash
-h, --help          # Show help
-n, --no-health     # Skip health checks (faster)
-l, --list          # List all apps
-c, --category      # Test by category
-d, --dry-run       # Preview what will run
```

## Examples

```bash
# Multiple specific apps
./run-tests.sh web/nginx-demo docker/portainer

# Without health checks
./run-tests.sh --no-health web/nginx-demo

# All monitoring apps
./run-tests.sh --category monitoring
```

## Results

Console shows real-time progress with:
- ✓ Green = success
- ✗ Red = failure  
- Yellow = warnings

Results saved to `test-results.json` with detailed step information.

## Common Issues

**Port conflicts**: Another service using the port
```bash
lsof -i :8080  # Check what's using port 8080
```

**Health check fails**: App needs more time or wrong URL

**Permission denied**: Need Docker access
```bash
sudo usermod -aG docker $USER
```

## See Also

- `TEST_PLAN.md` - Complete test methodology
- `TESTING.md` - Other test suites (API, Docker, CI/CD)
