/**
 * ═══════════════════════════════════════════════════════════════
 * ANTIGRAVITY THEME MANAGER v1.0
 * Lightweight, framework-agnostic theme switching system
 * ═══════════════════════════════════════════════════════════════
 */

const AntigravityThemes = (() => {
    'use strict';

    // Theme Registry
    const THEMES = [
        { id: 'default', name: 'Dark', color: '#030712' },
        { id: 'soft-blues', name: 'Sky', color: '#e0f2fe' },
        { id: 'sage-greens', name: 'Sage', color: '#dcfce7' },
        { id: 'pale-yellows', name: 'Sun', color: '#fef9c3' },
        { id: 'warm-greys', name: 'Stone', color: '#e7e5e4' },
        { id: 'muted-terracotta', name: 'Clay', color: '#fed7aa' },
        { id: 'calming-blues', name: 'Ocean', color: '#dbeafe' },
        { id: 'earthy-greens', name: 'Leaf', color: '#d1fae5' },
        { id: 'soft-warm-tones', name: 'Rose', color: '#ffe4e6' },
        { id: 'pure-white', name: 'White', color: '#ffffff' },
        { id: 'deep-black', name: 'Black', color: '#000000' }
    ];

    const STORAGE_KEY = 'antigravity-theme';
    let currentTheme = 'deep-black';

    /**
     * Initialize the theme system
     */
    function init() {
        // Load saved theme or default
        loadTheme();

        // Listen for theme changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                applyTheme(e.newValue || 'default', false);
            }
        });

        console.log('🎨 Antigravity Theme Engine initialized');
    }

    /**
     * Load theme from localStorage
     */
    function loadTheme() {
        // Disabled per user request for non-permanent default
        console.log('ℹ️ Theme persistence is disabled. Defaulting to Black.');
        applyTheme('deep-black', false);
    }

    /**
     * Apply a theme
     * @param {string} themeId - The theme identifier
     * @param {boolean} save - Whether to save to localStorage
     */
    function applyTheme(themeId, save = true) {
        const theme = THEMES.find(t => t.id === themeId);

        if (!theme) {
            console.error(`Theme "${themeId}" not found`);
            return;
        }

        // Update data attribute on root
        if (themeId === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeId);
        }

        currentTheme = themeId;

        // Save to localStorage (Disabled per user request)
        /*
        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY, themeId);
            } catch (error) {
                console.warn('Failed to save theme to localStorage:', error);
            }
        }
        */

        // Dispatch custom event for advanced integrations
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: themeId, themeName: theme.name }
        }));

        console.log(`✨ Theme switched to: ${theme.name}`);
    }

    /**
     * Get current theme
     * @returns {string} Current theme ID
     */
    function getCurrentTheme() {
        return currentTheme;
    }

    /**
     * Get all available themes
     * @returns {Array} Array of theme objects
     */
    function getAllThemes() {
        return [...THEMES];
    }

    /**
     * Cycle to the next theme (useful for keyboard shortcuts)
     */
    function cycleTheme() {
        const currentIndex = THEMES.findIndex(t => t.id === currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        applyTheme(THEMES[nextIndex].id);
    }

    // Public API
    return {
        init,
        applyTheme,
        getCurrentTheme,
        getAllThemes,
        cycleTheme,
        THEMES
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AntigravityThemes.init);
} else {
    AntigravityThemes.init();
}

// Expose to window for manual control
window.AntigravityThemes = AntigravityThemes;
