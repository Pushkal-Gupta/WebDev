import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
let from=0,rows=[];
while(true){const {data}=await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('return_type','str').range(from,from+999);if(!data||!data.length)break;rows=rows.concat(data);if(data.length<1000)break;from+=1000;}
console.log('str-return problems:',rows.length);
const broken=[];
for(const p of rows){
  const code=p.solutions?.python?.code; const tcs=Array.isArray(p.test_cases)?p.test_cases:[];
  if(!code||!/class\s+Solution/.test(code)||!tcs.length) continue;
  let wrapped; try{wrapped=wrapWithDriver(code,'python',p.method_name,p.params,p.return_type);}catch{continue;}
  let pass=0,fail=0,firstFail=null;
  for(const c of tcs){ let r; try{r=runLocal('python',wrapped,buildStdin(c.inputs)+'\n',{timeoutMs:6000});}catch{fail++;continue;} if(!r||!r.ok){fail++;continue;} const out=(r.stdout??'').replace(/\n$/,''); if(compareOutput(out,c.expected))pass++; else{fail++; if(!firstFail)firstFail={exp:c.expected,got:out};} }
  if(fail>0) broken.push({id:p.id,pass,fail,total:tcs.length,firstFail});
}
broken.sort((a,b)=>b.fail-a.fail);
console.log('BROKEN under strict compare:',broken.length);
for(const b of broken.slice(0,40)) console.log(`  ${b.id}: ${b.pass}/${b.total} pass, ${b.fail} fail | exp=${JSON.stringify(b.firstFail?.exp)?.slice(0,46)} got=${JSON.stringify(b.firstFail?.got)?.slice(0,46)}`);
fs.writeFileSync('/tmp/str-broken.json',JSON.stringify(broken,null,2));
