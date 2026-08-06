import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// RESIZE-SAFE (2026-08-04 incident): small paced pages, minimal columns, resumable, one
// request at a time. Never full-table-scan the giant test_cases JSONB in tight succession.
const APPLY = process.argv.includes('--apply');
const PAGE = 50;               // small pages -> smaller per-request payload
const PACE_MS = 400;           // gap between requests -> no burst
const PROGRESS = '/tmp/malformed-prune-progress.json';
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const NONNULL = new Set(['int','str','bool','float','string','boolean']);
const isMalformed = (exp, rt)=>{
  const s = (typeof exp==='string'?exp:JSON.stringify(exp));
  if (/(^|[^A-Za-z])(-?Infinity|NaN)([^A-Za-z]|$)/.test(s)) return 'infinity/nan';
  if ((s==='null'||s==='None') && NONNULL.has((rt||'').trim())) return 'null-for-nonnullable';
  return null;
};

async function q(fn, tries=4){
  for (let a=0;a<tries;a++){ try{ const r=await fn(); if(!r.error) return r; }catch(e){} await sleep(1500*(a+1)); }
  return { data:null, error:{message:'retries-exhausted'} };
}

let state = { lastId:'', probsAffected:0, casesPruned:0, scanned:0, report:[] };
if (fs.existsSync(PROGRESS)){ try{ state = JSON.parse(fs.readFileSync(PROGRESS,'utf8')); console.error('resuming from', state.lastId); }catch{} }

for(;;){
  const { data, error } = await q(()=>sb.from('PGcode_problems')
    .select('id,return_type,test_cases')
    .gt('id', state.lastId).order('id').limit(PAGE));
  if (error){ console.error('page error, backing off:', error.message); await sleep(5000); continue; }
  if (!data || !data.length) break;
  for (const r of data){
    state.scanned++; state.lastId = r.id;
    const tcs = Array.isArray(r.test_cases) ? r.test_cases : [];
    if (!tcs.length) continue;
    const keep=[], bad=[];
    for (const t of tcs){ const why=isMalformed(t.expected, r.return_type); if(why) bad.push({exp:String(t.expected).slice(0,30),why}); else keep.push(t); }
    if (bad.length && keep.length>=1){
      state.probsAffected++; state.casesPruned+=bad.length;
      state.report.push({id:r.id,rt:r.return_type,pruned:bad.length,kept:keep.length,sample:bad[0]});
      if (APPLY){ const { error:e2 } = await q(()=>sb.from('PGcode_problems').update({test_cases:keep}).eq('id',r.id)); if(e2) console.error('update',r.id,e2.message); await sleep(PACE_MS); }
    }
  }
  fs.writeFileSync(PROGRESS, JSON.stringify(state));
  process.stderr.write(`\r${APPLY?'APPLY':'DRY'} scanned ${state.scanned} | affected ${state.probsAffected} | cases ${state.casesPruned} | @${state.lastId.slice(0,24)}`);
  await sleep(PACE_MS);
}
fs.writeFileSync('/tmp/malformed-tc-report.json', JSON.stringify(state.report,null,0));
const byWhy={}; for(const x of state.report) byWhy[x.sample.why]=(byWhy[x.sample.why]||0)+1;
console.error(`\n${APPLY?'APPLIED':'DRY'} done | scanned ${state.scanned} | problems affected ${state.probsAffected} | malformed cases ${state.casesPruned}`);
console.error('by reason:', JSON.stringify(byWhy));
state.report.slice(0,12).forEach(x=>console.error('  '+x.id+' ('+x.rt+') prune '+x.pruned+'/'+(x.pruned+x.kept)+' e.g "'+x.sample.exp+'" ['+x.sample.why+']'));
