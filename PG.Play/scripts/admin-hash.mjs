// Regenerate the PBKDF2 verifier for the admin password.
//
// Usage:
//   node scripts/admin-hash.mjs '<new password>'
//
// Prints the hex digest. Paste it into PBKDF2_EXPECTED_HEX in
// src/utils/admin.js. Salt + iteration count must match the verifier
// in admin.js exactly — bump those there if you tighten it later.

const SALT = 'pgplay-admin-v1';
const ITERATIONS = 300_000;

const password = process.argv[2];
if (!password) {
  console.error('usage: node scripts/admin-hash.mjs <password>');
  process.exit(1);
}

const enc = new TextEncoder();
const key = await crypto.subtle.importKey(
  'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt: enc.encode(SALT), iterations: ITERATIONS, hash: 'SHA-256' },
  key,
  256,
);
const hex = [...new Uint8Array(bits)]
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
console.log(hex);
