import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const py=(s)=>{const p=s?.python;return typeof p==='string'?p:p?.code;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const gap=JSON.parse(fs.readFileSync('/tmp/gap-remaining.json','utf8'));
const skip=new Set(JSON.parse(fs.readFileSync('/tmp/authored-done.json','utf8')));
const out=[]; const START=+(process.argv[2]||300);
for(let i=START;i<gap.length && out.length<40;i+=60){
  let data,error;
  for(let a=0;a<4;a++){ ({data,error}=await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,solutions,tags,test_cases').in('id',gap.slice(i,i+60))); if(!error)break; await sleep(1500); }
  if(!data)continue;
  for(const r of data){ if(skip.has(r.id))continue; const c=py(r.solutions)||''; const t=(r.tags||[]).join(' ').toLowerCase();
    if(/database|sql|javascript|pandas|design|shell/.test(t))continue;
    if(/^(Any|Table)$/.test(r.return_type||''))continue;
    const hasList=(r.params||[]).some(p=>/List|str/.test(p.type||'')); const hasLoop=/for |while /.test(c);
    if(!hasList||!hasLoop||c.length>420)continue;
    out.push({id:r.id,method:r.method_name,params:r.params,rt:r.return_type,py:c,tc:(r.test_cases||[]).slice(0,2).map(t=>({in:t.inputs,exp:t.expected}))}); }
  await sleep(250);
}
fs.writeFileSync('/tmp/alg-batch.json',JSON.stringify(out,null,1));
console.log('fetched',out.length,'(start='+START+')');
out.slice(0,28).forEach(p=>console.log('  '+p.id+' | '+(p.py||'').replace(/\s+/g,' ').slice(0,88)));
