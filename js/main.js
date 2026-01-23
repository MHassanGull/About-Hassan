document.addEventListener('DOMContentLoaded', () => {

    // --- Prevent Scroll to Hash on Refresh ---
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    // Optional: Clear hash from URL without refreshing
    if (window.location.hash) {
        window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }

    // --- Background Canvas Animation (Mouse Following Lines) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: null, y: null };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(e.x, e.y));
            }
        });

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
                for (let i = 0; i < 1; i++) {
                    particles.push(new Particle(mouse.x, mouse.y));
                }
            }
        }, { passive: true });

        class Particle {
            constructor(x, y) {
                this.x = x || Math.random() * canvas.width;
                this.y = y || Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 2;
                this.speedY = (Math.random() - 0.5) * 2;
                this.color = 'rgba(99, 102, 241, 0.4)';
                this.life = 100;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (particles.length > 100) particles.shift();
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                const dx = mouse.x - particles[i].x;
                const dy = mouse.y - particles[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 * (1 - distance / 150)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                    i--;
                }
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    // --- Typing Effect ---
    const textElement = document.querySelector('.typewriter-text');
    const texts = ["Python Django Developer", "AI Automation Specialist", "Backend Engineer"];
    let count = 0;
    let index = 0;
    let currentText = '';
    let letter = '';

    // --- One-time Database Cleanup (Clearing old test reviews) ---
    if (!localStorage.getItem('reviews_cleaned_v2')) {
        localStorage.removeItem('client_reviews');
        localStorage.setItem('reviews_cleaned_v2', 'true');
    }

    (function type() {
        if (count === texts.length) {
            count = 0;
        }
        currentText = texts[count];
        letter = currentText.slice(0, ++index);

        if (textElement) {
            textElement.textContent = letter;
        }

        if (letter.length === currentText.length) {
            setTimeout(() => {
                // Delete effect (optional) or just wait
                // specific implementation for simple typing forward then clearing
                count++;
                index = 0;
                // A small pause before typing next
            }, 2000);
            // To make it delete, we would need a delete loop. 
            // Let's keep it simple: clear and start next after 2s
        }

        let speed = 100;
        if (letter.length === currentText.length) speed = 2000;

        setTimeout(type, speed);
    })();


    // --- Mobile Menu Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close menu when link is clicked
    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });


    // --- Scroll Active Highlight ---
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links li a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('href').includes(current)) {
                li.classList.add('active');
            }
        });
    });


    // --- Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.animate-ready');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Run once
            }
        });
    }, {
        root: null,
        threshold: 0.15,
        rootMargin: "0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // --- Contact Form Submission ---
    const form = document.getElementById('contact-form');
    const successMsg = document.querySelector('.success-message');
    const errorMsg = document.querySelector('.error-message');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = form.querySelector('button');
            const originalText = btn.textContent;

            // Prepare Data
            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            // Loading State
            btn.textContent = 'Sending...';
            btn.disabled = true;
            successMsg.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
                .then(async (response) => {
                    let json = await response.json();
                    if (response.status == 200) {
                        // Success
                        btn.textContent = originalText;
                        btn.disabled = false;
                        form.reset();
                        successMsg.style.display = 'block';

                        setTimeout(() => {
                            successMsg.style.display = 'none';
                        }, 5000);
                    } else {
                        // Error
                        console.error(response);
                        btn.textContent = originalText;
                        btn.disabled = false;
                        if (errorMsg) {
                            errorMsg.style.display = 'block';
                            errorMsg.innerText = json.message || 'Something went wrong. Please try again.';
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                    btn.textContent = originalText;
                    btn.disabled = false;
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                        errorMsg.innerText = 'Something went wrong. Please check your connection.';
                    }
                });
        });
    }

    // --- Review Modal Logic ---
    const reviewModal = document.getElementById('review-modal');
    const openModalBtn = document.getElementById('open-review-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const reviewForm = document.getElementById('review-form');
    const starRating = document.querySelector('.star-rating');
    const ratingInput = document.getElementById('rating-input');
    const reviewsGrid = document.getElementById('reviews-grid');
    const modalTitle = reviewModal ? reviewModal.querySelector('h3') : null;

    let editingReviewId = null;

    // Identify Visitor (Simple Ownership)
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', visitorId);
    }

    // --- Admin Authentication System ---
    const loginModal = document.getElementById('login-modal');
    const openLoginBtn = document.getElementById('admin-login-btn');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');

    let isAdmin = sessionStorage.getItem('is_admin') === 'true' || new URLSearchParams(window.location.search).get('admin') === 'true';

    function updateAdminUI() {
        if (isAdmin) {
            openLoginBtn.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
            openLoginBtn.classList.add('admin-mode');
        } else {
            openLoginBtn.innerHTML = '<i class="fas fa-lock"></i> Login';
            openLoginBtn.classList.remove('admin-mode');
        }
    }
    updateAdminUI();

    if (openLoginBtn) {
        openLoginBtn.onclick = () => {
            if (isAdmin) {
                if (confirm("Logout from Admin session?")) {
                    isAdmin = false;
                    sessionStorage.removeItem('is_admin');
                    location.reload();
                }
            } else {
                loginModal.style.display = 'block';
            }
        };
    }

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            try {
                const response = await fetch('login.txt');
                const text = await response.text();
                const [storedUser, storedPass] = text.split('\n').map(s => s.trim());

                if (user === storedUser && pass === storedPass) {
                    isAdmin = true;
                    sessionStorage.setItem('is_admin', 'true');
                    loginModal.style.display = 'none';
                    updateAdminUI();
                    location.reload(); // Refresh to show all controls
                } else {
                    loginError.style.display = 'block';
                }
            } catch (err) {
                console.error("Login Error:", err);
            }
        };
    }

    // Open Modal for New Review
    if (openModalBtn) {
        openModalBtn.onclick = () => {
            editingReviewId = null;
            if (modalTitle) modalTitle.innerText = "Share Your Experience";
            reviewForm.reset();
            resetStars();
            reviewModal.style.display = "block";
        };
    }

    // Close Modals
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.onclick = () => {
                reviewModal.style.display = "none";
                if (loginModal) loginModal.style.display = "none";
            };
        });
    }

    window.onclick = (event) => {
        if (event.target == reviewModal) reviewModal.style.display = "none";
        if (event.target == loginModal) loginModal.style.display = "none";
    }

    function resetStars() {
        starRating.querySelectorAll('i').forEach(s => {
            s.classList.replace('fas', 'far');
            s.classList.add('active'); // for reset, we want them far, but keeping consistency with existing logic
            s.classList.remove('active');
            s.classList.replace('fas', 'far');
        });
        ratingInput.value = "";
    }

    // Star Selection
    if (starRating) {
        const stars = starRating.querySelectorAll('i');
        stars.forEach(star => {
            star.onclick = function () {
                const rating = this.getAttribute('data-rating');
                setRating(rating);
            };
        });
    }

    function setRating(rating) {
        ratingInput.value = rating;
        const stars = starRating.querySelectorAll('i');
        stars.forEach(s => {
            if (s.getAttribute('data-rating') <= rating) {
                s.classList.replace('far', 'fas');
                s.classList.add('active');
            } else {
                s.classList.replace('fas', 'far');
                s.classList.remove('active');
            }
        });
    }

    // Handle Review Submission
    if (reviewForm) {
        reviewForm.onsubmit = function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const reviewData = {
                id: editingReviewId || 'rev_' + Date.now(),
                ownerId: editingReviewId ? getReviewOwner(editingReviewId) : visitorId,
                name: formData.get('name'),
                project: formData.get('project'),
                content: formData.get('content'),
                link: formData.get('link'), // Optional link
                rating: formData.get('rating'),
                date: new Date().toLocaleDateString()
            };

            if (editingReviewId) {
                updateReview(reviewData);
            } else {
                saveReview(reviewData);
                addReviewToGrid(reviewData);
            }

            this.reset();
            reviewModal.style.display = "none";
            resetStars();
        };
    }

    function getReviewOwner(id) {
        let reviews = JSON.parse(localStorage.getItem('client_reviews')) || [];
        const found = reviews.find(r => r.id === id);
        return found ? found.ownerId : visitorId;
    }

    function addReviewToGrid(review) {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.setAttribute('data-id', review.id);

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="${i <= review.rating ? 'fas' : 'far'} fa-star"></i>`;
        }

        // Check if current user is owner or admin
        const canControl = review.ownerId === visitorId || isAdmin;
        const controlBtns = canControl ? `
            <div class="review-controls">
                <button title="Edit" class="edit-btn" onclick="openEditModal('${review.id}')"><i class="fas fa-edit"></i></button>
                <button title="Delete" class="delete-btn" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
            </div>
        ` : '';

        const projectDisplay = review.link
            ? `<a href="${review.link}" target="_blank" class="review-project-link">${review.project} <i class="fas fa-external-link-alt" style="font-size: 0.7rem;"></i></a>`
            : review.project;

        card.innerHTML = `
            ${controlBtns}
            <div class="review-stars">${starsHtml}</div>
            <p class="review-text">"${review.content}"</p>
            <div class="review-footer">
                <span class="client-name">${review.name}</span>
                <span class="project-tag">${projectDisplay}</span>
            </div>
        `;

        reviewsGrid.prepend(card);
    }

    // Storage Functions
    function saveReview(review) {
        let reviews = JSON.parse(localStorage.getItem('client_reviews')) || [];
        reviews.push(review);
        localStorage.setItem('client_reviews', JSON.stringify(reviews));
    }

    function updateReview(updatedReview) {
        let reviews = JSON.parse(localStorage.getItem('client_reviews')) || [];
        reviews = reviews.map(r => r.id === updatedReview.id ? updatedReview : r);
        localStorage.setItem('client_reviews', JSON.stringify(reviews));
        location.reload(); // Quick refresh to update the grid
    }

    window.deleteReview = function (id) {
        if (!confirm("Are you sure you want to delete this review?")) return;
        let reviews = JSON.parse(localStorage.getItem('client_reviews')) || [];
        reviews = reviews.filter(r => r.id !== id);
        localStorage.setItem('client_reviews', JSON.stringify(reviews));
        document.querySelector(`.review-card[data-id="${id}"]`).remove();
    };

    window.openEditModal = function (id) {
        let reviews = JSON.parse(localStorage.getItem('client_reviews')) || [];
        const review = reviews.find(r => r.id === id);
        if (!review) return;

        editingReviewId = id;
        if (modalTitle) modalTitle.innerText = "Edit Your Review";

        reviewForm.querySelector('[name="name"]').value = review.name;
        reviewForm.querySelector('[name="project"]').value = review.project;
        reviewForm.querySelector('[name="content"]').value = review.content;
        if (reviewForm.querySelector('[name="link"]')) {
            reviewForm.querySelector('[name="link"]').value = review.link || '';
        }
        setRating(review.rating);

        reviewModal.style.display = "block";
    };

    function loadReviews() {
        let reviews = JSON.parse(localStorage.getItem('client_reviews')) || [];

        // Migration: Give IDs and Legacy tags to reviews created before October 2023 System
        let migrated = false;
        reviews = reviews.map((r, index) => {
            if (!r.id) {
                r.id = 'rev_' + Date.now() + '_' + index;
                migrated = true;
            }
            if (!r.ownerId) {
                r.ownerId = 'legacy'; // Admin can still delete these
                migrated = true;
            }
            return r;
        });

        if (migrated) {
            localStorage.setItem('client_reviews', JSON.stringify(reviews));
        }

        reviews.forEach(review => addReviewToGrid(review));
    }

    loadReviews();
});
