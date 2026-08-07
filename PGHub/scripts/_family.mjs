import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
for (const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const py=(s)=>{const p=s?.python;return typeof p==='string'?p:p?.code;};
const fails=JSON.parse(fs.readFileSync('/tmp/richThin/out-gap.fails.json','utf8')).map(x=>x[0]);
const fam={digits:[],gcd:[],bit:[],power:[],string:[],mathFormula:[],sortGreedy:[],other:[]};
for(let i=0;i<fails.length;i+=90){
  let data,error;
  for(let a=0;a<4;a++){ ({data,error}=await sb.from('PGcode_problems').select('id,params,solutions,tags').in('id',fails.slice(i,i+90))); if(!error)break; await sleep(1500); }
  if(!data)continue;
  for(const r of data){ const c=py(r.solutions)||''; const t=(r.tags||[]).join(' ').toLowerCase();
    if(/database|sql|javascript|pandas|design|shell/.test(t)) continue; // handled separately
    if(/str\(\w+\)|% 10|\/\/ 10|digits|int\(ch\)|int\(d\)/.test(c)) fam.digits.push(r.id);
    else if(/gcd|math\.gcd|while \w+:.*%/.test(c)) fam.gcd.push(r.id);
    else if(/&|<<|>>|\^|bin\(|bit_count|popcount/.test(c)) fam.bit.push(r.id);
    else if(/\*\*|pow\(|sqrt/.test(c)) fam.power.push(r.id);
    else if(r.params.some(p=>p.type==='str')) fam.string.push(r.id);
    else if(/return .*[-+*/].*[-+*/]/.test(c)&&!/for |while /.test(c)) fam.mathFormula.push(r.id);
    else if(/sorted|\.sort\(/.test(c)) fam.sortGreedy.push(r.id);
    else fam.other.push(r.id);
  }
  await sleep(250);
}
for(const k of Object.keys(fam)) console.log(k+':',fam[k].length);
fs.writeFileSync('/tmp/families.json',JSON.stringify(fam));
console.log('\nsamples digits:',fam.digits.slice(0,5).join(', '));
console.log('samples bit:',fam.bit.slice(0,5).join(', '));
