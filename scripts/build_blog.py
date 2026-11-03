#!/usr/bin/env python3
"""Generate published journal pages from the editor's JSON content files."""

import html
import json
import re
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "blog-posts"
OUTPUT = ROOT / "blog-posts"
MANIFEST = OUTPUT / "generated-posts.json"
INDEX = OUTPUT / "index.json"


def inline_markdown(value):
    value = html.escape(value, quote=False)
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)
    value = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", value)

    def link(match):
        label, url = match.group(1), html.unescape(match.group(2)).strip()
        if not re.match(r"^(https?://|mailto:|/|#)", url, re.I):
            return label
        return f'<a href="{html.escape(url, quote=True)}">{label}</a>'

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, value)


def render_markdown(markdown):
    lines = markdown.replace("\r\n", "\n").split("\n")
    chunks, paragraph, list_items, list_type, code_lines = [], [], [], None, None

    def flush_paragraph():
        if paragraph:
            chunks.append("<p>" + " ".join(inline_markdown(x.strip()) for x in paragraph) + "</p>")
            paragraph.clear()

    def flush_list():
        nonlocal list_type
        if list_items:
            tag = "ol" if list_type == "ol" else "ul"
            chunks.append(f"<{tag}>" + "".join(f"<li>{inline_markdown(item)}</li>" for item in list_items) + f"</{tag}>")
            list_items.clear()
        list_type = None

    for line in lines:
        if line.startswith("```"):
            flush_paragraph()
            flush_list()
            if code_lines is None:
                code_lines = []
            else:
                chunks.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
                code_lines = None
            continue
        if code_lines is not None:
            code_lines.append(line)
            continue
        if not line.strip():
            flush_paragraph()
            flush_list()
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            flush_paragraph()
            flush_list()
            level = len(heading.group(1)) + 1
            chunks.append(f"<h{level}>{inline_markdown(heading.group(2))}</h{level}>")
            continue
        item = re.match(r"^\s*(?:[-*]\s+|(\d+)\.\s+)(.+)$", line)
        if item:
            flush_paragraph()
            next_type = "ol" if item.group(1) else "ul"
            if list_type and list_type != next_type:
                flush_list()
            list_type = next_type
            list_items.append(item.group(2))
            continue
        flush_list()
        paragraph.append(line)
    flush_paragraph()
    flush_list()
    if code_lines is not None:
        chunks.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
    return "\n".join(chunks)


def valid_slug(slug):
    return bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug or ""))


def format_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").strftime("%B %-d, %Y")
    except (TypeError, ValueError):
        return date.today().strftime("%B %-d, %Y")


def page(post, body):
    title = html.escape(post["title"])
    summary = html.escape(post.get("summary", ""))
    category = html.escape(post.get("category", "Wecoden Journal"))
    author = html.escape(post.get("author", "Wecoden"))
    date_label = format_date(post.get("date", ""))
    cover = post.get("coverImage", "")
    cover_html = f'<img class="journal-cover-image" src="../{html.escape(cover, quote=True)}" alt="">' if cover else ""
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — WECODEN Journal</title>
  <meta name="description" content="{summary}">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <div class="site-wrapper">
    <header class="site-header"><div class="nav-inner">
      <a href="../index.html" class="brand-logo" aria-label="Wecoden Home"><img class="brand-mark" src="../assets/wecoden-logo.png" alt="Wecoden"></a>
      <nav class="nav-links" aria-label="Primary Navigation">
        <a href="../brand-and-technical-marketers.html" class="nav-link">Brand &amp; Technical Marketers</a>
        <a href="../services.html" class="nav-link">Services</a><a href="../about-us.html" class="nav-link">About</a>
        <a href="../blog.html" class="nav-link active">Journal</a><a href="../contact-us.html" class="nav-link">Contact</a>
      </nav><div class="nav-actions"><a href="../contact-us.html" class="btn btn-primary">Book a Consultation</a>
      <button class="mobile-menu-btn" aria-label="Toggle Menu"><span></span><span></span></button></div>
    </div></header>
    <div class="mobile-drawer"><div class="mobile-nav-list">
      <div class="mobile-nav-item"><a href="../brand-and-technical-marketers.html"><span>Brand &amp; Technical Marketers</span><span>↗</span></a></div>
      <div class="mobile-nav-item"><a href="../services.html"><span>All Services</span><span>↗</span></a></div>
      <div class="mobile-nav-item"><a href="../about-us.html"><span>About Wecoden</span><span>↗</span></a></div>
      <div class="mobile-nav-item"><a href="../blog.html"><span>Journal &amp; Insights</span><span>↗</span></a></div>
      <div class="mobile-nav-item"><a href="../contact-us.html"><span>Contact Us</span><span>↗</span></a></div>
    </div></div>
    <main>
      <section class="page-hero"><div class="container">
        <div class="page-hero-top"><a href="../blog.html" class="back-link">← Journal</a><span class="eyebrow">{category} · {post.get('readTime', 1)} Min Read</span></div>
        <h1 class="h-hero" data-blur style="max-width: 1060px; font-size: clamp(38px, 5vw, 72px);">{title}</h1>
        <div class="page-hero-bottom"><p class="lead" style="max-width: 680px; color: var(--text-primary);">{summary}</p><span class="eyebrow eyebrow-dark">By {author} · {date_label}</span></div>
        {cover_html}
      </div></section>
      <article class="article-container article-prose border-b">{body}
        <div class="journal-article-end"><div><span class="eyebrow">More from Wecoden</span><a href="../blog.html">← Back to the Journal</a></div><a href="../contact-us.html" class="btn btn-primary">Talk to Our Team</a></div>
      </article>
      <section class="prefooter-section"><div class="container"><div class="prefooter-grid">
        <div class="prefooter-left"><span class="eyebrow eyebrow-dark">Wecoden · Technical Marketers &amp; Managed IT</span><h2 class="h-section">Let’s put the value of your technology in the spotlight.</h2><p class="lead">Whether you need authoritative B2B technical content or managed infrastructure, our team is ready to help.</p></div>
        <div class="prefooter-right"><div class="prefooter-meta-block"><span class="eyebrow">EMAIL</span><a href="mailto:hello@wecoden.com">hello@wecoden.com</a></div><a href="../contact-us.html" class="btn btn-primary btn-full">Start a Conversation</a></div>
      </div></div></section>
    </main>
    <footer class="site-footer"><div class="container"><div class="footer-wordmark-wrap"><div class="footer-wordmark"><img src="../assets/wecoden-logo.png" alt="Wecoden"></div></div><div class="footer-bottom-bar"><span>© 2026 WECODEN. All rights reserved.</span><a href="../blog.html">All Journal Articles</a></div></div></footer>
  </div><script src="../js/main.js"></script>
</body></html>'''


def main():
    SOURCE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    posts = []
    for source_file in sorted(SOURCE.glob("*.json")):
        post = json.loads(source_file.read_text(encoding="utf-8"))
        slug = post.get("slug", source_file.stem)
        if not valid_slug(slug) or slug != source_file.stem:
            raise ValueError(f"Invalid slug or filename mismatch: {source_file.name}")
        post["slug"] = slug
        if post.get("status") != "published":
            continue
        if not post.get("title") or not post.get("summary") or not post.get("body"):
            raise ValueError(f"Published post is missing title, summary, or body: {source_file.name}")
        post["readTime"] = max(1, round(len(post["body"].split()) / 200))
        post["dateLabel"] = format_date(post.get("date", ""))
        posts.append(post)

    posts.sort(key=lambda p: (p.get("date", ""), p.get("title", "")), reverse=True)
    previous = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else []
    current_paths = [f"{p['slug']}.html" for p in posts]
    for old_path in previous:
        if old_path not in current_paths:
            stale = OUTPUT / old_path
            if stale.parent == OUTPUT and stale.suffix == ".html" and stale.exists():
                stale.unlink()

    for post in posts:
        (OUTPUT / f"{post['slug']}.html").write_text(page(post, render_markdown(post["body"])), encoding="utf-8")
    listing = [{key: value for key, value in post.items() if key != "body"} for post in posts]
    INDEX.write_text(json.dumps(listing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(current_paths, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(posts)} published journal pages.")


if __name__ == "__main__":
    main()
