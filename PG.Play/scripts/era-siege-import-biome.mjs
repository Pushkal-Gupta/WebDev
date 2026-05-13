// Era Siege — biome-asset importer (v2 art pack).
//
// Reads per-asset PNGs the user cropped from each era's BIOME ENVIRATID
// sheet and copies them into the manifest-registered paths under
// `public/games/era-siege/v2/`. Each crop maps to ONE asset key —
// unlike unit sheets there's no grid to slice.
//
// Expected input layout:
//
//   assets/era-seige-2/biome/era<N>/
//     base-player.png       → v2/base/era<N>/player.png
//     base-enemy.png        → v2/base/era<N>/enemy.png   (or auto-flip player if missing)
//     special-primary.png   → v2/special-era<N>.png
//     special-secondary.png → v2/special-era<N>-2.png
//     floor.png             → v2/bg/era<N>/foreground.png
//     sky.png               → v2/bg/era<N>/sky.png
//     mountains-far.png     → v2/bg/era<N>/mountains-far.png
//     mountains-mid.png     → v2/bg/era<N>/mountains-mid.png
//     hp-bar.png            → v2/ui/hp-bar-era<N>.png (future slot)
//     hazard-explosion.png  → v2/vfx/explosion-era<N>.png (future slot)
//
// Any file missing in source is silently skipped — partial biome packs
// fall back to the procedural / classic asset for that slot.
//
// Run: `npm run import:era-siege-biome`

import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC  = resolve(ROOT, 'assets/era-seige-2/biome');
const OUT  = resolve(ROOT, 'public/games/era-siege/v2');

// Per-file destination mapping. {srcName: outPathRelativeToOUT}.
function destFor(eraN, srcName) {
  switch (srcName) {
    case 'base-player.png':       return `base/era${eraN}/player.png`;
    case 'base-enemy.png':        return `base/era${eraN}/enemy.png`;
    case 'special-primary.png':   return `special-era${eraN}.png`;
    case 'special-secondary.png': return `special-era${eraN}-2.png`;
    case 'floor.png':             return `bg/era${eraN}/foreground.png`;
    case 'sky.png':               return `bg/era${eraN}/sky.png`;
    case 'mountains-far.png':     return `bg/era${eraN}/mountains-far.png`;
    case 'mountains-mid.png':     return `bg/era${eraN}/mountains-mid.png`;
    case 'clouds.png':            return `bg/era${eraN}/clouds.png`;
    case 'hp-bar.png':            return `ui/hp-bar-era${eraN}.png`;
    case 'hazard.png':            return `vfx/hazard-era${eraN}.png`;
    case 'hazard-explosion.png':  return `vfx/hazard-era${eraN}.png`; // legacy alias
    default:                       return null;  // unknown — skip
  }
}

async function processEra(eraN) {
  const dir = resolve(SRC, `era${eraN}`);
  if (!existsSync(dir)) return [];
  let files;
  try { files = await readdir(dir); } catch { return []; }
  const written = [];
  for (const name of files) {
    if (!name.toLowerCase().endsWith('.png')) continue;
    const dest = destFor(eraN, name);
    if (!dest) {
      console.log(`  ? era${eraN}/${name} — unknown name, skipped (see destFor)`);
      continue;
    }
    const src = resolve(dir, name);
    const out = resolve(OUT, dest);
    await mkdir(dirname(out), { recursive: true });
    // Pipe through sharp so the PNG is re-encoded (better compression
    // and validates the file is a real PNG).
    await sharp(src).png({ compressionLevel: 9 }).toFile(out);
    console.log(`  era${eraN}/${name} → ${dest}`);
    written.push({ era: eraN, src: name, dest });
  }
  // Auto-flip base-player → base-enemy if enemy missing.
  const enemyPath = resolve(OUT, `base/era${eraN}/enemy.png`);
  const playerPath = resolve(OUT, `base/era${eraN}/player.png`);
  if (existsSync(playerPath) && !existsSync(enemyPath)) {
    await sharp(playerPath).flop().png({ compressionLevel: 9 }).toFile(enemyPath);
    console.log(`  era${eraN}/base-enemy.png (auto-flipped from player)`);
    written.push({ era: eraN, src: 'auto-flip', dest: `base/era${eraN}/enemy.png` });
  }
  return written;
}

async function main() {
  if (!existsSync(SRC)) {
    console.log(`Biome source dir not found: ${SRC}`);
    console.log('Create with: mkdir -p assets/era-seige-2/biome/era{1..5}');
    console.log('Then drop cropped PNGs in (see destFor names in this script).');
    return;
  }
  console.log(`Importing biome assets from ${SRC}\n`);
  const all = [];
  for (let n = 1; n <= 5; n++) {
    const w = await processEra(n);
    all.push(...w);
  }
  console.log(`\nDone. ${all.length} biome asset(s) imported.`);
  if (all.length === 0) {
    console.log('No PNGs found. Expected paths e.g.:');
    console.log(`  ${SRC}/era1/base-player.png`);
    console.log(`  ${SRC}/era1/special-primary.png`);
    console.log(`  ${SRC}/era3/floor.png`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
