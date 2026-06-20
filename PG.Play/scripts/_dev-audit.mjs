// TEMP audit harness — loads every game, captures errors + screenshots.
// DELETE before finishing (per docs/llm-wiki.md convention).
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const BASE = 'http://localhost:5180';
const OUT = '/tmp/pgplay-audit';
fs.mkdirSync(OUT, { recursive: true });

const IDS = ['fbwg','bob','badicecream','aow','vex','papa','hook','stickman-hook','g2048','cutrope','bloons','slither','happywheels','fps','grudgewood','arena','slipshot','bricklands','connect4','eightball','goalbound','basket'];

const START_RE = /^(start|play|new walk|new game|new run|easy|begin|enter|vs bot|2 player|single|quick|tap to|continue|kick off|go)/i;
const BLOCK_RE = /share|locked|respawn|in place|daily|endless|challenge|\./i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, re) {
  const handles = await page.$$('button');
  const cands = [];
  for (const h of handles) {
    const t = (await page.evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim(), h)) || '';
    if (t.length > 18 || BLOCK_RE.test(t)) continue;
    if (re.test(t)) {
      const box = await h.boundingBox();
      if (box && box.width > 0) cands.push({ h, t, len: t.length });
    }
  }
  cands.sort((a, b) => a.len - b.len);
  if (cands[0]) { try { await cands[0].h.click(); return cands[0].t; } catch {} }
  return null;
}

const report = [];
for (const id of IDS) {
  // Fresh browser per game: isolates WebGL-context crashes so one bad game
  // cannot abort the whole run (the wiki's documented failure mode).
  const entry = { id, intro: false, started: false, click: null, errors: [] };
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox','--disable-dev-shm-usage','--window-size=1460,900'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 850, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 240)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 240)));
    await page.goto(`${BASE}/#/game/${id}`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(1800);
    entry.intro = true;
    await page.screenshot({ path: `${OUT}/${id}-1intro.png` });
    const c1 = await clickByText(page, START_RE);
    await sleep(1500);
    const c2 = await clickByText(page, START_RE);
    entry.click = [c1, c2].filter(Boolean).join(' > ') || null;
    await sleep(3200);
    entry.started = !!entry.click;
    await page.screenshot({ path: `${OUT}/${id}-2game.png` });
    entry.errors.push(...[...new Set(errors)].filter((e) => !/leaderboard|422|favicon/i.test(e)));
  } catch (e) {
    entry.errors.push('HARNESS: ' + String(e).slice(0, 160));
  } finally {
    try { await browser?.close(); } catch {}
  }
  report.push(entry);
  console.log(`${id.padEnd(14)} intro=${entry.intro?'Y':'N'} click=${(entry.click||'-').padEnd(18)} err=${entry.errors.length}`);
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
}

console.log('\n=== GAMES WITH ERRORS ===');
for (const r of report) if (r.errors.length) console.log(`\n[${r.id}]\n  ${r.errors.join('\n  ')}`);
console.log('\nDone. Screenshots + report.json in', OUT);
