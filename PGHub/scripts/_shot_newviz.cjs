const puppeteer = require('puppeteer');
const fs = require('fs'); const path = require('path');
const BASE = process.env.SHOT_BASE || 'http://localhost:5173';
const OUT = '/tmp/newviz'; fs.mkdirSync(OUT, { recursive: true });
const SLUGS = ['insertion-sort-algorithm','master-theorem','meet-in-the-middle','solid-principles',
'quadtree-spatial','sparse-table-rmq','regex-engine-build','webhooks-design','snowflake-id',
'redis-data-structures','sse-vs-websockets','tensor-parallel-training','protocol-buffers',
'unicode-utf8','web-vitals-lcp-cls-inp','pipeline-parallel-training','mixed-precision-training',
'queue-using-stacks','t-digest-percentiles','spanner-truetime'];
(async () => {
  const browser = await puppeteer.launch({ headless:'new', protocolTimeout:120000,
    args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] });
  const report = [];
  for (const slug of SLUGS) {
    const page = await browser.newPage();
    await page.setViewport({ width:1440, height:900, deviceScaleFactor:1 });
    await page.emulateMediaFeatures([{ name:'prefers-reduced-motion', value:'reduce' }]);
    const errors = [];
    page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,120)); });
    page.on('pageerror', e => errors.push('PAGEERR '+e.message.slice(0,120)));
    try { await page.goto(`${BASE}/#/visualize/${slug}`, { waitUntil:'networkidle2', timeout:30000 }); }
    catch(e){ report.push(`${slug}: NAV-FAIL ${e.message.slice(0,60)}`); await page.close(); continue; }
    await new Promise(r=>setTimeout(r,1500));
    // scroll to bring the rich interactive viz into view (it sits below the frame walkthrough)
    await page.evaluate(()=>{ const el=[...document.querySelectorAll('h3')].find(h=>true); document.scrollingElement.scrollTop=900; });
    await new Promise(r=>setTimeout(r,1400));
    // measure: count svgs with non-zero area on the page
    const stats = await page.evaluate(()=>{
      const svgs=[...document.querySelectorAll('svg')];
      const sized=svgs.filter(s=>{const r=s.getBoundingClientRect();return r.width>50&&r.height>50;});
      const buttons=document.querySelectorAll('button').length;
      const rawLatex=(document.body.innerText.match(/\\[a-zA-Z]+\{|\\\(|\\\[/g)||[]).length;
      return { svgCount:svgs.length, sizedSvg:sized.length, buttons, rawLatex };
    });
    await page.screenshot({ path: path.join(OUT, `${slug}.png`) });
    report.push(`${slug}: svg=${stats.sizedSvg}/${stats.svgCount} btns=${stats.buttons} rawLatex=${stats.rawLatex} err=${errors.length}${errors.length?(' :: '+errors[0]):''}`);
    await page.close();
  }
  await browser.close();
  console.log(report.join('\n'));
})().catch(e=>{ console.error('FATAL',e); process.exit(1); });
