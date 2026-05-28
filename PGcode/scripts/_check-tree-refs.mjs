import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const ENV_PATH = '/Users/pushkalgupta/Desktop/WebDev/PGcode/.env';
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Find any problem that has solutions filled AND whose method handles trees
const { data } = await sb.from('PGcode_problems')
  .select('id,method_name,params,return_type,solutions')
  .not('solutions','is',null)
  .limit(500);
const refs = [];
for (const p of data || []) {
  if (!p.solutions || !Object.keys(p.solutions).length) continue;
  const paramTypes = (p.params || []).map(x => x.type).join(',');
  const isTreeRelated = /tree|node|TreeNode|ListNode/i.test(JSON.stringify(p.params||[])) || /tree|invert|depth|bst|symmetric|lca|ancestor|cycle/i.test(p.id);
  if (isTreeRelated) {
    refs.push({ id: p.id, method: p.method_name, params: p.params, return_type: p.return_type, has_python: !!p.solutions.python });
  }
}
console.log('Tree-related solved problems:', refs.length);
for (const r of refs.slice(0, 10)) console.log(JSON.stringify(r));
// also print example python solution of one tree-related
if (refs.length) {
  const { data: d2 } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions').eq('id', refs[0].id).single();
  console.log('\n=== Example python solution for', refs[0].id, '===');
  console.log(d2.solutions.python);
}
