import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const data = JSON.parse(fs.readFileSync('/tmp/state-100-B.json','utf8'));
const detail = data.map(d => ({
  id: d.id,
  name: d.name,
  method_name: d.method_name,
  params: d.params,
  return_type: d.return_type,
  pattern: d.pattern,
  topic_id: d.topic_id,
  tags: d.tags,
  difficulty: d.difficulty,
  test_cases_count: Array.isArray(d.test_cases) ? d.test_cases.length : 0,
  test_cases_sample: Array.isArray(d.test_cases) ? d.test_cases.slice(0,3) : null,
  hints: d.hints,
  description_first_400: (d.description || '').slice(0, 400),
}));
fs.writeFileSync('/tmp/detail-100-B.json', JSON.stringify(detail, null, 2));
console.log('Wrote detail. Total:', detail.length);
