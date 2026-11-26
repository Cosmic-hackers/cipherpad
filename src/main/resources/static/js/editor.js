/**
 * CipherPad — editor.js
 * Full editor with autosave, unlock overlay, sharing, deletion
 */

(async () => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  State                                                               */
  /* ------------------------------------------------------------------ */
  let padId       = null;
  let accessToken = null;
  let padData     = null; // server response (encrypted)
  let cryptoKey   = null; // derived key (in memory)
  let currentPassword = null;
  let autosaveTimer   = null;
  let isDirty         = false;
  let isUnlocked      = false;

  /* ------------------------------------------------------------------ */
  /*  DOM references                                                      */
  /* ------------------------------------------------------------------ */
  const unlockOverlay    = document.getElementById('unlockOverlay');
  const overlayTitle     = document.getElementById('overlayTitle');
  const overlayDesc      = document.getElementById('overlayDesc');
  const overlayPassword  = document.getElementById('overlayPassword');
  const overlayUnlockBtn = document.getElementById('overlayUnlockBtn');
  const overlayError     = document.getElementById('overlayError');

  const editorHeader     = document.getElementById('editorHeader');
  const editorBody       = document.getElementById('editorBody');
  const titleInput       = document.getElementById('titleInput');
  const noteContent      = document.getElementById('noteContent');
  const charCounter      = document.getElementById('charCounter');
  const saveDot          = document.getElementById('saveDot');
  const saveText         = document.getElementById('saveText');

  const copyLinkBtn      = document.getElementById('copyLinkBtn');
  const copyTextBtn      = document.getElementById('copyTextBtn');
  const lockBtn          = document.getElementById('lockBtn');
  const deleteBtn        = document.getElementById('deleteBtn');

  const deleteModal      = document.getElementById('deleteModal');
  const cancelDeleteBtn  = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  const shareModal       = document.getElementById('shareModal');
  const shareUrl         = document.getElementById('shareUrl');
  const copyShareUrlBtn  = document.getElementById('copyShareUrlBtn');
  const closeShareModal  = document.getElementById('closeShareModal');

  /* ------------------------------------------------------------------ */
  /*  Parse URL fragment: #id=...&token=...                              */
  /* ------------------------------------------------------------------ */
  const fragment = parseFragment(window.location.hash);
  padId = fragment.id || null;
  const fragmentToken = fragment.token || null;

  if (!padId) {
    showOverlayError('Invalid note link — no note ID found in the URL.');
    overlayUnlockBtn.disabled = true;
    return;
  }

  // Restore token: prefer fragment (shared link), then sessionStorage
  accessToken = fragmentToken || PadAPI.loadToken(padId);

  // If we got a token from fragment, save it to sessionStorage
  if (fragmentToken) PadAPI.saveToken(padId, fragmentToken);

  // Clean up fragment from URL bar (security)
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  /* ------------------------------------------------------------------ */
  /*  Load encrypted pad from server                                      */
  /* ------------------------------------------------------------------ */
  if (!accessToken) {
    showOverlayError('No access token. Please open this note via its share link.');
    overlayUnlockBtn.disabled = true;
    return;
  }

  try {
    padData = await PadAPI.getPad(padId, accessToken);
  } catch (err) {
    showOverlayError('Could not load note: ' + (err.message || 'Network error.'));
    overlayUnlockBtn.disabled = true;
    return;
  }

  /* ------------------------------------------------------------------ */
  /*  Unlock overlay                                                      */
  /* ------------------------------------------------------------------ */
  overlayUnlockBtn.addEventListener('click', () => attemptUnlock());
  overlayPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptUnlock();
  });

  async function attemptUnlock() {
    const pwd = overlayPassword.value;
    if (!pwd) {
      showOverlayError('Please enter the password.');
      return;
    }

    overlayUnlockBtn.disabled = true;
    overlayUnlockBtn.innerHTML = '<div class="spinner"></div> Decrypting…';
    overlayError.classList.add('hidden');

    try {
      // Decrypt title
      const title = await CipherPad.decrypt(
        padData.encryptedTitle,
        padData.salt,
        padData.titleIv,
        pwd
      );

      // Decrypt content
      const content = await CipherPad.decrypt(
        padData.ciphertext,
        padData.salt,
        padData.iv,
        pwd
      );

      // Success!
      currentPassword = pwd;
      isUnlocked = true;

      titleInput.value     = title || '';
      noteContent.value    = content || '';
      charCounter.textContent = formatCount(content.length);

      // Show editor
      unlockOverlay.style.display = 'none';
      editorHeader.style.display = '';
      editorBody.style.display   = '';

      setSaveState('saved');
      noteContent.focus();

    } catch (err) {
      showOverlayError('Wrong password — the note could not be decrypted. Please try again.');
      overlayUnlockBtn.disabled = false;
      overlayUnlockBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Unlock Note`;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Autosave                                                            */
  /* ------------------------------------------------------------------ */
  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    isDirty = true;
    setSaveState('saving');
    autosaveTimer = setTimeout(saveNote, 2000);
  }

  titleInput.addEventListener('input', scheduleAutosave);
  noteContent.addEventListener('input', () => {
    charCounter.textContent = formatCount(noteContent.value.length);
    scheduleAutosave();
  });

  async function saveNote() {
    if (!isDirty || !isUnlocked) return;

    setSaveState('saving');
    try {
      const title   = titleInput.value.trim() || 'Untitled Note';
      const content = noteContent.value;

      // Re-encrypt with existing salt (fresh IV each time)
      const contentEnc = await CipherPad.encrypt(content, currentPassword, padData.salt);
      const titleEnc   = await CipherPad.encrypt(title,   currentPassword, padData.salt);

      await PadAPI.updatePad(padId, {
        encryptedTitle: titleEnc.ciphertext,
        ciphertext:     contentEnc.ciphertext,
        iv:             contentEnc.iv,
        titleIv:        titleEnc.iv,
      }, accessToken);

      // Update local padData with new ivs
      padData.iv      = contentEnc.iv;
      padData.titleIv = titleEnc.iv;

      isDirty = false;
      setSaveState('saved');
    } catch (err) {
      setSaveState('failed');
      showToast('Auto-save failed: ' + (err.message || 'Network error'), 'error');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Save indicator                                                      */
  /* ------------------------------------------------------------------ */
  function setSaveState(state) {
    saveDot.className = 'save-dot ' + state;
    saveText.textContent = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Save Failed';
  }

  /* ------------------------------------------------------------------ */
  /*  Copy link                                                           */
  /* ------------------------------------------------------------------ */
  copyLinkBtn.addEventListener('click', () => {
    const url = buildShareUrl();
    shareUrl.textContent = url;
    shareModal.classList.remove('hidden');
  });

  closeShareModal.addEventListener('click', () => shareModal.classList.add('hidden'));
  shareModal.addEventListener('click', (e) => { if (e.target === shareModal) shareModal.classList.add('hidden'); });

  copyShareUrlBtn.addEventListener('click', async () => {
    const url = shareUrl.textContent;
    await copyToClipboard(url);
    copyShareUrlBtn.textContent = 'Copied!';
    setTimeout(() => { copyShareUrlBtn.textContent = 'Copy'; }, 2000);
    showToast('Share link copied!', 'success');
  });

  function buildShareUrl() {
    const origin = window.location.origin;
    const tok = accessToken || PadAPI.loadToken(padId) || '';
    return `${origin}/editor.html#id=${padId}&token=${encodeURIComponent(tok)}`;
  }

  /* ------------------------------------------------------------------ */
  /*  Copy text                                                           */
  /* ------------------------------------------------------------------ */
  copyTextBtn.addEventListener('click', async () => {
    const text = noteContent.value;
    await copyToClipboard(text);
    showToast('Note text copied to clipboard', 'success');
  });

  /* ------------------------------------------------------------------ */
  /*  Lock note                                                           */
  /* ------------------------------------------------------------------ */
  lockBtn.addEventListener('click', async () => {
    // Save first
    if (isDirty) await saveNote();
    // Clear sensitive data
    currentPassword = null;
    isUnlocked = false;
    noteContent.value = '';
    titleInput.value  = '';
    // Show overlay again
    overlayPassword.value = '';
    overlayError.classList.add('hidden');
    overlayUnlockBtn.disabled = false;
    overlayUnlockBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Unlock Note`;
    editorHeader.style.display = 'none';
    editorBody.style.display   = 'none';
    unlockOverlay.style.display = 'flex';
    overlayPassword.focus();
    showToast('Note locked', 'info');
  });

  /* ------------------------------------------------------------------ */
  /*  Delete note                                                         */
  /* ------------------------------------------------------------------ */
  deleteBtn.addEventListener('click', () => deleteModal.classList.remove('hidden'));
  cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.add('hidden'));
  deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.classList.add('hidden'); });

  confirmDeleteBtn.addEventListener('click', async () => {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting…';

    try {
      await PadAPI.deletePad(padId, accessToken);
      showToast('Note deleted', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } catch (err) {
      showToast('Delete failed: ' + (err.message || 'Network error'), 'error');
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Yes, Delete';
      deleteModal.classList.add('hidden');
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function showOverlayError(msg) {
    const span = document.getElementById('overlayErrorText');
    if (span) span.textContent = msg;
    else overlayError.textContent = msg;
    overlayError.classList.remove('hidden');
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Password toggle on overlay                                          */
  /* ------------------------------------------------------------------ */
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
