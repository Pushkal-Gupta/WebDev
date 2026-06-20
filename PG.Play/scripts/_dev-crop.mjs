import puppeteer from 'puppeteer';
import sharp from 'sharp';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const id=process.argv[2]||'bloons';
const b=await puppeteer.launch({headless:'new',args:['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1440,height:850});
await p.goto(`http://localhost:5180/#/game/${id}`,{waitUntil:'networkidle2',timeout:20000});
await sleep(1500);
for(const h of await p.$$('button')){const t=(await p.evaluate(e=>(e.textContent||'').trim(),h))||''; if(/^(start|easy|play)$/i.test(t)){await h.click();break;}}
await sleep(3500);
const info=await p.evaluate(()=>{const w=window.__bloons3d; if(!w)return{no:1}; let pathMeshes=0,total=0; w.scene.traverse(o=>{total++; if(o.geometry&&o.geometry.attributes&&o.geometry.attributes.position&&o.material&&o.material.color&&Math.abs(o.material.color.r-0.776)<0.1)pathMeshes++;}); return{total,pathMeshes,camY:Math.round(w.camera.position.y),camPos:[w.camera.position.x|0,w.camera.position.y|0,w.camera.position.z|0]};});
console.log('INFO',JSON.stringify(info));
const buf=await p.screenshot();
await sharp(buf).extract({left:380,top:120,width:680,height:320}).resize(1360).toFile('/tmp/pgplay-audit/bloons-crop.png');
await b.close(); console.log('done');
