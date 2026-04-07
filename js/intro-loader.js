/* ═══════════════════════════════════════════════════════════════
   INTRO LOADER
   Runs as first <script> in <body> — before DOMContentLoaded.
   Fades in "MH." + progress bar, then hides the overlay.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Kick off as soon as script runs
  // The overlay is already in the HTML, so we just animate it

  // Force scroll to top on refresh
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  let started = false;

  function runIntro() {
    if (started) return;
    started = true;

    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    const fill = overlay.querySelector('.intro-bar-fill');

    // Start fill animation after a tiny delay (lets browser paint first)
    setTimeout(() => {
      if (fill) fill.style.width = '100%';
    }, 80);

    // Hide overlay after bar completes (1.2s fill + 0.3s buffer)
    setTimeout(() => {
      overlay.classList.add('hidden');
      // Clean up from DOM after transition
      setTimeout(() => overlay.remove(), 700);
    }, 1600);
  }

  // Run when DOM is interactive (script is blocking so this fires quickly)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runIntro);
  } else {
    runIntro();
  }

  // Also ensure it always clears on window load fallback
  window.addEventListener('load', () => {
    setTimeout(() => {
      const overlay = document.getElementById('intro-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.remove(), 700);
      }
    }, 2200);
  });
})();