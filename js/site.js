/* ══════════════════════════════════════════════════════════════
   HASSAN — site.js
   Shared behaviour for every page: scroll reveals, mobile nav,
   active-section highlighting, the contact form (Web3Forms),
   and the nonogram work-row preview.
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ── Scroll reveals ─────────────────────────────────────── */
  function initReveals() {
    const nodes = $$('[data-reveal]');
    if (!nodes.length) return;

    const show = n => n.classList.add('is-visible');

    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(show);
      return;
    }

    // Stagger siblings that enter together so groups cascade rather than pop.
    const io = new IntersectionObserver((entries, obs) => {
      let i = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = Math.min(i++, 4) * 80;
        setTimeout(() => show(entry.target), delay);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    nodes.forEach(n => io.observe(n));
  }

  /* ── Mobile navigation ──────────────────────────────────── */
  function initNav() {
    const toggle = $('.nav-toggle');
    const nav = $('.site-nav');
    if (!toggle || !nav) return;

    const setOpen = open => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () =>
      setOpen(!document.body.classList.contains('nav-open')));

    nav.addEventListener('click', e => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Reset when the layout leaves the mobile breakpoint.
    const mq = window.matchMedia('(min-width: 861px)');
    mq.addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  /* ── Active section in the header ───────────────────────── */
  function initSectionSpy() {
    const links = $$('.site-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach(a => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) map.set(target, a);
    });
    if (!map.size) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(a => a.classList.remove('is-current'));
          link.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_, section) => io.observe(section));
  }

  /* ── Contact form → Web3Forms ───────────────────────────── */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    const status = $('.form-status', form);
    const button = $('button[type="submit"]', form);
    const code   = $('#country-code', form);
    const local  = $('#phone-local', form);
    const phone  = $('#phone', form);

    const say = (text, state) => {
      if (!status) return;
      status.textContent = text;
      if (state) status.dataset.state = state;
      else delete status.dataset.state;
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Compose the full phone number from the country code + local part.
      if (phone && local) {
        const digits = local.value.replace(/[\s-]/g, '');
        if (digits && !/^\d{7,}$/.test(digits)) {
          say('Phone number should be at least 7 digits.', 'error');
          local.focus();
          return;
        }
        phone.value = digits ? `${code ? code.value : ''} ${local.value}`.trim() : '';
      }

      button.disabled = true;
      say('Sending…');

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
        });
        const json = await res.json().catch(() => ({}));

        if (res.ok && json.success) {
          form.reset();
          say('Message sent. I will get back to you.', 'ok');
        } else {
          say(json.message || 'Something went wrong. Email me directly.', 'error');
        }
      } catch (err) {
        console.error('Contact form:', err);
        say('Network error. Email me directly.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ── Nonogram preview (work row 03) ─────────────────────── */
  function initNonogram() {
    const grid = $('[data-nonogram]');
    if (!grid) return;

    // Row-major 8×6 sample lifted from the generator's own output.
    const pattern = [
      1, 0, 1, 0, 1, 0, 1, 0,
      1, 1, 0, 1, 0, 1, 1, 0,
      1, 1, 1, 0, 0, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 0, 1,
      0, 0, 1, 1, 1, 0, 0, 1,
      0, 0, 0, 1, 0, 0, 0, 1
    ];

    const cells = pattern.map(() => grid.appendChild(document.createElement('i')));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cells.forEach((c, i) => { if (pattern[i]) c.classList.add('on'); });
      return;
    }

    let i = 0, timer = null;
    const step = () => {
      if (i < cells.length) {
        if (pattern[i]) cells[i].classList.add('on');
        i++;
        timer = setTimeout(step, 80);
      } else {
        timer = setTimeout(() => {
          cells.forEach(c => c.classList.remove('on'));
          i = 0;
          timer = setTimeout(step, 420);
        }, 2600);
      }
    };

    // Only run while the row is on screen.
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (!timer) step();
      } else {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: 0.25 }).observe(grid);
  }

  /* ── Boot ───────────────────────────────────────────────── */
  const boot = () => {
    initReveals();
    initNav();
    initSectionSpy();
    initContactForm();
    initNonogram();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
