import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const py=(s)=>{const p=s?.python;if(!p)return null;if(typeof p==='string')return p;if(p&&typeof p==='object'&&typeof p.code==='string')return p.code;return null;};
const isListOrStr=(t)=>/^List\[/.test(t||'')||t==='str';

// Keyset page by id over the viz-less rows only (filtered, not full-table). Light columns.
let last=''; const rows=[];
for(let guard=0; guard<40; guard++){
  let q=sb.from('PGcode_problems').select('id,name,method_name,params,solutions')
    .is('viz_steps',null).order('id',{ascending:true}).limit(100);
  if(last) q=q.gt('id',last);
  const {data,error}=await q;
  if(error){ console.error('err',error.message); break; }
  if(!data||!data.length) break;
  rows.push(...data); last=data[data.length-1].id;
  await new Promise(r=>setTimeout(r,250)); // pace: resize-safe
}
console.error('fetched gap rows:', rows.length);

const buckets={ authorable:[], no_python:[], no_method:[], sql:[], no_loop_scalar:[], design_interactive:[] };
for(const r of rows){
  const code=py(r.solutions);
  const params=r.params||[];
  const nm=(r.name||'').toLowerCase();
  if(!code){ buckets.no_python.push(r.id); continue; }
  if(/\bselect\b[\s\S]*\bfrom\b/i.test(code) && /pandas|DataFrame|sql/i.test(code+nm)){ buckets.sql.push(r.id); continue; }
  if(/DataFrame|pd\.|import pandas/.test(code)){ buckets.sql.push(r.id); continue; }
  if(!r.method_name){ buckets.no_method.push(r.id); continue; }
  const hasPrimary=params.some(p=>isListOrStr(p.type));
  const hasLoop=/\bfor\b|\bwhile\b/.test(code);
  if(hasPrimary && hasLoop){ buckets.authorable.push(r.id); continue; }
  if(hasLoop && !hasPrimary){ buckets.no_loop_scalar.push(r.id); continue; }
  buckets.design_interactive.push(r.id);
}
for(const [k,v] of Object.entries(buckets)) console.error(k, v.length);
fs.writeFileSync('/tmp/gap-authorable.json', JSON.stringify(buckets.authorable));
fs.writeFileSync('/tmp/gap-scalar.json', JSON.stringify(buckets.no_loop_scalar));
fs.writeFileSync('/tmp/gap-buckets.json', JSON.stringify(buckets));
console.error('wrote /tmp/gap-authorable.json (', buckets.authorable.length, ')');