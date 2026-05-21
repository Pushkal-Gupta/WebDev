#!/usr/bin/env node
// Compares live Supabase content (concepts, modules, problems, topics, lists) vs source-of-truth files
// so we know what gaps to fill next.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function rest(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}

async function count(table, params = '') {
  const r = await fetch(`${URL}/rest/v1/${table}${params}`, {
    headers: { ...headers, Prefer: 'count=exact' },
    method: 'HEAD',
  });
  return r.headers.get('content-range')?.split('/')[1] || '?';
}

console.log('=== Supabase content audit ===\n');

// 1. Concepts — local vs live
const localConceptFiles = readdirSync(join(__dirname, '..', 'content', 'concepts')).filter(f => f.endsWith('.md'));
const localSlugs = new Set(localConceptFiles.map(f => f.replace(/\.md$/, '')));
const liveConcepts = await rest('PGcode_concepts?select=slug,title,status,module_slug&order=module_slug');
const liveSlugs = new Set(liveConcepts.map(c => c.slug));

console.log(`CONCEPTS  local md=${localSlugs.size}  live rows=${liveConcepts.length}`);
const notImported = [...localSlugs].filter(s => !liveSlugs.has(s));
const orphanLive = [...liveSlugs].filter(s => !localSlugs.has(s));
console.log(`  not imported (local md, no live row): ${notImported.length}${notImported.length ? '\n    ' + notImported.join(', ') : ''}`);
console.log(`  orphan live (live row, no local md):   ${orphanLive.length}${orphanLive.length ? '\n    ' + orphanLive.slice(0, 8).join(', ') + (orphanLive.length > 8 ? '…' : '') : ''}`);
const published = liveConcepts.filter(c => c.status === 'published').length;
console.log(`  published vs draft: ${published} published / ${liveConcepts.length - published} draft\n`);

// 2. Module coverage
const modules = await rest('PGcode_modules?select=slug,name,position&order=position');
console.log(`MODULES  ${modules.length}`);
for (const m of modules) {
  const c = liveConcepts.filter(x => x.module_slug === m.slug).length;
  console.log(`  ${m.slug.padEnd(22)} ${String(c).padStart(2)} concepts`);
}
console.log();

// 3. Problems & supporting tables
const counts = {};
for (const t of [
  'PGcode_problems', 'PGcode_topics', 'PGcode_user_submissions',
  'PGcode_companies', 'PGcode_company_problems',
  'PGcode_lists', 'PGcode_list_problems',
  'PGcode_roadmaps', 'PGcode_roadmap_nodes',
  'PGcode_concept_problems', 'PGcode_concept_prereqs',
  'PGcode_problem_templates', 'PGcode_playground_snippets',
  'PGcode_user_achievements', 'PGcode_user_progress',
]) {
  counts[t] = await count(t);
}
console.log('TABLE COUNTS');
for (const [t, c] of Object.entries(counts)) {
  console.log(`  ${t.padEnd(34)} ${c}`);
}
