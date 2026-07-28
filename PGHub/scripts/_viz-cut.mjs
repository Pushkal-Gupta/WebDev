import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const START_WAVE = parseInt(process.argv[2] || '34', 10);
const COUNT_ONLY = process.argv.includes('--count');
let rows = [];
for (let from=0;;from+=1000){const {data,error}=await sb.from('PGcode_problems').select('id,name,pattern,difficulty,method_name,params,tags,description,solutions').is('viz_steps',null).order('id').range(from,from+999);if(error){console.error(error.message);process.exit(1);}rows=rows.concat(data);if(data.length<1000)break;}
const NONALGO=new Set(['database','shell','concurrency','javascript','typescript','pandas']);
function classify(r){
  const tags=r.tags||[]; const s=r.solutions||{};
  const real=k=>typeof s[k]==='string'&&s[k].trim().length>=20&&!/Reference skeleton/.test(s[k])&&/\breturn\b/.test(s[k]);
  const desc=r.description||'';
  const naDesc=/DataFrame|Write a function that|Enhance all functions|callPolyfill|Promise|React|Component|method chaining/i.test(desc);
  const na = tags.some(t=>NONALGO.has(t)) || (naDesc && !['python','cpp','java'].some(real));
  if(na) return {na:true};
  const hint = ['python','cpp','java','javascript'].map(k=>real(k)?{lang:k,code:s[k]}:null).find(Boolean) || null;
  return {na:false, hint};
}
const targets=[];
for(const r of rows){const c=classify(r);if(c.na)continue;targets.push({id:r.id,name:r.name,pattern:r.pattern,difficulty:r.difficulty,method_name:r.method_name,params:r.params,tags:r.tags,description:(r.description||'').slice(0,900),hint_lang:c.hint?c.hint.lang:null,hint:c.hint?c.hint.code:null});}
// solution-bearing first
targets.sort((a,b)=>(a.hint?0:1)-(b.hint?0:1));
console.log('completable', targets.length, '| with-solution-hint', targets.filter(t=>t.hint).length, '| from-description', targets.filter(t=>!t.hint).length);
if(COUNT_ONLY)process.exit(0);
const PER=12,SL=6,PW=PER*SL;
fs.mkdirSync('/tmp/viz',{recursive:true});
for(const f of fs.readdirSync('/tmp/viz')){const m=f.match(/^w(\d+)-\d\.json$/);if(m&&+m[1]>=START_WAVE)fs.unlinkSync('/tmp/viz/'+f);}
let wave=START_WAVE,written=0;
for(let w=0;w<targets.length;w+=PW,wave++){const wi=targets.slice(w,w+PW);for(let s=0;s<SL;s++){const sl=wi.slice(s*PER,s*PER+PER);if(!sl.length)break;fs.writeFileSync(`/tmp/viz/w${wave}-${s}.json`,JSON.stringify(sl));written++;}}
console.log('waves',START_WAVE,'..',wave-1,'sliceFiles',written);
