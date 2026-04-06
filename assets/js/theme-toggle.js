/**
 * Dark Mode Theme Toggle
 * Persists user preference in localStorage and respects system preference as fallback.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'theme-preference';
    var DARK = 'dark';
    var LIGHT = 'light';

    /**
     * Get the user's preferred theme.
     * Priority: localStorage > system preference > light
     */
    function getPreferredTheme() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        // Respect system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK;
        }
        return LIGHT;
    }

    /**
     * Apply theme to the document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateToggleIcon(theme);
    }

    /**
     * Update the toggle button icon
     */
    function updateToggleIcon(theme) {
        var btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        var iconSun = btn.querySelector('.icon-sun');
        var iconMoon = btn.querySelector('.icon-moon');
        if (iconSun && iconMoon) {
            if (theme === DARK) {
                iconSun.style.display = 'inline-block';
                iconMoon.style.display = 'none';
            } else {
                iconSun.style.display = 'none';
                iconMoon.style.display = 'inline-block';
            }
        }
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || LIGHT;
        var next = current === DARK ? LIGHT : DARK;
        applyTheme(next);
    }

    // Apply theme immediately to prevent flash
    applyTheme(getPreferredTheme());

    // Listen for system preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? DARK : LIGHT);
            }
        });
    }

    // Bind click handler when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            btn.addEventListener('click', toggleTheme);
            // Ensure icon is correct on load
            updateToggleIcon(getPreferredTheme());
        }
    });
})();
