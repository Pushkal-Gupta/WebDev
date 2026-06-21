import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __d = path.dirname(fileURLToPath(import.meta.url));
for(const line of fs.readFileSync(path.join(__d,'..','.env'),'utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ids=process.argv.slice(2);
for(const id of ids){
  const {data,error}=await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,test_cases').eq('id',id).maybeSingle();
  if(error||!data){console.log(id,'ERR',error?.message||'not found');continue;}
  const tc=Array.isArray(data.test_cases)?data.test_cases:[];
  console.log('### '+id+' | '+data.method_name+'('+(data.params||[]).map(p=>p.name+':'+p.type).join(', ')+') -> '+data.return_type);
  console.log('   tests:'+tc.length+'  ex0 inputs:'+JSON.stringify(tc[0]?.inputs)+'  expected:'+JSON.stringify(tc[0]?.expected));
}
process.exit(0);
