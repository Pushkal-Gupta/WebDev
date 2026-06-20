const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:5174/#/ml/foundations', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const out = await p.evaluate(() => {
    const card = document.querySelector('.mlhub-lesson-card');
    if (!card) return { error: 'no .mlhub-lesson-card found', anyPillar: !!document.querySelector('.mlhub-pillar'), bodyText: document.body.innerText.slice(0, 200) };
    const thumb = card.querySelector('.mlhub-lesson-thumb');
    const title = card.querySelector('.mlhub-lesson-title');
    const cs = (el) => el ? getComputedStyle(el) : null;
    return {
      cardH: card.clientHeight,
      cardPadding: cs(card).padding,
      cardDisplay: cs(card).display,
      thumbExists: !!thumb,
      thumbH: thumb ? thumb.clientHeight : null,
      thumbChildTag: thumb && thumb.firstElementChild ? thumb.firstElementChild.tagName : null,
      titleExists: !!title,
      titleText: title ? title.textContent : null,
      titleH: title ? title.clientHeight : null,
      titleColor: title ? cs(title).color : null,
      titleDisplay: title ? cs(title).display : null,
      cardCount: document.querySelectorAll('.mlhub-lesson-card').length,
    };
  });
  console.log(JSON.stringify(out, null, 2));
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
