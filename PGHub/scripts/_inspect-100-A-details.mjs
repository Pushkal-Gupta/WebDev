import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('/tmp/state-100-A.json','utf8'));
const interesting = ['design-add-search', 'lru-cache', 'kth-largest-element', 'kth-smallest-bst', 'clone-graph', 'lowest-common-ancestor', 'linked-list-cycle', 'encode-decode-strings', 'invert-binary-tree', 'max-depth-binary-tree', 'balanced-binary-tree'];
for (const p of data) {
  if (!interesting.includes(p.id)) continue;
  console.log('==', p.id, '==');
  console.log('method:', p.method_name);
  console.log('params:', JSON.stringify(p.params));
  console.log('return:', p.return_type);
  console.log('first 3 tests:', JSON.stringify(p.test_cases?.slice(0,3), null, 2));
  console.log('desc (first 500):', (p.description||'').slice(0, 500));
  console.log();
}
