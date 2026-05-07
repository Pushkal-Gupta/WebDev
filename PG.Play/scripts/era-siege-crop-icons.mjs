// Crop the user-provided icon sheets into the per-icon PNGs the
// PowerUpsDrawer + SpecialButton load by path.
//
// Source sheets:
//   assets/era-siege/power_1.png — 5 secondary specials, horizontal row
//   assets/era-siege/power_2.png — 7 powerup trees,    horizontal row
//
// Each tile has a stone/wood "frame" border around the actual icon.
// We crop the inner art square (skipping the frame), trim alpha, and
// emit a 256×256 PNG sized for the UI.

import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_UI = resolve(ROOT, 'public/games/era-siege/ui');

// Both source sheets are 2816×1536. Tiles centred on a row, with a
// stone "shelf" below and decorative wall above. Tuning:
//   power_1: 5 tiles, icon y-band ≈ y[170..740], step ≈ 530
//   power_2: 7 tiles, icon y-band ≈ y[260..800], step ≈ 380
// Each tile is centred on the source row; cell width = total span / count.
// We crop a square box around each centre, sized to skip the metallic
// frame on all four sides.
// Centres derived from N evenly-spaced tiles across the 2816-wide sheet:
// centre[i] = (i + 0.5) * 2816 / count.
// Y bands derived empirically from a per-row saturation scan of each
// sheet (see notes in audit log). Tiles are square so innerW ≈ height.
const POWER_1_LAYOUT = {
  count: 5,
  yTop: 290,
  yBot: 800,
  centres: [282, 845, 1408, 1971, 2534],
  innerW: 480,
};
const POWER_2_LAYOUT = {
  count: 7,
  yTop: 540,
  yBot: 890,
  centres: [201, 603, 1005, 1408, 1810, 2212, 2615],
  innerW: 320,
};

const POWER_1_FILES = [
  'special-era1-2.png',  // Meteor Rain
  'special-era2-2.png',  // Iron Rampart
  'special-era3-2.png',  // Foundry Mortar
  'special-era4-2.png',  // Voltaic Cascade
  'special-era5-2.png',  // Event Horizon
];

const POWER_2_FILES = [
  'upgrade-economy.png',   // Treasury
  'upgrade-base.png',      // Bastion
  'upgrade-special.png',   // Resonance
  'upgrade-turret.png',    // Munitions
  'upgrade-troopDmg.png',  // Drilled Edge
  'upgrade-troopHp.png',   // Conditioning
  'upgrade-troopRng.png',  // Long-Sighted
];

async function cropSheet(srcPath, layout, files) {
  const meta = await sharp(srcPath).metadata();
  console.log(`${srcPath.split('/').pop()}: ${meta.width}x${meta.height}, ${layout.count} tiles`);
  for (let i = 0; i < layout.count; i++) {
    const cx = layout.centres[i];
    const w = layout.innerW;
    const h = layout.yBot - layout.yTop;
    const x = Math.max(0, cx - Math.floor(w / 2));
    const y = layout.yTop;
    const out = resolve(OUT_UI, files[i]);
    await sharp(srcPath)
      .extract({ left: x, top: y, width: w, height: h })
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`  ✓ ${files[i]} (extracted ${w}x${h} from x=${x},y=${y})`);
  }
}

(async () => {
  await cropSheet(resolve(ROOT, 'assets/era-siege/power_1.png'), POWER_1_LAYOUT, POWER_1_FILES);
  await cropSheet(resolve(ROOT, 'assets/era-siege/power_2.png'), POWER_2_LAYOUT, POWER_2_FILES);
  console.log('done');
})();
