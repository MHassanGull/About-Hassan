/* ═══════════════════════════════════════════════════════════════
   INTRO LOADER — Premium aurora-particle convergence + text reveal
   Renders as the very first script in <body>.
   Total duration: ~2400ms. Skips automatically if reduced-motion.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Always start at top on hard refresh
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let started = false;

  function dismiss(overlay, immediate) {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), immediate ? 50 : 700);
  }

  function runIntro() {
    if (started) return;
    started = true;

    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;
    document.body.classList.add('intro-active');

    // Reduced motion: just flash + dismiss
    if (prefersReduce) {
      setTimeout(() => {
        document.body.classList.remove('intro-active');
        dismiss(overlay, true);
      }, 200);
      return;
    }

    // ── Particle field on canvas ─────────────────────────
    const canvas = overlay.querySelector('.intro-canvas');
    const stage  = overlay.querySelector('.intro-stage');
    if (!canvas || !stage) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = canvas.width  = window.innerWidth  * DPR;
    let H = canvas.height = window.innerHeight * DPR;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';

    const COLORS = ['#A78BFA', '#60A5FA', '#22D3EE', '#C4B5FD'];
    const PARTICLE_COUNT = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 9000));

    /* Each particle is born at the edge of the screen and homes to a
       target point near the centered text — creating a convergence. */
    const cx = W / 2, cy = H / 2;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(W, H) * 0.6;
      const targetAngle = (Math.random() - 0.5) * 0.6;            // narrow cone toward center
      const targetRadius = (Math.random() * 0.25 + 0.05) * Math.max(W, H);
      particles.push({
        x:  cx + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4),
        y:  cy + Math.sin(angle) * radius * (0.8 + Math.random() * 0.4),
        tx: cx + Math.cos(targetAngle + angle * 0.1) * targetRadius * (Math.random() > 0.5 ? 1 : -1),
        ty: cy + (Math.random() - 0.5) * H * 0.5,
        vx: 0, vy: 0,
        size:  (Math.random() * 1.6 + 0.6) * DPR,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life:  Math.random() * 0.4 + 0.6,
        born:  Math.random() * 300,
      });
    }

    const start = performance.now();
    const DUR_CONVERGE = 1400;
    const DUR_LINGER   = 800;
    const DUR_TOTAL    = DUR_CONVERGE + DUR_LINGER;

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function frame(now) {
      const elapsed = now - start;
      // Fade trail effect — partial clear so particles leave streaks
      ctx.fillStyle = 'rgba(7, 7, 12, 0.20)';
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        const localElapsed = Math.max(0, elapsed - p.born);
        const t = Math.min(1, localElapsed / DUR_CONVERGE);
        const eased = easeOutQuart(t);

        const x = p.x + (p.tx - p.x) * eased;
        const y = p.y + (p.ty - p.y) * eased;

        // Glow
        ctx.shadowBlur = 18 * DPR;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * (1 - Math.max(0, (elapsed - DUR_CONVERGE) / DUR_LINGER) * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      if (elapsed < DUR_TOTAL) {
        requestAnimationFrame(frame);
      } else {
        // Final fade
        document.body.classList.remove('intro-active');
        dismiss(overlay, false);
      }
    }

    // Resize handler
    const onResize = () => {
      W = canvas.width  = window.innerWidth  * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    window.addEventListener('resize', onResize);

    // Trigger SVG / text reveal classes via small delay so paint is clean
    requestAnimationFrame(() => {
      stage.classList.add('reveal');
      requestAnimationFrame(frame);
    });

    // Safety net: never trap the user behind the overlay
    setTimeout(() => {
      document.body.classList.remove('intro-active');
      dismiss(overlay, false);
    }, DUR_TOTAL + 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runIntro);
  } else {
    runIntro();
  }

  // Hard fallback: never leave the user stuck on the overlay
  window.addEventListener('load', () => {
    setTimeout(() => {
      const overlay = document.getElementById('intro-overlay');
      if (overlay) {
        document.body.classList.remove('intro-active');
        dismiss(overlay, false);
      }
    }, 3800);
  });
})();
