#!/usr/bin/env node
// Deepens whyItMatters / intuition / optimal in concept files.
// Reads sections from ./deepen-concepts-data.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'deepen-concepts-data.json'), 'utf8'));

const dir = path.join(__dirname, '..', 'content', 'concepts');
const wc = s => s.trim().split(/\s+/).filter(Boolean).length;

let ok = 0, fail = 0;
for (const entry of data) {
  const file = path.join(dir, `${entry.slug}.md`);
  if (!fs.existsSync(file)) {
    console.error('MISSING FILE', entry.slug);
    fail++; continue;
  }
  let md = fs.readFileSync(file, 'utf8');
  for (const [section, body] of Object.entries(entry.sections)) {
    const re = new RegExp(`(##\\s+${section}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$(?![\\s\\S]))`, 'i');
    if (!re.test(md)) {
      console.error('NO SECTION', entry.slug, section);
      fail++;
      continue;
    }
    md = md.replace(re, (_m, header) => header + body.trim() + '\n');
  }
  fs.writeFileSync(file, md);
  // verify
  const final = fs.readFileSync(file, 'utf8');
  const stats = {};
  for (const sec of ['whyItMatters', 'intuition', 'optimal']) {
    const r = new RegExp(`##\\s+${sec}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$(?![\\s\\S]))`, 'i');
    const m = final.match(r);
    stats[sec] = m ? wc(m[1]) : 0;
  }
  const bars = { whyItMatters: 70, intuition: 200, optimal: 200 };
  const ok_all = Object.entries(bars).every(([k, v]) => stats[k] >= v);
  if (ok_all) {
    ok++;
    console.log('OK', entry.slug, stats);
  } else {
    fail++;
    console.log('SHORT', entry.slug, stats);
  }
}
console.log(`\nDONE: ${ok} ok, ${fail} fail`);
