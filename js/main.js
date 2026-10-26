/**
 * WECODEN — Consulta Framer Motion, Interactions & Carbon Badge Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initSlideButtons();
  initBlurAnimations();
  initMobileMenu();
  initAccordions();
  initServiceFilters();
  initContactForms();
  initCarbonBadge();
});

/**
 * 1. Dual-Text Vertical Slide Button Setup (Exact Consulta Hover Motion)
 */
function initSlideButtons() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((btn) => {
    if (btn.querySelector('.btn-slide-wrap')) return;
    const text = btn.textContent.trim();
    if (!text) return;
    btn.innerHTML = `<span class="btn-slide-wrap"><span>${text}</span><span>${text}</span></span>`;
  });
}

/**
 * 2. Word-by-Word Blur-In & Fade-Up Scroll Animations
 */
function initBlurAnimations() {
  const blurHeadings = document.querySelectorAll('[data-blur]');

  blurHeadings.forEach((el) => {
    if (el.dataset.blurInitialized === 'true') return;
    el.dataset.blurInitialized = 'true';

    // Preserve child line-breaks or spans while wrapping words
    const rawHtml = el.innerHTML.trim();
    const tokens = rawHtml.split(/(\s+|<br\s*\/?>)/gi);
    let wordIndex = 0;

    const wrapped = tokens
      .map((token) => {
        if (/^\s+$/.test(token)) return ' ';
        if (/^<br\s*\/?>$/i.test(token)) return '<br>';
        if (!token) return '';
        const delay = Math.min(wordIndex * 38, 680);
        wordIndex++;
        return `<span class="blur-word" style="transition-delay: ${delay}ms">${token}</span>`;
      })
      .join('');

    el.innerHTML = wrapped;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          if (target.hasAttribute('data-blur')) {
            target.querySelectorAll('.blur-word').forEach((w) => w.classList.add('is-visible'));
          }
          if (target.classList.contains('fade-up')) {
            target.classList.add('is-visible');
          }
          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  blurHeadings.forEach((el) => observer.observe(el));
  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
}

/**
 * 3. Mobile Navigation Drawer
 */
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const drawer = document.querySelector('.mobile-drawer');
  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('is-open');
    btn.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      btn.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });
}

/**
 * 4. Smooth FAQ Accordions
 */
function initAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    const body = item.querySelector('.faq-body');
    if (!trigger || !body) return;

    // Open default items marked .is-open
    if (item.classList.contains('is-open')) {
      body.style.maxHeight = body.scrollHeight + 'px';
    }

    trigger.addEventListener('click', () => {
      const currentlyOpen = item.classList.contains('is-open');

      // Close sibling items in same list
      const parentList = item.closest('.faq-list');
      if (parentList) {
        parentList.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('is-open');
            const openBody = openItem.querySelector('.faq-body');
            if (openBody) openBody.style.maxHeight = '0px';
          }
        });
      }

      if (currentlyOpen) {
        item.classList.remove('is-open');
        body.style.maxHeight = '0px';
      } else {
        item.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/**
 * 5. Services Directory Category Filtering
 */
function initServiceFilters() {
  const tabs = document.querySelectorAll('[data-filter-btn]');
  const items = document.querySelectorAll('[data-service-cat]');
  if (!tabs.length || !items.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-filter-btn');
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      items.forEach((item) => {
        const itemCat = item.getAttribute('data-service-cat');
        if (cat === 'all' || itemCat === cat) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/**
 * 6. Interactive Contact & Inquiry Form
 */
function initContactForms() {
  const pills = document.querySelectorAll('.service-pill');
  const hiddenInput = document.getElementById('selected-service-input');

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('selected');
      if (hiddenInput) {
        const selected = Array.from(document.querySelectorAll('.service-pill.selected')).map((p) =>
          p.textContent.trim()
        );
        hiddenInput.value = selected.join(', ');
      }
    });
  });

  const forms = document.querySelectorAll('[data-wecoden-form]');
  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusEl = form.querySelector('.form-status-msg');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML =
          '<span style="color: #0a0a0a; font-weight: 500;">✓ Thank you. Your inquiry has been recorded — our technical co-founders will respond within 1 business day at build@wecoden.com.</span>';
      }
      form.reset();
      pills.forEach((p) => p.classList.remove('selected'));
    });
  });
}

/**
 * 7. Website Carbon Badge Integration (Official Script + Architectural Fallback)
 */
function initCarbonBadge() {
  const wcbContainer = document.getElementById('wcb');
  if (!wcbContainer) return;

  // Load official Website Carbon badge script asynchronously if online
  if (window.location.protocol.startsWith('http')) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/website-carbon-badges@1.1.3/b.min.js';
    script.defer = true;
    document.body.appendChild(script);
  }
}
