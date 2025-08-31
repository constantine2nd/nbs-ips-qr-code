# Makefile for NBS IPS QR Code Jekyll Application

.PHONY: help install build serve clean docker-up docker-down docker-logs test lint format

# Default target
help: ## Show this help message
	@echo "NBS IPS QR Code Jekyll Application"
	@echo "=================================="
	@echo ""
	@echo "Available targets:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
install: ## Install dependencies
	bundle install

serve: ## Start Jekyll development server
	bundle exec jekyll serve --livereload --incremental --force_polling

serve-host: ## Start Jekyll server accessible from network
	bundle exec jekyll serve --host 0.0.0.0 --livereload --incremental --force_polling

build: ## Build Jekyll site
	bundle exec jekyll build

build-prod: ## Build Jekyll site for production
	JEKYLL_ENV=production bundle exec jekyll build

clean: ## Clean Jekyll build files
	bundle exec jekyll clean
	rm -rf _site .jekyll-cache .sass-cache

# Docker
docker-build: ## Build Docker image
	docker-compose build

docker-up: ## Start application with Docker Compose
	docker-compose up -d

docker-dev: ## Start application with Docker Compose in development mode
	docker-compose up

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker container logs
	docker-compose logs -f

docker-restart: ## Restart Docker containers
	docker-compose restart

docker-rebuild: ## Rebuild and restart Docker containers
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Maintenance
update: ## Update dependencies
	bundle update

check-deps: ## Check for outdated dependencies
	bundle outdated

lint-html: ## Lint HTML files (requires htmlproofer)
	bundle exec htmlproofer ./_site --check-html --check-img-http --check-external-hash --check-opengraph

# Testing
test-links: ## Test external links (requires htmlproofer)
	bundle exec htmlproofer ./_site --external_only

validate-config: ## Validate Jekyll configuration
	bundle exec jekyll doctor

# Deployment
deploy-prep: clean build-prod ## Prepare for deployment
	@echo "Site built and ready for deployment in _site/"

# Development tools
watch-css: ## Watch CSS files for changes (if using SASS)
	sass --watch assets/css/main.scss:assets/css/main.css

format-js: ## Format JavaScript files (requires prettier)
	npx prettier --write "assets/js/**/*.js"

format-html: ## Format HTML files (requires prettier)
	npx prettier --write "**/*.html"

# Backup and restore
backup-templates: ## Create backup of template structure
	@echo "Creating template backup..."
	@mkdir -p backups
	@cp -r _layouts _includes assets backups/
	@echo "Backup created in backups/"

# Quick development commands
dev: install serve ## Install dependencies and start development server

quick-start: docker-up ## Quick start with Docker (recommended)

# Environment info
info: ## Show environment information
	@echo "Ruby version: $(shell ruby --version)"
	@echo "Bundle version: $(shell bundle --version)"
	@echo "Jekyll version: $(shell bundle exec jekyll --version)"
	@echo "Docker version: $(shell docker --version 2>/dev/null || echo 'Docker not installed')"
	@echo "Docker Compose version: $(shell docker-compose --version 2>/dev/null || echo 'Docker Compose not installed')"

# Performance
analyze: build ## Analyze build performance
	@echo "Build size analysis:"
	@du -sh _site
	@echo ""
	@echo "Largest files:"
	@find _site -type f -exec du -h {} + | sort -hr | head -10

# Security
security-check: ## Check for security issues in dependencies
	bundle audit check --update

# Local network testing
network-test: ## Start server accessible on local network
	@echo "Starting server accessible on local network..."
	@echo "Find your IP address and access via http://YOUR_IP:4000"
	@ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1
	bundle exec jekyll serve --host 0.0.0.0 --port 4000

# Production readiness check
prod-check: build-prod validate-config ## Check if ready for production
	@echo "Production readiness check completed"
	@echo "Site size: $(shell du -sh _site | cut -f1)"
	@echo "Number of pages: $(shell find _site -name "*.html" | wc -l)"

# File watching for specific components
watch-templates: ## Watch template files
	fswatch -o _layouts _includes | xargs -n1 -I{} bundle exec jekyll build

watch-assets: ## Watch asset files
	fswatch -o assets | xargs -n1 -I{} bundle exec jekyll build

# Default development workflow
all: clean install build ## Clean, install, and build

# Docker development workflow
docker-all: docker-down docker-build docker-up ## Complete Docker rebuild and start
