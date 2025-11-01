#!/bin/bash

# Hamnen Test Runner Script
# This script sets up the environment and runs the test suite

# Set the apps directory
export APPS_DIR="${APPS_DIR:-$(pwd)/apps}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════════"
echo "         HAMNEN TEST SUITE RUNNER"
echo "════════════════════════════════════════════════════"
echo ""
echo "Apps directory: $APPS_DIR"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is available"
else
    echo -e "${YELLOW}⚠${NC} Docker is not available - some tests will be skipped"
fi

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${YELLOW}⚠${NC} Backend is not running - API tests may fail"
    echo "  Start with: cd backend && npm run dev"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo ""

# Run the tests
node test.js "$@"
