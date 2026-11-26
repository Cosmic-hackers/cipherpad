/**
 * CipherPad — create.js
 * Handles the "Create Secure Note" page
 */

(async () => {
  'use strict';

  const form           = document.getElementById('createForm');
  const noteTitle      = document.getElementById('noteTitle');
  const passwordInput  = document.getElementById('password');
  const confirmInput   = document.getElementById('confirmPassword');
  const createBtn      = document.getElementById('createBtn');
  const passwordError  = document.getElementById('passwordError');
  const confirmError   = document.getElementById('confirmError');
  const generalError   = document.getElementById('generalError');
  const strengthFill   = document.getElementById('strengthFill');
  const strengthLabel  = document.getElementById('strengthLabel');
  const strengthCont   = document.getElementById('strengthContainer');

  /* ------------------------------------------------------------------ */
  /*  Password strength meter                                             */
  /* ------------------------------------------------------------------ */
  function assessStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { label: 'Very Weak',  color: '#C65353', pct: '20%' },
      { label: 'Weak',       color: '#E07020', pct: '40%' },
      { label: 'Fair',       color: '#D4A017', pct: '60%' },
      { label: 'Strong',     color: '#23865B', pct: '80%' },
      { label: 'Very Strong',color: '#0F766E', pct: '100%'},
    ];
    return levels[Math.min(score, 4)];
  }

  passwordInput.addEventListener('input', () => {
    const pwd = passwordInput.value;
    if (!pwd) { strengthCont.style.display = 'none'; return; }

    strengthCont.style.display = 'block';
    const level = assessStrength(pwd);
    strengthFill.style.width      = level.pct;
    strengthFill.style.background = level.color;
    strengthLabel.textContent     = `Strength: ${level.label}`;
    strengthLabel.style.color     = level.color;
  });

  /* ------------------------------------------------------------------ */
  /*  Validation                                                          */
  /* ------------------------------------------------------------------ */
  function validate() {
    let valid = true;

    // Password required
    if (!passwordInput.value) {
      showFieldError(passwordError, 'Password is required.');
      passwordInput.classList.add('error');
      valid = false;
    } else if (passwordInput.value.length < 6) {
      showFieldError(passwordError, 'Password must be at least 6 characters.');
      passwordInput.classList.add('error');
      valid = false;
    } else {
      hideFieldError(passwordError);
      passwordInput.classList.remove('error');
    }

    // Confirm match
    if (confirmInput.value !== passwordInput.value) {
      confirmError.classList.remove('hidden');
      confirmInput.classList.add('error');
      valid = false;
    } else {
      confirmError.classList.add('hidden');
      confirmInput.classList.remove('error');
    }

    return valid;
  }

  function showFieldError(el, msg) {
    el.classList.remove('hidden');
    el.querySelector('span').textContent = msg;
  }
  function hideFieldError(el) {
    el.classList.add('hidden');
  }

  /* ------------------------------------------------------------------ */
  /*  Form submit                                                         */
  /* ------------------------------------------------------------------ */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    generalError.classList.add('hidden');

    if (!validate()) return;

    const password = passwordInput.value;
    const title    = noteTitle.value.trim() || 'Untitled Note';

    setLoading(true);

    try {
      // 1. Encrypt note content (initially empty) + title
      const contentResult = await CipherPad.encrypt('', password);
      const titleResult   = await CipherPad.encrypt(title, password, contentResult.salt);

      // 2. Send to backend
      const payload = {
        encryptedTitle: titleResult.ciphertext,
        ciphertext:     contentResult.ciphertext,
        salt:           contentResult.salt,     // shared salt
        iv:             contentResult.iv,
        titleIv:        titleResult.iv,
        kdfAlgorithm:   contentResult.kdfAlgorithm,
        kdfIterations:  contentResult.kdfIterations,
      };

      const data = await PadAPI.createPad(payload);

      // 3. Build editor URL with id+token in fragment (never in query string)
      const fragment = `id=${data.id}&token=${encodeURIComponent(data.accessToken)}`;
      window.location.href = `/editor.html#${fragment}`;
    } catch (err) {
      generalError.textContent = err.message || 'Failed to create note. Please try again.';
      generalError.classList.remove('hidden');
      setLoading(false);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                       */
  /* ------------------------------------------------------------------ */
  function setLoading(loading) {
    createBtn.disabled = loading;
    createBtn.innerHTML = loading
      ? '<div class="spinner"></div> Creating…'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Create Secure Note';
  }
})();
