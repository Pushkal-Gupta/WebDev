import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const l of fs.readFileSync('.env','utf8').split('\n')) { const m=l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2]; }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = ["sorted-array-to-bst","spiral-level-order","subtree","subtree-of-another","sum-of-root-to-leaf-binary-numbers","sum-tree","top-view","tree-from-preorder-and-inorder","univalued-binary-tree","validate-bst","vertical-order-traversal-of-a-binary-tree","vertical-traversal"];
for (const s of slugs) {
  const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,test_cases').eq('id', s).single();
  if(!data){ console.log(s,'NOT FOUND'); continue; }
  const tc = data.test_cases||[];
  console.log('====', s, '| method', data.method_name, '| ret', data.return_type);
  console.log('  params:', JSON.stringify(data.params));
  console.log('  ncases:', tc.length);
  console.log('  first5 inputs:', JSON.stringify(tc.slice(0,5).map(c=>c.inputs)));
  // detect if any structural input array contains -1 or null
  const allIn = tc.map(c=>c.inputs).flat().join(' ');
  console.log('  has -1:', /(^|[[,\s])-1([,\]\s]|$)/.test(allIn), '| has null:', /null/.test(allIn));
}
