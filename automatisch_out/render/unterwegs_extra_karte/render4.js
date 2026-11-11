const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const dir=__dirname;const mode=process.argv[2]||'main';const only=process.argv[3]?process.argv[3].split(',').map(Number):null;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('http://127.0.0.1:8765/v4/render4.html');await p.evaluate(()=>window.ready);
const out=path.join(dir,mode==='main'?'out':'ov');fs.mkdirSync(out,{recursive:true});
const N=fs.readdirSync(path.join(dir,'fr')).length;
const list=only?only.map(t=>Math.round(t*30)):[...Array(N).keys()];
for(const i of list){const t=i/30;let jj=i;if(t>=14.0)jj=Math.min(N-1,Math.round((14.0+15.04-t)*30));const src='fr/'+String(jj+1).padStart(4,'0')+'.jpg';
 const d=await p.evaluate(([t,s,o])=>window.drawFrame(t,s,o),[t,src,mode!=='main']);
 fs.writeFileSync(path.join(out,(only?'chk_'+t.toFixed(2):String(i).padStart(4,'0'))+(mode==='main'?'.jpg':'.png')),Buffer.from(d.split(',')[1],'base64'));}
await b.close();})();
