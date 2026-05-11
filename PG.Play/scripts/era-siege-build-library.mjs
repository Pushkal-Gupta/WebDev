#!/usr/bin/env node
// Builds a semantic-named reference folder at assets/era-siege/library/
// so the user can find any sheet by its purpose (e.g. era3-ranged.png)
// instead of remembering the numeric try4/N.png filename.
//
// Reads the manifest, then copies every non-skip source to library/
// with a name like:
//   era<N>-<role>.png         for unit/turret
//   era<N>-base.png           for base
//   era<N>-bg-<id>.png        for backgrounds
//   projectile-<id>.png       for projectiles
//   vfx-<id>.png              for vfx
//
// Skipped sources also get a `library/_alts/` entry so nothing is lost.

import { readFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const ADV = resolve(ROOT, 'assets/era-siege/advanced');
const LIB = resolve(ROOT, 'assets/era-siege/library');
const ALTS = join(LIB, '_alts');

if (existsSync(LIB)) rmSync(LIB, { recursive: true });
mkdirSync(LIB, { recursive: true });
mkdirSync(ALTS, { recursive: true });

const manifest = JSON.parse(readFileSync(join(ADV, 'manifest.json'), 'utf-8'));

const written = [];
const skipped = [];

for (const e of manifest.entries) {
  const src = join(ADV, e.src);
  if (!existsSync(src)) continue;
  if (e.kind === 'skip') {
    const dst = join(ALTS, e.src.replace('/', '__'));
    copyFileSync(src, dst);
    skipped.push(e.src);
    continue;
  }
  let name = '';
  if (e.kind === 'unit')        name = `era${e.era}-${e.role}.png`;
  else if (e.kind === 'turret') name = `era${e.era}-turret-${e.role}.png`;
  else if (e.kind === 'base')   name = `era${e.era}-base.png`;
  else if (e.kind === 'bg')     name = `era${e.era}-bg-${e.id}.png`;
  else if (e.kind === 'projectile') name = `projectile-${e.id}.png`;
  else if (e.kind === 'vfx')    name = `vfx-${e.id}.png`;
  else continue;
  const dst = join(LIB, name);
  copyFileSync(src, dst);
  written.push(`${name}  ←  ${e.src}`);
}

const missingMd = `# Era Siege library

Built by \`scripts/era-siege-build-library.mjs\` from the manifest at
\`assets/era-siege/advanced/manifest.json\`. Do not edit files in here
by hand — re-run the script if you change the manifest or add sheets.

- ${written.length} sheets named semantically
- ${skipped.length} alternates kept in \`_alts/\`
`;
import('node:fs').then(({ writeFileSync }) => {
  writeFileSync(join(LIB, 'README.md'), missingMd);
});

console.log(`Library built at ${LIB}`);
console.log(`  named:    ${written.length}`);
console.log(`  alts:     ${skipped.length}`);
