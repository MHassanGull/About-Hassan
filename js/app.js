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
        this.colors = { primary: '#6366f1', secondary: '#10b981', tertiary: '#8b5cf6' };
        this.init();
    }

    getThemeColors() {
        const cs = getComputedStyle(document.documentElement);
        this.colors.primary = cs.getPropertyValue('--accent-primary').trim() || '#6366f1';
        this.colors.secondary = cs.getPropertyValue('--accent-secondary').trim() || '#10b981';
        this.colors.tertiary = cs.getPropertyValue('--accent-tertiary').trim() || '#8b5cf6';
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

        // 25s ceiling — protects against an unresponsive n8n workflow leaving the user
        // staring at a typing indicator forever.
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 25000);

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, sessionId: getSessionId() }),
                signal: ac.signal
            });
            clearTimeout(timer);

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
            clearTimeout(timer);
            console.error('Chatbot Fetch Exception:', err);
            setLoading(false);
            let reply;
            if (err.name === 'AbortError') {
                reply = "The assistant is taking longer than expected to respond. The backend may be down — please try again in a moment.";
            } else if (err.message && err.message.includes('limit reached')) {
                reply = err.message;
            } else {
                reply = "I'm having trouble connecting. Please try again in a moment.";
            }
            appendMessage('ai', reply);
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

    /* ── TESTIMONIALS ENGINE — Scroll-Driven Stack (vanilla port) ─
       Public API: window.ReviewStack.{load,refresh}(reviews)
       - Up to 5 cards stacked with small Y offsets at rest
       - Scroll-driven animation: each card translates up + fades as
         user scrolls through its sub-range of the section
       - Section height set via --review-count + data-multi on the
         outer .reviews-scroll-track; inner .reviews-sticky stays in
         view while cards animate
       - Single-review case: no scroll trigger, single centered card
       - Pagination dots: click to scroll-jump to that review's range
    ─────────────────────────────────────────────────────────── */
    window.ReviewStack = (() => {
        const stack       = document.getElementById('reviews-stack');
        const navEl       = document.getElementById('reviews-nav');
        const hintEl      = document.getElementById('reviews-hint');
        const scrollTrack = document.getElementById('reviews-scroll-track');
        const THEMES      = ['violet', 'blue', 'cyan', 'gold', 'pink', 'emerald'];
        const MAX_VISIBLE = 5;
        const PREFERS_REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let allReviews = [];
        let topIndex = 0;
        let scrollHandler = null;
        let resizeHandler = null;

        function themeFor(name) {
            const s = String(name || 'anonymous');
            let h = 0;
            for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
            return THEMES[Math.abs(h) % THEMES.length];
        }
        function themeOf(review) {
            const a = review.avatar;
            if (a && typeof a === 'string' && a.startsWith('theme-')) {
                const key = a.slice(6);
                if (THEMES.includes(key)) return key;
            }
            return themeFor(review.name);
        }
        function initialsOf(name) {
            if (!name) return '?';
            const w = String(name).replace(/[^A-Za-z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
            if (!w.length) return '?';
            if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
            return (w[0][0] + w[w.length - 1][0]).toUpperCase();
        }
        function isUploadedImage(src) {
            if (!src) return false;
            return src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://');
        }
        function escapeHtml(s) {
            return String(s ?? '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
        function buildStars(rating) {
            const r = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
            return Array.from({ length: 5 }, (_, i) =>
                `<i class="${i < r ? 'fas' : 'far'} fa-star" aria-hidden="true"></i>`
            ).join('');
        }
        function avatarHTML(review) {
            if (isUploadedImage(review.avatar)) {
                return `<img src="${escapeHtml(review.avatar)}" alt="" loading="lazy">`;
            }
            return escapeHtml(initialsOf(review.name));
        }
        function roleHTML(review) {
            // Prefer the explicit profession field; fall back to projectName
            // for legacy reviews written before the profession field existed.
            const txt = escapeHtml(review.profession || review.projectName || '');
            if (!txt) return '';
            return review.link
                ? `<a class="t-card__role" href="${escapeHtml(review.link)}" target="_blank" rel="noopener noreferrer">${txt}<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
                : `<span class="t-card__role">${txt}</span>`;
        }
        function controlsHTML(review) {
            if (!window._portfolioIsAdmin) return '';
            return `
                <div class="t-card__controls">
                    <button class="edit-btn"   type="button" data-action="edit"   data-id="${escapeHtml(review.id)}" aria-label="Edit review"><i class="fas fa-edit" aria-hidden="true"></i></button>
                    <button class="delete-btn" type="button" data-action="delete" data-id="${escapeHtml(review.id)}" aria-label="Delete review"><i class="fas fa-trash" aria-hidden="true"></i></button>
                </div>`;
        }

        function buildCard(review, slot, globalIndex) {
            const card = document.createElement('article');
            card.className = 't-card';
            card.dataset.id = review.id;
            card.dataset.link = review.link || '';
            card.dataset.avatar = review.avatar || '';
            card.dataset.profession = review.profession || '';
            card.dataset.project = review.projectName || '';
            card.dataset.pos = String(slot);
            card.setAttribute('role', 'group');
            card.setAttribute('aria-roledescription', 'testimonial');
            if (slot === 0) {
                card.tabIndex = 0;
                card.setAttribute('aria-label', `Testimonial ${globalIndex + 1} of ${allReviews.length}`);
            } else {
                card.setAttribute('aria-hidden', 'true');
            }

            const rating = parseInt(review.rating, 10) || 5;
            card.innerHTML = `
                ${controlsHTML(review)}
                <div class="t-card__rating" role="img" aria-label="${rating} out of 5 stars">${buildStars(rating)}</div>
                <blockquote class="t-card__quote">${escapeHtml(review.description || '')}</blockquote>
                <footer class="t-card__meta">
                    <div class="t-card__avatar" data-theme="${themeOf(review)}" aria-hidden="true">${avatarHTML(review)}</div>
                    <div class="t-card__person">
                        <span class="t-card__name client-name">${escapeHtml(review.name || 'Anonymous')}</span>
                        ${roleHTML(review)}
                    </div>
                </footer>`;
            return card;
        }

        function tearDownScrollDriver() {
            if (scrollHandler) {
                window.removeEventListener('scroll', scrollHandler);
                scrollHandler = null;
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
                resizeHandler = null;
            }
            if (scrollTrack) {
                scrollTrack.removeAttribute('data-multi');
                scrollTrack.style.removeProperty('--review-count');
            }
            // Reset card inline styles
            stack?.querySelectorAll('.t-card').forEach(card => {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.zIndex = '';
                card.style.filter = '';
            });
        }

        function setupScrollDriver() {
            if (!scrollTrack || allReviews.length <= 1 || PREFERS_REDUCE) return;

            scrollTrack.setAttribute('data-multi', 'true');
            scrollTrack.style.setProperty('--review-count', String(allReviews.length));

            const cards = Array.from(stack.querySelectorAll('.t-card'));
            const N = cards.length;
            if (!N) return;

            const update = () => {
                const rect = scrollTrack.getBoundingClientRect();
                const sectionHeight = scrollTrack.offsetHeight;
                const viewportHeight = window.innerHeight;
                const totalScroll = Math.max(1, sectionHeight - viewportHeight);
                const scrolledIn = Math.max(0, -rect.top);
                const progress = Math.min(1, scrolledIn / totalScroll);

                // Hide the hint once user has started scrolling through the section
                if (hintEl && progress > 0.02) hintEl.classList.add('is-hidden');
                if (hintEl && progress < 0.005) hintEl.classList.remove('is-hidden');

                // Front-card index based on scroll progress for nav highlighting
                const frontSlot = Math.min(N - 1, Math.floor(progress * N));

                cards.forEach((card, slot) => {
                    // Each card animates over its sub-range [slot/N, (slot+1)/N]
                    const start = slot / N;
                    const end = (slot + 1) / N;
                    const localProgress = Math.max(0, Math.min(1, (progress - start) / (end - start)));

                    // Rest: stacked with small Y offset based on slot depth
                    const baseY = slot * 8;
                    // Animation target: fly up off-screen
                    const flyY = -viewportHeight * 0.9;
                    const y = baseY + (flyY - baseY) * localProgress;

                    // Opacity: each layer slightly dimmer at rest, fade to 0 on animation
                    const baseOpacity = Math.max(0.55, 1 - slot * 0.10);
                    const opacity = baseOpacity * (1 - localProgress);

                    // Subtle scale-up while flying for added depth
                    const baseScale = Math.max(0.92, 1 - slot * 0.02);
                    const scale = baseScale * (1 + localProgress * 0.04);

                    card.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
                    card.style.opacity = String(opacity);
                    card.style.zIndex = String(50 - slot * 10);
                    card.style.filter = `brightness(${Math.max(0.75, 1 - slot * 0.06)})`;
                });

                // Update nav highlight
                if (navEl) {
                    const buttons = navEl.querySelectorAll('button');
                    const globalIdx = (topIndex + frontSlot) % allReviews.length;
                    buttons.forEach((b, i) => {
                        if (i === globalIdx) b.setAttribute('aria-current', 'true');
                        else b.removeAttribute('aria-current');
                    });
                }
            };

            scrollHandler = () => requestAnimationFrame(update);
            resizeHandler = scrollHandler;
            window.addEventListener('scroll', scrollHandler, { passive: true });
            window.addEventListener('resize', resizeHandler, { passive: true });
            update();
        }

        function renderNav() {
            if (!navEl) return;
            navEl.innerHTML = '';
            if (allReviews.length <= 1) return;
            allReviews.forEach((_, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
                if (i === topIndex) b.setAttribute('aria-current', 'true');
                b.addEventListener('click', () => scrollToReview(i));
                navEl.appendChild(b);
            });
        }

        function scrollToReview(targetIndex) {
            if (!scrollTrack) return;
            const N = Math.min(MAX_VISIBLE, allReviews.length);
            const rect = scrollTrack.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = scrollTrack.offsetHeight;
            const viewportHeight = window.innerHeight;
            const totalScroll = Math.max(1, sectionHeight - viewportHeight);
            // Map target review index to scroll progress (mid-range so card is centered)
            const targetProgress = Math.min(0.95, (targetIndex + 0.4) / N);
            const targetY = sectionTop + targetProgress * totalScroll;
            window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

        function wireAdminButtons() {
            stack.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const action = btn.dataset.action;
                    if (action === 'edit'   && typeof window.openEditModal === 'function') window.openEditModal(id);
                    if (action === 'delete' && typeof window.deleteReview === 'function') window.deleteReview(id);
                });
            });
        }

        function render() {
            if (!stack) return;
            tearDownScrollDriver();
            stack.innerHTML = '';
            stack.classList.toggle('is-empty', !allReviews.length);

            if (!allReviews.length) {
                stack.innerHTML = '<div class="reviews-empty">No reviews yet — be the first to share your experience.</div>';
                if (navEl) navEl.innerHTML = '';
                if (hintEl) hintEl.classList.add('is-hidden');
                return;
            }

            const n = allReviews.length;
            const visibleSlots = Math.min(MAX_VISIBLE, n);
            // Render back→front so DOM order matches default z-index
            for (let slot = visibleSlots - 1; slot >= 0; slot--) {
                const idx = (topIndex + slot) % n;
                stack.appendChild(buildCard(allReviews[idx], slot, idx));
            }

            renderNav();
            wireAdminButtons();
            if (hintEl) hintEl.classList.toggle('is-hidden', n <= 1);

            if (n > 1) setupScrollDriver();
        }

        return {
            load(reviews)    { allReviews = Array.isArray(reviews) ? reviews : []; topIndex = 0; render(); },
            refresh(reviews) { allReviews = Array.isArray(reviews) ? reviews : []; if (topIndex >= allReviews.length) topIndex = 0; render(); }
        };
    })();

    /* ── AVATAR PICKER (CSS theme circles + image upload) ──────── */
    const avatarBtns        = document.querySelectorAll('.theme-btn');
    const avatarInput       = document.getElementById('selected-avatar');
    const avatarUpload      = document.getElementById('review-avatar-upload');
    const avatarPreviewWrap = document.getElementById('avatar-preview-wrap');
    const avatarPreview     = document.getElementById('avatar-preview');
    const removeAvatarBtn   = document.getElementById('remove-avatar');
    const DEFAULT_AVATAR    = 'theme-violet';

    avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            if (avatarInput) avatarInput.value = btn.dataset.avatar || DEFAULT_AVATAR;
            // Clear upload preview when picking a theme
            if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'none';
            if (avatarPreview) avatarPreview.src = '';
            if (avatarUpload) avatarUpload.value = '';
        });
    });

    // Resize uploaded images to a square 256x256 JPEG before storing as base64.
    // Keeps Firestore docs comfortably under the 1MB limit no matter how big
    // the original file is.
    function resizeImageToDataUrl(file, maxDim, quality, cb) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                cb(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => cb(null);
            img.src = e.target.result;
        };
        reader.onerror = () => cb(null);
        reader.readAsDataURL(file);
    }

    if (avatarUpload) {
        avatarUpload.addEventListener('change', () => {
            const file = avatarUpload.files[0];
            if (!file) return;
            if (!/^image\//.test(file.type)) {
                alert('Please pick an image file.');
                avatarUpload.value = '';
                return;
            }
            resizeImageToDataUrl(file, 256, 0.82, (dataUrl) => {
                if (!dataUrl) {
                    alert('Could not read that image — try a different file.');
                    avatarUpload.value = '';
                    return;
                }
                if (avatarPreview) avatarPreview.src = dataUrl;
                if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'block';
                if (avatarInput) avatarInput.value = dataUrl;
                // Deselect theme buttons
                avatarBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
            });
        });
    }
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', () => {
            if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'none';
            if (avatarPreview) avatarPreview.src = '';
            if (avatarUpload) avatarUpload.value = '';
            // Re-select default theme
            if (avatarBtns[0]) {
                avatarBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                avatarBtns[0].classList.add('active');
                avatarBtns[0].setAttribute('aria-pressed', 'true');
            }
            if (avatarInput) avatarInput.value = DEFAULT_AVATAR;
        });
    }

    /* ── CUSTOM COUNTRY PICKER (replaces native <select>) ──────── */
    (function initCountryPicker() {
        const picker  = document.getElementById('country-picker');
        const trigger = document.getElementById('country-picker-trigger');
        const panel   = document.getElementById('country-picker-panel');
        const hidden  = document.getElementById('country-code');
        if (!picker || !trigger || !panel) return;

        const items = Array.from(panel.querySelectorAll('.country-picker__item'));
        const flagEl = trigger.querySelector('.country-picker__flag');
        const codeEl = trigger.querySelector('.country-picker__code');

        function isOpen() { return picker.classList.contains('is-open'); }
        function openPicker() {
            picker.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            const selected = panel.querySelector('.country-picker__item[aria-selected="true"]');
            if (selected) {
                // Scroll the selected item into view inside the panel
                requestAnimationFrame(() => {
                    selected.scrollIntoView({ block: 'nearest' });
                    selected.focus();
                });
            } else if (items[0]) {
                items[0].focus();
            }
        }
        function closePicker() {
            picker.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }
        function selectItem(item) {
            const code = item.dataset.code || '';
            const flag = item.dataset.flag || '🌍';
            if (hidden) hidden.value = code;
            if (flagEl) flagEl.textContent = flag;
            if (codeEl) codeEl.textContent = code || '—';
            items.forEach(b => b.setAttribute('aria-selected', b === item ? 'true' : 'false'));
            closePicker();
            trigger.focus();
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen() ? closePicker() : openPicker();
        });
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isOpen()) openPicker();
            }
        });

        items.forEach((item, idx) => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                selectItem(item);
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    (items[idx + 1] || items[0]).focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    (items[idx - 1] || items[items.length - 1]).focus();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    items[0].focus();
                } else if (e.key === 'End') {
                    e.preventDefault();
                    items[items.length - 1].focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectItem(item);
                }
            });
        });

        // Outside click + Escape closes
        document.addEventListener('click', (e) => {
            if (isOpen() && !picker.contains(e.target)) closePicker();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) {
                closePicker();
                trigger.focus();
            }
        });
    })();

    console.log('🚀 Portfolio fully initialized');
});