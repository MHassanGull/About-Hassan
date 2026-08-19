/* ══════════════════════════════════════════════════════════════
   HASSAN — assistant.js
   The portfolio assistant: robot buddy trigger + chat panel.
   Talks to the self-hosted n8n workflow (11 nodes → Claude Haiku
   → Pinecone RAG → Firebase RTDB) over a single webhook.
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_URL  = 'https://n8nserver.metaviz.pro/webhook/portfolio-chatbot';
  const SESS_KEY = 'ai_session_id';

  const wrap = document.querySelector('[data-assistant]');
  if (!wrap) return;

  const panel    = wrap.querySelector('.assistant-panel');
  const log      = wrap.querySelector('.assistant-log');
  const form     = wrap.querySelector('.assistant-form');
  const input    = form.querySelector('input');
  const closeBtn = wrap.querySelector('[data-assistant-close]');
  const stage    = wrap.querySelector('.assistant-stage');
  const handle   = wrap.querySelector('.assistant-handle');
  const fallback = wrap.querySelector('.assistant-fallback');
  const clearBtn = wrap.querySelector('[data-assistant-clear]');

  let busy = false;

  /* ── Session ────────────────────────────────────────────── */
  function sessionId() {
    let id = null;
    try { id = localStorage.getItem(SESS_KEY); } catch (_) { /* private mode */ }
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
           'sess-' + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem(SESS_KEY, id); } catch (_) { /* ignore */ }
    }
    return id;
  }

  /* ── Messages ───────────────────────────────────────────── */
  function say(who, text, pending) {
    const el = document.createElement('div');
    el.className = 'msg msg--' + who + (pending ? ' msg--pending' : '');
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  // Strips reasoning tags and normalises dash punctuation to commas,
  // matching the tone rules the n8n system prompt asks for.
  function clean(text) {
    if (!text) return '';
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/\s*[—–]\s*/g, ', ')
      .replace(/ +- +/g, ', ')
      .replace(/, ,/g, ',')
      .trim();
  }

  /* Clearing starts a genuinely new conversation. Wiping only the
     transcript would leave the server-side window memory keyed to the
     same session, so stale context could still steer the next answer. */
  function clearChat() {
    log.textContent = '';
    try { localStorage.removeItem(SESS_KEY); } catch (_) { /* ignore */ }
    busy = false;
    input.disabled = false;
    say('bot', "Cleared. Ask me anything about Hassan's projects, stack, or availability.");
    input.focus();
  }

  /* ── Open / close ───────────────────────────────────────── */
  function setOpen(open) {
    wrap.classList.toggle('is-open', open);
    if (!open) return;
    if (!log.childElementCount) {
      say('bot', "Hi. Ask me anything about Hassan's projects, stack, or availability.");
    }
    input.focus();
  }

  wrap.addEventListener('buddy-click', () => setOpen(!wrap.classList.contains('is-open')));
  wrap.addEventListener('buddy-fail', () => wrap.classList.add('assistant--nogl'));
  if (stage) stage.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
  });
  if (fallback) fallback.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  if (clearBtn) clearBtn.addEventListener('click', clearChat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && wrap.classList.contains('is-open')) setOpen(false);
  });

  // If Three.js never boots (blocked CDN, no WebGL), show the plain button.
  setTimeout(() => {
    if (stage && !stage.querySelector('canvas')) wrap.classList.add('assistant--nogl');
  }, 4000);

  /* ── Send ───────────────────────────────────────────────── */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg || busy) return;

    busy = true;
    say('me', msg);
    input.value = '';
    const pending = say('bot', 'Typing…', true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId: sessionId() })
      });

      if (!res.ok) {
        throw new Error(res.status === 429 || res.status === 503
          ? 'The AI service is at its limit right now. Try again in a moment.'
          : `Request failed (${res.status}).`);
      }

      // The webhook can return an empty body when the agent errors,
      // so parse defensively rather than calling res.json() directly.
      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { reply: raw }; }

      if (data.sessionId) {
        try { localStorage.setItem(SESS_KEY, data.sessionId); } catch (_) { /* ignore */ }
      }

      const reply = clean(data.reply || data.output || data.text || '');
      pending.classList.remove('msg--pending');
      pending.textContent = reply || 'Hmm, I blanked for a second. Mind asking me again?';
    } catch (err) {
      console.error('Assistant:', err);
      pending.classList.remove('msg--pending');
      pending.textContent = err.message.includes('limit')
        ? err.message
        : "I'm having trouble connecting. Please try again in a moment.";
    } finally {
      busy = false;
      input.focus();
    }
  });

  /* ── Drag the widget around ─────────────────────────────── */
  if (handle) {
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

    handle.addEventListener('pointerdown', e => {
      const r = wrap.getBoundingClientRect();
      wrap.style.right = 'auto';
      wrap.style.bottom = 'auto';
      wrap.style.left = r.left + 'px';
      wrap.style.top = r.top + 'px';
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      dragging = true;
      handle.style.cursor = 'grabbing';
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', e => {
      if (!dragging) return;
      const nx = Math.max(6, Math.min(window.innerWidth  - wrap.offsetWidth  - 6, ox + e.clientX - sx));
      const ny = Math.max(6, Math.min(window.innerHeight - wrap.offsetHeight - 6, oy + e.clientY - sy));
      wrap.style.left = nx + 'px';
      wrap.style.top = ny + 'px';
    });

    const stop = () => { dragging = false; handle.style.cursor = 'grab'; };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }
})();
