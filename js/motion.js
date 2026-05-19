/* ═══════════════════════════════════════════════════════════════
   HASSAN PORTFOLIO — motion.js
   GSAP timelines + Intersection Observer scroll reveals.
   This file is ADDITIVE — it does not touch app.js or main.js.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* ── 1. SCROLL REVEALS (.reveal-up | .reveal-fade | .reveal-stagger) ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');

      // Stagger children if requested
      if (entry.target.classList.contains('reveal-stagger')) {
        const kids = entry.target.querySelectorAll('[data-stagger]');
        kids.forEach((k, i) => {
          k.style.setProperty('--stagger-delay', `${i * 60}ms`);
          k.classList.add('is-visible');
        });
      }
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  const wireReveals = () => {
    document
      .querySelectorAll('.reveal-up, .reveal-fade, .reveal-scale, .reveal-stagger')
      .forEach((el) => revealObserver.observe(el));
  };

  /* ── 2. HERO TIMELINE (GSAP if available, CSS fallback otherwise) ── */
  const playHero = () => {
    if (prefersReduce) return;
    if (!hasGSAP) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('[data-hero-eyebrow]', { y: 24, opacity: 0, duration: 0.6 })
      .from('[data-hero-title] > span', {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
      }, '-=0.2')
      .from('[data-hero-tagline]', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('[data-hero-desc]', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('[data-hero-cta] > *', {
        y: 20, opacity: 0, duration: 0.6, stagger: 0.1,
      }, '-=0.4')
      .from('[data-hero-badges] > *', {
        y: 14, opacity: 0, duration: 0.45, stagger: 0.08,
      }, '-=0.4');
  };

  /* ── 3. PARALLAX HERO ORBS (subtle) ── */
  const wireParallax = () => {
    if (prefersReduce) return;
    const orbs = document.querySelectorAll('[data-parallax]');
    if (!orbs.length) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        orbs.forEach((orb) => {
          const factor = parseFloat(orb.dataset.parallax) || 0.12;
          orb.style.transform = `translate3d(0, ${y * factor}px, 0)`;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  /* ── 4. SECTION-EYEBROW COUNTER (01 / 02 / 03 …) ── */
  const wireSectionCounters = () => {
    document.querySelectorAll('[data-section-no]').forEach((el, idx) => {
      const n = String(idx + 1).padStart(2, '0');
      el.setAttribute('data-section-no', n);
    });
  };

  /* ── 5. TILT EFFECT ON GLASS CARDS ── */
  const wireTilt = () => {
    if (prefersReduce) return;
    if (window.matchMedia('(hover: none)').matches) return;
    const tilts = document.querySelectorAll('[data-tilt]');
    tilts.forEach((card) => {
      let rect = null;
      const update = (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const rx = ((cy / rect.height) - 0.5) * -6;
        const ry = ((cx / rect.width) - 0.5) * 6;
        card.style.setProperty('--tilt-x', `${rx}deg`);
        card.style.setProperty('--tilt-y', `${ry}deg`);
        card.style.setProperty('--mx', `${(cx / rect.width) * 100}%`);
        card.style.setProperty('--my', `${(cy / rect.height) * 100}%`);
      };
      const reset = () => {
        rect = null;
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      };
      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', update);
      card.addEventListener('mouseleave', reset);
    });
  };

  /* ── 6. SCROLL-LINKED HEADER COMPACTING (additive to app.js) ── */
  const wireHeaderScroll = () => {
    const header = document.getElementById('main-header');
    if (!header) return;
    let last = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      header.classList.toggle('is-hidden', y > last && y > 320);
      last = y;
    }, { passive: true });
  };

  /* ── 7. MARQUEE PAUSE-ON-HOVER (logos strip) ── */
  const wireMarquee = () => {
    document.querySelectorAll('[data-marquee]').forEach((m) => {
      m.addEventListener('mouseenter', () => m.classList.add('is-paused'));
      m.addEventListener('mouseleave', () => m.classList.remove('is-paused'));
    });
  };

  /* ── 8. MAGNETIC BUTTONS — cursor-tracking spotlight + pull ── */
  const wireMagneticButtons = () => {
    if (prefersReduce) return;
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.btn').forEach((btn) => {
      let rect = null;
      let rafId = null;

      const onEnter = () => { rect = btn.getBoundingClientRect(); };
      const onMove = (e) => {
        if (!rect) rect = btn.getBoundingClientRect();
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const pctX = (x / rect.width)  * 100;
          const pctY = (y / rect.height) * 100;
          btn.style.setProperty('--mx', pctX + '%');
          btn.style.setProperty('--my', pctY + '%');

          // Subtle magnetic pull (max 6px in any direction)
          const dx = ((x / rect.width)  - 0.5) * 12;
          const dy = ((y / rect.height) - 0.5) * 12;
          btn.style.setProperty('--pull-x', dx + 'px');
          btn.style.setProperty('--pull-y', dy + 'px');
          rafId = null;
        });
      };
      const onLeave = () => {
        rect = null;
        btn.style.setProperty('--pull-x', '0px');
        btn.style.setProperty('--pull-y', '0px');
      };

      btn.addEventListener('mouseenter', onEnter);
      btn.addEventListener('mousemove',  onMove);
      btn.addEventListener('mouseleave', onLeave);
    });
  };

  /* ── 9. STAT COUNT-UPS (data-count-to) ── */
  const wireCounters = () => {
    if (prefersReduce) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.countTo);
        const suffix = el.dataset.countSuffix || '';
        const dur = 1400;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = Math.round(target * eased);
          el.textContent = val.toLocaleString() + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count-to]').forEach((el) => obs.observe(el));
  };

  /* ── INIT ── */
  const init = () => {
    wireSectionCounters();
    wireReveals();
    wireParallax();
    wireTilt();
    wireHeaderScroll();
    wireMarquee();
    wireMagneticButtons();
    wireCounters();
    // Hero plays on next frame so initial paint is clean
    requestAnimationFrame(playHero);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
