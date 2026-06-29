// Stub-solution backfill harness for slice [0,50). Authors Python only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';
import { SOLUTIONS } from './_tmp-stub-solutions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const J0 = (process.env.JUDGE0_URL||'http://localhost:2358').replace(/\/$/,'');
const TOK = process.env.JUDGE0_AUTH_TOKEN||'';
const HEAD = TOK ? {'content-type':'application/json','X-Auth-Token':TOK} : {'content-type':'application/json'};
const sleep = ms => new Promise(r=>setTimeout(r,ms));

const argv = process.argv.slice(2);
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only')+1].split(',') : null;
const WRITE = argv.includes('--write');

async function judge(code, stdin) {
  const body = { language_id:71, source_code:code, stdin };
  const res = await fetch(`${J0}/submissions?base64_encoded=false&wait=true`, {method:'POST',headers:HEAD,body:JSON.stringify(body)});
  if (!res.ok) return {ok:false,error:`http ${res.status}`};
  const j = await res.json();
  if (j.status && j.status.id !== 3) {
    return {ok:false,error:(j.status.description||'')+' '+((j.stderr||j.compile_output||'').slice(0,200))};
  }
  return {ok:true, stdout:(j.stdout||'').replace(/\n$/,'')};
}

async function gradeOne(problem, code) {
  const cases = problem.test_cases;
  const wrapped = wrapWithDriver(code, 'python', problem.method_name, problem.params, problem.return_type);
  let pass=0;
  for (let i=0;i<cases.length;i++){
    const tc=cases[i];
    const stdin = buildStdin(tc.inputs)+'\n';
    const r = await judge(wrapped, stdin);
    if(!r.ok) return {pass:false, at:i, reason:r.error, inputs:tc.inputs};
    if(!compareOutputSmart(r.stdout, tc.expected, {orderInsensitive:ORDER_INSENSITIVE.has(problem.id)}))
      return {pass:false, at:i, reason:`WA got=${JSON.stringify(r.stdout).slice(0,80)} want=${JSON.stringify(tc.expected).slice(0,80)}`, inputs:tc.inputs};
    pass++;
    await sleep(15);
  }
  return {pass:true, total:cases.length};
}

const data = JSON.parse(fs.readFileSync('/tmp/slice-data.json','utf8'));

async function main(){
  const slugs = ONLY || Object.keys(SOLUTIONS);
  const results=[];
  for(const slug of slugs){
    const p = data[slug];
    if(!p || p.error){ console.log(`SKIP ${slug}: no data`); continue; }
    const cases = Array.isArray(p.test_cases)?p.test_cases:[];
    if(cases.length<2 || cases.every(c=>c.expected==null)){ console.log(`SKIP ${slug}: <2 cases or all-null`); results.push({slug,status:'skip-nocases'}); continue; }
    const code = SOLUTIONS[slug];
    if(!code){ console.log(`SKIP ${slug}: no authored solution`); continue; }
    process.stdout.write(`▶ ${slug} (${cases.length} cases) ... `);
    const g = await gradeOne(p, code);
    if(g.pass){
      console.log(`PASS ${g.total}/${g.total}`);
      results.push({slug,status:'pass',total:g.total});
      if(WRITE){
        const { data:fresh } = await sb.from('PGcode_problems').select('solutions').eq('id',slug).maybeSingle();
        const sol = (fresh && fresh.solutions && typeof fresh.solutions==='object') ? fresh.solutions : {};
        sol.python = { code, approach: SOLUTIONS['__approach__']?.[slug] || 'Direct algorithmic solution.', complexity: SOLUTIONS['__complexity__']?.[slug] || '' };
        const { error } = await sb.from('PGcode_problems').update({solutions:sol}).eq('id',slug);
        if(error){ console.log(`   WRITE-ERR ${error.message}`); results[results.length-1].status='write-err'; }
        else console.log(`   written`);
      }
    } else {
      console.log(`FAIL @case ${g.at}: ${g.reason}`);
      results.push({slug,status:'fail',at:g.at,reason:g.reason,inputs:g.inputs});
    }
  }
  console.log('\n===== SUMMARY =====');
  const pass=results.filter(r=>r.status==='pass').length;
  const fail=results.filter(r=>r.status==='fail');
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail.length} -> ${fail.map(f=>f.slug).join(', ')}`);
  fs.writeFileSync('/tmp/stub-results.json', JSON.stringify(results,null,1));
}
main().catch(e=>{console.error(e);process.exit(1);});
