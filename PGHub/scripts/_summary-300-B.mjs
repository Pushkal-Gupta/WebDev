import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('/tmp/state-300-B.json','utf8'));
const rows = data.map(p => ({
  id: p.id,
  name: p.name,
  difficulty: p.difficulty,
  has_method: !!p.method_name,
  has_params: Array.isArray(p.params) && p.params.length > 0,
  has_return: !!p.return_type,
  test_count: Array.isArray(p.test_cases) ? p.test_cases.length : 0,
  hint_count: Array.isArray(p.hints) ? p.hints.length : 0,
  has_editorial: !!p.editorial_md && p.editorial_md.length > 100,
  sol_langs: p.solutions ? Object.keys(p.solutions) : [],
  has_pattern: !!p.pattern,
  has_topic: !!p.topic_id,
  desc_len: p.description ? p.description.length : 0,
}));
console.log(JSON.stringify(rows, null, 2));
