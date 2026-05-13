import sharp from 'sharp';

const path = '/Users/pushkalgupta/Desktop/WebDev/PG.Play/assets/era-seige-2/12.png';
const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

function isMagenta(r, g, b) { return r >= 110 && g <= 70 && b >= 100; }
const rowMag = new Uint32Array(h);
for (let y = 0; y < h; y++) {
  let c = 0;
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (isMagenta(data[i], data[i+1], data[i+2])) c++;
  }
  rowMag[y] = c;
}
console.log(`Image: ${w}x${h}`);
console.log(`row magenta % at every 50 px:`);
for (let y = 0; y < h; y += 50) {
  const pct = (rowMag[y] / w * 100).toFixed(0);
  console.log(`  y=${y}: ${rowMag[y]} (${pct}%)`);
}
// Show transitions: where does rowMag dip below threshold?
console.log(`\nTransitions (rowMag < 50):`);
const ACTIVE = 50;
let inActive = false, y0 = 0;
const lowRuns = [];
for (let y = 0; y < h; y++) {
  const isHigh = rowMag[y] >= ACTIVE;
  if (!isHigh && !inActive) continue;
  if (isHigh && !inActive) { inActive = true; }
  if (!isHigh && inActive) { lowRuns.push([y]); inActive = false; }
}
// Just show all low-band runs
let inLow = false;
let ly0 = 0;
const allLows = [];
for (let y = 0; y < h; y++) {
  const m = rowMag[y] < ACTIVE;
  if (m && !inLow) { ly0 = y; inLow = true; }
  if (!m && inLow) { allLows.push([ly0, y-1]); inLow = false; }
}
if (inLow) allLows.push([ly0, h-1]);
for (const [a, b] of allLows) {
  console.log(`  low y=${a}..${b} (${b-a+1}px)`);
}
