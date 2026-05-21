#!/usr/bin/env node
// Bulk-import concept markdown files into Supabase.
//
// Usage:
//   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-concepts.js
//   (or pass --dry to preview without writing)
//
// Reads every .md in content/concepts/ with this shape:
//
//   ---
//   slug: loop-detection
//   module: linked-lists
//   title: Loop Detection
//   subtitle: ...
//   difficulty: Beginner | Intermediate | Advanced
//   position: 1
//   estimatedReadMinutes: 6
//   prereqs: [other-slug, another-slug]
//   relatedProblems: [problem_id_1, problem_id_2]
//   references:
//     - title: "..."
//       url: "..."
//   status: published
//   ---
//
//   ## intro
//   ...
//   ## whyItMatters
//   ...
//   ## complexity
//   time: O(n)
//   space: O(1)
//   notes: ...
//   ## code.python
//   ```python
//   ...
//   ```
//   (etc. for code.javascript, code.java, code.cpp)
//
// Section names are camelCase and become keys on body or code.
// Sections starting with "code." become entries in the code JSONB column.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'concepts');
const DRY = process.argv.includes('--dry');

// Auto-load .env (no dotenv dep).
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env. Run with --dry to preview without writing.');
    process.exit(1);
  }
}

// Tiny YAML frontmatter parser — supports strings, numbers, booleans, lists,
// and one level of nested objects. Avoids pulling in a runtime dep.
function parseFrontmatter(raw) {
  const lines = raw.split('\n');
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    let val = m[2].trim();
    if (val === '' && lines[i + 1] && /^\s+- /.test(lines[i + 1])) {
      // list block
      const items = [];
      i++;
      while (i < lines.length && /^\s+- /.test(lines[i])) {
        const itemLine = lines[i].replace(/^\s+- /, '').trim();
        if (itemLine.includes(':')) {
          // object item
          const obj = {};
          const objM = itemLine.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
          if (objM) obj[objM[1]] = unquote(objM[2]);
          i++;
          while (i < lines.length && /^\s{4}/.test(lines[i]) && !/^\s+- /.test(lines[i])) {
            const sub = lines[i].trim().match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
            if (sub) obj[sub[1]] = unquote(sub[2]);
            i++;
          }
          items.push(obj);
        } else {
          items.push(unquote(itemLine));
          i++;
        }
      }
      out[key] = items;
      continue;
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      out[key] = inner ? inner.split(',').map(s => unquote(s.trim())) : [];
    } else if (val === 'true' || val === 'false') {
      out[key] = val === 'true';
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      out[key] = Number(val);
    } else {
      out[key] = unquote(val);
    }
    i++;
  }
  return out;
}

function unquote(s) {
  if (!s) return s;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseConceptFile(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const m = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`No frontmatter in ${filepath}`);
  const meta = parseFrontmatter(m[1]);
  const bodyRaw = m[2];

  // Split on top-level `## sectionName`. Append a sentinel so the final section
  // captures all the way to end-of-file (the previous `$` lookahead under the
  // /m flag was matching end-of-LINE, silently truncating every section to its
  // first line).
  const sections = {};
  const codeSections = {};
  const bodyWithSentinel = bodyRaw + '\n## __END__\n';
  const sectionRe = /^##\s+([\w.]+)\s*\n([\s\S]*?)(?=^##\s+)/gm;
  let match;
  while ((match = sectionRe.exec(bodyWithSentinel)) !== null) {
    const [, name, content] = match;
    if (name === '__END__') continue;
    const cleaned = content.trim();
    if (name.startsWith('code.')) {
      const lang = name.slice('code.'.length);
      const codeMatch = cleaned.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      codeSections[lang] = codeMatch ? codeMatch[1].trimEnd() : cleaned;
    } else if (name === 'complexity') {
      // sub-keys: time, space, notes
      const obj = {};
      cleaned.split('\n').forEach(line => {
        const km = line.match(/^([a-zA-Z]+):\s*(.*)$/);
        if (km) obj[km[1]] = km[2].trim();
      });
      sections.complexity = obj;
    } else if (cleaned.startsWith('- ')) {
      // bullet list -> array of strings
      sections[name] = cleaned.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
    } else {
      sections[name] = cleaned;
    }
  }

  if (meta.estimatedReadMinutes != null) sections.estimatedReadMinutes = meta.estimatedReadMinutes;

  return {
    slug: meta.slug,
    module_slug: meta.module,
    title: meta.title,
    subtitle: meta.subtitle || null,
    difficulty: meta.difficulty || null,
    position: meta.position ?? 0,
    body: sections,
    code: codeSections,
    metadata: {
      references: meta.references || [],
      prereqs: meta.prereqs || [],
      relatedProblems: meta.relatedProblems || [],
    },
    status: meta.status || 'draft',
  };
}

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`No concepts directory at ${CONTENT_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('No concept files found.');
    return;
  }

  console.log(`Found ${files.length} concept file${files.length === 1 ? '' : 's'}.`);
  const concepts = [];
  const errors = [];
  for (const f of files) {
    try {
      const c = parseConceptFile(path.join(CONTENT_DIR, f));
      if (!c.slug) throw new Error('missing slug');
      if (!c.module_slug) throw new Error('missing module');
      if (!c.title) throw new Error('missing title');
      concepts.push(c);
      console.log(`  ✓ parsed ${f}`);
    } catch (e) {
      errors.push({ f, message: e.message });
      console.log(`  ✗ ${f}: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} file(s) failed to parse. Aborting.`);
    process.exit(1);
  }

  if (DRY) {
    console.log('\n--dry: preview only, not writing to Supabase.\n');
    console.log(JSON.stringify(concepts, null, 2));
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Upsert concepts
  const { error: upErr } = await supabase
    .from('PGcode_concepts')
    .upsert(concepts.map(c => ({
      slug: c.slug,
      module_slug: c.module_slug,
      title: c.title,
      subtitle: c.subtitle,
      difficulty: c.difficulty,
      position: c.position,
      body: c.body,
      code: c.code,
      metadata: c.metadata,
      status: c.status,
    })), { onConflict: 'slug' });
  if (upErr) {
    console.error('Upsert failed:', upErr);
    process.exit(1);
  }

  // Rebuild prereq edges
  const prereqRows = [];
  concepts.forEach(c => {
    (c.metadata.prereqs || []).forEach(req => {
      prereqRows.push({ concept_slug: c.slug, requires_slug: req });
    });
  });
  if (prereqRows.length > 0) {
    // Naive: delete existing and re-insert for each concept whose prereqs changed.
    const concSlugs = [...new Set(prereqRows.map(r => r.concept_slug))];
    await supabase.from('PGcode_concept_prereqs').delete().in('concept_slug', concSlugs);
    const { error: prErr } = await supabase.from('PGcode_concept_prereqs').insert(prereqRows);
    if (prErr) console.error('Prereq insert failed (continuing):', prErr.message);
  }

  // Rebuild concept↔problem relations
  const relRows = [];
  concepts.forEach(c => {
    (c.metadata.relatedProblems || []).forEach((problemId, i) => {
      relRows.push({ concept_slug: c.slug, problem_id: problemId, relation_type: 'practice', position: i });
    });
  });
  if (relRows.length > 0) {
    const concSlugs = [...new Set(relRows.map(r => r.concept_slug))];
    await supabase.from('PGcode_concept_problems').delete().in('concept_slug', concSlugs);
    const { error: relErr } = await supabase.from('PGcode_concept_problems').insert(relRows);
    if (relErr) console.error('Relation insert failed (continuing):', relErr.message);
  }

  console.log(`\n✓ Imported ${concepts.length} concept${concepts.length === 1 ? '' : 's'} to Supabase.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
