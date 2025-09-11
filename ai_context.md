# AI Context Documentation - NBS IPS QR Code Project

## Project Overview

The **NBS IPS QR Code** application is a Jekyll-based static site generator for creating and validating QR codes for the Serbian National Bank (NBS) Instant Payment System (IPS). The project provides tools for QR code generation, validation, and template management.

### Key Technologies
- **Jekyll 4.3.4** - Static site generator
- **Ruby 3.2** - Runtime environment
- **Docker & Docker Compose** - Containerization
- **Bootstrap 5.3** - Frontend framework
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Deployment target

## Project Structure

```
nbs-ips-qr-code/
├── _config.yml              # Jekyll configuration
├── _data/                   # Data files
├── _includes/               # Reusable template components
├── _layouts/                # Page templates
├── assets/
│   ├── css/main.css        # Custom styles
│   ├── js/                 # JavaScript modules
│   │   ├── main.js         # Main application logic
│   │   ├── api.js          # API interactions
│   │   ├── templates.js    # Template management
│   │   └── i18n.js         # Internationalization
│   └── i18n/               # Translation files (sr_RS, sr_RS_Latn, en)
├── *.html                  # Main pages (index, generator, validator, etc.)
├── Gemfile                 # Ruby dependencies
├── Gemfile.lock            # Locked dependency versions
├── Dockerfile              # Container definition
├── docker-compose.yml      # Local development setup
├── start.sh                # Development utility script
└── .github/workflows/      # CI/CD pipeline
    └── jekyll.yml          # GitHub Actions workflow
```

## Development vs Production Environments

### 🛠️ Local Development (start.sh)
- **Purpose**: Developer productivity and testing
- **Tool**: `start.sh` script with multiple commands
- **Environment**: Development mode with live reload
- **Docker**: Uses docker-compose.yml for local setup
- **Port**: http://localhost:4000
- **Features**: Live reload, incremental builds, debug mode

### 🚀 Production (GitHub Workflows)
- **Purpose**: Automated testing, building, and deployment
- **Tool**: GitHub Actions (`.github/workflows/jekyll.yml`)
- **Environment**: Production mode with optimizations
- **Docker**: Uses standalone Dockerfile for testing
- **Deployment**: GitHub Pages
- **Features**: Comprehensive testing, security audits, HTML validation

## Key Issues & Solutions

### Historical Problem: Gem Dependency Conflicts
**Issue**: Docker builds failing with `Could not find rexml-3.4.2 in locally installed gems (Bundler::GemNotFound)`

**Root Cause**: 
1. Dockerfile copied both `Gemfile` and `Gemfile.lock`
2. `bundle install` generated newer versions (e.g., `rexml 3.4.4`) 
3. `COPY . .` overwrote the updated lock file with original (older versions)
4. Jekyll build failed due to version mismatches

**Solution Applied**:
```dockerfile
# Copy Gemfile only (let bundler generate fresh lock file)
COPY Gemfile ./

# Install gems without existing lock file conflicts
RUN bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Handle volume mount conflicts from docker-compose
RUN bundle install --jobs 4 --retry 3
```

## start.sh Script Usage

The `start.sh` script is the **primary tool for local development**.

### Available Commands

```bash
./start.sh docker     # Start with Docker Compose (recommended)
./start.sh local      # Start with local Ruby/Jekyll  
./start.sh build      # Build and test the application
./start.sh clean      # Clean build files
./start.sh install    # Install dependencies
./start.sh setup      # Setup development environment
./start.sh fix-deps   # Fix gem dependency conflicts
./start.sh stop       # Stop running containers
./start.sh logs       # Show application logs
./start.sh restart    # Restart the application
./start.sh status     # Check application status
./start.sh help       # Show usage information
```

### Common Development Workflow

```bash
# First time setup
./start.sh setup

# Start development server
./start.sh docker

# View logs if needed
./start.sh logs

# Stop when done
./start.sh stop

# If dependency issues arise
./start.sh fix-deps
```

## GitHub Workflow (jekyll.yml)

The workflow runs **automatically on push/PR** and includes these jobs:

### 1. **build** Job
- Sets up Ruby 3.2 environment
- Adds platform compatibility (`bundle lock --add-platform x86_64-linux`)
- Installs dependencies (`bundle install`)
- Builds Jekyll site for production
- Uploads build artifacts for deployment

### 2. **deploy** Job  
- Deploys to GitHub Pages (on main branch only)
- Uses built artifacts from build job

### 3. **test** Job
- Builds Jekyll site
- Runs `jekyll doctor` for configuration validation
- Runs HTML validation with html-proofer

### 4. **security** Job
- Performs security audit with bundler-audit
- Checks for known vulnerabilities in dependencies

### 5. **docker** Job
- Builds Docker image using production Dockerfile
- Tests container startup and health endpoint
- Validates Docker containerization works properly

## Development Environment Setup

### Prerequisites
- Docker and Docker Compose
- (Optional) Ruby 3.2 and Bundler for local development

### Quick Start
```bash
# Clone repository
git clone https://github.com/constantine2nd/nbs-ips-qr-code.git
cd nbs-ips-qr-code

# Start development environment
./start.sh docker

# Access application
open http://localhost:4000
```

## Common Troubleshooting

### Issue: Gem dependency conflicts
**Solution**: `./start.sh fix-deps`

### Issue: Docker build failures  
**Solution**: 
```bash
./start.sh clean
./start.sh build
```

### Issue: Container won't start
**Solution**:
```bash
./start.sh logs  # Check error messages
./start.sh stop && ./start.sh docker  # Restart
```

### Issue: Port already in use
**Solution**: Check docker-compose.yml ports or stop conflicting services

## Configuration Files

### _config.yml (Jekyll)
- Site configuration and build settings
- Plugin configurations (jekyll-feed, jekyll-sitemap, jekyll-seo-tag)
- Development vs production environment handling

### docker-compose.yml
- **Development environment only**
- Volume mounts for live reload: `.:/app`
- LiveReload port: `35729`
- Development environment variables
- Handles Gemfile.lock conflicts with `rm -f Gemfile.lock`

### Dockerfile
- **Production-ready container**
- Multi-stage optimization
- Handles gem dependency conflicts properly
- Used by both GitHub workflows and start.sh build testing

## Testing & Validation Checklist

After making changes, verify these work:

### ✅ Local Development Testing
- [ ] `./start.sh docker` starts successfully
- [ ] Application accessible at http://localhost:4000
- [ ] Health endpoint responds: http://localhost:4000/health.html
- [ ] `./start.sh build` completes without errors
- [ ] `./start.sh logs` shows no error messages
- [ ] `./start.sh stop` stops containers cleanly

### ✅ GitHub Workflow Testing  
- [ ] Push changes to main branch
- [ ] All workflow jobs pass: build, deploy, test, security, docker
- [ ] No dependency conflict errors in logs
- [ ] GitHub Pages deployment succeeds
- [ ] Site accessible on GitHub Pages URL

### ✅ Feature Testing
- [ ] QR code generator page loads
- [ ] QR code validator page loads  
- [ ] Template management works
- [ ] Language switching functions
- [ ] Health check page shows all green status

## Multi-language Support

The application supports three languages:
- **Serbian Cyrillic** (`sr_RS`)
- **Serbian Latin** (`sr_RS_Latn`) 
- **English** (`en`)

Translation files are located in `assets/i18n/` and managed via `assets/js/i18n.js`.

## API Integration

The application integrates with the NBS QR code validation API:
- **Endpoint**: `https://nbs.rs/QRcode/api/qr/v1/validate`
- **Method**: POST
- **Content-Type**: `text/plain`

CORS limitations may apply when testing locally.

## Security Considerations

- No sensitive API keys are hardcoded
- Dependencies are regularly audited via GitHub workflow
- HTML content is validated and sanitized
- HTTPS enforced in production via GitHub Pages

## Performance Optimization

- Jekyll incremental builds enabled in development
- Asset minification in production builds
- Docker layer caching for faster builds
- GitHub Actions cache for dependencies

---

**Last Updated**: September 2024  
**Workflow Status**: ✅ All systems operational  
**Development Environment**: Docker Compose recommended