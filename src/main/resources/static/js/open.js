/**
 * CipherPad — open.js
 * Handles the "Open Note" page
 * Parses shared link, validates token, redirects to editor
 */

(async () => {
  'use strict';

  const form         = document.getElementById('openForm');
  const noteLinkInput = document.getElementById('noteLink');
  const passwordInput = document.getElementById('unlockPassword');
  const unlockBtn    = document.getElementById('unlockBtn');
  const unlockError  = document.getElementById('unlockError');
  const sharedInfo   = document.getElementById('sharedLinkInfo');

  // Check if page was opened via shared link (has fragment)
  const fragment = parseFragment(window.location.hash);
  if (fragment.id && fragment.token) {
    // Build the full link to show user
    noteLinkInput.value = window.location.href;
    sharedInfo.style.display = 'flex';
    document.getElementById('linkGroup').style.display = 'none';
    passwordInput.focus();
  }

  /* ------------------------------------------------------------------ */
  /*  Parse various link formats                                          */
  /* ------------------------------------------------------------------ */
  function extractIdAndToken(input) {
    input = input.trim();

    // Try as a URL with fragment
    try {
      let url;
      if (input.startsWith('http')) {
        url = new URL(input);
      } else if (input.includes('/editor.html')) {
        url = new URL('http://x' + (input.startsWith('/') ? '' : '/') + input);
      }
      if (url) {
        const hash = url.hash;
        const params = parseFragment(hash);
        if (params.id && params.token) {
          return { id: params.id, token: params.token };
        }
      }
    } catch (_) {}

    // Try as a plain UUID
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = input.match(uuidRegex);
    if (match) {
      return { id: match[0], token: null };
    }

    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  Form submit                                                         */
  /* ------------------------------------------------------------------ */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    unlockError.classList.add('hidden');

    // Parse link or use fragment
    let noteId, token;

    if (fragment.id && fragment.token) {
      noteId = fragment.id;
      token  = fragment.token;
    } else {
      const parsed = extractIdAndToken(noteLinkInput.value);
      if (!parsed) {
        unlockError.textContent = 'Invalid note link or ID. Please paste the full share link.';
        unlockError.classList.remove('hidden');
        return;
      }
      noteId = parsed.id;
      token  = parsed.token;
    }

    const password = passwordInput.value;
    if (!password) {
      unlockError.textContent = 'Please enter the decryption password.';
      unlockError.classList.remove('hidden');
      return;
    }

    // We can't decrypt here without loading the pad data.
    // Instead, redirect to editor with id+token in fragment.
    // The editor will attempt decryption.
    if (!token) {
      // No token from link — try loading with no token (will fail server-side)
      unlockError.textContent = 'No access token found in the link. Please paste the full share link (including the #... part).';
      unlockError.classList.remove('hidden');
      return;
    }

    setLoading(true);

    try {
      // Quick check: load the pad to verify token before redirecting
      const pad = await PadAPI.getPad(noteId, token);

      // Try decryption with provided password
      await CipherPad.decrypt(pad.ciphertext, pad.salt, pad.iv, password);

      // Decryption succeeded — save token and redirect to editor
      PadAPI.saveToken(noteId, token);
      window.location.href = `/editor.html#id=${noteId}&token=${encodeURIComponent(token)}`;
    } catch (err) {
      setLoading(false);
      if (err.message.includes('Decryption failed')) {
        unlockError.textContent = '❌ Wrong password — your note exists but could not be decrypted. Please try again.';
      } else if (err.message.includes('not found') || err.message.includes('token')) {
        unlockError.textContent = '❌ Note not found or invalid access token. The note may have been deleted.';
      } else {
        unlockError.textContent = '❌ ' + (err.message || 'Failed to load note.');
      }
      unlockError.classList.remove('hidden');
    }
  });

  function setLoading(loading) {
    unlockBtn.disabled = loading;
    unlockBtn.innerHTML = loading
      ? '<div class="spinner"></div> Verifying…'
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Unlock Note`;
  }

  /* Password toggle */
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target;
      const inp = document.getElementById(id);
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
