#!/bin/bash

# Quick test runner script for Hamnen applications
# Usage: ./run-tests.sh [options] [app-names...]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
CHECK_HEALTH=${CHECK_HEALTH:-true}
APPS_DIR=${APPS_DIR:-./apps}

# Help text
show_help() {
    cat << EOF
${BLUE}Hamnen Application Test Runner${NC}

Usage: ./run-tests.sh [options] [app-names...]

Options:
    -h, --help              Show this help message
    -n, --no-health         Disable health check verification
    -a, --apps-dir DIR      Set apps directory (default: ./apps)
    -l, --list              List all available applications
    -c, --category CAT      Test all apps in a category
    -q, --quick             Quick test (reduced wait time, no health checks)
    -d, --dry-run           Show what would be tested without running

Examples:
    # Test all applications
    ./run-tests.sh

    # Test specific applications
    ./run-tests.sh web/nginx-demo docker/portainer

    # Test without health checks (faster)
    ./run-tests.sh --no-health

    # Test all web applications
    ./run-tests.sh --category web

    # Quick test (10 second wait, no health checks)
    ./run-tests.sh --quick web/nginx-demo

    # List all available applications
    ./run-tests.sh --list

EOF
}

# List all applications
list_apps() {
    echo -e "${BLUE}Available applications:${NC}\n"

    for category in "$APPS_DIR"/*; do
        if [ -d "$category" ]; then
            category_name=$(basename "$category")
            echo -e "${GREEN}$category_name${NC}"

            for app in "$category"/*; do
                if [ -d "$app" ] && [ -f "$app/description.json" ]; then
                    app_name=$(basename "$app")
                    description=$(jq -r '.name // .description' "$app/description.json" 2>/dev/null || echo "")
                    echo "  - $category_name/$app_name $([ -n "$description" ] && echo "($description)")"
                fi
            done
            echo ""
        fi
    done
}

# Test apps in a category
test_category() {
    local category=$1
    local apps=()

    for app in "$APPS_DIR/$category"/*; do
        if [ -d "$app" ] && [ -f "$app/description.json" ]; then
            app_name=$(basename "$app")
            apps+=("$category/$app_name")
        fi
    done

    if [ ${#apps[@]} -eq 0 ]; then
        echo -e "${RED}No apps found in category: $category${NC}"
        exit 1
    fi

    echo -e "${BLUE}Testing ${#apps[@]} apps in category: $category${NC}\n"
    node test-all-apps.js "${apps[@]}"
}

# Parse options
DRY_RUN=false
LIST_ONLY=false
CATEGORY=""
QUICK=false
SPECIFIC_APPS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -n|--no-health)
            CHECK_HEALTH=false
            shift
            ;;
        -a|--apps-dir)
            APPS_DIR="$2"
            shift 2
            ;;
        -l|--list)
            LIST_ONLY=true
            shift
            ;;
        -c|--category)
            CATEGORY="$2"
            shift 2
            ;;
        -q|--quick)
            QUICK=true
            CHECK_HEALTH=false
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -*)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
        *)
            SPECIFIC_APPS+=("$1")
            shift
            ;;
    esac
done

# Export environment variables
export CHECK_HEALTH
export APPS_DIR

# Handle list only
if [ "$LIST_ONLY" = true ]; then
    list_apps
    exit 0
fi

# Handle category testing
if [ -n "$CATEGORY" ]; then
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would test all apps in category: $CATEGORY${NC}"
        exit 0
    fi
    test_category "$CATEGORY"
    exit 0
fi

# Check if test script exists
if [ ! -f "test-all-apps.js" ]; then
    echo -e "${RED}Error: test-all-apps.js not found!${NC}"
    echo "Make sure you're running this script from the Hamnen root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo "Please install Node.js to run the tests."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed!${NC}"
    echo "Please install Docker to run the tests."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed!${NC}"
    echo "Please install docker-compose to run the tests."
    exit 1
fi

# Display test configuration
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Hamnen Application Test Runner${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}Configuration:${NC}"
echo "  Apps directory: $APPS_DIR"
echo "  Health checks: $CHECK_HEALTH"
echo "  Quick mode: $QUICK"
if [ ${#SPECIFIC_APPS[@]} -gt 0 ]; then
    echo "  Testing specific apps: ${SPECIFIC_APPS[*]}"
else
    echo "  Testing: All applications"
fi
echo ""

# Dry run
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN] Would execute:${NC}"
    echo "node test-all-apps.js ${SPECIFIC_APPS[*]}"
    exit 0
fi

# Confirmation prompt for full test suite
if [ ${#SPECIFIC_APPS[@]} -eq 0 ] && [ "$QUICK" = false ]; then
    echo -e "${YELLOW}WARNING: Testing all applications will take approximately 2 hours.${NC}"
    echo -e "${YELLOW}This will start and stop over 100 Docker containers.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Test cancelled."
        exit 0
    fi
fi

# Run the tests
echo -e "\n${GREEN}Starting tests...${NC}\n"

if [ ${#SPECIFIC_APPS[@]} -gt 0 ]; then
    node test-all-apps.js "${SPECIFIC_APPS[@]}"
else
    node test-all-apps.js
fi

# Check exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
else
    echo -e "\n${RED}✗ Some tests failed. Check test-results.json for details.${NC}"
fi

exit $EXIT_CODE
