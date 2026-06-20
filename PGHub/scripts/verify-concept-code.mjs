#!/usr/bin/env node
// Verify that the reference code blocks in content/concepts/*.md COMPILE + RUN
// without error, in all four languages, via the deployed `run-code` edge function.
//
// Usage:
//   node scripts/verify-concept-code.mjs [--sample N] [--all] [--slug a,b,c]
//                                        [--out scripts/report-concept-code-sample.json]
//
// Each concept .md has `## code.python`, `## code.javascript`, `## code.java`,
// `## code.cpp` sections, each a single fenced code block. These are *reference
// snippets* (often a bare function/class with no main + no output) rather than
// full programs. We run each through run-code with empty stdin and classify:
//   pass            - status ok AND produced real output
//   pass_no_output  - status ok but printed nothing (snippet has no main/driver) -> FINE
//   fail_compile    - compile_error / build error
//   fail_runtime    - runtime error / non-zero exit / Traceback
//   fail_harness    - empty/odd run-code response, or a language that structurally
//                     cannot run a bare snippet (java method w/o class, cpp w/o main)
//   skip_timeout    - run-code hung past the wall budget
//   missing         - no code block for that language
//
// Requires .env with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONCEPTS_DIR = path.join(ROOT, 'content', 'concepts');

try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
if (!URL || !ANON) {
  console.error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};

const LANGS = ['python', 'javascript', 'java', 'cpp'];
const SECTION_OF = {
  python: 'code.python',
  javascript: 'code.javascript',
  java: 'code.java',
  cpp: 'code.cpp',
};

const WALL_MS = 90_000;          // skip a single run-code call if it hangs past this
const SLEEP_MS = 350;            // polite gap between sequential calls

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- parse one concept's per-language code blocks -------------------------
// Sections are `## <name>` headers; code under `## code.<lang>` is a fenced block.
function parseCodeBlocks(md) {
  const out = {};
  // Split on level-2 headers, keep the header text.
  const lines = md.split('\n');
  let curHeader = null;
  let buf = [];
  const flush = () => {
    if (curHeader && curHeader.startsWith('code.')) {
      const body = buf.join('\n');
      const fence = body.match(/```[a-zA-Z+]*\n([\s\S]*?)```/);
      if (fence) out[curHeader] = fence[1].replace(/\n+$/, '');
    }
  };
  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { flush(); curHeader = h[1]; buf = []; continue; }
    buf.push(line);
  }
  flush();
  return out;
}

// --- run a single snippet through run-code with a wall budget --------------
async function runOnce(language, code) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), WALL_MS);
  try {
    const res = await fetch(`${URL}/functions/v1/run-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ language, code, stdins: [''] }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, kind: 'fail_harness', status: `http_${res.status}`, output: txt.slice(0, 200) };
    }
    const data = await res.json();
    const first = (data.results || [])[0];
    if (!first) return { ok: false, kind: 'fail_harness', status: 'no_result', output: JSON.stringify(data).slice(0, 200) };
    return classifyResult(first);
  } catch (e) {
    if (e.name === 'AbortError') return { ok: false, kind: 'skip_timeout', status: 'timeout', output: '' };
    return { ok: false, kind: 'fail_harness', status: 'fetch_error', output: String(e.message || e).slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

function classifyResult(first) {
  const status = String(first.status || '').toLowerCase();
  const output = String(first.output || '');
  const lo = output.toLowerCase();
  const noOutput = output.trim() === '' || /\(no output\)/i.test(output);

  const isCompileErr =
    status.includes('compile') ||
    /\berror:/.test(lo) ||
    /undefined reference to `main'/.test(lo) ||
    /class, interface, or enum expected/.test(lo) ||
    /cannot find symbol/.test(lo);

  const isRuntimeErr =
    status.includes('runtime') ||
    status.includes('error') && !isCompileErr ||
    /traceback \(most recent call last\)/.test(lo) ||
    /\bexception\b/.test(lo) ||
    /segmentation fault/.test(lo) ||
    status.includes('time limit') ||
    status.includes('tle');

  const ok = status === 'success' || status === 'accepted' || status === '';

  if (isCompileErr) return { ok: false, kind: 'fail_compile', status: first.status || 'compile_error', output: output.slice(0, 300) };
  if (isRuntimeErr) return { ok: false, kind: 'fail_runtime', status: first.status || 'runtime_error', output: output.slice(0, 300) };
  if (ok && noOutput) return { ok: true, kind: 'pass_no_output', status: first.status || 'success', output: '' };
  if (ok) return { ok: true, kind: 'pass', status: first.status || 'success', output: output.slice(0, 120) };
  return { ok: false, kind: 'fail_harness', status: first.status || 'unknown', output: output.slice(0, 300) };
}

// Many "failures" are structural snippet-shape problems or environmental gaps
// in the Judge0 sandbox, NOT broken reference code. Reclassify those to
// fail_harness so the report doesn't accuse correct snippets of being broken.
// Returns true if this failure is a harness/structural/environment artifact.
function isStructuralSnippetIssue(language, code, result) {
  if (result.kind !== 'fail_compile' && result.kind !== 'fail_runtime') return false;
  const lo = result.output.toLowerCase();

  // --- Judge0 wrapper expects a class/main named `Main`; snippet names differ.
  if (language === 'java') {
    const hasMain = /public\s+static\s+void\s+main\s*\(/.test(code);
    if (/could not find or load main class main/.test(lo)) return true;          // class w/o main
    if (/class .* is public, should be declared in a file named/.test(lo)) return true; // named-file rule
    if (/class, interface, or enum expected/.test(lo)) return true;              // bare method
    if (!hasMain && (lo.includes('no main') || /main method not found/.test(lo))) return true;
  }
  if (language === 'cpp') {
    const hasMain = /\bint\s+main\s*\(/.test(code);
    if (!hasMain && /undefined reference to `main'/.test(lo)) return true;
    if (!hasMain && /\(\.text\+0x\d+\): undefined reference/.test(lo)) return true;
  }

  // --- External libraries not installed in the Judge0 sandbox (illustrative
  //     snippets that import flask/redis/express/numpy/etc). Environmental.
  if (/modulenotfounderror: no module named/.test(lo)) return true;
  if (/cannot use import statement outside a module/.test(lo)) return true;       // ESM snippet under CJS runner
  if (/cannot find module '/.test(lo)) return true;                              // node require of an npm dep
  if (/error: package .* does not exist/.test(lo)) return true;                  // java third-party import

  // --- Browser-only / runtime-version APIs used illustratively under Node.
  if (language === 'javascript') {
    if (/is not defined/.test(lo) && /(requestanimationframe|document|window|localstorage|fetch|navigator)/.test(lo)) return true;
    if (/unexpected token '\?'/.test(lo) || /unexpected token '\.'/.test(lo)) return true; // old-Node optional-chaining/nullish
  }
  return false;
}

function chooseSample(allFiles, n) {
  // Spread across modules: bucket by module, round-robin pull.
  const byModule = new Map();
  for (const f of allFiles) {
    const md = fs.readFileSync(path.join(CONCEPTS_DIR, f), 'utf8');
    const mod = (md.match(/^module:\s*(.+)$/m) || [])[1]?.trim() || 'unknown';
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod).push(f);
  }
  const buckets = [...byModule.values()];
  const picked = [];
  let idx = 0;
  while (picked.length < n && buckets.some((b) => b.length)) {
    const b = buckets[idx % buckets.length];
    if (b.length) picked.push(b.shift());
    idx++;
  }
  return picked;
}

async function main() {
  const all = fs.readdirSync(CONCEPTS_DIR).filter((f) => f.endsWith('.md')).sort();
  let files;
  if (arg('slug')) {
    const want = String(arg('slug')).split(',').map((s) => s.trim().replace(/\.md$/, ''));
    files = want.map((s) => `${s}.md`).filter((f) => all.includes(f));
  } else if (arg('all')) {
    files = all;
  } else {
    const n = Number(arg('sample', 25));
    files = chooseSample(all, n);
  }

  const outPath = arg('out') || path.join(__dirname, 'report-concept-code-sample.json');
  console.log(`Verifying ${files.length} concepts x ${LANGS.length} languages via run-code\n`);

  const perLang = Object.fromEntries(LANGS.map((l) => [l, {
    pass: 0, pass_no_output: 0, fail_compile: 0, fail_runtime: 0, fail_harness: 0, skip_timeout: 0, missing: 0,
  }]));
  const failures = [];   // genuine-ish failures (compile/runtime), incl reclassified
  const records = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const md = fs.readFileSync(path.join(CONCEPTS_DIR, file), 'utf8');
    const blocks = parseCodeBlocks(md);
    process.stdout.write(`${slug.padEnd(38)} `);

    for (const lang of LANGS) {
      const code = blocks[SECTION_OF[lang]];
      if (!code || !code.trim()) {
        perLang[lang].missing++;
        records.push({ slug, lang, kind: 'missing' });
        process.stdout.write('-');
        continue;
      }
      let result = await runOnce(lang, code);

      // Reclassify structural snippet-shape compile failures.
      let category = result.kind;
      if (isStructuralSnippetIssue(lang, code, result)) {
        category = 'fail_harness';
      }
      perLang[lang][category]++;

      const rec = { slug, lang, kind: category, status: result.status };
      if (!result.ok) {
        rec.output = result.output;
        rec.reclassified = category !== result.kind;
        // genuine code problems = compile/runtime that are NOT structural snippet issues
        if (category === 'fail_compile' || category === 'fail_runtime') {
          failures.push({ slug, lang, kind: category, status: result.status, snippet: result.output.replace(/\s+/g, ' ').slice(0, 160) });
        }
      }
      records.push(rec);

      const mark = { pass: '.', pass_no_output: 'o', fail_compile: 'C', fail_runtime: 'R', fail_harness: 'h', skip_timeout: 'T' }[category] || '?';
      process.stdout.write(mark);
      await sleep(SLEEP_MS);
    }
    process.stdout.write('\n');
  }

  // --- summary -------------------------------------------------------------
  const summary = { sample_size: files.length, languages: {} };
  for (const lang of LANGS) {
    const c = perLang[lang];
    const ran = c.pass + c.pass_no_output + c.fail_compile + c.fail_runtime + c.fail_harness + c.skip_timeout;
    const cleanPass = c.pass + c.pass_no_output;
    summary.languages[lang] = {
      ...c,
      ran,
      runnable_pass: cleanPass,
      genuine_fail: c.fail_compile + c.fail_runtime,
      pass_rate: ran ? +(cleanPass / ran).toFixed(3) : null,
    };
  }
  summary.category_breakdown = {
    a_genuinely_broken: failures.length,
    b_snippet_no_output: LANGS.reduce((s, l) => s + perLang[l].pass_no_output, 0),
    c_harness_or_structural: LANGS.reduce((s, l) => s + perLang[l].fail_harness, 0),
    timeouts: LANGS.reduce((s, l) => s + perLang[l].skip_timeout, 0),
  };

  const report = { generated_at: new Date().toISOString(), wall_ms: WALL_MS, summary, failures, records };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('\n\n=== Per-language ===');
  for (const lang of LANGS) {
    const s = summary.languages[lang];
    console.log(`${lang.padEnd(11)} runnable_pass ${s.runnable_pass}/${s.ran} (${(s.pass_rate * 100).toFixed(0)}%)  genuine_fail ${s.genuine_fail}  harness ${s.fail_harness}  missing ${s.missing}  timeout ${s.skip_timeout}`);
  }
  console.log('\n=== Category breakdown ===');
  console.log(JSON.stringify(summary.category_breakdown, null, 2));
  console.log(`\nGenuine (compile/runtime) failures: ${failures.length}`);
  for (const f of failures.slice(0, 40)) {
    console.log(`  ${f.slug} [${f.lang}] ${f.kind} (${f.status}): ${f.snippet}`);
  }
  console.log(`\nReport -> ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
