import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const py=(s)=>{const p=s?.python;return typeof p==='string'?p:p?.code;};
const f=JSON.parse(fs.readFileSync('/tmp/families.json','utf8'));
const batch=[...f.gcd,...f.mathFormula.slice(0,10),...f.power.slice(0,6)].slice(0,22);
const {data}=await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,solutions,test_cases').in('id',batch);
const out=data.map(r=>({id:r.id,name:r.name,method:r.method_name,params:r.params,rt:r.return_type,py:py(r.solutions),tc:(r.test_cases||[]).slice(0,3).map(t=>({in:t.inputs,exp:t.expected}))}));
fs.writeFileSync('/tmp/author-batch.json',JSON.stringify(out,null,1));
console.log('fetched',out.length,'problems to hand-author');
out.forEach(p=>console.log('  '+p.id+' | '+p.method+'('+p.params.map(x=>x.name).join(',')+') ->'+p.rt+' | '+(p.py||'').replace(/\n/g,' ').slice(0,80)));
