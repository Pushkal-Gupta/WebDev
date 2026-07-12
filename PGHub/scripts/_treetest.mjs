import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
for(const l of fs.readFileSync('.env','utf8').split('\n')){const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:p}=await sb.from('PGcode_problems').select('*').eq('id','invert-tree').single();
console.log('invert-tree type:',JSON.stringify(p.params),'ret:',p.return_type,'method:',p.method_name);
console.log('case0:',JSON.stringify(p.test_cases[0]));
// A STANDARD LeetCode TreeNode-based Python solution (what a real user writes):
const userSol=`class Solution:
    def invertTree(self, root):
        if not root: return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root`;
for(const typ of ['List[int]','TreeNode']){
  const params=[{name:'root',type:typ}];
  const ret= typ==='TreeNode'?'TreeNode':p.return_type;
  let w; try{w=wrapWithDriver(userSol,'python',p.method_name,params,ret);}catch(e){console.log(typ,'WRAP ERR',e.message.slice(0,40));continue;}
  const c=p.test_cases[0];
  const r=runLocal('python',w,buildStdin(c.inputs.map(String))+'\n',{timeoutMs:6000});
  console.log(`\n--- user TreeNode solution with param type=${typ} ret=${ret} ---`);
  console.log('  ok:',r?.ok,'stdout:',JSON.stringify((r?.stdout||'').replace(/\n$/,'')),'stderr:',JSON.stringify((r?.stderr||'').slice(0,120)));
}
