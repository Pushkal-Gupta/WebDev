import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
for(let i=1;i<=48;i++){   // ~4h at 5-min spacing
  const t0=Date.now();
  try{
    const {data,error}=await sb.from('PGcode_problems').select('id').limit(1);
    if(!error && Array.isArray(data)){ console.log(`attempt ${i}: HEALTHY (${Date.now()-t0}ms)`); process.exit(0); }
  }catch(e){}
  console.log(`attempt ${i}: still down (${Date.now()-t0}ms) @ ${new Date().toISOString().slice(11,19)}`);
  await sleep(300000);
}
console.log('still down after ~4h'); process.exit(1);
