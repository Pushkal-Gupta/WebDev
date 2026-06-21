import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __d = path.dirname(fileURLToPath(import.meta.url));
for(const line of fs.readFileSync(path.join(__d,'..','.env'),'utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const id=process.argv[2]; const n=Number(process.argv[3]||'5');
const {data}=await sb.from('PGcode_problems').select('method_name,params,return_type,test_cases').eq('id',id).maybeSingle();
console.log(id,'|',data.method_name,'params',JSON.stringify(data.params),'ret',data.return_type);
(data.test_cases||[]).slice(0,n).forEach((tc,i)=>console.log('  ['+i+'] in='+JSON.stringify(tc.inputs)+' exp='+JSON.stringify(tc.expected)));
process.exit(0);
