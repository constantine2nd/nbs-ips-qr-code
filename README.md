# NBS IPS QR Code Generator/Validator

A comprehensive Jekyll application that provides a GUI wrapper for the Serbian National Bank's IPS QR Code API. This application enables users to generate and validate NBS IPS QR codes with template management, local storage, and import/export functionality.

## Features

### 🎯 Core Functionality
- **QR Code Generation**: Create compliant NBS IPS QR codes from payment data
- **QR Code Validation**: Validate existing QR codes against NBS specifications
- **Image Upload**: Upload QR code images for decoding and validation
- **Multiple Endpoints**: Support for all NBS API endpoints (`gen`, `generate`, `validate`, `upload`)

### 📋 Template Management
- **Save Templates**: Store frequently used payment data as reusable templates
- **Template CRUD**: Complete Create, Read, Update, Delete operations for templates
- **Local Storage**: Templates stored securely in browser's local storage
- **Import/Export**: JSON-based template import and export functionality
- **Search & Filter**: Advanced template search and filtering capabilities

### 🌐 User Experience
- **Multi-language Support**: Serbian (Latin & Cyrillic) and English interfaces
- **Responsive Design**: Mobile-friendly Bootstrap-based interface
- **Real-time Validation**: Instant feedback on form inputs
- **Drag & Drop**: File upload with drag-and-drop support
- **Keyboard Shortcuts**: Quick actions with keyboard shortcuts (Ctrl+S to save template)

## Quick Start with Docker

The fastest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd nbs-ips-qr-code

# Start the application
docker-compose up -d

# Access the application
open http://localhost:4000
```

The application will be available at `http://localhost:4000` with live reload enabled.

## Manual Setup

### Prerequisites

- Ruby 3.0+ 
- Node.js 16+ (for development)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd nbs-ips-qr-code
```

2. **Install Ruby dependencies:**
```bash
bundle install
```

3. **Start the Jekyll server:**
```bash
bundle exec jekyll serve --livereload
```

4. **Open in browser:**
```
http://localhost:4000
```

### Development

For development with live reload:

```bash
bundle exec jekyll serve --livereload --incremental --force_polling
```

## Project Structure

```
nbs-ips-qr-code/
├── _config.yml                 # Jekyll configuration
├── _layouts/
│   └── default.html            # Main layout template
├── _includes/                  # Reusable components
├── assets/
│   ├── css/
│   │   └── main.css           # Custom styles
│   └── js/
│       ├── main.js            # Main application logic
│       ├── api.js             # NBS API client
│       └── templates.js       # Template management
├── index.html                  # Home page
├── generator.html              # QR code generator
├── validator.html              # QR code validator
├── templates.html              # Template management
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Docker image configuration
├── Gemfile                     # Ruby dependencies
└── README.md                   # This file
```

## Usage Guide

### 1. Generating QR Codes

#### Image Generation (`/gen` endpoint)
1. Navigate to the **Generator** page
2. Select "Image Only" mode
3. Fill in the required fields:
   - **Payment Type (K)**: PR, PT, or EK
   - **Version (V)**: Always "01"
   - **Character Set (C)**: 1 (UTF-8) or 2 (Windows-1250)
   - **Recipient Account (R)**: 18-digit account number
   - **Recipient Name (N)**: Name and address
4. Optional fields: Amount, Payer info, Description, Reference number
5. Click "Generate QR Code"

#### Full Response Generation (`/generate` endpoint)
1. Select "Full Response" mode
2. Fill in the same fields as above
3. Receive complete response with parsed data and base64 image

### 2. Validating QR Codes

#### Text Validation (`/validate` endpoint)
1. Navigate to the **Validator** page
2. Enter QR code text in the format: `K:PR|V:01|C:1|R:...`
3. Click "Validate Text"

#### Image Upload Validation (`/upload` endpoint)
1. Scroll to the "Upload QR Code Image" section
2. Drag & drop or select a PNG/JPEG image
3. Click "Validate Image"

### 3. Template Management

#### Creating Templates
1. Fill out any form (generator or validator)
2. Click "Save Template" or press Ctrl+S
3. Enter template name and description
4. Template is saved to local storage

#### Managing Templates
1. Navigate to **Templates** page
2. View all saved templates
3. Search, filter, edit, or delete templates
4. Load templates directly into forms

#### Import/Export
- **Export**: Download all templates as JSON file
- **Import**: Upload JSON file to restore templates

### 4. API Endpoints

The application supports all NBS IPS QR API endpoints:

| Endpoint | Purpose | Input | Output |
|----------|---------|--------|--------|
| `/gen` | Generate QR image | JSON data | PNG image |
| `/generate` | Generate with response | Text string | JSON + base64 image |
| `/validate` | Validate QR text | Text string | JSON validation result |
| `/upload` | Upload & validate | Image file | JSON validation result |

### 5. Language Support

Change language using the language dropdown in the navigation:
- **sr_RS_Latn**: Serbian Latin
- **sr_RS**: Serbian Cyrillic  
- **en**: English

Language selection affects API error messages and is stored in browser preferences.

## API Integration

### Base URL
```
https://nbs.rs/QRcode/api/qr/v1
```

### Authentication
No authentication required - the NBS IPS QR API is free to use.

### CORS Considerations
Due to CORS restrictions, direct API calls from browser may be limited. For production use, consider:
- Setting up a backend proxy
- Using CORS browser extensions for development
- Deploying through a server that can make server-side API calls

## Template Data Format

Templates are stored as JSON objects with the following structure:

```json
{
  "id": "tpl_1234567890_abcdef123",
  "name": "Electric Bill Payment",
  "description": "Template for monthly electricity bill payments",
  "endpoint": "/gen",
  "method": "POST",
  "data": {
    "K": "PR",
    "V": "01",
    "C": "1",
    "R": "845000000040484987",
    "N": "JP EPS BEOGRAD\nBALKANSKA 13",
    "I": "RSD3596,13",
    "SF": "189",
    "S": "UPLATA PO RAČUNU ZA EL. ENERGIJU"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "usageCount": 5,
  "lastUsed": "2024-01-15T10:30:00.000Z"
}
```

## Configuration

### Jekyll Configuration (`_config.yml`)
- Site settings and build configuration
- Plugin configuration
- API endpoint definitions

### Environment Variables
- `JEKYLL_ENV`: Set to `development` or `production`
- `BUNDLE_PATH`: Ruby gem installation path (Docker only)

## Development

### Local Development
```bash
# Install dependencies
bundle install

# Start development server with live reload
bundle exec jekyll serve --livereload

# Build for production
bundle exec jekyll build
```

### Docker Development
```bash
# Build and start containers
docker-compose up --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Adding New Features
1. Create new pages in the root directory
2. Add JavaScript modules in `assets/js/`
3. Update navigation in `_layouts/default.html`
4. Add CSS styles in `assets/css/main.css`

## Troubleshooting

### Common Issues

#### CORS Errors
If you encounter CORS errors when making API calls:
1. Use a CORS browser extension for development
2. Set up a backend proxy for production
3. Deploy the application on a server with CORS handling

#### Template Storage Issues
If templates aren't saving:
1. Check browser's local storage permissions
2. Clear browser cache and try again
3. Verify JSON format of template data

#### Docker Issues
If Docker container won't start:
1. Ensure ports 4000 and 35729 are available
2. Check Docker logs: `docker-compose logs`
3. Rebuild container: `docker-compose up --build`

### File Upload Problems
If image uploads fail:
1. Verify file format (PNG or JPEG only)
2. Check file size (max 5MB)
3. Ensure image contains a readable QR code

## NBS IPS QR Code Specifications

### Required Fields
- **K**: Payment type (PR/PT/EK)
- **V**: Version (always "01")
- **C**: Character set (1 for UTF-8, 2 for Windows-1250)
- **R**: 18-digit recipient account number
- **N**: Recipient name and address

### Optional Fields
- **I**: Amount (format: CURRxxxxx,xx)
- **P**: Payer name and address
- **SF**: Payment purpose code (3 digits)
- **S**: Payment description (max 140 chars)
- **RO**: Reference number (max 25 chars)

### Format Rules
- Fields separated by pipe character (`|`)
- Format: `KEY:VALUE|KEY:VALUE|...`
- Cannot end with pipe character
- Line breaks in addresses as `\r\n`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Important Notes

### Usage Requirements
- When displaying generated NBS IPS QR codes, you must include the text "NBS IPS QR" next to, below, or above the code
- For merchant point-of-sale payments (PT/EK codes), a contractual relationship with an acquiring bank is required
- The NBS IPS QR API service is provided free of charge by the National Bank of Serbia

### Disclaimer
This application is an unofficial GUI wrapper for the NBS IPS QR API. Always refer to the official NBS documentation for the latest specifications and requirements.

## Support

For issues related to:
- **This application**: Open an issue in this repository
- **NBS API**: Contact the National Bank of Serbia
- **QR code specifications**: Refer to official NBS documentation

## Links

- [NBS IPS QR Official Documentation](https://ips.nbs.rs/PDF/pdfPreporukeValidacija.pdf)
- [National Bank of Serbia](https://nbs.rs)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)