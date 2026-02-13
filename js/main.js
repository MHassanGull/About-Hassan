import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaKx-44S1kzci7svdUMzGXbcQ9aSdLtdw",
    authDomain: "portfolio-reviews-31ea5.firebaseapp.com",
    projectId: "portfolio-reviews-31ea5",
    storageBucket: "portfolio-reviews-31ea5.firebasestorage.app",
    messagingSenderId: "179982247451",
    appId: "1:179982247451:web:b8cb608b39728e6cb3fabe",
    measurementId: "G-Q318KMHD8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Global State
let currentUser = null;
let isAdmin = false;

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

    // --- Background Canvas Animation (Optimized) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d', { alpha: true });
        let particles = [];
        let mouse = { x: null, y: null };
        let isActive = true;
        let animationFrameId = null;

        // Theme-aware particle color
        let particleColor = 'rgba(99, 102, 241, 0.4)';

        const updateParticleColor = () => {
            const style = getComputedStyle(document.documentElement);
            const color = style.getPropertyValue('--particle-color').trim();
            if (color) particleColor = color;
        };

        window.addEventListener('themechange', updateParticleColor);
        updateParticleColor();

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            updateParticleColor();
        };

        // Throttled resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resize, 200);
        });
        resize();

        // Optimized Mouse/Touch tracking
        const handlePointer = (x, y, count) => {
            mouse.x = x;
            mouse.y = y;
            if (isActive) {
                for (let i = 0; i < count; i++) {
                    particles.push(new Particle(x, y));
                }
            }
        };

        window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY, 2), { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handlePointer(e.touches[0].clientX, e.touches[0].clientY, 1);
            }
        }, { passive: true });

        class Particle {
            constructor(x, y) {
                this.x = x || Math.random() * canvas.width;
                this.y = y || Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 1.5;
                this.speedY = (Math.random() - 0.5) * 1.5;
                this.life = 100;
                this.color = particleColor;
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
            if (!isActive) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Limit max particles for performance
            if (particles.length > 150) particles.shift();

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                const dx = mouse.x - particles[i].x;
                const dy = mouse.y - particles[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    let alpha = 0.15 * (1 - distance / 120);
                    let colorWithAlpha = particleColor;

                    if (particleColor.includes('rgba')) {
                        colorWithAlpha = particleColor.replace(/[\d\.]+\)$/g, `${alpha})`);
                    } else {
                        colorWithAlpha = particleColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
                    }

                    ctx.strokeStyle = colorWithAlpha;
                    ctx.lineWidth = 0.8;
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
            animationFrameId = requestAnimationFrame(animate);
        };

        // Intersection Observer to stop animation when not in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isActive = entry.isIntersecting;
                if (isActive) {
                    animate();
                } else {
                    cancelAnimationFrame(animationFrameId);
                }
            });
        }, { threshold: 0.01 });

        observer.observe(canvas);
    }

    // --- Typing Effect ---
    const textElement = document.querySelector('.typewriter-text');
    const texts = ["Python Django Developer", "AI Automation Specialist", "Backend Engineer"];
    let count = 0;
    let index = 0;
    let currentText = '';
    let letter = '';

    // --- Firebase Auth Initialization ---
    signInAnonymously(auth).catch((error) => {
        console.error("Auth Error:", error);
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            isAdmin = (user.email === 'projectsbuilding55@gmail.com');
            updateAdminUI();
            if (isAdmin) loadReviews();
            console.log("Auth State:", user.email || "Anonymous", isAdmin ? "[ADMIN]" : "[VISITOR]");
        } else {
            currentUser = null;
            isAdmin = false;
            updateAdminUI();
            signInAnonymously(auth);
        }
    });

    let typingActive = true;
    function type() {
        if (!typingActive) return;
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
                count++;
                index = 0;
                if (typingActive) type();
            }, 2000);
        } else {
            let speed = 100;
            setTimeout(type, speed);
        }
    }

    const typeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            typingActive = entry.isIntersecting;
            if (typingActive) type();
        });
    }, { threshold: 0.1 });

    if (textElement) {
        typeObserver.observe(textElement.closest('section') || textElement);
    }


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

            // --- Validation Logic ---
            const email = form.querySelector('#email').value;
            const countryCode = form.querySelector('#country-code').value;
            const phoneNumber = form.querySelector('#phone-number').value.trim();
            const fullPhoneInput = form.querySelector('#full-phone');

            // Reset Error
            if (errorMsg) errorMsg.style.display = 'none';

            // Email Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = 'Please enter a valid email address (e.g., user@example.com).';
                }
                return;
            }

            // Phone Validation
            if (phoneNumber) {
                const cleanedPhone = phoneNumber.replace(/[\s-]/g, '');
                if (!/^\d+$/.test(cleanedPhone)) {
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                        errorMsg.innerText = 'Phone number must contain only digits.';
                    }
                    return;
                }
                if (cleanedPhone.length < 7) {
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                        errorMsg.innerText = 'Phone number is too short. Please enter a valid number.';
                    }
                    return;
                }
                fullPhoneInput.value = `${countryCode} ${phoneNumber}`;
            }

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

    // Identify Visitor (Handled by Firebase Auth now)


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
            const email = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            try {
                await signInWithEmailAndPassword(auth, email, pass);
                loginModal.style.display = 'none';
                updateAdminUI();
            } catch (err) {
                console.error("Login Error:", err);
                loginError.style.display = 'block';
                loginError.innerText = "Invalid credentials. Please try again.";
            }
        };
    }

    // Expose Logout function
    window.logoutAdmin = () => {
        if (confirm("Logout from Admin session?")) {
            signOut(auth);
        }
    };

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
        reviewForm.onsubmit = async function (e) {
            e.preventDefault();

            if (!currentUser) {
                alert("Please wait for the connection to stabilize or try again.");
                signInAnonymously(auth); // Try re-signing in
                return;
            }

            const formData = new FormData(this);
            const reviewData = {
                name: formData.get('name'),
                projectName: formData.get('project'),
                description: formData.get('content'),
                link: formData.get('link') || "",
                rating: parseInt(formData.get('rating')),
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            };

            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = "Processing...";

            try {
                if (editingReviewId) {
                    const reviewRef = doc(db, "reviews", editingReviewId);
                    await updateDoc(reviewRef, {
                        ...reviewData,
                        createdAt: serverTimestamp() // Update timestamp on edit? User choice. Let's keep it.
                    });
                } else {
                    await addDoc(collection(db, "reviews"), reviewData);
                }

                this.reset();
                reviewModal.style.display = "none";
                resetStars();
            } catch (error) {
                console.error("Error saving review:", error);
                alert("Failed to save review. " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = editingReviewId ? "Update Review" : "Submit Review";
                editingReviewId = null;
            }
        };
    }

    function addReviewToGrid(review) {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.setAttribute('data-id', review.id);
        card.setAttribute('data-link', review.link || '');

        let starsHtml = '';
        const rating = parseInt(review.rating) || 0;
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`;
        }

        // Check if Admin
        const canControl = isAdmin;

        const controlBtns = canControl ? `
            <div class="review-controls">
                <button title="Edit" class="edit-btn" onclick="openEditModal('${review.id}')"><i class="fas fa-edit"></i></button>
                <button title="Delete" class="delete-btn" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
            </div>
        ` : '';

        const projectDisplay = review.link
            ? `<a href="${review.link}" target="_blank" class="review-project-link">${review.projectName} <i class="fas fa-external-link-alt" style="font-size: 0.7rem;"></i></a>`
            : review.projectName;

        card.innerHTML = `
            ${controlBtns}
            <div class="review-stars">${starsHtml}</div>
            <p class="review-text">"${review.description}"</p>
            <div class="review-footer">
                <span class="client-name">${review.name}</span>
                <span class="project-tag">${projectDisplay}</span>
            </div>
        `;

        reviewsGrid.appendChild(card); // Snapshot is ordered, so we use append
    }

    // --- Global Methods for HTML (Required for modules) ---
    window.deleteReview = async function (id) {
        // Find the review to check ownership locally before bothering Firestore
        const card = document.querySelector(`.review-card[data-id="${id}"]`);
        if (!card) return;

        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            await deleteDoc(doc(db, "reviews", id));
            console.log("Deleted review:", id);
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Only the owner or admin can delete this review.");
        }
    };

    window.openEditModal = async function (id) {
        // We'll find it in the current data
        // Actually it's cleaner to just fetch it or pass data
        const card = document.querySelector(`.review-card[data-id="${id}"]`);
        if (!card) return;

        // For simplicity, we'll use attributes or find in local cache
        // But since we want precision, let's keep it simple
        editingReviewId = id;
        if (modalTitle) modalTitle.innerText = "Edit Your Review";

        // Pre-fill is handled by the state if we had one, but let's grab from UI text
        const name = card.querySelector('.client-name').innerText;
        const project = card.querySelector('.review-project-link') ? card.querySelector('.review-project-link').innerText : card.querySelector('.project-tag').innerText;
        const content = card.querySelector('.review-text').innerText.replace(/^"|"$/g, '');
        const rating = card.querySelectorAll('.review-stars .fas').length;
        const link = card.getAttribute('data-link') || "";

        reviewForm.querySelector('[name="name"]').value = name;
        reviewForm.querySelector('[name="project"]').value = project;
        reviewForm.querySelector('[name="content"]').value = content;
        reviewForm.querySelector('[name="link"]').value = link;
        setRating(rating);

        reviewModal.style.display = "block";
    };

    function loadReviews() {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            reviewsGrid.innerHTML = ""; // Clear grid
            if (snapshot.empty) {
                reviewsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No reviews yet. Be the first!</p>';
                return;
            }
            snapshot.forEach((doc) => {
                const data = doc.data();
                addReviewToGrid({ id: doc.id, ...data });
            });
        });
    }

    loadReviews();
});
