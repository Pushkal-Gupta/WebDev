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
 'n-ary-tree-level-order-traversal':`class Solution:
    def levelOrder(self, root: 'Node') -> List[List[int]]:
        if not root: return []
        res, q = [], deque([root])
        while q:
            level = []
            for _ in range(len(q)):
                n = q.popleft()
                level.append(n.val)
                for c in n.children: q.append(c)
            res.append(level)
        return res`,
 'maximum-depth-of-n-ary-tree':`class Solution:
    def maxDepth(self, root: 'Node') -> int:
        if not root: return 0
        return 1 + max((self.maxDepth(c) for c in root.children), default=0)`,
};
for(const [id,code] of Object.entries(CANON)){
  const {data:p}=await sb.from('PGcode_problems').select('*').eq('id',id).single();
  const newParams=(p.params||[]).map((x,i)=> i===0 ? {...x,type:'Node'} : x);
  const w=wrapWithDriver(code,'python',p.method_name,newParams,p.return_type);
  let pass=0,tot=(p.test_cases||[]).length;
  for(const c of p.test_cases){const r=runLocal('python',w,buildStdin(c.inputs.map(String))+'\n',{timeoutMs:6000});const out=(r?.stdout||'').replace(/\n$/,'');if(r?.ok&&compareOutput(out,c.expected))pass++;}
  if(pass===tot){
    const sol={...(p.solutions||{})}; sol.python={...(sol.python||{}),code};
    await sb.from('PGcode_problems').update({params:newParams,solutions:sol}).eq('id',id);
    console.log(`FIXED ${id}: Node-based canonical + type Node, ${pass}/${tot} pass`);
  } else console.log(`SKIP ${id}: ${pass}/${tot} (canonical still failing)`);
}
