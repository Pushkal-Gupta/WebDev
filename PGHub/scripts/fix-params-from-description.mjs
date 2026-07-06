#!/usr/bin/env node
// Re-derive method_name/params/return_type for problems where the previous
// programmatic backfill couldn't infer them from test_cases (because tcs were
// missing or malformed). Parses the HTML description's "Input: ..." /
// "Output: ..." example lines to recover real param names + types.
//
// Only updates problems where params currently looks like the generic fallback
// (single param named "input" / "s" / "nums" with no signal).
//
// Usage: node scripts/fix-params-from-description.mjs [--dry]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dry = process.argv.includes('--dry');

function methodNameFromTitle(name) {
  if (!name) return 'solve';
  const words = String(name).replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'solve';
  return words[0].toLowerCase() + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function decodeHtml(s) {
  let out = String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  let prev;
  do { prev = out; out = out.replace(/<[^>]+>/g, ''); } while (out !== prev);
  return out;
}

function inferPyType(v) {
  if (v === null || v === undefined) return 'Any';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'string') return 'str';
  if (Array.isArray(v)) {
    if (!v.length) return 'List[Any]';
    return `List[${inferPyType(v[0])}]`;
  }
  return 'Any';
}

function parseLiteral(raw) {
  const s = String(raw).trim();
  if (s === '' || s === 'null' || s === 'undefined') return null;
  // Strip surrounding quotes for strings
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  // Convert JS booleans/none to JSON-parseable
  let t = s.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');
  // Single-quote strings inside arrays — convert to double
  if (t.startsWith('[') || t.startsWith('{')) {
    t = t.replace(/'([^']*)'/g, '"$1"');
  }
  try { return JSON.parse(t); } catch { /* not JSON */ }
  // Numeric?
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

// Parse the LC-style description and extract params + return_type from the
// first "Input: name = value, name2 = value2" + "Output: value" pair.
function inferFromDescription(desc, problemName) {
  if (!desc) return null;
  const text = decodeHtml(desc);
  // Match "Input: ... Output: ..." (first example only)
  const m = text.match(/Input:\s*([^\n]*?)\s*Output:\s*([^\n]*?)(?:\n|Explanation:|$)/i);
  if (!m) return null;
  const inputRaw = m[1].trim();
  const outputRaw = m[2].trim();

  // Split "a = X, b = Y" into [{name:'a', val:X}, ...]. Watch commas inside [].
  const params = [];
  let depth = 0, buf = '', parts = [];
  for (const ch of inputRaw) {
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '}' || ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);

  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      // Bare value; treat as single anonymous arg
      const v = parseLiteral(part.trim());
      params.push({ name: defaultParamName(problemName, params.length, parts.length), type: inferPyType(v) });
    } else {
      const name = part.slice(0, eq).trim();
      const v = parseLiteral(part.slice(eq + 1).trim());
      if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        params.push({ name, type: inferPyType(v) });
      }
    }
  }
  if (!params.length) return null;

  const outV = parseLiteral(outputRaw);
  return { params, return_type: inferPyType(outV) };
}

function defaultParamName(probName, idx, total) {
  const lc = String(probName || '').toLowerCase();
  if (total === 1) {
    if (/array|list|nums/.test(lc)) return 'nums';
    if (/string/.test(lc)) return 's';
    if (/tree|root/.test(lc)) return 'root';
    if (/grid|matrix/.test(lc)) return 'grid';
    return 'input';
  }
  return ['nums','target','k','n','m','x','y','z'][idx] || `arg${idx}`;
}

function isGenericParams(params) {
  if (!Array.isArray(params)) return true;
  if (params.length === 0) return true;
  if (params.length !== 1) return false;
  const p = params[0];
  // Generic fallback shape
  return (p.name === 'input' && p.type === 'str');
}

// Load all problems
const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,description,params,return_type,method_name')
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Loaded ${all.length} problems`);

const eligible = all.filter(p => isGenericParams(p.params) && p.description);
console.log(`Eligible (generic params + has description): ${eligible.length}`);

const patches = [];
let parsed = 0, skipped = 0;
for (const p of eligible) {
  const inferred = inferFromDescription(p.description, p.name);
  if (!inferred || !inferred.params.length) { skipped++; continue; }
  parsed++;
  patches.push({
    id: p.id,
    method_name: p.method_name || methodNameFromTitle(p.name),
    params: inferred.params,
    return_type: inferred.return_type,
  });
}
console.log(`Parsed real params for ${parsed}, couldn't parse ${skipped}`);

if (!patches.length) process.exit(0);

const out = '/tmp/fix-params.json';
fs.writeFileSync(out, JSON.stringify(patches));
console.log(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);

console.log('Sample:');
patches.slice(0, 5).forEach(p => console.log(' ', p.id, JSON.stringify(p.params), '->', p.return_type));

if (dry) process.exit(0);

console.log('Run: node scripts/upsert-problem-content.js /tmp/fix-params.json');
