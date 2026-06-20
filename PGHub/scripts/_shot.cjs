/* Headless capture harness — drives PG.Play's puppeteer over PGcode dev server.
   Usage: NODE_PATH=/Users/pushkalgupta/Desktop/WebDev/PG.Play/node_modules node scripts/_shot.cjs */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SHOT_BASE || 'http://localhost:5174';
const OUT = '/tmp/pgshots';
fs.mkdirSync(OUT, { recursive: true });

// [name, route, theme, clickText?, scrollY?]
const SHOTS = [
  ['prob-solve',      '/#/ml/problems/softmax-classifier', 'light'],
  ['conv-explorer',   '/#/ml/foundations/tensor-contraction', 'light', null, 1700],
  ['xent-lesson',     '/#/ml/foundations/cross-entropy', 'light'],
  ['compete-profile', '/#/compete',                 'light', 'User lookup'],
  ['compete-analytics','/#/compete',                'light', 'Analytics'],
  ['ml-cuda',         '/#/ml/cuda',                 'light'],
  ['ml-lesson-code',  '/#/ml/foundations/matrices', 'light', null, 2200],
  ['concept',         '/#/learn/graphs-shortest-paths/a-star-search', 'light'],
  ['concept-dark',    '/#/learn/graphs-shortest-paths/a-star-search', 'midnight'],
  ['ml-group',        '/#/ml/g/foundations',               'light'],
  ['notebook',        '/#/notebook',                'light'],
  ['paper-detail',    '/#/ml/papers',               'light', null, 1500],
  ['ml-papers-dark',  '/#/ml/papers',               'midnight'],
  ['ml-roadmaps',     '/#/ml/roadmaps',             'light'],
  ['ml-projects',     '/#/ml/projects',             'light'],
  ['ml-math',         '/#/ml/math',                 'light'],
  ['ml-studyplans',   '/#/ml/study-plans',          'light'],
  ['ml-sheets',       '/#/ml/sheets',               'light'],
  ['learning',        '/#/learning',                'light'],
  ['ml-hub',          '/#/ml',                      'light'],
  ['ml-foundations',  '/#/ml/foundations',          'light'],
  ['ml-lesson',       '/#/ml/foundations/matrices', 'light'],
  ['ml-papers',       '/#/ml/papers',               'light'],
  ['compete',         '/#/compete',                 'light'],
  ['compete-charts',  '/#/compete',                 'light', 'Analytics'],
  ['companies',       '/#/companies',               'light'],
  ['practice',        '/#/practice',                'light'],
  ['sql',             '/#/playground/sql',          'light'],
  ['contests',        '/#/contests',                'light'],
  ['courses',         '/#/courses',                 'light'],
  ['concepts',        '/#/learn',                   'light'],
  ['vault',           '/#/vault',                   'light'],
  ['achievements',    '/#/achievements',            'light'],
  ['progress',        '/#/progress',                'light'],
  ['lists',           '/#/lists',                   'light'],
  ['ml-lesson-dark',  '/#/ml/foundations/matrices', 'midnight'],
  ['compete-dark',    '/#/compete',                 'midnight'],
  ['learning-dark',   '/#/learning',                'midnight'],
  ['ml-foundations-dark', '/#/ml/foundations',      'midnight'],
];

async function clickByText(page, text) {
  const clicked = await page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll('a,button,[role="button"],.compete-card,.cmp-tab,.ch-tab'));
    const el = els.find((e) => (e.textContent || '').trim().toLowerCase().includes(t.toLowerCase()));
    if (el) { el.click(); return true; }
    return false;
  }, text);
  return clicked;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  for (const [name, route, theme, clickText, scrollY] of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    // freeze continuous SVG animations so captureScreenshot doesn't hang on a busy compositor
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('pg-theme', t); } catch (e) {} }, theme);
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) { console.log(`WARN ${name}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 2400));
    if (clickText) {
      const ok = await clickByText(page, clickText);
      console.log(`  click "${clickText}" on ${name}: ${ok}`);
      await new Promise((r) => setTimeout(r, 2200));
    }
    if (scrollY) {
      await page.evaluate((y) => {
        const sc = document.querySelector('.ml-lesson') || document.scrollingElement || document.body;
        sc.scrollTop = y;
      }, scrollY);
      await new Promise((r) => setTimeout(r, 800));
    }
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`shot ${name}`);
    await page.close();
  }
  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
