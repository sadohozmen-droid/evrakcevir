import asyncio, os, subprocess, time, json, sys
from playwright.async_api import async_playwright
NM="node_modules/"
MAP={"pdf-lib.min.js":NM+"pdf-lib/dist/pdf-lib.min.js","fontkit.umd.min.js":NM+"@pdf-lib/fontkit/dist/fontkit.umd.min.js","jszip.min.js":NM+"jszip/dist/jszip.min.js","pdf.min.js":NM+"pdfjs-dist/build/pdf.min.js","pdf.worker.min.js":NM+"pdfjs-dist/build/pdf.worker.min.js","html2canvas.min.js":NM+"html2canvas/dist/html2canvas.min.js"}
ROOT=sys.argv[1] if len(sys.argv)>1 else "site"; TAG=sys.argv[2] if len(sys.argv)>2 else "before"
PAGES=sys.argv[3].split(",") if len(sys.argv)>3 else ["/","/udf-pdf-cevirme/","/dilekce-yazma/","/e-fatura-xml-excel-aktarma/"]
os.makedirs("shots",exist_ok=True)
srv=subprocess.Popen(["python3","-m","http.server","8766","-d",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
BASE="http://localhost:8766"
JS="""() => {
 const vw=innerWidth, vh=innerHeight;
 const over=document.documentElement.scrollWidth>vw+1;
 const small=[...document.querySelectorAll('a,button,label.chip,select,input:not([type=file]):not([type=radio]):not([type=checkbox]),textarea,summary,label.check')].filter(e=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&r.height<44}).map(e=>(e.tagName+'.'+(e.className||'')+':'+(e.textContent||'').trim().slice(0,18)+'@'+Math.round(e.getBoundingClientRect().height)));
 const hdr=document.querySelector('header'); const hh=hdr?hdr.getBoundingClientRect().height:0;
 const h1=document.querySelector('h1'); const h1b=h1?h1.getBoundingClientRect().bottom:0;
 const cta=document.querySelector('.hero .btn, .tool .drop, .tool .btn'); const ctab=cta?cta.getBoundingClientRect().bottom:0;
 const nav=performance.getEntriesByType('navigation')[0];
 const res=performance.getEntriesByType('resource');
 const bytes=res.reduce((s,r)=>s+(r.encodedBodySize||r.transferSize||0),0)+(nav?nav.encodedBodySize:0);
 return {vw,over,smallCount:small.length,smallEx:small.slice(0,6),headerPct:Math.round(hh/vh*100),h1Bottom:Math.round(h1b),ctaBottom:Math.round(ctab),vh,dcl:Math.round(nav.domContentLoadedEventEnd),load:Math.round(nav.loadEventEnd),cls:+(window.__cls||0).toFixed(3),kb:Math.round(bytes/1024),fontsReq:[...document.querySelectorAll('link[href*="fonts.googleapis"]')].map(l=>(l.href.match(/family=/g)||[]).length)[0]||0};
}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    out=[]
    for w,h,mob in [(360,740,True),(390,844,True),(1280,800,False)]:
      ctx=await b.new_context(viewport={"width":w,"height":h},is_mobile=mob,has_touch=mob,device_scale_factor=2 if mob else 1)
      await ctx.add_init_script("window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});")
      for path in PAGES:
        page=await ctx.new_page()
        cdp=await ctx.new_cdp_session(page)
        await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions",{"offline":False,"latency":150,"downloadThroughput":200000,"uploadThroughput":94000})
        if mob: await cdp.send("Emulation.setCPUThrottlingRate",{"rate":4})
        async def route(r):
          u=r.request.url
          for k,v in MAP.items():
            if u.split("?")[0].endswith("/"+k): return await r.fulfill(path=v,content_type="application/javascript")
          if u.startswith(BASE): return await r.continue_()
          await r.abort()
        await page.route("**/*",route)
        await page.goto(BASE+path,wait_until="load"); await page.wait_for_timeout(600)
        m=await page.evaluate(JS); m["page"]=path; out.append(m)
        name=f"shots/{TAG}-{w}-{path.strip('/') or 'home'}.png"
        await page.screenshot(path=name,full_page=False)
        await page.close()
      await ctx.close()
    await b.close()
  for m in out: print(json.dumps(m,ensure_ascii=False))
  json.dump(out,open(f"metrics-{TAG}.json","w"),ensure_ascii=False,indent=1)
asyncio.run(main()); srv.terminate()
