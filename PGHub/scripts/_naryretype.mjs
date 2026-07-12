import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ids=["delete","n-ary-tree-preorder-traversal","cycle-length-queries-in-a-tree","lowest-common-ancestor-of-deepest-leaves","maximum-depth-of-n-ary-tree","n-ary-tree-postorder-traversal","n-ary-tree-level-order-traversal","insufficient-nodes-in-root-to-leaf-paths","pghub-b31-garden-prune"];
for(const id of ids){
  const {data:p}=await sb.from('PGcode_problems').select('*').eq('id',id).single();
  if(!p){console.log(id,'NOT FOUND');continue;}
  const inp0=(p.test_cases||[])[0]?.inputs?.[0]||'';
  const naryEnc=/null/.test(inp0); // uses standard null encoding?
  // grade current canonical with root retyped to Node
  const code=p.solutions?.python?.code||'';
  const newParams=(p.params||[]).map((x,i)=> i===0 && x.type==='List[int]' ? {...x,type:'Node'} : x);
  let pass=0,tot=(p.test_cases||[]).length;
  try{
    const w=wrapWithDriver(code,'python',p.method_name,newParams,p.return_type);
    for(const c of p.test_cases){const r=runLocal('python',w,buildStdin(c.inputs.map(String))+'\n',{timeoutMs:6000});const out=(r?.stdout||'').replace(/\n$/,'');if(r?.ok&&compareOutput(out,c.expected))pass++;}
  }catch(e){console.log(id,'WRAP ERR',e.message.slice(0,30));continue;}
  console.log(`${id}: params ${JSON.stringify((p.params||[]).map(x=>x.type))} ret ${p.return_type} | nullEnc=${naryEnc} | canonical-with-Node-type: ${pass}/${tot}`);
}
