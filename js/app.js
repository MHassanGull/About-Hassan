/* ═══════════════════════════════════════════════════════════════
   HASSAN PORTFOLIO — app.js
   Merged: theme-manager + theme-picker + hero-background +
           ai-skill-universe + chatbot + UI enhancements
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   1. ANTIGRAVITY THEME MANAGER
   ───────────────────────────────────────────────────────────── */
const AntigravityThemes = (() => {
    'use strict';

    const THEMES = [
        { id: 'default', name: 'Dark', color: '#030712' },
        { id: 'pure-white', name: 'White', color: '#ffffff' }
    ];

    const STORAGE_KEY = 'antigravity-theme';
    let currentTheme = 'default';

    function init() {
        applyTheme('default', false); // Always start dark (theme persistence disabled)
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) applyTheme(e.newValue || 'default', false);
        });
        console.log('🎨 Antigravity Theme Engine initialized');
    }

    function applyTheme(themeId, save = true) {
        const theme = THEMES.find(t => t.id === themeId);
        if (!theme) return console.error(`Theme "${themeId}" not found`);

        if (themeId === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeId);
        }
        currentTheme = themeId;

        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: themeId, themeName: theme.name }
        }));
        console.log(`✨ Theme: ${theme.name}`);
    }

    function getCurrentTheme() { return currentTheme; }
    function getAllThemes() { return [...THEMES]; }
    function cycleTheme() {
        const idx = THEMES.findIndex(t => t.id === currentTheme);
        applyTheme(THEMES[(idx + 1) % THEMES.length].id);
    }

    return { init, applyTheme, getCurrentTheme, getAllThemes, cycleTheme, THEMES };
})();

window.AntigravityThemes = AntigravityThemes;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AntigravityThemes.init);
} else {
    AntigravityThemes.init();
}

/* ─────────────────────────────────────────────────────────────
   2. THEME TOGGLE UI (Sun/Moon)
   ───────────────────────────────────────────────────────────── */
(function () {
    'use strict';

    const initThemeToggle = () => {
        if (!window.AntigravityThemes) { setTimeout(initThemeToggle, 100); return; }

        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const current = AntigravityThemes.getCurrentTheme();
            const next = current === 'default' ? 'pure-white' : 'default';
            AntigravityThemes.applyTheme(next);
        });

        console.log('☀️/🌙 Theme Toggle initialized');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
})();

/* ─────────────────────────────────────────────────────────────
   3. HERO BACKGROUND CANVAS
   ───────────────────────────────────────────────────────────── */
class AntigravityHeroBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.colors = { primary: '#10b981', secondary: '#ebc24a', tertiary: '#5eead4' };
        this.init();
    }

    getThemeColors() {
        const cs = getComputedStyle(document.documentElement);
        this.colors.primary = cs.getPropertyValue('--accent-primary').trim() || '#10b981';
        this.colors.secondary = cs.getPropertyValue('--accent-secondary').trim() || '#ebc24a';
        this.colors.tertiary = cs.getPropertyValue('--accent-tertiary').trim() || '#5eead4';
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', e => {
            this.mouse.x += (e.clientX - this.mouse.x) * 0.08;
            this.mouse.y += (e.clientY - this.mouse.y) * 0.08;
        });
        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) {
                this.mouse.x += (e.touches[0].clientX - this.mouse.x) * 0.08;
                this.mouse.y += (e.touches[0].clientY - this.mouse.y) * 0.08;
            }
        }, { passive: true });
        window.addEventListener('themechange', () => this.getThemeColors());
        this.createParticles();
        this.getThemeColors();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const spacing = 130;
        const cols = Math.ceil(this.canvas.width / spacing) + 1;
        const rows = Math.ceil(this.canvas.height / spacing) + 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.particles.push({
                    baseX: c * spacing, baseY: r * spacing,
                    x: c * spacing, y: r * spacing,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    size: Math.random() * 2.5 + 0.8,
                    opacity: Math.random() * 0.3 + 0.08
                });
            }
        }
    }

    updateParticles() {
        this.particles.forEach(p => {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxD = 180;
            if (dist < maxD) {
                const force = (maxD - dist) / maxD;
                p.x -= (dx / dist) * force * 12;
                p.y -= (dy / dist) * force * 12;
            }
            p.x += (p.baseX - p.x) * 0.05;
            p.y += (p.baseY - p.y) * 0.05;
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        });
    }

    drawMesh() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const grad = this.ctx.createRadialGradient(
            this.mouse.x, this.mouse.y, 0,
            this.mouse.x, this.mouse.y, this.canvas.width * 0.5
        );
        grad.addColorStop(0, this.hexToRgba(this.colors.primary, 0.07));
        grad.addColorStop(0.5, this.hexToRgba(this.colors.secondary, 0.04));
        grad.addColorStop(1, this.hexToRgba(this.colors.tertiary, 0.02));
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1, i + 8).forEach(p2 => {
                const dx = p1.x - p2.x, dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    const op = (1 - dist / 140) * 0.12;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.hexToRgba(this.colors.primary, op);
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.hexToRgba(this.colors.secondary, p1.opacity);
            this.ctx.fill();
        });

        const glow = this.ctx.createRadialGradient(this.mouse.x, this.mouse.y, 0, this.mouse.x, this.mouse.y, 280);
        glow.addColorStop(0, this.hexToRgba(this.colors.tertiary, 0.09));
        glow.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glow;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    hexToRgba(hex, alpha) {
        if (!hex) return `rgba(99,102,241,${alpha})`;
        if (hex.startsWith('rgb')) {
            const m = hex.match(/\d+/g);
            if (m && m.length >= 3) return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
        }
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    animate() {
        this.updateParticles();
        this.drawMesh();
        requestAnimationFrame(() => this.animate());
    }
}

/* ─────────────────────────────────────────────────────────────
   4. PREMIUM SKILLS (AI Skill Universe)
   ───────────────────────────────────────────────────────────── */
(function () {
    'use strict';

    class PremiumSkills {
        constructor() {
            this.container = document.querySelector('.skills-grid-container');
            this.cards = document.querySelectorAll('.skill-card');
            this.svg = document.getElementById('skills-lines-svg');
            if (!this.container || !this.cards.length || !this.svg) return;

            this.isMobile = window.innerWidth < 768;
            this.lines = []; this.pulseLines = [];
            this.resizeTimeout = null;
            this.init();
        }

        init() {
            this.cards.forEach(c => { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; });
            this.setupScrollTrigger();
            this.setupMobileToggle();
            if (!this.isMobile) {
                this.setupCursorParallax();
                setTimeout(() => this.updateLines(), 600);
            }
            this.setupResizeHandler();
        }

        setupMobileToggle() {
            this.cards.forEach(card => {
                card.addEventListener('click', () => {
                    if (window.innerWidth < 768) {
                        const wasActive = card.classList.contains('active');
                        this.cards.forEach(c => c.classList.remove('active'));
                        if (!wasActive) card.classList.add('active');
                    }
                });
            });
            document.addEventListener('click', e => {
                if (!e.target.closest('.skill-card')) {
                    this.cards.forEach(c => c.classList.remove('active'));
                }
            });
        }

        setupScrollTrigger() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            gsap.registerPlugin(ScrollTrigger);
            gsap.from(this.cards, {
                scrollTrigger: { trigger: this.container, start: 'top 85%', toggleActions: 'play none none none' },
                opacity: 0, y: 36, duration: 0.9, stagger: 0.1, ease: 'power3.out',
                onComplete: () => { if (!this.isMobile) this.updateLines(); }
            });
        }

        updateLines() {
            this.clearLines();
            if (this.isMobile || !this.container) return;
            const cRect = this.container.getBoundingClientRect();
            if (cRect.width === 0) return;
            const cols = window.getComputedStyle(this.container).gridTemplateColumns.split(' ').length;
            this.cards.forEach((card, i) => {
                const col = i % cols;
                if (col < cols - 1 && i + 1 < this.cards.length) this.createLine(i, i + 1, cRect);
                if (i + cols < this.cards.length) this.createLine(i, i + cols, cRect);
            });
        }

        createLine(a, b, cRect) {
            const rA = this.cards[a].getBoundingClientRect();
            const rB = this.cards[b].getBoundingClientRect();
            const x1 = (rA.left + rA.width / 2) - cRect.left;
            const y1 = (rA.top + rA.height / 2) - cRect.top;
            const x2 = (rB.left + rB.width / 2) - cRect.left;
            const y2 = (rB.top + rB.height / 2) - cRect.top;

            const line = this._makeLine(x1, y1, x2, y2, 'skill-line');
            const pulse = this._makeLine(x1, y1, x2, y2, 'skill-line line-pulse');
            pulse.style.animationDelay = `${Math.random() * 5}s`;
            line.dataset.from = a; line.dataset.to = b;

            this.svg.appendChild(line);
            this.svg.appendChild(pulse);
            this.lines.push(line);
            this.pulseLines.push(pulse);
        }

        _makeLine(x1, y1, x2, y2, cls) {
            const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            el.setAttribute('x1', x1); el.setAttribute('y1', y1);
            el.setAttribute('x2', x2); el.setAttribute('y2', y2);
            el.setAttribute('class', cls);
            return el;
        }

        clearLines() {
            while (this.svg && this.svg.lastChild && this.svg.lastChild.nodeName !== 'defs') {
                this.svg.removeChild(this.svg.lastChild);
            }
            this.lines = []; this.pulseLines = [];
        }

        setupCursorParallax() {
            this.cards.forEach((card, idx) => {
                card.addEventListener('mouseenter', () => this.highlightLines(idx));
                card.addEventListener('mousemove', e => this.updateParallax(card, e));
                card.addEventListener('mouseleave', () => { this.resetParallax(card); this.resetLines(); });
            });
        }

        highlightLines(idx) {
            this.lines.forEach(l => {
                if (l.dataset.from == idx || l.dataset.to == idx) {
                    l.classList.add('bright'); l.classList.remove('faded');
                } else {
                    l.classList.add('faded'); l.classList.remove('bright');
                }
            });
        }
        resetLines() { this.lines.forEach(l => l.classList.remove('bright', 'faded')); }

        updateParallax(card, e) {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            card.style.setProperty('--mouse-x', `${x * 100}%`);
            card.style.setProperty('--mouse-y', `${y * 100}%`);
            const mx = (x - 0.5) * 14, my = (y - 0.5) * 14;
            card.style.transform = `translateY(-10px) rotateX(${-my}deg) rotateY(${mx}deg) scale(1.02)`;
            card.style.transition = 'transform 0.1s ease-out';
        }

        resetParallax(card) {
            card.style.transform = 'translateY(0) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        }

        setupResizeHandler() {
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    const wasMobile = this.isMobile;
                    this.isMobile = window.innerWidth < 768;
                    if (wasMobile !== this.isMobile) {
                        if (this.isMobile) { this.clearLines(); this.cards.forEach(c => this.resetParallax(c)); }
                        else this.updateLines();
                    } else if (!this.isMobile) this.updateLines();
                }, 400);
            });
        }
    }

    const initSkills = () => new PremiumSkills();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSkills);
    } else {
        initSkills();
    }
})();

/* ─────────────────────────────────────────────────────────────
   5. AI CHATBOT WIDGET
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const chatTrigger = document.getElementById('chat-trigger');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const typingInd = document.getElementById('typing-indicator');
    const sendBtn = document.getElementById('chat-send-btn');

    if (!chatTrigger) return; // Not on index page

    const API_URL = 'https://n8nserver.metaviz.pro/webhook/portfolio-chatbot';
    const SESS_KEY = 'ai_session_id';
    let isTyping = false;

    function getSessionId() {
        let id = localStorage.getItem(SESS_KEY);
        if (!id) { id = crypto.randomUUID(); localStorage.setItem(SESS_KEY, id); }
        return id;
    }

    function toggleChat() {
        const active = chatWidget.classList.toggle('active');
        chatTrigger.classList.toggle('idle', !active);
        if (active) {
            chatInput.focus();
            if (!chatMessages.querySelector('.message-bubble')) {
                setTimeout(() => appendMessage('ai', "Hi! I'm Hassan's AI assistant. Ask me anything about his skills or projects!"), 500);
            }
        }
    }

    async function sendMessage() {
        const msg = chatInput.value.trim();
        if (!msg || isTyping) return;
        appendMessage('user', msg);
        chatInput.value = '';
        setLoading(true);

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, sessionId: getSessionId() })
            });

            if (!res.ok) {
                const errBody = await res.text();
                console.error('Chatbot API Error:', res.status, errBody);
                if (res.status === 429 || res.status === 503) throw new Error("AI service limit reached. Please try again later.");
                throw new Error(`API error: ${res.status}`);
            }

            const data = await res.json();
            if (data.sessionId && data.sessionId !== getSessionId()) localStorage.setItem(SESS_KEY, data.sessionId);

            setLoading(false);
            appendMessage('ai', processAIResponse(data.reply));
        } catch (err) {
            console.error('Chatbot Fetch Exception:', err);
            setLoading(false);
            appendMessage('ai', err.message.includes('limit reached') ? err.message : "I'm having trouble connecting. Please try again in a moment.");
        }
    }

    function appendMessage(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${sender}-message`;
        bubble.textContent = text;
        chatMessages.insertBefore(bubble, typingInd);
        setTimeout(() => chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' }), 50);
    }

    function processAIResponse(text) {
        if (!text) return "I'm sorry, I couldn't process that.";
        let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        return clean || "I'm here to help!";
    }

    function setLoading(loading) {
        isTyping = loading;
        typingInd.style.display = loading ? 'flex' : 'none';
        if (loading) chatMessages.scrollTop = chatMessages.scrollHeight;
        sendBtn.disabled = loading;
        chatInput.disabled = loading;
        if (!loading) chatInput.focus();
    }

    chatTrigger.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);
    chatForm.addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

    console.log('🤖 Chatbot initialized');
});

/* ─────────────────────────────────────────────────────────────
   6. MAIN DOM — INIT ALL CORE FEATURES
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

    /* ── HERO BACKGROUND ────────────────── */
    const heroBg = new AntigravityHeroBackground('hero-gradient-canvas');

    /* ── BG CANVAS PARTICLES ────────────── */
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
        const ctx = bgCanvas.getContext('2d', { alpha: true });
        let particles = [];
        let mouse = { x: null, y: null };
        let isActive = true;
        let raf = null;
        let particleColor = 'rgba(99,102,241,0.4)';

        const updateColor = () => {
            const c = getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim();
            if (c) particleColor = c;
        };
        window.addEventListener('themechange', updateColor);
        updateColor();

        const resize = () => { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; updateColor(); };
        let rsz; window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(resize, 200); });
        resize();

        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX; mouse.y = e.clientY;
            if (isActive) { for (let i = 0; i < 2; i++) particles.push(new Particle(e.clientX, e.clientY)); }
        }, { passive: true });
        window.addEventListener('touchmove', e => {
            if (e.touches.length) {
                const t = e.touches[0];
                mouse.x = t.clientX; mouse.y = t.clientY;
                if (isActive) particles.push(new Particle(t.clientX, t.clientY));
            }
        }, { passive: true });

        class Particle {
            constructor(x, y) {
                this.x = x; this.y = y;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 1.5;
                this.speedY = (Math.random() - 0.5) * 1.5;
                this.life = 100;
                this.color = particleColor;
            }
            update() {
                this.x += this.speedX; this.y += this.speedY;
                if (this.size > 0.2) this.size -= 0.01;
                this.life--;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const animate = () => {
            if (!isActive) return;
            ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            if (particles.length > 150) particles.shift();
            for (let i = 0; i < particles.length; i++) {
                particles[i].update(); particles[i].draw();
                const dx = mouse.x - particles[i].x, dy = mouse.y - particles[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    const alpha = 0.12 * (1 - dist / 110);
                    ctx.strokeStyle = particleColor.replace(/[\d\.]+\)$/, `${alpha})`);
                    ctx.lineWidth = 0.7;
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
                if (particles[i].life <= 0) { particles.splice(i, 1); i--; }
            }
            raf = requestAnimationFrame(animate);
        };

        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isActive = entry.isIntersecting;
                if (isActive) animate(); else cancelAnimationFrame(raf);
            });
        }, { threshold: 0.01 }).observe(bgCanvas);
    }

    /* ── CUSTOM CURSOR ──────────────────── */
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (dot && ring && window.matchMedia('(hover: hover)').matches) {
        let mx = 0, my = 0, rx = 0, ry = 0;
        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        document.addEventListener('mousedown', () => dot.classList.add('clicking'));
        document.addEventListener('mouseup', () => dot.classList.remove('clicking'));

        // Ring follows with lag
        const trackRing = () => {
            rx += (mx - rx) * 0.14;
            ry += (my - ry) * 0.14;
            dot.style.left = mx + 'px'; dot.style.top = my + 'px';
            ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
            requestAnimationFrame(trackRing);
        };
        trackRing();

        // Expand ring on hover
        document.querySelectorAll('a, button, .skill-card, .project-card, .view-details-btn, .contact-info-item')
            .forEach(el => {
                el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
                el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
            });
    }

    /* ── SCROLL PROGRESS ────────────────── */
    const progress = document.getElementById('scroll-progress');
    if (progress) {
        window.addEventListener('scroll', () => {
            const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            progress.style.width = `${Math.min(pct, 100)}%`;
        }, { passive: true });
    }

    /* ── HEADER SCROLL EFFECT ───────────── */
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 60);
        }, { passive: true });
    }

    /* ── PREVENT SCROLL TO HASH ON REFRESH */
    if (history.scrollRestoration) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    // Clear hash and force scroll to top on load
    if (window.location.hash) {
        window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);

    /* ── TYPEWRITER (original) ──────────────── */
    const typeEl = document.querySelector('.typewriter-text');
    const texts = ['Python Django Developer', 'AI Automation Specialist', 'Backend Engineer'];
    let tIdx = 0, charIdx = 0, typingActive = true;

    function type() {
        if (!typingActive || !typeEl) return;
        if (tIdx >= texts.length) tIdx = 0;
        const current = texts[tIdx];
        typeEl.textContent = current.slice(0, ++charIdx);
        if (charIdx >= current.length) {
            setTimeout(() => { tIdx++; charIdx = 0; if (typingActive) type(); }, 2000);
        } else {
            setTimeout(type, 100);
        }
    }

    const typeSection = typeEl ? (typeEl.closest('section') || typeEl) : null;
    if (typeSection) {
        new IntersectionObserver(entries => {
            entries.forEach(e => {
                typingActive = e.isIntersecting;
                if (typingActive && typeEl && !typeEl.textContent) type();
            });
        }, { threshold: 0.1 }).observe(typeSection);
    }
    if (typeEl) type();

    /* ── MOBILE NAV ─────────────────────── */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links li a').forEach(a => {
            a.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('active'); });
        });
    }

    /* ── NAV ACTIVE HIGHLIGHT ───────────── */
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links li a');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - s.clientHeight / 3) current = s.id;
        });
        navItems.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href')?.includes(current)) a.classList.add('active');
        });
    }, { passive: true });

    /* ── SCROLL REVEAL ──────────────────── */
    const revealObs = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.animate-ready').forEach(el => revealObs.observe(el));

    /* ── MAGNETIC BUTTONS ───────────────── */
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
            btn.style.transform = `translate(${x}px, ${y}px) translateY(-3px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    /* ── NONOGRAM ANIMATED PREVIEW ──────── */
    const nonoGrid = document.getElementById('nono-grid');
    if (nonoGrid) {
        const pattern = [
            1, 0, 1, 0, 1, 0, 1, 0,
            1, 1, 0, 1, 0, 1, 1, 0,
            1, 1, 1, 0, 0, 1, 1, 1,
            0, 1, 1, 1, 1, 1, 0, 1,
            0, 0, 1, 1, 1, 0, 0, 1,
            0, 0, 0, 1, 0, 0, 0, 1
        ];
        const cells = pattern.map(() => {
            const c = document.createElement('div');
            c.className = 'nono-cell';
            nonoGrid.appendChild(c);
            return c;
        });

        let idx = 0;
        const fillNext = () => {
            if (idx < cells.length) {
                if (pattern[idx]) cells[idx].classList.add('filled');
                idx++;
                setTimeout(fillNext, 90);
            } else {
                // Restart after pause
                setTimeout(() => {
                    cells.forEach(c => c.classList.remove('filled'));
                    idx = 0;
                    setTimeout(fillNext, 400);
                }, 2800);
            }
        };

        // Start when card enters viewport
        new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && idx === 0) fillNext();
        }, { threshold: 0.3 }).observe(nonoGrid);
    }

    /* ── STACKING REVIEWS ENGINE ─────────────
       Populated by main.js after Firestore load.
       window.ReviewStack is the public API.
    ─────────────────────────────────────────── */
    window.ReviewStack = (() => {
        let allReviews = [];
        let currentIdx = 0;
        const stack = document.getElementById('reviews-stack');
        const navEl = document.getElementById('stack-nav');
        const EMOJI_MAP = {
            'avatar-m1': '🧔', 'avatar-m2': '👨',
            'avatar-f1': '👩', 'avatar-f2': '🧕', 'avatar-nb': '🧑'
        };

        function buildCard(review) {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.dataset.id = review.id;
            card.dataset.link = review.link || '';

            const stars = Array.from({ length: 5 }, (_, i) =>
                `<i class="${i < (review.rating || 0) ? 'fas' : 'far'} fa-star"></i>`).join('');

            const projectDisplay = review.link
                ? `<a href="${review.link}" target="_blank" class="review-project-link">${review.projectName} <i class="fas fa-external-link-alt"></i></a>`
                : review.projectName;

            // Avatar
            let avatarPath = review.avatar || 'assets/avatars/avatar1.png';
            // Backwards compatibility for old emoji keys
            if (avatarPath === 'avatar-m1') avatarPath = 'assets/avatars/avatar1.png';
            if (avatarPath === 'avatar-m2') avatarPath = 'assets/avatars/avatar2.png';
            if (avatarPath === 'avatar-f1' || avatarPath === 'avatar-f2' || avatarPath === 'avatar-nb') avatarPath = 'assets/avatars/avatar3.png';
            
            const avatarInner = `<img src="${avatarPath}" alt="${review.name}">`;

            const isAdminGlobal = typeof isAdmin !== 'undefined' && window._portfolioIsAdmin;
            const controls = isAdminGlobal ? `
                <div class="review-controls">
                    <button class="edit-btn" onclick="openEditModal('${review.id}')"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
                </div>` : '';

            card.innerHTML = `
                ${controls}
                <div class="review-card-header">
                    <div class="review-avatar">${avatarInner}</div>
                    <div class="review-avatar-info">
                        <div class="client-name">${review.name}</div>
                        <div class="review-stars">${stars}</div>
                    </div>
                </div>
                <div class="review-text">
                    "${review.description}"
                    <button class="read-more-btn">+ Read more</button>
                </div>
                <div class="project-tag">${projectDisplay}</div>`;
            return card;
        }

        function renderStack() {
            if (!stack) return;
            // Clear existing cards
            stack.querySelectorAll('.review-card').forEach(c => c.remove());
            if (!allReviews.length) {
                stack.innerHTML = '<p style="text-align:center;opacity:0.5;padding:40px 20px;">No reviews yet. Be the first!</p>';
                return;
            }

            // Render up to 3 visible cards — but never more than we have
            // distinct reviews, otherwise a single review is drawn 3× and
            // the background copies "ghost" through as doubled text.
            const maxOffset = Math.min(2, allReviews.length - 1);
            for (let offset = maxOffset; offset >= 0; offset--) {
                const idx = (currentIdx + offset) % allReviews.length;
                if (idx < allReviews.length) {
                    const card = buildCard(allReviews[idx]);
                    if (offset === 0) {
                        card.classList.add('stack-0');
                        setupDrag(card);
                    } else if (offset === 1) {
                        card.classList.add('stack-1');
                    } else {
                        card.classList.add('stack-2');
                    }
                    stack.appendChild(card);
                }
            }
            renderDots();
        }

        function renderDots() {
            if (!navEl) return;
            navEl.innerHTML = '';
            allReviews.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'stack-dot' + (i === currentIdx ? ' active' : '');
                dot.addEventListener('click', () => goTo(i));
                navEl.appendChild(dot);
            });
        }

        function goTo(idx) {
            currentIdx = ((idx % allReviews.length) + allReviews.length) % allReviews.length;
            renderStack();
        }

        function advance() { goTo(currentIdx + 1); }

        function setupDrag(card) {
            let startX = 0, startY = 0, currX = 0, isDragging = false;
            const threshold = 80;

            const onStart = (x, y) => {
                startX = x; startY = y; currX = 0;
                isDragging = true;
                card.classList.add('dragging');
            };
            const onMove = (x) => {
                if (!isDragging) return;
                currX = x - startX;
                const rot = currX * 0.08;
                card.style.transform = `translateX(${currX}px) rotate(${rot}deg)`;
                const pct = Math.abs(currX) / threshold;
                card.style.opacity = Math.max(0.4, 1 - pct * 0.5);
            };
            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                card.classList.remove('dragging');
                card.style.transform = ''; card.style.opacity = '';
                if (Math.abs(currX) >= threshold) {
                    card.classList.add(currX < 0 ? 'exit-left' : 'exit-right');
                    setTimeout(() => advance(), 460);
                } else {
                    card.style.transform = '';
                    card.classList.remove('tilt-left', 'tilt-right');
                    // Snap back
                    card.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
                    requestAnimationFrame(() => {
                        card.style.transform = 'rotate(-2deg) translateX(-4px)';
                        setTimeout(() => card.style.transition = '', 400);
                    });
                }
                currX = 0;
            };

            // Mouse
            card.addEventListener('mousedown', e => { if (e.button === 0) onStart(e.clientX, e.clientY); });
            window.addEventListener('mousemove', e => { if (isDragging) onMove(e.clientX); });
            window.addEventListener('mouseup', e => { if (isDragging) onEnd(); });

            // Touch
            card.addEventListener('touchstart', e => { onStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
            card.addEventListener('touchmove', e => { onMove(e.touches[0].clientX); }, { passive: true });
            card.addEventListener('touchend', () => onEnd());
        }

        return {
            load(reviews) { allReviews = reviews; currentIdx = 0; renderStack(); },
            refresh(reviews) { allReviews = reviews; renderStack(); }
        };
    })();

    /* ── AVATAR PICKER ──────────────────────── */
    const avatarBtns = document.querySelectorAll('.avatar-option-btn');
    const avatarInput = document.getElementById('selected-avatar');
    const avatarUpload = document.getElementById('review-avatar-upload');
    const avatarPreviewWrap = document.getElementById('avatar-preview-wrap');
    const avatarPreview = document.getElementById('avatar-preview');
    const removeAvatarBtn = document.getElementById('remove-avatar');

    avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (avatarInput) avatarInput.value = btn.dataset.avatar;
            // Hide upload preview if preset chosen
            if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'none';
            if (avatarPreview) avatarPreview.src = '';
        });
    });

    if (avatarUpload) {
        avatarUpload.addEventListener('change', () => {
            const file = avatarUpload.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (avatarPreview) avatarPreview.src = e.target.result;
                if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'block';
                if (avatarInput) avatarInput.value = e.target.result; // base64 data URL
                // Deselect preset buttons
                avatarBtns.forEach(b => b.classList.remove('active'));
            };
            reader.readAsDataURL(file);
        });
    }
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', () => {
            if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'none';
            if (avatarPreview) avatarPreview.src = '';
            if (avatarUpload) avatarUpload.value = '';
            // Re-select first preset
            if (avatarBtns[0]) { 
                avatarBtns.forEach(b => b.classList.remove('active'));
                avatarBtns[0].classList.add('active'); 
            }
            if (avatarInput) avatarInput.value = 'assets/avatars/avatar1.png';
        });
    }

    console.log('🚀 Portfolio fully initialized');
});