# Mobile Sharing Testing Guide

## Overview
This guide provides comprehensive testing procedures for the QR code sharing functionality across different mobile platforms and messaging applications.

## Quick Test Checklist

### ✅ Basic Functionality
- [ ] Share button appears after QR code generation
- [ ] Share options panel expands/collapses correctly
- [ ] All sharing buttons are visible in single column layout
- [ ] Download and Print buttons have proper translations
- [ ] No JavaScript errors in browser console

### ✅ Mobile Device Testing

#### iOS Devices (iPhone/iPad)
- [ ] Native sharing works (uses iOS Share Sheet)
- [ ] WhatsApp opens correctly
- [ ] SMS opens with pre-filled message
- [ ] Email opens native mail app
- [ ] Viber deep link works or fallback to App Store
- [ ] Telegram opens app or web version
- [ ] Copy link functionality works
- [ ] Download provides "long press to save" instruction

#### Android Devices
- [ ] Native sharing works (uses Android Share Sheet)
- [ ] WhatsApp sharing functions properly
- [ ] SMS opens with correct message format
- [ ] Email opens default email app
- [ ] Viber sharing works or opens Play Store
- [ ] Telegram sharing via app or web
- [ ] Copy to clipboard works
- [ ] Download saves file to device

## Detailed Testing Procedures

### 1. Generate a QR Code First
1. Navigate to `/generator.html`
2. Fill in required fields:
   - Payment Type: PR
   - Account Number: 160-5000000000000-21
   - Company Name: Test Company
3. Click "Generate QR Code"
4. Verify QR code image appears
5. Confirm all three buttons show: Download, Print, Share

### 2. Test Share Button
1. Click the "Share" button
2. Verify share options panel slides down smoothly
3. Check all sharing options are visible:
   - Native Share (mobile only)
   - Email
   - SMS
   - WhatsApp
   - Viber
   - Telegram
   - Copy Link

### 3. Native Sharing Test (Mobile Only)
```javascript
// Should detect mobile and show native option
if (navigator.share && navigator.canShare) {
    // Native share button should be visible
    // Click should open system share sheet
}
```

**Expected Behavior:**
- iOS: Opens iOS Share Sheet with available apps
- Android: Opens Android Share Intent chooser
- Desktop: Button should be hidden

### 4. WhatsApp Testing
**Test URL:** `https://wa.me/?text=Check%20out%20this%20NBS%20IPS%20QR%20code%20generator...`

**Mobile:**
- Should open WhatsApp app directly
- Message should be pre-filled
- User can select recipient

**Desktop:**
- Should open WhatsApp Web in new tab
- Message should be pre-filled

### 5. Viber Testing
**Mobile Deep Link:** `viber://forward?text=...`
**Fallback:** Viber web with adjust link

**Expected Behavior:**
- Try Viber app first
- If app not installed, redirect to store/web
- Desktop: Copy message to clipboard + notify user

### 6. Telegram Testing
**App URL:** `tg://msg?text=...`
**Web URL:** `https://t.me/share/url?url=...&text=...`

**Testing Steps:**
1. Click Telegram button
2. Should try app first (mobile)
3. Fall back to web version after 1 second
4. Message should include URL and timestamp

### 7. SMS Testing
**iOS Format:** `sms:&body=message`
**Android Format:** `sms:?body=message`

**Testing:**
1. Click SMS button
2. Should detect device type
3. Open native SMS app with pre-filled message
4. Message should include QR generator URL

### 8. Email Testing
**mailto URL:** `mailto:?subject=NBS%20IPS%20QR%20Code&body=...`

**Testing:**
1. Click Email button
2. Should open default email client
3. Subject: "NBS IPS QR Code"
4. Body should include URL and timestamp
5. Mobile: Should prefer native app
6. Desktop: May open webmail

### 9. Copy Link Testing
**Modern browsers:** `navigator.clipboard.writeText()`
**Fallback:** Manual textarea selection

**Testing:**
1. Click "Copy Link" button
2. Should copy current page URL
3. Show success notification
4. Test paste functionality

## Device-Specific Test Scenarios

### iPhone Safari
```bash
# Test user agent detection
/iPad|iPhone|iPod/.test(navigator.userAgent)
```
- Native sharing should work
- Deep links should function
- Download should show instruction overlay

### Android Chrome
```bash
# Test user agent detection  
/Android/i.test(navigator.userAgent)
```
- Native sharing via Android Intents
- App deep links should work
- Download should save to Downloads folder

### Desktop Browsers
- Native sharing button should be hidden
- All web-based sharing should work
- Copy functionality should work
- Download should trigger file save

## Error Scenarios to Test

### 1. No QR Code Generated
- Click share before generating QR
- Should show error: "No QR code to share"

### 2. App Not Installed
- Test Viber/Telegram on device without apps
- Should gracefully fall back to web versions

### 3. Browser Limitations
- Test on older browsers
- Should fall back to basic clipboard operations

### 4. Network Issues
- Test with poor/no internet connection
- Local functions should still work
- Remote sharing may show appropriate errors

## Performance Testing

### Loading Times
- Share panel should appear instantly
- No delay in button responsiveness
- Smooth animations

### Memory Usage
- No memory leaks from repeated sharing
- Proper cleanup after sharing actions

### Battery Impact
- Minimal battery usage
- No background processes

## Accessibility Testing

### Screen Readers
- All buttons should have proper ARIA labels
- Share options should be announced correctly
- Keyboard navigation should work

### Touch Targets
- Minimum 44px touch targets on iOS
- Proper spacing between buttons
- Easy thumb reach on mobile

### Visual Indicators
- Clear visual feedback on button press
- Loading states where appropriate
- Error messages clearly visible

## Cross-Platform Compatibility Matrix

| Feature | iOS Safari | iOS Chrome | Android Chrome | Desktop Chrome | Desktop Firefox |
|---------|------------|------------|----------------|----------------|-----------------|
| Native Share | ✅ | ✅ | ✅ | ❌ | ❌ |
| WhatsApp | ✅ | ✅ | ✅ | ✅ (web) | ✅ (web) |
| Viber | ✅ | ✅ | ✅ | ✅ (fallback) | ✅ (fallback) |
| Telegram | ✅ | ✅ | ✅ | ✅ (web) | ✅ (web) |
| SMS | ✅ | ✅ | ✅ | ❌ | ❌ |
| Email | ✅ | ✅ | ✅ | ✅ | ✅ |
| Copy Link | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download | ⚠️ (instruction) | ⚠️ (instruction) | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Fully supported
- ⚠️ Partially supported/special behavior
- ❌ Not supported/not applicable

## Troubleshooting Common Issues

### Share Button Not Working
```javascript
// Check if functions are in global scope
console.log(typeof window.shareQRCode); // Should be 'function'
```

### Native Sharing Not Appearing
```javascript
// Check browser support
console.log('Share API:', navigator.share ? 'supported' : 'not supported');
console.log('Can Share:', navigator.canShare ? 'yes' : 'no');
```

### Deep Links Not Working
- Verify app installation
- Check URL format
- Test fallback mechanisms

### Copy Function Issues
```javascript
// Test clipboard API
console.log('Clipboard API:', navigator.clipboard ? 'available' : 'fallback mode');
```

## Test Report Template

```markdown
## Mobile Sharing Test Report

**Date:** [DATE]
**Tester:** [NAME]
**Device:** [DEVICE MODEL]
**OS:** [OS VERSION]
**Browser:** [BROWSER VERSION]

### Test Results
- [ ] QR Generation: PASS/FAIL
- [ ] Share Button: PASS/FAIL  
- [ ] Native Sharing: PASS/FAIL/N/A
- [ ] WhatsApp: PASS/FAIL
- [ ] Viber: PASS/FAIL
- [ ] Telegram: PASS/FAIL
- [ ] SMS: PASS/FAIL/N/A
- [ ] Email: PASS/FAIL
- [ ] Copy Link: PASS/FAIL
- [ ] Download: PASS/FAIL
- [ ] Layout: PASS/FAIL
- [ ] Translations: PASS/FAIL

### Issues Found
[List any issues discovered]

### Notes
[Additional observations]
```

## Automated Testing Considerations

While manual testing is essential for sharing functionality, consider these automated checks:

```javascript
// Basic function existence tests
describe('Sharing Functions', () => {
    it('should have shareQRCode function', () => {
        expect(typeof window.shareQRCode).toBe('function');
    });
    
    it('should detect mobile devices', () => {
        expect(typeof window.isMobileDevice).toBe('function');
    });
    
    it('should handle copy functionality', () => {
        expect(typeof window.copyToClipboard).toBe('function');
    });
});
```

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** ✅ Ready for Testing