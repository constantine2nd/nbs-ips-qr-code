#!/bin/bash

# NBS IPS QR Code Application Startup Script
# This script provides easy commands to start the Jekyll application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    echo -e "${YELLOW}[DEBUG]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check dependencies
check_dependencies() {
    print_info "Checking dependencies..."

    local missing_deps=()

    if ! command_exists docker; then
        missing_deps+=("docker")
    fi

    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi

    if ! command_exists ruby && [[ "$1" != "docker" ]]; then
        missing_deps+=("ruby")
    fi

    if ! command_exists bundle && [[ "$1" != "docker" ]]; then
        missing_deps+=("bundler")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo "Please install the missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            case $dep in
                docker)
                    echo "  - Docker: https://docs.docker.com/get-docker/"
                    ;;
                docker-compose)
                    echo "  - Docker Compose: https://docs.docker.com/compose/install/"
                    ;;
                ruby)
                    echo "  - Ruby: https://www.ruby-lang.org/en/installation/"
                    ;;
                bundler)
                    echo "  - Bundler: gem install bundler"
                    ;;
            esac
        done
        exit 1
    fi

    print_success "All dependencies found!"
}

# Function to show usage
show_usage() {
    echo "NBS IPS QR Code Application Startup Script"
    echo "=========================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  docker     Start with Docker Compose (recommended)"
    echo "  local      Start with local Ruby/Jekyll"
    echo "  build      Build the application"
    echo "  clean      Clean build files"
    echo "  install    Install dependencies"
    echo "  setup      Setup development environment (fix platforms)"
    echo "  fix-deps   Fix gem dependency conflicts"
    echo "  stop       Stop running containers"
    echo "  logs       Show application logs"
    echo "  restart    Restart the application"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 docker    # Start with Docker (easiest)"
    echo "  $0 local     # Start with local Jekyll"
    echo "  $0 setup     # Fix platform compatibility issues"
    echo "  $0 build     # Build the site"
    echo ""
}

# Function to start with Docker
start_docker() {
    print_info "Starting NBS IPS QR Code application with Docker..."

    check_dependencies docker

    if docker-compose ps | grep -q "nbs-ips-qr-code"; then
        print_warning "Application is already running. Stopping first..."
        docker-compose down
    fi

    print_info "Building and starting containers..."
    docker-compose up --build -d

    print_success "Application started successfully!"
    print_info "Access the application at: http://localhost:4000"
    print_info "View logs with: $0 logs"
    print_info "Stop with: $0 stop"

    # Wait a moment and check if container is running
    sleep 3
    if docker-compose ps | grep -q "Up"; then
        print_success "Container is running successfully!"

        # Try to open browser (works on macOS and some Linux systems)
        if command_exists open; then
            open http://localhost:4000
        elif command_exists xdg-open; then
            xdg-open http://localhost:4000
        fi
    else
        print_error "Container failed to start. Check logs with: $0 logs"
        exit 1
    fi
}

# Function to start locally
start_local() {
    print_info "Starting NBS IPS QR Code application locally..."

    check_dependencies local

    if [ ! -f "Gemfile" ]; then
        print_error "Gemfile not found. Are you in the correct directory?"
        exit 1
    fi

    print_info "Installing Ruby dependencies..."
    # Fix platform compatibility first
    if ! bundle lock --add-platform x86_64-linux >/dev/null 2>&1; then
        print_warning "Could not add x86_64-linux platform (this is normal on some systems)"
    fi
    bundle install

    print_info "Starting Jekyll server..."
    print_info "Access the application at: http://localhost:4000"

    # Start Jekyll with live reload
    bundle exec jekyll serve --livereload --incremental --force_polling
}

# Function to build application
build_app() {
    print_info "Building NBS IPS QR Code application..."

    if command_exists docker && command_exists docker-compose; then
        print_info "Building with Docker..."

        # Stop any running containers first
        if docker-compose ps | grep -q "Up"; then
            print_info "Stopping existing containers..."
            docker-compose down
        fi

        # Clean up any cached images to ensure fresh build
        print_info "Cleaning Docker cache..."
        docker-compose build --no-cache

        # Test the built image
        print_info "Testing Docker build..."
        if docker-compose up -d; then
            sleep 10
            if docker-compose ps | grep -q "Up"; then
                print_success "Docker build and test successful!"

                # Test health endpoint
                if command_exists curl; then
                    for i in {1..6}; do
                        if curl -f -s http://localhost:4000/health.html > /dev/null 2>&1; then
                            print_success "Health check passed!"
                            break
                        fi
                        if [ $i -eq 6 ]; then
                            print_warning "Health check failed, but container is running"
                        fi
                        sleep 5
                    done
                fi

                docker-compose down
            else
                print_error "Docker container failed to start properly"
                docker-compose logs
                exit 1
            fi
        else
            print_error "Failed to start Docker container for testing"
            exit 1
        fi
    fi

    if command_exists bundle; then
        print_info "Building Jekyll site locally..."

        # Handle Gemfile.lock conflicts
        print_info "Resolving gem dependencies..."
        if [ -f "Gemfile.lock" ]; then
            print_info "Backing up existing Gemfile.lock..."
            cp Gemfile.lock Gemfile.lock.backup
        fi

        # Add platform compatibility and install
        bundle lock --add-platform x86_64-linux || print_warning "Could not add x86_64-linux platform"
        bundle install

        # Build the site
        print_info "Building Jekyll site..."
        JEKYLL_ENV=production bundle exec jekyll build

        if [ -f "_site/index.html" ]; then
            print_success "Jekyll site built successfully!"
            print_info "Site files are in _site/ directory"
        else
            print_error "Jekyll build failed - no index.html found in _site/"

            # Restore backup if available
            if [ -f "Gemfile.lock.backup" ]; then
                print_info "Restoring Gemfile.lock backup..."
                mv Gemfile.lock.backup Gemfile.lock
            fi
            exit 1
        fi

        # Clean up backup
        if [ -f "Gemfile.lock.backup" ]; then
            rm Gemfile.lock.backup
        fi
    fi

    if ! command_exists docker && ! command_exists bundle; then
        print_error "Neither Docker nor Ruby/Bundle found. Please install one of them."
        echo "Options:"
        echo "  1. Install Docker: https://docs.docker.com/get-docker/"
        echo "  2. Install Ruby and Bundler: https://www.ruby-lang.org/en/installation/"
        exit 1
    fi
}

# Function to clean build files
clean_app() {
    print_info "Cleaning build files..."

    if [ -d "_site" ]; then
        rm -rf _site
        print_info "Removed _site directory"
    fi

    if [ -d ".jekyll-cache" ]; then
        rm -rf .jekyll-cache
        print_info "Removed .jekyll-cache directory"
    fi

    if [ -d ".sass-cache" ]; then
        rm -rf .sass-cache
        print_info "Removed .sass-cache directory"
    fi

    if command_exists bundle; then
        bundle exec jekyll clean
    fi

    print_success "Clean completed!"
}

# Function to install dependencies
install_deps() {
    print_info "Installing dependencies..."

    if command_exists bundle; then
        # Fix platform compatibility first
        print_info "Adding platform compatibility for x86_64-linux..."
        if bundle lock --add-platform x86_64-linux; then
            print_success "Platform compatibility added!"
        else
            print_warning "Could not add platform (this is normal on some systems)"
        fi

        bundle install
        print_success "Ruby dependencies installed!"
    fi

    if command_exists npm && [ -f "package.json" ]; then
        npm install
        print_success "Node.js dependencies installed!"
    fi
}

# Function to setup development environment
setup_dev() {
    print_info "Setting up development environment..."

    if ! command_exists bundle; then
        print_error "Bundler is required. Install with: gem install bundler"
        exit 1
    fi

    print_info "Adding platform compatibility..."
    if bundle lock --add-platform x86_64-linux; then
        print_success "Added x86_64-linux platform support"
    else
        print_warning "Could not add x86_64-linux platform (this might be normal)"
    fi

    if bundle lock --add-platform x86_64-linux-musl; then
        print_success "Added x86_64-linux-musl platform support"
    else
        print_warning "Could not add x86_64-linux-musl platform"
    fi

    print_info "Installing dependencies..."
    bundle install

    print_success "Development environment setup complete!"
    print_info "You can now run the application with:"
    print_info "  $0 local    # For local development"
    print_info "  $0 docker   # For Docker development"
}

# Function to fix gem dependency conflicts
fix_deps() {
    print_info "Fixing gem dependency conflicts..."

    if ! command_exists bundle; then
        print_error "Bundler is required. Install with: gem install bundler"
        exit 1
    fi

    # Backup current Gemfile.lock
    if [ -f "Gemfile.lock" ]; then
        print_info "Backing up current Gemfile.lock..."
        cp Gemfile.lock Gemfile.lock.backup.$(date +%s)
        print_debug "Created backup: Gemfile.lock.backup.$(date +%s)"
    fi

    # Remove problematic lock file
    print_info "Removing existing Gemfile.lock to resolve conflicts..."
    rm -f Gemfile.lock

    # Clear bundle cache
    print_info "Clearing bundle cache..."
    if [ -d ".bundle" ]; then
        rm -rf .bundle
    fi

    # Configure bundle settings
    print_info "Configuring bundle settings..."
    bundle config set --local path vendor/bundle
    bundle config set --local deployment false

    # Add platform compatibility
    print_info "Adding platform compatibility..."
    bundle lock --add-platform ruby
    bundle lock --add-platform x86_64-linux
    bundle lock --add-platform x86_64-linux-gnu

    # Install gems with fresh lock file
    print_info "Installing gems with fresh dependency resolution..."
    bundle install --jobs 4 --retry 3

    # Verify installation
    print_info "Verifying gem installation..."
    if bundle check; then
        print_success "Gem dependencies fixed successfully!"
        print_info "New Gemfile.lock generated with compatible versions"

        # Test Jekyll
        if bundle exec jekyll --version >/dev/null 2>&1; then
            print_success "Jekyll is working correctly"
        else
            print_warning "Jekyll test failed, but gems are installed"
        fi
    else
        print_error "Bundle check failed. Please review the output above."

        # Try to restore backup if available
        backup_file=$(ls -t Gemfile.lock.backup.* 2>/dev/null | head -n1)
        if [ -n "$backup_file" ]; then
            print_info "Restoring backup: $backup_file"
            cp "$backup_file" Gemfile.lock
        fi
        exit 1
    fi

    print_success "Dependency fix completed!"
    print_info "You can now run:"
    print_info "  $0 build   # To build the application"
    print_info "  $0 local   # To start locally"
    print_info "  $0 docker  # To start with Docker"
}

# Function to stop application
stop_app() {
    print_info "Stopping NBS IPS QR Code application..."

    if docker-compose ps | grep -q "nbs-ips-qr-code"; then
        docker-compose down
        print_success "Application stopped!"
    else
        print_warning "No running containers found"
    fi
}

# Function to show logs
show_logs() {
    if docker-compose ps | grep -q "nbs-ips-qr-code"; then
        print_info "Showing application logs (press Ctrl+C to exit)..."
        docker-compose logs -f
    else
        print_error "No running containers found. Start the application first."
        exit 1
    fi
}

# Function to restart application
restart_app() {
    print_info "Restarting NBS IPS QR Code application..."
    stop_app
    sleep 2
    start_docker
}

# Function to check application status
check_status() {
    print_info "Checking application status..."

    if docker-compose ps | grep -q "Up"; then
        print_success "Application is running"
        docker-compose ps
        echo ""
        print_info "Access at: http://localhost:4000"
    else
        print_warning "Application is not running"
        echo "Start with: $0 docker"
    fi
}

# Main script logic
case "${1:-help}" in
    docker)
        start_docker
        ;;
    local)
        start_local
        ;;
    build)
        build_app
        ;;
    clean)
        clean_app
        ;;
    install)
        install_deps
        ;;
    setup)
        setup_dev
        ;;
    stop)
        stop_app
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_app
        ;;
    fix-deps)
        fix_deps
        ;;
    status)
        check_status
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
