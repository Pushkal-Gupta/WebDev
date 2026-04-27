// One-shot UI-icon importer for the four images on Desktop:
//   special_ability_icons.png (a 2x3 quincunx sheet of 5 era specials)
//   upgrade_economy.png       — Treasury icon (correctly named)
//   upgrade_special.png       — actually the BASE icon (user noted swap)
//   upgrade_turret.png        — actually the SPECIAL icon (user noted swap)
//
// Steps:
//   1. Strip Gemini watermark by clearing the bottom-right corner with
//      a transparent-mask dest-out wipe.
//   2. Split the special-ability sheet into 5 per-era PNGs at fixed
//      crop boxes (the sheet is 2048×2048 with icons in quincunx).
//   3. Resize to 192×192 (icons) and save under
//      `public/games/era-siege/ui/`.
//
// Usage:
//   node scripts/era-siege-process-icons.mjs

import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT    = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
// User-managed source folder (their spelling: "seige").
const SRC_DIR = resolve(ROOT, 'assets/era-seige');
const DEST_UI = resolve(ROOT, 'public/games/era-siege/ui');

// Watermark wipe: a transparent rect over the bottom-right of each
// transparent-bg PNG, sized to comfortably cover the Gemini sparkle.
async function stripWatermark(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const W = meta.width, H = meta.height;
  // Watermark covers ~5% × 5% of frame on the icon images.
  const ww = Math.round(W * 0.10);
  const wh = Math.round(H * 0.10);
  const mask = await sharp({
    create: {
      width: ww, height: wh, channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).png().toBuffer();
  return sharp(srcPath)
    .composite([{ input: mask, left: W - ww, top: H - wh, blend: 'dest-out' }])
    .toBuffer();
}

// Save buffer with a square-ish resize to N pixels max edge.
async function saveIcon(buf, dest, size = 192) {
  await sharp(buf)
    .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(dest);
}

// ── 1. Power-up icons (rename + watermark strip + downsize) ──
//
// Final mapping after user's renames on Desktop — every source filename
// now matches its tree id, so the destination filenames are 1:1:
//   upgrade_economy.png → economy
//   upgrade_base.png    → base
//   upgrade_special.png → special
// Turret-damage icon (Munitions) — user will provide later.
const POWERUP_MAP = [
  { src: 'upgrade_economy.png', dest: 'upgrade-economy.png' },
  { src: 'upgrade_base.png',    dest: 'upgrade-base.png'    },
  { src: 'upgrade_special.png', dest: 'upgrade-special.png' },
  { src: 'upgrade-turret.png',  dest: 'upgrade-turret.png'  }, // hyphen in source filename, hyphen in dest
];

// Misc UI assets (single-frame, alpha-on, drop-into-place).
const UI_MAP = [
  { src: 'badge_toast.png', dest: 'badge-toast.png', size: 360 },
];

for (const m of POWERUP_MAP) {
  const src = join(SRC_DIR, m.src);
  const dest = join(DEST_UI, m.dest);
  if (!existsSync(src)) { console.warn(`skip ${m.src} — missing`); continue; }
  const stripped = await stripWatermark(src);
  await saveIcon(stripped, dest, 192);
  console.log(`✓ ${m.dest} ← ${m.src}`);
}

// Misc single-frame UI art (badge toast, etc.)
for (const m of UI_MAP) {
  const src = join(SRC_DIR, m.src);
  const dest = join(DEST_UI, m.dest);
  if (!existsSync(src)) { console.warn(`skip ${m.src} — missing`); continue; }
  const stripped = await stripWatermark(src);
  // For toast frames we want preserved aspect ratio, not square-clamp.
  await sharp(stripped)
    .resize({ width: m.size, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(dest);
  console.log(`✓ ${m.dest} ← ${m.src}`);
}

// ── 2. Special-ability icons sheet → 5 per-era files ──
//
// The sheet (2048×2048) lays icons out in a quincunx pattern:
//   top-left   = era 1 (Ember Volley)
//   top-right  = era 2 (Iron Rain)
//   center     = era 3 (Sun Forge)
//   bottom-left  = era 4 (Storm Fork)
//   bottom-right = era 5 (Void Collapse)
// Each icon is roughly 540×540 in the source. Crop boxes are tuned
// against the visible layout in the user-provided sheet.

const SHEET_SRC = join(SRC_DIR, 'special_ability_icons.png');
if (existsSync(SHEET_SRC)) {
  const sheetMeta = await sharp(SHEET_SRC).metadata();
  // Strip watermark first (if any).
  const stripped = await stripWatermark(SHEET_SRC);

  // Crop boxes (approximated from the quincunx layout — generous box
  // so the round icon sits comfortably inside a transparent bleed).
  const W = sheetMeta.width, H = sheetMeta.height;
  const cropSize = Math.round(W * 0.30); // ~610 of 2048
  const half = cropSize / 2;
  const centers = [
    { era: 1, cx: W * 0.27, cy: H * 0.20 },   // top-left
    { era: 2, cx: W * 0.73, cy: H * 0.20 },   // top-right
    { era: 3, cx: W * 0.50, cy: H * 0.48 },   // center
    { era: 4, cx: W * 0.27, cy: H * 0.76 },   // bottom-left
    { era: 5, cx: W * 0.73, cy: H * 0.76 },   // bottom-right
  ];

  for (const c of centers) {
    const left = Math.max(0, Math.round(c.cx - half));
    const top  = Math.max(0, Math.round(c.cy - half));
    const width  = Math.min(cropSize, W - left);
    const height = Math.min(cropSize, H - top);
    const cell = await sharp(stripped)
      .extract({ left, top, width, height })
      .toBuffer();
    const dest = join(DEST_UI, `special-era${c.era}.png`);
    await saveIcon(cell, dest, 192);
    console.log(`✓ special-era${c.era}.png ← cropped (${left},${top}) ${width}×${height}`);
  }
} else {
  console.warn('skip special_ability_icons.png — missing');
}

// ── 3. Unit sprite sheet → 15 per-unit sub-sheets ──
//
// Source: ~/Desktop/unit_sprite_sheet.png — a master 2752×1536 grid laid
// out as 5 eras (rows) × 3 roles (cols). Each cell holds a small grid of
// pose frames (walk / attack / death) for one unit. We crop into 15
// independent files; the renderer can blit a single hero-pose frame
// today and a richer animation-aware drawer can come later without
// changing filenames.
//
// Layout assumed (5 rows × 3 cols, even split):
//   row N (era N) × col M (frontline=0 | ranged=1 | heavy=2)
//
// If the source layout doesn't perfectly split this way, the cells will
// over-include a margin which is fine — the renderer scales to fit.

import { mkdirSync as _mkdir } from 'node:fs';

const SHEET_PATH = join(SRC_DIR, 'unit_sprite_sheet.png');
if (existsSync(SHEET_PATH)) {
  const sheet = sharp(SHEET_PATH);
  const meta  = await sheet.metadata();
  const W = meta.width, H = meta.height;
  const cellW = Math.floor(W / 3);
  const cellH = Math.floor(H / 5);
  const ROLES = ['frontline', 'ranged', 'heavy'];
  const DEST_UNIT = resolve(ROOT, 'public/games/era-siege/unit');
  // Each cell uses a 5 × 3 sub-grid of poses (the master sheet keeps
  // frame size consistent within an era — the heavy units just look
  // bigger inside the same cell because their silhouettes are taller).
  const FRAME_GRID = {
    frontline: { cols: 5, rows: 3 },
    ranged:    { cols: 5, rows: 3 },
    heavy:     { cols: 5, rows: 3 },
  };

  for (let era = 0; era < 5; era++) {
    _mkdir(join(DEST_UNIT, `era${era + 1}`), { recursive: true });
    for (let role = 0; role < 3; role++) {
      const roleId = ROLES[role];
      const cellLeft = role * cellW;
      const cellTop  = era * cellH;
      const grid = FRAME_GRID[roleId];
      const frameW = Math.floor(cellW / grid.cols);
      const frameH = Math.floor(cellH / grid.rows);
      // Hero pose: top-left frame of the cell.
      const dest = join(DEST_UNIT, `era${era + 1}`, `${roleId}.png`);
      await sharp(SHEET_PATH)
        .extract({ left: cellLeft, top: cellTop, width: frameW, height: frameH })
        .png({ compressionLevel: 9 })
        .toFile(dest);
      console.log(`✓ unit/era${era + 1}/${roleId}.png ← frame ${frameW}×${frameH} from cell (${cellLeft},${cellTop})`);
      // Also write the full multi-frame cell for future animation use.
      const sheetDest = join(DEST_UNIT, `era${era + 1}`, `${roleId}-sheet.png`);
      await sharp(SHEET_PATH)
        .extract({ left: cellLeft, top: cellTop, width: cellW, height: cellH })
        .png({ compressionLevel: 9 })
        .toFile(sheetDest);
    }
  }
} else {
  console.warn('skip unit_sprite_sheet.png — missing');
}

console.log('\ndone — UI icons live in public/games/era-siege/ui/.');
console.log('       unit cells live in public/games/era-siege/unit/era<N>/{frontline,ranged,heavy}.png');
