// Dump a slice of translation targets: problems with a REAL Python canonical but
// stub JS/Java/C++. Gives the agent the Python code + signature to translate FROM,
// which languages are missing, and a couple sample cases for sanity.
//
//   node scripts/dump-xlate-slice.mjs --start 0 --count 30 --out /tmp/xl/slice-0.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const START = Number(arg('start', 0)); const COUNT = Number(arg('count', 30));
const OUT = arg('out'); if (!OUT) { console.error('need --out'); process.exit(1); }
const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');
function isStub(code) {
  if (!code) return true; const b = code.trim(); if (b.length < 15) return true;
  if (/Reference skeleton|See the Editorial/i.test(code)) return true;
  const nc = b.replace(/(^|\n)\s*(#|\/\/).*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const body = nc.replace(/^\s*(import|using|#include|package)\s.*$/gm, '').trim();
  if (body.length < 25) return true;
  if (/\b(return\s+(null|nullptr|0|"")\s*;?)\s*\}?\s*\}?\s*;?\s*$/.test(body) && body.length < 170) return true;
  return false;
}
// queue: union of the js/java/cpp gap lists (built by the audit into xlate-gap.json)
const gap = JSON.parse(fs.readFileSync(path.join(__dirname, 'xlate-gap.json'), 'utf8'));
const union = [...new Set([...gap.js, ...gap.java, ...gap.cpp])];
const slice = union.slice(START, START + COUNT);
const out = [];
for (const id of slice) {
  const { data, error } = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,solutions,test_cases').eq('id', id).single();
  if (error || !data) continue;
  const s = data.solutions || {};
  const missing = ['javascript', 'java', 'cpp'].filter((L) => isStub(codeOf(s[L])));
  if (!missing.length) continue;
  out.push({
    id: data.id,
    title: data.name,
    method_name: data.method_name,
    params: data.params,
    return_type: data.return_type,
    python: codeOf(s.python),
    missing_langs: missing,
    sample_cases: (Array.isArray(data.test_cases) ? data.test_cases : []).slice(0, 3),
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`dumped ${out.length} translation targets [${START},${START + COUNT}) -> ${OUT}`);
