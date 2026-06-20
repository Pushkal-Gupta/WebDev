#!/usr/bin/env node
// Merge expanded course JSONs from /tmp/course-new-*.json back into
// src/content/courses.js. Rewrites the whole file with a consistent structure:
// each course's lessons live in a top-level const, COURSES references them.
//
// Usage: node scripts/merge-course-expansions.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COURSE_IDS = [
  'python-basics', 'javascript-basics', 'java-basics', 'cpp-basics',
  'react-basics', 'typescript-basics', 'go-basics', 'node-basics',
  'sql-basics', 'rust-basics',
  'git-basics', 'docker-basics', 'bash-basics', 'html-css-basics',
];

// Top-level metadata for courses that may not yet exist in COURSES — used
// when a /tmp/course-new-*.json includes the full top-level fields.
const NEW_COURSE_DEFAULTS = {};

// Load current COURSES via dynamic import to get the registry shape
const currentMod = await import(path.join(__dirname, '..', 'src', 'content', 'courses.js'));
const currentCourses = currentMod.COURSES;
const currentCards = currentMod.COURSE_CARDS;

const newLessonsById = {};
let foundCount = 0;
for (const id of COURSE_IDS) {
  const p = `/tmp/course-new-${id}.json`;
  if (!fs.existsSync(p)) {
    console.log(`  [skip] ${id} — no expansion file`);
    continue;
  }
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(j.lessons)) {
      console.warn(`  [warn] ${id} — JSON missing lessons array`);
      continue;
    }
    newLessonsById[id] = j.lessons;
    // If this is a fresh course (top-level title/language present + not in current COURSES),
    // capture its metadata for later emit.
    if (!currentCourses[id] && j.title && j.language) {
      NEW_COURSE_DEFAULTS[id] = {
        id,
        title: j.title,
        language: j.language,
        color: j.color || '#888',
        blurb: j.blurb || '',
        estimatedHours: j.estimatedHours || 2,
        externalResources: j.externalResources || [],
      };
    }
    foundCount++;
    const avg = j.lessons.reduce((s, l) => s + (l.intro || '').split(/\s+/).length, 0) / j.lessons.length;
    console.log(`  [ok] ${id} — ${j.lessons.length} lessons, avg intro ${avg.toFixed(0)} words`);
  } catch (e) {
    console.error(`  [err] ${id} — ${e.message}`);
  }
}

if (!foundCount) {
  console.log('No new lessons to merge. Exiting.');
  process.exit(0);
}

// Build the new courses.js content
function escapeJSStringLiteral(s) {
  return JSON.stringify(s);
}

function emitLesson(l) {
  const parts = [];
  parts.push(`  {`);
  parts.push(`    id: ${escapeJSStringLiteral(l.id)},`);
  parts.push(`    title: ${escapeJSStringLiteral(l.title)},`);
  parts.push(`    intro: ${escapeJSStringLiteral(l.intro || '')},`);
  if (l.code !== undefined) parts.push(`    code: ${escapeJSStringLiteral(l.code)},`);
  if (l.runnable !== undefined) parts.push(`    runnable: ${JSON.stringify(l.runnable)},`);
  if (l.exercise) {
    parts.push(`    exercise: {`);
    parts.push(`      prompt: ${escapeJSStringLiteral(l.exercise.prompt || '')},`);
    parts.push(`      starter: ${escapeJSStringLiteral(l.exercise.starter || '')},`);
    parts.push(`      expected: ${escapeJSStringLiteral(l.exercise.expected || '')},`);
    parts.push(`    },`);
  }
  if (Array.isArray(l.takeaways) && l.takeaways.length) {
    parts.push(`    takeaways: [`);
    for (const t of l.takeaways) parts.push(`      ${escapeJSStringLiteral(t)},`);
    parts.push(`    ],`);
  }
  if (Array.isArray(l.mistakes) && l.mistakes.length) {
    parts.push(`    mistakes: [`);
    for (const m of l.mistakes) parts.push(`      ${escapeJSStringLiteral(m)},`);
    parts.push(`    ],`);
  }
  if (l.next) {
    parts.push(`    next: { label: ${escapeJSStringLiteral(l.next.label || '')}, href: ${escapeJSStringLiteral(l.next.href || '')} },`);
  }
  parts.push(`  },`);
  return parts.join('\n');
}

function emitLessonsConst(name, lessons) {
  return `const ${name} = [\n${lessons.map(emitLesson).join('\n')}\n];\n`;
}

const LESSONS_CONST_NAME = {
  'python-basics':     'PYTHON_LESSONS',
  'javascript-basics': 'JAVASCRIPT_LESSONS',
  'java-basics':       'JAVA_LESSONS',
  'cpp-basics':        'CPP_LESSONS',
  'react-basics':      'REACT_LESSONS',
  'typescript-basics': 'TS_LESSONS',
  'go-basics':         'GO_LESSONS',
  'node-basics':       'NODE_LESSONS',
  'sql-basics':        'SQL_LESSONS',
  'rust-basics':       'RUST_LESSONS',
  'git-basics':        'GIT_LESSONS',
  'docker-basics':     'DOCKER_LESSONS',
  'bash-basics':       'BASH_LESSONS',
  'html-css-basics':   'HTMLCSS_LESSONS',
};

// Compose new file
const header = `// Course registry. Each course has lessons; each lesson can have a runnable
// code sample + an optional exercise with an expected stdout for auto-grading.
//
// Course shape:
//   { id, title, language, color, blurb, icon, lessons: [{ id, title, intro,
//     code, runnable, exercise: { prompt, starter, expected } }] }
//
// \`language\` is one of: 'python' | 'javascript' | 'java' | 'cpp' | 'sql'.
// For SQL the course renders inside SqlPlayground course-mode (separate flow);
// for other languages we render in CoursePage and call Judge0 via codeRunner.

`;

let body = header;
for (const id of COURSE_IDS) {
  const name = LESSONS_CONST_NAME[id];
  const lessons = newLessonsById[id] || currentCourses[id]?.lessons || [];
  if (!lessons.length) continue; // skip courses we don't have lessons for
  const title = currentCourses[id]?.title || NEW_COURSE_DEFAULTS[id]?.title || id;
  body += `// ── ${title} ─────────────────────────────────────\n`;
  body += emitLessonsConst(name, lessons) + '\n';
}

// Emit COURSES
body += 'export const COURSES = {\n';
for (const id of COURSE_IDS) {
  const c = currentCourses[id] || NEW_COURSE_DEFAULTS[id];
  if (!c) continue;
  // Skip if we have no lessons for this course
  const lessons = newLessonsById[id] || currentCourses[id]?.lessons || [];
  if (!lessons.length) continue;
  body += `  ${escapeJSStringLiteral(id)}: {\n`;
  body += `    id: ${escapeJSStringLiteral(c.id)},\n`;
  body += `    title: ${escapeJSStringLiteral(c.title)},\n`;
  body += `    language: ${escapeJSStringLiteral(c.language)},\n`;
  if (c.color) body += `    color: ${escapeJSStringLiteral(c.color)},\n`;
  if (c.blurb) body += `    blurb: ${escapeJSStringLiteral(c.blurb)},\n`;
  if (c.estimatedHours) body += `    estimatedHours: ${c.estimatedHours},\n`;
  if (c.externalResources?.length) {
    body += `    externalResources: [\n`;
    for (const r of c.externalResources) {
      body += `      { title: ${escapeJSStringLiteral(r.title)}, url: ${escapeJSStringLiteral(r.url)}, type: ${escapeJSStringLiteral(r.type)} },\n`;
    }
    body += `    ],\n`;
  }
  body += `    lessons: ${LESSONS_CONST_NAME[id]},\n`;
  body += `  },\n`;
}
body += '};\n\n';

// Emit COURSE_CARDS — derive from COURSES (include href so CoursesIndex links work)
body += 'export const COURSE_CARDS = Object.values(COURSES).map(c => ({\n';
body += '  id: c.id,\n';
body += '  title: c.title,\n';
body += '  language: c.language,\n';
body += '  color: c.color,\n';
body += '  blurb: c.blurb,\n';
body += '  estimatedHours: c.estimatedHours,\n';
body += '  lessonCount: c.lessons.length,\n';
body += "  href: '#/courses/' + c.id,\n";
body += '}));\n';

const outPath = path.join(__dirname, '..', 'src', 'content', 'courses.js');
const bak = outPath + '.bak';
fs.copyFileSync(outPath, bak);
fs.writeFileSync(outPath, body);
console.log(`\nWrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB).`);
console.log(`Backup at ${bak}`);

// Sanity: re-import to confirm parse
try {
  const reimport = await import(outPath + '?v=' + Date.now());
  const arr = Object.values(reimport.COURSES);
  console.log(`Re-imported: ${arr.length} courses, ${arr.reduce((s, c) => s + (c.lessons?.length || 0), 0)} lessons total.`);
} catch (e) {
  console.error('Re-import failed:', e.message);
  console.error('Restoring backup.');
  fs.copyFileSync(bak, outPath);
  process.exit(1);
}
