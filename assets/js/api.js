// API handling for NBS IPS QR Code Application

// API configuration
const API_CONFIG = {
    baseURL: 'https://nbs.rs/QRcode/api/qr/v1',
    endpoints: {
        gen: '/gen',
        generate: '/generate',
        validate: '/validate',
        upload: '/upload',
    },
    timeout: 30000, // 30 seconds
    retries: 3,
};

// API utility functions
class NBSAPIClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
    }

    // Main API call method
    async makeRequest(endpoint, method = 'POST', data = null, options = {}) {
        const url = this.buildURL(endpoint, options.size, options.lang);
        const config = this.buildRequestConfig(method, data, options);

        try {
            const response = await this.fetchWithTimeout(url, config);
            return await this.handleResponse(response, endpoint);
        } catch (error) {
            throw this.handleError(error, endpoint);
        }
    }

    // Build complete URL with parameters
    buildURL(endpoint, size = null, lang = null) {
        let url = `${this.baseURL}${endpoint}`;

        // Add size parameter for gen/generate endpoints
        if (
            size &&
            (endpoint.includes('/gen') || endpoint.includes('/generate'))
        ) {
            url += `/${size}`;
        }

        // Add language parameter
        if (lang) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}lang=${lang}`;
        }

        return url;
    }

    // Build request configuration
    buildRequestConfig(method, data, options) {
        const config = {
            method,
            headers: {
                Accept: 'application/json',
            },
        };

        // Handle different data types
        if (data) {
            if (options.isFormData) {
                // For file uploads
                config.body = data;
            } else if (options.isTextData) {
                // For text-based endpoints (validate, generate)
                config.headers['Content-Type'] = 'text/plain';
                config.body = data;
            } else {
                // For JSON data (gen endpoint)
                config.headers['Content-Type'] = 'application/json';
                config.body = JSON.stringify(data);
            }
        }

        return config;
    }

    // Fetch with timeout
    async fetchWithTimeout(url, config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Handle API response
    async handleResponse(response, endpoint) {
        const contentType = response.headers.get('content-type');

        // Handle different response types
        if (contentType && contentType.includes('image/')) {
            // Image response (gen endpoint)
            const blob = await response.blob();
            return {
                success: response.ok,
                data: blob,
                contentType: contentType,
                isImage: true,
            };
        } else {
            // JSON response
            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                status: response.status,
                statusText: response.statusText,
                isImage: false,
            };
        }
    }

    // Handle API errors
    handleError(error, endpoint) {
        console.error(`API Error for ${endpoint}:`, error);

        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Request timeout',
                message: 'The request took too long to complete',
                code: 'TIMEOUT',
            };
        }

        if (
            error.name === 'TypeError' &&
            error.message.includes('Failed to fetch')
        ) {
            return {
                success: false,
                error: 'Network error',
                message: 'Unable to connect to the API server',
                code: 'NETWORK_ERROR',
            };
        }

        return {
            success: false,
            error: error.message,
            message: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
        };
    }
}

// Create API client instance
const apiClient = new NBSAPIClient();

// Specific API methods
async function makeAPICall(endpoint, method, data, options = {}) {
    // Add current language to options if not specified
    if (!options.lang) {
        options.lang = currentLanguage || 'sr_RS_Latn';
    }

    try {
        showLoadingState(true);
        const response = await apiClient.makeRequest(
            endpoint,
            method,
            data,
            options
        );
        return response;
    } catch (error) {
        throw error;
    } finally {
        showLoadingState(false);
    }
}

// Generate QR code image (gen endpoint)
async function generateQRImage(qrData, size = null) {
    const options = {
        size: size,
        lang: currentLanguage,
    };

    return await makeAPICall('/gen', 'POST', qrData, options);
}

// Generate QR code with full response (generate endpoint)
async function generateQRWithResponse(textData, size = null) {
    const options = {
        isTextData: true,
        size: size,
        lang: currentLanguage,
    };

    return await makeAPICall('/generate', 'POST', textData, options);
}

// Validate QR code text (validate endpoint)
async function validateQRText(textData) {
    const options = {
        isTextData: true,
        lang: currentLanguage,
    };

    return await makeAPICall('/validate', 'POST', textData, options);
}

// Upload QR code image for validation (upload endpoint)
async function uploadQRImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const options = {
        isFormData: true,
        lang: currentLanguage,
    };

    return await makeAPICall('/upload', 'POST', formData, options);
}

// Response handling functions
function handleAPIResponse(response, endpoint) {
    console.log(
        'API.js handleAPIResponse called for endpoint:',
        endpoint,
        'isImage:',
        response.isImage
    );
    if (response.success) {
        if (response.isImage) {
            handleImageResponse(response);
        } else {
            handleJSONResponse(response, endpoint);
        }
    } else {
        handleErrorResponse(response, endpoint);
    }
}

function handleImageResponse(response) {
    console.log('API.js handleImageResponse called - displaying image');
    const imageUrl = URL.createObjectURL(response.data);
    displayQRImageGenerator(imageUrl);
    // Note: Notification is handled by the calling function to prevent duplicates
}

function handleJSONResponse(response, endpoint) {
    const data = response.data;

    // Check API response status
    if (data.s && data.s.code === 0) {
        // Success response
        displayAPISuccess(data, endpoint);

        // Display QR image if present
        if (data.i) {
            displayBase64Image(data.i);
        }

        console.log(
            'API.js handleJSONResponse - success (notification handled by caller)'
        );
        // Note: Notification is handled by the calling function to prevent duplicates
    } else {
        // API returned error
        displayAPIError(data, endpoint);
        showNotification(data.s?.desc || 'API returned an error', 'error');
    }
}

function handleErrorResponse(response, endpoint) {
    console.error('API Error Response:', response);

    let errorMessage = 'An error occurred while processing your request';

    if (response.data && response.data.s && response.data.s.desc) {
        errorMessage = response.data.s.desc;
    } else if (response.message) {
        errorMessage = response.message;
    }

    displayAPIError(response.data || response, endpoint);
    showNotification(errorMessage, 'error');
}

function handleAPIError(error) {
    console.error('API Call Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.message) {
        errorMessage = error.message;
    } else if (error.error) {
        errorMessage = error.error;
    }

    showNotification(errorMessage, 'error');

    // Display error details if available
    if (error.code || error.data) {
        displayGenericError(error);
    }
}

// Display functions
function displayQRImage(imageUrl) {
    const qrImages = document.querySelectorAll('.qr-image-generator');
    qrImages.forEach((img) => {
        img.src = imageUrl;
        img.style.display = 'block';

        // Ensure proper styling and centering
        img.style.maxWidth = '300px';
        img.style.height = 'auto';
        img.style.border = '2px solid #dee2e6';
        img.style.borderRadius = '8px';
        img.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        img.classList.add('img-fluid');

        // Add click handler for full-size view
        img.onclick = () => openImageModal(imageUrl);
    });

    const qrDisplays = document.querySelectorAll('.qr-display-generator');
    qrDisplays.forEach((display) => {
        display.style.display = 'block';
        display.classList.add('text-center');
    });
}

function displayBase64Image(base64Data) {
    const imageUrl = `data:image/png;base64,${base64Data}`;
    displayQRImageGenerator(imageUrl);
}

function displayAPISuccess(data, endpoint) {
    const responseContainers = document.querySelectorAll(
        '[data-result="success"]'
    );

    responseContainers.forEach((container) => {
        let content = '<div class="response-display response-success">';
        content +=
            '<h5><i class="fas fa-check-circle text-success me-2"></i>Success</h5>';

        if (data.s) {
            content += `<p><strong>Status:</strong> ${data.s.desc || 'OK'}</p>`;
        }

        if (data.t) {
            content += '<div class="mt-3">';
            content += '<strong>Original Text:</strong>';
            content += `<div class="response-code mt-2">${escapeHtml(data.t)}</div>`;
            content += '</div>';
        }

        if (data.n) {
            content += '<div class="mt-3">';
            content += '<strong>Parsed Data:</strong>';
            content += `<div class="response-code mt-2">${formatJSON(data.n)}</div>`;
            content += '</div>';
        }

        content += '<div class="mt-3">';
        content += `<button class="btn btn-sm btn-outline-primary me-2" onclick="copyToClipboard('${escapeHtml(JSON.stringify(data))}')">`;
        content += '<i class="fas fa-copy me-1"></i>Copy Response</button>';
        content += '</div>';

        content += '</div>';

        container.innerHTML = content;
        container.style.display = 'block';
    });
}

function displayAPIError(data, endpoint) {
    const responseContainers = document.querySelectorAll(
        '[data-result="error"]'
    );

    responseContainers.forEach((container) => {
        let content = '<div class="response-display response-error">';
        content +=
            '<h5><i class="fas fa-exclamation-triangle text-danger me-2"></i>Error</h5>';

        if (data.s) {
            content += `<p><strong>Code:</strong> ${data.s.code}</p>`;
            content += `<p><strong>Description:</strong> ${data.s.desc}</p>`;
        }

        if (data.e && Array.isArray(data.e)) {
            content += '<div class="mt-3">';
            content += '<strong>Validation Errors:</strong>';
            content += '<ul class="mt-2">';
            data.e.forEach((error) => {
                content += `<li>${escapeHtml(error)}</li>`;
            });
            content += '</ul>';
            content += '</div>';
        }

        if (data.t) {
            content += '<div class="mt-3">';
            content += '<strong>Submitted Text:</strong>';
            content += `<div class="response-code mt-2">${escapeHtml(data.t)}</div>`;
            content += '</div>';
        }

        content += '</div>';

        container.innerHTML = content;
        container.style.display = 'block';
    });
}

function displayGenericError(error) {
    const errorContainers = document.querySelectorAll('[data-result="error"]');

    errorContainers.forEach((container) => {
        let content = '<div class="response-display response-error">';
        content +=
            '<h5><i class="fas fa-exclamation-triangle text-danger me-2"></i>Error</h5>';
        content += `<p>${escapeHtml(error.message || error.error || 'Unknown error')}</p>`;

        if (error.code) {
            content += `<p><strong>Error Code:</strong> ${error.code}</p>`;
        }

        content += '</div>';

        container.innerHTML = content;
        container.style.display = 'block';
    });
}

function openImageModal(imageUrl) {
    // Create modal for full-size image view
    const modalHtml = `
        <div class="modal fade" id="imageModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">QR Code</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageUrl}" class="img-fluid" alt="QR Code">
                    </div>
                    <div class="modal-footer">
                        <a href="${imageUrl}" download="qr-code.png" class="btn btn-primary">
                            <i class="fas fa-download me-1"></i>Download
                        </a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
}

// Utility functions
function showLoadingState(show) {
    const loadingElements = document.querySelectorAll('[data-loading]');
    const submitButtons = document.querySelectorAll('button[type="submit"]');

    if (show) {
        loadingElements.forEach((el) => (el.style.display = 'block'));
        submitButtons.forEach((btn) => {
            btn.disabled = true;
            btn.innerHTML =
                '<i class="fas fa-spinner fa-spin me-1"></i>Processing...';
        });
    } else {
        loadingElements.forEach((el) => (el.style.display = 'none'));
        submitButtons.forEach((btn) => {
            btn.disabled = false;
            btn.innerHTML = btn.getAttribute('data-original-text') || 'Submit';
        });
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initialize API handling
document.addEventListener('DOMContentLoaded', function () {
    // Store original button texts
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach((btn) => {
        btn.setAttribute('data-original-text', btn.innerHTML);
    });

    // Set up CORS handling if needed
    setupCORSHandling();
});

function setupCORSHandling() {
    // Handle potential CORS issues with fallback
    window.addEventListener('unhandledrejection', function (event) {
        if (
            event.reason &&
            event.reason.message &&
            event.reason.message.includes('CORS')
        ) {
            console.warn('CORS error detected, API calls may fail');
            showNotification(
                'Cross-origin request blocked. API calls may not work from this domain.',
                'warning'
            );
        }
    });
}

// Export API functions
window.NBSAPI = {
    generateQRImage,
    generateQRWithResponse,
    validateQRText,
    uploadQRImage,
    makeAPICall,
    handleAPIResponse,
    handleAPIError,
};
