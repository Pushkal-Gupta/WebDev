// TEMP single-game capture. DELETE before finishing.
import puppeteer from 'puppeteer';
const id = process.argv[2];
const BASE = 'http://localhost:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ headless: 'new', args: ['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 850 });
await p.goto(`${BASE}/#/game/${id}`, { waitUntil: 'networkidle2', timeout: 20000 });
await sleep(1600);
async function click(re) {
  for (const h of await p.$$('button')) {
    const t = (await p.evaluate((e) => (e.textContent||'').replace(/\s+/g,' ').trim(), h)) || '';
    if (t.length <= 18 && !/share|locked|respawn|in place|daily|endless|challenge|\./i.test(t) && re.test(t)) { try { await h.click(); return t; } catch {} }
  }
  return null;
}
const re = /^(start|play|easy|begin|enter|vs bot|new)/i;
await click(re); await sleep(1400); await click(re); await sleep(3000);
await p.screenshot({ path: `/tmp/pgplay-audit/${id}-after.png` });
await b.close();
console.log('shot saved', `/tmp/pgplay-audit/${id}-after.png`);
