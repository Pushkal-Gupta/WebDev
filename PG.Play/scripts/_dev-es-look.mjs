import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:1440,height:850,deviceScaleFactor:1});
await p.goto('http://localhost:5180/#/game/aow',{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^easy$/i.test(t)){await h.click();break;}}
await sleep(9000); // let units march to mid-lane and clash
const buf=await p.screenshot();
// tight central crop, big enlarge to inspect model detail
await sharp(buf).extract({left:500,top:300,width:460,height:230}).resize(1440,null,{kernel:'nearest'}).toFile('/tmp/pgplay-audit/aow-tight.png');
await b.close();
console.log('done');
