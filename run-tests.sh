#!/bin/bash

# DockingMate Playwright Test Runner
# Usage: ./run-tests.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
HEADLESS=true
BROWSER="chromium"
SUITE=""
DEBUG=false
UI=false
DOCKER=false

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --headed           Run tests in headed mode (with browser UI)"
    echo "  -b, --browser BROWSER  Browser to use (chromium, firefox, webkit, all)"
    echo "  -s, --suite SUITE      Test suite to run (auth, berth, dashboard, profile, general, blog)"
    echo "  -d, --debug           Run tests in debug mode"
    echo "  -u, --ui              Run tests in UI mode"
    echo "  -D, --docker          Run tests using Docker"
    echo "  --install             Install Playwright browsers"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Run all tests headless"
    echo "  $0 -h -b firefox           # Run all tests in Firefox with UI"
    echo "  $0 -s auth                 # Run only authentication tests"
    echo "  $0 -D                      # Run tests in Docker"
    echo "  $0 --install               # Install browsers"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--headed)
            HEADLESS=false
            shift
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -s|--suite)
            SUITE="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -u|--ui)
            UI=true
            shift
            ;;
        -D|--docker)
            DOCKER=true
            shift
            ;;
        --install)
            echo -e "${YELLOW}Installing Playwright browsers...${NC}"
            npx playwright install
            exit 0
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Function to run Docker tests
run_docker_tests() {
    echo -e "${YELLOW}Running tests using Docker...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    # Build and run tests
    docker-compose up --build --abort-on-container-exit
    docker-compose down
}

# Function to run local tests
run_local_tests() {
    echo -e "${YELLOW}Setting up test environment...${NC}"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    # Install browsers if not already installed
    if [ ! -d "node_modules/.bin" ]; then
        echo -e "${YELLOW}Installing Playwright browsers...${NC}"
        npx playwright install
    fi
    
    # Check if DockingMate frontend is running
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo -e "${YELLOW}Warning: DockingMate frontend is not running on http://localhost:3000${NC}"
        echo -e "${YELLOW}Please start the frontend application first.${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Construct test command
    CMD="npx playwright test"
    
    # Add browser option
    if [ "$BROWSER" != "all" ]; then
        CMD="$CMD --project=$BROWSER"
    fi
    
    # Add suite option
    if [ -n "$SUITE" ]; then
        CMD="$CMD tests/$SUITE/"
    fi
    
    # Add debug option
    if [ "$DEBUG" = true ]; then
        CMD="$CMD --debug"
    fi
    
    # Add UI option
    if [ "$UI" = true ]; then
        CMD="$CMD --ui"
    fi
    
    # Add headed option
    if [ "$HEADLESS" = false ]; then
        CMD="$CMD --headed"
    fi
    
    echo -e "${YELLOW}Running command: $CMD${NC}"
    echo ""
    
    # Run tests
    eval $CMD
    
    # Check exit code
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tests completed successfully!${NC}"
    else
        echo -e "${RED}❌ Tests failed!${NC}"
        echo -e "${YELLOW}Check test-results/ directory for screenshots and logs${NC}"
        exit 1
    fi
}

# Main execution
echo -e "${YELLOW}🎭 DockingMate Playwright Test Runner${NC}"
echo "========================================"

if [ "$DOCKER" = true ]; then
    run_docker_tests
else
    run_local_tests
fi

echo -e "${GREEN}Test execution completed!${NC}"