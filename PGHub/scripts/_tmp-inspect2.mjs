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
// find a flagship-style problem (two-sum) to see clean test_cases + solutions.python
const { data } = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,test_cases,solutions,topic_id,tags,topics,difficulty,leetcode_number').eq('id','two-sum').limit(1);
const r = (data&&data[0]);
if(r){
  console.log('name',r.name,'method',r.method_name,'ret',r.return_type,'topic_id',r.topic_id,'diff',r.difficulty,'lc',r.leetcode_number);
  console.log('params', JSON.stringify(r.params));
  console.log('tags', JSON.stringify(r.tags), 'topics', JSON.stringify(r.topics));
  console.log('test_cases[0..2]', JSON.stringify((r.test_cases||[]).slice(0,3),null,1));
  console.log('solutions.python:\n', (r.solutions&&r.solutions.python||'').slice(0,600));
}
// Check valid topic_ids
const { data: topics } = await sb.from('PGcode_topics').select('id,name').limit(40);
console.log('\nTOPICS:', topics.map(t=>t.id).join(', '));
