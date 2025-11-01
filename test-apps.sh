#!/bin/bash

# Hamnen Application Testing Script
# This script tests each dockerized application one by one
# Usage: ./test-apps.sh [app-name] or ./test-apps.sh all

set -e

APPS_DIR="apps"
LOG_DIR="test-logs"
NETWORK_NAME="hamnen-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create log directory
mkdir -p "$LOG_DIR"

# Ensure network exists
echo "Ensuring hamnen-network exists..."
docker network ls | grep -q "$NETWORK_NAME" || docker network create "$NETWORK_NAME"

# Function to test an application
test_app() {
    local app_name=$1
    local app_dir="$APPS_DIR/$app_name"
    
    if [ ! -d "$app_dir" ]; then
        echo -e "${RED}❌ App directory not found: $app_dir${NC}"
        return 1
    fi
    
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Testing: $app_name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$app_dir"
    
    # Start the application
    echo "Starting $app_name..."
    if docker-compose -p "hamnen_$app_name" up -d 2>&1 | tee "$LOG_DIR/$app_name-start.log"; then
        echo -e "${GREEN}✓ Started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start${NC}"
        cd - > /dev/null
        return 1
    fi
    
    # Wait for containers to be healthy
    echo "Waiting for containers to be ready (10 seconds)..."
    sleep 10
    
    # Check container status
    echo "Checking container status..."
    if docker-compose -p "hamnen_$app_name" ps | grep -q "Up"; then
        echo -e "${GREEN}✓ Containers are running${NC}"
        docker-compose -p "hamnen_$app_name" ps
    else
        echo -e "${RED}❌ Containers are not running properly${NC}"
        docker-compose -p "hamnen_$app_name" ps
        docker-compose -p "hamnen_$app_name" logs | tail -n 50 > "$LOG_DIR/$app_name-error.log"
        cd - > /dev/null
        return 1
    fi
    
    # Show logs (last 20 lines)
    echo "Recent logs:"
    docker-compose -p "hamnen_$app_name" logs --tail=20
    
    # Cleanup
    echo "Stopping and cleaning up $app_name..."
    docker-compose -p "hamnen_$app_name" down -v 2>&1 | tee "$LOG_DIR/$app_name-cleanup.log"
    
    # Remove images to save space
    echo "Removing images for $app_name..."
    docker-compose -p "hamnen_$app_name" down --rmi all -v 2>&1 | tee -a "$LOG_DIR/$app_name-cleanup.log" || true
    
    echo -e "${GREEN}✓ Test completed for $app_name${NC}"
    
    cd - > /dev/null
    return 0
}

# Get list of all apps
get_all_apps() {
    find "$APPS_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | grep -v "README.md" | sort
}

# Main execution
if [ "$1" == "all" ]; then
    echo "Testing all applications..."
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    FAILED_APPS=()
    
    for app in $(get_all_apps); do
        if test_app "$app"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
            FAILED_APPS+=("$app")
        fi
    done
    
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Test Summary${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Successful: $SUCCESS_COUNT${NC}"
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
    
    if [ ${#FAILED_APPS[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed applications:${NC}"
        for app in "${FAILED_APPS[@]}"; do
            echo -e "  - $app"
        done
    fi
    
elif [ -n "$1" ]; then
    # Test specific app
    test_app "$1"
else
    echo "Usage: $0 [app-name|all]"
    echo ""
    echo "Available applications:"
    get_all_apps | sed 's/^/  - /'
    exit 1
fi
