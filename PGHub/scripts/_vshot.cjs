/* Targeted concept-viz capture. NODE_PATH=.../PG.Play/node_modules node scripts/_vshot.cjs */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const BASE = process.env.SHOT_BASE || 'http://localhost:5174';
const OUT = '/tmp/pgshots';
fs.mkdirSync(OUT, { recursive: true });

// [slug, module]
const SAMPLES = [
  ['insertion-sort-algorithm', 'sorting-strings'],
  ['kmp-deep-dive', 'strings-matching'],
  ['kosaraju-2pass', 'graphs-advanced'],
  ['palindrome-eertree', 'strings-advanced'],
  ['sparse-table-rmq', 'arrays-range-structures'],
  ['sparse-table-rmq-deep', 'arrays-range-structures'],
  ['strassen-matrix-mult', 'math-number-theory'],
  ['unicode-utf8', 'cs-tools-encodings'],
  ['snowflake-id', 'sd-storage'],
  ['slowstart-tcp', 'cs-network-protocols'],
  ['webrtc-stun-turn', 'sd-network'],
  ['sse-vs-websockets', 'sd-network'],
  ['tensor-parallel-training', 'sd-microservices'],
  ['system-design-tail-latency', 'sd-reliability'],
  ['lp-duality', 'math-number-theory'],
  ['master-theorem', 'foundations-analysis'],
];
const THEMES = ['light', 'midnight'];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new', protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const report = [];
  for (const [slug, mod] of SAMPLES) {
    for (const theme of THEMES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('pg-theme', t); } catch (e) {} }, theme);
      const route = `/#/learn/${mod}/${slug}`;
      let errs = [];
      page.on('pageerror', e => errs.push(String(e.message || e)));
      page.on('console', m => { if (m.type() === 'error') errs.push('con:' + m.text().slice(0, 140)); });
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) { console.log(`WARN ${slug}/${theme}: ${e.message}`); }
      await new Promise(r => setTimeout(r, 2600));
      // scroll the interactive "Try it yourself" block into view to force lazy-mount
      await page.evaluate(() => {
        const heads = Array.from(document.querySelectorAll('h2,h3,div,span'));
        const tgt = heads.find(h => /try it yourself|interactive viz|poke at/i.test((h.textContent || '').slice(0, 60)));
        if (tgt) tgt.scrollIntoView({ block: 'start' });
        else window.scrollTo(0, document.body.scrollHeight * 0.6);
      });
      await new Promise(r => setTimeout(r, 1600));
      const diag = await page.evaluate(() => {
        const out = {};
        out.hScroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const svgs = Array.from(document.querySelectorAll('svg'));
        out.svgCount = svgs.length;
        const rects = svgs.map(s => s.getBoundingClientRect());
        out.bigSvg = rects.filter(r => r.width > 120 && r.height > 70).length;
        out.maxSvgH = Math.round(Math.max(0, ...rects.map(r => r.height)));
        out.btns = document.querySelectorAll('button').length;
        out.ranges = document.querySelectorAll('input[type=range],input[type=number],input[type=text]').length;
        out.bodyText = (document.body.innerText || '').length;
        // detect any inner element with overflow scrollbars (forbidden)
        out.innerScroll = Array.from(document.querySelectorAll('*')).filter(e => {
          const cs = getComputedStyle(e);
          return (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'auto' || cs.overflowY === 'scroll')
            && (e.scrollWidth > e.clientWidth + 4 || e.scrollHeight > e.clientHeight + 4)
            && e.clientWidth > 80 && e.clientHeight > 40;
        }).length;
        return out;
      });
      const file = path.join(OUT, `cv-${slug}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const rec = { slug, theme, ...diag, errs: errs.slice(0, 3) };
      report.push(rec);
      console.log(JSON.stringify(rec));
      await page.close();
    }
  }
  fs.writeFileSync('/tmp/pgshots/_cv_report.json', JSON.stringify(report, null, 2));
  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
