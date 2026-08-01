import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const args=process.argv.slice(2);
const idsFile=args[args.indexOf('--ids')+1];
const outFile=args[args.indexOf('--out')+1] || '/tmp/richThin/out-auto.json';
const ids=JSON.parse(fs.readFileSync(idsFile,'utf8'));

const py=(s)=>{const p=s?.python;if(!p)return null;if(typeof p==='string')return p;if(p&&typeof p==='object'&&typeof p.code==='string')return p.code;return null;};
const isList=(t)=>/^List\[/.test(t||'');
const isStr=(t)=>t==='str';
function parseLit(s){ try{ return JSON.parse(s);}catch{} try{ return JSON.parse(s.replace(/'/g,'"')); }catch{} return s.replace(/^"|"$/g,''); }

function primaryIndex(params){
  for(let i=0;i<params.length;i++) if(isList(params[i].type)) return i;
  for(let i=0;i<params.length;i++) if(isStr(params[i].type)) return i;
  return -1;
}
function sizeOf(v){
  if(Array.isArray(v)) return v.length;
  if(typeof v==='string') return v.length;
  if(typeof v==='number' && Number.isInteger(v)) return String(Math.abs(v)).length;
  return 0;
}
function pickTC(tcs, pi){
  // choose the test case whose most-animatable input sits in [8,14] (array/str length,
  // or an int's digit count for scalar/digit problems).
  let best=null, bestScore=-1;
  for(const tc of tcs){
    const ins=tc.inputs; if(!Array.isArray(ins)||!ins.length) continue;
    let L=0;
    if(pi>=0 && pi<ins.length) L=sizeOf(parseLit(ins[pi]));
    else for(const s of ins) L=Math.max(L, sizeOf(parseLit(s)));
    if(L===0) continue;
    let score;
    if(L>=8 && L<=12) score=100-Math.abs(10-L);
    else if(L<8) score=50+L;
    else if(L<=14) score=40-(L-12);
    else score=10-(L-14);
    if(score>bestScore){bestScore=score;best=tc;}
  }
  return best;
}

async function fetchBatch(chunk){
  for(let a=0;a<3;a++){
    const {data,error}=await sb.from('PGcode_problems').select('id,name,method_name,params,solutions,test_cases').in('id',chunk);
    if(!error) return data;
  }
  return [];
}

const results=[]; const fails=[];
let done=0;
for(let i=0;i<ids.length;i+=80){
  const rows=await fetchBatch(ids.slice(i,i+80));
  for(const r of rows){
    done++;
    const code=py(r.solutions);
    const params=r.params||[];
    if(!code){ fails.push([r.id,'no python']); continue; }
    if(!r.method_name){ fails.push([r.id,'no method']); continue; }
    const pi=primaryIndex(params);
    const tcs=Array.isArray(r.test_cases)?r.test_cases:[];
    const tc=pickTC(tcs,pi);
    if(!tc){ fails.push([r.id,'no usable tc']); continue; }
    const payload={
      code, method_name:r.method_name, inputs:tc.inputs,
      param_types:params.map(p=>p.type), param_names:params.map(p=>p.name)
    };
    const proc=spawnSync('python3',['scripts/trace_viz.py'],{input:JSON.stringify(payload),encoding:'utf8',timeout:15000});
    if(proc.status!==0){ fails.push([r.id, 'py-exit '+(proc.stderr||'').split('\n').filter(Boolean).pop()]); continue; }
    const lastLine=(proc.stdout||'').trim().split('\n').filter(Boolean).pop()||'';
    let out; try{ out=JSON.parse(lastLine); }catch{ fails.push([r.id,'bad-json']); continue; }
    if(!out.ok){ fails.push([r.id, out.error]); continue; }
    results.push({ id:r.id, viz_steps:{ title:r.name, renderer:out.renderer, frames:out.frames } });
  }
  process.stderr.write(`\r${done}/${ids.length} ok=${results.length} fail=${fails.length}`);
}
fs.writeFileSync(outFile, JSON.stringify(results));
console.error('\nwrote', outFile, 'ok=', results.length, 'fail=', fails.length);
// dump fail reasons summary
const byReason={}; for(const [,why] of fails){ const key=String(why).slice(0,40); byReason[key]=(byReason[key]||0)+1; }
console.error('fail reasons:', JSON.stringify(byReason,null,0));
fs.writeFileSync(outFile.replace('.json','.fails.json'), JSON.stringify(fails));
