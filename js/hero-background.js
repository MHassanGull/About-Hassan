/**
 * ═══════════════════════════════════════════════════════════════
 * ANTIGRAVITY HERO BACKGROUND - Interactive Animated Mesh Gradient
 * GPU-Optimized | Theme-Aware | Mouse-Reactive
 * ═══════════════════════════════════════════════════════════════
 */

class AntigravityHeroBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80; // Balanced for performance
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.isAnimating = false;

        // Theme-aware colors (will update automatically)
        this.colors = {
            primary: null,
            secondary: null,
            tertiary: null
        };

        this.init();
    }

    // Extract colors from CSS variables
    getThemeColors() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);

        this.colors.primary = computedStyle.getPropertyValue('--accent-primary').trim();
        this.colors.secondary = computedStyle.getPropertyValue('--accent-secondary').trim();
        this.colors.tertiary = computedStyle.getPropertyValue('--accent-tertiary').trim();

        // Fallback colors if variables don't exist
        if (!this.colors.primary) this.colors.primary = '#6366f1';
        if (!this.colors.secondary) this.colors.secondary = '#10b981';
        if (!this.colors.tertiary) this.colors.tertiary = '#8b5cf6';
    }

    // Initialize canvas and particles
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Smooth mouse tracking
        window.addEventListener('mousemove', (e) => {
            this.mouse.x += (e.clientX - this.mouse.x) * 0.1;
            this.mouse.y += (e.clientY - this.mouse.y) * 0.1;
        });

        // Touch support
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x += (e.touches[0].clientX - this.mouse.x) * 0.1;
                this.mouse.y += (e.touches[0].clientY - this.mouse.y) * 0.1;
            }
        }, { passive: true });

        // Listen for theme changes
        window.addEventListener('themechange', () => {
            this.getThemeColors();
        });

        this.createParticles();
        this.getThemeColors();
        this.animate();
    }

    // Resize canvas to match window
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Create particle mesh
    createParticles() {
        this.particles = [];
        const spacing = 120; // Distance between particles
        const cols = Math.ceil(this.canvas.width / spacing) + 1;
        const rows = Math.ceil(this.canvas.height / spacing) + 1;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.particles.push({
                    baseX: j * spacing,
                    baseY: i * spacing,
                    x: j * spacing,
                    y: i * spacing,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.3 + 0.1
                });
            }
        }
    }

    // Update particle positions
    updateParticles() {
        this.particles.forEach(p => {
            // Mouse attraction/repulsion
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 200;

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                p.x -= (dx / distance) * force * 15;
                p.y -= (dy / distance) * force * 15;
            }

            // Gentle float back to base position
            p.x += (p.baseX - p.x) * 0.05;
            p.y += (p.baseY - p.y) * 0.05;

            // Subtle drift
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        });
    }

    // Draw gradient mesh
    drawMesh() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Create dynamic gradient background
        const gradient = this.ctx.createRadialGradient(
            this.mouse.x, this.mouse.y, 0,
            this.mouse.x, this.mouse.y, this.canvas.width * 0.5
        );

        // Use theme colors with low opacity
        gradient.addColorStop(0, this.hexToRgba(this.colors.primary, 0.08));
        gradient.addColorStop(0.5, this.hexToRgba(this.colors.secondary, 0.05));
        gradient.addColorStop(1, this.hexToRgba(this.colors.tertiary, 0.03));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections between nearby particles (mesh effect)
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.hexToRgba(this.colors.primary, opacity);
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });

            // Draw particle dots
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.hexToRgba(this.colors.secondary, p1.opacity);
            this.ctx.fill();
        });

        // Overlay glow effect near mouse
        const mouseGlow = this.ctx.createRadialGradient(
            this.mouse.x, this.mouse.y, 0,
            this.mouse.x, this.mouse.y, 300
        );
        mouseGlow.addColorStop(0, this.hexToRgba(this.colors.tertiary, 0.1));
        mouseGlow.addColorStop(1, 'transparent');

        this.ctx.fillStyle = mouseGlow;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Convert hex to rgba
    hexToRgba(hex, alpha) {
        // Handle CSS color formats
        if (hex.startsWith('rgb')) {
            const match = hex.match(/\d+/g);
            if (match && match.length >= 3) {
                return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
            }
        }

        // Handle hex
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Animation loop
    animate() {
        this.updateParticles();
        this.drawMesh();
        requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AntigravityHeroBackground('hero-gradient-canvas');
    });
} else {
    new AntigravityHeroBackground('hero-gradient-canvas');
}
