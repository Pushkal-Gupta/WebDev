const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const BASE = process.env.SHOT_BASE || 'http://localhost:5173';
const OUT = process.env.SHOT_OUT || '/tmp/cvshots';
fs.mkdirSync(OUT, { recursive: true });

// [name, route, theme, clickText?, scrollY?]
const SHOTS = [
  ['compete',          '/#/compete',                            'light'],
  ['compete-profile',  '/#/compete',                            'light', 'User lookup'],
  ['lc-hub',           '/#/compete/leetcode',                   'light'],
  ['lc-contests',      '/#/compete/leetcode/contests',          'light'],
  ['lc-problems',      '/#/compete/leetcode/problems',          'light'],
  ['review',           '/#/review',                             'light'],
  ['lists',            '/#/lists',                              'light'],
  ['notebook',         '/#/notebook',                           'light'],
  ['progress',         '/#/progress',                           'light'],
  ['vault',            '/#/vault',                              'light'],
  ['compete-dark',     '/#/compete',                            'midnight'],
  ['progress-dark',    '/#/progress',                           'midnight'],
];

async function clickByText(page, text) {
  return page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll('a,button,[role="button"],.compete-card,.cmp-tab,.ch-tab'));
    const el = els.find((e) => (e.textContent || '').trim().toLowerCase().includes(t.toLowerCase()));
    if (el) { el.click(); return true; }
    return false;
  }, text);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new', protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  for (const [name, route, theme, clickText, scrollY] of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('pg-theme', t); } catch (e) {} }, theme);
    try { await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 }); }
    catch (e) { console.log(`WARN ${name}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 2600));
    if (clickText) { const ok = await clickByText(page, clickText); console.log(`  click "${clickText}" on ${name}: ${ok}`); await new Promise((r) => setTimeout(r, 3200)); }
    if (scrollY) { await page.evaluate((y) => { (document.scrollingElement||document.body).scrollTop = y; }, scrollY); await new Promise((r) => setTimeout(r, 800)); }
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    console.log(`shot ${name}`);
    await page.close();
  }
  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
