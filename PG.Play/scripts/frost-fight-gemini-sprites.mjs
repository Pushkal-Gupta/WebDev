// Frost Fight sprite generator (one-off).
//
// Calls Gemini Nano-Banana for each sprite, strips the bottom-right
// Gemini watermark via an alpha dest-out composite (same pattern as
// era-siege-gemini-bulk.mjs), then trims transparent borders and
// resizes to a 128×128 PNG dropped into
// public/games/frost-fight/sprites/.
//
// Usage:
//   GEMINI_API_KEY=… node scripts/frost-fight-gemini-sprites.mjs
//   GEMINI_API_KEY=… ONLY=player,fruit node scripts/frost-fight-gemini-sprites.mjs
//
// The API key never lands in committed source — pass it via env var.

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const OUT_DIR = resolve(ROOT, 'public/games/frost-fight/sprites');

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('GEMINI_API_KEY env var required'); process.exit(2); }

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_RETRIES = 3;

const SPRITES = [
  {
    id: 'player',
    file: 'player.png',
    prompt: `Cartoon ice cream character mascot, full body, centered, on a fully transparent background.
A tan waffle cone (warm beige #d4a460 with crisscross lines) topped with a single round pink ice cream scoop (#ff8ec6).
On the pink scoop: a friendly face — two large white eyes with black pupils, small black mouth, slight smile.
Style: flat illustration, thick clean black outline (3-4 px), no gradient, no shading, no shadow, no ground.
Strict rules: NO text, NO signature, NO watermark, NO logo, NO ui elements, NO border.
The character fills about 75 percent of the frame, perfectly centered, with even margin on all sides.
Output: 1024 x 1024, PNG with full alpha transparency where there is no character. Background is fully transparent.`,
  },
  {
    id: 'strawberry',
    file: 'strawberry.png',
    prompt: `Cartoon strawberry villain character, full body, centered, on a fully transparent background.
A bright red round strawberry body (#ff4d6d) covered in small white seed dots, with a green leafy crown on top (#2d7a2a).
Angry expression: thick angled black eyebrows, two small white eyes with black pupils, small frown.
Two tiny stubby legs at the base, no arms.
Style: flat illustration, thick clean black outline (3-4 px), no gradient, no shading, no shadow, no ground.
Strict rules: NO text, NO signature, NO watermark, NO logo, NO ui elements, NO border.
The character fills about 75 percent of the frame, perfectly centered, with even margin on all sides.
Output: 1024 x 1024, PNG with full alpha transparency where there is no character. Background is fully transparent.`,
  },
  {
    id: 'blueberry',
    file: 'blueberry.png',
    prompt: `Cartoon blueberry villain character, full body, centered, on a fully transparent background.
A bright blue round blueberry body (#35a8ff) with a small darker blue stem nub on top (#1a3a7a).
Angry expression: thick angled black eyebrows, two small white eyes with black pupils, small frown.
Two tiny stubby legs at the base, no arms.
Style: flat illustration, thick clean black outline (3-4 px), no gradient, no shading, no shadow, no ground.
Strict rules: NO text, NO signature, NO watermark, NO logo, NO ui elements, NO border.
The character fills about 75 percent of the frame, perfectly centered, with even margin on all sides.
Output: 1024 x 1024, PNG with full alpha transparency where there is no character. Background is fully transparent.`,
  },
  {
    id: 'fruit',
    file: 'fruit.png',
    prompt: `A small cute strawberry fruit pickup item, centered on a fully transparent background.
A simple round red strawberry (#ff4d6d) with small white seed dots and a small green leaf top (#2d7a2a).
NO face, NO eyes, NO expression — this is a collectible pickup, not a character.
Style: flat illustration, thick clean black outline (3-4 px), no gradient, no shading, no shadow, no ground.
Strict rules: NO text, NO signature, NO watermark, NO logo, NO ui elements, NO border.
The fruit fills about 65 percent of the frame, perfectly centered, with even margin on all sides.
Output: 1024 x 1024, PNG with full alpha transparency where there is no fruit. Background is fully transparent.`,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callOnce(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`HTTP ${res.status}: ${txt.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p?.inlineData?.data) return Buffer.from(p.inlineData.data, 'base64');
  }
  throw new Error('No inline image: ' + JSON.stringify(json).slice(0, 400));
}

async function call(prompt) {
  let last;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try { return await callOnce(prompt); }
    catch (e) {
      last = e;
      const wait = (e.status === 429 || (e.status >= 500 && e.status < 600)) ? 1500 * (i + 1) : 0;
      if (!wait || i === MAX_RETRIES - 1) break;
      await sleep(wait);
    }
  }
  throw last;
}

// Wipe the bottom-right watermark zone on transparent images. Same
// pattern as era-siege-gemini-bulk.mjs.
async function stripWatermark(buf) {
  const meta = await sharp(buf).metadata();
  const W = meta.width, H = meta.height;
  const ww = Math.round(W * 0.12);
  const wh = Math.round(H * 0.12);
  const mask = await sharp({
    create: { width: ww, height: wh, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).png().toBuffer();
  return sharp(buf)
    .composite([{ input: mask, left: W - ww, top: H - wh, blend: 'dest-out' }])
    .png().toBuffer();
}

async function processSprite(buf, outPath) {
  const wiped = await stripWatermark(buf);
  // Trim transparent borders, then square-pad with 8% margin, then
  // downscale to 128×128. The character ends up a clean centered tile.
  const t = await sharp(wiped).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const m = t.info;
  const max = Math.max(m.width, m.height);
  const pad = Math.round(max * 0.08);
  const side = max + pad * 2;
  await sharp(t.data)
    .extend({
      top: Math.floor((side - m.height) / 2),
      bottom: Math.ceil((side - m.height) / 2),
      left: Math.floor((side - m.width) / 2),
      right: Math.ceil((side - m.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map((s) => s.trim()) : null;
const filtered = ONLY ? SPRITES.filter((s) => ONLY.includes(s.id)) : SPRITES;

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const s of filtered) {
    process.stdout.write(`▶︎ ${s.id} … `);
    try {
      const raw = await call(s.prompt);
      await processSprite(raw, join(OUT_DIR, s.file));
      console.log('ok');
    } catch (e) {
      console.log('FAIL:', e.message);
    }
  }
})();
