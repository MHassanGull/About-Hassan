/**
 * ╔══════════════════════════════════════════════════════════════╗
 * HASSAN PORTFOLIO — INTRO LOADER v3.0
 * WebGL Light-Speed Swirl  ·  Noise Overlay  ·  Cinematic Exit
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage: add as FIRST <script> in <head> — no HTML changes needed.
 */

(function () {
    'use strict';

    /* ─── CSS ──────────────────────────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
    #hassan-intro-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: #000;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      overflow: hidden;
    }

    /* Phase-1: canvas fades out first */
    #hassan-intro-overlay.canvas-fade #intro-canvas,
    #hassan-intro-overlay.canvas-fade #intro-noise {
      opacity: 0;
      transition: opacity 0.6s ease-out;
    }

    /* Phase-2: whole overlay dissolves + scales */
    #hassan-intro-overlay.fade-out {
      opacity: 0;
      transform: scale(1.05);
      pointer-events: none;
      transition:
        opacity   1.0s cubic-bezier(0.4, 0, 0.2, 1) 0.05s,
        transform 1.0s cubic-bezier(0.4, 0, 0.2, 1) 0.05s;
    }

    /* WebGL canvas */
    #intro-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      display: block;
      transition: opacity 0.6s ease-out;
    }

    /* Noise / scanline texture (CSS-generated, no image needed) */
    #intro-noise {
      position: absolute; inset: 0;
      pointer-events: none;
      background-image:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.06) 2px,
          rgba(0,0,0,0.06) 4px
        );
      background-size: 100% 4px;
      mix-blend-mode: overlay;
      opacity: 0.55;
      transition: opacity 0.6s ease-out;
      animation: noiseFlicker 0.12s steps(2) infinite;
    }
    @keyframes noiseFlicker {
      0%   { opacity: 0.50; }
      50%  { opacity: 0.60; }
      100% { opacity: 0.55; }
    }

    /* Vignette */
    #intro-vignette {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(
        ellipse at center,
        transparent 15%,
        rgba(0,0,0,0.48) 52%,
        rgba(0,0,0,0.90) 100%
      );
    }

    /* Center content */
    #intro-content {
      position: relative; z-index: 3;
      text-align: center;
      display: flex; flex-direction: column;
      align-items: center; gap: 18px;
      animation: introIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
    }
    @keyframes introIn {
      from { opacity: 0; transform: translateY(28px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }

    /* "MH." — breathing pulse */
    #intro-logo {
      font-family: 'Outfit', 'Syne', system-ui, sans-serif;
      font-size: clamp(3rem, 9vw, 6rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1;
      background: linear-gradient(
        110deg,
        #fff 0%, #fff 30%,
        rgba(255,255,255,0.32) 50%,
        #fff 70%, #fff 100%
      );
      background-size: 200% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation:
        shimmerText  3.6s linear 1.0s infinite,
        logoPulse    2.0s ease-in-out 1.0s infinite;
    }
    @keyframes shimmerText {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes logoPulse {
      0%, 100% { transform: scale(1.00); }
      50%       { transform: scale(1.03); }
    }

    /* Tagline */
    #intro-tagline {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: clamp(0.68rem, 1.8vw, 0.88rem);
      font-weight: 400;
      letter-spacing: 0.30em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.40);
      animation: introIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;
    }

    /* Progress bar */
    #intro-progress-wrap {
      width: clamp(140px, 28vw, 240px);
      height: 1px;
      background: rgba(255,255,255,0.08);
      border-radius: 1px;
      overflow: hidden;
      margin-top: 12px;
      animation: introIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1.1s both;
    }
    #intro-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0.10),
        rgba(255,255,255,0.85),
        rgba(255,255,255,0.10)
      );
      border-radius: 1px;
      transition: width 0.55s ease;
    }

    /* Skip — only visible after 1.5s */
    #intro-skip {
      position: absolute; bottom: 34px; right: 34px; z-index: 4;
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase;
      color: rgba(255,255,255,0.22);
      cursor: pointer; border: none; background: none; padding: 10px 14px;
      transition: color 0.35s;
      opacity: 0;
      animation: skipReveal 0.6s ease forwards 1.5s;
    }
    @keyframes skipReveal {
      to { opacity: 1; }
    }
    #intro-skip:hover { color: rgba(255,255,255,0.60); }
    `;
    document.head.appendChild(style);

    /* ─── HTML ─────────────────────────────────────────────────── */
    const overlay = document.createElement('div');
    overlay.id = 'hassan-intro-overlay';
    overlay.innerHTML = `
      <canvas id="intro-canvas"></canvas>
      <div id="intro-noise"></div>
      <div id="intro-vignette"></div>
      <div id="intro-content">
        <div id="intro-logo">MH.</div>
        <div id="intro-tagline">AI &amp; Django Developer</div>
        <div id="intro-progress-wrap">
          <div id="intro-progress-bar"></div>
        </div>
      </div>
      <button id="intro-skip">Skip &nbsp;→</button>
    `;

    const insertOverlay = () => {
        if (document.body) {
            document.body.insertBefore(overlay, document.body.firstChild);
            initWebGL();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.insertBefore(overlay, document.body.firstChild);
                initWebGL();
            });
        }
    };
    insertOverlay();

    /* ─── WEBGL SHADER (Matthias Hurrle light-speed, adapted) ─── */
    const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2  resolution;
#define FC gl_FragCoord.xy
#define R  resolution
#define T  time
#define hue(a) (.6+.6*cos(6.3*(a)+vec3(0,83,21)))

float rnd(float a){
  vec2 p=fract(a*vec2(12.9898,78.233));
  p+=dot(p,p*345.);
  return fract(p.x*p.y);
}
vec3 pattern(vec2 uv){
  vec3 col=vec3(0.);
  for(float i=.0;i++<20.;){
    float a=rnd(i);
    vec2 n=vec2(a,fract(a*34.56));
    vec2 p=sin(n*(T+7.)+T*.5);
    float d=dot(uv-p,uv-p);
    col+=.00125/d*hue(dot(uv,uv)+i*.125+T)*vec3(0.62,0.78,1.0);
  }
  return col;
}
void main(void){
  vec2 uv=(FC-.5*R)/min(R.x,R.y);
  float b=length(uv);
  float a=atan(uv.x,uv.y);
  uv=vec2(a*5./6.28318,.05/tan(b)+T);
  uv=fract(uv)-.5;
  vec3 col=pattern(uv*2.4);
  col*=1.0-smoothstep(0.3,1.2,b*0.8);
  O=vec4(col,1.);
}`;

    const VERT = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position=vec4(position,0.0,1.0); }`;

    let gl = null, program = null, uTime = null, uRes = null, rafId = null;
    let startTime = null;

    function initWebGL() {
        const canvas = document.getElementById('intro-canvas');
        if (!canvas) return;
        gl = canvas.getContext('webgl2');
        if (!gl) return;

        const compile = (type, src) => {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src); gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.warn('[IntroLoader] Shader:', gl.getShaderInfoLog(sh));
                gl.deleteShader(sh); return null;
            }
            return sh;
        };
        const vs = compile(gl.VERTEX_SHADER, VERT);
        const fs = compile(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return;

        program = gl.createProgram();
        gl.attachShader(program, vs); gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn('[IntroLoader] Link:', gl.getProgramInfoLog(program)); return;
        }
        gl.useProgram(program);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        uTime = gl.getUniformLocation(program, 'time');
        uRes = gl.getUniformLocation(program, 'resolution');

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(canvas.clientWidth * dpr);
            canvas.height = Math.floor(canvas.clientHeight * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uRes, canvas.width, canvas.height);
        };
        window.addEventListener('resize', resize);
        resize();

        startTime = performance.now();

        /* Slow the shader: multiply by 0.00040 so swirl is languid */
        const loop = (t) => {
            rafId = requestAnimationFrame(loop);
            gl.useProgram(program);
            gl.uniform1f(uTime, (t - startTime) * 0.00040);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        gl.clearColor(0, 0, 0, 1);
        rafId = requestAnimationFrame(loop);
    }

    /* ─── PROGRESS — organic 3-phase fill ───────────────────────
       Phase A: 0 → 40%  fast   (every 100ms, +4%)
       Phase B: 40 → 85% slow   (every 200ms, +1%)
       Phase C: hold at 85% until real page load fires          */
    let progress = 0;
    const pb = () => document.getElementById('intro-progress-bar');

    let intervalA = setInterval(() => {
        progress = Math.min(progress + 4, 40);
        const el = pb(); if (el) el.style.width = progress + '%';
        if (progress >= 40) { clearInterval(intervalA); startPhaseB(); }
    }, 100);

    function startPhaseB() {
        const intervalB = setInterval(() => {
            progress = Math.min(progress + 1, 85);
            const el = pb(); if (el) el.style.width = progress + '%';
            if (progress >= 85) clearInterval(intervalB);
            // Phase C: just holds here — finish() snaps to 100%
        }, 200);
    }

    /* ─── DISMISS ──────────────────────────────────────────────── */
    let dismissed = false;
    let pageLoaded = false;
    let introStart = performance.now();

    function finish() {
        if (dismissed) return;
        dismissed = true;

        // Snap to 100%
        const el = pb();
        if (el) { el.style.transition = 'width 0.4s ease'; el.style.width = '100%'; }

        // Short breath, then phase-1: canvas fades (0.6s)
        setTimeout(() => {
            overlay.classList.add('canvas-fade');

            // phase-2: whole overlay dissolves after canvas fade (0.6s later)
            setTimeout(() => {
                overlay.classList.add('fade-out');
                if (rafId) cancelAnimationFrame(rafId);

                overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 2000);
            }, 650);
        }, 400);
    }

    /* Minimum 4 000 ms display; waits for real load too */
    window.addEventListener('load', () => {
        pageLoaded = true;
        const elapsed = performance.now() - introStart;
        const MIN = 4000;
        setTimeout(finish, Math.max(0, MIN - elapsed));
    });

    /* Skip — only clickable after CSS animation shows it at 1.5s */
    document.addEventListener('click', e => {
        if (e.target && e.target.id === 'intro-skip') finish();
    });

    window.IntroLoader = { finish };
})();