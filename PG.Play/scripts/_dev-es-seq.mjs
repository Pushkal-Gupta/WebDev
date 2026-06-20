import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1440,height:850});
await p.goto('http://localhost:5180/#/game/aow',{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^easy$/i.test(t)){await h.click();break;}}
await sleep(3000);
// crop region in front of the enemy (right) fortress where units march through
const crop={left:980,top:300,width:420,height:230};
const frames=[];
for(let i=0;i<4;i++){
  const buf=await p.screenshot();
  frames.push(await sharp(buf).extract(crop).resize(640).toBuffer());
  await sleep(420);
}
// 2x2 grid
const g=sharp({create:{width:1280,height:700,channels:4,background:{r:20,g:20,b:24,alpha:1}}});
await g.composite([
  {input:frames[0],left:0,top:0},{input:frames[1],left:640,top:0},
  {input:frames[2],left:0,top:350},{input:frames[3],left:640,top:350},
]).png().toFile('/tmp/pgplay-audit/es-seq.png');
await b.close(); console.log('done');
