/* Confirm the 3 polish fixes. */
const puppeteer = require('puppeteer');
const fs = require('fs'); const path = require('path');
const BASE = process.env.SHOT_BASE || 'http://localhost:5173'; const OUT = '/tmp/pgshots';
fs.mkdirSync(OUT, { recursive: true });
const SHOTS = [
  ['fix-progress',     '/#/progress'],
  ['fix-lesson-toc',   '/#/ml/foundations/matrices'],
  ['fix-achievements', '/#/achievements'],
];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', protocolTimeout: 120000, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  for (const [name, route] of SHOTS) {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    try { await p.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 }); }
    catch (e) { console.log(`WARN ${name}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 1800));
    await p.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`shot ${name}`);
    await p.close();
  }
  await b.close(); console.log('DONE');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
