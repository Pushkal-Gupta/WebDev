import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';
import SOLUTIONS from './_tmp_slice_solutions.mjs';

// env
const env = fs.readFileSync('.env','utf8');
for (const line of env.split('\n')){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const JUDGE0_URL=(process.env.JUDGE0_URL||'http://localhost:2358').replace(/\/$/,'');
const J0_HEADERS={'content-type':'application/json','X-Auth-Token':process.env.JUDGE0_AUTH_TOKEN||''};
const PY=71;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const DRY = process.argv.includes('--dry');

async function judgeRun(src,stdin){
  let lastErr;
  for(let a=1;a<=4;a++){
    try{
      const res=await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,{method:'POST',headers:J0_HEADERS,body:JSON.stringify({language_id:PY,source_code:src,stdin,cpu_time_limit:8,wall_time_limit:15})});
      if(!res.ok){throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0,100)}`);}
      const d=await res.json();
      const st=(d?.status?.description||'').toLowerCase();
      if(st&&st!=='accepted'){return{ok:false,stdout:'',error:`${d?.status?.description}: ${(d.stderr||d.compile_output||d.message||'').toString().slice(0,200)}`};}
      return{ok:true,stdout:(d.stdout||'').replace(/\r\n/g,'\n').replace(/\n$/,'')};
    }catch(e){lastErr=e;await sleep(500*a*a);}
  }
  return{ok:false,stdout:'',error:`judge0 unreachable: ${lastErr?.message}`};
}

// findMatrix accepts ANY valid grouping; stored expected fixes one order, so compare
// as multiset-of-multisets (canonicalize sorts rows AND elements within rows).
const ORDER_INSENSITIVE_LOCAL = new Set([...ORDER_INSENSITIVE, 'convert-an-array-into-a-2d-array-with-conditions']);

const slugs=Object.keys(SOLUTIONS);
const report={pass:[],writeFail:[],skipped:[],suspectTests:[]};

for(const slug of slugs){
  process.stdout.write(`\n▶ ${slug} ... `);
  const {data:p,error}=await sb.from('PGcode_problems')
    .select('id,name,description,method_name,params,return_type,test_cases,constraints,solutions')
    .eq('id',slug).maybeSingle();
  if(error||!p){report.skipped.push([slug,error?.message||'not found']);console.log('SKIP (fetch)');continue;}
  const cases=Array.isArray(p.test_cases)?p.test_cases.filter(t=>t&&t.expected!=null&&Array.isArray(t.inputs)):[];
  if(cases.length<2){report.skipped.push([slug,`<2 valid cases (${cases.length})`]);console.log('SKIP (<2 cases)');continue;}
  const code=SOLUTIONS[slug];
  let wrapped;
  try{ wrapped=wrapWithDriver(code,'python',p.method_name,p.params,p.return_type); }
  catch(e){ report.writeFail.push([slug,`wrap error: ${e.message.slice(0,80)}`]);console.log('WRAP-FAIL');continue; }
  let allPass=true, firstFail=null, passed=0;
  for(let i=0;i<cases.length;i++){
    const tc=cases[i];
    const stdin=buildStdin(tc.inputs)+'\n';
    const r=await judgeRun(wrapped,stdin);
    if(!r.ok){ allPass=false; firstFail={i,reason:r.error,inputs:tc.inputs}; break; }
    if(!compareOutputSmart(r.stdout,tc.expected,{orderInsensitive:ORDER_INSENSITIVE_LOCAL.has(slug)})){
      allPass=false; firstFail={i,got:r.stdout,want:tc.expected,inputs:tc.inputs}; break;
    }
    passed++;
    await sleep(60);
  }
  if(allPass){
    process.stdout.write(`PASS ${passed}/${cases.length} `);
    const existing=(p.solutions&&typeof p.solutions==='object')?p.solutions:{};
    const merged={...existing, python:{code, approach:`Direct solution for ${p.name}.`, complexity:''}};
    if(!DRY){
      const {error:upErr}=await sb.from('PGcode_problems').update({solutions:merged}).eq('id',slug);
      if(upErr){report.writeFail.push([slug,`db-error: ${upErr.message}`]);console.log('DB-FAIL');continue;}
    }
    report.pass.push([slug,passed]);
    console.log(DRY?'(dry, not written)':'WRITTEN');
  }else{
    const ff=firstFail;
    const detail=ff.reason?`case ${ff.i} ERR: ${ff.reason}`:`case ${ff.i} WA got=${JSON.stringify(ff.got).slice(0,50)} want=${JSON.stringify(ff.want).slice(0,50)} inputs=${JSON.stringify(ff.inputs).slice(0,60)}`;
    report.writeFail.push([slug,detail]);
    console.log(`FAIL @${passed} -> ${detail.slice(0,90)}`);
  }
}

console.log('\n\n================ REPORT ================');
console.log(`PASS+WRITTEN (${report.pass.length}):`, report.pass.map(x=>x[0]).join(', '));
console.log(`\nFAIL (${report.writeFail.length}):`);
for(const [s,r] of report.writeFail) console.log(`  ${s}: ${r}`);
console.log(`\nSKIPPED (${report.skipped.length}):`);
for(const [s,r] of report.skipped) console.log(`  ${s}: ${r}`);
fs.writeFileSync('/tmp/grade_report.json',JSON.stringify(report,null,2));
