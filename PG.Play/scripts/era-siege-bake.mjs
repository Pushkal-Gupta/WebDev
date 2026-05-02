// Era Siege — bake procedural backgrounds + bases into PNGs.
//
// Why bake at all?
//   Original art came from Gemini reference sheets that baked transparency-
//   checker pixels into the silhouette region. No keying pass cleaned them
//   reliably. Procedural is the right contract — it's deterministic, era-
//   themed, and crisp. This script captures the procedural draw output to
//   actual PNG files so we get tangible image assets while sidestepping the
//   transparency mess entirely.
//
// What gets baked:
//   sky.png          — full sky behind everything (opaque)
//   mountains-far.png — distant ridge silhouette + atmospheric blend
//   mountains-mid.png — closer ridge with motif (castles / smokestacks /
//                       obelisks per era) and the tree-line silhouette
//                       just above groundY
//   foreground.png    — dirt-band detail (grass, debris) BELOW groundY
//   base/{player,enemy}.png — era-themed base silhouettes
//
// What stays procedural (NOT baked):
//   clouds         — drift over time, must re-paint each frame
//   units          — animated walk + attack frames composited at runtime
//   turrets        — fire/recoil frame swaps composited at runtime
//   projectiles    — rotated to velocity vector each frame
//   vfx            — sheet-based, already shipped as static PNG sheets
//
// Pipeline:
//   puppeteer → headless Chrome → loads scripts/era-siege-bake/page.html →
//   page.html imports the same procedural draws used at runtime → exposes
//   window.bakeAsset(spec) → returns a base64 PNG → sharp re-encodes for
//   smaller file sizes → writes to public/games/era-siege/...
//
// Idempotent: re-running overwrites the previous bake. Safe to run any
// time the procedural draws are tweaked.

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { resolve, join, dirname } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ERAS } from '../src/games/era-siege/content/eras.js';
import { UNITS_BY_ID } from '../src/games/era-siege/content/units.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PAGE_URL = `file://${resolve(__dirname, 'era-siege-bake/page.html')}`;
const OUT = resolve(ROOT, 'public/games/era-siege');

// Bake at 2× the typical render size for HiDPI — the runtime image-draws
// already assume "source images are 2× target size" (see image-draws.js).
//
//   sky:      1920 × 720   (covers groundY up to 720)
//   far/mid:  1920 × 360   (mountain bands; runtime stretches to view.w)
//   foreground: 1920 × 200 (dirt-band, max 200px tall per drawForegroundImage)
//   base:      256 × 320   (foot-anchored, runtime renders at h=220)

const BG_W       = 1920;
const SKY_H      = 720;
const MOUNTAIN_H = 360;
const FG_H       = 200;
// Bases: 360×440 canvas — runtime renders at h≈260 so we want a
// natural height ≥260 to stay sharp.
const BASE_BAKE_W = 360;
const BASE_BAKE_H = 440;
// Units: 480×520 canvas at scale 3.6 — bumped from 2.6 so the runtime's
// scale-up to ~134-168px target stays inside 1.0× of the source (no
// blur from canvas upscaling). Trimmed after bake to a tight bbox.
const UNIT_W     = 480;
const UNIT_H     = 520;
const UNIT_SCALE = 3.6;

// Spec list. For each spec we evaluate `window.bakeAsset(spec)` and write
// the resulting PNG to `outPath`.
function buildSpecs(eraIds) {
  const specs = [];
  for (let i = 0; i < eraIds.length; i++) {
    const eraId = eraIds[i];
    const eraN = i + 1;
    const dir = join(OUT, `bg/era${eraN}`);
    mkdirSync(dir, { recursive: true });
    specs.push({
      outPath: join(dir, 'sky.png'),
      spec: { type: 'sky', eraId, w: BG_W, h: SKY_H, opts: { groundY: SKY_H } },
    });
    specs.push({
      outPath: join(dir, 'mountains-far.png'),
      spec: { type: 'mountains-far', eraId, w: BG_W, h: MOUNTAIN_H,
              opts: { groundY: MOUNTAIN_H } },
    });
    specs.push({
      outPath: join(dir, 'mountains-mid.png'),
      spec: { type: 'mountains-mid', eraId, w: BG_W, h: MOUNTAIN_H,
              opts: { groundY: MOUNTAIN_H } },
    });
    specs.push({
      outPath: join(dir, 'foreground.png'),
      // Foreground content sits BELOW groundY — bake with groundY=0 so
      // the placeholder paints the dirt band starting at the PNG top.
      spec: { type: 'foreground', eraId, w: BG_W, h: FG_H, opts: { groundY: 0 } },
    });

    // Bases — foot-anchored at the canvas bottom, centered in x.
    const baseDir = join(OUT, `base/era${eraN}`);
    mkdirSync(baseDir, { recursive: true });
    specs.push({
      outPath: join(baseDir, 'player.png'),
      spec: { type: 'base-player', eraId, w: BASE_BAKE_W, h: BASE_BAKE_H,
              opts: { x: BASE_BAKE_W / 2, groundY: BASE_BAKE_H } },
    });
    specs.push({
      outPath: join(baseDir, 'enemy.png'),
      spec: { type: 'base-enemy', eraId, w: BASE_BAKE_W, h: BASE_BAKE_H,
              opts: { x: BASE_BAKE_W / 2, groundY: BASE_BAKE_H } },
    });
  }

  // Units — 5 eras × 3 roles + 1 general. Each era's unitIds[] is
  // ordered [frontline, ranged, heavy]; the era's generalId points at
  // the era's general unit.
  const ROLE_ORDER = ['frontline', 'ranged', 'heavy'];
  for (let i = 0; i < 5; i++) {
    const eraId = eraIds[i];
    const eraN = i + 1;
    const era = ERAS[i];
    const dir = join(OUT, `unit/era${eraN}`);
    mkdirSync(dir, { recursive: true });
    for (const role of ROLE_ORDER) {
      const unitId = era.unitIds.find((id) => UNITS_BY_ID[id]?.role === role);
      if (!unitId) continue;
      specs.push({
        outPath: join(dir, `${role}.png`),
        spec: { type: 'unit', eraId, w: UNIT_W, h: UNIT_H,
                opts: { unitId, scale: UNIT_SCALE } },
      });
    }
    if (era.generalId) {
      // Generals bake at a higher scale so the upscale in-game stays
      // crisp — they render at heavy×1.4 ≈ 235px tall on the canvas.
      specs.push({
        outPath: join(dir, 'general.png'),
        spec: { type: 'unit', eraId, w: UNIT_W, h: UNIT_H,
                opts: { unitId: era.generalId, scale: UNIT_SCALE * 1.25 } },
      });
    }
  }
  return specs;
}

async function main() {
  console.log('Era Siege bake — launching headless Chrome...');
  // No-sandbox is fine here: we control every byte that runs in the page.
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox',
           // file:// + ES modules need module loading enabled across origins.
           '--allow-file-access-from-files'],
  });
  const page = await browser.newPage();

  // Surface in-page console + errors so failures don't disappear silently.
  page.on('console', (msg) => {
    const t = msg.type();
    if (t === 'error' || t === 'warning') console.log(`[page ${t}]`, msg.text());
  });
  page.on('pageerror', (err) => console.error('[page error]', err.message));

  await page.goto(PAGE_URL, { waitUntil: 'load' });
  // Wait for the ESM module graph to settle and bakeAsset to be installed.
  await page.waitForFunction(() => window.bakeReady === true, { timeout: 10000 });

  const eraIds = await page.evaluate(() => window.eraIds);
  const specs = buildSpecs(eraIds);
  console.log(`Baking ${specs.length} assets across ${eraIds.length} eras...`);

  const start = Date.now();
  let ok = 0, fail = 0;
  for (const { outPath, spec } of specs) {
    try {
      const dataUrl = await page.evaluate((s) => window.bakeAsset(s), spec);
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      // Bases + units need a tight bounding box — the runtime scales
      // the whole PNG to a target height, so any transparent padding
      // scales with it and shrinks the visible silhouette. Auto-trim
      // alpha=0 edges.
      const tightBbox = spec.type === 'base-player'
                     || spec.type === 'base-enemy'
                     || spec.type === 'unit';
      let pipeline = sharp(buf);
      if (tightBbox) pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 });
      await pipeline.png({ compressionLevel: 9, palette: false }).toFile(outPath);
      ok++;
      console.log(`  ✓ ${outPath.replace(ROOT + '/', '')}`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${outPath.replace(ROOT + '/', '')} — ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\nbake — ${ok} ok / ${fail} failed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
