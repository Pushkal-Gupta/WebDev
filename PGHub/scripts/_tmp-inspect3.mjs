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
const { data } = await sb.from('PGcode_problems').select('solutions').eq('id','two-sum').limit(1);
const sol = data[0].solutions;
console.log('solutions keys:', Object.keys(sol));
console.log('python:\n', sol.python);
const { data: topics } = await sb.from('PGcode_topics').select('id').order('id');
console.log('\nALL TOPIC IDS:', topics.map(t=>t.id).join(', '));
// verify the 15 gap numbers truly missing
const nums=[156,157,158,159,161,163,170,186,243,244,245,246,247,248,249];
const { data: ex } = await sb.from('PGcode_problems').select('leetcode_number').in('leetcode_number', nums);
console.log('\nEXISTING among targets:', ex.map(e=>e.leetcode_number));
