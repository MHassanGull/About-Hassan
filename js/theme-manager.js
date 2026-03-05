/**
 * ╔══════════════════════════════════════════════════════════════╗
 * HASSAN PORTFOLIO — THEME MANAGER v3.0
 * Dark / Light only — pure black & white
 * ╚══════════════════════════════════════════════════════════════╝
 */

const ThemeManager = (() => {
    'use strict';

    const KEY = 'hassan-theme';
    const DARK = 'dark';
    const LIGHT = 'light';
    let current = DARK;

    /* ── Apply ──────────────────────────────────────────────────── */
    function apply(theme, save = true) {
        current = (theme === LIGHT) ? LIGHT : DARK;

        if (current === LIGHT) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        if (save) {
            try { localStorage.setItem(KEY, current); } catch (_) { }
        }

        _updateButtons();

        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: current }
        }));
    }

    /* ── Toggle ─────────────────────────────────────────────────── */
    function toggle() { apply(current === DARK ? LIGHT : DARK); }

    /* ── Load from storage / OS preference ─────────────────────── */
    function load() {
        let saved = null;
        try { saved = localStorage.getItem(KEY); } catch (_) { }

        if (!saved) {
            saved = window.matchMedia('(prefers-color-scheme: light)').matches
                ? LIGHT : DARK;
        }
        apply(saved, false);
    }

    /* ── Button icons ───────────────────────────────────────────── */
    function _updateButtons() {
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.setAttribute('aria-label',
                current === DARK ? 'Switch to light mode' : 'Switch to dark mode');
            btn.innerHTML = current === DARK ? _sunSVG() : _moonSVG();
        });
    }

    /* Sun — shown in dark mode (click → go light) */
    function _sunSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>`;
    }

    /* Moon — shown in light mode (click → go dark) */
    function _moonSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>`;
    }

    /* ── Init ───────────────────────────────────────────────────── */
    function init() {
        load();

        /* Delegate all toggle clicks */
        document.addEventListener('click', e => {
            if (e.target.closest('[data-theme-toggle]')) toggle();
        });

        /* Cross-tab sync */
        window.addEventListener('storage', e => {
            if (e.key === KEY) apply(e.newValue || DARK, false);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { toggle, apply, getTheme: () => current };
})();

window.ThemeManager = ThemeManager;