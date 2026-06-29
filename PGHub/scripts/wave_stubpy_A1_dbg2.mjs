import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const slug of ['arithmetic-subarrays','binary-tree-coloring-game','binary-tree-maximum-path-sum']) {
  const { data } = await sb.from('PGcode_problems').select('test_cases').eq('id',slug).maybeSingle();
  console.log("=====", slug, "total", data.test_cases.length);
  data.test_cases.forEach((tc,i)=>{
    const exp = JSON.stringify(tc.expected);
    const inp = JSON.stringify(tc.inputs);
    const bad = /Infinity|NaN|undefined/.test(exp);
    console.log(`  ${i}${bad?' [BAD]':''}: in=${inp.slice(0,70)} exp=${exp.slice(0,40)}`);
  });
}
