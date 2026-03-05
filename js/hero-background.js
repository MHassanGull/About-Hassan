/**
 * ═══════════════════════════════════════════════════════════════
 * ANTIGRAVITY HERO BACKGROUND — WebGL2 Particle Wave
 * Performance Optimized | GPU-Driven | Manual Matrix Math
 * ═══════════════════════════════════════════════════════════════
 */

class AntigravityHeroBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`[HeroWave] Canvas #${canvasId} not found`);
            return;
        }

        this.gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false });
        if (!this.gl) {
            console.warn('[HeroWave] WebGL2 not supported');
            return;
        }

        this.program = null;
        this.lastTime = 0;
        this.startTime = performance.now();
        this.isActive = false;
        this.rafId = null;
        this.uTimeValue = 0; // Manual accumulator for slow, meditative motion

        // Configuration
        this.isMobile = window.innerWidth < 768;
        this.gridSize = this.isMobile ? 70 : 120; // Refined grid size
        this.particleCount = this.gridSize * this.gridSize;

        this.init();
    }

    init() {
        this.setupShaders();
        this.setupBuffers();
        this.setupMatrices();
        this.setupEvents();
        this.setupObserver();
        this.resize();

        // Start animation if it's already in viewport
        if (this._isElementInViewport(this.canvas)) {
            this.isActive = true;
            this.animate();
        }
    }

    setupShaders() {
        const vsSource = `#version 300 es
        precision mediump float;
        in vec3 position;
        in float scale;
        uniform float uTime;
        uniform mat4 uProjection;
        uniform mat4 uView;
        void main() {
            vec3 p = position;
            // Wave motion: flow on Y based on X and Z
            p.y += (sin(p.x + uTime) * 0.5) + (cos(p.z + uTime) * 0.1) * 2.0;
            vec4 mvPos = uView * vec4(p, 1.0);
            // Perspective point size calculation — sharpened min size
            gl_PointSize = max(2.0, scale * 15.0 * (1.0 / -mvPos.z));
            gl_Position = uProjection * mvPos;
        }`;

        const fsSource = `#version 300 es
        precision mediump float;
        uniform vec3 uColor;
        out vec4 fragColor;
        void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            // Crisp hard edges
            if (dist > 0.45) discard;
            fragColor = vec4(uColor, 0.6);
        }`;

        const vs = this._compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this._compileShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vs);
        this.gl.attachShader(this.program, fs);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program Link Fail:', this.gl.getProgramInfoLog(this.program));
        }
    }

    setupBuffers() {
        const positions = new Float32Array(this.particleCount * 3);
        const scales = new Float32Array(this.particleCount);

        const gap = 0.35; // Increased spread
        const offset = ((this.gridSize - 1) * gap) / 2; // Centering formula ix * gap - ((amountX * gap) / 2)

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const idx = (i * this.gridSize + j);
                positions[idx * 3 + 0] = i * gap - offset; // X
                positions[idx * 3 + 1] = 0;                // Y
                positions[idx * 3 + 2] = j * gap - offset; // Z
                scales[idx] = 0.1 + Math.random() * 0.1;
            }
        }

        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        const posBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        const posLoc = this.gl.getAttribLocation(this.program, 'position');
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);

        const scaleBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, scaleBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, scales, this.gl.STATIC_DRAW);
        const scaleLoc = this.gl.getAttribLocation(this.program, 'scale');
        this.gl.enableVertexAttribArray(scaleLoc);
        this.gl.vertexAttribPointer(scaleLoc, 1, this.gl.FLOAT, false, 0, 0);

        this.vao = vao;
    }

    setupMatrices() {
        this.uTimeLoc = this.gl.getUniformLocation(this.program, 'uTime');
        this.uProjLoc = this.gl.getUniformLocation(this.program, 'uProjection');
        this.uViewLoc = this.gl.getUniformLocation(this.program, 'uView');
        this.uColorLoc = this.gl.getUniformLocation(this.program, 'uColor');

        // View Matrix: Camera at [0, 7, 6] looking at [0, 0, 0]
        this.viewMatrix = this._lookAt(new Float32Array([0, 7, 6]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]));
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('themechange', () => this.updateColors());

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._stopAnimation();
            } else if (this._isElementInViewport(this.canvas)) {
                this.isActive = true;
                this.animate();
            }
        });
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isActive = true;
                    this.animate();
                } else {
                    this._stopAnimation();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.canvas);
    }

    resize() {
        this.isMobile = window.innerWidth < 768;
        // Sharpened resolution: 0.8x on desktop, 0.5x on mobile
        const dpr = window.devicePixelRatio || 1;
        const resMultiplier = this.isMobile ? 0.5 : 0.8;
        this.canvas.width = this.canvas.clientWidth * dpr * resMultiplier;
        this.canvas.height = this.canvas.clientHeight * dpr * resMultiplier;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Projection Matrix: FOV 85, Near 0.01, Far 1000
        const aspect = this.canvas.width / this.canvas.height;
        this.projectionMatrix = this._perspective(85 * (Math.PI / 180), aspect, 0.01, 1000);

        this.updateColors();
    }

    updateColors() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.isDark = theme === 'dark';
        this.particleColor = this.isDark ? new Float32Array([1, 1, 1]) : new Float32Array([0, 0, 0]);

        const gl = this.gl;
        const c = this.isDark ? 0 : 1;
        gl.clearColor(c, c, c, 1.0);
    }

    animate(now) {
        if (!this.isActive) return;

        // 30 FPS Lock
        if (now - this.lastTime < 33) {
            this.rafId = requestAnimationFrame((t) => this.animate(t));
            return;
        }
        this.lastTime = now;

        const gl = this.gl;
        gl.useProgram(this.program);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Meditative slow motion
        this.uTimeValue += 0.015;
        gl.uniform1f(this.uTimeLoc, this.uTimeValue);

        gl.uniformMatrix4fv(this.uProjLoc, false, this.projectionMatrix);
        gl.uniformMatrix4fv(this.uViewLoc, false, this.viewMatrix);
        gl.uniform3fv(this.uColorLoc, this.particleColor);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.POINTS, 0, this.particleCount);

        this.rafId = requestAnimationFrame((t) => this.animate(t));
    }

    _stopAnimation() {
        this.isActive = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /* ─── Helper Matrix Functions ─── */
    _lookAt(eye, center, up) {
        const z = this._normalize(this._subtract(eye, center));
        const x = this._normalize(this._cross(up, z));
        const y = this._cross(z, x);
        return new Float32Array([
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -this._dot(x, eye), -this._dot(y, eye), -this._dot(z, eye), 1
        ]);
    }

    _perspective(fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ]);
    }

    _normalize(v) {
        const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return l > 0.00001 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0];
    }
    _subtract(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    _cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    _dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

    _compileShader(type, src) {
        const sh = this.gl.createShader(type);
        this.gl.shaderSource(sh, src);
        this.gl.compileShader(sh);
        if (!this.gl.getShaderParameter(sh, this.gl.COMPILE_STATUS)) {
            console.error('Shader Compile Fail:', this.gl.getShaderInfoLog(sh));
            this.gl.deleteShader(sh);
            return null;
        }
        return sh;
    }

    _isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (rect.top <= window.innerHeight && rect.bottom >= 0);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AntigravityHeroBackground('hero-gradient-canvas');
    });
} else {
    new AntigravityHeroBackground('hero-gradient-canvas');
}
