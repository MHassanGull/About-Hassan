/* ═══════════════════════════════════════════════════════════════
   HASSAN PORTFOLIO — hero3d.js
   A real WebGL 3D hero: a floating faceted emerald crystal wrapped
   in a gold wireframe, rim-lit, with a drifting particle field and
   mouse parallax. Three.js (global THREE, loaded via CDN).

   ADDITIVE + DEFENSIVE:
   · Skips entirely on reduced-motion, low-power / small screens,
     save-data, or if WebGL / THREE is unavailable.
   · Pauses render loop when the hero scrolls out of view.
   · Never throws into the page — all guarded.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-3d');
  if (!canvas) return;

  // ── Guards ───────────────────────────────────────────────────
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const smallScreen = window.innerWidth < 720;

  if (prefersReduce || saveData || (isCoarse && smallScreen) || typeof window.THREE === 'undefined') {
    return; // Leave the CSS aurora orbs as the hero background.
  }

  const THREE = window.THREE;

  // WebGL support probe
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return;
  } catch (e) { return; }

  const EMERALD = 0x10b981;
  const EMERALD_LT = 0x34d399;
  const GOLD = 0xebc24a;
  const MINT = 0x5eead4;

  let renderer, scene, camera, crystalGroup, crystal, wire, innerCore, particles;
  let raf = null;
  let running = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const clock = { t: 0 };

  function size() {
    const w = canvas.clientWidth || canvas.offsetWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.offsetHeight || window.innerHeight;
    return { w, h };
  }

  function init() {
    const { w, h } = size();

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    crystalGroup = new THREE.Group();
    // Keep the crystal as a supporting emblem — small enough that the
    // headline reads clearly in front of it.
    crystalGroup.scale.setScalar(0.6);
    scene.add(crystalGroup);

    // Faceted emerald crystal
    const geo = new THREE.IcosahedronGeometry(1.7, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: EMERALD,
      metalness: 0.42,
      roughness: 0.18,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    });
    crystal = new THREE.Mesh(geo, mat);
    crystalGroup.add(crystal);

    // Gold wireframe shell (slightly larger)
    const wireGeo = new THREE.IcosahedronGeometry(1.82, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: GOLD,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    wire = new THREE.Mesh(wireGeo, wireMat);
    crystalGroup.add(wire);

    // Glowing inner core
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: EMERALD_LT,
      transparent: true,
      opacity: 0.35,
    });
    innerCore = new THREE.Mesh(coreGeo, coreMat);
    crystalGroup.add(innerCore);

    // Lights — emerald key, gold + mint rim
    scene.add(new THREE.AmbientLight(0x1a3a2a, 0.7));
    const key = new THREE.PointLight(EMERALD, 2.2, 40);
    key.position.set(-5, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(GOLD, 1.7, 40);
    rim.position.set(5, -2, 4);
    scene.add(rim);
    const back = new THREE.PointLight(MINT, 1.0, 40);
    back.position.set(0, 5, -5);
    scene.add(back);

    // Drifting particle field
    const COUNT = 170;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const cA = new THREE.Color(EMERALD_LT);
    const cB = new THREE.Color(GOLD);
    for (let i = 0; i < COUNT; i++) {
      const r = 3.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = Math.random() > 0.5 ? cA : cB;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Pointer parallax
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Pause when hero leaves the viewport
    const hero = document.getElementById('home') || canvas;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.02 }).observe(hero);
    }

    start();
  }

  function onPointer(e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function onResize() {
    if (!renderer) return;
    const { w, h } = size();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function frame() {
    if (!running) return;
    clock.t += 0.016;

    // Ease pointer
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    if (crystalGroup) {
      crystal.rotation.y += 0.0026;
      crystal.rotation.x += 0.0013;
      wire.rotation.y -= 0.0016;
      wire.rotation.x += 0.0009;
      innerCore.rotation.y -= 0.004;
      innerCore.scale.setScalar(1 + Math.sin(clock.t * 1.4) * 0.06);

      // Parallax tilt + gentle float
      crystalGroup.rotation.y += (pointer.x * 0.5 - crystalGroup.rotation.y) * 0.04;
      crystalGroup.rotation.x += (pointer.y * 0.35 - crystalGroup.rotation.x) * 0.04;
      crystalGroup.position.y = Math.sin(clock.t * 0.9) * 0.14;
    }
    if (particles) {
      particles.rotation.y += 0.0007;
      particles.rotation.x = pointer.y * 0.12;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
