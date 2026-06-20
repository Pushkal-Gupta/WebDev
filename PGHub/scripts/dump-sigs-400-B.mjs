import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('/tmp/state-400-B.json','utf8'));
const out = {};
for (const p of data) {
  out[p.id] = {
    name: p.name,
    method_name: p.method_name,
    params: p.params,
    return_type: p.return_type,
    pattern: p.pattern,
    topic_id: p.topic_id,
    difficulty: p.difficulty,
    test_case_count: Array.isArray(p.test_cases) ? p.test_cases.length : 0,
    hint_count: Array.isArray(p.hints) ? p.hints.length : 0,
    sample_test: Array.isArray(p.test_cases) ? p.test_cases[0] : null,
  };
}
fs.writeFileSync('/tmp/sigs-400-B.json', JSON.stringify(out, null, 2));
console.log('wrote');
