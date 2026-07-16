const puppeteer = require('puppeteer');
const fs = require('fs'); fs.mkdirSync('/tmp/pgm', { recursive: true });
const BASE = process.env.SHOT_BASE || 'http://localhost:4173';
setTimeout(() => process.exit(2), 150000);
const ROUTES = [
  ['home','/#/'], ['practice','/#/practice'], ['learn','/#/learn'],
  ['ml','/#/ml'], ['compete','/#/compete'], ['lc','/#/compete/leetcode'],
  ['roadmap','/#/roadmap'], ['companies','/#/companies'], ['vault','/#/vault'],
];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const [name, route] of ROUTES) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await p.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    // detect horizontal overflow of any element past the viewport
    const overflow = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth; let worst = 0, tag = '';
      document.querySelectorAll('*').forEach(el => { const r = el.getBoundingClientRect(); if (r.right > vw + 1 && r.width < 2000) { if (r.right - vw > worst) { worst = r.right - vw; tag = el.className && typeof el.className==='string' ? el.className.split(' ')[0] : el.tagName; } } });
      return { worst: Math.round(worst), tag, vw };
    }).catch(() => ({}));
    await p.screenshot({ path: `/tmp/pgm/${name}.png` }).catch(() => {});
    console.log(`${name.padEnd(11)} overflow=${overflow.worst||0}px ${overflow.tag||''}`);
    await p.close();
  }
  await b.close(); process.exit(0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
