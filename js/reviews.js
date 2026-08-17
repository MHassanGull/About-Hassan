/* ══════════════════════════════════════════════════════════════
   HASSAN — reviews.js
   Firestore-backed testimonials + admin moderation.

   Collection `reviews` is public-read / public-create; only the
   admin email may update or delete (see firestore.rules).
   Document shape — unchanged from the previous build so existing
   records keep rendering:
     { name, projectName, description, link, rating,
       avatar, userId, createdAt }
   ══════════════════════════════════════════════════════════════ */

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/* ── Firebase project (public web config — safe to ship) ──── */
const firebaseConfig = {
  apiKey: 'AIzaSyBaKx-44S1kzci7svdUMzGXbcQ9aSdLtdw',
  authDomain: 'portfolio-reviews-31ea5.firebaseapp.com',
  projectId: 'portfolio-reviews-31ea5',
  storageBucket: 'portfolio-reviews-31ea5.firebasestorage.app',
  messagingSenderId: '179982247451',
  appId: '1:179982247451:web:b8cb608b39728e6cb3fabe',
  measurementId: 'G-Q318KMHD8T'
};

const ADMIN_EMAIL   = 'projectsbuilding55@gmail.com';
const DEFAULT_AVATAR = 'assets/avatars/avatar1.png';

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (_) { /* blocked or unsupported — non-fatal */ }
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

/* ── State ─────────────────────────────────────────────────── */
let reviews    = [];
let index      = 0;
let user       = null;
let isAdmin    = false;
let editingId  = null;
let rating     = 0;
let avatarFile = null;
let avatarPath = DEFAULT_AVATAR;

const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ── Elements ──────────────────────────────────────────────── */
const quoteText   = $('[data-quote-text]');
const quoteName   = $('[data-quote-name]');
const quoteMeta   = $('[data-quote-meta]');
const quoteStars  = $('[data-quote-stars]');
const quoteAvatar = $('[data-quote-avatar]');
const quoteEl     = $('[data-quote]');
const prevBtn     = $('[data-quote-prev]');
const nextBtn     = $('[data-quote-next]');
const adminBox    = $('[data-quote-admin]');

const reviewModal = $('#review-modal');
const reviewForm  = $('#review-form');
const reviewStatus= $('[data-review-status]');
const openReview  = $('[data-review-open]');
const starsBox    = $('[data-stars]');

const loginModal  = $('#login-modal');
const loginForm   = $('#login-form');
const loginStatus = $('[data-login-status]');
const adminBtn    = $('[data-admin-toggle]');

const escape = s => String(s == null ? '' : s);

/* ══ Auth ══════════════════════════════════════════════════ */
signInAnonymously(auth).catch(err => console.error('Anonymous auth:', err));

onAuthStateChanged(auth, current => {
  user = current;
  isAdmin = !!current && current.email === ADMIN_EMAIL;

  if (adminBtn) {
    adminBtn.textContent = isAdmin ? 'Admin · sign out' : 'Admin';
    adminBtn.classList.toggle('is-admin', isAdmin);
  }
  if (adminBox) adminBox.hidden = !isAdmin;

  if (!current) signInAnonymously(auth).catch(() => {});
});

if (adminBtn) {
  adminBtn.addEventListener('click', () => {
    if (isAdmin) {
      if (confirm('Sign out of the admin session?')) signOut(auth);
      return;
    }
    if (loginStatus) loginStatus.textContent = '';
    loginModal.classList.add('is-open');
    loginModal.querySelector('input')?.focus();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#admin-email').value.trim();
    const pass  = $('#admin-password').value;
    if (loginStatus) { loginStatus.textContent = 'Checking…'; delete loginStatus.dataset.state; }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      loginModal.classList.remove('is-open');
      loginForm.reset();
      if (loginStatus) loginStatus.textContent = '';
    } catch (err) {
      console.error('Admin login:', err);
      if (loginStatus) {
        loginStatus.textContent = 'Those credentials did not work.';
        loginStatus.dataset.state = 'error';
      }
    }
  });
}

/* ══ Read ══════════════════════════════════════════════════ */
onSnapshot(
  query(collection(db, 'reviews'), orderBy('createdAt', 'desc')),
  snap => {
    reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (index >= reviews.length) index = 0;
    render();
  },
  err => {
    console.error('Reviews subscription:', err);
    render();
  }
);

function render() {
  if (!quoteText) return;

  const many = reviews.length > 1;
  if (prevBtn) prevBtn.hidden = !many;
  if (nextBtn) nextBtn.hidden = !many;

  if (!reviews.length) {
    quoteText.textContent = 'No reviews yet. If we have worked together, yours would be the first.';
    if (quoteName)   quoteName.textContent = 'Awaiting the first review';
    if (quoteMeta)   quoteMeta.textContent = '';
    if (quoteStars)  quoteStars.hidden = true;
    if (quoteAvatar) quoteAvatar.hidden = true;
    if (adminBox)    adminBox.hidden = true;
    return;
  }

  const r = reviews[index];
  const stars = Math.max(0, Math.min(5, Number(r.rating) || 0));

  const body = escape(r.description);
  quoteText.textContent = body;

  // Step the display size down for longer testimonials so the band
  // stays proportionate instead of becoming a wall of display type.
  if (quoteEl) {
    if (body.length > 320) quoteEl.dataset.len = 'xlong';
    else if (body.length > 150) quoteEl.dataset.len = 'long';
    else delete quoteEl.dataset.len;
  }

  if (quoteName) quoteName.textContent = escape(r.name);

  if (quoteStars) {
    quoteStars.hidden = false;
    quoteStars.textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    quoteStars.setAttribute('aria-label', `${stars} out of 5`);
  }

  if (quoteMeta) {
    quoteMeta.textContent = '';
    const project = escape(r.projectName);
    if (r.link) {
      const a = document.createElement('a');
      a.href = r.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = project + ' ↗';
      quoteMeta.appendChild(a);
    } else {
      quoteMeta.textContent = project;
    }
  }

  if (quoteAvatar) {
    const src = normaliseAvatar(r.avatar);
    quoteAvatar.hidden = !src;
    if (src) { quoteAvatar.src = src; quoteAvatar.alt = escape(r.name); }
  }

  if (adminBox) adminBox.hidden = !isAdmin;
}

// Older records stored emoji keys instead of image paths.
function normaliseAvatar(value) {
  if (!value) return DEFAULT_AVATAR;
  const legacy = {
    'avatar-m1': 'assets/avatars/avatar1.png',
    'avatar-m2': 'assets/avatars/avatar2.png',
    'avatar-f1': 'assets/avatars/avatar3.png',
    'avatar-f2': 'assets/avatars/avatar3.png',
    'avatar-nb': 'assets/avatars/avatar3.png'
  };
  return legacy[value] || value;
}

/* Cross-fade between quotes rather than swapping instantly. */
function step(delta) {
  if (reviews.length < 2) return;
  index = (index + delta + reviews.length) % reviews.length;
  if (!quoteEl) { render(); return; }
  quoteEl.dataset.fading = '';
  setTimeout(() => {
    render();
    delete quoteEl.dataset.fading;
  }, 240);
}

prevBtn?.addEventListener('click', () => step(-1));
nextBtn?.addEventListener('click', () => step(1));

/* ══ Write ═════════════════════════════════════════════════ */
function paintStars(n) {
  $$('[data-star]').forEach(btn => {
    const on = Number(btn.dataset.star) <= n;
    if (on) btn.dataset.on = '';
    else delete btn.dataset.on;
  });
}

if (starsBox) {
  $$('[data-star]').forEach(btn => {
    const value = Number(btn.dataset.star);
    btn.addEventListener('mouseenter', () => paintStars(value));
    btn.addEventListener('focus',      () => paintStars(value));
    btn.addEventListener('click', () => {
      rating = value;
      paintStars(rating);
      $('#review-rating').value = String(rating);
    });
  });
  starsBox.addEventListener('mouseleave', () => paintStars(rating));
}

/* Avatar picker — three presets or one upload. */
function selectPreset(button) {
  $$('[data-avatar]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  avatarPath = button.dataset.avatar;
  avatarFile = null;
  const upload = $('#review-avatar-file');
  if (upload) upload.value = '';
}

$$('[data-avatar]').forEach(btn => btn.addEventListener('click', () => selectPreset(btn)));

$('#review-avatar-file')?.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    setReviewStatus('That image is over 3 MB. Please pick a smaller one.', 'error');
    e.target.value = '';
    return;
  }
  avatarFile = file;
  avatarPath = '';
  $$('[data-avatar]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  setReviewStatus(`Selected ${file.name}`);
});

function setReviewStatus(text, state) {
  if (!reviewStatus) return;
  reviewStatus.textContent = text;
  if (state) reviewStatus.dataset.state = state;
  else delete reviewStatus.dataset.state;
}

function resetForm() {
  reviewForm?.reset();
  editingId = null;
  rating = 0;
  avatarFile = null;
  avatarPath = DEFAULT_AVATAR;
  paintStars(0);
  const first = $('[data-avatar]');
  $$('[data-avatar]').forEach(b => b.setAttribute('aria-pressed', String(b === first)));
  setReviewStatus('');
  const heading = $('[data-review-heading]');
  if (heading) heading.textContent = 'Write a review';
}

openReview?.addEventListener('click', () => {
  resetForm();
  reviewModal.classList.add('is-open');
  $('#review-name')?.focus();
});

/* Admin: edit the review currently on screen. */
$('[data-quote-edit]')?.addEventListener('click', () => {
  const r = reviews[index];
  if (!r) return;

  resetForm();
  editingId = r.id;
  rating = Math.max(0, Math.min(5, Number(r.rating) || 0));

  $('#review-name').value    = escape(r.name);
  $('#review-project').value = escape(r.projectName);
  $('#review-content').value = escape(r.description);
  $('#review-link').value    = escape(r.link);
  $('#review-rating').value  = String(rating);
  paintStars(rating);

  avatarPath = normaliseAvatar(r.avatar);
  $$('[data-avatar]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.avatar === avatarPath)));

  const heading = $('[data-review-heading]');
  if (heading) heading.textContent = 'Edit review';
  reviewModal.classList.add('is-open');
});

$('[data-quote-delete]')?.addEventListener('click', async () => {
  const r = reviews[index];
  if (!r) return;
  if (!confirm(`Delete the review from ${r.name}? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, 'reviews', r.id));
  } catch (err) {
    console.error('Delete review:', err);
    alert('Delete failed. Only the admin account can remove reviews.');
  }
});

reviewForm?.addEventListener('submit', async e => {
  e.preventDefault();

  if (!rating) { setReviewStatus('Please pick a rating.', 'error'); return; }
  if (!user)   { setReviewStatus('Still connecting. Try again in a second.', 'error');
                 signInAnonymously(auth).catch(() => {}); return; }

  const button = reviewForm.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    let avatar = avatarPath || DEFAULT_AVATAR;

    if (avatarFile) {
      setReviewStatus('Uploading image…');
      try {
        const key = `reviews/avatars/${Date.now()}_${avatarFile.name.replace(/[^\w.-]/g, '_')}`;
        const snap = await uploadBytes(ref(storage, key), avatarFile);
        avatar = await getDownloadURL(snap.ref);
      } catch (err) {
        // A failed upload should not lose the written review.
        console.warn('Avatar upload failed, using default:', err);
        avatar = DEFAULT_AVATAR;
      }
    }

    setReviewStatus('Saving…');
    const payload = {
      name:        $('#review-name').value.trim(),
      projectName: $('#review-project').value.trim(),
      description: $('#review-content').value.trim(),
      link:        $('#review-link').value.trim(),
      rating,
      avatar,
      userId:      user.uid
    };

    if (editingId) {
      await updateDoc(doc(db, 'reviews', editingId), payload);
    } else {
      await addDoc(collection(db, 'reviews'), { ...payload, createdAt: serverTimestamp() });
    }

    setReviewStatus('Thank you. Your review is live.', 'ok');
    setTimeout(() => {
      reviewModal.classList.remove('is-open');
      resetForm();
    }, 1400);
  } catch (err) {
    console.error('Save review:', err);
    setReviewStatus('Could not save that. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
});

/* ══ Modal plumbing ════════════════════════════════════════ */
$$('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('is-open');
  });
  modal.querySelector('[data-modal-close]')
    ?.addEventListener('click', () => modal.classList.remove('is-open'));
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $$('.modal.is-open').forEach(m => m.classList.remove('is-open'));
});
