(() => {
  const owner = 'simplehuman1988';
  const repo = 'wecoden-new';
  const tokenKey = 'wecoden-blog-editor-token';
  const draftsKey = 'wecoden-blog-editor-drafts';
  const apiRoot = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  const $ = (id) => document.getElementById(id);
  const form = $('post-form');
  const token = () => localStorage.getItem(tokenKey);
  let currentPosts = [];
  let existingCover = '';

  const today = new Date();
  $('date').value = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function message(text, isError = false) {
    const el = $('form-message');
    el.textContent = text;
    el.classList.toggle('error', isError);
  }

  async function github(path, options = {}) {
    const response = await fetch(apiRoot + path, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token()}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `GitHub returned ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function githubApi(path, options = {}) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token()}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `GitHub returned ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function decodeBase64(text) {
    const binary = atob(text.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function inlineMarkdown(value) {
    let text = escapeHtml(value);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, rawUrl) => {
      const url = rawUrl.trim();
      if (!/^(https?:\/\/|mailto:|\/|#)/i.test(url)) return label;
      return `<a href="${escapeHtml(url)}">${label}</a>`;
    });
  }

  function renderMarkdown(markdown) {
    const chunks = [];
    let paragraph = [];
    let listItems = [];
    let listType = '';
    let codeLines = null;
    const flushParagraph = () => {
      if (paragraph.length) chunks.push(`<p>${paragraph.map((line) => inlineMarkdown(line.trim())).join(' ')}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (listItems.length) chunks.push(`<${listType}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${listType}>`);
      listItems = [];
      listType = '';
    };
    for (const line of String(markdown || '').replace(/\r\n/g, '\n').split('\n')) {
      if (line.startsWith('```')) {
        flushParagraph(); flushList();
        if (codeLines === null) codeLines = [];
        else { chunks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`); codeLines = null; }
        continue;
      }
      if (codeLines !== null) { codeLines.push(line); continue; }
      if (!line.trim()) { flushParagraph(); flushList(); continue; }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) { flushParagraph(); flushList(); const level = heading[1].length + 1; chunks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
      const item = line.match(/^\s*(?:[-*]\s+|(\d+)\.\s+)(.+)$/);
      if (item) {
        flushParagraph();
        const nextType = item[1] ? 'ol' : 'ul';
        if (listType && listType !== nextType) flushList();
        listType = nextType; listItems.push(item[2]); continue;
      }
      flushList(); paragraph.push(line);
    }
    flushParagraph(); flushList();
    if (codeLines !== null) chunks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    return chunks.join('\n');
  }

  function formatDate(value) {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value || '';
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  }

  function buildArticlePage(post) {
    const title = escapeHtml(post.title);
    const summary = escapeHtml(post.summary);
    const category = escapeHtml(post.category || 'Wecoden Journal');
    const author = escapeHtml(post.author || 'Wecoden');
    const dateLabel = formatDate(post.date);
    const readTime = Math.max(1, Math.round((post.body || '').trim().split(/\s+/).filter(Boolean).length / 200));
    const cover = post.coverImage ? `<img class="journal-cover-image" src="../${escapeHtml(post.coverImage)}" alt="">` : '';
    return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — WECODEN Journal</title><meta name="description" content="${summary}">
  <link rel="stylesheet" href="../css/styles.css">
</head><body><div class="site-wrapper">
  <header class="site-header"><div class="nav-inner">
    <a href="../index.html" class="brand-logo" aria-label="Wecoden Home"><img class="brand-mark" src="../assets/wecoden-logo.png" alt="Wecoden"></a>
    <nav class="nav-links" aria-label="Primary Navigation"><a href="../brand-and-technical-marketers.html" class="nav-link">Brand &amp; Technical Marketers</a><a href="../services.html" class="nav-link">Services</a><a href="../about-us.html" class="nav-link">About</a><a href="../blog.html" class="nav-link active">Journal</a><a href="../contact-us.html" class="nav-link">Contact</a></nav>
    <div class="nav-actions"><a href="../contact-us.html" class="btn btn-primary">Book a Consultation</a><button class="mobile-menu-btn" aria-label="Toggle Menu"><span></span><span></span></button></div>
  </div></header>
  <div class="mobile-drawer"><div class="mobile-nav-list"><div class="mobile-nav-item"><a href="../brand-and-technical-marketers.html"><span>Brand &amp; Technical Marketers</span><span>↗</span></a></div><div class="mobile-nav-item"><a href="../services.html"><span>All Services</span><span>↗</span></a></div><div class="mobile-nav-item"><a href="../about-us.html"><span>About Wecoden</span><span>↗</span></a></div><div class="mobile-nav-item"><a href="../blog.html"><span>Journal &amp; Insights</span><span>↗</span></a></div><div class="mobile-nav-item"><a href="../contact-us.html"><span>Contact Us</span><span>↗</span></a></div></div></div>
  <main><section class="page-hero"><div class="container"><div class="page-hero-top"><a href="../blog.html" class="back-link">← Journal</a><span class="eyebrow">${category} · ${readTime} Min Read</span></div>
    <h1 class="h-hero" data-blur style="max-width:1060px;font-size:clamp(38px,5vw,72px);">${title}</h1><div class="page-hero-bottom"><p class="lead" style="max-width:680px;color:var(--text-primary);">${summary}</p><span class="eyebrow eyebrow-dark">By ${author} · ${escapeHtml(dateLabel)}</span></div>${cover}
  </div></section>
  <article class="article-container article-prose border-b">${renderMarkdown(post.body)}<div class="journal-article-end"><div><span class="eyebrow">More from Wecoden</span><a href="../blog.html">← Back to the Journal</a></div><a href="../contact-us.html" class="btn btn-primary">Talk to Our Team</a></div></article>
  <section class="prefooter-section"><div class="container"><div class="prefooter-grid"><div class="prefooter-left"><span class="eyebrow eyebrow-dark">Wecoden · Technical Marketers &amp; Managed IT</span><h2 class="h-section">Let’s put the value of your technology in the spotlight.</h2><p class="lead">Whether you need authoritative B2B technical content or managed infrastructure, our team is ready to help.</p></div><div class="prefooter-right"><div class="prefooter-meta-block"><span class="eyebrow">EMAIL</span><a href="mailto:hello@wecoden.com">hello@wecoden.com</a></div><a href="../contact-us.html" class="btn btn-primary btn-full">Start a Conversation</a></div></div></div></section>
  </main><footer class="site-footer"><div class="container"><div class="footer-wordmark-wrap"><div class="footer-wordmark"><img src="../assets/wecoden-logo.png" alt="Wecoden"></div></div><div class="footer-bottom-bar"><span>© 2026 WECODEN. All rights reserved.</span><a href="../blog.html">All Journal Articles</a></div></div></footer>
</div><script src="../js/main.js"></script></body></html>`;
  }

  async function commitFiles(changes) {
    const [ref,] = await Promise.all([githubApi('git/ref/heads/main')]);
    const parentSha = ref.object.sha;
    const parentCommit = await githubApi(`git/commits/${parentSha}`);
    const entries = await Promise.all(changes.map(async (change) => {
      if (change.delete) return { path: change.path, mode: '100644', type: 'blob', sha: null };
      const blob = await githubApi('git/blobs', {
        method: 'POST',
        body: JSON.stringify(change.base64
          ? { content: change.base64, encoding: 'base64' }
          : { content: change.content, encoding: 'utf-8' }),
      });
      return { path: change.path, mode: '100644', type: 'blob', sha: blob.sha };
    }));
    const tree = await githubApi('git/trees', { method: 'POST', body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: entries }) });
    const commit = await githubApi('git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: 'Publish Wecoden journal update', tree: tree.sha, parents: [parentSha] }),
    });
    await githubApi('git/refs/heads/main', { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    return commit.sha;
  }

  function publishedPosts(posts) {
    return posts.filter((post) => post.status === 'published').map((post) => ({
      ...post,
      readTime: Math.max(1, Math.round((post.body || '').trim().split(/\s+/).filter(Boolean).length / 200)),
      dateLabel: formatDate(post.date),
    })).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.title || '').localeCompare(b.title || ''));
  }

  function listingPosts(posts) {
    return posts.map(({ body, ...post }) => post);
  }

  function updateConnection(connected) {
    $('connect-button').classList.toggle('hidden', connected);
    $('disconnect-button').classList.toggle('hidden', !connected);
    $('setup-note').classList.toggle('hidden', connected);
    $('connection-status').textContent = connected
      ? 'Connected. Published posts are saved to the website; drafts stay in this browser.'
      : 'Connect once with the site owner’s publishing token. It stays in this browser only.';
    if (connected) loadPosts();
  }

  function readLocalDrafts() {
    try { return JSON.parse(localStorage.getItem(draftsKey) || '{}'); }
    catch { return {}; }
  }

  async function loadPosts() {
    $('post-list-hint').textContent = 'Loading posts…';
    $('post-list').replaceChildren();
    let savedPosts = [];
    try {
      const files = await github('content/blog-posts');
      const sources = Array.isArray(files) ? files.filter((file) => file.name.endsWith('.json')) : [];
      savedPosts = await Promise.all(sources.map(async (file) => {
        const entry = await github(`content/blog-posts/${encodeURIComponent(file.name)}`);
        return JSON.parse(decodeBase64(entry.content));
      }));
    } catch (error) {
      if (error.status === 404) {
        savedPosts = [];
      } else {
        $('post-list-hint').textContent = `Could not load posts: ${error.message}`;
        return;
      }
    }
    const localDrafts = readLocalDrafts();
    currentPosts = savedPosts.map((post) => localDrafts[post.slug]
      ? { ...localDrafts[post.slug], _localDraft: true, _wasPublished: true }
      : post);
    Object.values(localDrafts).forEach((post) => {
      if (!currentPosts.some((saved) => saved.slug === post.slug)) {
        currentPosts.push({ ...post, _localDraft: true, _wasPublished: false });
      }
    });
    currentPosts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    $('post-list-hint').textContent = currentPosts.length ? '' : 'No posts yet. Start with “Write a new post”.';
    currentPosts.forEach((post) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'post-entry';
      button.dataset.slug = post.slug;
      const title = document.createElement('strong');
      title.textContent = post.title || 'Untitled post';
      const meta = document.createElement('span');
      meta.textContent = `${post._localDraft ? 'Draft · This browser' : 'Published'} · ${post.date || 'No date'}`;
      button.append(title, meta);
      button.addEventListener('click', () => openPost(post));
      $('post-list').append(button);
    });
  }

  function clearForm() {
    form.reset();
    $('date').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    $('author').value = 'Wecoden Technical Research Team';
    $('original-slug').value = '';
    $('slug').disabled = false;
    $('form-heading').textContent = 'Create a post';
    $('save-state').textContent = 'Not published';
    $('delete-post').classList.add('hidden');
    $('cover-preview').classList.add('hidden');
    $('cover-preview').replaceChildren();
    $('summary-count').textContent = '0';
    existingCover = '';
    message('');
    $('post-list').querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
  }

  function openPost(post) {
    clearForm();
    $('title').value = post.title || '';
    $('slug').value = post.slug || '';
    $('slug').disabled = true;
    $('original-slug').value = post.slug || '';
    $('category').value = post.category || '';
    $('summary').value = post.summary || '';
    $('summary-count').textContent = String((post.summary || '').length);
    $('author').value = post.author || '';
    $('date').value = post.date || '';
    $('body').value = post.body || '';
    $('form-heading').textContent = 'Edit post';
    $('save-state').textContent = post.status === 'published' ? 'Published' : 'Draft';
    $('delete-post').classList.remove('hidden');
    existingCover = post.coverImage || '';
    if (existingCover) {
      const image = document.createElement('img');
      image.src = `../${existingCover}`;
      image.alt = 'Current cover image';
      $('cover-preview').replaceChildren(image);
      $('cover-preview').classList.remove('hidden');
    }
    $('post-list').querySelectorAll('.post-entry').forEach((el) => el.classList.toggle('selected', el.dataset.slug === post.slug));
    message('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function slugify(value) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('The cover image could not be read.'));
      reader.readAsDataURL(file);
    });
  }

  async function savePost(status) {
    if (!token()) throw new Error('Connect the editor before saving.');
    const slug = $('slug').value.trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use lowercase letters, numbers, and hyphens for the page address.');
    if (!$('original-slug').value && currentPosts.some((post) => post.slug === slug)) throw new Error('That page address is already in use. Change the title to create a unique address.');
    if (!$('title').value.trim() || !$('summary').value.trim() || !$('body').value.trim()) {
      throw new Error('Add a title, short introduction, and article before saving.');
    }
    if (!$('date').value) throw new Error('Choose a publish date before saving.');
    const file = $('cover').files[0];
    if (file && file.size > 5 * 1024 * 1024) throw new Error('Choose a cover image smaller than 5 MB.');
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP cover image.');

    let coverImage = existingCover;
    let coverUpload = null;
    if (file && status === 'published') {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const imagePath = `assets/blog/${slug}.${extension}`;
      coverUpload = { path: imagePath, base64: await readFileAsBase64(file) };
      coverImage = imagePath;
    }

    const post = {
      slug,
      title: $('title').value.trim(),
      summary: $('summary').value.trim(),
      category: $('category').value.trim() || 'Wecoden Journal',
      author: $('author').value.trim() || 'Wecoden',
      date: $('date').value,
      body: $('body').value.trim(),
      coverImage,
      status,
    };
    if (status === 'draft') {
      const drafts = readLocalDrafts();
      const previousPost = currentPosts.find((item) => item.slug === slug);
      drafts[slug] = { ...post, _wasPublished: Boolean(previousPost?.status === 'published' || previousPost?._wasPublished) };
      localStorage.setItem(draftsKey, JSON.stringify(drafts));
      $('original-slug').value = slug;
      $('form-heading').textContent = 'Edit draft';
      $('slug').disabled = true;
      $('save-state').textContent = 'Draft · This browser';
      $('delete-post').classList.remove('hidden');
      message(file
        ? 'Draft saved in this browser. The selected cover image will upload when you publish; select it again if you close this page.'
        : 'Draft saved in this browser. It is not in the public site; choose Publish when it is ready.');
      await loadPosts();
      return;
    }
    const clean = (item) => ({
      slug: item.slug, title: item.title, summary: item.summary,
      category: item.category || 'Wecoden Journal', author: item.author || 'Wecoden',
      date: item.date, body: item.body, coverImage: item.coverImage || '', status: item.status || 'draft',
    });
    const allPosts = currentPosts.filter((item) => item.slug !== slug).map(clean).concat(clean(post));
    const visiblePosts = publishedPosts(allPosts);
    const previouslyPublished = currentPosts.some((item) => item.slug === slug && (item.status === 'published' || item._wasPublished));
    const changes = [
      { path: `content/blog-posts/${slug}.json`, content: JSON.stringify(post, null, 2) + '\n' },
      { path: 'blog-posts/index.json', content: JSON.stringify(listingPosts(visiblePosts), null, 2) + '\n' },
      { path: 'blog-posts/generated-posts.json', content: JSON.stringify(visiblePosts.map((item) => `${item.slug}.html`), null, 2) + '\n' },
      ...(status === 'published' ? [{ path: `blog-posts/${slug}.html`, content: buildArticlePage(post) }] : []),
      ...(status !== 'published' && previouslyPublished ? [{ path: `blog-posts/${slug}.html`, delete: true }] : []),
    ];
    if (coverUpload) changes.push(coverUpload);
    await commitFiles(changes);
    const savedDrafts = readLocalDrafts();
    delete savedDrafts[slug];
    localStorage.setItem(draftsKey, JSON.stringify(savedDrafts));
    $('original-slug').value = slug;
    $('form-heading').textContent = 'Edit post';
    $('slug').disabled = true;
    $('delete-post').classList.remove('hidden');
    $('save-state').textContent = status === 'published' ? 'Published' : 'Draft';
    $('cover').value = '';
    existingCover = coverImage;
    message(status === 'published'
      ? 'Published. The article page and Journal listing have been saved to the website and are deploying now.'
      : 'Draft saved. Publish it when you’re ready for it to appear on the website.');
    await loadPosts();
  }

  async function deletePost() {
    const slug = $('original-slug').value;
    const post = currentPosts.find((item) => item.slug === slug);
    if (!post || !window.confirm(post._localDraft
      ? `Delete the browser draft “${post.title}”?${post._wasPublished ? ' The published article will stay on the website.' : ''}`
      : `Delete “${post.title}”? This also removes its published page when the site refreshes.`)) return;
    if (post._localDraft) {
      const drafts = readLocalDrafts();
      delete drafts[slug];
      localStorage.setItem(draftsKey, JSON.stringify(drafts));
      clearForm();
      $('form-heading').textContent = 'Create a post';
      message(post._wasPublished ? 'Draft deleted. The published article is unchanged.' : 'Draft deleted from this browser.');
      await loadPosts();
      return;
    }
    const remaining = currentPosts.filter((item) => item.slug !== slug).map((item) => ({
      slug: item.slug, title: item.title, summary: item.summary,
      category: item.category || 'Wecoden Journal', author: item.author || 'Wecoden',
      date: item.date, body: item.body, coverImage: item.coverImage || '', status: item.status || 'draft',
    }));
    const visiblePosts = publishedPosts(remaining);
    const changes = [
      { path: `content/blog-posts/${slug}.json`, delete: true },
      { path: 'blog-posts/index.json', content: JSON.stringify(listingPosts(visiblePosts), null, 2) + '\n' },
      { path: 'blog-posts/generated-posts.json', content: JSON.stringify(visiblePosts.map((item) => `${item.slug}.html`), null, 2) + '\n' },
      ...(post.status === 'published' ? [{ path: `blog-posts/${slug}.html`, delete: true }] : []),
    ];
    await commitFiles(changes);
    clearForm();
    $('form-heading').textContent = 'Create a post';
    message('Post deleted. Its published page will be removed when the website refreshes.');
    await loadPosts();
  }

  $('title').addEventListener('input', () => { if (!$('original-slug').value) $('slug').value = slugify($('title').value); });
  $('summary').addEventListener('input', () => { $('summary-count').textContent = String($('summary').value.length); });
  $('new-post').addEventListener('click', clearForm);
  $('refresh-posts').addEventListener('click', loadPosts);
  $('connect-button').addEventListener('click', () => $('connect-dialog').showModal());
  $('disconnect-button').addEventListener('click', () => { localStorage.removeItem(tokenKey); updateConnection(false); });
  $('confirm-connect').addEventListener('click', async () => {
    const entered = $('github-token').value.trim();
    if (!entered) { $('connect-error').textContent = 'Paste the publishing token to connect.'; return; }
    localStorage.setItem(tokenKey, entered);
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { Authorization: `Bearer ${entered}`, Accept: 'application/vnd.github+json' } });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'GitHub could not verify this token. Check that it has Contents read and write access to this repository.' : 'Could not connect to the website repository.');
      $('connect-dialog').close();
      $('github-token').value = '';
      $('connect-error').textContent = '';
      updateConnection(true);
    } catch (error) {
      localStorage.removeItem(tokenKey);
      $('connect-error').textContent = error.message;
    }
  });
  $('save-draft').addEventListener('click', async () => {
    try { message('Saving draft…'); await savePost('draft'); }
    catch (error) { message(error.message, true); }
  });
  $('publish-post').addEventListener('click', async (event) => {
    event.preventDefault();
    try { $('publish-post').disabled = true; message('Publishing…'); await savePost('published'); }
    catch (error) { message(error.message, true); }
    finally { $('publish-post').disabled = false; }
  });
  $('delete-post').addEventListener('click', async () => {
    try { await deletePost(); } catch (error) { message(error.message, true); }
  });
  $('cover').addEventListener('change', () => {
    const file = $('cover').files[0];
    if (!file) return;
    const image = document.createElement('img');
    image.src = URL.createObjectURL(file);
    image.alt = 'Selected cover image preview';
    $('cover-preview').replaceChildren(image);
    $('cover-preview').classList.remove('hidden');
  });
  $('body').addEventListener('keydown', (event) => {
    const button = event.target.closest('[data-wrap], [data-prefix], [data-link]');
    if (button) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault(); $('save-draft').click();
    }
  });
  document.querySelectorAll('.toolbar button').forEach((button) => button.addEventListener('click', () => {
    const area = $('body');
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = area.value.slice(start, end) || 'text';
    let replacement;
    if (button.dataset.wrap) replacement = `${button.dataset.wrap}${selected}${button.dataset.wrap}`;
    else if (button.dataset.prefix) replacement = selected.split('\n').map((line) => button.dataset.prefix + line).join('\n');
    else if (button.dataset.link) {
      const url = window.prompt('Paste the full link address (starting with https://):');
      if (!url) return;
      replacement = `[${selected}](${url.trim()})`;
    }
    area.setRangeText(replacement, start, end, 'select');
    area.focus();
  }));
  form.addEventListener('submit', (event) => event.preventDefault());

  updateConnection(Boolean(token()));
})();
