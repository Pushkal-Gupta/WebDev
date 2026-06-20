import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:1440,height:850});
await p.goto('http://localhost:5180/#/game/aow',{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^easy$/i.test(t)){await h.click();break;}}
await sleep(4500);
const buf=await p.screenshot();
await sharp(buf).extract({left:80,top:300,width:1280,height:320}).resize(1440).toFile('/tmp/pgplay-audit/aow-wide.png');
await b.close(); console.log('done');
