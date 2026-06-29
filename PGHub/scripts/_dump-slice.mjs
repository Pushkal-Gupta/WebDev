import fs from 'node:fs';
for (const line of fs.readFileSync('.env','utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const { createClient } = await import('@supabase/supabase-js');
const sb=createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const targets=JSON.parse(fs.readFileSync('scripts/stub-targets.json','utf8')).slice(300,350);
const corrupt=new Set(JSON.parse(fs.readFileSync('scripts/stub-corrupted-expected.json','utf8')));
const out=[];
for(const id of targets){
  const {data,error}=await sb.from('PGcode_problems').select('id,title:name,description,method_name,params,return_type,test_cases,constraints,solutions').eq('id',id).maybeSingle();
  if(error){out.push({id,err:error.message});continue;}
  if(!data){out.push({id,err:'not found'});continue;}
  const tc=Array.isArray(data.test_cases)?data.test_cases:[];
  const nonNull=tc.filter(t=>t&&t.expected!=null);
  out.push({id, corrupt:corrupt.has(id), title:data.title, method:data.method_name, params:data.params, ret:data.return_type, nCases:tc.length, nonNullExpected:nonNull.length, pyStub:data.solutions?.python, descLen:(data.description||'').length});
}
fs.writeFileSync('/tmp/slice-meta.json', JSON.stringify(out,null,1));
console.log('dumped', out.length);
for(const o of out){ console.log(`${o.corrupt?'[C]':'   '} ${o.id.padEnd(60)} ${String(o.nCases).padStart(3)}c/${String(o.nonNullExpected).padStart(3)}nn  ${o.method}(${(o.params||[]).map(p=>p.name+':'+p.type).join(', ')}) -> ${o.ret}`); }
