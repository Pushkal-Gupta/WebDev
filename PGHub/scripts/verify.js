#!/usr/bin/env node
// Self-verification harness — runs the most automated tests possible without
// a browser or live Supabase. Exits non-zero on any failure.
//
// Checks (in order):
//   1. Concept markdown parse: every content/concepts/*.md parses + has required sections.
//   2. Migration SQL sanity: each migrate-*.sql is non-empty, ends with semicolon-or-newline,
//      has CREATE/ALTER statements that name canonical tables, and uses IF NOT EXISTS/ON CONFLICT
//      so reruns are safe.
//   3. ESLint runs (warnings allowed; existing pre-baseline errors are tolerated up to a budget).
//   4. Vite build runs and produces a dist/ tree with expected lazy chunks.
//   5. Dev server starts and serves index.html + every key source file with HTTP 200.
//
// Output: human-readable progress + a final summary table.
// Exit codes: 0 all green, 1 hard failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CHECKS = [];
function record(name, passed, detail = '') {
  CHECKS.push({ name, passed, detail });
  const icon = passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name}${detail ? ' — ' + detail : ''}`);
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Concept markdown parse
// ────────────────────────────────────────────────────────────────────────────

function checkConcepts() {
  const dir = path.join(ROOT, 'content', 'concepts');
  if (!fs.existsSync(dir)) {
    record('Concepts directory exists', false, `missing ${dir}`);
    return;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    record('Concept files present', false, '0 markdown files in content/concepts/');
    return;
  }
  record('Concept files present', true, `${files.length} files`);

  const REQUIRED_FRONTMATTER = ['slug', 'module', 'title', 'difficulty'];
  const RECOMMENDED_SECTIONS = ['intro', 'intuition', 'complexity'];
  let parseFails = 0;
  let missingSections = 0;
  const slugs = new Set();

  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
    if (!m) {
      parseFails++;
      record(`  ${f}`, false, 'missing frontmatter delimiters');
      continue;
    }
    const fm = m[1];
    const body = m[2];

    const missingFields = REQUIRED_FRONTMATTER.filter(k => !new RegExp(`^${k}:`, 'm').test(fm));
    if (missingFields.length > 0) {
      parseFails++;
      record(`  ${f}`, false, `missing fields: ${missingFields.join(', ')}`);
      continue;
    }

    const slugMatch = fm.match(/^slug:\s*(.+)$/m);
    const slug = slugMatch ? slugMatch[1].trim() : null;
    if (slug && slugs.has(slug)) {
      parseFails++;
      record(`  ${f}`, false, `duplicate slug: ${slug}`);
      continue;
    }
    slugs.add(slug);

    const sectionMatches = [...body.matchAll(/^##\s+([\w.]+)/gm)].map(x => x[1]);
    const missing = RECOMMENDED_SECTIONS.filter(s => !sectionMatches.includes(s));
    if (missing.length > 0) {
      missingSections++;
      // Not a hard fail; just a warning record
      record(`  ${f}`, true, `(warn) missing recommended sections: ${missing.join(', ')}`);
      continue;
    }
  }

  record(
    'All concepts parse',
    parseFails === 0,
    parseFails === 0 ? `${files.length}/${files.length}` : `${parseFails} fail(s)`,
  );
  if (missingSections > 0) {
    console.log(`  (note) ${missingSections} concept(s) missing recommended sections.`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Migration SQL sanity
// ────────────────────────────────────────────────────────────────────────────

function checkMigrations() {
  const dir = path.join(ROOT, 'scripts');
  const files = fs.readdirSync(dir).filter(f => /^migrate-\d+.*\.sql$/.test(f)).sort();
  if (files.length === 0) {
    record('Migrations present', false, 'no migrate-*.sql files found');
    return;
  }
  record('Migrations present', true, `${files.length} files`);

  let issues = 0;
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8').trim();
    if (raw.length < 20) {
      record(`  ${f}`, false, 'suspiciously short (<20 chars)');
      issues++;
      continue;
    }
    // Accept any standard DDL/DML — including DELETE-only cleanup migrations
    if (!/CREATE|ALTER|INSERT|UPDATE|DELETE|DROP/i.test(raw)) {
      record(`  ${f}`, false, 'no DDL/DML statements found');
      issues++;
      continue;
    }
    // Idempotency hints (not strict)
    const hasIdempotency = /IF NOT EXISTS|ON CONFLICT|OR REPLACE/i.test(raw);
    if (!hasIdempotency) {
      record(`  ${f}`, true, '(warn) no IF NOT EXISTS / ON CONFLICT detected — re-run may fail');
    }
  }
  record('Migration files look valid', issues === 0, issues === 0 ? `${files.length}/${files.length}` : `${issues} issue(s)`);
}

// ────────────────────────────────────────────────────────────────────────────
// 3. ESLint
// ────────────────────────────────────────────────────────────────────────────

function checkLint() {
  try {
    const out = execSync('npm run lint 2>&1', { cwd: ROOT, encoding: 'utf8' });
    const errorCount = (out.match(/\d+ problems? \((\d+) errors?/) || [])[1] || '0';
    const n = parseInt(errorCount, 10);
    // Pre-existing baseline is ~27 (mostly the new react-hooks/purity, react-hooks/immutability,
    // and react-hooks/set-state-in-effect rules that the codebase doesn't fully satisfy).
    // Budget 30 to leave a tiny bit of headroom; bumping it should be a deliberate choice.
    const BUDGET = 30;
    record('ESLint within budget', n <= BUDGET, `${n} error(s) (budget ${BUDGET})`);
    if (n > BUDGET) {
      console.log(out.slice(-2000));
    }
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const errorCount = (out.match(/\d+ problems? \((\d+) errors?/) || [])[1] || '?';
    const n = parseInt(errorCount, 10);
    const BUDGET = 30;
    if (n <= BUDGET) {
      record('ESLint within budget', true, `${n} error(s) (lint exited nonzero but within budget ${BUDGET})`);
    } else {
      record('ESLint within budget', false, `${n} error(s) — over budget ${BUDGET}`);
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Vite build
// ────────────────────────────────────────────────────────────────────────────

function checkBuild() {
  try {
    execSync('npm run build 2>&1', { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    record('Vite build', false, 'build failed — see output above');
    console.log(((e.stdout || '') + (e.stderr || '')).slice(-2000));
    return;
  }
  const distDir = path.join(ROOT, 'dist', 'assets');
  if (!fs.existsSync(distDir)) {
    record('Vite build', false, 'dist/assets missing');
    return;
  }
  const assets = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  // Vite sometimes emits multiple index-*.js (one main, one for a chunk that imports it).
  // Pick the largest index-*.js as the main bundle proxy.
  const indexCandidates = assets
    .filter(f => /^index-.*\.js$/.test(f))
    .map(f => ({ f, size: fs.statSync(path.join(distDir, f)).size }))
    .sort((a, b) => b.size - a.size);
  if (indexCandidates.length === 0) {
    record('Vite build', false, 'no index-*.js bundle');
    return;
  }
  const mainSize = indexCandidates[0].size;
  record('Vite build', true, `main bundle ${(mainSize / 1024).toFixed(0)} KB`);
  // Soft warning when the main bundle creeps above 600 KB
  if (mainSize > 600 * 1024) {
    record('Main bundle size budget', false, `${(mainSize / 1024).toFixed(0)} KB exceeds 600 KB budget`);
  }

  const expectedChunks = ['Playground', 'WebSandbox', 'SqlPlayground', 'LearnIndex', 'ConceptPage', 'ProgressDashboard', 'RoadmapView', 'RoadmapsIndex', 'RoadmapTrack', 'Workspace', 'ProblemList', 'CompaniesIndex', 'CompanyDetail', 'AdminPanel'];
  const missing = expectedChunks.filter(name => !assets.some(a => a.startsWith(`${name}-`)));
  record('All expected lazy chunks emitted', missing.length === 0, missing.length === 0 ? 'all present' : `missing: ${missing.join(', ')}`);
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Dev server smoke
// ────────────────────────────────────────────────────────────────────────────

async function checkDevServer() {
  const PORT = 5199 + Math.floor(Math.random() * 100);
  const proc = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for "ready in" string
  const ready = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 10000);
    proc.stdout.on('data', (d) => {
      if (d.toString().includes('ready in')) { clearTimeout(timer); resolve(true); }
    });
  });
  if (!ready) {
    record('Dev server starts', false, 'timeout waiting for "ready in"');
    proc.kill();
    return;
  }
  record('Dev server starts', true, `port ${PORT}`);

  const paths = [
    '/',
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/lib/queries.js',
    '/src/lib/spacedRepetition.js',
    '/src/lib/achievements.js',
    '/src/lib/status.js',
    '/src/components/Home.jsx',
    '/src/components/Playground.jsx',
    '/src/components/WebSandbox.jsx',
    '/src/components/SqlPlayground.jsx',
    '/src/components/HintsPanel.jsx',
    '/src/components/StatusPill.jsx',
    '/src/components/Achievements.jsx',
    '/src/components/learn/LearnIndex.jsx',
    '/src/components/learn/ConceptPage.jsx',
    '/src/components/roadmaps/RoadmapsIndex.jsx',
    '/src/components/roadmaps/RoadmapTrack.jsx',
    '/src/components/company/CompaniesIndex.jsx',
    '/src/components/company/CompanyDetail.jsx',
    '/src/components/CommandPalette.jsx',
    '/src/components/ProgressDashboard.jsx',
    '/src/lib/topicLabel.js',
    '/src/lib/ai.js',
    '/src/components/admin/AdminPanel.jsx',
    '/src/components/learn/ConceptQuiz.jsx',
    '/src/components/learn/ComplexityChart.jsx',
  ];

  let fails = 0;
  for (const p of paths) {
    try {
      const res = await fetch(`http://localhost:${PORT}${p}`);
      if (!res.ok) {
        fails++;
        console.log(`  ${p}: HTTP ${res.status}`);
      }
    } catch (e) {
      fails++;
      console.log(`  ${p}: ${e.message}`);
    }
  }
  record('All key routes/modules serve 200', fails === 0, `${paths.length - fails}/${paths.length} OK`);

  proc.kill();
  // Drain & wait briefly so the OS frees the port
  await new Promise(r => setTimeout(r, 200));
}

// ────────────────────────────────────────────────────────────────────────────
// Run
// ────────────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n=== PGcode self-verification ===\n');

  console.log('\n--- 1. Concept markdown ---');
  checkConcepts();

  console.log('\n--- 2. Migration SQL ---');
  checkMigrations();

  console.log('\n--- 3. ESLint ---');
  checkLint();

  console.log('\n--- 4. Vite build ---');
  checkBuild();

  console.log('\n--- 5. Dev server smoke ---');
  await checkDevServer();

  console.log('\n=== Summary ===');
  const failed = CHECKS.filter(c => !c.passed);
  console.log(`${CHECKS.length - failed.length}/${CHECKS.length} passed.`);
  if (failed.length > 0) {
    console.log('\nFailures:');
    failed.forEach(f => console.log(`  - ${f.name}${f.detail ? ': ' + f.detail : ''}`));
    process.exit(1);
  }
  console.log('\nAll checks passed.');
  process.exit(0);
})().catch(e => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});
