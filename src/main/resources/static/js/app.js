/**
 * CipherPad — app.js
 * Shared utilities: toast notifications, password toggle, eye icon
 */

/* ------------------------------------------------------------------ */
/*  Toast notifications                                                 */
/* ------------------------------------------------------------------ */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span style="font-size:1rem;">${icon}</span><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight .2s reverse';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* ------------------------------------------------------------------ */
/*  Password toggle                                                     */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';

      // Update icon
      const svg = btn.querySelector('.eye-icon');
      if (svg) {
        svg.innerHTML = show
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
      }
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Utility: parse URL fragment params                                  */
/* ------------------------------------------------------------------ */
function parseFragment(hash) {
  const params = {};
  if (!hash || hash === '#') return params;
  const str = hash.startsWith('#') ? hash.slice(1) : hash;
  str.split('&').forEach(part => {
    const [k, v] = part.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return params;
}

/* ------------------------------------------------------------------ */
/*  Utility: format character count                                     */
/* ------------------------------------------------------------------ */
function formatCount(n) {
  if (n === 0) return '0 characters';
  if (n === 1) return '1 character';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k characters`;
  return `${n} characters`;
}
