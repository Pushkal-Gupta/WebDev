import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const py=(s)=>{const p=s?.python;if(!p)return null;if(typeof p==='string')return p;if(p&&typeof p==='object'&&typeof p.code==='string')return p.code;return null;};

let last=''; const rows=[];
for(let g=0; g<40; g++){
  let q=sb.from('PGcode_problems').select('id,name,method_name,params,solutions')
    .is('viz_steps',null).order('id',{ascending:true}).limit(100);
  if(last) q=q.gt('id',last);
  const {data,error}=await q; if(error){console.error(error.message);break;}
  if(!data||!data.length) break;
  rows.push(...data); last=data[data.length-1].id;
  await new Promise(r=>setTimeout(r,250));
}
console.error('gap rows:', rows.length);

const B={ no_solution:[], sql_pandas:[], design_ops:[], grid_table_str:[], grid_geo_int:[], scalar_formula:[], algo_handauthor:[] };
for(const r of rows){
  const code=py(r.solutions);
  const params=r.params||[];
  const nm=(r.name||'').toLowerCase();
  const ptypes=params.map(p=>(p.type||''));
  const pnames=params.map(p=>(p.name||'').toLowerCase()).join(',');
  if(!code){ B.no_solution.push(r.id); continue; }
  if(/DataFrame|import pandas|pd\.|\bSELECT\b[\s\S]*\bFROM\b/i.test(code)){ B.sql_pandas.push(r.id); continue; }
  // design/operation-sequence: name starts with Design, OR solution defines a stateful class used across ops,
  // OR a str param named operations/queries/actions with a parallel List[List] args param
  const isDesign = /^design\b/i.test(r.name) || /operations|queries|\bactions\b|commands/.test(pnames)
    || /class\s+\w+\s*:[\s\S]*def\s+__init__/.test(code) && /operations|queries/.test(pnames);
  if(isDesign){ B.design_ops.push(r.id); continue; }
  const has2Dstr = ptypes.some(t=>/List\[List\[str/.test(t));
  const has2Dint = ptypes.some(t=>/List\[List\[int/.test(t));
  if(has2Dstr){ B.grid_table_str.push(r.id); continue; }
  if(has2Dint){ B.grid_geo_int.push(r.id); continue; }
  const hasPrimary = ptypes.some(t=>/^List\[/.test(t)||t==='str');
  const hasLoop = /\bfor\b|\bwhile\b/.test(code);
  if(!hasPrimary){ B.scalar_formula.push(r.id); continue; }
  if(hasPrimary && hasLoop){ B.algo_handauthor.push(r.id); continue; }
  B.scalar_formula.push(r.id);
}
const summary={}; for(const [k,v] of Object.entries(B)){ summary[k]=v.length; fs.writeFileSync(`/tmp/gapcls_${k}.json`, JSON.stringify(v)); }
console.error(JSON.stringify(summary,null,2));
console.error('TOTAL classified:', Object.values(B).reduce((a,v)=>a+v.length,0));