import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1440,height:850});
await p.goto('http://localhost:5180/#/game/aow',{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^easy$/i.test(t)){await h.click();break;}}
await sleep(34000); // enemy auto-evolves to era2 at ~30s
const crop={left:1080,top:290,width:260,height:190};
const fr=[];
for(let i=0;i<2;i++){ const buf=await p.screenshot(); fr.push(await sharp(buf).extract(crop).resize(700,null,{kernel:'nearest'}).toBuffer()); await sleep(420); }
const g=sharp({create:{width:1400,height:512,channels:4,background:{r:30,g:30,b:34,alpha:1}}});
await g.composite([{input:fr[0],left:0,top:0},{input:fr[1],left:700,top:0}]).png().toFile('/tmp/pgplay-audit/es-era2.png');
await b.close(); console.log('done');
