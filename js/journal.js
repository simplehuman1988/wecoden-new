document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('journal-posts');
  if (!grid) return;

  try {
    const response = await fetch('blog-posts/index.json');
    if (!response.ok) return;
    const posts = await response.json();
    posts.filter((post) => post.status === 'published').forEach((post) => {
      const link = document.createElement('a');
      link.className = 'bento-item';
      link.href = `blog-posts/${encodeURIComponent(post.slug)}.html`;

      const box = document.createElement('div');
      box.className = 'bento-box journal-card-box';
      const reveal = document.createElement('div');
      reveal.className = 'bento-bg-reveal';
      if (post.coverImage) reveal.style.backgroundImage = `url("${post.coverImage.replace(/["\\]/g, '')}")`;
      box.append(reveal);

      const top = document.createElement('div');
      top.className = 'bento-top';
      const tag = document.createElement('span');
      tag.className = 'bento-tag';
      tag.textContent = post.category || 'Wecoden Journal';
      const arrow = document.createElement('span');
      arrow.className = 'bento-arrow';
      arrow.textContent = '↗';
      top.append(tag, arrow);

      const bottom = document.createElement('div');
      bottom.className = 'bento-bottom';
      const title = document.createElement('h3');
      title.textContent = post.title;
      const meta = document.createElement('span');
      meta.textContent = `${post.readTime || 1} Min Read · ${post.dateLabel || ''}`;
      bottom.append(title, meta);
      box.append(top, bottom);

      const row = document.createElement('div');
      row.className = 'bento-meta-row';
      const author = document.createElement('span');
      author.className = 'eyebrow eyebrow-dark';
      author.textContent = `By ${post.author || 'Wecoden'}`;
      const cta = document.createElement('span');
      cta.className = 'eyebrow';
      cta.textContent = 'Read Full Essay →';
      row.append(author, cta);

      const summary = document.createElement('p');
      summary.className = 'bento-desc';
      summary.textContent = post.summary || '';
      link.append(box, row, summary);
      grid.append(link);
    });
  } catch (error) {
    console.warn('Journal articles could not be loaded.', error);
  }
});
