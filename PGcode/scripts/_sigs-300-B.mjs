import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('/tmp/state-300-B.json','utf8'));
const out = data.map(p => ({
  id: p.id, name: p.name, difficulty: p.difficulty,
  method_name: p.method_name,
  params: p.params,
  return_type: p.return_type,
  tags: p.tags,
  pattern: p.pattern,
  tc0: Array.isArray(p.test_cases) && p.test_cases[0] ? p.test_cases[0] : null,
  hints: p.hints,
}));
fs.writeFileSync('/tmp/sigs-300-B.json', JSON.stringify(out, null, 2));
console.log('wrote sigs');
