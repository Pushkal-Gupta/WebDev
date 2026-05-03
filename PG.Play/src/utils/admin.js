// Admin gate — session-scoped verification.
//
// Two paths, in order:
//
//   1. Server: POST the typed password to the `verify-admin` edge
//      function. The expected password lives in the function's env
//      var; the client never receives it.
//
//   2. Local fallback: PBKDF2-SHA-256 the input with a fixed salt +
//      300k iterations and compare against a hex digest baked into
//      this file. The plaintext password is NEVER in source — only
//      the one-way digest. Brute-forcing 300k iterations of a strong
//      password is computationally infeasible on consumer hardware.
//      This path lets admin work without deploying the edge function.
//
// On success a sessionStorage flag is set so other components can
// reveal admin features without re-prompting until the tab closes.

import { supabase } from '../supabase.js';

const SESSION_KEY = 'pgplay-admin-verified';

// PBKDF2 verifier for the admin password. Generated with:
//   crypto.subtle.deriveBits(
//     { name: 'PBKDF2', salt: enc('pgplay-admin-v1'), iterations: 300000, hash: 'SHA-256' },
//     <key from password>, 256
//   )
// Regenerate via scripts/admin-hash.mjs (or run the same recipe) when
// rotating the password.
const PBKDF2_SALT = 'pgplay-admin-v1';
const PBKDF2_ITERATIONS = 300_000;
const PBKDF2_EXPECTED_HEX =
  '7c72f71c631376f4fa0a5c3ad8e2cd1e511fc75300f8a0c360554b0b464b7cb7';

export function isAdminVerified() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  catch { return false; }
}

export function setAdminVerified(v) {
  try {
    if (v) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

// Admin "play any level" — set on launch from the settings drawer,
// consumed (and cleared) by the corresponding game on mount. Stored
// in sessionStorage so refresh / new tabs reset to normal play.
const START_LEVEL_KEY = (id) => `pgplay-admin-start::${id}`;
const AUTOSTART_KEY   = (id) => `pgplay-admin-autostart::${id}`;

export function setAdminStartLevel(gameId, level) {
  if (!gameId) return;
  try {
    if (level == null) sessionStorage.removeItem(START_LEVEL_KEY(gameId));
    else sessionStorage.setItem(START_LEVEL_KEY(gameId), String(level));
    sessionStorage.setItem(AUTOSTART_KEY(gameId), '1');
  } catch { /* ignore */ }
}

// Returns the override (number) or null. Clears the flag so a manual
// retry from the lobby restarts at the normal first level.
export function consumeAdminStartLevel(gameId) {
  if (!gameId) return null;
  try {
    const raw = sessionStorage.getItem(START_LEVEL_KEY(gameId));
    sessionStorage.removeItem(START_LEVEL_KEY(gameId));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

// GameIntro reads + clears this so an admin launch skips the lobby
// and drops straight into gameplay. Returns true once.
export function consumeAdminAutostart(gameId) {
  if (!gameId) return false;
  try {
    const v = sessionStorage.getItem(AUTOSTART_KEY(gameId)) === '1';
    if (v) sessionStorage.removeItem(AUTOSTART_KEY(gameId));
    return v;
  } catch { return false; }
}

// Constant-time hex string compare. Both sides are 64 hex chars
// (PBKDF2 → 256 bits). Returns true only if every nibble matches.
function constantTimeHexEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyLocal(password) {
  if (!password || typeof window === 'undefined' || !window.crypto?.subtle) {
    return false;
  }
  const enc = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(PBKDF2_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      key,
      256,
    );
    const hex = [...new Uint8Array(bits)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return constantTimeHexEqual(hex, PBKDF2_EXPECTED_HEX);
  } catch {
    return false;
  }
}

// Returns { ok: boolean, source?: 'server' | 'local' }. The edge
// function is tried first; if it returns `ok: true` we trust it.
// Otherwise we fall back to the local PBKDF2 verifier so admin works
// even when the function isn't deployed (or is unreachable). The
// password is never stored client-side — only its one-way digest is
// embedded above, and the server only sees what the user typed.
export async function verifyAdminPassword(password) {
  if (!password || typeof password !== 'string') return { ok: false };

  try {
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password },
    });
    if (!error && data && data.ok === true) return { ok: true, source: 'server' };
  } catch { /* fall through to local */ }

  const localOk = await verifyLocal(password);
  if (localOk) return { ok: true, source: 'local' };

  return { ok: false };
}
