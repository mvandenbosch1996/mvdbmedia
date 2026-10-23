import fs from "node:fs";
import puppeteer from "puppeteer";
for (const f of ["portfolio.html","webdesignopmaat.html"]) {
  const html = fs.readFileSync(f,"utf8");
  const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let ok=0;
  for (const [,b] of blocks){ try{ const j=JSON.parse(b); ok++; if(j["@type"]==="SoftwareApplication") console.log(f,"SoftwareApplication OK, creator",JSON.stringify(j.creator)); }catch(e){ console.log(f,"INVALID JSON-LD:",e.message);} }
  console.log(f,`${ok}/${blocks.length} JSON-LD blocks valid`);
}
const b=await puppeteer.launch({headless:true});
for (const [w,h,label] of [[1440,900,"desktop"],[390,844,"mobile"]]) {
  for (const [f,sel,shot] of [["portfolio.html","a.proj-card[data-cat=web]","p"],["webdesignopmaat.html","#voorbeeld",""]]) {
    const p=await b.newPage(); await p.setViewport({width:w,height:h});
    await p.goto("http://localhost:3000/"+f,{waitUntil:"networkidle2"});
    await p.evaluate(()=>document.querySelectorAll(".scroll-reveal").forEach(e=>e.classList.add("visible","is-visible","revealed")));
    const el=await p.$(sel); await el.scrollIntoView(); await new Promise(r=>setTimeout(r,1200));
    const m=await p.evaluate((sel)=>{const e=document.querySelector(sel);const img=e.querySelector("img");return{docW:document.documentElement.scrollWidth,vw:innerWidth,imgLoaded:img.complete&&img.naturalWidth>0,nat:img.naturalWidth+"x"+img.naturalHeight,box:Math.round(img.getBoundingClientRect().width)+"x"+Math.round(img.getBoundingClientRect().height),cur:img.currentSrc.split("/").pop()}},sel);
    console.log(f,label,JSON.stringify(m), m.docW>m.vw?"OVERFLOW":"no-overflow");
    await el.screenshot({path:`temporary screenshots/kampr-${f.split(".")[0]}-${label}.png`});
    await p.close();
  }
}
await b.close();
