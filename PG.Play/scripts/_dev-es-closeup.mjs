import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1440,height:850});
await p.goto('http://localhost:5180/#/game/aow',{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^easy$/i.test(t)){await h.click();break;}}
await sleep(2600);
// 3 tight frames over time at the right fortress exit where a unit spawns+marches
const crop={left:1120,top:300,width:200,height:170};
const fr=[];
for(let i=0;i<3;i++){ const buf=await p.screenshot(); fr.push(await sharp(buf).extract(crop).resize(560,null,{kernel:'nearest'}).toBuffer()); await sleep(360); }
const g=sharp({create:{width:560*3,height:476,channels:4,background:{r:30,g:30,b:34,alpha:1}}});
await g.composite([{input:fr[0],left:0,top:0},{input:fr[1],left:560,top:0},{input:fr[2],left:1120,top:0}]).png().toFile('/tmp/pgplay-audit/es-closeup.png');
await b.close(); console.log('done');
