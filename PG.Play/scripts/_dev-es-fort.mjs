import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1440,height:850});
await p.goto('http://localhost:5180/#/game/aow',{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^easy$/i.test(t)){await h.click();break;}}
await sleep(4000);
const buf=await p.screenshot();
// left (player) fortress, and right (enemy) fortress
await sharp(buf).extract({left:40,top:240,width:360,height:300}).resize(900).toFile('/tmp/pgplay-audit/aow-fort-L.png');
await sharp(buf).extract({left:1040,top:240,width:360,height:300}).resize(900).toFile('/tmp/pgplay-audit/aow-fort-R.png');
await b.close(); console.log('done');
