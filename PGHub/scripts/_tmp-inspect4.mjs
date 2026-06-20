import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// sample various return types to learn expected serialization
for (const id of ['valid-parentheses','contains-duplicate','best-time-to-buy-and-sell-stock','maximum-subarray']) {
  const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,test_cases').eq('id',id).limit(1);
  if(data&&data[0]){const r=data[0];console.log(`\n=== ${id} method=${r.method_name} ret=${r.return_type}`);console.log('params',JSON.stringify(r.params));console.log('tc[0]',JSON.stringify((r.test_cases||[])[0]));}
}
