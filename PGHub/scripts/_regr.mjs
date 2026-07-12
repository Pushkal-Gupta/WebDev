import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ids=["two-sum","add-binary","invert-tree","reverse-linked-list","valid-parentheses","binary-search","climbing-stairs","longest-common-prefix","maximum-subarray","merge-two-sorted","group-anagrams","coin-change","number-of-islands","word-break","top-k-frequent-elements","course-schedule","lru-cache","min-stack","kth-largest-element-in-an-array","trapping-rain-water"];
let ok=0,bad=0;
for(const id of ids){const {data:p}=await sb.from('PGcode_problems').select('*').eq('id',id).maybeSingle();if(!p){continue;}const code=p.solutions?.python?.code;if(!code){continue;}let w;try{w=wrapWithDriver(code,'python',p.method_name,p.params,p.return_type);}catch{bad++;console.log('  wraperr',id);continue;}let pass=0,tot=0;for(const c of (p.test_cases||[]).slice(0,15)){if(!Array.isArray(c.inputs))continue;tot++;const r=runLocal('python',w,buildStdin(c.inputs.map(String))+'\n',{timeoutMs:6000});const out=(r?.stdout||'').replace(/\n$/,'');if(r?.ok&&compareOutput(out,c.expected))pass++;}if(tot&&pass===tot)ok++;else{bad++;console.log(`  ${id}: ${pass}/${tot}`);}}
console.log(`clean: ${ok}/${ids.length}`);
