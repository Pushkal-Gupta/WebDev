import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const probe = { 'arithmetic-subarrays':[12], 'binary-tree-coloring-game':[3], 'binary-tree-maximum-path-sum':[13], 'binary-tree-paths':[15] };
for (const [slug, idxs] of Object.entries(probe)) {
  const { data } = await sb.from('PGcode_problems').select('test_cases').eq('id',slug).maybeSingle();
  for (const i of idxs) {
    const tc = data.test_cases[i];
    console.log("=====", slug, "case", i);
    console.log("  inputs:", JSON.stringify(tc.inputs));
    console.log("  expected:", JSON.stringify(tc.expected));
  }
}
