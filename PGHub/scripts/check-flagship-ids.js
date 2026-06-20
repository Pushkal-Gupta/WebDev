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

const search = process.argv.slice(2);
if (search.length === 0) {
  console.error('usage: check-flagship-ids.js <pattern> [pattern...]');
  process.exit(1);
}
const { data } = await sb.from('PGcode_problems').select('id,name').order('id');
for (const term of search) {
  const lc = term.toLowerCase();
  const matches = data.filter(p => p.id.toLowerCase().includes(lc) || p.name.toLowerCase().includes(lc));
  console.log(`\n=== "${term}" (${matches.length}) ===`);
  for (const m of matches.slice(0, 12)) console.log(`  ${m.id}  ::  ${m.name}`);
}
