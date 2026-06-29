import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart } from './sol-batches/grade-helpers.mjs';
import CANON from './sol-batches/wave-stubpy-A1.mjs';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const URL='http://localhost:2358', TOK='pgcode-local-j0-tok';
const HEAD={'content-type':'application/json','X-Auth-Token':TOK};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function j0(code,stdin){for(let a=1;a<=4;a++){try{const res=await fetch(`${URL}/submissions?base64_encoded=false&wait=true`,{method:'POST',headers:HEAD,body:JSON.stringify({language_id:71,source_code:code,stdin,cpu_time_limit:6,wall_time_limit:12})});const d=await res.json();const st=(d?.status?.description||'').toLowerCase();if(st&&st!=='accepted')return{ok:false,error:st+': '+(d.stderr||d.compile_output||'').slice(0,150)};return{ok:true,stdout:(d.stdout||'').replace(/\r\n/g,'\n').replace(/\n$/,'')};}catch(e){await sleep(400*a);}}return{ok:false,error:'unreachable'};}
// problem -> {orderInsensitive, skipCorruptIdx}
const SPEC = {
  'binary-tree-paths': { oi:true, skip:[] },
  'binary-tree-coloring-game': { oi:false, skip:[] },
  'binary-tree-maximum-path-sum': { oi:false, skip:[] },
};
for (const slug of Object.keys(SPEC)) {
  const { data } = await sb.from('PGcode_problems').select('method_name,params,return_type,test_cases').eq('id',slug).maybeSingle();
  const wrapped = wrapWithDriver(CANON[slug].python,'python',data.method_name,data.params,data.return_type);
  const fails=[];
  for (let i=0;i<data.test_cases.length;i++){
    const tc=data.test_cases[i];
    const r=await j0(wrapped,buildStdin(tc.inputs)+'\n');
    if(!r.ok){fails.push([i,'RTE:'+r.error,JSON.stringify(tc.inputs).slice(0,50),JSON.stringify(tc.expected)]);continue;}
    if(!compareOutputSmart(r.stdout,tc.expected,{orderInsensitive:SPEC[slug].oi})){fails.push([i,'WA got '+JSON.stringify(r.stdout).slice(0,40)+' want '+JSON.stringify(tc.expected).slice(0,40),JSON.stringify(tc.inputs).slice(0,50)]);}
  }
  console.log(`==== ${slug}: ${data.test_cases.length-fails.length}/${data.test_cases.length} pass (oi=${SPEC[slug].oi})`);
  fails.forEach(f=>console.log('   FAIL',...f));
}
