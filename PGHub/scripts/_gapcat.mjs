import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fails=JSON.parse(fs.readFileSync('/tmp/richThin/out-gap.fails.json','utf8')).map(x=>x[0]);
const cat={sql:0,jsPandas:0,design:0,formula:0,other:0};
for(let i=0;i<fails.length;i+=100){
  let data,error;
  for(let a=0;a<4;a++){({data,error}=await sb.from('PGcode_problems').select('id,tags,return_type').in('id',fails.slice(i,i+100)));if(!error)break;await sleep(1500);}
  if(!data)continue;
  for(const r of data){ const t=(r.tags||[]).join(' ').toLowerCase();
    if(/database|sql/.test(t))cat.sql++;
    else if(/javascript|pandas|shell/.test(t)||/^(Any|Table)$/.test(r.return_type||''))cat.jsPandas++;
    else if(/design/.test(t))cat.design++;
    else cat.formula++; }
  await sleep(250);
}
console.log('non-traceable 1129 by type:',JSON.stringify(cat));
