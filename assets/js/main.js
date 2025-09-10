// Main JavaScript file for NBS IPS QR Code Application

// Global variables
let currentLanguage = 'sr_RS_Latn';
let currentTemplate = null;

// Version marker to verify changes are loaded
console.log('Main.js loaded - Fixed version v2.0 with null container fixes');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Set up form handlers
    setupFormHandlers();

    // Set up file upload handlers
    setupFileUploadHandlers();

    // Initialize tooltips
    initializeTooltips();

    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
}

// Language switcher functionality - now handled by i18n.js
// Language functionality removed - now handled by unified-language-system.js

// Translation helper function
function t(key, params = {}) {
    if (window.i18n) {
        return window.i18n.translate(key, params);
    }
    return key; // Fallback to key if i18n not loaded
}

// Form handling
function setupFormHandlers() {
    // Generic form submission handler - exclude validator forms to prevent conflicts
    const forms = document.querySelectorAll(
        'form[data-api-endpoint]:not(#textValidatorForm):not(#uploadValidatorForm)'
    );
    forms.forEach((form) => {
        form.addEventListener('submit', handleFormSubmission);
    });

    // Clear form buttons
    const clearButtons = document.querySelectorAll('[data-action="clear"]');
    clearButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const form = this.closest('form');
            if (form) {
                clearForm(form);
            }
        });
    });

    // Save template buttons
    const saveTemplateButtons = document.querySelectorAll(
        '[data-action="save-template"]'
    );
    saveTemplateButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const form = this.closest('form');
            if (form) {
                openSaveTemplateModal(form);
            }
        });
    });
}

function handleFormSubmission(e) {
    e.preventDefault();

    const form = e.target;
    const endpoint = form.getAttribute('data-api-endpoint');
    const method = form.getAttribute('data-method') || 'POST';

    if (!endpoint) {
        showNotification('Form configuration error: missing endpoint', 'error');
        return;
    }

    // Collect form data
    const formData = collectFormData(form);

    // Prepare request based on endpoint type
    let requestData,
        options = { lang: currentLanguage };

    if (endpoint === '/gen') {
        // JSON data for gen endpoint
        requestData = prepareGenRequestData(formData);
    } else if (endpoint === '/generate' || endpoint === '/validate') {
        // Text data for generate/validate endpoints
        requestData = prepareTextRequestData(formData);
        options.isTextData = true;
    } else if (endpoint === '/upload') {
        // Form data for upload endpoint
        const fileInput = form.querySelector('input[type="file"]');
        if (!fileInput || !fileInput.files[0]) {
            showNotification('Please select a file to upload', 'error');
            return;
        }
        const uploadFormData = new FormData();
        uploadFormData.append('file', fileInput.files[0]);
        requestData = uploadFormData;
        options.isFormData = true;
    }

    // Add size parameter if specified
    if (formData.size) {
        options.size = formData.size;
    }

    // Show loading state
    showLoadingModal();

    // Make API call
    makeAPICall(endpoint, method, requestData, options)
        .then((response) => handleAPIResponse(response, endpoint))
        .catch((error) => handleAPIError(error))
        .finally(() => hideLoadingModal());
}

function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};

    // Convert FormData to regular object
    for (let [key, value] of formData.entries()) {
        // Skip empty values and file inputs for most processing
        if (key === 'file') {
            data[key] = value;
            continue;
        }

        if (value && value.trim && value.trim() !== '') {
            if (data[key]) {
                // Handle multiple values for same key
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
    }

    return data;
}

function clearForm(form) {
    // Reset form
    form.reset();

    // Clear any result displays
    const resultContainers = form.querySelectorAll('[data-result]');
    resultContainers.forEach((container) => {
        container.innerHTML = '';
        container.style.display = 'none';
    });

    // Clear QR code displays
    const qrDisplays = document.querySelectorAll('.qr-image');
    qrDisplays.forEach((img) => {
        img.src = '';
        img.style.display = 'none';
    });

    showNotification('Form cleared', 'info');
}

// File upload handling
function setupFileUploadHandlers() {
    const fileInputs = document.querySelectorAll(
        'input[type="file"]:not(#importFile):not(#qrImageFile)'
    );
    const dropZones = document.querySelectorAll(
        '.file-upload-area:not(#fileUploadArea)'
    );

    fileInputs.forEach((input) => {
        // Additional safety check to avoid validator elements
        if (
            input &&
            input.id !== 'qrImageFile' &&
            !input.closest('#fileUploadArea')
        ) {
            input.addEventListener('change', handleFileSelection);
        }
    });

    dropZones.forEach((zone) => {
        // Additional safety check to avoid validator elements
        if (zone && zone.id !== 'fileUploadArea') {
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleFileDrop);
            zone.addEventListener('click', function () {
                const fileInput =
                    this.querySelector('input[type="file"]') ||
                    this.parentElement.querySelector('input[type="file"]');
                if (fileInput && fileInput.id !== 'qrImageFile') {
                    fileInput.click();
                }
            });
        }
    });
}

function handleFileSelection(e) {
    if (!e || !e.target) {
        console.warn('handleFileSelection: event or event target is null');
        return;
    }

    const file = e.target.files[0];
    if (file) {
        validateImageFile(file);
        displayFileInfo(file, e.target);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput =
            this.querySelector('input[type="file"]') ||
            this.parentElement.querySelector('input[type="file"]');
        if (
            fileInput &&
            fileInput.isConnected &&
            document.contains(fileInput) &&
            fileInput.id !== 'qrImageFile'
        ) {
            fileInput.files = files;
            handleFileSelection({ target: fileInput });
        } else if (fileInput && fileInput.id === 'qrImageFile') {
            console.warn(
                'handleFileDrop: Ignoring validator file input to prevent conflicts'
            );
        } else if (fileInput) {
            console.warn('handleFileDrop: fileInput is not connected to DOM');
        }
    }
}

function validateImageFile(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        showNotification(
            window.i18n?.t('notifications.pleaseSelectImageFile') ||
                'Please select a PNG or JPEG image file',
            'error'
        );
        return false;
    }

    if (file.size > maxSize) {
        showNotification(
            window.i18n?.t('notifications.fileSizeLimit') ||
                'File size must be less than 5MB',
            'error'
        );
        return false;
    }

    return true;
}

function displayFileInfo(file, input) {
    console.debug('displayFileInfo called with:', {
        file: file?.name,
        input: input?.id || 'no-id',
        inputConnected: input?.isConnected,
    });

    if (!input) {
        console.warn('displayFileInfo: input parameter is null or undefined');
        return;
    }

    if (input.id === 'qrImageFile') {
        console.warn(
            'displayFileInfo: Ignoring validator file input to prevent conflicts'
        );
        return;
    }

    const container = input.closest('.file-upload-area') || input.parentElement;

    if (!container) {
        console.warn('displayFileInfo: container not found for input element', {
            inputId: input.id,
            inputConnected: input.isConnected,
        });
        return;
    }

    const existingInfo = container.querySelector('.file-info');

    if (existingInfo) {
        existingInfo.remove();
    }

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info mt-2';
    fileInfo.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-file-image me-2"></i>
            <strong>${file.name}</strong> (${formatFileSize(file.size)})
        </div>
    `;

    container.appendChild(fileInfo);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Modal handling
function showLoadingModal() {
    console.log('showLoadingModal: Called');
    const modalElement = document.getElementById('loadingModal');
    if (!modalElement) {
        console.error('showLoadingModal: Modal element not found');
        return;
    }
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    console.log('showLoadingModal: Modal shown');
}

function hideLoadingModal() {
    console.log('hideLoadingModal: Called');
    const modalElement = document.getElementById('loadingModal');
    if (!modalElement) {
        console.error('hideLoadingModal: Modal element not found');
        return;
    }

    // More aggressive modal hiding approach
    try {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
            console.log('hideLoadingModal: Bootstrap modal hidden');
        }
    } catch (error) {
        console.warn('hideLoadingModal: Bootstrap modal hide failed', error);
    }

    // Always perform manual cleanup to ensure modal is fully hidden
    setTimeout(() => {
        // Remove all modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop) => backdrop.remove());

        // Reset modal element
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        modalElement.removeAttribute('role');

        // Reset body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        console.log('hideLoadingModal: Manual cleanup completed');
    }, 100);
}

function openSaveTemplateModal(form) {
    currentTemplate = {
        form: form,
        data: collectFormData(form),
        endpoint: form.getAttribute('data-api-endpoint'),
        method: form.getAttribute('data-method') || 'POST',
    };

    const modal = new bootstrap.Modal(document.getElementById('templateModal'));
    modal.show();
}

// Notifications
function showNotification(message, type = 'info') {
    const alertClass = getAlertClass(type);
    const icon = getAlertIcon(type);

    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    // Find or create notification container
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className =
            'notification-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    // Add notification
    const alertElement = document.createElement('div');
    alertElement.innerHTML = alertHtml;
    container.appendChild(alertElement.firstElementChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

function getAlertClass(type) {
    const classes = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info',
    };
    return classes[type] || 'alert-info';
}

function getAlertIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
    };
    return icons[type] || 'fas fa-info-circle';
}

// Utility functions
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Ctrl+S to save template
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const activeForm = document.querySelector(
                'form:not([style*="display: none"])'
            );
            if (activeForm && activeForm.getAttribute('data-api-endpoint')) {
                openSaveTemplateModal(activeForm);
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach((modal) => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            });
        }
    });
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showNotification('Copied to clipboard', 'success');
            })
            .catch(() => {
                fallbackCopyToClipboard(text);
            });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard', 'success');
    } catch (err) {
        showNotification('Failed to copy to clipboard', 'error');
    }

    document.body.removeChild(textArea);
}

function downloadFile(
    content,
    filename,
    mimeType = 'application/octet-stream'
) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Error handling
function handleGlobalErrors() {
    window.addEventListener('error', function (e) {
        console.error('Global error:', e.error);

        // Don't show notifications for language-related errors
        const errorMessage = e.error ? e.error.toString() : '';
        if (
            errorMessage.includes('changeLanguage') ||
            errorMessage.includes('language') ||
            errorMessage.includes('UnifiedLanguageSystem')
        ) {
            return;
        }

        showNotification('An unexpected error occurred', 'error');
    });

    window.addEventListener('unhandledrejection', function (e) {
        console.error('Unhandled promise rejection:', e.reason);

        // Don't show notifications for language-related promise rejections
        const reasonMessage = e.reason ? e.reason.toString() : '';
        if (
            reasonMessage.includes('changeLanguage') ||
            reasonMessage.includes('language') ||
            reasonMessage.includes('UnifiedLanguageSystem')
        ) {
            return;
        }

        showNotification('An unexpected error occurred', 'error');
    });
}

// Initialize error handling
handleGlobalErrors();

// Request data preparation functions
function prepareGenRequestData(formData) {
    const requestData = {
        K: formData.K,
        V: formData.V,
        C: formData.C,
        R: formData.R,
        N: formData.N,
    };

    // Add optional fields if present
    if (formData.I) requestData.I = formData.I;
    if (formData.P) requestData.P = formData.P;
    if (formData.SF) requestData.SF = formData.SF;
    if (formData.S) requestData.S = formData.S;
    if (formData.RO) requestData.RO = formData.RO;

    return requestData;
}

function prepareTextRequestData(formData) {
    // Check if it's validation text data
    if (formData.qrText) {
        return formData.qrText;
    }

    // Build QR text string from form fields
    const fields = ['K', 'V', 'C', 'R', 'N', 'I', 'P', 'SF', 'S', 'RO'];
    const parts = [];

    fields.forEach((field) => {
        if (formData[field] && formData[field].trim()) {
            // Replace line breaks with \r\n for proper formatting
            const value = formData[field].replace(/\n/g, '\r\n');
            parts.push(`${field}:${value}`);
        }
    });

    return parts.join('|');
}

// Save template modal functionality
function saveTemplate() {
    if (!currentTemplate || !currentTemplate.form) {
        showNotification('No form data to save', 'error');
        return;
    }

    const name = document.getElementById('templateName').value.trim();
    const description = document
        .getElementById('templateDescription')
        .value.trim();

    if (!name) {
        showNotification('Template name is required', 'error');
        return;
    }

    // Check for duplicate names
    const existing = window.TemplateManager.templates.find(
        (t) => t.name === name
    );
    if (existing) {
        if (
            !confirm(
                'A template with this name already exists. Do you want to replace it?'
            )
        ) {
            return;
        }
        // Delete existing template
        window.TemplateManager.deleteTemplate(existing.id);
    }

    try {
        const template = window.TemplateManager.addTemplate(
            name,
            description,
            currentTemplate.data,
            currentTemplate.endpoint,
            currentTemplate.method
        );

        showNotification(`Template "${name}" saved successfully`, 'success');

        // Close modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById('templateModal')
        );
        if (modal) {
            modal.hide();
        }

        // Clear form
        document.getElementById('templateForm').reset();

        // Refresh templates display if on templates page
        if (typeof refreshTemplatesDisplay === 'function') {
            refreshTemplatesDisplay();
        }
    } catch (error) {
        showNotification('Failed to save template: ' + error.message, 'error');
    }
}

// Export functions for global access
window.NBSApp = {
    showNotification,
    copyToClipboard,
    downloadFile,
    formatJSON,
    isValidJSON,
    clearForm,
    prepareGenRequestData,
    prepareTextRequestData,
    saveTemplate,
};
