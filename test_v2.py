import asyncio, os, subprocess, time
from playwright.async_api import async_playwright
NM="node_modules/"
MAP={"pdf-lib.min.js":NM+"pdf-lib/dist/pdf-lib.min.js","fontkit.umd.min.js":NM+"@pdf-lib/fontkit/dist/fontkit.umd.min.js","jszip.min.js":NM+"jszip/dist/jszip.min.js","pdf.min.js":NM+"pdfjs-dist/build/pdf.min.js","pdf.worker.min.js":NM+"pdfjs-dist/build/pdf.worker.min.js","html2canvas.min.js":NM+"html2canvas/dist/html2canvas.min.js"}
srv=subprocess.Popen(["python3","-m","http.server","8767","-d","site"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
B="http://localhost:8767"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(accept_downloads=True); pg=await ctx.new_page()
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    async def route(r):
      u=r.request.url
      for k,v in MAP.items():
        if u.split("?")[0].endswith("/"+k): return await r.fulfill(path=v,content_type="application/javascript")
      if u.startswith(B): return await r.continue_()
      await r.abort()
    await pg.route("**/*",route)
    async def wait_done(tool):
      await pg.wait_for_function(f"document.querySelector('#b-{tool}').disabled===false && document.querySelector('#s-{tool}').textContent && !/…$/.test(document.querySelector('#s-{tool}').textContent)",timeout=120000)
      return (await pg.text_content(f"#s-{tool}"))+" | "+(await pg.inner_text(f"#r-{tool}")).replace("\n"," ")
    # 1) ana sayfadan UDF seç -> seçim kutusu -> UDF→PDF
    await pg.goto(B+"/"); await pg.set_input_files("#pick","fx/karar.udf")
    await pg.wait_for_selector("#pick-choice button"); print("seçenekler:", await pg.inner_text("#pick-choice"))
    await pg.click("#pick-choice button >> nth=0"); await pg.wait_for_url("**/udf-pdf-cevirme/"); await pg.wait_for_selector("#l-udf-pdf li")
    print("aktarılan:", await pg.inner_text("#l-udf-pdf")); await pg.click("#b-udf-pdf"); print("udf-pdf:", await wait_done("udf-pdf"))
    # 2) ana sayfadan EYP -> doğrudan
    await pg.goto(B+"/"); await pg.set_input_files("#pick","fx/resmi-yazi.eyp"); await pg.wait_for_url("**/eyp-dosyasi-acma/"); await pg.wait_for_selector("#l-eyp li")
    await pg.click("#b-eyp"); print("eyp:", await wait_done("eyp"))
    # 3) imz
    await pg.goto(B+"/imz-dosyasi-acma/"); await pg.set_input_files("#f-imz",["fx/seri.imz"]); await pg.click("#b-imz"); print("imz:", await wait_done("imz"))
    # 4) excel
    await pg.goto(B+"/e-fatura-xml-excel-aktarma/"); await pg.set_input_files("#f-efatura-excel",["fx/faturalar.zip"]); await pg.click("#b-efatura-excel"); print("excel:", await wait_done("efatura-excel"))
    # 5) dilekçe pdf
    await pg.goto(B+"/istifa-dilekcesi/"); await pg.fill("#dl-ad","Deneme Kişi"); await pg.click("#b-dl-pdf"); await pg.wait_for_selector("#r-dilekce .res"); print("dilekçe:", await pg.text_content("#s-dilekce"))
    # 6) küçült + sayfa
    await pg.goto(B+"/pdf-kucultme/"); await pg.set_input_files("#f-sikistir","fx/birlesik-evrak.pdf"); await pg.click("#b-sikistir"); print("küçült:", await wait_done("sikistir"))
    # 7) efatura pdf
    await pg.goto(B+"/e-fatura-xml-pdf-cevirme/"); await pg.set_input_files("#f-efatura","fx/fatura-xslt.xml"); await pg.click("#b-efatura"); print("efatura:", await wait_done("efatura"))
    # 8) çevrimdışı kanıtı: sayfa yüklendikten sonra internet kes
    await pg.goto(B+"/udf-word-cevirme/"); await pg.wait_for_timeout(1500); await ctx.set_offline(True)
    await pg.set_input_files("#f-udf-word","fx/karar.udf"); await pg.click("#b-udf-word"); print("çevrimdışı udf-word:", await wait_done("udf-word")); await ctx.set_offline(False)
    print("HATALAR:", errs[:5])
    await b.close()
asyncio.run(main()); srv.terminate()
