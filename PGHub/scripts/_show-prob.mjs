import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
for(const line of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const {createClient}=await import('@supabase/supabase-js');
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
for(const id of process.argv.slice(2)){
  const {data}=await sb.from('PGcode_problems').select('id,name,description,method_name,params,return_type,test_cases,constraints').eq('id',id).maybeSingle();
  console.log('\n========================================\nID:',id,'  method:',data.method_name,'->',data.return_type);
  console.log('params:',JSON.stringify(data.params));
  console.log('--- DESC ---\n'+(data.description||'').replace(/<[^>]+>/g,' ').replace(/\s+\n/g,'\n').replace(/[ \t]{2,}/g,' ').trim().slice(0,1400));
  console.log('--- CONSTRAINTS ---\n'+(data.constraints||'').toString().slice(0,400));
  console.log('--- TEST CASES ('+(data.test_cases||[]).length+') ---');
  (data.test_cases||[]).forEach((t,i)=>console.log(`  [${i}] inputs=${JSON.stringify(t.inputs)} expected=${JSON.stringify(t.expected)}`));
}
