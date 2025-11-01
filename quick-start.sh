#!/bin/bash

# Hamnen Quick Start Script
# This script helps you quickly start applications

set -e

APPS_DIR="apps"
NETWORK_NAME="hamnen-network"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ensure network exists
echo "Ensuring hamnen-network exists..."
docker network ls | grep -q "$NETWORK_NAME" || docker network create "$NETWORK_NAME"

# Function to start an application
start_app() {
    local app_name=$1
    local app_dir="$APPS_DIR/$app_name"
    
    if [ ! -d "$app_dir" ]; then
        echo "Error: App directory not found: $app_dir"
        return 1
    fi
    
    echo -e "${YELLOW}Starting $app_name...${NC}"
    cd "$app_dir"
    docker-compose -p "hamnen_$app_name" up -d
    cd - > /dev/null
    echo -e "${GREEN}✓ $app_name started${NC}"
}

# Function to stop an application
stop_app() {
    local app_name=$1
    local app_dir="$APPS_DIR/$app_name"
    
    if [ ! -d "$app_dir" ]; then
        echo "Error: App directory not found: $app_dir"
        return 1
    fi
    
    echo -e "${YELLOW}Stopping $app_name...${NC}"
    cd "$app_dir"
    docker-compose -p "hamnen_$app_name" down
    cd - > /dev/null
    echo -e "${GREEN}✓ $app_name stopped${NC}"
}

# Function to show app logs
logs_app() {
    local app_name=$1
    local app_dir="$APPS_DIR/$app_name"
    
    if [ ! -d "$app_dir" ]; then
        echo "Error: App directory not found: $app_dir"
        return 1
    fi
    
    cd "$app_dir"
    docker-compose -p "hamnen_$app_name" logs -f
    cd - > /dev/null
}

# Function to show app status
status_app() {
    local app_name=$1
    local app_dir="$APPS_DIR/$app_name"
    
    if [ ! -d "$app_dir" ]; then
        echo "Error: App directory not found: $app_dir"
        return 1
    fi
    
    cd "$app_dir"
    docker-compose -p "hamnen_$app_name" ps
    cd - > /dev/null
}

# List all applications
list_apps() {
    echo "Available applications:"
    find "$APPS_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | grep -v "README.md" | sort | nl
}

# Show usage
show_usage() {
    echo "Hamnen Quick Start"
    echo ""
    echo "Usage: $0 <command> <app-name>"
    echo ""
    echo "Commands:"
    echo "  start <app>   - Start an application"
    echo "  stop <app>    - Stop an application"
    echo "  restart <app> - Restart an application"
    echo "  logs <app>    - Show application logs"
    echo "  status <app>  - Show application status"
    echo "  list          - List all applications"
    echo ""
    echo "Examples:"
    echo "  $0 start portainer"
    echo "  $0 logs jellyfin"
    echo "  $0 list"
}

# Main execution
case "$1" in
    start)
        if [ -z "$2" ]; then
            echo "Error: Please specify an application name"
            show_usage
            exit 1
        fi
        start_app "$2"
        ;;
    stop)
        if [ -z "$2" ]; then
            echo "Error: Please specify an application name"
            show_usage
            exit 1
        fi
        stop_app "$2"
        ;;
    restart)
        if [ -z "$2" ]; then
            echo "Error: Please specify an application name"
            show_usage
            exit 1
        fi
        stop_app "$2"
        start_app "$2"
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "Error: Please specify an application name"
            show_usage
            exit 1
        fi
        logs_app "$2"
        ;;
    status)
        if [ -z "$2" ]; then
            echo "Error: Please specify an application name"
            show_usage
            exit 1
        fi
        status_app "$2"
        ;;
    list)
        list_apps
        ;;
    *)
        show_usage
        ;;
esac
