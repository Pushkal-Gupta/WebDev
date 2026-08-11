/* Multi-viewport capture of the Compete hub to verify responsive/uniform layout.
   Usage: NODE_PATH=/Users/pushkalgupta/Desktop/WebDev/PG.Play/node_modules \
          SHOT_BASE=http://localhost:4173 node scripts/_shot-compete.cjs */
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.SHOT_BASE || 'http://localhost:4173';
const OUT = '/tmp/pgshots-compete';
fs.mkdirSync(OUT, { recursive: true });

// [name, width, height]
const VIEWPORTS = [
  ['small-1024x600', 1024, 600],   // netbook / very short laptop
  ['small-1152x720', 1152, 720],
  ['laptop-1280x720', 1280, 720],
  ['laptop-1366x768', 1366, 768],  // most common small laptop
  ['ipad-land-1024x768', 1024, 768],
  ['desktop-1600x900', 1600, 900],
];

(async () => {
  const puppeteer = (await import('file://' + require.resolve('puppeteer-core'))).default;
  const browser = await puppeteer.launch({
    headless: 'new', protocolTimeout: 120000, executablePath: CHROME,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  for (const [name, w, h] of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('pg-theme', 'light'); } catch (e) {} });
    try { await page.goto(BASE + '/#/compete', { waitUntil: 'networkidle2', timeout: 30000 }); }
    catch (e) { console.log(`WARN ${name}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 2000));
    // measure card widths per group to prove uniformity
    const dims = await page.evaluate(() => {
      const groups = [...document.querySelectorAll('.compete-group')];
      return groups.map((g) => {
        const cards = [...g.querySelectorAll('.compete-card')];
        const ws = cards.map((c) => Math.round(c.getBoundingClientRect().width));
        return { title: g.querySelector('.compete-group-title')?.textContent, count: cards.length, widths: ws };
      });
    });
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    console.log(`\n[${name}] ${w}x${h}`);
    for (const g of dims) console.log(`  ${g.title}: ${g.count} cards, widths=${JSON.stringify(g.widths)}`);
    await page.close();
  }
  await browser.close();
  console.log('\nDONE ->', OUT);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
