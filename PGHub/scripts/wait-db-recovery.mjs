// Gently poll for DB recovery after a throttle/saturation. One lightweight query every 40s,
// each with a 22s timeout, for up to ~18 min. Prints RECOVERED + a stress-case count when the
// backend is healthy again, so the apply scripts can be safely re-run. No load while waiting.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ping() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 22000);
  try {
    const { data, error } = await sb.from('PGcode_problems').select('id').limit(1).abortSignal(ctrl.signal);
    if (error) return { ok: false, why: error.message };
    return { ok: !!(data && data.length), why: data ? 'empty' : 'null' };
  } catch (e) { return { ok: false, why: e.name === 'AbortError' ? 'timeout' : e.message }; }
  finally { clearTimeout(t); }
}

console.log('polling for DB recovery (up to ~18 min)...');
await sleep(60000); // initial 60s cooldown so the pool drains
for (let a = 1; a <= 26; a++) {
  const r = await ping();
  console.log(`  attempt ${a}: ${r.ok ? 'OK' : r.why}`);
  if (r.ok) {
    console.log('RECOVERED');
    process.exit(0);
  }
  await sleep(40000);
}
console.log('NOT RECOVERED within window.');
process.exit(1);
