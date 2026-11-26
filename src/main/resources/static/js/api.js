/**
 * CipherPad — api.js
 * HTTP client for the Spring Boot backend
 * Access token is kept only in memory (sessionStorage as fallback for page reloads)
 */

const PadAPI = (() => {
  'use strict';

  const BASE = '/api';
  const TOKEN_KEY = 'cp_token_'; // prefix + padId

  /* ------------------------------------------------------------------ */
  /*  Token management (sessionStorage — survives page refresh)           */
  /* ------------------------------------------------------------------ */

  function saveToken(padId, token) {
    try { sessionStorage.setItem(TOKEN_KEY + padId, token); } catch (_) {}
  }

  function loadToken(padId) {
    try { return sessionStorage.getItem(TOKEN_KEY + padId); } catch (_) { return null; }
  }

  function clearToken(padId) {
    try { sessionStorage.removeItem(TOKEN_KEY + padId); } catch (_) {}
  }

  /* ------------------------------------------------------------------ */
  /*  HTTP helpers                                                        */
  /* ------------------------------------------------------------------ */

  async function request(method, url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Access-Token'] = token;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);

    if (res.status === 204) return null;

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  API methods                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Create a new pad.
   * Returns { id, accessToken, salt, iv, titleIv, ... }
   * Token is saved to sessionStorage automatically.
   */
  async function createPad(payload) {
    const data = await request('POST', `${BASE}/pads`, payload);
    if (data?.id && data?.accessToken) {
      saveToken(data.id, data.accessToken);
    }
    return data;
  }

  /**
   * Get pad by id. Requires token.
   */
  async function getPad(id, token) {
    const tok = token || loadToken(id);
    if (!tok) throw new Error('No access token found. Please open the note via its share link.');
    return request('GET', `${BASE}/pads/${id}`, null, tok);
  }

  /**
   * Update pad. Requires token.
   */
  async function updatePad(id, payload, token) {
    const tok = token || loadToken(id);
    if (!tok) throw new Error('No access token. Cannot save.');
    return request('PUT', `${BASE}/pads/${id}`, payload, tok);
  }

  /**
   * Delete pad. Requires token.
   */
  async function deletePad(id, token) {
    const tok = token || loadToken(id);
    if (!tok) throw new Error('No access token. Cannot delete.');
    await request('DELETE', `${BASE}/pads/${id}`, null, tok);
    clearToken(id);
  }

  /**
   * Health check.
   */
  async function health() {
    return request('GET', `${BASE}/health`);
  }

  return { createPad, getPad, updatePad, deletePad, health, saveToken, loadToken, clearToken };
})();
