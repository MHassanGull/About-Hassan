/* ═══════════════════════════════════════════════════════════════
   PREMIUM SKILLS - Smooth Professional Interactions
   ═══════════════════════════════════════════════════════════════
   
   Features:
   - GSAP ScrollTrigger entrance animations (staggered fade-up)
   - Subtle cursor-following 3D parallax
   - Border shimmer timing control
   - Smooth hover transitions
   - 60fps performance optimization
   
   Feel: Understated, elegant, responsive, high-quality
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // MAIN CLASS
    // ═══════════════════════════════════════════════════════════════

    class PremiumSkills {
        constructor() {
            this.container = document.querySelector('.skills-grid-container');
            this.cards = document.querySelectorAll('.skill-card');
            this.svg = document.getElementById('skills-lines-svg');

            if (!this.container || this.cards.length === 0 || !this.svg) {
                return;
            }

            this.isMobile = window.innerWidth < 768;
            this.lines = [];
            this.pulseLines = [];
            this.resizeTimeout = null;

            this.init();
        }

        init() {
            // Force cards to be visible if GSAP isn't used or fails
            this.cards.forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });

            this.setupScrollTrigger();
            this.setupMobileToggle();
            if (!this.isMobile) {
                this.setupCursorParallax();
                // Delay initial line drawing to ensure layout is stable
                setTimeout(() => this.updateLines(), 500);
            }
            this.setupResizeHandler();
        }

        setupMobileToggle() {
            this.cards.forEach(card => {
                card.addEventListener('click', (e) => {
                    if (window.innerWidth < 768) {
                        const isActive = card.classList.contains('active');

                        // Close all other cards
                        this.cards.forEach(c => c.classList.remove('active'));

                        // Toggle current card
                        if (!isActive) {
                            card.classList.add('active');
                        }
                    }
                });
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.skill-card')) {
                    this.cards.forEach(c => c.classList.remove('active'));
                }
            });
        }

        setupScrollTrigger() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

            gsap.registerPlugin(ScrollTrigger);

            gsap.from(this.cards, {
                scrollTrigger: {
                    trigger: this.container,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
                onComplete: () => {
                    if (!this.isMobile) this.updateLines();
                }
            });
        }

        updateLines() {
            this.clearLines();
            if (this.isMobile || !this.container) return;

            const containerRect = this.container.getBoundingClientRect();
            // If container isn't visible or has no size, don't draw
            if (containerRect.width === 0) return;

            const cols = window.getComputedStyle(this.container).gridTemplateColumns.split(' ').length;

            this.cards.forEach((card, i) => {
                const col = i % cols;

                if (col < cols - 1 && i + 1 < this.cards.length) {
                    this.createLine(i, i + 1, containerRect);
                }
                if (i + cols < this.cards.length) {
                    this.createLine(i, i + cols, containerRect);
                }
            });
        }

        createLine(fromIdx, toIdx, containerRect) {
            const fromRect = this.cards[fromIdx].getBoundingClientRect();
            const toRect = this.cards[toIdx].getBoundingClientRect();

            const x1 = (fromRect.left + fromRect.width / 2) - containerRect.left;
            const y1 = (fromRect.top + fromRect.height / 2) - containerRect.top;
            const x2 = (toRect.left + toRect.width / 2) - containerRect.left;
            const y2 = (toRect.top + toRect.height / 2) - containerRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', 'skill-line');
            line.dataset.from = fromIdx;
            line.dataset.to = toIdx;

            const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            pulse.setAttribute('x1', x1);
            pulse.setAttribute('y1', y1);
            pulse.setAttribute('x2', x2);
            pulse.setAttribute('y2', y2);
            pulse.setAttribute('class', 'skill-line line-pulse');
            pulse.style.animationDelay = `${Math.random() * 5}s`;

            this.svg.appendChild(line);
            this.svg.appendChild(pulse);
            this.lines.push(line);
            this.pulseLines.push(pulse);
        }

        clearLines() {
            if (this.svg) {
                while (this.svg.firstChild) {
                    if (this.svg.firstChild.nodeName !== 'defs') {
                        this.svg.removeChild(this.svg.firstChild);
                    } else {
                        break; // Keep defs
                    }
                }
            }
            this.lines = [];
            this.pulseLines = [];
        }

        setupCursorParallax() {
            this.cards.forEach((card, index) => {
                card.addEventListener('mouseenter', () => this.highlightLines(index));
                card.addEventListener('mousemove', (e) => this.updateParallax(card, e));
                card.addEventListener('mouseleave', () => {
                    this.resetParallax(card);
                    this.resetLines();
                });
            });
        }

        highlightLines(cardIndex) {
            this.lines.forEach(line => {
                if (line.dataset.from == cardIndex || line.dataset.to == cardIndex) {
                    line.classList.add('bright');
                    line.classList.remove('faded');
                } else {
                    line.classList.add('faded');
                    line.classList.remove('bright');
                }
            });
        }

        resetLines() {
            this.lines.forEach(line => line.classList.remove('bright', 'faded'));
        }

        updateParallax(card, e) {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            // Update custom properties for the CSS glow effect
            card.style.setProperty('--mouse-x', `${x * 100}%`);
            card.style.setProperty('--mouse-y', `${y * 100}%`);

            const moveX = (x - 0.5) * 16; // Increased intensity for better feel
            const moveY = (y - 0.5) * 16;

            card.style.transform = `translateY(-10px) rotateX(${-moveY}deg) rotateY(${moveX}deg) scale(1.02)`;
            card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
        }

        resetParallax(card) {
            card.style.transform = 'translateY(0) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            // Reset position variables
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
                        if (this.isMobile) {
                            this.clearLines();
                            this.cards.forEach(card => this.resetParallax(card));
                        } else {
                            this.updateLines();
                        }
                    } else if (!this.isMobile) {
                        this.updateLines();
                    }
                }, 400);
            });
        }
    }

    const initSkills = () => {
        new PremiumSkills();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSkills);
    } else {
        initSkills();
    }
})();
