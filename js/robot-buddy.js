/* ══════════════════════════════════════════════════════════════
   <robot-buddy accent="#E0565C"> — the small 3D assistant.
   Drag to rotate · click to open the chat · blinks and floats
   on its own. Three.js is imported lazily; if WebGL or the
   module import fails it emits `buddy-fail` and the widget
   falls back to a plain button.
   ══════════════════════════════════════════════════════════════ */

const THREE_URL = 'https://unpkg.com/three@0.184.0/build/three.module.js';

class RobotBuddy extends HTMLElement {
  connectedCallback() {
    if (this._booted) return;
    this._booted = true;
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.touchAction = 'none';
    this.boot().catch(() => {
      this.style.display = 'none';
      this.dispatchEvent(new CustomEvent('buddy-fail', { bubbles: true }));
    });
  }

  disconnectedCallback() { this._stop = true; }

  async boot() {
    const THREE = await import(THREE_URL);
    const accent = this.getAttribute('accent') || '#E0565C';
    const w = this.clientWidth || 116;
    const h = this.clientHeight || 132;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    this.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
    camera.position.set(0, 0, 6.0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9d9d9d, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2.6, 3.4, 3.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-3, 1, -2.5);
    scene.add(rim);

    const shell = new THREE.MeshStandardMaterial({ color: 0xf3f0ec, roughness: 0.42, metalness: 0.08 });
    const joint = new THREE.MeshStandardMaterial({ color: 0xb9b4b0, roughness: 0.5, metalness: 0.25 });
    const dark  = new THREE.MeshStandardMaterial({ color: 0x141312, roughness: 0.22, metalness: 0.35 });
    const glow  = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.5, roughness: 0.4 });

    const bot = new THREE.Group();

    /* ── head ── */
    const head = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 32), shell);
    skull.scale.set(1.16, 0.98, 0.94);
    head.add(skull);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), dark);
    visor.scale.set(1.16, 0.72, 0.34);
    visor.position.set(0, 0.03, 0.44);
    head.add(visor);

    const eyeGeo = new THREE.SphereGeometry(0.1, 28, 20);
    const eyes = [];
    [-0.215, 0.215].forEach(x => {
      const e = new THREE.Mesh(eyeGeo, glow);
      e.position.set(x, 0.07, 0.6);
      e.scale.set(1.05, 1.15, 0.35);
      head.add(e);
      eyes.push(e);
    });

    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.019, 10, 26, Math.PI), glow);
    mouth.position.set(0, -0.13, 0.61);
    mouth.rotation.z = Math.PI;
    mouth.scale.z = 0.4;
    head.add(mouth);

    [-0.735, 0.735].forEach(x => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.11, 28), joint);
      ear.rotation.z = Math.PI / 2;
      ear.position.set(x, 0.02, 0);
      head.add(ear);
    });

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 12), joint);
    stalk.position.set(0, 0.68, 0);
    head.add(stalk);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 18), glow);
    bulb.position.set(0, 0.86, 0);
    head.add(bulb);

    head.position.y = 0.62;
    bot.add(head);

    /* ── body ── */
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.46, 40, 30), shell);
    torso.scale.set(1.0, 1.18, 0.86);
    torso.position.y = -0.5;
    bot.add(torso);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.1, 24), joint);
    collar.position.y = 0.03;
    bot.add(collar);

    /* ── arms ── */
    const armGeo = new THREE.CapsuleGeometry(0.085, 0.42, 8, 20);
    const mkArm = side => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.44, -0.32, 0);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 16), joint);
      pivot.add(ball);
      const limb = new THREE.Mesh(armGeo, shell);
      limb.position.y = -0.29;
      pivot.add(limb);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 22, 16), joint);
      hand.position.y = -0.55;
      pivot.add(hand);
      pivot.rotation.z = side * 0.28;
      bot.add(pivot);
      return pivot;
    };
    mkArm(-1);
    mkArm(1);

    bot.position.y = -0.14;
    bot.scale.setScalar(1.05);
    scene.add(bot);

    /* ── interaction: drag rotates, tap opens the chat ── */
    let dragging = false, moved = false, px = 0, py = 0;
    let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0;
    const el = renderer.domElement;
    el.style.cursor = 'grab';

    el.addEventListener('pointerdown', e => {
      dragging = true; moved = false; px = e.clientX; py = e.clientY;
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      targetYaw += dx * 0.011;
      targetPitch = Math.max(-0.5, Math.min(0.5, targetPitch + dy * 0.008));
      px = e.clientX; py = e.clientY;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      if (!moved) this.dispatchEvent(new CustomEvent('buddy-click', { bubbles: true }));
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    let mx = 0, my = 0;
    window.addEventListener('mousemove', e => {
      const r = this.getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 260));
      my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 260));
    });

    new ResizeObserver(() => {
      const nw = this.clientWidth || w, nh = this.clientHeight || h;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    }).observe(this);

    /* ── behaviour clock ── */
    const start = performance.now();
    let nextBlink = 700, blinkUntil = -1;

    const tick = now => {
      if (this._stop) { renderer.dispose(); return; }
      const t = now - start;

      if (t > nextBlink && blinkUntil < 0) { blinkUntil = t + 130; nextBlink = t + 2200 + Math.random() * 3200; }
      const blinking = blinkUntil > 0 && t < blinkUntil;
      if (blinkUntil > 0 && t >= blinkUntil) blinkUntil = -1;
      eyes.forEach(e => { e.scale.y += ((blinking ? 0.1 : 1.15) - e.scale.y) * 0.35; });

      bot.position.y = -0.14 + Math.sin(t / 900) * 0.055;
      glow.emissiveIntensity = 1.25 + Math.sin(t / 420) * 0.35;

      if (!dragging) targetYaw += (mx * 0.5 - targetYaw) * 0.03;
      yaw += (targetYaw - yaw) * 0.09;
      pitch += ((dragging ? targetPitch : my * 0.22) - pitch) * 0.08;
      bot.rotation.y = yaw + Math.sin(t / 2400) * 0.05;
      bot.rotation.x = pitch;
      head.rotation.y = dragging ? 0 : mx * 0.18;
      head.rotation.x = dragging ? 0 : my * 0.12;

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

if (!customElements.get('robot-buddy')) customElements.define('robot-buddy', RobotBuddy);
