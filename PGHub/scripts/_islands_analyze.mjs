import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __d = path.dirname(fileURLToPath(import.meta.url));
for(const line of fs.readFileSync(path.join(__d,'..','.env'),'utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data}=await sb.from('PGcode_problems').select('test_cases').eq('id','number-of-islands').maybeSingle();
let intGrid=0, strGrid=0, intExpNonZero=0;
(data.test_cases||[]).forEach((tc,i)=>{
  const raw=tc.inputs[0];
  const hasQuote=raw.includes('"');
  if(hasQuote) strGrid++; else { intGrid++; if(tc.expected!=='0') intExpNonZero++; }
});
console.log('total',data.test_cases.length,'strGrid',strGrid,'intGrid',intGrid,'intGrid-with-nonzero-expected',intExpNonZero);
process.exit(0);
