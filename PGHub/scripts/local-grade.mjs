import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const py=(s)=>{const p=s?.python;if(!p)return null;if(typeof p==='string')return p;if(p&&typeof p==='object'&&typeof p.code==='string')return p.code;return null;};
const LIMIT=process.argv.includes('--limit')?+process.argv[process.argv.indexOf('--limit')+1]:0;
const IDSF=process.argv.includes('--ids')?process.argv[process.argv.indexOf('--ids')+1]:null;
const ONLY=IDSF?new Set(JSON.parse(fs.readFileSync(IDSF,'utf8'))):null;

const summary={total:0,noSolution:0,noTests:0,allPass:0,someFail:0,structural:0,errorOnly:0};
const problemFails=[]; // {id, name, fail, error, npass, ntests}
let scanned=0;
for(let from=0;;from+=300){
  let data,error;
  for(let a=0;a<4;a++){({data,error}=await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,solutions,test_cases').order('id').range(from,from+299));if(!error)break;}
  if(error){console.error('ERR',error.message);break;}
  for(const r of data){
    if(ONLY&&!ONLY.has(r.id)) continue;
    scanned++; summary.total++;
    const code=py(r.solutions);
    const tcs=Array.isArray(r.test_cases)?r.test_cases.filter(t=>Array.isArray(t?.inputs)):[];
    if(!code){ summary.noSolution++; continue; }
    if(!tcs.length){ summary.noTests++; continue; }
    if(!r.method_name){ summary.noSolution++; continue; }
    const payload={code,method_name:r.method_name,param_types:(r.params||[]).map(p=>p.type),return_type:r.return_type||'',
      cases:tcs.map(t=>({inputs:t.inputs,expected:typeof t.expected==='string'?t.expected:JSON.stringify(t.expected)}))};
    const proc=spawnSync('python3',['scripts/local_grade.py'],{input:JSON.stringify(payload),encoding:'utf8',timeout:45000,maxBuffer:100000000});
    let g; try{ g=JSON.parse((proc.stdout||'').trim().split('\n').pop()); }catch{ summary.errorOnly++; problemFails.push({id:r.id,name:r.name,fail:0,error:tcs.length,npass:0,ntests:tcs.length,why:'harness-crash',detail:(proc.stderr||'').slice(-100)}); continue; }
    if(g.skip){ summary.structural++; continue; }
    const npass=(g.pass||0)+(g.pass_unordered||0);
    const nbad=(g.fail||0)+(g.error||0);
    if(nbad===0){ summary.allPass++; }
    else { summary.someFail++; problemFails.push({id:r.id,name:r.name,fail:g.fail||0,error:g.error||0,npass,ntests:tcs.length,samples:g.fails}); }
  }
  process.stderr.write(`\rscanned ${scanned} | allPass ${summary.allPass} someFail ${summary.someFail} noSol ${summary.noSolution} struct ${summary.structural}`);
  if(data.length<300)break;
  if(LIMIT&&scanned>=LIMIT)break;
}
fs.writeFileSync('/tmp/grade-report.json', JSON.stringify({summary,problemFails},null,0));
console.error('\n\n=== LOCAL GRADE REPORT ===');
console.error(JSON.stringify(summary,null,2));
console.error('problems with failing cases:',problemFails.length,'-> /tmp/grade-report.json');
