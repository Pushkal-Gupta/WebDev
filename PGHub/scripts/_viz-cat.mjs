import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
let rows = [];
for (let from=0;;from+=1000){const {data}=await sb.from('PGcode_problems').select('id,name,tags,description,solutions').is('viz_steps',null).order('id').range(from,from+999);rows=rows.concat(data);if(data.length<1000)break;}
const NONALGO=new Set(['database','shell','concurrency','javascript','typescript','pandas']);
let naTag=0, algoNoSol=0, algoHasSol=0, sample=[];
for(const r of rows){
  const tags=r.tags||[];
  const s=r.solutions||{};
  const hasReal=k=>typeof s[k]==='string'&&s[k].trim().length>=20&&!/Reference skeleton/.test(s[k])&&/\breturn\b/.test(s[k]);
  const anyReal=['python','cpp','java'].some(hasReal);
  // frontend/db problems: tag-based OR description mentions Table/DataFrame/function signature only
  const desc=r.description||'';
  const isNA = tags.some(t=>NONALGO.has(t)) || /DataFrame|Table:\s*<code>|Write a function that|Enhance all functions|Promise|Component/i.test(desc) && !anyReal;
  if(isNA) naTag++;
  else if(anyReal) algoHasSol++;
  else { algoNoSol++; if(sample.length<15) sample.push(r.id); }
}
console.log('N/A (SQL/JS/pandas/shell/frontend):', naTag);
console.log('algorithmic WITH real solution (should already have viz? recheck):', algoHasSol);
console.log('algorithmic NO solution (viz-able from description):', algoNoSol);
console.log('sample viz-able:', sample.join(', '));
