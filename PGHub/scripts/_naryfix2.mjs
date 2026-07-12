import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const CANON={
 'n-ary-tree-preorder-traversal':`class Solution:
    def preorder(self, root: 'Node') -> List[int]:
        res = []
        def dfs(n):
            if not n: return
            res.append(n.val)
            for c in n.children: dfs(c)
        dfs(root)
        return res`,
 'n-ary-tree-postorder-traversal':`class Solution:
    def postorder(self, root: 'Node') -> List[int]:
        res = []
        def dfs(n):
            if not n: return
            for c in n.children: dfs(c)
            res.append(n.val)
        dfs(root)
        return res`,
};
for(const [id,code] of Object.entries(CANON)){
  const {data:p}=await sb.from('PGcode_problems').select('*').eq('id',id).single();
  const newParams=[{name:'root',type:'Node'}];
  const w=wrapWithDriver(code,'python',p.method_name,newParams,p.return_type);
  // fix malformed inputs: root followed directly by a non-null => insert null separator
  const nextCases=[];
  for(const c of p.test_cases){
    let arr; try{arr=JSON.parse(c.inputs[0]);}catch{nextCases.push(c);continue;}
    if(Array.isArray(arr)&&arr.length>=2&&arr[1]!==null){arr=[arr[0],null,...arr.slice(1)];}
    const fixedInputs=[JSON.stringify(arr)];
    // regenerate expected from canonical
    const r=runLocal('python',w,buildStdin(fixedInputs)+'\n',{timeoutMs:6000});
    const out=(r?.ok?(r.stdout||'').replace(/\n$/,''):null);
    if(out!==null&&out!=='') nextCases.push({...c,inputs:fixedInputs,expected:out});
    else nextCases.push(c);
  }
  // verify all pass
  let pass=0;for(const c of nextCases){const r=runLocal('python',w,buildStdin(c.inputs)+'\n',{timeoutMs:6000});const out=(r?.stdout||'').replace(/\n$/,'');if(r?.ok&&compareOutput(out,c.expected))pass++;}
  if(pass===nextCases.length){
    const sol={...(p.solutions||{})}; sol.python={...(sol.python||{}),code};
    await sb.from('PGcode_problems').update({params:newParams,solutions:sol,test_cases:nextCases}).eq('id',id);
    console.log(`FIXED ${id}: ${pass}/${nextCases.length} (malformed inputs repaired + Node canonical)`);
  } else console.log(`SKIP ${id}: ${pass}/${nextCases.length}`);
}
