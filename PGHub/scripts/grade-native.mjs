import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, JAVA_CASE_SEP, JAVA_OUT_END } from '../src/lib/driverCode.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const arg = (f,d)=>{const i=process.argv.indexOf(f);return i>=0?process.argv[i+1]:d;};
const LANG = arg('--lang','java');
const LIMIT = +arg('--limit','300');
const MAXCASES = +arg('--maxcases','20');
const IDSF = arg('--ids',null);
const ONLY = IDSF ? new Set(JSON.parse(fs.readFileSync(IDSF,'utf8'))) : null;
const langCode = (s)=>{const p=s?.[LANG];if(!p)return null;if(typeof p==='string')return p;if(p&&typeof p==='object'&&typeof p.code==='string')return p.code;return null;};

const DIR = fs.mkdtempSync(os.tmpdir()+'/native-');
// The driver already defines ListNode/TreeNode/Node; strip any copy the stored solution
// bundles (LeetCode submissions often include them) to avoid a duplicate-class compile error.
function stripNodeClasses(code){
  for (const kw of ['class','struct']){
    for (const name of ['ListNode','TreeNode','Node']){
      let idx;
      while ((idx = code.search(new RegExp(`(^|\\n)\\s*(public\\s+)?${kw}\\s+${name}\\b`))) >= 0){
        const braceStart = code.indexOf('{', idx);
        if (braceStart < 0) break;
        let depth=0, end=-1;
        for (let i=braceStart;i<code.length;i++){ if(code[i]==='{')depth++; else if(code[i]==='}'){depth--; if(depth===0){end=i;break;}} }
        if (end<0) break;
        let cut = end+1;
        if (kw==='struct' && code[cut]===';') cut++;  // struct X {...};
        code = code.slice(0,idx) + '\n' + code.slice(cut);
      }
    }
  }
  return code;
}
function deepEq(a,b){
  if(typeof a==='boolean'||typeof b==='boolean') return a===b;
  if(typeof a==='number'&&typeof b==='number'){ if(!Number.isInteger(a)||!Number.isInteger(b)) return Math.abs(a-b)<=1e-4*Math.max(1,Math.abs(a),Math.abs(b)); return a===b; }
  if(Array.isArray(a)&&Array.isArray(b)){ if(a.length!==b.length)return false; for(let i=0;i<a.length;i++) if(!deepEq(a[i],b[i]))return false; return true; }
  if(a&&b&&typeof a==='object'&&typeof b==='object'){ const ka=Object.keys(a),kb=Object.keys(b); if(ka.length!==kb.length)return false; for(const k of ka) if(!deepEq(a[k],b[k]))return false; return true; }
  return a===b;
}
function eq(got, want, isStr){
  if(got===undefined) return false;
  const g=String(got).trim(), w=String(want).trim();
  if(isStr) return g===w;
  if(g===w) return true;
  try{ return deepEq(JSON.parse(g), JSON.parse(w)); }catch{}
  return false;
}

function runJava(code, method, params, rt, cases){
  const wrapped = wrapWithDriver(stripNodeClasses(code), 'java', method, params, rt, {multiCaseCount:cases.length});
  let mainClass='Main';
  for(const s of wrapped.split(/\bclass\s+/)){ if(/public static void main/.test(s)){ mainClass=(s.match(/^(\w+)/)||[])[1]||'Main'; break; } }
  fs.writeFileSync(`${DIR}/${mainClass}.java`, wrapped);
  const comp = spawnSync('javac',[`${DIR}/${mainClass}.java`,'-d',DIR],{encoding:'utf8',timeout:30000});
  if(comp.status!==0) return {compile:false, err:(comp.stderr||'').split('\n').filter(Boolean).slice(0,2).join(' ').slice(0,120)};
  const stdin = cases.map(c=>c.inputs.join('\n')).join('\n'+JAVA_CASE_SEP+'\n')+'\n';
  const run = spawnSync('java',['-cp',DIR,mainClass],{input:stdin,encoding:'utf8',timeout:15000,maxBuffer:5e7});
  const parts = (run.stdout||'').split(JAVA_OUT_END+'\n').map(p=>p.replace(/\n$/,''));
  return {compile:true, parts, timedOut: run.signal==='SIGTERM'};
}
function runCpp(code, method, params, rt, cases){
  const wrapped = wrapWithDriver(stripNodeClasses(code), 'cpp', method, params, rt, {multiCaseCount:cases.length});
  fs.writeFileSync(`${DIR}/main.cpp`, wrapped);
  const comp = spawnSync('g++',['-std=c++17','-O1','-I','scripts/_cppshim',`${DIR}/main.cpp`,'-o',`${DIR}/a.out`],{encoding:'utf8',timeout:40000});
  if(comp.status!==0) return {compile:false, err:(comp.stderr||'').split('\n').filter(Boolean).slice(0,2).join(' ').slice(0,120)};
  const stdin = cases.map(c=>c.inputs.join('\n')).join('\n'+JAVA_CASE_SEP+'\n')+'\n';
  const run = spawnSync(`${DIR}/a.out`,[],{input:stdin,encoding:'utf8',timeout:15000,maxBuffer:5e7});
  const parts = (run.stdout||'').split(JAVA_OUT_END+'\n').map(p=>p.replace(/\n$/,''));
  return {compile:true, parts, timedOut: run.signal==='SIGTERM'};
}

const summary = {total:0,noSol:0,noTests:0,allPass:0,someFail:0,compileFail:0,timeout:0};
const fails = [];
let scanned=0, processed=0;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
// RESIZE-SAFE: small pages + pacing so a full sweep never bursts the giant test_cases JSONB.
const PAGE=100;
for (let from=0;;from+=PAGE){
  let data,error;
  for(let a=0;a<4;a++){({data,error}=await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,solutions,test_cases').order('id').range(from,from+PAGE-1));if(!error)break;await sleep(2000*(a+1));}
  if(error){console.error('ERR',error.message);break;}
  await sleep(300);
  for(const r of data){
    if(ONLY && !ONLY.has(r.id)) continue;
    if(!ONLY && processed>=LIMIT) break;
    scanned++;
    const code=langCode(r.solutions);
    let tcs=Array.isArray(r.test_cases)?r.test_cases.filter(t=>Array.isArray(t?.inputs)):[];
    if(!code||!r.method_name){ summary.noSol++; continue; }
    if(!tcs.length){ summary.noTests++; continue; }
    tcs = tcs.slice(0, MAXCASES);
    processed++; summary.total++;
    const params=(r.params||[]);
    const rt=r.return_type||'int';
    const isStr = rt==='str'||rt==='string';
    let res;
    try{ res = LANG==='java'?runJava(code,r.method_name,params,rt,tcs):runCpp(code,r.method_name,params,rt,tcs); }
    catch(e){ res={compile:false,err:'harness:'+String(e.message).slice(0,60)}; }
    if(!res.compile){ summary.compileFail++; fails.push({id:r.id,why:'compile',err:res.err}); continue; }
    if(res.timedOut){ summary.timeout++; fails.push({id:r.id,why:'timeout'}); continue; }
    let bad=0; const samples=[];
    for(let i=0;i<tcs.length;i++){ const exp=isStr?String(tcs[i].expected):tcs[i].expected;
      if(!eq(res.parts[i], exp, isStr)){ bad++; if(samples.length<3) samples.push({i,got:String(res.parts[i]).slice(0,40),want:String(exp).slice(0,40)}); } }
    if(bad===0) summary.allPass++;
    else { summary.someFail++; fails.push({id:r.id,name:r.name,bad,n:tcs.length,samples}); }
  }
  process.stderr.write(`\r${LANG} scanned ${scanned} processed ${processed} | pass ${summary.allPass} fail ${summary.someFail} compileFail ${summary.compileFail}`);
  if(data.length<PAGE) break;
  if(!ONLY && processed>=LIMIT) break;
}
try{ fs.rmSync(DIR,{recursive:true,force:true}); }catch{}
fs.writeFileSync(`/tmp/grade-${LANG}-report.json`, JSON.stringify({summary,fails},null,0));
console.error(`\n\n=== ${LANG.toUpperCase()} NATIVE GRADE ===`);
console.error(JSON.stringify(summary,null,2));
console.error('fails ->',`/tmp/grade-${LANG}-report.json`);
