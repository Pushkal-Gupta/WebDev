// PG.Play deploy helper.
//
// Runs the full prebuild gauntlet (catalog validation + vitest + vite),
// summarizes the dist/ delta vs HEAD, and prints the exact commit + push
// commands. Does NOT commit or push on its own — that's a human's call.
//
// Usage:
//   npm run deploy
//
// Why a script: the deploy URL is pushkalgupta.com/PG.Play/dist/, served
// by GitHub Pages from the repo's dist/ subdirectory. So a deploy is
// simply: build → commit dist/ → push. This wraps the verification.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const sh = (cmd, opts = {}) => execSync(cmd, { cwd: root, stdio: 'pipe', ...opts }).toString().trim();
const sh_run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });

console.log('▸ verifying catalog…');
sh_run('npm run validate:catalog');

console.log('▸ running tests…');
sh_run('npm run test');

console.log('▸ building…');
sh_run('npm run -s build');

// Summarize what changed in dist/.
let distChanges = '';
try {
  distChanges = sh('git status --porcelain dist/').trim();
} catch { /* not in a git repo? skip */ }

const distChangedLines = distChanges ? distChanges.split('\n').length : 0;

let srcChanges = '';
try {
  srcChanges = sh('git status --porcelain -- ":(exclude)dist"').trim();
} catch { /* not a git repo */ }

console.log('');
console.log('═══════════════════════════════════════════════');
console.log(' PG.Play build ok');
console.log('═══════════════════════════════════════════════');
console.log('');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
console.log(`  version       ${pkg.version}`);
console.log(`  dist changes  ${distChangedLines || 'none'}`);
console.log(`  src changes   ${srcChanges ? srcChanges.split('\n').length + ' files' : 'none'}`);
console.log('');

if (!distChanges && !srcChanges) {
  console.log('  Nothing to deploy — working tree is clean against HEAD.');
  console.log('');
  process.exit(0);
}

console.log('  Suggested commands (review and run yourself):');
console.log('');
if (srcChanges) {
  console.log('    git add -A');
} else {
  console.log('    git add dist/');
}
console.log(`    git commit -m "deploy: PG.Play build $(date +%Y-%m-%d)"`);
console.log('    git push origin main');
console.log('');
console.log('  Live at:   https://pushkalgupta.com/PG.Play/dist/');
console.log('');
