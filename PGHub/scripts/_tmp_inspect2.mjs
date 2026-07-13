import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugs=JSON.parse(fs.readFileSync('/tmp/struct/slice-2.json','utf8')).map(x=>x.id);
for(const s of slugs){
  const {data}=await sb.from('PGcode_problems').select('id,test_cases').eq('id',s).single();
  const tc=data.test_cases||[];
  // check -1 in first-param array specifically
  let neg1inP0=false;
  for(const c of tc){const p0=(c.inputs||[])[0]||''; try{const a=JSON.parse(p0); if(Array.isArray(a)&&a.includes(-1))neg1inP0=true;}catch{}}
  console.log(`${s.padEnd(52)} n=${String(tc.length).padStart(3)} neg1inP0=${neg1inP0?'YES':'no'}`);
}
