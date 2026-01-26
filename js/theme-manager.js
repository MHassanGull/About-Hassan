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
        { id: 'default', name: 'Deep Black (Default)', color: '#030712' },
        { id: 'soft-blues', name: 'Soft Blues', color: '#e0f2fe' },
        { id: 'sage-greens', name: 'Sage Greens', color: '#dcfce7' },
        { id: 'pale-yellows', name: 'Pale Yellows', color: '#fef9c3' },
        { id: 'warm-greys', name: 'Warm Greys', color: '#e7e5e4' },
        { id: 'muted-terracotta', name: 'Muted Terracotta', color: '#fed7aa' },
        { id: 'calming-blues', name: 'Calming Blues', color: '#dbeafe' },
        { id: 'earthy-greens', name: 'Earthy Greens', color: '#d1fae5' },
        { id: 'soft-warm-tones', name: 'Soft Warm Tones', color: '#ffe4e6' },
        { id: 'pure-white', name: 'Pure White', color: '#ffffff' },
        { id: 'deep-black', name: 'Deep Black', color: '#000000' }
    ];

    const STORAGE_KEY = 'antigravity-theme';
    let currentTheme = 'default';

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
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && THEMES.find(t => t.id === saved)) {
                applyTheme(saved, false);
            }
        } catch (error) {
            console.warn('Failed to load theme from localStorage:', error);
        }
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

        // Save to localStorage
        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY, themeId);
            } catch (error) {
                console.warn('Failed to save theme to localStorage:', error);
            }
        }

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
