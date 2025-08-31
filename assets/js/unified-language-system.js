// Unified Language Management System
// Prevents duplicate notifications and conflicting event handlers
// This replaces all other language management systems

// Immediate fallback to prevent ReferenceError
window.changeLanguage =
    window.changeLanguage ||
    function (lang) {
        console.log(
            'changeLanguage called before unified system ready, queuing:',
            lang
        );
        if (
            window.UnifiedLanguageSystem &&
            window.UnifiedLanguageSystem.changeLanguage
        ) {
            return window.UnifiedLanguageSystem.changeLanguage(lang);
        }
        // Queue the call for when system is ready
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(function () {
                if (
                    window.UnifiedLanguageSystem &&
                    window.UnifiedLanguageSystem.changeLanguage
                ) {
                    window.UnifiedLanguageSystem.changeLanguage(lang);
                }
            }, 1000);
        });
    };

(function () {
    'use strict';

    // Configuration
    const STORAGE_KEY = 'nbs_language';
    const DEFAULT_LANGUAGE = 'sr_RS_Latn';
    const NOTIFICATION_DURATION = 2000;

    const LANGUAGE_NAMES = {
        sr_RS_Latn: 'Latinica',
        sr_RS: 'Ćirilica',
        en: 'English',
    };

    // State management
    let isInitialized = false;
    let isChangingLanguage = false;
    let lastChangeTime = 0;
    let currentLanguage = DEFAULT_LANGUAGE;

    // Initialize the unified language system
    function initializeUnifiedLanguageSystem() {
        if (isInitialized) {
            return;
        }

        try {
            // Disable other language systems
            disableOtherLanguageSystems();

            // Set up our system
            setupLanguageDropdown();
            initializeFromStorage();
            setupGlobalAPI();

            isInitialized = true;
        } catch (error) {
            console.error('Error initializing unified language system:', error);
        }
    }

    // Disable other language management systems to prevent conflicts
    function disableOtherLanguageSystems() {
        // Disable inline language handlers
        if (window.initLanguageDropdown) {
            window.initLanguageDropdown = function () {
                // Disabled by unified system
            };
        }

        // Disable language fix systems
        if (window.LanguageDropdownFix) {
            window.LanguageDropdownFix.initialize = function () {
                // Disabled by unified system
            };
        }

        // Override other changeLanguage functions to prevent conflicts
        const originalChangeLanguage = window.changeLanguage;
        window.changeLanguage = function (lang) {
            // Only allow our system to change language
            if (isChangingLanguage) {
                if (
                    originalChangeLanguage &&
                    typeof originalChangeLanguage === 'function'
                ) {
                    return originalChangeLanguage.call(this, lang);
                }
            } else {
                return changeLanguage(lang);
            }
        };
    }

    // Set up the language dropdown with proper event handling
    function setupLanguageDropdown() {
        const languageItems = document.querySelectorAll('[data-lang]');

        if (languageItems.length === 0) {
            return;
        }

        // Remove all existing language-related event listeners
        languageItems.forEach((item) => {
            // Clone the element to remove all event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });

        // Add our controlled event listeners
        const refreshedItems = document.querySelectorAll('[data-lang]');
        refreshedItems.forEach((item) => {
            item.addEventListener('click', handleLanguageClick);
        });
    }

    // Handle language dropdown clicks
    function handleLanguageClick(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const selectedLanguage = this.getAttribute('data-lang');

        if (!selectedLanguage) {
            console.error('No data-lang attribute found');
            return;
        }

        // Prevent rapid successive clicks
        const now = Date.now();
        if (now - lastChangeTime < 500) {
            return;
        }
        changeLanguage(selectedLanguage);
    }

    // Main language change function
    async function changeLanguage(languageCode) {
        if (!languageCode || !LANGUAGE_NAMES[languageCode]) {
            console.error(`Invalid language code: ${languageCode}`);
            return;
        }

        if (currentLanguage === languageCode) {
            return;
        }

        // Prevent concurrent changes and duplicate notifications
        if (isChangingLanguage) {
            return;
        }

        isChangingLanguage = true;
        lastChangeTime = Date.now();

        try {
            currentLanguage = languageCode;

            // Update UI elements
            updateDropdownButton(languageCode);
            updateActiveStates(languageCode);
            updateDocumentLanguage(languageCode);

            // Save to storage
            localStorage.setItem(STORAGE_KEY, languageCode);

            // Update global variables for backward compatibility
            window.currentLanguage = languageCode;

            // Use i18n system if available for translations only
            if (
                window.i18n &&
                typeof window.i18n.changeLanguage === 'function'
            ) {
                try {
                    await window.i18n.changeLanguage(languageCode);
                    console.log('i18n language change completed');
                } catch (error) {
                    console.error('i18n language change failed:', error);
                }
            }

            // Close dropdown
            closeLanguageDropdown();

            // Show single notification
            showUnifiedNotification(languageCode);

            // Dispatch event for other components
            dispatchLanguageChangeEvent(languageCode);

            console.log(`Language successfully changed to: ${languageCode}`);
        } catch (error) {
            console.error('Error changing language:', error);
        } finally {
            isChangingLanguage = false;
        }
    }

    // Update the dropdown button text
    function updateDropdownButton(languageCode) {
        const dropdownToggle =
            document.querySelector('.navbar .dropdown-toggle') ||
            document.getElementById('languageDropdown');

        if (!dropdownToggle) {
            console.warn('Language dropdown toggle not found');
            return;
        }

        const languageName = LANGUAGE_NAMES[languageCode];
        dropdownToggle.innerHTML = `<i class="fas fa-language me-1"></i>${languageName}`;

        // Updated dropdown button
    }

    // Update active states in dropdown
    function updateActiveStates(selectedLanguage) {
        const languageItems = document.querySelectorAll('[data-lang]');

        languageItems.forEach((item) => {
            const itemLanguage = item.getAttribute('data-lang');

            if (itemLanguage === selectedLanguage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Update document language attributes
    function updateDocumentLanguage(languageCode) {
        // Update html lang attribute
        document.documentElement.lang = languageCode;

        // Update body class for styling
        document.body.className = document.body.className.replace(
            /\blang-[\w_]+/g,
            ''
        );
        document.body.classList.add(`lang-${languageCode}`);

        // Set global currentLanguage variable for backward compatibility
        window.currentLanguage = languageCode;
    }

    // Close the language dropdown
    function closeLanguageDropdown() {
        const dropdownToggle =
            document.querySelector('.navbar .dropdown-toggle') ||
            document.getElementById('languageDropdown');

        if (dropdownToggle && window.bootstrap) {
            const dropdownInstance =
                bootstrap.Dropdown.getInstance(dropdownToggle);
            if (dropdownInstance) {
                dropdownInstance.hide();
            }
        }
    }

    // Show unified notification (prevents duplicates)
    function showUnifiedNotification(languageCode) {
        // Remove any existing language notifications
        const existingNotifications = document.querySelectorAll(
            '.unified-language-notification, .alert'
        );
        existingNotifications.forEach((notification) => {
            const text = notification.textContent || '';
            if (
                text.toLowerCase().includes('language changed') ||
                text.toLowerCase().includes('changed to') ||
                text.toLowerCase().includes('jezik promenjen') ||
                text.toLowerCase().includes('jezik promijenjen')
            ) {
                if (notification.parentNode) {
                    notification.remove();
                }
            }
        });

        const languageName = LANGUAGE_NAMES[languageCode];

        // Create new notification
        const notification = document.createElement('div');
        notification.className =
            'unified-language-notification alert alert-info position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 250px;
            animation: slideInFade 0.3s ease-out, slideOutFade 0.3s ease-out 1.7s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-language me-2"></i>
                <span>Language changed to <strong>${languageName}</strong></span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        // Add CSS animations if not present
        if (!document.querySelector('#unifiedLanguageNotificationStyles')) {
            const styles = document.createElement('style');
            styles.id = 'unifiedLanguageNotificationStyles';
            styles.textContent = `
                @keyframes slideInFade {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideOutFade {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, NOTIFICATION_DURATION);

        console.log(`Showed unified notification for: ${languageName}`);
    }

    // Dispatch language change event
    function dispatchLanguageChangeEvent(languageCode) {
        const event = new CustomEvent('languageChanged', {
            detail: {
                language: languageCode,
                languageName: LANGUAGE_NAMES[languageCode],
                source: 'unified-system',
            },
        });

        document.dispatchEvent(event);
        console.log(`Dispatched languageChanged event for: ${languageCode}`);
    }

    // Initialize from stored preference
    function initializeFromStorage() {
        const savedLanguage =
            localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;

        // Initializing with saved language

        currentLanguage = savedLanguage;
        updateDropdownButton(savedLanguage);
        updateActiveStates(savedLanguage);
        updateDocumentLanguage(savedLanguage);

        // Set global variable for backward compatibility
        window.currentLanguage = savedLanguage;

        // Don't show notification on initialization
        // Language initialized
    }

    // Set up global API
    function setupGlobalAPI() {
        // Make unified system globally available
        window.UnifiedLanguageSystem = {
            changeLanguage: changeLanguage,
            getCurrentLanguage: () => currentLanguage,
            getLanguageNames: () => ({ ...LANGUAGE_NAMES }),
            getSupportedLanguages: () => Object.keys(LANGUAGE_NAMES),
            reinitialize: () => {
                isInitialized = false;
                initializeUnifiedLanguageSystem();
            },
            isInitialized: () => isInitialized,
        };

        // Override global functions to use unified system
        window.changeLanguage = changeLanguage;
        window.getLanguageName = (lang) => LANGUAGE_NAMES[lang] || lang;

        // Global API set up
    }

    // Prevent other systems from showing notifications
    function suppressOtherNotifications() {
        // Suppress showNotification calls for language changes
        if (window.showNotification) {
            const originalShowNotification = window.showNotification;
            window.showNotification = function (message, type) {
                if (
                    typeof message === 'string' &&
                    (message.includes('Language changed') ||
                        message.includes('language changed') ||
                        message.includes('changed to'))
                ) {
                    // Language notification suppressed by unified system
                    return;
                }
                return originalShowNotification.call(this, message, type);
            };
        }
    }

    // Multiple initialization attempts for reliability
    function attemptInitialization() {
        // Attempt 1: DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    initializeUnifiedLanguageSystem();
                    suppressOtherNotifications();
                }, 300);
            });
        } else {
            setTimeout(() => {
                initializeUnifiedLanguageSystem();
                suppressOtherNotifications();
            }, 300);
        }

        // Attempt 2: After i18n system loads
        setTimeout(() => {
            if (!isInitialized) {
                console.log('Backup unified language system initialization...');
                initializeUnifiedLanguageSystem();
                suppressOtherNotifications();
            }
        }, 2000);

        // Attempt 3: Final fallback for slow-loading pages
        setTimeout(() => {
            if (!isInitialized) {
                console.log('Final unified language system initialization...');
                initializeUnifiedLanguageSystem();
                suppressOtherNotifications();
            }
        }, 4000);
    }

    // Override the fallback with the real implementation
    window.changeLanguage = changeLanguage;
    window.getLanguageName = (lang) => LANGUAGE_NAMES[lang] || lang;

    // Start initialization
    attemptInitialization();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !isInitialized) {
            console.log(
                'Page visible again, attempting unified system initialization...'
            );
            initializeUnifiedLanguageSystem();
        }
    });

    console.log('Unified Language Management System loaded');
})();
