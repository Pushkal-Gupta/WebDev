import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
let from=0,rows=[];
while(true){const {data}=await sb.from('PGcode_problems').select('id,solutions,test_cases').range(from,from+999);if(!data||!data.length)break;rows=rows.concat(data);if(data.length<1000)break;from+=1000;}
const N=rows.length;
let py=0,all4=0,ge50=0,ge100=0,nullOracle=0,caseTot=0;
for(const p of rows){
  const s=p.solutions||{}; const tcs=Array.isArray(p.test_cases)?p.test_cases:[];
  const has=(k)=>{const v=s[k];const code=typeof v==='string'?v:v?.code;return code&&/\w/.test(code)&&code.length>20;};
  if(has('python'))py++;
  if(['python','javascript','java','cpp'].every(has))all4++;
  if(tcs.length>=50)ge50++; if(tcs.length>=100)ge100++;
  caseTot+=tcs.length;
  if(tcs.length&&tcs.every(c=>c.expected===null||c.expected===undefined))nullOracle++;
}
const pct=(x)=>((x/N)*100).toFixed(1)+'%';
console.log('total problems:',N);
console.log('python:',py,pct(py));
console.log('all-4:',all4,pct(all4));
console.log('>=50 cases:',ge50,pct(ge50));
console.log('>=100 cases:',ge100,pct(ge100));
console.log('null-oracle:',nullOracle);
console.log('avg cases/problem:',(caseTot/N).toFixed(1));
console.log('total cases:',caseTot);
