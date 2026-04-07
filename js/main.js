/* ═══════════════════════════════════════════════════════════════
   HASSAN PORTFOLIO — main.js (Firebase Module)
   Reviews system + Contact form + Admin auth
   PRESERVED: All Firebase credentials, Firestore rules, endpoints
   ═══════════════════════════════════════════════════════════════ */

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
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
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "firebase/storage";

// ── Firebase Config (DO NOT MODIFY) ──────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBaKx-44S1kzci7svdUMzGXbcQ9aSdLtdw",
    authDomain: "portfolio-reviews-31ea5.firebaseapp.com",
    projectId: "portfolio-reviews-31ea5",
    storageBucket: "portfolio-reviews-31ea5.firebasestorage.app",
    messagingSenderId: "179982247451",
    appId: "1:179982247451:web:b8cb608b39728e6cb3fabe",
    measurementId: "G-Q318KMHD8T"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ── Module-Level State ────────────────────────────────────────
let currentUser = null;
let isAdmin = false;
let editingReviewId = null;

// ── DOMContentLoaded ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // ── Element References ──────────────────────────────
    const reviewsGrid = document.getElementById('reviews-grid');
    const reviewModal = document.getElementById('review-modal');
    const loginModal = document.getElementById('login-modal');
    const openModalBtn = document.getElementById('open-review-modal');
    const openLoginBtn = document.getElementById('admin-login-btn');
    const reviewForm = document.getElementById('review-form');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    const starRating = document.querySelector('.star-rating');
    const ratingInput = document.getElementById('rating-input');
    const modalTitle = reviewModal?.querySelector('h3');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const contactForm = document.getElementById('contact-form');
    const successMsg = document.querySelector('.success-message');
    const errorMsg = document.querySelector('.error-message');

    // ── Firebase Auth ────────────────────────────────────
    signInAnonymously(auth).catch(err => console.error('Auth Error:', err));

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            isAdmin = (user.email === 'projectsbuilding55@gmail.com');
        } else {
            currentUser = null;
            isAdmin = false;
            signInAnonymously(auth);
        }
        updateAdminUI();
        console.log('Auth:', user?.email || 'Anonymous', isAdmin ? '[ADMIN]' : '[VISITOR]');
    });

    function updateAdminUI() {
        if (!openLoginBtn) return;
        if (isAdmin) {
            openLoginBtn.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
            openLoginBtn.classList.add('admin-mode');
        } else {
            openLoginBtn.innerHTML = '<i class="fas fa-lock"></i> Login';
            openLoginBtn.classList.remove('admin-mode');
        }
    }

    // ── Admin Login ──────────────────────────────────────
    if (openLoginBtn) {
        openLoginBtn.onclick = () => {
            if (isAdmin) {
                if (confirm('Logout from Admin session?')) signOut(auth);
            } else if (loginModal) {
                loginModal.style.display = 'block';
            }
        };
    }

    if (loginForm) {
        loginForm.onsubmit = async e => {
            e.preventDefault();
            const email = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                if (loginModal) loginModal.style.display = 'none';
            } catch (err) {
                console.error('Login Error:', err);
                if (loginError) { loginError.style.display = 'block'; loginError.innerText = 'Invalid credentials. Please try again.'; }
            }
        };
    }

    window.logoutAdmin = () => {
        if (confirm('Logout from Admin session?')) signOut(auth);
    };

    // ── Review Modal ──────────────────────────────────────
    if (openModalBtn) {
        openModalBtn.onclick = () => {
            editingReviewId = null;
            if (modalTitle) modalTitle.innerText = 'Share Your Experience';
            reviewForm?.reset();
            resetStars();
            if (reviewModal) reviewModal.style.display = 'block';
        };
    }

    closeModalBtns.forEach(btn => {
        btn.onclick = () => {
            if (reviewModal) reviewModal.style.display = 'none';
            if (loginModal) loginModal.style.display = 'none';
        };
    });

    window.onclick = e => {
        if (e.target === reviewModal) reviewModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
    };

    // ── Stars ─────────────────────────────────────────────
    function resetStars() {
        if (!starRating) return;
        starRating.querySelectorAll('i').forEach(s => {
            s.className = 'far fa-star'; s.classList.remove('active');
        });
        if (ratingInput) ratingInput.value = '';
    }

    // Avatar Picker Logic
    const avatarOptions = document.querySelectorAll('.avatar-option-btn');
    const selectedAvatarInput = document.getElementById('selected-avatar');
    const avatarFileInput = document.getElementById('review-avatar');

    if (avatarOptions.length > 0) {
        avatarOptions.forEach(btn => {
            btn.addEventListener('click', function () {
                // Remove selected from others
                avatarOptions.forEach(b => b.classList.remove('selected'));
                // Add to this
                this.classList.add('selected');
                selectedAvatarInput.value = this.getAttribute('data-avatar');
                // Clear file input if they had one
                avatarFileInput.value = "";
            });
        });
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                // Clear picker selection if file is chosen
                avatarOptions.forEach(b => b.classList.remove('selected'));
                selectedAvatarInput.value = "";
            }
        });
    }

    function setRating(rating) {
        if (!starRating || !ratingInput) return;
        ratingInput.value = rating;
        starRating.querySelectorAll('i').forEach(s => {
            const on = parseInt(s.dataset.rating) <= parseInt(rating);
            s.className = on ? 'fas fa-star active' : 'far fa-star';
        });
    }

    if (starRating) {
        starRating.querySelectorAll('i').forEach(star => {
            star.onclick = function () { setRating(this.dataset.rating); };
        });
    }

    // ── Review Submission ─────────────────────────────────
    if (reviewForm) {
        reviewForm.onsubmit = async function (e) {
            e.preventDefault();
            if (!currentUser) {
                alert('Please wait for the connection to stabilize and try again.');
                signInAnonymously(auth);
                return;
            }

            const fd = new FormData(this);
            const btn = this.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerText;

            btn.disabled = true;
            btn.innerText = 'Processing...';

            try {
                let avatarUrl = fd.get('selected-avatar') || 'assets/avatars/avatar1.png';
                const avatarFile = fd.get('avatar');

                // Handle Avatar Upload if a file is selected
                if (avatarFile && avatarFile.size > 0) {
                    btn.innerText = "Uploading Image...";
                    const storageRef = ref(storage, `reviews/avatars/${Date.now()}_${avatarFile.name}`);
                    const uploadTask = await uploadBytesResumable(storageRef, avatarFile);
                    avatarUrl = await getDownloadURL(uploadTask.ref);
                }

                const reviewData = {
                    name: fd.get('name'),
                    projectName: fd.get('project'),
                    description: fd.get('content'),
                    link: fd.get('link') || "",
                    rating: parseInt(fd.get('rating')) || 5,
                    avatar: avatarUrl,
                    userId: currentUser.uid,
                    createdAt: serverTimestamp()
                };

                if (editingReviewId) {
                    await updateDoc(doc(db, 'reviews', editingReviewId), reviewData);
                } else {
                    await addDoc(collection(db, 'reviews'), reviewData);
                }

                this.reset();
                resetStars();
                if (reviewModal) reviewModal.style.display = 'none';
            } catch (err) {
                console.error('Review save error:', err);
                alert('Failed to save review. ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerText = editingReviewId ? 'Update Review' : 'Submit Review';
                editingReviewId = null;
            }
        };
    }

    // ── Load Reviews → ReviewStack ────────────────────────
    function loadReviews() {
        if (!document.getElementById('reviews-stack') && !reviewsGrid) return;
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        onSnapshot(q, snapshot => {
            const reviews = [];
            snapshot.forEach(d => reviews.push({ id: d.id, ...d.data() }));

            // Expose admin state for card builder in ReviewStack
            window._portfolioIsAdmin = isAdmin;

            if (window.ReviewStack) {
                window.ReviewStack.load(reviews);
            } else {
                // Plain fallback
                if (!reviewsGrid) return;
                reviewsGrid.innerHTML = '';
                if (!reviews.length) {
                    reviewsGrid.innerHTML = '<p style="text-align:center;opacity:0.5;padding:40px">No reviews yet. Be the first!</p>';
                    return;
                }
                reviews.forEach(r => addReviewFallback(r));
            }
        });
    }

    // Minimal fallback renderer (shown if ReviewStack unavailable)
    function addReviewFallback(review) {
        if (!reviewsGrid) return;
        const card = document.createElement('div');
        card.className = 'review-card';
        card.style.cssText = 'position:relative;transform:none;opacity:1;pointer-events:all;margin-bottom:20px';
        card.dataset.id = review.id;
        card.dataset.link = review.link || '';

        const stars = Array.from({ length: 5 }, (_, i) =>
            `<i class="${i < (review.rating || 0) ? 'fas' : 'far'} fa-star"></i>`).join('');

        const projectDisplay = review.link
            ? `<a href="${review.link}" target="_blank" class="review-project-link">${review.projectName}</a>`
            : review.projectName;

        const controls = isAdmin ? `
            <div class="review-controls">
                <button class="edit-btn" onclick="openEditModal('${review.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
            </div>` : '';

        card.innerHTML = `
            ${controls}
            <div class="review-stars">${stars}</div>
            <p class="review-text">"${review.description}"</p>
            <div class="review-footer">
                <span class="client-name">${review.name}</span>
                <span class="project-tag">${projectDisplay}</span>
            </div>`;
        reviewsGrid.appendChild(card);
    }

    loadReviews(); // Always load — admin controls shown per card based on isAdmin

    // ── Global Review Actions ─────────────────────────────
    window.deleteReview = async function (id) {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await deleteDoc(doc(db, 'reviews', id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Only admin can delete reviews.');
        }
    };

    window.openEditModal = function (id) {
        // Find card in DOM — could be in either stack or fallback grid
        const card = document.querySelector(`.review-card[data-id="${id}"]`);
        if (!card || !reviewModal) return;

        editingReviewId = id;
        if (modalTitle) modalTitle.innerText = 'Edit Review';

        // Handle both new card structure (review-card-header) and old fallback
        const nameEl = card.querySelector('.client-name');
        const projectEl = card.querySelector('.review-project-link') || card.querySelector('.project-tag');
        const textEl = card.querySelector('.review-text');
        const rating = card.querySelectorAll('.review-stars .fas').length;
        const link = card.dataset.link || '';
        const avImg = card.querySelector('.review-avatar img');
        const avSrc = avImg ? avImg.getAttribute('src') : '';

        if (reviewForm) {
            reviewForm.querySelector('[name="name"]').value = nameEl?.innerText || '';
            reviewForm.querySelector('[name="project"]').value = projectEl?.innerText?.replace(/\s*↗\s*$/, '').trim() || '';
            const cleanText = textEl?.innerText.replace(/^\s*"|"\s*$/g, '').replace(/\+ Read more$/, '').trim() || '';
            reviewForm.querySelector('[name="content"]').value = cleanText;
            reviewForm.querySelector('[name="link"]').value = link;
            if (typeof setRating === 'function') setRating(rating);

            // Sync Avatar Picker
            const avInput = reviewForm.querySelector('[name="avatar"]');
            const avBtns = reviewForm.querySelectorAll('.avatar-option-btn');
            if (avInput) avInput.value = avSrc;
            
            avBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.avatar === avSrc);
            });

            // Handle custom uploads
            const avPreviewWrap = document.getElementById('avatar-preview-wrap');
            const avPreview = document.getElementById('avatar-preview');
            if (avSrc.startsWith('data:') && avPreviewWrap && avPreview) {
                avPreview.src = avSrc;
                avPreviewWrap.style.display = 'block';
                avBtns.forEach(btn => btn.classList.remove('active'));
            }

            reviewModal.style.display = 'block';
        }
    };

    // ── Contact Form ──────────────────────────────────────
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = contactForm.querySelector('#email').value;
            const cc = contactForm.querySelector('#country-code')?.value || '';
            const phoneNum = contactForm.querySelector('#phone-number')?.value.trim() || '';
            const fullPhone = contactForm.querySelector('#full-phone');

            if (errorMsg) { errorMsg.style.display = 'none'; errorMsg.innerText = ''; }

            // Email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerText = 'Please enter a valid email address.'; }
                return;
            }

            // Phone validation
            if (phoneNum) {
                const cleaned = phoneNum.replace(/[\s-]/g, '');
                if (!/^\d+$/.test(cleaned)) {
                    if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerText = 'Phone number must contain only digits.'; }
                    return;
                }
                if (cleaned.length < 7) {
                    if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerText = 'Phone number is too short.'; }
                    return;
                }
                if (fullPhone) fullPhone.value = `${cc} ${phoneNum}`;
            }

            const btn = contactForm.querySelector('button[type="submit"]');
            const orig = btn.querySelector('span')?.textContent || btn.textContent;
            btn.disabled = true;
            if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Sending...';
            else btn.textContent = 'Sending...';
            if (successMsg) successMsg.style.display = 'none';

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
            })
                .then(async res => {
                    const json = await res.json();
                    btn.disabled = false;
                    if (btn.querySelector('span')) btn.querySelector('span').textContent = orig;
                    else btn.textContent = orig;

                    if (res.status === 200) {
                        contactForm.reset();
                        if (successMsg) { successMsg.style.display = 'block'; setTimeout(() => successMsg.style.display = 'none', 5000); }
                    } else {
                        if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerText = json.message || 'Something went wrong.'; }
                    }
                })
                .catch(err => {
                    console.error('Contact form error:', err);
                    btn.disabled = false;
                    if (btn.querySelector('span')) btn.querySelector('span').textContent = orig;
                    else btn.textContent = orig;
                    if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerText = 'Please check your connection and try again.'; }
                });
        });
    }

    // Call loadReviews immediately at Startup
    loadReviews();
});