import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
for(let i=1;i<=60;i++){
  const t0=Date.now();
  try{
    const {data,error}=await sb.from('PGcode_problems').select('id').limit(1);
    const dt=Date.now()-t0;
    if(!error && Array.isArray(data)){ console.log(`attempt ${i}: HEALTHY (${dt}ms)`); process.exit(0); }
    console.log(`attempt ${i}: err ${(error&&error.message||'?').slice(0,40)} (${dt}ms)`);
  }catch(e){ console.log(`attempt ${i}: throw ${String(e.message).slice(0,40)} (${Date.now()-t0}ms)`); }
  await sleep(60000);
}
console.log('gave up after 60 attempts'); process.exit(1);
