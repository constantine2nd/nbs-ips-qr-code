// Templates management for NBS IPS QR Code Application

// Template storage key
const TEMPLATES_STORAGE_KEY = 'nbs_ips_templates';

// Template management class
class TemplateManager {
    constructor() {
        this.templates = this.loadTemplates();
    }

    // Load templates from localStorage
    loadTemplates() {
        try {
            const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : [];
            // Migrate existing templates to ensure they have proper usage fields
            return parsed.map((template) => ({
                ...template,
                usageCount: template.usageCount || 0,
                lastUsed: template.lastUsed || null,
            }));
        } catch (error) {
            console.error('Error loading templates:', error);
            return [];
        }
    }

    // Save templates to localStorage
    saveTemplates() {
        try {
            const dataToSave = JSON.stringify(this.templates);
            localStorage.setItem(TEMPLATES_STORAGE_KEY, dataToSave);
            return true;
        } catch (error) {
            console.error('Error saving templates:', error);
            showNotification('Failed to save templates', 'error');
            return false;
        }
    }

    // Add new template
    addTemplate(name, description, data, endpoint, method = 'POST') {
        const template = {
            id: this.generateId(),
            name: name,
            description: description,
            data: data,
            endpoint: endpoint,
            method: method,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            lastUsed: null,
        };

        this.templates.push(template);
        this.saveTemplates();
        return template;
    }

    // Update existing template
    updateTemplate(id, updates) {
        const index = this.templates.findIndex((t) => t.id === id);
        if (index === -1) return false;

        this.templates[index] = {
            ...this.templates[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        this.saveTemplates();
        return this.templates[index];
    }

    // Delete template
    deleteTemplate(id) {
        const index = this.templates.findIndex((t) => t.id === id);
        if (index === -1) return false;

        this.templates.splice(index, 1);
        this.saveTemplates();
        return true;
    }

    // Get template by ID
    getTemplate(id) {
        return this.templates.find((t) => t.id === id);
    }

    // Get all templates
    getAllTemplates() {
        return [...this.templates];
    }

    // Search templates
    searchTemplates(query) {
        const searchTerm = query.toLowerCase();
        return this.templates.filter(
            (template) =>
                template.name.toLowerCase().includes(searchTerm) ||
                template.description.toLowerCase().includes(searchTerm) ||
                template.endpoint.toLowerCase().includes(searchTerm)
        );
    }

    // Filter templates by endpoint
    filterByEndpoint(endpoint) {
        return this.templates.filter((t) => t.endpoint === endpoint);
    }

    // Increment usage count
    incrementUsage(id) {
        const template = this.getTemplate(id);
        if (template) {
            template.usageCount++;
            template.lastUsed = new Date().toISOString();
            this.saveTemplates();
        }
    }

    // Export templates
    exportTemplates() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            templates: this.templates,
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Import templates
    importTemplates(jsonData, options = {}) {
        try {
            const importData = JSON.parse(jsonData);

            if (!importData.templates || !Array.isArray(importData.templates)) {
                throw new Error('Invalid template format');
            }

            const results = {
                imported: 0,
                skipped: 0,
                errors: [],
            };

            importData.templates.forEach((template, index) => {
                try {
                    // Validate template structure
                    if (!this.validateTemplate(template)) {
                        results.errors.push(
                            `Template ${index + 1}: Invalid structure`
                        );
                        results.skipped++;
                        return;
                    }

                    // Check for duplicates
                    const existing = this.templates.find(
                        (t) =>
                            t.name === template.name &&
                            t.endpoint === template.endpoint
                    );

                    if (existing) {
                        if (options.overwrite) {
                            // Update existing template
                            this.updateTemplate(existing.id, {
                                description: template.description,
                                data: template.data,
                                method: template.method,
                            });
                            results.imported++;
                        } else {
                            // Skip duplicate
                            results.skipped++;
                        }
                    } else {
                        // Add new template
                        this.addTemplate(
                            template.name,
                            template.description || '',
                            template.data,
                            template.endpoint,
                            template.method || 'POST'
                        );
                        results.imported++;
                    }
                } catch (error) {
                    results.errors.push(
                        `Template ${index + 1}: ${error.message}`
                    );
                    results.skipped++;
                }
            });

            return results;
        } catch (error) {
            throw new Error('Invalid JSON format: ' + error.message);
        }
    }

    // Validate template structure
    validateTemplate(template) {
        return (
            template &&
            typeof template.name === 'string' &&
            typeof template.endpoint === 'string' &&
            template.data !== undefined
        );
    }

    // Generate unique ID
    generateId() {
        return (
            'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        );
    }

    // Clear all templates
    clearAllTemplates() {
        console.log('clearAllTemplates() called - clearing all templates');
        console.trace('Stack trace for clearAllTemplates');
        this.templates = [];
        this.saveTemplates();
    }

    // Get templates statistics
    getStatistics() {
        const total = this.templates.length;
        const endpoints = {};
        let totalUsage = 0;

        this.templates.forEach((template) => {
            if (!endpoints[template.endpoint]) {
                endpoints[template.endpoint] = 0;
            }
            endpoints[template.endpoint]++;
            totalUsage += template.usageCount || 0;
        });

        return {
            total,
            endpoints,
            totalUsage,
            averageUsage: total > 0 ? (totalUsage / total).toFixed(2) : 0,
        };
    }
}

// Create global template manager instance with initialization system
let templateManager = null;
let initializationPromise = null;

function initializeTemplateManager() {
    if (templateManager) return Promise.resolve(templateManager);
    if (initializationPromise) return initializationPromise;

    initializationPromise = new Promise((resolve) => {
        try {
            templateManager = new TemplateManager();

            if (!templateManager) {
                throw new Error(
                    'TemplateManager constructor returned null/undefined'
                );
            }

            // Verify critical methods exist
            if (typeof templateManager.filterByEndpoint !== 'function') {
                throw new Error(
                    'TemplateManager missing filterByEndpoint method'
                );
            }

            // Export immediately
            if (typeof window !== 'undefined') {
                window.TemplateManager = templateManager;
                window.templateManager = templateManager;

                // Verify export worked
                if (window.TemplateManager !== templateManager) {
                    throw new Error('TemplateManager export failed');
                }

                // Create ready callback system
                window.TemplateManagerReady = true;

                // Fire ready event
                if (typeof window.dispatchEvent === 'function') {
                    try {
                        window.dispatchEvent(
                            new CustomEvent('templateManagerReady', {
                                detail: { templateManager },
                            })
                        );
                    } catch (eventError) {
                        console.warn(
                            'Failed to dispatch ready event:',
                            eventError
                        );
                    }
                }
            }

            resolve(templateManager);
        } catch (error) {
            console.error(
                'Critical error initializing TemplateManager:',
                error
            );
            console.error('Stack trace:', error.stack);

            // Still try to provide a fallback
            if (typeof window !== 'undefined') {
                window.TemplateManagerError = error.message;
                window.TemplateManagerReady = false;
            }

            resolve(null);
        }
    });

    return initializationPromise;
}

// Initialize immediately
initializeTemplateManager();

// Template UI functions
function saveTemplate() {
    if (
        !window.currentTemplate ||
        !window.currentTemplate.form ||
        !window.currentTemplate.data ||
        Object.keys(window.currentTemplate.data).length === 0
    ) {
        showNotification(
            'No template data available. Please generate a QR code successfully first.',
            'error'
        );
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
    const existing = templateManager.templates.find((t) => t.name === name);
    if (existing) {
        if (
            !confirm(
                'A template with this name already exists. Do you want to replace it?'
            )
        ) {
            return;
        }
        // Delete existing template
        templateManager.deleteTemplate(existing.id);
    }

    try {
        const template = templateManager.addTemplate(
            name,
            description,
            window.currentTemplate.data,
            window.currentTemplate.endpoint,
            window.currentTemplate.method
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

function loadTemplate(templateId) {
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    try {
        // Find form based on endpoint
        const form = document.querySelector(
            `form[data-api-endpoint="${template.endpoint}"]`
        );
        if (!form) {
            showNotification(
                'Compatible form not found for this template',
                'error'
            );
            return;
        }

        // Clear existing form data
        form.reset();

        // Load template data into form
        Object.entries(template.data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else if (input.type === 'radio') {
                    const radioInput = form.querySelector(
                        `[name="${key}"][value="${value}"]`
                    );
                    if (radioInput) {
                        radioInput.checked = true;
                    }
                } else {
                    // Convert various line break formats back to actual line breaks for textareas
                    let processedValue = value;
                    if (typeof value === 'string') {
                        processedValue = value
                            .replace(/\\r\\n/g, '\n') // Escaped \r\n sequences
                            .replace(/\\n/g, '\n') // Escaped \n sequences
                            .replace(/\r\n/g, '\n') // Actual \r\n sequences
                            .replace(/\r/g, '\n'); // Standalone \r sequences
                    }
                    input.value = processedValue;
                }
            }
        });

        // Increment usage count
        templateManager.incrementUsage(templateId);

        showNotification(
            `Template "${template.name}" loaded successfully`,
            'success'
        );

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        showNotification('Failed to load template: ' + error.message, 'error');
    }
}

function loadTemplateAndNavigate(templateId) {
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    // Increment usage count
    templateManager.incrementUsage(templateId);

    // Store template data in session storage for cross-page loading
    sessionStorage.setItem('loadTemplate', JSON.stringify(template));

    // Navigate to appropriate page based on endpoint
    const baseUrl = window.SITE_CONFIG ? window.SITE_CONFIG.baseUrl : '/';
    let targetPage = '';
    if (template.endpoint === '/gen' || template.endpoint === '/generate') {
        targetPage = baseUrl + 'generator';
    } else if (template.endpoint === '/validate') {
        targetPage = baseUrl + 'validator';
    } else {
        // Default to generator page
        targetPage = baseUrl + 'generator';
    }

    // If we're already on the target page, just load the template directly
    const currentPath = window.location.pathname;
    const basePath = currentPath
        .replace('/index.html', '')
        .replace('.html', '');

    if (
        basePath === targetPage ||
        (basePath === '' && targetPage === baseUrl + 'generator') ||
        (basePath === '/' && targetPage === baseUrl + 'generator')
    ) {
        // Load template directly on current page
        loadTemplate(templateId);
    } else {
        // Navigate to target page (template will be loaded by checkForTemplateToLoad)
        window.location.href = targetPage;
    }
}

function viewTemplateDetails(templateId) {
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    // Create modal content
    const modalContent = `
        <div class="modal fade" id="templateDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" data-i18n="templates.modal.details.title">Template Details: ${escapeHtml(template.name)}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.name">Name:</strong></div>
                            <div class="col-sm-9">${escapeHtml(template.name)}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.description">Description:</strong></div>
                            <div class="col-sm-9">${escapeHtml(template.description || 'No description')}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.endpoint">Endpoint:</strong></div>
                            <div class="col-sm-9">${template.endpoint}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.usageCount">Usage Count:</strong></div>
                            <div class="col-sm-9">${template.usageCount || 0}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.created">Created:</strong></div>
                            <div class="col-sm-9">${new Date(template.createdAt).toLocaleString()}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.lastUsed">Last Used:</strong></div>
                            <div class="col-sm-9">${template.lastUsed ? new Date(template.lastUsed).toLocaleString() : 'Never'}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-3"><strong data-i18n="templates.modal.details.data">Data:</strong></div>
                            <div class="col-sm-9"><pre class="bg-light p-2 rounded">${JSON.stringify(template.data, null, 2)}</pre></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="common.close">Close</button>
                        <button type="button" class="btn btn-primary" onclick="loadTemplateAndNavigate('${template.id}')" data-i18n="templates.buttons.loadTemplate">Load Template</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('templateDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // Show modal
    const modal = new bootstrap.Modal(
        document.getElementById('templateDetailsModal')
    );
    modal.show();
}

// editTemplateInModal and saveEditedTemplate functions removed
// These are handled by the HTML page's own functions to avoid conflicts

function duplicateTemplate(templateId) {
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    // Get new name from user
    const newName = prompt(
        'Enter name for duplicated template:',
        template.name + ' (Copy)'
    );
    if (!newName || !newName.trim()) {
        return;
    }

    const duplicatedTemplate = templateManager.addTemplate(
        newName.trim(),
        template.description,
        { ...template.data },
        template.endpoint,
        template.method
    );

    if (duplicatedTemplate) {
        showNotification(
            `Template duplicated as "${duplicatedTemplate.name}"`,
            'success'
        );

        // Refresh template display if we're on templates page
        if (typeof renderTemplates === 'function') {
            renderTemplates();
        }

        // Refresh quick templates if we're on generator page
        if (typeof loadQuickTemplates === 'function') {
            loadQuickTemplates();
        }

        // Refresh template display if we're on templates page using new system
        if (typeof refreshTemplatesDisplay === 'function') {
            refreshTemplatesDisplay();
        }
    } else {
        showNotification('Failed to duplicate template', 'error');
    }
}

function deleteTemplate(templateId) {
    console.log('deleteTemplate() called for ID:', templateId);
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    if (
        !confirm(
            `Are you sure you want to delete the template "${template.name}"?`
        )
    ) {
        return;
    }

    try {
        templateManager.deleteTemplate(templateId);
        showNotification(
            `Template "${template.name}" deleted successfully`,
            'success'
        );

        // Refresh templates display
        if (typeof refreshTemplatesDisplay === 'function') {
            refreshTemplatesDisplay();
        }
    } catch (error) {
        showNotification(
            'Failed to delete template: ' + error.message,
            'error'
        );
    }
}

function editTemplate(templateId) {
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    // Open edit modal
    const modal = document.getElementById('editTemplateModal');
    if (modal) {
        document.getElementById('editTemplateName').value = template.name;
        document.getElementById('editTemplateDescription').value =
            template.description || '';
        document.getElementById('editTemplateId').value = template.id;

        const editModal = new bootstrap.Modal(modal);
        editModal.show();
    } else {
        // Fallback: use prompt
        const newName = prompt('Template name:', template.name);
        if (newName && newName.trim() !== template.name) {
            const newDescription = prompt(
                'Template description:',
                template.description || ''
            );
            updateTemplate(template.id, {
                name: newName.trim(),
                description: newDescription ? newDescription.trim() : '',
            });
        }
    }
}

function updateTemplate(templateId, updates) {
    try {
        const updated = templateManager.updateTemplate(templateId, updates);
        if (updated) {
            showNotification('Template updated successfully', 'success');
            if (typeof refreshTemplatesDisplay === 'function') {
                refreshTemplatesDisplay();
            }
        } else {
            showNotification('Failed to update template', 'error');
        }
    } catch (error) {
        showNotification(
            'Failed to update template: ' + error.message,
            'error'
        );
    }
}

function exportTemplates() {
    try {
        const exportData = templateManager.exportTemplates();
        const filename = `nbs-ips-templates-${new Date().toISOString().split('T')[0]}.json`;
        downloadFile(exportData, filename, 'application/json');
        showNotification('Templates exported successfully', 'success');
    } catch (error) {
        showNotification(
            'Failed to export templates: ' + error.message,
            'error'
        );
    }
}

function importTemplates() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (!file) {
        showNotification(
            window.i18n?.t('notifications.selectFileToImport') ||
                'Please select a file to import',
            'error'
        );
        return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showNotification(
            window.i18n?.t('notifications.pleaseSelectJsonFile') ||
                'Please select a JSON file',
            'error'
        );
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonData = e.target.result;
            const results = templateManager.importTemplates(jsonData, {
                overwrite: confirm(
                    window.i18n?.t(
                        'notifications.overwriteExistingTemplates'
                    ) ||
                        'Do you want to overwrite existing templates with the same name?'
                ),
            });

            let message;
            if (results.skipped > 0 && results.errors.length > 0) {
                message =
                    window.i18n?.t('notifications.importCompletedFull', {
                        imported: results.imported,
                        skipped: results.skipped,
                        errors: results.errors.length,
                    }) ||
                    `Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`;
            } else if (results.skipped > 0) {
                message =
                    window.i18n?.t('notifications.importCompletedWithSkipped', {
                        imported: results.imported,
                        skipped: results.skipped,
                    }) ||
                    `Import completed: ${results.imported} imported, ${results.skipped} skipped`;
            } else if (results.errors.length > 0) {
                message =
                    window.i18n?.t('notifications.importCompletedWithErrors', {
                        imported: results.imported,
                        errors: results.errors.length,
                    }) ||
                    `Import completed: ${results.imported} imported, ${results.errors.length} errors`;
                console.warn('Import errors:', results.errors);
            } else {
                message =
                    window.i18n?.t('notifications.importCompleted', {
                        imported: results.imported,
                    }) || `Import completed: ${results.imported} imported`;
            }

            showNotification(
                message,
                results.errors.length > 0 ? 'warning' : 'success'
            );

            // Close modal
            const modal = bootstrap.Modal.getInstance(
                document.getElementById('importModal')
            );
            if (modal) {
                modal.hide();
            }

            // Clear file input
            fileInput.value = '';

            // Refresh templates display
            if (typeof refreshTemplatesDisplay === 'function') {
                refreshTemplatesDisplay();
            }
        } catch (error) {
            showNotification(
                (window.i18n?.t('notifications.importFailed') ||
                    'Import failed') +
                    ': ' +
                    error.message,
                'error'
            );
        }
    };

    reader.readAsText(file);
}

function searchTemplates() {
    const searchInput = document.getElementById('templateSearch');
    const query = searchInput ? searchInput.value : '';
    const templates = query
        ? templateManager.searchTemplates(query)
        : templateManager.getAllTemplates();

    if (typeof displayTemplates === 'function') {
        displayTemplates(templates);
    }
}

function filterTemplatesByEndpoint(endpoint) {
    const templates =
        endpoint === 'all'
            ? templateManager.getAllTemplates()
            : templateManager.filterByEndpoint(endpoint);

    if (typeof displayTemplates === 'function') {
        displayTemplates(templates);
    }
}

function clearAllTemplates() {
    console.log('clearAllTemplates() function called');
    console.trace('Stack trace for clearAllTemplates function');
    if (
        !confirm(
            'Are you sure you want to delete ALL templates? This action cannot be undone.'
        )
    ) {
        return;
    }

    templateManager.clearAllTemplates();
    showNotification('All templates deleted', 'success');

    if (typeof refreshTemplatesDisplay === 'function') {
        refreshTemplatesDisplay();
    }
}

function getTemplateStatistics() {
    return templateManager.getStatistics();
}

// Template display helper functions
function formatTemplateCard(template) {
    console.log('=== formatTemplateCard START (templates.js) ===');
    console.log('Template ID:', template.id);
    console.log('Template name:', template.name);
    console.log('Template data:', template.data);

    const createdDate = new Date(template.createdAt).toLocaleDateString();
    const usageCount = template.usageCount || 0;
    const endpointLabel = getEndpointLabel(template.endpoint);
    const lastUsed = template.lastUsed
        ? new Date(template.lastUsed).toLocaleDateString()
        : 'Never';

    console.log('Creating buttons for template:', template.id);

    const cardHtml = `
        <div class="col-md-6 col-xl-4 mb-4">
            <div class="card template-card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">${endpointLabel}</span>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button"
                                data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="loadTemplateAndNavigate('${template.id}')">
                                <i class="fas fa-play me-2"></i>Load Template
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="viewTemplateDetails('${template.id}')">
                                <i class="fas fa-eye me-2"></i>View Details
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="console.log('Dropdown edit clicked for ${template.id}'); editTemplateInModal('${template.id}')">
                                <i class="fas fa-edit me-2"></i>Edit Template
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="duplicateTemplate('${template.id}')">
                                <i class="fas fa-copy me-2"></i>Duplicate
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteTemplate('${template.id}')">
                                <i class="fas fa-trash me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title" title="${escapeHtml(template.name)}">
                        ${escapeHtml(template.name.length > 25 ? template.name.substring(0, 25) + '...' : template.name)}
                    </h5>
                    <p class="card-text text-muted small mb-3" title="${escapeHtml(template.description || 'No description')}">
                        ${(() => {
                            const desc =
                                template.description || 'No description';
                            return escapeHtml(
                                desc.length > 60
                                    ? desc.substring(0, 60) + '...'
                                    : desc
                            );
                        })()}
                    </p>
                    <div class="template-meta">
                        <div class="row g-2 text-center">
                            <div class="col-6">
                                <div class="bg-light p-2 rounded">
                                    <div class="small text-muted">Usage</div>
                                    <div class="fw-bold">${usageCount}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-light p-2 rounded">
                                    <div class="small text-muted">Last Used</div>
                                    <div class="fw-bold small">${lastUsed}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-primary" onclick="loadTemplateAndNavigate('${template.id}')">
                            <i class="fas fa-play me-1"></i>Load
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="console.log('Edit button clicked for ${template.id}'); editTemplateInModal('${template.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTemplate('${template.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    console.log('=== formatTemplateCard END (templates.js) ===');
    console.log(
        'Generated card HTML preview:',
        cardHtml.substring(0, 300) + '...'
    );
    return cardHtml;
}

function getEndpointLabel(endpoint) {
    const labels = {
        '/gen': window.i18n?.t('templates.filter.generate') || 'Generate Image',
        '/generate':
            window.i18n?.t('templates.filter.generateResponse') ||
            'Generate with Response',
        '/validate':
            window.i18n?.t('templates.filter.validate') || 'Validate Text',
        '/upload':
            window.i18n?.t('templates.filter.upload') || 'Upload & Validate',
    };
    return labels[endpoint] || endpoint;
}

function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleString();
    } catch (error) {
        return 'Unknown';
    }
}

// Initialize templates functionality
document.addEventListener('DOMContentLoaded', function () {
    // Set up template search
    const searchInput = document.getElementById('templateSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchTemplates, 300));
    }

    // Set up endpoint filter
    const endpointFilter = document.getElementById('endpointFilter');
    if (endpointFilter) {
        endpointFilter.addEventListener('change', function () {
            filterTemplatesByEndpoint(this.value);
        });
    }

    // Set up edit template form if present
    const editTemplateForm = document.getElementById('editTemplateForm');
    if (editTemplateForm) {
        editTemplateForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const templateId = document.getElementById('editTemplateId').value;
            const name = document
                .getElementById('editTemplateName')
                .value.trim();
            const description = document
                .getElementById('editTemplateDescription')
                .value.trim();

            if (!name) {
                showNotification('Template name is required', 'error');
                return;
            }

            updateTemplate(templateId, { name, description });

            // Close modal
            const modal = bootstrap.Modal.getInstance(
                document.getElementById('editTemplateModal')
            );
            if (modal) {
                modal.hide();
            }
        });
    }
});

// Utility function for debouncing search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Ensure TemplateManager is available and export all functions
initializeTemplateManager()
    .then((manager) => {
        if (typeof window !== 'undefined') {
            try {
                // Export UI functions
                window.TemplateUI = {
                    saveTemplate,
                    loadTemplate,
                    deleteTemplate,
                    editTemplate,
                    updateTemplate,
                    exportTemplates,
                    importTemplates,
                    searchTemplates,
                    filterTemplatesByEndpoint,
                    clearAllTemplates,
                    getTemplateStatistics,
                    formatTemplateCard,
                };

                // Export functions globally for HTML onclick handlers
                window.loadTemplate = loadTemplate;
                window.loadTemplateAndNavigate = loadTemplateAndNavigate;
                window.viewTemplateDetails = viewTemplateDetails;
                // editTemplateInModal and saveEditedTemplate removed to avoid conflicts
                window.duplicateTemplate = duplicateTemplate;
                window.deleteTemplate = deleteTemplate;
                window.exportTemplates = exportTemplates;
                window.importTemplates = importTemplates;
                window.clearAllTemplates = clearAllTemplates;

                // Helper function for other scripts to wait for TemplateManager
                window.waitForTemplateManager = function () {
                    return initializationPromise;
                };

                // Final verification
                if (
                    manager &&
                    window.TemplateManager &&
                    typeof window.TemplateManager.filterByEndpoint ===
                        'function'
                ) {
                    // Fire a final ready event
                    if (typeof window.dispatchEvent === 'function') {
                        setTimeout(() => {
                            try {
                                window.dispatchEvent(
                                    new CustomEvent('templateManagerFullyReady')
                                );
                            } catch (e) {
                                console.warn(
                                    'Could not fire fully ready event:',
                                    e
                                );
                            }
                        }, 10);
                    }
                } else {
                    console.error('❌ TemplateManager initialization failed');
                    console.error('Manager exists:', !!manager);
                    console.error(
                        'Window TemplateManager:',
                        !!window.TemplateManager
                    );
                    console.error(
                        'FilterByEndpoint type:',
                        window.TemplateManager
                            ? typeof window.TemplateManager.filterByEndpoint
                            : 'N/A'
                    );
                }
            } catch (exportError) {
                console.error('Error during function export:', exportError);
                window.TemplateManagerExportError = exportError.message;
            }
        }
    })
    .catch((initError) => {
        console.error(
            'TemplateManager initialization promise rejected:',
            initError
        );
        if (typeof window !== 'undefined') {
            window.TemplateManagerInitError = initError
                ? initError.message
                : 'Unknown error';
        }
    });
