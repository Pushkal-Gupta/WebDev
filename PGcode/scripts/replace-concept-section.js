#!/usr/bin/env node
// Replace a single ## section block in a concept file.
// Usage: node scripts/replace-concept-section.js <slug> <section> < newcontent.txt
// Or:    node scripts/replace-concept-section.js <slug> <section> --file path/to/newcontent.txt

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [slug, section, ...rest] = process.argv.slice(2);
if (!slug || !section) {
  console.error('Usage: replace-concept-section.js <slug> <section> [--file path]');
  process.exit(1);
}

let newBody;
const fIdx = rest.indexOf('--file');
if (fIdx >= 0) {
  newBody = fs.readFileSync(rest[fIdx + 1], 'utf8');
} else {
  newBody = fs.readFileSync(0, 'utf8');
}

const file = path.join(__dirname, '..', 'content', 'concepts', `${slug}.md`);
const md = fs.readFileSync(file, 'utf8');

const re = new RegExp(`(##\\s+${section}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$(?![\\s\\S]))`, 'i');
if (!re.test(md)) {
  console.error(`Section ## ${section} not found in ${slug}`);
  process.exit(2);
}
const replaced = md.replace(re, (_m, header) => header + newBody.trim() + '\n');
fs.writeFileSync(file, replaced);
console.log(`OK ${slug} :: ${section} (${newBody.trim().split(/\s+/).length} words)`);
