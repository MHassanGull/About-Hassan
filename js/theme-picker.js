/**
 * Theme Picker UI Initialization
 * This script populates and manages the theme picker dropdown
 */

(function () {
    'use strict';

    // Wait for theme manager to be available
    const initThemePicker = () => {
        if (!window.AntigravityThemes) {
            setTimeout(initThemePicker, 100);
            return;
        }

        const wrapper = document.querySelector('.theme-picker-wrapper');
        const toggle = document.querySelector('.theme-picker-toggle');
        const grid = document.getElementById('theme-picker-grid');

        if (!wrapper || !toggle || !grid) return;

        // Populate theme options
        const themes = AntigravityThemes.getAllThemes();
        themes.forEach(theme => {
            const option = document.createElement('div');
            option.className = 'theme-option';
            option.setAttribute('data-theme-id', theme.id);

            option.innerHTML = `
                <div class="theme-color-swatch" style="background: ${theme.color};"></div>
                <span class="theme-name">${theme.name}</span>
            `;

            option.addEventListener('click', () => {
                AntigravityThemes.applyTheme(theme.id);
                updateActiveState();
                wrapper.classList.remove('active');
            });

            grid.appendChild(option);
        });

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('active');
            }
        });

        // Update active state
        function updateActiveState() {
            const current = AntigravityThemes.getCurrentTheme();
            document.querySelectorAll('.theme-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.themeId === current);
            });
        }

        // Listen for theme changes
        window.addEventListener('themechange', updateActiveState);

        // Initial state
        updateActiveState();

        console.log('🎨 Theme Picker UI initialized');
    };

    // Auto-init when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemePicker);
    } else {
        initThemePicker();
    }
})();
