// Lightweight repo guards run in CI (and locally) to block classes of bug that
// lint/build don't catch. Usage:
//   node scripts/ci-guards.mjs nul     — fail if any concept .md holds a NUL byte
//   node scripts/ci-guards.mjs emoji   — fail if any source file holds an emoji
//   node scripts/ci-guards.mjs all     — run every guard
// Exit 0 = clean, exit 1 = a violation was found (prints file[:line]).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

function walk(dir, exts, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === 'dist' || name.name === '.git') continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.name.endsWith(e))) out.push(full);
  }
  return out;
}

// A single NUL byte anywhere in a concept .md makes the whole Supabase batch
// upsert fail with Postgres 22P05 — the file parses fine, so only a byte scan
// catches it. (Bit us once via a '\0' char example in a Java lesson.)
function guardNul() {
  const dir = path.join(ROOT, 'content', 'concepts');
  if (!fs.existsSync(dir)) return [];
  const bad = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const buf = fs.readFileSync(path.join(dir, f));
    if (buf.includes(0)) bad.push(`content/concepts/${f}`);
  }
  return bad.map((f) => `${f}: contains a NUL byte (0x00) — strip it or the concept import fails`);
}

// Only the astral emoji planes + the emoji variation selector — unambiguously
// emoji, never legitimate source. Deliberately does NOT flag arrows (U+2192),
// check/cross marks (U+2713/2717), or box-drawing, which the codebase uses in
// copy and console output.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{FE0F}\u{200D}\u{20E3}]/u;

function guardEmoji() {
  const files = walk(path.join(ROOT, 'src'), ['.js', '.jsx', '.ts', '.tsx', '.css']);
  const hits = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (EMOJI_RE.test(line)) {
        hits.push(`${path.relative(ROOT, f)}:${i + 1}: emoji found — use a lucide icon instead`);
      }
    });
  }
  return hits;
}

// A leaked Supabase service_role key (full DB access, bypasses RLS) once sat in
// committed scripts and tripped GitHub secret scanning. This guard fails if any
// code file embeds a JWT that decodes to role "service_role". Scoped to source
// code — the JWT *lesson* markdown (which contains example tokens on purpose) is
// never scanned, and public anon keys don't trip it.
const JWT_RE = /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g;

function guardSecret() {
  const dirs = ['src', 'scripts'].map((d) => path.join(ROOT, d)).filter((d) => fs.existsSync(d));
  const files = dirs.flatMap((d) => walk(d, ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']));
  const hits = [];
  for (const f of files) {
    if (f.endsWith('ci-guards.mjs')) continue; // this file names the pattern
    const text = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = JWT_RE.exec(text)) !== null) {
      let role;
      try { role = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')).role; } catch { role = null; }
      if (role === 'service_role') {
        const line = text.slice(0, m.index).split('\n').length;
        hits.push(`${path.relative(ROOT, f)}:${line}: a hardcoded service_role key — move it to an env var (SUPABASE_SERVICE_ROLE_KEY) and rotate the leaked key`);
      }
    }
    JWT_RE.lastIndex = 0;
  }
  return hits;
}

const GUARDS = { nul: guardNul, emoji: guardEmoji, secret: guardSecret };

const arg = process.argv[2] || 'all';
const toRun = arg === 'all' ? Object.keys(GUARDS) : [arg];
let violations = [];
for (const name of toRun) {
  const fn = GUARDS[name];
  if (!fn) {
    console.error(`Unknown guard "${name}". Options: ${Object.keys(GUARDS).join(', ')}, all`);
    process.exit(2);
  }
  violations = violations.concat(fn());
}

if (violations.length) {
  console.error(`\nci-guards: ${violations.length} violation(s):\n`);
  for (const v of violations) console.error(`  - ${v}`);
  console.error('');
  process.exit(1);
}
console.log(`ci-guards (${toRun.join(', ')}): clean`);
