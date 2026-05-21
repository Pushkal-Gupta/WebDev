#!/usr/bin/env node
// Sanity-check: run each USDA course question's starter SQL through sql.js
// against the seed schema and verify it grades as correct. Catches typos in
// seed data or expected results before they ship to users.

import initSqlJs from 'sql.js';
import { SQL_COURSES, gradeResult } from '../src/content/sqlCourses.js';

const SQL = await initSqlJs();

let pass = 0, fail = 0;
for (const [slug, course] of Object.entries(SQL_COURSES)) {
  console.log(`\n=== ${slug} ===`);
  const db = new SQL.Database();
  db.run(course.seedSql);
  for (const q of course.questions) {
    let res;
    try { res = db.exec(q.starter); }
    catch (e) { console.log(`FAIL  ${q.id}  ${q.title}\n  exec error: ${e.message}`); fail += 1; continue; }
    const grade = gradeResult(res, q.expected);
    if (grade.ok) { console.log(`PASS  ${q.id}  ${q.title}`); pass += 1; }
    else { console.log(`FAIL  ${q.id}  ${q.title}\n  ${grade.reason.replace(/\n/g, '\n  ')}`); fail += 1; }
  }
  db.close();
}
console.log(`\n${pass}/${pass + fail} questions self-grade as correct across all courses.`);
process.exit(fail ? 1 : 0);
