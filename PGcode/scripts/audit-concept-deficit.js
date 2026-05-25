#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'content', 'concepts');
const wc = s => s.trim().split(/\s+/).filter(Boolean).length;
const bars = { whyItMatters: 70, intuition: 200, optimal: 200 };

const out = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.md')) continue;
  const md = fs.readFileSync(path.join(dir, f), 'utf8');
  let deficit = 0;
  const fail = [];
  for (const [sec, bar] of Object.entries(bars)) {
    const re = new RegExp(`##\\s+${sec}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$(?![\\s\\S]))`, 'i');
    const m = md.match(re);
    if (!m) { deficit += bar; fail.push(`${sec}:missing`); continue; }
    const w = wc(m[1]);
    if (w < bar) { deficit += bar - w; fail.push(`${sec}:${w}/${bar}`); }
  }
  if (deficit > 0) out.push({ slug: f.replace(/\.md$/, ''), deficit, fail });
}
out.sort((a, b) => b.deficit - a.deficit);

const N = parseInt(process.argv[2] || '55', 10);
console.log('TOTAL WEAK:', out.length);
for (const r of out.slice(0, N)) {
  console.log(String(r.deficit).padStart(4), r.slug, '|', r.fail.join(' '));
}

if (process.argv.includes('--json')) {
  fs.writeFileSync(path.join(__dirname, '..', '.deficit.json'), JSON.stringify(out, null, 2));
}
