/* Verify the Settings -> Profile ShareableCard fits its modal container (no clip /
   no overflow) after the min-width:0 + margin fix. Loads the REAL bundled CSS from
   the running preview, injects the exact container chain used in the modal, runs the
   real fit() scaling logic, and measures overflow at desktop/tablet/phone widths. */
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.SHOT_BASE || 'http://localhost:4173';
const OUT = '/tmp/pgshots-profilecard';
fs.mkdirSync(OUT, { recursive: true });

// Modal inner widths to test (matches real settings-body content width at each device).
const CASES = [
  ['desktop-modal-836', 836],   // 900px modal - 2*32 padding
  ['tablet-modal-620', 620],
  ['phone-modal-311', 311],     // 375px phone - modal/padding
  ['phone-modal-280', 280],     // very narrow
];

// The card's real inner DOM (grid areas filled) so it takes realistic height.
const CARD_HTML = `
<div class="sc-card" style="--easy-h:142;--med-h:45;--hard-h:0">
  <div class="sc-card-bg"></div>
  <div class="sc-card-head">
    <div class="sc-avatar">P</div>
    <div><div class="sc-name">Pushkal Gupta</div><div class="sc-handle">@pushkal</div></div>
    <div class="sc-streak-chip"><div><div class="sc-streak-num">7</div><div class="sc-streak-label">day streak</div></div></div>
  </div>
  <div class="sc-big"><div class="sc-big-num">2</div><div class="sc-big-sub">of 3,788 problems solved</div></div>
  <div class="sc-diff"><div class="sc-eyebrow">Difficulty</div>
    <div class="sc-diff-row"><span class="sc-diff-label">Easy</span><div class="sc-diff-track"><div class="sc-diff-fill sc-diff-easy" style="width:100%"></div></div><span class="sc-diff-num">1</span></div>
    <div class="sc-diff-row"><span class="sc-diff-label">Medium</span><div class="sc-diff-track"><div class="sc-diff-fill sc-diff-medium" style="width:100%"></div></div><span class="sc-diff-num">1</span></div>
    <div class="sc-diff-row"><span class="sc-diff-label">Hard</span><div class="sc-diff-track"><div class="sc-diff-fill sc-diff-hard" style="width:4%"></div></div><span class="sc-diff-num">0</span></div>
  </div>
  <div class="sc-topics"><div class="sc-eyebrow">Top Topics</div><div class="sc-chip-grid">
    <div class="sc-chip"><span class="sc-chip-label">Two Pointers</span><span class="sc-chip-count">1</span></div>
    <div class="sc-chip"><span class="sc-chip-label">Arrays &amp; HashMaps</span><span class="sc-chip-count">1</span></div>
  </div></div>
  <div class="sc-learn"><div class="sc-eyebrow">Learning</div><div class="sc-mini-row">
    <div class="sc-mini"><div class="sc-mini-num">0</div><div class="sc-mini-label">concepts mastered</div></div>
    <div class="sc-mini"><div class="sc-mini-num">0</div><div class="sc-mini-label">lessons opened</div></div>
    <div class="sc-mini"><div class="sc-mini-num">0</div><div class="sc-mini-label">achievements</div></div>
  </div></div>
  <div class="sc-github"><div class="sc-eyebrow">GitHub &middot; @Pushkal-Gupta</div><div class="sc-gh-row"><div class="sc-gh-stats">
    <div class="sc-gh-stat"><strong>13</strong><span>repos</span></div>
    <div class="sc-gh-stat"><strong>5</strong><span>stars</span></div>
    <div class="sc-gh-stat"><strong>0</strong><span>followers</span></div>
    <div class="sc-gh-stat"><strong>0</strong><span>following</span></div>
  </div></div></div>
  <div class="sc-foot"><span class="sc-date">August 17, 2026</span><div class="sc-brand"><span>PG Hub</span></div></div>
</div>`;

(async () => {
  const puppeteer = (await import('file://' + require.resolve('puppeteer-core'))).default;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1200, deviceScaleFactor: 1 });
  // Load the real app so its bundled CSS (with .sc-* + theme tokens) is in <head>.
  await page.goto(BASE + '/index.html#/', { waitUntil: 'networkidle2', timeout: 30000 });

  for (const [name, w] of CASES) {
    const res = await page.evaluate((modalW, cardHtml) => {
      document.body.innerHTML = `
        <div class="settings-body" style="width:${modalW}px;padding:0;background:#0b1010">
          <div class="profile-section"><div class="profile-card-block">
            <div class="sc-embed">
              <div class="sc-preview-wrap">${cardHtml}</div>
              <div class="sc-actions">
                <button class="sc-btn sc-btn-primary">Download PNG</button>
                <button class="sc-btn">Copy share link</button>
                <button class="sc-btn">Share on LinkedIn</button>
                <button class="sc-btn">Share on X</button>
              </div>
            </div>
          </div></div>
        </div>`;
      // Run the REAL fit() logic (mirrors ShareableCard.jsx useLayoutEffect).
      const card = document.querySelector('.sc-card');
      const wrap = card.parentElement;
      const avail = wrap.clientWidth;
      const s = Math.min(1, avail / 1200);
      card.style.setProperty('--sc-scale', s);
      card.style.marginBottom = `${-820 * (1 - s)}px`;
      card.style.marginLeft = '0'; card.style.marginRight = '0';
      // Measure: does any visible content escape the container horizontally?
      const cont = document.querySelector('.settings-body').getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const body = document.body.getBoundingClientRect();
      return {
        scale: Number(s.toFixed(3)), availWidth: avail,
        containerW: Math.round(cont.width),
        cardVisibleLeft: Math.round(cr.left - cont.left),
        cardVisibleRight: Math.round(cont.right - cr.right),
        cardVisualW: Math.round(cr.width),
        pageScrollW: Math.round(document.documentElement.scrollWidth),
        pageClientW: Math.round(document.documentElement.clientWidth),
        overflowsLeft: cr.left < cont.left - 1,
        overflowsRight: cr.right > cont.right + 1,
      };
    }, w, CARD_HTML);
    await page.setViewport({ width: Math.max(w + 40, 360), height: 1000, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 150));
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    const ok = !res.overflowsLeft && !res.overflowsRight && res.pageScrollW <= res.pageClientW + 1;
    console.log(`[${name}] modal=${res.containerW}px scale=${res.scale} cardVisualW=${res.cardVisualW} ` +
      `gapL=${res.cardVisibleLeft} gapR=${res.cardVisibleRight} ` +
      `overflowL=${res.overflowsLeft} overflowR=${res.overflowsRight} -> ${ok ? 'PASS' : 'FAIL'}`);
  }
  await browser.close();
  console.log('\nshots ->', OUT);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
