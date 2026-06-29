// Grade a single Python solution against ALL preserved test cases for one problem id,
// on local Judge0. On 100% pass, read-modify-write solutions.python (preserving others).
// Usage:
//   node scripts/_stub-grade-one.mjs <id> /path/to/solution.py [--write] [--approach "..."] [--complexity "..."]
// solution.py must contain the full `class Solution: def <method>(self,...): ...`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const { createClient } = await import('@supabase/supabase-js');
const { wrapWithDriver, buildStdin } = await import('../src/lib/driverCode.js');
const { compareOutputSmart, ORDER_INSENSITIVE } = await import('./sol-batches/grade-helpers.mjs');
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const J0 = (process.env.JUDGE0_URL||'http://localhost:2358').replace(/\/$/,'');
const TOK = process.env.JUDGE0_AUTH_TOKEN||'';
const HEAD = TOK ? {'content-type':'application/json','X-Auth-Token':TOK} : {'content-type':'application/json'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const id = process.argv[2];
const pyFile = process.argv[3];
const WRITE = process.argv.includes('--write');
const aIdx = process.argv.indexOf('--approach'); const approach = aIdx>=0?process.argv[aIdx+1]:'';
const cIdx = process.argv.indexOf('--complexity'); const complexity = cIdx>=0?process.argv[cIdx+1]:'';
const code = fs.readFileSync(pyFile,'utf8');

async function run(src, stdin){
  const url=`${J0}/submissions?base64_encoded=false&wait=true`;
  for(let a=1;a<=4;a++){
    try{
      const res=await fetch(url,{method:'POST',headers:HEAD,body:JSON.stringify({language_id:71,source_code:src,stdin,cpu_time_limit:8,wall_time_limit:15})});
      if(!res.ok){const b=await res.text().catch(()=>'');throw new Error('HTTP '+res.status+' '+b.slice(0,120));}
      const d=await res.json();
      const st=(d?.status?.description||'').toLowerCase();
      if(st&&st!=='accepted'){const det=(d.stderr||d.compile_output||d.message||st).toString().slice(0,300);return{ok:false,err:d.status.description+': '+det};}
      return {ok:true,stdout:(d.stdout||'').replace(/\r\n/g,'\n').replace(/\n$/,'')};
    }catch(e){await sleep(500*a);}
  }
  return {ok:false,err:'judge0 unreachable'};
}

const {data:p,error}=await sb.from('PGcode_problems').select('id,method_name,params,return_type,test_cases,solutions').eq('id',id).maybeSingle();
if(error||!p){console.log(JSON.stringify({id,result:'ERR',note:error?.message||'not found'}));process.exit(0);}
const cases=Array.isArray(p.test_cases)?p.test_cases:[];
if(cases.length<2){console.log(JSON.stringify({id,result:'SKIP',note:'<2 cases'}));process.exit(0);}
const isNullExp=(e)=>e==null||e==='null';
const gradable=cases.filter(t=>t&&!isNullExp(t.expected));
if(gradable.length<2){console.log(JSON.stringify({id,result:'SKIP',note:'<2 gradable cases (null expected)'}));process.exit(0);}
let wrapped;
try{ wrapped=wrapWithDriver(code,'python',p.method_name,p.params,p.return_type); }
catch(e){console.log(JSON.stringify({id,result:'WRAPERR',note:e.message.slice(0,150)}));process.exit(0);}
const oi=ORDER_INSENSITIVE.has(id);
let passed=0;
for(let i=0;i<cases.length;i++){
  const tc=cases[i];
  if(isNullExp(tc.expected)){continue;} // ungradable null-expected case: neither pass nor fail
  const r=await run(wrapped, buildStdin(tc.inputs)+'\n');
  if(!r.ok){console.log(JSON.stringify({id,result:'FAIL',case:i,passed,total:gradable.length,note:r.err,inputs:tc.inputs}));process.exit(0);}
  if(!compareOutputSmart(r.stdout, tc.expected, {orderInsensitive:oi})){
    console.log(JSON.stringify({id,result:'WA',case:i,passed,total:gradable.length,got:r.stdout.slice(0,120),want:String(tc.expected).slice(0,120),inputs:tc.inputs}));
    process.exit(0);
  }
  passed++;
}
if(!WRITE){console.log(JSON.stringify({id,result:'PASS-DRY',passed,total:gradable.length}));process.exit(0);}
const existing = (p.solutions&&typeof p.solutions==='object')?p.solutions:{};
const merged={...existing, python:{code, ...(approach?{approach}:{}), ...(complexity?{complexity}:{})}};
const {error:up}=await sb.from('PGcode_problems').update({solutions:merged}).eq('id',id);
if(up){console.log(JSON.stringify({id,result:'DBERR',note:up.message}));process.exit(0);}
console.log(JSON.stringify({id,result:'WRITTEN',passed,total:gradable.length}));
