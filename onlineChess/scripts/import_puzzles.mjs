/**
 * Lichess Puzzle Importer
 * ───────────────────────
 * Downloads the Lichess CC0 puzzle CSV and inserts puzzles into Supabase.
 *
 * Usage:
 *   node scripts/import_puzzles.mjs
 *
 * Options (env vars):
 *   SUPABASE_URL          — defaults to the project URL below
 *   SUPABASE_SERVICE_KEY  — REQUIRED: service_role key (bypasses RLS)
 *   PUZZLE_LIMIT          — max puzzles to import (default 50000)
 *   RATING_MIN            — minimum puzzle rating (default 800)
 *   RATING_MAX            — maximum puzzle rating (default 2800)
 *
 * Get your service_role key from:
 *   Supabase dashboard → Project Settings → API → service_role (secret)
 */

import https from 'https';
import zlib from 'zlib';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL
  || 'https://ykpjmvoyatcrlqyqbgfu.supabase.co';

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY env var is required.');
  console.error('  Get it from: Supabase dashboard → Settings → API → service_role');
  console.error('  Run: SUPABASE_SERVICE_KEY=your_key node scripts/import_puzzles.mjs');
  process.exit(1);
}

const PUZZLE_LIMIT = parseInt(process.env.PUZZLE_LIMIT  || '50000');
const RATING_MIN   = parseInt(process.env.RATING_MIN    || '800');
const RATING_MAX   = parseInt(process.env.RATING_MAX    || '2800');
const BATCH_SIZE   = 500;

// Lichess open database — CC0 license
const CSV_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';

// ─── Supabase client (service role — bypasses RLS) ───────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fetchStream(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept-Encoding': 'identity' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchStream(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      resolve(res);
    }).on('error', reject);
  });
}

async function* streamLines(nodeStream) {
  let buf = '';
  for await (const chunk of nodeStream) {
    buf += chunk.toString('utf8');
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      yield buf.slice(0, idx);
      buf = buf.slice(idx + 1);
    }
  }
  if (buf.length) yield buf;
}

async function insertBatch(rows) {
  const { error } = await supabase
    .from('puzzles')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Importing up to ${PUZZLE_LIMIT.toLocaleString()} puzzles `
    + `(rating ${RATING_MIN}–${RATING_MAX}) into Supabase…\n`);

  // Check current count
  const { count: existing } = await supabase
    .from('puzzles').select('*', { count: 'exact', head: true });
  console.log(`Existing puzzles in DB: ${existing ?? 0}`);

  console.log(`\nDownloading from Lichess database (this is a large file, please wait)…`);

  const httpStream = await fetchStream(CSV_URL);

  // Lichess uses zstd compression (.zst). Node doesn't have built-in zstd.
  // We'll detect if the stream is zstd and fall back to raw if not decompressible.
  // For simplicity, we'll try to pipe through zlib (works for gzip) or raw.
  // Best approach: use the uncompressed CSV if available, or handle zstd.
  //
  // Since Node.js doesn't natively support zstd, we'll check if @bokuweb/zstd-wasm
  // is available, otherwise we abort with instructions.

  let decompressed;
  const contentEncoding = httpStream.headers['content-type'] || '';
  const url = CSV_URL;

  if (url.endsWith('.zst')) {
    // Try to use system zstd via child_process, or suggest alternatives
    try {
      const { spawn } = await import('child_process');
      const zstd = spawn('zstd', ['-d', '--stdout'], { stdio: ['pipe', 'pipe', 'pipe'] });
      httpStream.pipe(zstd.stdin);
      zstd.stderr.on('data', d => {}); // suppress zstd progress output
      decompressed = zstd.stdout;
    } catch (e) {
      console.error('\nERROR: Could not decompress .zst file.');
      console.error('Please install zstd: brew install zstd (macOS) or apt install zstd (Linux)');
      console.error('Then re-run: SUPABASE_SERVICE_KEY=... node scripts/import_puzzles.mjs');
      process.exit(1);
    }
  } else {
    decompressed = httpStream;
  }

  let lineCount  = 0;
  let imported   = 0;
  let skipped    = 0;
  let batch      = [];
  let headerSkipped = false;

  const flush = async () => {
    if (batch.length === 0) return;
    await insertBatch(batch);
    imported += batch.length;
    batch = [];
    process.stdout.write(`\rImported: ${imported.toLocaleString()} | Skipped: ${skipped.toLocaleString()} | Lines read: ${lineCount.toLocaleString()}   `);
  };

  for await (const line of streamLines(decompressed)) {
    lineCount++;

    // Skip CSV header
    if (!headerSkipped) { headerSkipped = true; continue; }

    if (imported + batch.length >= PUZZLE_LIMIT) break;

    // Lichess CSV columns:
    // PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
    const cols = line.split(',');
    if (cols.length < 8) continue;

    const [puzzleId, fen, moves, ratingStr, , , , themes] = cols;
    const rating = parseInt(ratingStr);

    if (!puzzleId || !fen || !moves || isNaN(rating)) { skipped++; continue; }
    if (rating < RATING_MIN || rating > RATING_MAX)   { skipped++; continue; }

    const themeArr = themes ? themes.trim().split(' ').filter(Boolean) : [];

    batch.push({ id: puzzleId, fen, moves, rating, themes: themeArr });

    if (batch.length >= BATCH_SIZE) await flush();
  }

  await flush();

  console.log(`\n\nDone! Imported ${imported.toLocaleString()} puzzles.`);
  if (imported === 0) {
    console.log('\nNo puzzles were imported. Possible reasons:');
    console.log('  • The .zst file failed to decompress (install zstd)');
    console.log('  • All puzzles were outside the rating range');
    console.log('  • The puzzles table already had all matching rows (ignoreDuplicates=true)');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
