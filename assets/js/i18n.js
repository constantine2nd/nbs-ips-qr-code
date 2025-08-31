// Internationalization library for NBS IPS QR Code Application
// Supports Serbian Latin, Serbian Cyrillic, and English

class I18n {
    constructor() {
        this.currentLanguage = 'sr_RS_Latn';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.loadedLanguages = new Set();

        // Language configuration
        this.languageConfig = {
            sr_RS_Latn: {
                name: 'Latinica',
                locale: 'sr-RS',
                direction: 'ltr',
                charset: 'UTF-8',
            },
            sr_RS: {
                name: 'Ćirilica',
                locale: 'sr-RS',
                direction: 'ltr',
                charset: 'UTF-8',
            },
            en: {
                name: 'English',
                locale: 'en-US',
                direction: 'ltr',
                charset: 'UTF-8',
            },
        };

        // Initialize
        this.init();
    }

    async init() {
        // Load saved language preference
        const savedLang = localStorage.getItem('nbs_language');
        if (savedLang && this.languageConfig[savedLang]) {
            this.currentLanguage = savedLang;
        }

        // Load default language
        await this.loadLanguage(this.currentLanguage);

        // Load fallback language if different
        if (this.currentLanguage !== this.fallbackLanguage) {
            await this.loadLanguage(this.fallbackLanguage);
        }

        // Apply translations to current page
        this.applyTranslations();

        // Set document language
        this.setDocumentLanguage();
    }

    async loadLanguage(lang) {
        if (this.loadedLanguages.has(lang)) {
            return;
        }

        try {
            // Try multiple path variations to ensure compatibility
            const possiblePaths = [
                `./assets/i18n/${lang}.json`,
                `/assets/i18n/${lang}.json`,
                `/nbs-ips-qr-code/assets/i18n/${lang}.json`,
                `${window.location.origin}${window.location.pathname}assets/i18n/${lang}.json`.replace(
                    '//',
                    '/'
                ),
            ];

            let response;
            let loadedPath;

            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        loadedPath = path;
                        break;
                    }
                } catch (pathError) {
                    // Silently try next path
                }
            }

            if (!response || !response.ok) {
                throw new Error(
                    `All path attempts failed for language: ${lang}`
                );
            }

            if (!response.ok) {
                throw new Error(`Failed to load language file: ${lang}`);
            }

            const translations = await response.json();
            this.translations[lang] = translations;
            this.loadedLanguages.add(lang);
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);

            // If current language fails to load, fallback to English
            if (
                lang === this.currentLanguage &&
                lang !== this.fallbackLanguage
            ) {
                this.currentLanguage = this.fallbackLanguage;
                await this.loadLanguage(this.fallbackLanguage);
            }
        }
    }

    async changeLanguage(lang) {
        if (!this.languageConfig[lang]) {
            console.error(`Unsupported language: ${lang}`);
            return;
        }

        // Load language if not already loaded
        if (!this.loadedLanguages.has(lang)) {
            await this.loadLanguage(lang);
        }

        this.currentLanguage = lang;
        localStorage.setItem('nbs_language', lang);

        // Apply translations
        this.applyTranslations();

        // Set document language
        this.setDocumentLanguage();
    }

    translate(key, params = {}) {
        // Get translation from current language
        let translation = this.getNestedTranslation(
            this.translations[this.currentLanguage],
            key
        );

        // Fallback to fallback language if not found
        if (
            translation === key &&
            this.currentLanguage !== this.fallbackLanguage
        ) {
            translation = this.getNestedTranslation(
                this.translations[this.fallbackLanguage],
                key
            );
        }

        // Return key if no translation found
        if (translation === key) {
            console.warn(`Translation not found: ${key}`);
        }

        // Replace parameters
        return this.replaceParameters(translation, params);
    }

    // Alias for translate method
    t(key, params = {}) {
        return this.translate(key, params);
    }

    getNestedTranslation(translations, key) {
        if (!translations) {
            return key;
        }

        const keys = key.split('.');
        let result = translations;

        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key;
            }
        }

        return typeof result === 'string' ? result : key;
    }

    replaceParameters(text, params) {
        if (!params || typeof params !== 'object') {
            return text;
        }

        return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }

    applyTranslations() {
        // Translate elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else {
                // Preserve HTML structure for elements with data-i18n-html attribute
                if (element.hasAttribute('data-i18n-html')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Translate title attributes
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach((element) => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.translate(key);
        });

        // Translate aria-label attributes
        const ariaElements = document.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach((element) => {
            const key = element.getAttribute('data-i18n-aria');
            element.setAttribute('aria-label', this.translate(key));
        });
    }

    setDocumentLanguage() {
        const config = this.languageConfig[this.currentLanguage];
        if (config) {
            document.documentElement.lang = config.locale;
            document.documentElement.dir = config.direction;

            // Update body class for language-specific styling
            document.body.className = document.body.className.replace(
                /\blang-[\w_]+/g,
                ''
            );
            document.body.classList.add(`lang-${this.currentLanguage}`);

            // Apply Cyrillic font class if needed
            if (this.currentLanguage === 'sr_RS') {
                document.body.classList.add('cyrillic-font');
            } else {
                document.body.classList.remove('cyrillic-font');
            }
        }
    }

    getLanguageName(lang) {
        return this.languageConfig[lang]?.name || lang;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return Object.keys(this.languageConfig);
    }

    getLanguageConfig(lang) {
        return this.languageConfig[lang];
    }

    // Format numbers according to current locale
    formatNumber(number, options = {}) {
        const config = this.languageConfig[this.currentLanguage];
        if (config) {
            return new Intl.NumberFormat(config.locale, options).format(number);
        }
        return number.toString();
    }

    // Format currency according to current locale
    formatCurrency(amount, currency = 'RSD', options = {}) {
        const config = this.languageConfig[this.currentLanguage];
        if (config) {
            return new Intl.NumberFormat(config.locale, {
                style: 'currency',
                currency: currency,
                ...options,
            }).format(amount);
        }
        return `${amount} ${currency}`;
    }

    // Format dates according to current locale
    formatDate(date, options = {}) {
        const config = this.languageConfig[this.currentLanguage];
        if (config) {
            return new Intl.DateTimeFormat(config.locale, options).format(
                new Date(date)
            );
        }
        return new Date(date).toLocaleDateString();
    }

    // Get relative time format
    formatRelativeTime(value, unit = 'second') {
        const config = this.languageConfig[this.currentLanguage];
        if (config && Intl.RelativeTimeFormat) {
            const rtf = new Intl.RelativeTimeFormat(config.locale);
            return rtf.format(value, unit);
        }
        return `${value} ${unit}${Math.abs(value) !== 1 ? 's' : ''} ago`;
    }

    // Check if current language is RTL
    isRTL() {
        const config = this.languageConfig[this.currentLanguage];
        return config?.direction === 'rtl';
    }

    // Get text direction
    getTextDirection() {
        const config = this.languageConfig[this.currentLanguage];
        return config?.direction || 'ltr';
    }

    // Pluralization helper
    pluralize(key, count, params = {}) {
        const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
        return this.translate(pluralKey, { ...params, count });
    }
}

// Global instance
let i18n;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    i18n = new I18n();

    // Make i18n globally available immediately
    window.i18n = i18n;
    window.t = (key, params) => i18n.translate(key, params);
});

// Language switcher setup with improved event handling

// Mutation observer to automatically translate dynamically added content
const observer = new MutationObserver(function (mutations) {
    if (!i18n) return;

    mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if the added node or its children need translation
                const elementsToTranslate = node.querySelectorAll
                    ? node.querySelectorAll(
                          '[data-i18n], [data-i18n-title], [data-i18n-aria]'
                      )
                    : [];

                if (elementsToTranslate.length > 0) {
                    // Apply translations to new elements
                    setTimeout(() => i18n.applyTranslations(), 0);
                }
            }
        });
    });
});

// Start observing when i18n is ready
document.addEventListener('DOMContentLoaded', function () {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18n, getLanguageName };
}
