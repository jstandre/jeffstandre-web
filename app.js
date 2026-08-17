/**
 * Jeff St. Andre - Personal Website & Engineering Notes
 * Clean, inviting, client-side router & dynamic Markdown renderer.
 */

const contentContainer = document.getElementById('content-container');
let postsIndexCache = null;

/**
 * Format ISO date string into human-friendly format (e.g., "Aug 16, 2026").
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Fetch and cache the posts manifest index.
 */
async function fetchIndex() {
  if (postsIndexCache) return postsIndexCache;
  try {
    const res = await fetch('posts/index.json');
    if (!res.ok) throw new Error('Failed to load posts index');
    postsIndexCache = await res.json();
    return postsIndexCache;
  } catch (err) {
    console.error('Error fetching post index:', err);
    return [];
  }
}

/**
 * Calculate approximate reading time for markdown content.
 */
function calculateReadTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Render the Writing / Articles section.
 */
async function renderWriting() {
  document.title = 'Writing - Jeff St. Andre';
  contentContainer.innerHTML = `
    <div class="stan-lee-quote-card">
      <blockquote class="stan-lee-quote">
        &ldquo;That person who helps others simply because it should or must be done, and because it is the right thing to do, is indeed without a doubt, a real superhero.&rdquo;
      </blockquote>
      <div class="stan-lee-meta">
        <img src="stan-lee.png" alt="Stan Lee" class="stan-lee-img" width="110" height="98">
        <div class="stan-lee-author">
          <span class="author-name">Stan Lee</span>
          <span class="author-sub">Marvel</span>
        </div>
      </div>
    </div>

    <div class="section-header">
      <h1 class="section-title">Writing &amp; Notes</h1>
      <p class="section-lead">Guides, architecture notes, and workflows from real-world engineering and personal projects.</p>
    </div>
    <div class="posts-list" id="posts-list">
      <div class="empty-state"><p>Loading articles...</p></div>
    </div>
  `;

  const posts = await fetchIndex();
  const listEl = document.getElementById('posts-list');

  if (!posts || posts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <strong>No articles published yet.</strong>
        <p>Check back soon for new writing and notes.</p>
      </div>
    `;
    return;
  }

  let html = '';
  posts.forEach(post => {
    html += `
      <article class="post-card" onclick="location.hash='#post/${encodeURIComponent(post.slug)}'" role="button" tabindex="0">
        <div class="post-meta-row">
          <time class="post-date" datetime="${post.date}">${formatDate(post.date)}</time>
          <span class="category-badge">${post.category || 'Engineering'}</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-summary">${post.summary}</p>
      </article>
    `;
  });

  listEl.innerHTML = html;

  // Keyboard navigation for post cards
  listEl.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/**
 * Render an individual article from a markdown file.
 */
async function renderPost(slug) {
  try {
    const posts = await fetchIndex();
    const postMeta = posts.find(p => p.slug === slug);

    const res = await fetch(`posts/${slug}.md`);
    if (!res.ok) throw new Error('Post not found');
    const rawMarkdown = await res.text();

    const readTime = calculateReadTime(rawMarkdown);
    const postTitle = postMeta ? postMeta.title : 'Article';
    const postDate = postMeta ? formatDate(postMeta.date) : '';
    const postCategory = postMeta ? postMeta.category : 'Research';

    document.title = `${postTitle} - Jeff St. Andre`;

    contentContainer.innerHTML = `
      <div class="article-container">
        <a href="#writing" class="back-btn">&larr; Back to Writing</a>
        <header class="article-header">
          <div class="post-meta-row">
            <time class="post-date">${postDate}</time>
            <span class="category-badge">${postCategory}</span>
            <span class="article-read-time">· ${readTime}</span>
          </div>
        </header>
        <article class="markdown-body">
          ${marked.parse(rawMarkdown)}
        </article>
      </div>
    `;

    // Syntax highlighting
    if (window.Prism) {
      Prism.highlightAll();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

  } catch (err) {
    console.error('Error rendering article:', err);
    document.title = 'Article Not Found - Jeff St. Andre';
    contentContainer.innerHTML = `
      <div class="article-container">
        <a href="#writing" class="back-btn">&larr; Back to Writing</a>
        <div class="empty-state">
          <h2>Article Not Found</h2>
          <p>The requested note or publication [${slug}] could not be found.</p>
        </div>
      </div>
    `;
  }
}

/**
 * Render the Projects & Utilities section.
 */
function renderProjects() {
  document.title = 'Projects - Jeff St. Andre';
  contentContainer.innerHTML = `
    <div class="section-header">
      <h1 class="section-title">Projects &amp; Tools</h1>
      <p class="section-lead">Open-source tools and utilities for local security auditing, privacy, and system administration.</p>
    </div>
    <div class="tool-grid">
      <div class="tool-card">
        <div>
          <div class="tool-header">
            <h2 class="tool-title">Mac Audit (audit_mac.py)</h2>
          </div>
          <p class="tool-desc">Lightweight, zero-dependency Python script to audit macOS baseline security settings (FileVault, Firewall, Gatekeeper, SIP, updates, and SSH) on Apple Silicon M1/M2/M3 Macs.</p>
          <div class="tool-tags">
            <span class="tool-tag">Python</span>
            <span class="tool-tag">macOS</span>
            <span class="tool-tag">Security</span>
            <span class="tool-tag">Apple Silicon</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
          <a href="#post/2026-08-16-macos-m1-baseline-security-auditor-python" class="tool-link">
            Read Guide &rarr;
          </a>
          <a href="https://github.com/jstandre" target="_blank" rel="noopener" class="tool-link">
            View on GitHub &rarr;
          </a>
        </div>
      </div>
    </div>
  `;
}

let slidesIndexCache = null;

/**
 * Fetch and cache the slides manifest index.
 */
async function fetchSlidesIndex() {
  if (slidesIndexCache) return slidesIndexCache;
  try {
    const res = await fetch('slides/index.json');
    if (!res.ok) throw new Error('Failed to load slides index');
    slidesIndexCache = await res.json();
    return slidesIndexCache;
  } catch (err) {
    console.error('Error fetching slides index:', err);
    return [];
  }
}

/**
 * Render the Slides & Presentations section.
 */
async function renderSlides() {
  document.title = 'Talks - Jeff St. Andre';
  contentContainer.innerHTML = `
    <div class="section-header">
      <h1 class="section-title">Talks &amp; Presentations</h1>
      <p class="section-lead">Slide decks and presentation materials from technical talks, summits, and workshops.</p>
    </div>
    <div class="slides-list" id="slides-list">
      <div class="empty-state"><p>Loading presentations...</p></div>
    </div>
  `;

  const slides = await fetchSlidesIndex();
  const listEl = document.getElementById('slides-list');

  if (!slides || slides.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <strong>No presentations found.</strong>
      </div>
    `;
    return;
  }

  let html = '';
  slides.forEach(slide => {
    html += `
      <div class="slide-card">
        <div class="slide-event">${slide.event}</div>
        <h2 class="slide-title">${slide.title}</h2>
        <p class="slide-desc">${slide.description}</p>
        <div class="slide-actions">
          <a href="${slide.url}" target="_blank" rel="noopener" class="slide-btn">
            View Google Slides Deck &rarr;
          </a>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

/**
 * Route handler based on window.location.hash.
 */
function route() {
  const hash = window.location.hash || '#writing';

  // Clear active states
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  if (hash.startsWith('#post/')) {
    const slug = hash.replace('#post/', '');
    document.querySelector('[data-nav="writing"]')?.classList.add('active');
    renderPost(slug);
  } else if (hash === '#projects' || hash === '#tools') {
    document.querySelector('[data-nav="projects"]')?.classList.add('active');
    renderProjects();
  } else if (hash === '#slides') {
    document.querySelector('[data-nav="slides"]')?.classList.add('active');
    renderSlides();
  } else {
    // Default to Writing
    document.querySelector('[data-nav="writing"]')?.classList.add('active');
    renderWriting();
  }
}

// Router Event Listeners
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  route();
});