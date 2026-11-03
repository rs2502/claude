const {chromium}=require('playwright');const PAGE=process.env.PAGE||'reel.html',W=+(process.env.W||1920),H=+(process.env.H||1080);const fs=require('fs');const path=require('path');
(async()=>{
  const [,,out,fps,...times]=process.argv;
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
  await p.goto('file://'+path.resolve(__dirname,PAGE));await p.waitForFunction('window.READY');
  fs.mkdirSync(out,{recursive:true});
  let list=times.length?times.map(Number):[...Array(15*Number(fps)).keys()].map(i=>i/Number(fps));
  for(let i=0;i<list.length;i++){
    await p.evaluate(t=>render(t),list[i]);
    await p.screenshot({path:path.join(out,times.length?`t_${list[i].toFixed(2)}.png`:`f_${String(i).padStart(4,'0')}.png`)});
  }
  await b.close();
})();
