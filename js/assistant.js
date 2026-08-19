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
  const gate       = wrap.querySelector('[data-assistant-gate]');
  const gateStatus = gate && gate.querySelector('[data-gate-status]');

  const LEAD_KEY   = 'ai_visitor';
  const WEB3FORMS  = 'https://api.web3forms.com/submit';
  const ACCESS_KEY = '1e8ee232-587b-40f2-9e5d-cde7cf815432';

  /* First name, capitalised. Only touches a leading lowercase letter, so
     non-Latin scripts and deliberate casing are left alone. */
  function firstName(full) {
    const f = String(full || '').trim().split(/\s+/)[0] || '';
    return f ? f.charAt(0).toUpperCase() + f.slice(1) : '';
  }

  function getLead() {
    try { return JSON.parse(localStorage.getItem(LEAD_KEY) || 'null'); }
    catch (_) { return null; }
  }

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
    if (pending) {
      // Three animated dots instead of a literal "Typing" label. Assigning
      // textContent later replaces them, so the reply path needs no change.
      el.setAttribute('aria-label', 'Assistant is typing');
      for (let i = 0; i < 3; i++) el.appendChild(document.createElement('i'));
    } else {
      el.textContent = text;
    }
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
    // No "Cleared" banner and no second greeting: the empty transcript is
    // the confirmation, and the visitor was already greeted by name.
    say('bot', "Ask me anything about Hassan's projects, stack, or availability.");
    input.focus();
  }

  /* ── Open / close ───────────────────────────────────────── */
  function setOpen(open) {
    wrap.classList.toggle('is-open', open);
    if (!open) return;

    const lead = getLead();
    wrap.classList.toggle('needs-lead', !lead);

    if (!lead) {
      if (gate) gate.querySelector('input').focus();
      return;
    }
    if (!log.childElementCount) {
      const who = firstName(lead.name);
      say('bot', (who ? 'Hi ' + who + '. ' : 'Hi. ') +
                 "Ask me anything about Hassan's projects, stack, or availability.");
    }
    input.focus();
  }

  /* Lead capture — the details go to Hassan by email via the same
     Web3Forms endpoint the contact form uses, then chat unlocks. */
  if (gate) {
    gate.addEventListener('submit', async e => {
      e.preventDefault();
      const btn   = gate.querySelector('button[type="submit"]');
      const name  = gate.querySelector('#lead-name').value.trim();
      const email = gate.querySelector('#lead-email').value.trim();
      const phone = gate.querySelector('#lead-phone').value.trim();

      if (!name || !email || !phone) { setGate('Please fill in all three.', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setGate('That email does not look right.', 'error'); return; }
      if (phone.replace(/[^\d]/g, '').length < 7) { setGate('That phone number looks too short.', 'error'); return; }

      btn.disabled = true;
      setGate('Sending…');
      try {
        const res = await fetch(WEB3FORMS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: ACCESS_KEY,
            subject: 'New chat lead from Portfolio',
            from_name: 'Portfolio assistant',
            name: name, email: email, phone: phone,
            message: name + ' started a conversation with the portfolio assistant.'
          })
        });
        const json = await res.json().catch(() => ({}));
        if (!json.success) throw new Error(json.message || 'send failed');

        try { localStorage.setItem(LEAD_KEY, JSON.stringify({ name: name, email: email, phone: phone })); }
        catch (_) { /* private mode — chat still unlocks for this visit */ }

        setGate('');
        gate.reset();
        wrap.classList.remove('needs-lead');
        say('bot', 'Got that, ' + firstName(name) + '. How can I help you?');
        input.focus();
      } catch (err) {
        setGate('Could not send that. Please try again.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function setGate(text, state) {
    if (!gateStatus) return;
    gateStatus.textContent = text;
    if (state) gateStatus.dataset.state = state; else delete gateStatus.dataset.state;
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
        body: JSON.stringify({
          message: msg,
          sessionId: sessionId(),
          visitorName: (getLead() || {}).name || ''
        })
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
