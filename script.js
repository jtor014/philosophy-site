/* ============================================
   The Eternal Argument — Shared Utilities
   ============================================ */

// Cache for loaded data
let _data = null;

// Era folder mapping
const ERA_FOLDERS = {
    1: 'Era I - Foundations',
    2: 'Era II - Architects of Modernity',
    3: 'Era III - 19th Century Explosion',
    4: 'Era IV - The Great Split',
    5: 'Era V - Post-War & Post-Modern',
    6: 'Era VI - Contemporary Explosion',
    7: 'Era VII - The Now & The Future'
};

/**
 * Load and cache the episodes data
 */
async function loadData() {
    if (_data) return _data;
    const resp = await fetch('data/episodes.json');
    if (!resp.ok) throw new Error('Failed to load episode data');
    _data = await resp.json();
    return _data;
}

/**
 * Get URL query parameter
 */
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

/**
 * Get an era by ID
 */
function getEra(data, id) {
    return data.eras.find(e => e.id === id);
}

/**
 * Get an episode by ID
 */
function getEpisode(data, id) {
    return data.episodes.find(e => e.id === id);
}

// ---- Progress Bar ----
function initProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    document.body.prepend(bar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        if (docHeight > 0) {
            bar.style.width = (scrollTop / docHeight) * 100 + '%';
        }
    }, { passive: true });
}

// ---- Top Bar (scroll-reveal) ----
function initTopBar() {
    const topBar = document.querySelector('.top-bar');
    if (!topBar) return;

    const threshold = 100;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        if (scrollTop > threshold) {
            topBar.classList.add('visible');
        } else {
            topBar.classList.remove('visible');
        }
    }, { passive: true });
}

// ---- Search ----
function initSearch(data) {
    const input = document.querySelector('.search-input');
    const results = document.querySelector('.search-results');
    if (!input || !results) return;

    let debounceTimer;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            if (query.length < 2) {
                results.classList.remove('active');
                results.innerHTML = '';
                return;
            }

            const matches = data.episodes.filter(ep => {
                const searchable = [
                    ep.title,
                    ep.focus,
                    ep.context,
                    ep.keyConcept || '',
                    ep.keyConflict || ''
                ].join(' ').toLowerCase();
                return searchable.includes(query);
            }).slice(0, 10);

            if (matches.length === 0) {
                results.innerHTML = '<div class="search-result-item"><div class="ep-focus">No results found</div></div>';
                results.classList.add('active');
                return;
            }

            results.innerHTML = matches.map(ep => `
                <div class="search-result-item" data-ep="${ep.id}">
                    <div class="ep-number">Episode ${ep.id}</div>
                    <div class="ep-title">${highlightMatch(ep.title, query)}</div>
                    <div class="ep-focus">${highlightMatch(ep.focus, query)}</div>
                </div>
            `).join('');

            results.querySelectorAll('.search-result-item[data-ep]').forEach(item => {
                item.addEventListener('click', () => {
                    window.location.href = `episode.html?ep=${item.dataset.ep}`;
                });
            });

            results.classList.add('active');
        }, 200);
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            results.classList.remove('active');
        }
    });

    // Close on Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            results.classList.remove('active');
            input.blur();
        }
    });
}

function highlightMatch(text, query) {
    if (!text) return '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:rgba(212,168,67,0.3);color:inherit;padding:0 1px;border-radius:2px;">$1</mark>');
}

// ---- Intersection Observer for fade-in elements ----
function initFadeObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    document.querySelectorAll('.fade-in, .era-card').forEach(el => {
        observer.observe(el);
    });
}

// ---- Landing Page: Render Eras ----
function renderEraTimeline(data) {
    const container = document.getElementById('era-timeline');
    if (!container) return;

    container.innerHTML = data.eras.map(era => {
        const epCount = era.episodeRange[1] - era.episodeRange[0] + 1;
        return `
            <a href="era.html?era=${era.id}" class="era-card" data-era="${era.id}">
                <div class="era-number">Era ${era.number}</div>
                <div class="era-title">${era.title}</div>
                <div class="era-subtitle">${era.subtitle}</div>
                <div class="era-desc">${era.description}</div>
                <div class="era-meta"><span>${epCount} episodes</span> &middot; Ep ${era.episodeRange[0]}&ndash;${era.episodeRange[1]}</div>
            </a>
        `;
    }).join('');
}

// ---- Era Page: Render Sections + Episodes ----
function renderEraPage(data, eraId) {
    const era = getEra(data, eraId);
    if (!era) {
        document.getElementById('era-content').innerHTML = `
            <div class="error-state">
                <h1>Era not found</h1>
                <p>The requested era does not exist.</p>
                <a href="index.html">Back to all eras</a>
            </div>
        `;
        return;
    }

    // Set accent color
    document.documentElement.style.setProperty('--current-era-color', era.color);

    // Header
    const header = document.getElementById('era-header');
    header.innerHTML = `
        <a href="index.html" class="back-link">&larr; All Eras</a>
        <div class="era-number-large">Era ${era.number}</div>
        <h1>${era.title}</h1>
        <div class="era-period">${era.subtitle}</div>
        <div class="era-description">${era.description}</div>
    `;

    // Sections
    const sectionsContainer = document.getElementById('sections-container');
    sectionsContainer.innerHTML = era.sections.map(section => {
        const episodes = section.episodes.map(epId => getEpisode(data, epId)).filter(Boolean);
        return `
            <div class="section-group fade-in">
                <div class="section-group-header">
                    <h2>${section.title}</h2>
                    ${section.subtitle ? `<div class="section-subtitle">${section.subtitle}</div>` : ''}
                </div>
                <div class="episode-list">
                    ${episodes.map(ep => `
                        <a href="episode.html?ep=${ep.id}" class="episode-card">
                            <div class="ep-num">${ep.id}</div>
                            <div class="ep-info">
                                <div class="ep-title">${ep.title}</div>
                                <div class="ep-focus">${ep.focus}</div>
                                ${ep.keyConcept ? `<div class="ep-concept">${ep.keyConcept}</div>` : ''}
                                ${ep.keyConflict ? `<div class="ep-concept">${ep.keyConflict}</div>` : ''}
                            </div>
                            ${ep.audioFile ? '<div class="ep-badge" title="Audio available">&#9654;</div>' : '<div class="ep-soon">Soon</div>'}
                            <div class="ep-arrow">&rsaquo;</div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Nav footer (prev/next era)
    const navFooter = document.getElementById('era-nav');
    const prevEra = getEra(data, eraId - 1);
    const nextEra = getEra(data, eraId + 1);

    let navHTML = '';
    if (prevEra) {
        navHTML += `
            <a href="era.html?era=${prevEra.id}" class="nav-btn prev">
                <span class="nav-label">&larr; Previous Era</span>
                <span class="nav-title">Era ${prevEra.number}: ${prevEra.title}</span>
            </a>
        `;
    }
    if (nextEra) {
        navHTML += `
            <a href="era.html?era=${nextEra.id}" class="nav-btn next">
                <span class="nav-label">Next Era &rarr;</span>
                <span class="nav-title">Era ${nextEra.number}: ${nextEra.title}</span>
            </a>
        `;
    }
    navFooter.innerHTML = navHTML;

    // Update page title
    document.title = `Era ${era.number}: ${era.title} — The Eternal Argument`;
}

// ---- Episode Page: Render Episode ----
function renderEpisodePage(data, epId) {
    const ep = getEpisode(data, epId);
    if (!ep) {
        document.getElementById('episode-content').innerHTML = `
            <div class="error-state">
                <h1>Episode not found</h1>
                <p>The requested episode does not exist.</p>
                <a href="index.html">Back to all eras</a>
            </div>
        `;
        return;
    }

    const era = getEra(data, ep.era);

    // Set accent color
    if (era) {
        document.documentElement.style.setProperty('--current-era-color', era.color);
    }

    // Header
    const prevEp = getEpisode(data, epId - 1);
    const nextEp = getEpisode(data, epId + 1);

    const header = document.getElementById('episode-header');
    header.innerHTML = `
        <div class="breadcrumb">
            <a href="index.html">Home</a>
            <span class="separator">/</span>
            <a href="era.html?era=${ep.era}">Era ${era ? era.number : ep.era}: ${era ? era.title : ''}</a>
            <span class="separator">/</span>
            <span>Episode ${ep.id}</span>
        </div>
        <div class="ep-label">Episode ${ep.id}</div>
        <div class="title-nav-row">
            ${prevEp ? `<a href="episode.html?ep=${prevEp.id}" class="title-nav-link prev" title="Ep ${prevEp.id}: ${prevEp.title}">&lsaquo;</a>` : '<span></span>'}
            <h1>${ep.title}</h1>
            ${nextEp ? `<a href="episode.html?ep=${nextEp.id}" class="title-nav-link next" title="Ep ${nextEp.id}: ${nextEp.title}">&rsaquo;</a>` : '<span></span>'}
        </div>
        <div class="ep-focus-line">${ep.focus}</div>
    `;

    // Body
    const body = document.getElementById('episode-body');
    let bodyHTML = '';

    // Context
    bodyHTML += `
        <div class="episode-section">
            <h2>Historical Context</h2>
            <p>${ep.context}</p>
        </div>
    `;

    // Key Conflict or Concept
    if (ep.keyConflict) {
        bodyHTML += `
            <div class="episode-section">
                <div class="highlight-box">
                    <div class="label">Key Conflict</div>
                    <div class="value">${ep.keyConflict}</div>
                </div>
            </div>
        `;
    }

    if (ep.keyConcept) {
        bodyHTML += `
            <div class="episode-section">
                <div class="highlight-box">
                    <div class="label">Key Concept</div>
                    <div class="value">${ep.keyConcept}</div>
                </div>
            </div>
        `;
    }

    // Audio
    const eraFolder = ERA_FOLDERS[ep.era];
    if (ep.audioFile && eraFolder) {
        bodyHTML += `
            <div class="audio-section">
                <h2>Listen</h2>
                <audio controls preload="metadata">
                    <source src="audio/${eraFolder}/${ep.audioFile}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    } else {
        bodyHTML += `
            <div class="audio-section">
                <h2>Listen</h2>
                <div class="audio-coming-soon">Audio coming soon</div>
            </div>
        `;
    }

    // Transcript placeholder
    bodyHTML += `<div id="transcript-container"></div>`;

    body.innerHTML = bodyHTML;

    // Load transcript
    loadTranscript(epId);

    // Navigation
    const navFooter = document.getElementById('episode-nav');

    let navHTML = '';
    if (prevEp) {
        navHTML += `
            <a href="episode.html?ep=${prevEp.id}" class="nav-btn prev">
                <span class="nav-label">&larr; Previous</span>
                <span class="nav-title">Ep ${prevEp.id}: ${prevEp.title}</span>
            </a>
        `;
    }
    if (nextEp) {
        navHTML += `
            <a href="episode.html?ep=${nextEp.id}" class="nav-btn next">
                <span class="nav-label">Next &rarr;</span>
                <span class="nav-title">Ep ${nextEp.id}: ${nextEp.title}</span>
            </a>
        `;
    }
    navFooter.innerHTML = navHTML;

    // Update page title
    document.title = `Ep ${ep.id}: ${ep.title} — The Eternal Argument`;
}

// ---- Transcript Loader ----
async function loadTranscript(epId) {
    const container = document.getElementById('transcript-container');
    if (!container) return;

    const data = await loadData();
    const ep = getEpisode(data, epId);
    if (!ep) return;
    const folder = ERA_FOLDERS[ep.era];
    const file = `transcripts/${folder}/ep${String(epId).padStart(3, '0')}.md`;
    try {
        const resp = await fetch(file);
        if (!resp.ok) return; // No transcript yet, show nothing
        const text = await resp.text();
        if (!text.trim()) return;

        const html = typeof marked !== 'undefined' ? marked.parse(text) : `<pre>${text}</pre>`;
        container.innerHTML = `
            <div class="episode-section transcript-section">
                <button class="transcript-toggle" aria-expanded="false">
                    <h2>Transcript</h2>
                    <span class="toggle-icon">&rsaquo;</span>
                </button>
                <div class="transcript-content collapsed">${html}</div>
            </div>
        `;
        container.querySelector('.transcript-toggle').addEventListener('click', () => {
            const btn = container.querySelector('.transcript-toggle');
            const content = container.querySelector('.transcript-content');
            const isCollapsed = content.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', !isCollapsed);
        });
    } catch (e) {
        // No transcript available, fail silently
    }
}

// ---- Init on DOMContentLoaded ----
document.addEventListener('DOMContentLoaded', async () => {
    initProgressBar();
    initTopBar();

    try {
        const data = await loadData();
        initSearch(data);

        // Determine which page we're on
        const page = document.body.dataset.page;

        if (page === 'landing') {
            renderEraTimeline(data);
            // Delay observer to let DOM render
            requestAnimationFrame(() => initFadeObserver());
        } else if (page === 'era') {
            const eraId = parseInt(getParam('era'), 10);
            if (eraId) {
                renderEraPage(data, eraId);
                requestAnimationFrame(() => initFadeObserver());
            }
        } else if (page === 'episode') {
            const epId = parseInt(getParam('ep'), 10);
            if (epId) {
                renderEpisodePage(data, epId);
            }
        }
    } catch (err) {
        console.error('Failed to initialize:', err);
    }
});
