#!/usr/bin/env node
// One-shot SQL applier against the live Supabase Postgres.
//
// Reads SUPABASE_DB_PASSWORD from env (NOT from any file). Connects to the
// project's pooler endpoint and runs the SQL file(s) you pass.
//
// Usage:
//   SUPABASE_DB_PASSWORD='...' node scripts/apply-sql.js scripts/migrate-23-seed-problems.sql
//   SUPABASE_DB_PASSWORD='...' node scripts/apply-sql.js scripts/migrate-1*.sql
//
// The password is read from process.env once and held only in memory. We do
// NOT write it to disk, log it, or echo it back. The Client is closed at the
// end and the env var is cleared from this process.

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const PROJECT_REF = 'ykpjmvoyatcrlqyqbgfu';
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD env var. Run as:');
  console.error('  SUPABASE_DB_PASSWORD=\'...\' node scripts/apply-sql.js <files...>');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('No SQL files passed. Usage:');
  console.error('  node scripts/apply-sql.js path/to/file.sql [...]');
  process.exit(1);
}

// Validate every file exists before we connect, so we don't waste a session
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`File not found: ${f}`);
    process.exit(1);
  }
}

// Connect to the direct DB endpoint (port 5432). The pooler endpoint
// (port 6543) is for short transactions and rejects multi-statement scripts.
const client = new pg.Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  user: 'postgres',
  database: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// Scrub from this process's env immediately. The pg Client now has its own
// copy in private state but nothing else in this process should see it.
delete process.env.SUPABASE_DB_PASSWORD;

async function run() {
  try {
    await client.connect();
    console.log(`Connected to ${PROJECT_REF}.`);
    for (const file of files) {
      const sql = fs.readFileSync(file, 'utf8');
      const label = path.basename(file);
      const t0 = Date.now();
      try {
        await client.query(sql);
        console.log(`[OK]  ${label}  (${Date.now() - t0}ms)`);
      } catch (e) {
        console.error(`[FAIL] ${label}: ${e.message}`);
        // Continue to next file rather than aborting — most migrations are
        // idempotent and a failure mid-script shouldn't block the rest.
      }
    }
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch(e => { console.error('Connection failed:', e.message); process.exit(2); });
