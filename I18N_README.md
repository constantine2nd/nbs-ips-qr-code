# Internationalization (i18n) System

This document describes the comprehensive internationalization system implemented for the NBS IPS QR Code application, supporting multiple languages with proper character encoding and localization features.

## Supported Languages

The application supports three languages:

- **English** (`en`) - Primary language and fallback
- **Serbian Latin** (`sr_RS_Latn`) - Serbian using Latin script
- **Serbian Cyrillic** (`sr_RS`) - Serbian using Cyrillic script

## Architecture

### Files Structure

```
assets/
├── i18n/
│   ├── en.json           # English translations
│   ├── sr_RS_Latn.json   # Serbian Latin translations
│   └── sr_RS.json        # Serbian Cyrillic translations
└── js/
    ├── i18n.js           # Core internationalization library
    └── main.js           # Updated with i18n integration
```

### Core Components

1. **i18n.js** - Main internationalization library class
2. **Translation JSON files** - Language-specific translation dictionaries
3. **HTML attributes** - `data-i18n`, `data-i18n-title`, `data-i18n-aria` for marking translatable content
4. **Automatic detection** - Dynamic content translation via MutationObserver

## Features

### Language Management

- **Automatic Loading**: Languages are loaded asynchronously when needed
- **Fallback System**: Falls back to English if translation is missing
- **Persistence**: Language preference is saved in localStorage
- **Real-time Switching**: Change language without page reload

### Translation Methods

- **Nested Keys**: Support for dot notation (e.g., `nav.home`, `generator.form.amount.label`)
- **Parameter Substitution**: Dynamic content with `{{param}}` placeholders
- **Pluralization**: Built-in plural form handling
- **HTML Content**: Support for HTML in translations via `data-i18n-html` attribute

### Localization Features

- **Number Formatting**: Locale-aware number formatting
- **Currency Formatting**: Proper currency display for RSD
- **Date Formatting**: Localized date and time formats
- **Text Direction**: RTL/LTR support (currently all LTR)

## Usage

### Basic Translation

Mark any HTML element with `data-i18n` attribute:

```html
<h1 data-i18n="home.title">NBS IPS QR Code</h1>
<button data-i18n="common.save">Save</button>
```

### Form Elements

For form inputs, use placeholder or value translation:

```html
<input type="text" data-i18n="generator.form.amount.placeholder" placeholder="Enter amount...">
<input type="submit" data-i18n="common.save" value="Save">
```

### JavaScript Translation

Use the global `t()` function or `window.i18n.translate()`:

```javascript
// Simple translation
const message = t('notifications.templateSaved');

// With parameters
const greeting = t('messages.welcome', { name: 'John' });

// Check current language
if (window.i18n.getCurrentLanguage() === 'sr_RS') {
    // Cyrillic-specific logic
}
```

### Language Switching

```javascript
// Change language programmatically
await window.i18n.changeLanguage('sr_RS_Latn');

// Listen for language changes
document.addEventListener('languageChanged', function(event) {
    console.log('Language changed to:', event.detail.language);
});
```

## Translation Key Structure

### Hierarchical Organization

```json
{
  "nav": {
    "home": "Home",
    "generator": "Generator"
  },
  "generator": {
    "title": "QR Code Generator",
    "form": {
      "paymentType": {
        "label": "Payment Type (K)",
        "pr": "Regular Payment (PR)"
      }
    },
    "buttons": {
      "generate": "Generate QR Code",
      "clear": "Clear Form"
    }
  }
}
```

### Common Sections

- **nav**: Navigation items
- **home**: Home page content
- **generator**: QR code generator
- **validator**: QR code validator
- **templates**: Template management
- **modal**: Modal dialog content
- **notifications**: Success/info messages
- **errors**: Error messages
- **common**: Reusable UI elements

## Implementation Guidelines

### Adding New Translations

1. **Add to all language files**: Ensure consistency across `en.json`, `sr_RS_Latn.json`, and `sr_RS.json`
2. **Use descriptive keys**: `generator.form.paymentType.label` instead of `label1`
3. **Group related translations**: Keep related items under the same parent key
4. **Test all languages**: Verify translations work in all supported languages

### HTML Markup

```html
<!-- Basic text translation -->
<span data-i18n="common.loading">Loading...</span>

<!-- Title/tooltip translation -->
<button data-i18n-title="generator.help.paymentType">?</button>

<!-- Aria-label translation -->
<input data-i18n-aria="common.search" type="search">

<!-- HTML content translation -->
<div data-i18n="home.notice.display" data-i18n-html>
  <strong>Important:</strong> Display text properly.
</div>
```

### Character Encoding

- **UTF-8**: All files use UTF-8 encoding
- **Proper Fonts**: Ensure fonts support Cyrillic characters
- **Form Encoding**: API requests handle both Latin and Cyrillic properly

## API Integration

### Character Set Selection

The system automatically manages the character set parameter for NBS API calls:

```javascript
// Latin script uses C=1 (UTF-8)
// Cyrillic script uses C=1 (UTF-8) 
// Proper encoding is handled automatically
```

### Localized Validation Messages

Error messages from the API are displayed in the current language:

```javascript
const error = t('errors.invalidAccountNumber');
showNotification(error, 'error');
```

## Testing

### Test Page

Visit `/test-i18n.html` to:

- Verify translation loading
- Test language switching
- Check translation coverage
- Debug i18n system issues

### Manual Testing Checklist

1. **Language Switching**: Verify dropdown changes language immediately
2. **Persistence**: Refresh page and confirm language preference is saved
3. **Form Labels**: Check all form fields are translated
4. **Notifications**: Test success/error messages in all languages
5. **Character Display**: Verify Cyrillic characters display correctly
6. **API Integration**: Test QR generation with different character sets

## Troubleshooting

### Common Issues

1. **Translation not showing**: 
   - Check if key exists in all language files
   - Verify HTML attribute is correct (`data-i18n`)
   - Ensure i18n.js is loaded before other scripts

2. **Cyrillic characters not displaying**:
   - Verify font supports Cyrillic
   - Check page encoding is UTF-8
   - Ensure translation file is saved as UTF-8

3. **Language not persisting**:
   - Check localStorage support
   - Verify no errors in browser console
   - Ensure `nbs_language` key is being saved

### Browser Support

- **Modern Browsers**: Full support (Chrome 60+, Firefox 55+, Safari 12+)
- **IE11**: Limited support (no Intl.RelativeTimeFormat)
- **Mobile**: Full support on iOS Safari and Android Chrome

## Performance

### Optimization Features

- **Lazy Loading**: Translation files loaded only when needed
- **Caching**: Loaded translations cached in memory
- **Minimal Bundle**: Core i18n library is lightweight (~15KB)
- **Efficient Updates**: Only changed elements are re-translated

### Best Practices

1. **Minimize Translation Calls**: Cache results when possible
2. **Batch Updates**: Update multiple elements together
3. **Avoid Nested Loops**: Don't call `t()` inside frequently executed loops
4. **Use MutationObserver**: Let automatic translation handle dynamic content

## Future Enhancements

### Planned Features

1. **Additional Languages**: Support for more languages
2. **RTL Support**: Right-to-left text direction for Arabic/Hebrew
3. **Plural Rules**: Advanced plural form handling
4. **Date/Time Locales**: More comprehensive date formatting
5. **Translation Management**: GUI for managing translations

### Extension Points

The system is designed to be extensible:

```javascript
// Add new language
window.i18n.addLanguage('de', {
    name: 'Deutsch',
    locale: 'de-DE',
    direction: 'ltr'
});

// Custom formatters
window.i18n.addFormatter('currency', (value, options) => {
    // Custom currency formatting
});
```

This internationalization system provides comprehensive multi-language support while maintaining performance and ease of use for both developers and end users.