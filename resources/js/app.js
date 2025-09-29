import './bootstrap';

// ============================================================================
// Theme Toggle Functionality
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');

    // Only initialize if theme toggle exists on the page
    if (!themeToggleBtn) return;

    // Get saved theme from localStorage or default to light
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Apply the current theme
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
            if (themeToggleDarkIcon) themeToggleDarkIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            if (themeToggleLightIcon) themeToggleLightIcon.classList.add('hidden');
            if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
        }
        localStorage.setItem('theme', theme);
    }

    // Apply current theme on page load
    applyTheme(currentTheme);

    // Toggle theme when button is clicked
    themeToggleBtn.addEventListener('click', function() {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function(e) {
        // Only apply system preference if no manual preference is set
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
});

// ============================================================================
// Mobile Navigation Menu Toggle
// ============================================================================
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
};

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;

    const button = event.target.closest('button');

    if (!menu.contains(event.target) && !button?.onclick?.toString().includes('toggleMobileMenu')) {
        menu.classList.add('hidden');
    }
});

// ============================================================================
// League Table Animations
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    let isAnimating = false;

    // Simple animation on Livewire updates
    document.addEventListener('livewire:updated', function() {
        if (!isAnimating) {
            isAnimating = true;
            const rows = document.querySelectorAll('.team-row');

            rows.forEach((row, index) => {
                row.style.opacity = '0';
                row.style.transform = 'translateY(10px)';

                setTimeout(() => {
                    row.style.transition = 'all 300ms ease-out';
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                }, index * 50);
            });

            setTimeout(() => {
                isAnimating = false;
            }, rows.length * 50 + 300);
        }
    });
});

// ============================================================================
// Auto-refresh for Live Matches
// ============================================================================
// Initialize auto-refresh based on data attributes
document.addEventListener('DOMContentLoaded', function() {
    const liveMatchContainer = document.querySelector('[data-auto-refresh]');

    if (liveMatchContainer) {
        const refreshInterval = parseInt(liveMatchContainer.getAttribute('data-auto-refresh')) || 30000;

        setInterval(function() {
            window.location.reload();
        }, refreshInterval);
    }
});
