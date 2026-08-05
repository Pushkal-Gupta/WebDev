import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const NONNULL=new Set(['int','str','bool','float','string','boolean']);
const isMalformed=(exp, rt)=>{
  const s=(typeof exp==='string'?exp:JSON.stringify(exp));
  if(/(^|[^A-Za-z])(-?Infinity|NaN)([^A-Za-z]|$)/.test(s)) return 'infinity/nan';   // invalid JSON literal
  if((s==='null'||s==='None') && NONNULL.has((rt||'').trim())) return 'null-for-nonnullable';
  return null;
};
let scanned=0, probsAffected=0, casesPruned=0; const report=[];
for(let from=0;;from+=300){
  let data,error;
  for(let a=0;a<4;a++){({data,error}=await sb.from('PGcode_problems').select('id,return_type,test_cases').order('id').range(from,from+299));if(!error)break;}
  if(error){console.error(error.message);break;}
  for(const r of data){ scanned++;
    const tcs=Array.isArray(r.test_cases)?r.test_cases:[]; if(!tcs.length) continue;
    const keep=[]; const bad=[];
    for(const t of tcs){ const why=isMalformed(t.expected, r.return_type); if(why){bad.push({exp:String(t.expected).slice(0,30),why});} else keep.push(t); }
    if(bad.length && keep.length>=1){  // never prune ALL cases
      probsAffected++; casesPruned+=bad.length; report.push({id:r.id,rt:r.return_type,pruned:bad.length,kept:keep.length,sample:bad[0]});
      if(APPLY){ const {error:e2}=await sb.from('PGcode_problems').update({test_cases:keep}).eq('id',r.id); if(e2)console.error('upd',r.id,e2.message); }
    }
  }
  if(data.length<300)break; process.stderr.write('.');
}
fs.writeFileSync('/tmp/malformed-tc-report.json',JSON.stringify(report,null,0));
console.log(`\n${APPLY?'APPLIED':'DRY'} | scanned ${scanned} | problems affected ${probsAffected} | malformed cases ${casesPruned}`);
const byWhy={}; for(const x of report) byWhy[x.sample.why]=(byWhy[x.sample.why]||0)+1;
console.log('by reason:',JSON.stringify(byWhy));
report.slice(0,10).forEach(x=>console.log('  '+x.id+' ('+x.rt+') prune '+x.pruned+'/'+(x.pruned+x.kept)+' e.g. "'+x.sample.exp+'" ['+x.sample.why+']'));
