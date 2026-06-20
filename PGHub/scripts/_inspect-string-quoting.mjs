#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error('usage: node scripts/_inspect-string-quoting.mjs <slug> [slug...]');
  process.exit(1);
}

for (const slug of slugs) {
  const { data, error } = await sb
    .from('PGcode_problems')
    .select('id, method_name, params, return_type, test_cases')
    .eq('id', slug)
    .maybeSingle();
  if (error) { console.error(slug, error.message); continue; }
  if (!data) { console.log(`${slug}: NOT FOUND`); continue; }
  console.log(`\n=== ${slug} ===`);
  console.log('method_name:', data.method_name);
  console.log('params:', JSON.stringify(data.params));
  console.log('return_type:', data.return_type);
  const tc = Array.isArray(data.test_cases) ? data.test_cases : [];
  console.log(`test_cases: ${tc.length}`);
  for (let i = 0; i < Math.min(4, tc.length); i++) {
    console.log(`  [${i}] inputs (raw JSON): ${JSON.stringify(tc[i].inputs)}`);
    console.log(`      expected (raw JSON): ${JSON.stringify(tc[i].expected).slice(0, 120)}`);
  }
}
