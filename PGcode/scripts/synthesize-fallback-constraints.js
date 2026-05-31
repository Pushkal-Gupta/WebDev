#!/usr/bin/env node
// For every PGcode_problems row that still has NULL constraints, synthesize
// sensible generic constraints from the param types so the UI box renders
// something useful instead of being blank. Never overwrite hand-curated values.
//
// Usage:
//   node scripts/synthesize-fallback-constraints.js --dry
//   node scripts/synthesize-fallback-constraints.js

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

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) { console.error('Need env vars'); process.exit(1); }
const sb = createClient(URL, SVC);

const DRY = process.argv.includes('--dry');

function constraintsFor(param) {
  const name = param.name || 'arg';
  const t = (param.type || '').trim();
  // Single primitives
  if (t === 'int') return [`-10^9 <= ${name} <= 10^9`];
  if (t === 'long' || t === 'long long') return [`-10^18 <= ${name} <= 10^18`];
  if (t === 'float' || t === 'double') return [`-10^9 <= ${name} <= 10^9`];
  if (t === 'bool') return [`${name} is a boolean`];
  if (t === 'str') return [`1 <= ${name}.length <= 10^4`, `${name} contains printable ASCII characters`];
  // Lists
  if (t === 'List[int]') return [`1 <= ${name}.length <= 10^5`, `-10^9 <= ${name}[i] <= 10^9`];
  if (t === 'List[str]') return [`1 <= ${name}.length <= 10^4`, `1 <= ${name}[i].length <= 100`];
  if (t === 'List[bool]') return [`1 <= ${name}.length <= 10^5`];
  if (t === 'List[List[int]]') return [`1 <= ${name}.length <= 10^3`, `1 <= ${name}[i].length <= 10^3`, `-10^9 <= ${name}[i][j] <= 10^9`];
  if (t === 'List[List[str]]') return [`1 <= ${name}.length <= 10^3`, `1 <= ${name}[i].length <= 10^3`];
  if (t === 'List[List]') return [`1 <= ${name}.length <= 10^4`];
  if (t === 'ListNode' || t === 'Optional[ListNode]') return [`The list has 0 to 10^4 nodes`, `-10^9 <= Node.val <= 10^9`];
  if (t === 'TreeNode' || t === 'Optional[TreeNode]') return [`The tree has 0 to 10^4 nodes`, `-10^9 <= Node.val <= 10^9`];
  // Unknown — gentle generic
  return [`${name} matches the documented type ${t}`];
}

async function loadAll() {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, params, constraints')
      .order('id', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

(async function main() {
  const rows = (await loadAll()).filter(r => r.constraints === null && Array.isArray(r.params) && r.params.length > 0);
  console.log(`Synthesizing constraints for ${rows.length} rows${DRY ? ' (DRY)' : ''}...`);

  let ok = 0, fail = 0;
  for (const row of rows) {
    const constraints = [];
    for (const p of row.params) {
      constraints.push(...constraintsFor(p));
    }
    if (constraints.length === 0) continue;
    if (DRY) {
      console.log(`  ${row.id.padEnd(50)} ${constraints.length} constraints`);
      ok++;
      continue;
    }
    const { error } = await sb.from('PGcode_problems').update({ constraints }).eq('id', row.id);
    if (error) { console.log(`  ${row.id} ERROR: ${error.message}`); fail++; }
    else ok++;
  }
  console.log(`\nDone. ok=${ok} fail=${fail}`);
})();
