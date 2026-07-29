import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const NONALGO = new Set(['database','shell','concurrency','javascript','typescript','pandas']);
const isDesign = id => /^design-|-data-stream|data-structure/.test(id);
let s={total:0,withTC:0,zero_design:0,zero_db:0,zero_other:0,lt3_db:0,lt3_js:0,lt3_algo:0,lt3_other:0,ge3:0,malformed:0};
const zeroOther=[], lt3algo=[];
for (let from = 0; ; from += 300) {
  let data, error;
  for (let a=0;a<3;a++){({data,error}=await sb.from('PGcode_problems').select('id,tags,test_cases').order('id').range(from,from+299)); if(!error)break;}
  if (error){console.error('batch',from,error.message);break;}
  for(const r of data){
    s.total++;
    const tags=r.tags||[]; const db=tags.includes('database'); const nonalgo=tags.some(x=>NONALGO.has(x));
    const arr=Array.isArray(r.test_cases)?r.test_cases:null; const cnt=arr?arr.length:0;
    if(cnt===0){ if(isDesign(r.id)||tags.includes('design')) s.zero_design++; else if(db) s.zero_db++; else {s.zero_other++; if(zeroOther.length<40)zeroOther.push(r.id);} continue; }
    s.withTC++;
    let bad=false; for(const c of arr){ if(!c||typeof c!=='object'||(!('inputs'in c)&&!('input'in c))||(!('expected'in c)&&!('output'in c))){bad=true;break;} }
    if(bad)s.malformed++;
    if(cnt<3){ if(db)s.lt3_db++; else if(nonalgo)s.lt3_js++; else if(isDesign(r.id)||tags.includes('design'))s.lt3_other++; else {s.lt3_algo++; if(lt3algo.length<40)lt3algo.push(`${r.id}(${cnt})`);} }
    else s.ge3++;
  }
  if(data.length<300)break; process.stderr.write('.');
}
console.log('\n'+JSON.stringify(s,null,2));
console.log('\nZERO-TC not design/db (REAL GAPS):', zeroOther.join(', ')||'NONE');
console.log('\nALGO problems with <3 TC (thin, real):', lt3algo.join(', ')||'NONE');
