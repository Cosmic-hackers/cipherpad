/**
 * CipherPad — crypto.js
 * Browser-side AES-256-GCM encryption using Web Crypto API
 * PBKDF2-HMAC-SHA-256 key derivation
 *
 * SECURITY NOTES:
 * - Encryption/decryption happens entirely in the browser
 * - Passwords are NEVER transmitted to the server
 * - Each note gets a unique random 16-byte salt
 * - Every encryption operation uses a fresh random 12-byte IV
 * - 310,000 PBKDF2 iterations
 */

const CipherPad = (() => {
  'use strict';

  const KDF_ALGORITHM  = 'PBKDF2';
  const KDF_HASH       = 'SHA-256';
  const KDF_ITERATIONS = 310_000;
  const KEY_BITS       = 256;
  const ENC_ALGORITHM  = 'AES-GCM';
  const SALT_BYTES     = 16;
  const IV_BYTES       = 12;

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  /** Encode bytes → Base64 string */
  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  /** Decode Base64 string → Uint8Array */
  function fromBase64(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  /** Convert string → ArrayBuffer (UTF-8) */
  function strToBuffer(str) {
    return new TextEncoder().encode(str);
  }

  /** Convert ArrayBuffer → string (UTF-8) */
  function bufferToStr(buffer) {
    return new TextDecoder().decode(buffer);
  }

  /* ------------------------------------------------------------------ */
  /*  Key derivation                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Derive a 256-bit AES-GCM key from a password and salt using PBKDF2.
   * @param {string} password
   * @param {Uint8Array} saltBytes
   * @returns {Promise<CryptoKey>}
   */
  async function deriveKey(password, saltBytes) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      strToBuffer(password),
      { name: KDF_ALGORITHM },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name:       KDF_ALGORITHM,
        salt:       saltBytes,
        iterations: KDF_ITERATIONS,
        hash:       KDF_HASH,
      },
      keyMaterial,
      { name: ENC_ALGORITHM, length: KEY_BITS },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Encryption                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Encrypt a plaintext string with a password.
   * Returns an object with Base64-encoded salt, iv, and ciphertext.
   *
   * @param {string} plaintext
   * @param {string} password
   * @param {string|null} existingSaltB64  — if provided, reuse salt (same note)
   * @returns {Promise<{salt: string, iv: string, ciphertext: string}>}
   */
  async function encrypt(plaintext, password, existingSaltB64 = null) {
    // Salt: reuse for the same note (salt is per-note, not per-encryption)
    const saltBytes = existingSaltB64
      ? fromBase64(existingSaltB64)
      : crypto.getRandomValues(new Uint8Array(SALT_BYTES));

    // Always fresh IV for every encrypt call
    const ivBytes = crypto.getRandomValues(new Uint8Array(IV_BYTES));

    const key = await deriveKey(password, saltBytes);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: ENC_ALGORITHM, iv: ivBytes },
      key,
      strToBuffer(plaintext)
    );

    return {
      salt:       toBase64(saltBytes),
      iv:         toBase64(ivBytes),
      ciphertext: toBase64(ciphertextBuffer),
      kdfAlgorithm:  KDF_ALGORITHM,
      kdfIterations: KDF_ITERATIONS,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Decryption                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Decrypt an encrypted payload.
   *
   * @param {string} ciphertextB64
   * @param {string} saltB64
   * @param {string} ivB64
   * @param {string} password
   * @returns {Promise<string>} Plaintext
   * @throws {Error} If decryption fails (wrong password or corrupted data)
   */
  async function decrypt(ciphertextB64, saltB64, ivB64, password) {
    const saltBytes       = fromBase64(saltB64);
    const ivBytes         = fromBase64(ivB64);
    const ciphertextBytes = fromBase64(ciphertextB64);

    const key = await deriveKey(password, saltBytes);

    try {
      const plaintextBuffer = await crypto.subtle.decrypt(
        { name: ENC_ALGORITHM, iv: ivBytes },
        key,
        ciphertextBytes
      );
      return bufferToStr(plaintextBuffer);
    } catch (e) {
      // AES-GCM authentication tag failure = wrong password or corrupted
      throw new Error('Decryption failed — incorrect password or corrupted note.');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  return { encrypt, decrypt, KDF_ALGORITHM, KDF_ITERATIONS };
})();
