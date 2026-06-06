// Main app controller for tiinytools

// Registry of tools
const TOOLS_REGISTRY = {
    'percentage': {
        title: 'Percentage Calculator',
        description: 'Calculate percentage of a value, percentage difference, increases, and fraction conversions instantly as you type.',
        modulePath: './tools/percentage.js'
    },
    'pdf': {
        title: 'PDF Split & Join',
        description: 'Split pages from a PDF file, or merge multiple PDF documents together. Processes 100% locally in your browser.',
        modulePath: './tools/pdf.js'
    },
    'text': {
        title: 'Character Counter & Text Analyzer',
        description: 'Analyze text length in real-time. Count characters, words, sentences, paragraphs. Convert case and estimate reading times.',
        modulePath: './tools/text.js'
    },
    'pdftools': {
        title: 'PDF Compress & Convert',
        description: 'Compress PDFs locally in your browser, or convert PDFs to Word, PowerPoint, Excel and PNG via CloudConvert.',
        modulePath: './tools/pdftools.js'
    }
};

let currentActiveTool = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRouter();
    initSearch();
    initMobileNavigation();
    initGlowEffects();
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
        document.title = 'tiinytools | Premium Developer & Document Utilities';
    } else {
        // Load Selected Tool
        homeView.style.display = 'none';
        toolView.style.display = 'block';

        const toolMeta = TOOLS_REGISTRY[toolId];
        document.getElementById('toolTitle').textContent = toolMeta.title;
        document.getElementById('toolDescription').textContent = toolMeta.description;
        document.title = `${toolMeta.title} - tiinytools`;

        toolContainer.innerHTML = `
            <div class="tool-loader">
                <div class="spinner"></div>
                <p>Loading tool assets...</p>
            </div>
        `;

        try {
            // Lazy load the tool module
            const module = await import(toolMeta.modulePath);
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

    function filterTools(query) {
        const q = query.toLowerCase().trim();
        toolCards.forEach(card => {
            const title = card.querySelector('.tool-card-title').textContent.toLowerCase();
            const desc = card.querySelector('.tool-card-desc').textContent.toLowerCase();
            const tags = card.getAttribute('data-tags').toLowerCase();
            
            if (title.includes(q) || desc.includes(q) || tags.includes(q)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (sidebarSearch) {
        sidebarSearch.addEventListener('input', (e) => {
            // Sync with dashboard search input if on dashboard
            if (dashboardSearch) {
                dashboardSearch.value = e.target.value;
            }
            filterTools(e.target.value);
            
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
            filterTools(e.target.value);
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
