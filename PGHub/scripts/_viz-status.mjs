import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count: total } = await sb.from('PGcode_problems').select('*', { count: 'exact', head: true });
const { count: withViz } = await sb.from('PGcode_problems').select('*', { count: 'exact', head: true }).not('viz_steps', 'is', null);
console.log('total', total, 'withViz', withViz, 'remaining', total - withViz);
