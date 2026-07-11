// Fully DEFINE placeholder problems: an agent supplies a real problem spec (title,
// description, constraints), the exact signature (method_name, params, return_type),
// a correct canonical Python, and in-domain inputs. This writes the whole definition
// and REBUILDS test_cases by running the canonical on each input (real expecteds).
// Only writes if the canonical yields >=10 clean graded cases.
//
// Input JSON: { slug: { title?, description, constraints, method_name, params:[{name,type}],
//   return_type, python, approach?, complexity?, hints?, inputs:[[inpStr,...],...] } }
//   node scripts/apply-defined.mjs --in /tmp/au/def-out-0.json
import fs from 'node:fs';import path from 'node:path';import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg=(k)=>{const i=process.argv.indexOf(`--${k}`);return i>=0?process.argv[i+1]:undefined;};
const IN=arg('in');const DRY=process.argv.includes('--dry');const TARGET=Number(arg('target')||50);
if(!IN){console.error('need --in');process.exit(1);}
const map=JSON.parse(fs.readFileSync(IN,'utf8'));let wrote=0,failed=0,tot=0;
for(const slug of Object.keys(map)){
  const e=map[slug]||{};const code=(e.python||'').trim();
  if(!/class\s+Solution/.test(code)||!e.method_name||!Array.isArray(e.params)||!e.return_type){console.log(`  x    ${slug}: incomplete def`);failed++;continue;}
  const {data,error}=await sb.from('PGcode_problems').select('id,solutions').eq('id',slug).single();
  if(error||!data){console.log(`  -    ${slug}: not found`);failed++;continue;}
  let wrapped;try{wrapped=wrapWithDriver(code,'python',e.method_name,e.params,e.return_type);}catch(err){console.log(`  x    ${slug}: wrap ${err.message.slice(0,40)}`);failed++;continue;}
  const seen=new Set();const cases=[];
  for(const tuple of (e.inputs||[])){if(cases.length>=TARGET)break;if(!Array.isArray(tuple))continue;const inputs=tuple.map(v=>String(v));const key=JSON.stringify(inputs);if(seen.has(key))continue;let r;try{r=runLocal('python',wrapped,buildStdin(inputs)+'\n',{timeoutMs:6000});}catch{continue;}if(!r||!r.ok)continue;const exp=(r.stdout??'').replace(/\n$/,'');if(exp==='')continue;seen.add(key);cases.push({inputs,expected:exp,is_sample:cases.length<2});}
  if(cases.length<10){console.log(`  x    ${slug}: only ${cases.length} clean cases (canonical/signature wrong?)`);failed++;continue;}
  const pyObj={code};if(e.approach&&e.approach.length>20)pyObj.approach=e.approach;if(e.complexity&&e.complexity.time)pyObj.complexity=e.complexity;
  const upd={method_name:e.method_name,params:e.params,return_type:e.return_type,solutions:{...(data.solutions||{}),python:pyObj},test_cases:cases};
  if(e.title)upd.name=e.title;if(e.description)upd.description=e.description;if(e.constraints)upd.constraints=e.constraints;if(Array.isArray(e.hints)&&e.hints.length)upd.hints=e.hints;
  if(!DRY){const {error:uerr}=await sb.from('PGcode_problems').update(upd).eq('id',slug);if(uerr){console.log(`  ERR  ${slug}: ${uerr.message.slice(0,50)}`);failed++;continue;}}
  wrote++;tot+=cases.length;console.log(`  DEFINED ${slug}: ${e.method_name}(${e.params.map(p=>p.type).join(',')})->${e.return_type} + ${cases.length} cases`);
}
console.log(`\n${DRY?'would-write':'wrote'}: ${wrote} | failed: ${failed} | total cases: ${tot}`);
