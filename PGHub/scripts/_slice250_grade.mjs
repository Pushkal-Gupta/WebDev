import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';
import { SOLUTIONS } from './_slice250_solutions.mjs';

for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const JUDGE0_URL = (process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/$/,'');
const JUDGE0_AUTH = process.env.JUDGE0_AUTH_TOKEN || '';
const J0_HEADERS = JUDGE0_AUTH ? { 'content-type':'application/json','X-Auth-Token':JUDGE0_AUTH } : { 'content-type':'application/json' };
const APPLY = process.argv.includes('--apply');
const ONLY = (process.argv.find(a=>a.startsWith('--only='))||'').slice('--only='.length);

const data = JSON.parse(fs.readFileSync('/tmp/slice250_data.json','utf8'));
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function judgeRun(sourceCode, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt=1; attempt<=4; attempt++) {
    try {
      const res = await fetch(url,{method:'POST',headers:J0_HEADERS,body:JSON.stringify({language_id:71,source_code:sourceCode,stdin,cpu_time_limit:8,wall_time_limit:15})});
      if (!res.ok){ const b=await res.text().catch(()=> ''); throw new Error(`HTTP ${res.status} ${b.slice(0,120)}`); }
      const d = await res.json();
      const status=(d?.status?.description||'').toLowerCase();
      if (status && status!=='accepted'){ const det=(d.stderr||d.compile_output||d.message||status).toString().slice(0,300); return {ok:false,stdout:'',error:`${d?.status?.description}: ${det}`}; }
      return {ok:true,stdout:(d.stdout||'').replace(/\r\n/g,'\n').replace(/\n$/,''),error:null};
    } catch(e){ lastErr=e; await sleep(500*attempt); }
  }
  return {ok:false,stdout:'',error:`judge0 unreachable: ${lastErr?.message||'?'}`};
}

const results = { written:[], skipped:[], failing:[], suspectCases:[] };

for (const p of data) {
  if (p.skip){ results.skipped.push(`${p.slug} (${p.skip})`); continue; }
  const id = p.id;
  if (ONLY && id !== ONLY) continue;
  const code = SOLUTIONS[id];
  if (!code){ results.skipped.push(`${id} (no-authored-solution)`); continue; }
  const cases = Array.isArray(p.test_cases)? p.test_cases : [];
  const nonNull = cases.filter(c=>c && c.expected!=null && c.expected!=='');
  if (nonNull.length < 2){ results.skipped.push(`${id} (<2 valid cases)`); continue; }

  let wrapped;
  try { wrapped = wrapWithDriver(code,'python',p.method_name,p.params,p.return_type); }
  catch(e){ results.failing.push(`${id} (wrap error: ${e.message.slice(0,80)})`); continue; }

  let allPass=true, firstFail=null, passed=0;
  for (let i=0;i<cases.length;i++){
    const tc=cases[i];
    if (tc.expected==null || tc.expected==='') continue;
    const r = await judgeRun(wrapped, buildStdin(tc.inputs)+'\n');
    if (!r.ok){ allPass=false; firstFail={i,reason:r.error?.slice(0,160),inputs:tc.inputs,expected:tc.expected}; break; }
    if (!compareOutputSmart(r.stdout, tc.expected, {orderInsensitive:ORDER_INSENSITIVE.has(id)})){
      allPass=false; firstFail={i,reason:`WA got=${r.stdout.slice(0,80)} exp=${String(tc.expected).slice(0,80)}`,inputs:tc.inputs,expected:tc.expected}; break;
    }
    passed++;
  }

  if (allPass){
    results.written.push({id, cases:passed});
    if (APPLY){
      const { data:row, error:rerr } = await sb.from('PGcode_problems').select('solutions').eq('id',id).single();
      if (rerr){ results.failing.push(`${id} (read-back error: ${rerr.message})`); continue; }
      const sol = (row && typeof row.solutions==='object' && row.solutions) ? {...row.solutions} : {};
      sol.python = { code, approach:'Authored canonical Python solution, graded against all stored test cases via Judge0.', complexity:'See approach' };
      const { error:uerr } = await sb.from('PGcode_problems').update({solutions:sol}).eq('id',id);
      if (uerr){ results.failing.push(`${id} (update error: ${uerr.message})`); }
      else { console.log(`APPLIED ${id} (${passed} cases)`); }
    } else {
      console.log(`PASS ${id} (${passed}/${nonNull.length})`);
    }
  } else {
    results.failing.push(`${id} :: case ${firstFail.i} :: ${firstFail.reason} :: in=${JSON.stringify(firstFail.inputs)}`);
    console.log(`FAIL ${id} :: case ${firstFail.i} :: ${firstFail.reason}`);
  }
}

console.log('\n=== SUMMARY ===');
console.log('WRITTEN/PASS:', results.written.length, results.written.map(w=>w.id).join(', '));
console.log('SKIPPED:', results.skipped.length); results.skipped.forEach(s=>console.log('  -',s));
console.log('FAILING:', results.failing.length); results.failing.forEach(s=>console.log('  -',s));
fs.writeFileSync('/tmp/slice250_results.json', JSON.stringify(results,null,2));
