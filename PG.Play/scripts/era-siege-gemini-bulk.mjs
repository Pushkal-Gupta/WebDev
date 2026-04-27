// Gemini Nano-Banana bulk generator for Era Siege.
//
// Reads GEMINI_API_KEY from the environment, calls
// `gemini-2.5-flash-image-preview` for each entry in JOBS, decodes the
// returned base64 PNG, strips the model's bottom-right watermark, and
// drops the result into `assets/era-seige/<id>.png` so the existing
// processor scripts pick it up.
//
// Usage:
//   GEMINI_API_KEY=… node scripts/era-siege-gemini-bulk.mjs
//   GEMINI_API_KEY=… ONLY=bases node scripts/era-siege-gemini-bulk.mjs
//
// CONCURRENCY is intentionally small — we'd rather take the gentle path
// than cram the 429-prone budget. Retries with exponential backoff on
// 429 / 5xx.
//
// The model returns a single image per call. Authoring at "as large as
// the model returns" (≈1024 / 1408 px on a side); we downscale at the
// asset-processor stage when the image lands in the public/ tree.

import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC_DIR = resolve(ROOT, 'assets/era-seige');

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error('GEMINI_API_KEY env var required.');
  process.exit(2);
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CONCURRENCY = 2;
const MAX_RETRIES = 3;

// ── Prompt library ─────────────────────────────────────────────────────
//
// Per-era visual cues. Used by every prompt below so each piece reads
// as the same world. Style anchor: dark painterly silhouette, low-mid
// saturation, single accent per era, NO logos / signatures / text.

const ERA_TONE = {
  1: 'warm ember dusk; deep oranges (#ff8a3a) fading to brown (#7d2a10); ash and bone motifs',
  2: 'overcast steel; cold grey (#7d8794) to deep slate (#262e38); banners and oath flags',
  3: 'brass heat haze; copper amber (#dba85a) fading to dark umber (#62311a); steam and smokestacks',
  4: 'storm dieselpunk; gunmetal (#3c5777) to deep navy (#0e1622); accent electric teal (#7be3ff)',
  5: 'void cosmic; deep purple (#1a0a3a) to near-black (#080014); pale magenta accents (#e9c8ff)',
};
const ERA_NAME = {
  1: 'Ember Tribe',
  2: 'Iron Dominion',
  3: 'Sun Foundry',
  4: 'Storm Republic',
  5: 'Void Ascendancy',
};

const STYLE_PREAMBLE = (
  'Game art, 2D side-view, painterly silhouette-first, dark painterly. ' +
  'Production-grade. No text, no signatures, no watermarks, no logos, no UI elements. ' +
  'Transparent background unless otherwise stated. Foot-anchored bottom edge. ' +
  'Readable at small sizes. Premium tactical game atmosphere.'
);

const baseFor = (n, side) => ({
  id: `base_era${n}_${side}`,
  prompt: [
    STYLE_PREAMBLE,
    `Subject: a fortified base/wall structure for the ${ERA_NAME[n]} era, side-view, facing ${side === 'player' ? 'right' : 'left'}.`,
    `Tone: ${ERA_TONE[n]}.`,
    `Period flavor: ` + (
      n === 1 ? 'crude wood + bone palisade with a small banner pennant'
      : n === 2 ? 'grey stone keep with iron-banded gate, steel banner stripe'
      : n === 3 ? 'brass-plated foundry tower with copper pipework + smokestack'
      : n === 4 ? 'riveted gunmetal bunker with a tesla coil aerial + cable bundles'
      : 'crystalline obsidian gate with floating violet glyphs'
    ) + '.',
    'Composition: full silhouette of a base wall, ~80% canvas height, doorway visible, banner top stripe.',
    'Transparent background, single subject centred, no environment, no people, no animals.',
    'Output a single PNG.',
  ].join(' '),
  outputName: `${side === 'player' ? 'player' : 'enemy'}_base_era${n}.png`,
  // Prefer transparent.
});

const mountainsFor = (n, depth) => ({
  id: `mountains_era${n}_${depth}`,
  prompt: [
    STYLE_PREAMBLE,
    `Subject: ${depth === 'far' ? 'far-distance mountain silhouettes' : 'closer mid-distance hill silhouettes'} for the ${ERA_NAME[n]} era.`,
    `Tone: ${ERA_TONE[n]}.`,
    `Per-era silhouette character: ` + (
      n === 1 ? 'jagged sharp peaks with crude bone/wood markers along the ridge'
      : n === 2 ? 'blocky escarpments + watchtower silhouettes on 1-2 peaks + small banners'
      : n === 3 ? 'smokestack chimneys + brass-domed industrial silhouettes + visible steam plumes'
      : n === 4 ? 'lightning rod antennas on cliffs + telephone-pole rigging silhouettes'
      : 'floating monolith silhouettes + faint glyph runes + crystalline shards'
    ) + '.',
    `Long horizontal landscape strip — ${depth === 'far' ? '7-9 peaks' : '4-6 closer hills'} across the width.`,
    'Pure silhouette tones, transparent background, no sky, no foreground, no text.',
    'Output a single PNG.',
  ].join(' '),
  outputName: `${depth}_mountains_era${n}.png`,
});

const foregroundFor = (n) => ({
  id: `foreground_era${n}`,
  prompt: [
    STYLE_PREAMBLE,
    `Subject: nearest foreground band — rocks, grass tufts, debris specific to the ${ERA_NAME[n]} era.`,
    `Tone: ${ERA_TONE[n]}.`,
    'Per-era debris: ' + (
      n === 1 ? 'scattered bones, charred logs, broken stone tools'
      : n === 2 ? 'banners on poles, scattered iron stones, helmets'
      : n === 3 ? 'brass barrels, copper coils, scrap metal'
      : n === 4 ? 'telephone poles, snapped cables, bent scrap, antennas'
      : 'crystalline shards, floating glow runes, glass-shard motes'
    ),
    'Long horizontal silhouette strip, foreground depth, transparent background, no sky, no horizon.',
    'Output a single PNG.',
  ].join(' '),
  outputName: `foreground_era${n}.png`,
});

const turretFor = (n) => ({
  id: `turret_era${n}`,
  prompt: [
    STYLE_PREAMBLE,
    `Subject: a stationary turret/emplacement for the ${ERA_NAME[n]} era, single side-view pose, mounted barrel pointing right.`,
    `Tone: ${ERA_TONE[n]}.`,
    'Specific weapon kind: ' + (
      n === 1 ? 'bone-and-wood crossbow on a wooden mast'
      : n === 2 ? 'iron ballista with a bell muzzle on a stone base'
      : n === 3 ? 'brass mortar on a riveted plate, with steam vents'
      : n === 4 ? 'tesla coil cannon with three vertical prongs, arc flicker around tip'
      : 'void-lance with a tapered crystalline barrel, soft purple glow'
    ),
    'Single subject, transparent background, foot-anchored at bottom centre, no people, no environment, no UI.',
    'Output a single PNG.',
  ].join(' '),
  outputName: `turret_era${n}.png`,
});

const JOBS = [
  // Bases — player & enemy facing differ visually only by direction; we
  // ask for both so each side has its own banner colour.
  ...[1, 2, 3, 4, 5].flatMap((n) => [baseFor(n, 'player'), baseFor(n, 'enemy')]),
  // Mountain silhouettes — far + mid per era.
  ...[1, 2, 3, 4, 5].flatMap((n) => [mountainsFor(n, 'far'), mountainsFor(n, 'mid')]),
  // Foreground bands per era.
  ...[1, 2, 3, 4, 5].map(foregroundFor),
  // Turret silhouettes per era.
  ...[1, 2, 3, 4, 5].map(turretFor),
];

// ── HTTP + retry ───────────────────────────────────────────────────────

async function generateOne(job) {
  const body = {
    contents: [{ parts: [{ text: job.prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      candidateCount: 1,
    },
  };
  const url = `${ENDPOINT}?key=${encodeURIComponent(KEY)}`;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status >= 500) {
        const wait = 2000 * (attempt + 1);
        console.warn(`  ${job.id} → ${res.status}, retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} — ${text.slice(0, 240)}`);
      }
      const data = await res.json();
      const cand = data?.candidates?.[0];
      const part = cand?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part) {
        const finishReason = cand?.finishReason || 'unknown';
        const text = (cand?.content?.parts || []).map((p) => p.text).filter(Boolean).join(' ');
        throw new Error(`no image in response (finishReason=${finishReason})${text ? ' — ' + text.slice(0, 200) : ''}`);
      }
      return Buffer.from(part.inlineData.data, 'base64');
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      const wait = 2000 * (attempt + 1);
      console.warn(`  ${job.id} retry after error: ${err.message}`);
      await sleep(wait);
    }
  }
  throw new Error(`exhausted retries on ${job.id}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Strip the Gemini sparkle watermark — bottom-right ~7% × 7%, transparent
// for alpha images; for opaque images we fall back to a clean-strip
// composite. Era-Siege bases / mountains / foregrounds / turrets are all
// transparent-bg outputs, so dest-out wipe is the right move.
async function stripWatermark(buf) {
  const meta = await sharp(buf).metadata();
  const W = meta.width, H = meta.height;
  const ww = Math.round(W * 0.10);
  const wh = Math.round(H * 0.10);
  const mask = await sharp({
    create: {
      width: ww, height: wh, channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).png().toBuffer();
  return sharp(buf)
    .composite([{ input: mask, left: W - ww, top: H - wh, blend: 'dest-out' }])
    .png()
    .toBuffer();
}

// ── Driver ─────────────────────────────────────────────────────────────

const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map((s) => s.trim()) : null;
const filtered = ONLY
  ? JOBS.filter((j) => ONLY.some((tag) => j.id.includes(tag)))
  : JOBS;

mkdirSync(SRC_DIR, { recursive: true });

console.log(`gemini bulk-gen — ${filtered.length} jobs (concurrency ${CONCURRENCY})`);
const start = Date.now();
let done = 0, ok = 0, fail = 0;

async function worker(jobs) {
  for (;;) {
    const j = jobs.shift();
    if (!j) return;
    const dest = join(SRC_DIR, j.outputName);
    if (existsSync(dest) && !process.env.OVERWRITE) {
      console.log(`· ${j.id} → already at ${j.outputName} (skip; OVERWRITE=1 to redo)`);
      done++; ok++;
      continue;
    }
    try {
      const raw = await generateOne(j);
      const stripped = await stripWatermark(raw);
      writeFileSync(dest, stripped);
      console.log(`✓ ${j.id} → ${j.outputName} (${(stripped.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.error(`✗ ${j.id} → ${err.message}`);
      fail++;
    }
    done++;
  }
}

const queue = filtered.slice();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\ndone — ${ok}/${filtered.length} ok, ${fail} failed, ${elapsedSec}s elapsed`);
console.log('next: re-run the asset processors so the new images land in public/.');
console.log('  node scripts/era-siege-process-art.mjs');
console.log('  node scripts/era-siege-process-icons.mjs');
