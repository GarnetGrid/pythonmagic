/**
 * GarnetGrid — Anti-Copy Protection
 * Disables right-click context menu, text selection, and common copy shortcuts.
 * Deters casual copying; does NOT stop determined developers (nothing can).
 */
(function () {
    'use strict';

    // Disable right-click context menu
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    });

    // Disable text selection via CSS
    document.documentElement.style.userSelect = 'none';
    document.documentElement.style.webkitUserSelect = 'none';
    document.documentElement.style.msUserSelect = 'none';

    // Block common keyboard shortcuts for copying/saving
    document.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + U (View Source)
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            return false;
        }
        // Ctrl/Cmd + S (Save Page)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            return false;
        }
        // Ctrl/Cmd + Shift + I (DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }
        // Ctrl/Cmd + Shift + J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
        // Ctrl/Cmd + Shift + C (Inspect Element)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }
        // F12 (DevTools)
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        // Ctrl/Cmd + A (Select All)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            return false;
        }
        // Ctrl/Cmd + C (Copy)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            return false;
        }
    });

    // Disable drag on images
    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
        return false;
    });

    // Console warning
    console.log(
        '%c⚠️ This site is protected by GarnetGrid. Unauthorized copying or reproduction is prohibited.',
        'color: #e63946; font-size: 14px; font-weight: bold;'
    );
})();
