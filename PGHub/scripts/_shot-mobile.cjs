/* Capture key routes at phone/tablet widths in the (now lightened) default dark theme
   to verify the theme lift and hunt mobile layout bugs on Compete + its sub-views. */
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.SHOT_BASE || 'http://localhost:4173';
const OUT = '/tmp/pgshots-mobile';
fs.mkdirSync(OUT, { recursive: true });

// [name, route, width, height, clickSelector?]
const SHOTS = [
  ['compete-phone-390', '/compete', 390, 844],
  ['compete-tablet-768', '/compete', 768, 1024],
  ['compete-analytics-phone', '/compete/leetcode/problems', 390, 844],
  ['compete-calendar-phone', '/compete/competitions', 390, 844],
  ['home-phone-390', '/', 390, 844],
  ['home-desktop-1440', '/', 1440, 900],
];

(async () => {
  const puppeteer = (await import('file://' + require.resolve('puppeteer-core'))).default;
  const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 120000, executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  for (const [name, route, w, h] of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    // default theme is dark (no localStorage set) — that's what we want to verify.
    try { await page.goto(BASE + '/index.html#' + route, { waitUntil: 'networkidle2', timeout: 30000 }); }
    catch (e) { console.log(`WARN ${name}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 2200));
    // horizontal-overflow probe (the app must never scroll sideways)
    const probe = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    console.log(`[${name}] ${w}x${h} scrollW=${probe.scrollW} clientW=${probe.clientW} H-OVERFLOW=${probe.overflow ? 'YES (BUG)' : 'no'}`);
    await page.close();
  }
  await browser.close();
  console.log('\nshots ->', OUT);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
