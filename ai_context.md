# AI Context Documentation - NBS IPS QR Code Project

## Project Overview

The **NBS IPS QR Code** application is a Jekyll-based static site generator for creating and validating QR codes for the Serbian National Bank (NBS) Instant Payment System (IPS). The project provides tools for QR code generation, validation, template management, and comprehensive sharing functionality optimized for mobile devices.

### Key Technologies
- **Jekyll 4.3.4** - Static site generator
- **Ruby 3.2** - Runtime environment
- **Docker & Docker Compose** - Containerization
- **Bootstrap 5.3** - Frontend framework
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Deployment target
- **NBS WebApp Integration** - Account information lookup API

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

## Key Features

### QR Code Generation & Validation
- Full NBS IPS compliance
- Multiple payment types (PR, PT, EK)
- Real-time validation
- Template management system
- **Account Information Lookup** - Integration with NBS WebApp Center for recipient account details

### Mobile-First Sharing System
- Native mobile sharing (iOS/Android)
- Platform-specific integrations:
  - **Viber** - Deep linking + fallback to web
  - **WhatsApp** - Direct messaging integration
  - **Telegram** - App + web sharing
  - **SMS** - Native messaging apps
  - **Email** - Native email clients
- Copy link functionality
- Enhanced download for mobile devices
- Print functionality

### Account Information Lookup System
- **Real-time Account Validation** - Lookup recipient account details from NBS WebApp Center
- **Account Data Population** - Auto-fill recipient name and address from account information
- **Multi-language Support** - Full translation support for account lookup interface
- **Error Handling** - Comprehensive error handling for network issues and invalid accounts
- **Security** - XSS protection with HTML escaping for displayed account data

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

### ✅ Sharing Functionality Testing
- [ ] Share button appears after QR generation
- [ ] Share options expand/collapse properly  
- [ ] All buttons display in single column layout
- [ ] Download and Print buttons are properly translated
- [ ] No JavaScript errors in browser console (shareQRCode function accessible)
- [ ] Native sharing works on mobile devices (iOS/Android)
- [ ] Email sharing opens native email client with pre-filled subject/body
- [ ] SMS sharing opens native messaging app with formatted message
- [ ] WhatsApp sharing opens WhatsApp with pre-filled message
- [ ] Viber sharing works (deep link + App Store fallback)
- [ ] Telegram sharing functions properly (app + web fallback)
- [ ] Copy link functionality works with clipboard API
- [ ] Enhanced mobile download shows proper instructions on iOS
- [ ] All sharing options work on desktop with web fallbacks
- [ ] Sharing translations display correctly in all languages
- [ ] Device detection works properly (iOS/Android/Desktop)
- [ ] Error handling shows appropriate messages

## Mobile Sharing Implementation Details

### Native Sharing API
- Uses `navigator.share()` when available
- Automatically detects file sharing capabilities
- Falls back to URL sharing if file sharing unsupported
- Graceful degradation for unsupported browsers

### Platform-Specific Integrations

#### Viber Integration
```javascript
// Direct app integration
viber://forward?text=${message}

// Fallback to Viber web with deep linking
https://3p3x.adj.st/?adjust_t=u783g1_kw9yml&adjust_fallback=...
```

#### WhatsApp Integration
```javascript
// Universal WhatsApp URL
https://wa.me/?text=${message}
```

#### Telegram Integration
```javascript
// Try app first: tg://msg?text=${message}
// Fallback to web: https://t.me/share/url?url=...
```

#### SMS Integration
```javascript
// iOS: sms:&body=${message}
// Android: sms:?body=${message}
```

### Device Detection
- **Mobile Detection**: `/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i`
- **iOS Detection**: `/iPad|iPhone|iPod/`
- **Android Detection**: `/Android/i`

### Fallback Mechanisms
- Copy to clipboard for failed sharing
- Alternative sharing methods for unsupported platforms
- Desktop-specific sharing behaviors

## Multi-language Support

The application supports three languages:
- **Serbian Cyrillic** (`sr_RS`)
- **Serbian Latin** (`sr_RS_Latn`) 
- **English** (`en`)

Translation files are located in `assets/i18n/` and managed via `assets/js/i18n.js`.

### Sharing Translations
All sharing options are fully translated:
- `generator.share.title` - "Share QR Code"
- `generator.share.native` - Native sharing button
- `generator.share.email` - Email option
- `generator.share.whatsapp` - WhatsApp option
- `generator.share.viber` - Viber option
- `generator.share.telegram` - Telegram option
- And more...

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

## Mobile Optimization

### Touch-Friendly Interface
- Minimum 44px touch targets on iOS
- Responsive button layouts
- Mobile-first CSS design
- Optimized for thumb navigation

### Performance Considerations
- Lazy loading for sharing options
- Efficient device detection
- Minimal JavaScript footprint
- Fast share option animations

### Cross-Platform Compatibility
- Works on iOS Safari, Chrome, Firefox
- Android Chrome, Samsung Internet, Edge
- Desktop browsers with graceful fallbacks
- PWA-ready sharing capabilities

## Browser Compatibility

### Native Sharing Support
- **iOS Safari 14+**: Full file and URL sharing
- **Android Chrome 89+**: Full sharing capabilities
- **Desktop browsers**: URL sharing only
- **Older browsers**: Fallback to individual share methods

### Deep Link Support
- **iOS**: Universal links and custom URL schemes
- **Android**: Intent handling and app detection
- **Desktop**: Web-based sharing interfaces

## Final Implementation Status

### ✅ Core Features (Completed)
- Jekyll 4.3.4 static site generation
- NBS IPS QR code generation and validation
- Template management system
- Multi-language support (SR_RS, SR_RS_Latn, EN)
- GitHub Actions CI/CD pipeline
- Docker containerization

### ✅ Mobile Sharing System (Completed)
- Native mobile sharing (iOS/Android Share Sheets)
- Platform-specific integrations (WhatsApp, Viber, Telegram, SMS, Email)
- Enhanced mobile download with iOS-specific instructions
- Copy link functionality with clipboard API
- Single column responsive button layout
- Comprehensive error handling and user feedback
- Full translation support across all languages
- Device detection and graceful fallbacks

### 🚀 Ready for Production
- All GitHub workflow jobs passing
- Docker build/deployment working
- Mobile sharing tested and functional
- Responsive design optimized for touch devices
- Cross-platform compatibility verified

---

## ✅ Account Information Lookup Feature (COMPLETED)

### Task Implementation Status
**COMPLETED**: ✅ Account lookup functionality has been successfully implemented with the following features:

- **Account Info Button**: Added info button (ℹ️) next to Recipient Account field
- **Modal Integration**: Created dedicated modal for displaying account information
- **API Integration**: Connected to NBS WebApp Center API endpoint
- **Data Parsing**: Robust HTML parsing with pattern matching for reliable data extraction
- **Auto-fill Feature**: "Use This Information" button to populate recipient name and address
- **Multi-language Support**: Full translations in Serbian Cyrillic, Latin, and English
- **Error Handling**: Comprehensive error handling for CORS, network, and validation issues
- **Security**: XSS protection with HTML escaping for all displayed data

## Account Information Lookup Feature

### Overview
The Account Information Lookup feature provides real-time integration with the NBS WebApp Center to fetch recipient account details automatically when generating QR codes.

### How It Works
1. **User enters an 18-digit recipient account number** in the generator form
2. **Clicks the info button** (ℹ️) next to the account field
3. **System parses the account number** into bank code, account number, and control digits
4. **Makes API call** to `https://webappcenter.nbs.rs/PnWebApp/CompanyAccount/CompanyAccountResident`
5. **Displays account information** in a modal popup with details like:
   - Account holder name (Назив корисника рачуна)
   - National ID (Матични број)
   - Tax ID (Порески број) 
   - Address (Адреса)
   - City (Место)
   - Bank name (Банка)
   - Account status (Статус)
   - Block status (Подлеже/не подлеже блокади)
   - Opening date (Датум отварања)

### Implementation Details

#### Account Number Parsing
- **Input**: 18-digit number (e.g., `220000000016005771`)
- **Parsing**: `BBB-AAAAAAAAAAAAA-CC` format
  - `BBB`: Bank code (first 3 digits)
  - `AAAAAAAAAAAAA`: Account number (digits 4-16)
  - `CC`: Control number (last 2 digits)

#### API Integration
```javascript
// Example API call
const apiUrl = `https://webappcenter.nbs.rs/PnWebApp/CompanyAccount/CompanyAccountResident?isSearchExecuted=true&BankCode=220&AccountNumber=0000000160057&ControlNumber=71&CompanyNationalCode=&CompanyTaxCode=&CompanyName=&City=&TypeID=1&OrderBy=&Pagging.CurrentPage=1&Pagging.PageSize=50`;
```

#### Files Modified
- **`generator.html`** - Added lookup button to recipient account field
- **`_layouts/default.html`** - Added account information modal
- **`assets/js/main.js`** - Added lookup functionality and modal handling
- **`assets/i18n/*.json`** - Added translations for all supported languages

### Translation Support
Full translation support in all three languages:
- **English** - "Account Information", "Lookup Account Information"
- **Serbian Cyrillic** - "Информације о рачуну", "Претражи информације о рачуну"
- **Serbian Latin** - "Informacije o računu", "Pretraži informacije o računu"

### CORS Considerations
⚠️ **Important**: The NBS WebApp Center API may have CORS restrictions that prevent direct browser calls from other domains. This is a security measure by the NBS server.

**Potential Solutions**:
1. **Proxy Server**: Implement a server-side proxy to make the API calls
2. **Browser Extensions**: Use CORS-disabling browser extensions for testing
3. **Production Deployment**: May work differently when deployed to a production domain

### Error Handling
The system handles various error scenarios:
- **No Account Entered**: Warning notification
- **Invalid Format**: Error for non-18-digit account numbers
- **Network Errors**: CORS and connectivity issues
- **No Data Found**: When account information is not available
- **HTML Parsing Errors**: Fallback for unexpected response formats

### Security Features
- **XSS Protection**: All displayed data is HTML-escaped
- **Input Validation**: Account number format validation
- **Error Boundaries**: Graceful error handling with user-friendly messages

### Usage Instructions
1. Navigate to the QR Code Generator page
2. Enter an 18-digit recipient account number (e.g., `220000000016005771`)
3. Click the info button (ℹ️) next to the account field
4. View the account information in the popup modal
5. Optionally click "Use This Information" to auto-fill the recipient name and address fields
6. Continue with QR code generation as normal

---

**Last Updated**: December 2024  
**Workflow Status**: ✅ All systems operational  
**Mobile Sharing**: ✅ Fully implemented and tested  
**Account Lookup**: ✅ Implemented with CORS considerations
**Development Environment**: Docker Compose recommended  
**Production Environment**: GitHub Pages deployment active