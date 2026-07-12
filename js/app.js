// Main app controller for tinytools

// Registry of tools
const TOOLS_REGISTRY = {
    'percentage-calculator': {
        title: 'Percentage Calculator',
        description: 'Calculate percentage of a value, percentage difference, increases, and fraction conversions instantly as you type.',
        modulePath: './tools/percentage.js'
    },
    'pdf-split-join': {
        title: 'PDF Split & Join',
        description: 'Split pages from a PDF file, or merge multiple PDF documents together. Processes 100% locally in your browser.',
        modulePath: './tools/pdf.js'
    },
    'character-counter-text-analyzer': {
        title: 'Character Counter & Text Analyzer',
        description: 'Analyze text length in real-time. Count characters, words, sentences, paragraphs. Convert case and estimate reading times.',
        modulePath: './tools/text.js'
    },
    'pdf-compress-convert': {
        title: 'PDF Compress & Convert',
        description: 'Compress PDFs locally in your browser, or convert PDFs to Word, PowerPoint, Excel and PNG via CloudConvert.',
        modulePath: './tools/pdftools.js'
    },
    'url-http-status-checker': {
        title: 'URL HTTP Status Checker',
        description: 'Check the HTTP response status codes, redirect destinations, and response headers for multiple URLs in bulk.',
        modulePath: './tools/bulk-status.js'
    },
    'url-redirect-checker': {
        title: 'URL Redirect Checker',
        description: 'Track the complete path a URL takes, identifying redirect chains, intermediate URLs, status codes, and headers.',
        modulePath: './tools/redirect-checker.js'
    },
    'json-to-csv': {
        title: 'JSON to CSV Converter',
        description: 'Convert JSON objects or arrays into formatted CSV format. Upload files, paste text, or fetch from URL to download as CSV.',
        modulePath: './tools/json-to-csv.js'
    },
    'utm-build-verify': {
        title: 'UTM Build & Verify',
        description: 'Create or parse tagged URLs, verify required and optional campaign parameters, and preview GA4 channel classifications.',
        modulePath: './tools/utm-builder.js'
    },
    'csp-build-combine-verify': {
        title: 'CSP Build, Combine & Verify',
        description: 'Create Content Security Policies, combine multiple policies into one, or audit existing CSP headers and URLs for vulnerabilities.',
        modulePath: './tools/csp-tool.js'
    },
    'request-new-tool': {
        title: 'Request New Tool',
        description: 'Describe the tool you want to see added to tinytools.',
        modulePath: './tools/request-tool.js'
    }
};

let currentActiveTool = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRouter();
    initSearch();
    initMobileNavigation();
    initGlowEffects();
    initShareButtons();
});

// 1. Theme Management (Light / Dark mode)
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    const toggleBtnMobile = document.getElementById('themeToggleBtnMobile');

    [toggleBtn, toggleBtnMobile].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
            });
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Sync button icons
    const darkIcons = document.querySelectorAll('.dark-icon');
    const lightIcons = document.querySelectorAll('.light-icon');

    if (theme === 'dark') {
        darkIcons.forEach(icon => icon.style.display = 'inline-block');
        lightIcons.forEach(icon => icon.style.display = 'none');
    } else {
        darkIcons.forEach(icon => icon.style.display = 'none');
        lightIcons.forEach(icon => icon.style.display = 'inline-block');
    }
}

// 2. Routing System
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Call initial route

    // Back to dashboard button
    const backBtn = document.getElementById('backDashboardBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#home';
        });
    }
}

async function handleRoute() {
    const hash = window.location.hash || '#home';
    const toolId = hash.replace('#', '');

    // Cleanup previous tool if any
    if (currentActiveTool && typeof currentActiveTool.destroy === 'function') {
        try {
            currentActiveTool.destroy();
        } catch (e) {
            console.error('Error destroying previous tool:', e);
        }
        currentActiveTool = null;
    }

    // Hide all views first
    const homeView = document.getElementById('home-view');
    const toolView = document.getElementById('tool-view');
    const toolContainer = document.getElementById('toolContainer');

    // Update active nav class
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeNav = document.getElementById(`nav-${toolId}`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    if (toolId === 'home' || !TOOLS_REGISTRY[toolId]) {
        // Show Home Dashboard
        toolView.style.display = 'none';
        homeView.style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
        document.title = 'tinytools | Fast, lightweight utilities';
    } else {
        // Load Selected Tool
        homeView.style.display = 'none';
        toolView.style.display = 'block';

        const toolMeta = TOOLS_REGISTRY[toolId];
        document.getElementById('toolTitle').textContent = toolMeta.title;
        document.getElementById('toolDescription').textContent = toolMeta.description;
        document.title = `${toolMeta.title} - tinytools`;

        toolContainer.innerHTML = `
            <div class="tool-loader">
                <div class="spinner"></div>
                <p>Loading tool assets...</p>
            </div>
        `;

        try {
            // Lazy load the tool module (with cache buster)
            const module = await import(`${toolMeta.modulePath}?v=${Date.now()}`);
            toolContainer.innerHTML = ''; // Clear loader
            
            // Render the tool
            currentActiveTool = module.default;
            currentActiveTool.render(toolContainer);
        } catch (error) {
            console.error(`Failed to load tool: ${toolId}`, error);
            toolContainer.innerHTML = `
                <div class="card-premium error-card" style="border-color: var(--danger);">
                    <h3 style="color: var(--danger); margin-bottom: 8px;">Failed to Load Tool</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">
                        There was an error dynamically importing the tool module. This may be due to missing files or a network issue.
                    </p>
                    <button class="btn-primary" onclick="window.location.reload()">Retry Loading</button>
                </div>
            `;
        }
    }

    // Auto-scroll to top of page on route change
    document.querySelector('.app-main').scrollTop = 0;

    // Close mobile drawer if open
    document.getElementById('appSidebar').classList.remove('open');
}
// 3. Search and Filtering System
function initSearch() {
    const sidebarSearch = document.getElementById('toolSearchInput');
    const dashboardSearch = document.getElementById('dashboardSearchInput');
    const toolCards = document.querySelectorAll('.tool-card');
    let activeFilterTag = 'all';

    function initFilterTags() {
        const filterContainer = document.getElementById('tagsFilterContainer');
        if (!filterContainer) return;

        const counts = {};
        toolCards.forEach(card => {
            const badge = card.querySelector('.tool-badge');
            if (badge) {
                const tag = badge.textContent.replace(/[[\]]/g, '').trim().toUpperCase();
                counts[tag] = (counts[tag] || 0) + 1;
            }
        });

        // Sort tags: descending count, then alphabetical
        const sortedTags = Object.keys(counts).sort((a, b) => {
            if (counts[b] !== counts[a]) {
                return counts[b] - counts[a];
            }
            return a.localeCompare(b);
        });

        let html = `<button class="filter-tag-btn active" data-filter="all">ALL</button>`;
        sortedTags.forEach(tag => {
            html += `<button class="filter-tag-btn" data-filter="${tag.toLowerCase()}">${tag}</button>`;
        });

        filterContainer.innerHTML = html;
    }

    initFilterTags();

    function applyFilters() {
        const query = (dashboardSearch?.value || sidebarSearch?.value || '').toLowerCase().trim();
        const tag = activeFilterTag.toLowerCase();

        toolCards.forEach(card => {
            const title = card.querySelector('.tool-card-title').textContent.toLowerCase();
            const desc = card.querySelector('.tool-card-desc').textContent.toLowerCase();
            const tags = card.getAttribute('data-tags').toLowerCase();
            
            // Extract badge text safely, removing any brackets if they exist
            const badgeText = card.querySelector('.tool-badge').textContent.toLowerCase().replace(/[[\]]/g, '').trim();

            const matchesSearch = !query || title.includes(query) || desc.includes(query) || tags.includes(query);
            const matchesTag = tag === 'all' || badgeText === tag;

            if (matchesSearch && matchesTag) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Initialize tag filters
    const tagButtons = document.querySelectorAll('.filter-tag-btn');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tagButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilterTag = btn.getAttribute('data-filter');
            applyFilters();
        });
    });

    if (sidebarSearch) {
        sidebarSearch.addEventListener('input', (e) => {
            // Sync with dashboard search input if on dashboard
            if (dashboardSearch) {
                dashboardSearch.value = e.target.value;
            }
            applyFilters();
            
            // If user searches from a tool view, redirect to home to show results
            if (window.location.hash !== '#home' && window.location.hash !== '') {
                window.location.hash = '#home';
            }
        });
    }

    if (dashboardSearch) {
        dashboardSearch.addEventListener('input', (e) => {
            if (sidebarSearch) {
                sidebarSearch.value = e.target.value;
            }
            applyFilters();
        });
    }
}
// 4. Mobile Drawer Controller
function initMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const sidebar = document.getElementById('appSidebar');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (mobileCloseBtn && sidebar) {
        mobileCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Click outside sidebar to close on mobile
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// 5. Card Hover Glow Effect (CSS Variables injection)
function initGlowEffects() {
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// 6. Share link buttons next to titles
function initShareButtons() {
    const copyAllBtn = document.getElementById('copyAllToolsLinkBtn');
    const copyToolBtn = document.getElementById('copyToolLinkBtn');

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
            const shareUrl = window.location.origin + window.location.pathname;
            navigator.clipboard.writeText(shareUrl).then(() => {
                copyAllBtn.classList.add('copied');
                setTimeout(() => {
                    copyAllBtn.classList.remove('copied');
                }, 1500);
            });
        });
    }

    if (copyToolBtn) {
        copyToolBtn.addEventListener('click', () => {
            const shareUrl = window.location.href;
            navigator.clipboard.writeText(shareUrl).then(() => {
                copyToolBtn.classList.add('copied');
                setTimeout(() => {
                    copyToolBtn.classList.remove('copied');
                }, 1500);
            });
        });
    }
}

// Global Enter key handling for input fields (excluding textareas)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    // Find the nearest button within the same form group or container
    const btn = e.target.closest('.csp-form-group, .bulk-options-panel, .tool-card')?.querySelector('button');
    if (btn) {
      btn.click();
      e.preventDefault();
    }
  }
});
