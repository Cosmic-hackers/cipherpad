/**
 * CipherPad — open.js
 * Password-only unlock page.
 * Reads note id + token from the URL fragment (#id=...&token=...).
 */

(async () => {
  'use strict';

  const form          = document.getElementById('openForm');
  const passwordInput = document.getElementById('unlockPassword');
  const unlockBtn     = document.getElementById('unlockBtn');
  const openTitle     = document.getElementById('openTitle');
  const openDesc      = document.getElementById('openDesc');

  /* ── Error helpers ─────────────────────────────────────── */
  function showError(msg) {
    const el   = document.getElementById('unlockError');
    const span = document.getElementById('unlockErrorText');
    if (span) span.textContent = msg;
    if (el)   { el.style.display = 'flex'; }
  }
  function hideError() {
    const el = document.getElementById('unlockError');
    if (el) el.style.display = 'none';
  }

  /* ── Parse URL fragment ─────────────────────────────────── */
  const fragment = parseFragment(window.location.hash);
  const noteId   = fragment.id    || null;
  const token    = fragment.token || null;

  // No valid shared link — show helpful message and disable form
  if (!noteId || !token) {
    if (openTitle) openTitle.innerHTML = 'Invalid link.';
    if (openDesc)  openDesc.textContent =
      'This page requires a valid share link. Ask the note creator for the full link.';
    unlockBtn.disabled = true;
    unlockBtn.style.opacity = '.5';
    unlockBtn.style.cursor  = 'not-allowed';
    return;
  }

  // Auto-focus password
  passwordInput.focus();

  /* ── Form submit ────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const password = passwordInput.value.trim();
    if (!password) {
      showError('Please enter the decryption password.');
      return;
    }

    setLoading(true);

    try {
      // Verify token against server and test decryption
      const pad = await PadAPI.getPad(noteId, token);
      await CipherPad.decrypt(pad.ciphertext, pad.salt, pad.iv, password);

      // Success — save token and go to editor
      PadAPI.saveToken(noteId, token);
      window.location.href = `/editor.html#id=${noteId}&token=${encodeURIComponent(token)}`;

    } catch (err) {
      setLoading(false);
      if (err.message && err.message.toLowerCase().includes('decrypt')) {
        showError('Wrong password — could not decrypt. Please try again.');
      } else if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
        showError('Note not found or access denied. The note may have been deleted.');
      } else {
        showError(err.message || 'Failed to load note. Check your connection and try again.');
      }
    }
  });

  /* ── Loading state ──────────────────────────────────────── */
  function setLoading(on) {
    unlockBtn.disabled = on;
    unlockBtn.innerHTML = on
      ? '<div class="spinner"></div> Verifying…'
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Unlock Note`;
  }

  /* ── Password show/hide ─────────────────────────────────── */
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      if (!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      const svg = btn.querySelector('.eye-icon');
      if (svg) {
        svg.innerHTML = show
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
      }
    });
  });

})();
