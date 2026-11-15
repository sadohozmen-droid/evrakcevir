"use strict";
/* ================= genel yardımcılar ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtSize = b => b < 1024 ? b + " B" : b < 1048576 ? Math.round(b / 1024) + " KB" : (b / 1048576).toFixed(2).replace(".", ",") + " MB";
const baseName = n => n.replace(/\.[^.]+$/, "");
const sleep = ms => new Promise(r => setTimeout(r, ms));
function b64ToBytes(b64) { const s = atob(b64.replace(/\s+/g, "")); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 5000); }
function setStatus(id, msg, kind) { const el = $("#s-" + id); if (!el) return; el.textContent = msg || ""; el.dataset.kind = kind || ""; }
function setProgress(id, frac) { const b = $("#p-" + id); if (!b) return; if (frac == null) { b.classList.remove("on"); return; } b.classList.add("on"); b.firstElementChild.style.width = Math.round(frac * 100) + "%"; }
const stripCtl = s => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "");

/* ---- indirme: Claude önizlemesinde downloads yeteneği, kendi sitenizde normal indirme ---- */
const ALLOWED_EXT = new Set("gif png jpg jpeg webp txt json md docx pptx csv html svg pdf xlsx zip".split(" "));
let dlNS = null, hostChecked = false;
function initDownloads() {
  if (hostChecked) return;
  try {
    if (window.claude && typeof window.claude.use === "function") {
      hostChecked = true;
      window.claude.use("downloads").then(n => { dlNS = n; }).catch(() => {});
    }
  } catch (e) {}
}
initDownloads(); window.addEventListener("load", initDownloads);
async function saveFile(name, blob) {
  if (dlNS) {
    let fname = name, data = blob;
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      await ensureLibs(); const z = new JSZip(); z.file(name, blob);
      data = await z.generateAsync({ type: "blob" }); fname = baseName(name) + ".zip";
      toast("Bu önizlemede ." + ext + " doğrudan indirilemiyor. Dosya ZIP içinde veriliyor, açınca " + name + " çıkar.");
    }
    try { await dlNS.save({ filename: fname, data }); return; }
    catch (e) {
      if (e && e.code === "declined") return;
      if (e && e.code === "rate_limited") { toast("Bir indirme onayı zaten açık. Onu kapatıp tekrar deneyin."); return; }
      if (!e || !["unavailable", "not_granted", "capability_disabled", "capability_removed"].includes(e.code)) { toast("İndirilemedi: " + (e && (e.message || e.code))); return; }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function showResults(id, items) {
  const box = $("#r-" + id); box.innerHTML = "";
  for (const it of items) {
    const d = document.createElement("div"); d.className = "res" + (it.error ? " bad" : "");
    if (it.error) { d.innerHTML = `<span class="nm">${esc(it.name)}</span><span class="sub">${esc(it.error)}</span>`; }
    else {
      d.innerHTML = `<span class="nm">${esc(it.name)}</span><span class="sz">${fmtSize(it.blob.size)}</span><button class="btn small">İndir</button>${it.note ? `<span class="sub">${esc(it.note)}</span>` : ""}`;
      d.querySelector("button").addEventListener("click", () => saveFile(it.name, it.blob));
    }
    box.appendChild(d);
  }
  const ok = items.filter(i => !i.error);
  if (ok.length > 1) {
    const b = document.createElement("button"); b.className = "btn ghost"; b.textContent = "Hepsini ZIP olarak indir (" + ok.length + " dosya)";
    b.addEventListener("click", async () => { await ensureLibs(); const z = new JSZip(); const used = new Set(); for (const it of ok) { let n = it.name, k = 2; while (used.has(n)) n = baseName(it.name) + " (" + (k++) + ")." + it.name.split(".").pop(); used.add(n); z.file(n, it.blob); } saveFile("evrakcevir-dosyalar.zip", await z.generateAsync({ type: "blob" })); });
    box.appendChild(b);
  }
}

/* ---- dosya listeleri ---- */
function fileList(id, { multiple = true, reorder = false, accept, onChange } = {}) {
  const state = { files: [] };
  const input = $("#f-" + id), list = $("#l-" + id), drop = input.closest(".drop"), btn = $("#b-" + id);
  const okType = f => !accept || accept.test(f.name) || accept.test(f.type || "");
  function add(fs) {
    const good = fs.filter(okType), bad = fs.length - good.length;
    if (bad) toast(bad + " dosya bu araç için uygun biçimde değil, atlandı.");
    state.files = multiple ? state.files.concat(good) : good.slice(0, 1);
    render(); $("#r-" + id).innerHTML = ""; setStatus(id, "");
  }
  function render() {
    list.innerHTML = "";
    state.files.forEach((f, i) => {
      const li = document.createElement("li");
      li.innerHTML = (reorder ? `<span class="ix">${i + 1}</span>` : "") + `<span class="nm">${esc(f.name)}</span><span class="sz">${fmtSize(f.size)}</span>` +
        (reorder ? `<button class="icon-btn" data-a="up" aria-label="Yukarı taşı" ${i === 0 ? "disabled" : ""}>↑</button><button class="icon-btn" data-a="down" aria-label="Aşağı taşı" ${i === state.files.length - 1 ? "disabled" : ""}>↓</button>` : "") +
        `<button class="icon-btn" data-a="rm" aria-label="Kaldır">×</button>`;
      li.addEventListener("click", e => {
        const a = e.target.closest("button")?.dataset.a; if (!a) return;
        if (a === "rm") state.files.splice(i, 1);
        if (a === "up" && i > 0) [state.files[i - 1], state.files[i]] = [state.files[i], state.files[i - 1]];
        if (a === "down" && i < state.files.length - 1) [state.files[i + 1], state.files[i]] = [state.files[i], state.files[i + 1]];
        render();
      });
      list.appendChild(li);
    });
    btn.disabled = state.files.length === 0;
    onChange && onChange(state.files);
  }
  input.addEventListener("change", () => { add([...input.files]); input.value = ""; });
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); add([...e.dataTransfer.files]); });
  state.add = add;
  HANDOFF[id] = state;
  return state;
}
function runner(id, fn) {
  const btn = $("#b-" + id);
  btn.addEventListener("click", async () => {
    btn.disabled = true; $("#r-" + id).innerHTML = ""; setStatus(id, "Hazırlanıyor…"); setProgress(id, 0);
    try { await ensureLibs(); await fn(); }
    catch (e) { console.error(e); setStatus(id, e && e.userMsg ? e.userMsg : "Bir hata oluştu: " + (e && e.message ? e.message : e), "err"); }
    finally { btn.disabled = false; setProgress(id, null); }
  });
}
const userErr = m => { const e = new Error(m); e.userMsg = m; return e; };

/* ---- kütüphaneler: sayfa açılışını yavaşlatmamak için yükleme bittikten sonra arka planda gelir ---- */
const ASSET_BASE = (() => { try { const src = document.currentScript && document.currentScript.src; if (src) return { base: new URL(".", src).href, q: new URL(src).search }; } catch (e) {} return { base: "/assets/", q: "" }; })();
const LIB_URLS = {
  pdflib: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
  fontkit: "https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
  jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfworker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  h2c: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  fonts: ASSET_BASE.base + "fonts.js" + ASSET_BASE.q,
};
let libsPromise = null;
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src; s.async = false;
    s.onload = res; s.onerror = () => rej(userErr("Gerekli bir bileşen yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin."));
    document.head.appendChild(s);
  });
}
function ensureLibs() {
  if (libsPromise) return libsPromise;
  const list = (document.body.dataset.libs || "").split(",").filter(Boolean);
  libsPromise = Promise.all(list.map(k => loadScript(LIB_URLS[k]))).then(() => {
    if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = LIB_URLS.pdfworker;
    window.FONT_B64 = window.EVRAK_FONTS || {};
  });
  libsPromise.catch(() => { libsPromise = null; });
  return libsPromise;
}
if (document.readyState === "complete") setTimeout(() => ensureLibs().catch(() => {}), 200);
else window.addEventListener("load", () => setTimeout(() => ensureLibs().catch(() => {}), 200));
const HANDOFF = {};

/* ================= UDF okuma ================= */
function attrs(el) { const o = {}; for (const a of el.attributes) o[a.name.toLowerCase()] = a.value; return o; }
const isTrue = v => v === "true" || v === "1";
function directChild(el, name) { for (const c of el.children) if (c.tagName.toLowerCase() === name) return c; return null; }
function runStyleFrom(a) {
  const s = {};
  if (a.family) s.family = a.family;
  if (a.size && +a.size > 0) s.size = +a.size;
  if ("bold" in a) s.bold = isTrue(a.bold);
  if ("italic" in a) s.italic = isTrue(a.italic);
  if ("underline" in a) s.underline = isTrue(a.underline);
  if (a.foreground && /^-?\d+$/.test(a.foreground)) { const v = +a.foreground; s.color = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  return s;
}
async function readUdfFile(file) {
  const buf = await file.arrayBuffer();
  let xml = null;
  try {
    const zip = await JSZip.loadAsync(buf);
    const f = zip.file("content.xml") || zip.file(/(^|\/)content\.xml$/i)[0];
    if (!f) throw userErr(file.name + ": UDF arşivinde content.xml bulunamadı.");
    xml = await f.async("string");
  } catch (e) {
    if (e.userMsg) throw e;
    const t = new TextDecoder("utf-8").decode(buf);
    if (t.includes("<template")) xml = t; else throw userErr(file.name + ": Geçerli bir UDF dosyası değil.");
  }
  return parseUdfXml(xml, file.name);
}
function parseUdfXml(xml, name) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw userErr(name + ": UDF içeriği bozuk, okunamadı.");
  const root = doc.documentElement;
  const text = (directChild(root, "content") || {}).textContent || "";
  const styles = {};
  const stEl = directChild(root, "styles");
  if (stEl) for (const s of stEl.children) { const a = attrs(s); if (a.name) styles[a.name] = runStyleFrom(a); }
  const props = directChild(root, "properties"); const pf = props ? props.getElementsByTagName("pageFormat")[0] : null;
  const pa = pf ? attrs(pf) : {};
  const num = (v, d) => (v != null && v !== "" && isFinite(+v)) ? +v : d;
  const page = { left: num(pa.leftmargin, 70.9), right: num(pa.rightmargin, 70.9), top: num(pa.topmargin, 56.7), bottom: num(pa.bottommargin, 56.7), landscape: pa.paperorientation === "0" || pa.paperorientation === "2" };
  const elements = directChild(root, "elements");
  const resolver = elements ? elements.getAttribute("resolver") : null;
  const base = Object.assign({ family: "Times New Roman", size: 12, bold: false, italic: false, underline: false, color: [0, 0, 0] }, styles["hvl-default"] || {}, (resolver && styles[resolver]) || {});
  if (base.color && base.color.join() === "51,51,51") base.color = [0, 0, 0];
  const SKIP = new Set(["header", "footer"]);
  let numCounter = 0;
  function styleRef(a) { const n = a.resolver || a.style; return n && styles[n] ? styles[n] : {}; }
  function parsePara(el) {
    const a = attrs(el);
    const pst = Object.assign({}, base, styleRef(a), runStyleFrom(a));
    const runs = [];
    for (const ch of el.children) {
      const tag = ch.tagName.toLowerCase(), ca = attrs(ch);
      if (tag === "image") { if (ca.imagedata) runs.push({ image: ca.imagedata, w: num(ca.width, 0), h: num(ca.height, 0) }); continue; }
      let t;
      if ("startoffset" in ca) t = text.substr(+ca.startoffset, num(ca.length, 0)); else t = ch.textContent || "";
      if (tag === "tab") t = "\t"; else if (tag === "space" && !t) t = " ";
      if (!t) continue;
      runs.push(Object.assign({}, pst, styleRef(ca), runStyleFrom(ca), { text: stripCtl(t.replace(/\r/g, "")) }));
    }
    // paragraf sonundaki satır sonunu kaldır
    for (let i = runs.length - 1; i >= 0; i--) { const r = runs[i]; if (r.image) break; r.text = r.text.replace(/\n+$/, ""); if (r.text) break; runs.splice(i, 1); }
    let prefix = "";
    if (isTrue(a.bulleted)) prefix = "•\t";
    if (isTrue(a.numbered)) { numCounter++; prefix = numCounter + ".\t"; } else numCounter = 0;
    if (prefix) runs.unshift(Object.assign({}, pst, { text: prefix }));
    const al = { "0": "left", "1": "center", "2": "right", "3": "justify" }[a.alignment] || "left";
    return { type: "para", align: al, leftIndent: num(a.leftindent, 0), rightIndent: num(a.rightindent, 0), firstIndent: num(a.firstlineindent, 0), spaceAbove: num(a.spaceabove, 0), spaceBelow: num(a.spacebelow, 0), lineSpacing: Math.max(0, Math.min(2, num(a.linespacing, 0))), runs, baseSize: pst.size || 12, baseStyle: pst };
  }
  function parseTable(el) {
    const a = attrs(el);
    const rows = [...el.children].filter(c => c.tagName.toLowerCase() === "row").map(r => [...r.children].filter(c => c.tagName.toLowerCase() === "cell").map(c => ({ blocks: parseKids(c), span: Math.max(1, num(attrs(c).colspan, 1)) })));
    const cols = num(a.columncount, 0) || Math.max(1, ...rows.map(r => r.reduce((s, c) => s + c.span, 0)));
    let spans = (a.columnspans || "").split(",").map(Number).filter(n => n > 0);
    if (spans.length !== cols) spans = Array(cols).fill(1);
    return { type: "table", cols, spans, rows, border: a.border !== "borderNone" };
  }
  function parseKids(container) {
    const out = [];
    if (!container) return out;
    for (const ch of container.children) {
      const tag = ch.tagName.toLowerCase();
      if (tag === "paragraph") out.push(parsePara(ch));
      else if (tag === "table") out.push(parseTable(ch));
      else if (tag === "page-break" || tag === "pagebreak") out.push({ type: "pb" });
      else if (!SKIP.has(tag) && ch.children.length) out.push(...parseKids(ch));
    }
    return out;
  }
  let blocks = parseKids(elements);
  if (!blocks.length && text.trim()) blocks = text.split(/\n/).map(l => ({ type: "para", align: "left", leftIndent: 0, rightIndent: 0, firstIndent: 0, spaceAbove: 0, spaceBelow: 0, lineSpacing: 0, runs: l ? [Object.assign({}, base, { text: stripCtl(l) })] : [], baseSize: base.size, baseStyle: base }));
  if (!blocks.length) throw userErr(name + ": Belgede metin bulunamadı.");
  return { page, blocks, base };
}

/* ================= model -> PDF (pdf-lib düzen motoru) ================= */

const isSansFamily = f => /arial|helvetica|sans|tahoma|verdana|calibri|segoe|dialog|trebuchet|roboto|open sans|plex/i.test(f || "");
const fontKey = r => (isSansFamily(r.family) ? "Sans" : "Serif") + "-" + (r.bold && r.italic ? "BoldItalic" : r.bold ? "Bold" : r.italic ? "Italic" : "Regular");
function sniffImage(bytes) { if (bytes[0] === 0x89 && bytes[1] === 0x50) return "png"; if (bytes[0] === 0xFF && bytes[1] === 0xD8) return "jpg"; return null; }
async function modelToPdf(model) {
  const { PDFDocument, rgb } = PDFLib;
  const doc = await PDFDocument.create();
  doc.registerFontkit(window.fontkit);
  // kullanılan yazı tiplerini ve görselleri önceden göm
  const need = new Set(["Serif-Regular"]), imgs = [];
  (function walk(bs) { for (const b of bs) { if (b.type === "para") { need.add(fontKey(b.baseStyle)); for (const r of b.runs) r.image ? imgs.push(r) : need.add(fontKey(r)); } else if (b.type === "table") b.rows.forEach(row => row.forEach(c => walk(c.blocks))); } })(model.blocks);
  const fonts = {};
  for (const k of need) fonts[k] = await doc.embedFont(b64ToBytes((window.EVRAK_FONTS || {})[k]), { subset: false });
  for (const r of imgs) {
    try {
      const bytes = b64ToBytes(r.image.replace(/^data:[^,]*,/, ""));
      const kind = sniffImage(bytes);
      r.pdfImg = kind === "png" ? await doc.embedPng(bytes) : kind === "jpg" ? await doc.embedJpg(bytes) : null;
    } catch (e) { r.pdfImg = null; }
  }
  const P = model.page;
  const PW = P.landscape ? 841.89 : 595.28, PH = P.landscape ? 595.28 : 841.89;
  const left = Math.max(14, P.left), right = Math.max(14, P.right), top = Math.max(14, P.top), bottom = Math.max(14, P.bottom);
  const contentW = PW - left - right;
  const F = r => fonts[fontKey(r)] || fonts["Serif-Regular"];
  const toRgb = c => c ? rgb(c[0] / 255, c[1] / 255, c[2] / 255) : rgb(0, 0, 0);

  function layoutPara(p, width) {
    const items = [];
    if (p.spaceAbove) items.push({ spacer: true, h: p.spaceAbove });
    const factor = 1.2 * (1 + p.lineSpacing);
    const lines = []; let cur = null;
    const availFor = idx => width - p.leftIndent - p.rightIndent - (idx === 0 ? p.firstIndent : 0);
    const newLine = () => { cur = { segs: [], w: 0, maxSize: 0, hard: false, img: null }; lines.push(cur); };
    newLine();
    const pushSeg = seg => { cur.segs.push(seg); cur.w += seg.w; cur.maxSize = Math.max(cur.maxSize, seg.size || 0); };
    const trimEnd = l => { while (l.segs.length && l.segs[l.segs.length - 1].space) { l.w -= l.segs.pop().w; } };
    for (const r of p.runs) {
      if (r.image) {
        if (cur.segs.length) newLine();
        const img = r.pdfImg; if (!img) continue;
        let w = r.w || img.width * 0.75, h = r.h || img.height * 0.75;
        const maxW = availFor(lines.length - 1); if (w > maxW) { h *= maxW / w; w = maxW; }
        cur.img = { img, w, h }; newLine(); continue;
      }
      const font = F(r), size = r.size || 12;
      const toks = r.text.match(/\n|\t| +|[^ \t\n]+/g) || [];
      for (const t of toks) {
        if (t === "\n") { cur.hard = true; cur.maxSize = Math.max(cur.maxSize, size); newLine(); continue; }
        if (t === "\t") { const pos = cur.w + (lines.length === 1 ? p.firstIndent : 0); const tw = 36 - (pos % 36) || 36; pushSeg({ tab: true, space: false, w: tw, size, run: r, font }); continue; }
        if (t[0] === " ") {
          if (!cur.segs.length && lines.length > 1) continue;
          pushSeg({ space: true, text: t, w: font.widthOfTextAtSize(t, size), size, run: r, font }); continue;
        }
        let w = font.widthOfTextAtSize(t, size);
        const avail = availFor(lines.length - 1);
        if (cur.w + w > avail && cur.segs.some(s => !s.space)) { trimEnd(cur); newLine(); }
        if (w > availFor(lines.length - 1)) {
          // çok uzun kelimeyi harf harf böl
          let chunk = "";
          for (const ch of t) {
            const cw = font.widthOfTextAtSize(chunk + ch, size);
            if (cur.w + cw > availFor(lines.length - 1) && chunk) { pushSeg({ text: chunk, w: font.widthOfTextAtSize(chunk, size), size, run: r, font }); newLine(); chunk = ch; }
            else chunk += ch;
          }
          if (chunk) pushSeg({ text: chunk, w: font.widthOfTextAtSize(chunk, size), size, run: r, font });
          continue;
        }
        pushSeg({ text: t, w, size, run: r, font });
      }
    }
    if (lines.length > 1 && !lines[lines.length - 1].segs.length && !lines[lines.length - 1].img && !lines[lines.length - 2].hard) lines.pop();
    lines.forEach((l, idx) => {
      trimEnd(l);
      if (l.img) { const im = l.img; items.push({ h: im.h + 4, draw(page, x, y) { const avail = availFor(idx); let ix = x + p.leftIndent; if (p.align === "center") ix += (avail - im.w) / 2; else if (p.align === "right") ix += avail - im.w; page.drawImage(im.img, { x: ix, y: y - im.h - 2, width: im.w, height: im.h }); } }); return; }
      const ms = l.maxSize || p.baseSize || 12;
      const h = ms * factor;
      const isLast = idx === lines.length - 1 || l.hard;
      items.push({
        h, draw(page, x, y) {
          const avail = availFor(idx);
          let lx = x + p.leftIndent + (idx === 0 ? p.firstIndent : 0);
          const free = avail - l.w;
          let extra = 0;
          if (p.align === "center") lx += free / 2;
          else if (p.align === "right") lx += free;
          else if (p.align === "justify" && !isLast && free > 0) {
            let lastTab = -1; l.segs.forEach((s, i) => { if (s.tab) lastTab = i; });
            const n = l.segs.filter((s, i) => s.space && i > lastTab).length;
            if (n) extra = free / n;
            l._lastTab = lastTab;
          }
          const base = y - ms * 0.92 - (h - ms * 1.2) / 2;
          l.segs.forEach((s, i) => {
            const sw = s.w + (s.space && i > (l._lastTab ?? -1) ? extra : 0);
            if (s.text && !s.space) page.drawText(s.text, { x: lx, y: base, size: s.size, font: s.font, color: toRgb(s.run.color) });
            if (s.run.underline && !s.tab) page.drawLine({ start: { x: lx, y: base - s.size * 0.12 }, end: { x: lx + sw, y: base - s.size * 0.12 }, thickness: Math.max(0.5, s.size * 0.05), color: toRgb(s.run.color) });
            lx += sw;
          });
        }
      });
    });
    if (p.spaceBelow) items.push({ spacer: true, h: p.spaceBelow });
    return items;
  }
  function layoutBlocks(blocks, width) {
    const items = [];
    for (const b of blocks) {
      if (b.type === "para") items.push(...layoutPara(b, width));
      else if (b.type === "pb") items.push({ pb: true, h: 0 });
      else if (b.type === "table") items.push(...layoutTable(b, width));
    }
    return items;
  }
  function layoutTable(t, width) {
    const total = t.spans.reduce((a, b) => a + b, 0);
    const colW = t.spans.map(s => s / total * width);
    const pad = 4;
    return t.rows.map(row => {
      let ci = 0;
      const cells = row.map(c => {
        const w = colW.slice(ci, ci + c.span).reduce((a, b) => a + b, 0) || colW[colW.length - 1];
        const x = colW.slice(0, ci).reduce((a, b) => a + b, 0);
        ci += c.span;
        const its = layoutBlocks(c.blocks, w - pad * 2).filter(i => !i.pb);
        return { x, w, its, h: its.reduce((s, i) => s + i.h, 0) + pad * 2 };
      });
      const h = Math.max(14, ...cells.map(c => c.h));
      return {
        h, draw(page, x, y) {
          for (const c of cells) {
            let cy = y - pad;
            for (const it of c.its) { if (!it.spacer) it.draw(page, x + c.x + pad, cy); cy -= it.h; }
            if (t.border) page.drawRectangle({ x: x + c.x, y: y - h, width: c.w, height: h, borderColor: rgb(0, 0, 0), borderWidth: 0.6 });
          }
        }
      };
    });
  }
  const items = layoutBlocks(model.blocks, contentW);
  let page = doc.addPage([PW, PH]), y = PH - top;
  const fresh = () => { page = doc.addPage([PW, PH]); y = PH - top; };
  for (const it of items) {
    if (it.pb) { fresh(); continue; }
    if (it.spacer) { y -= it.h; if (y < bottom) fresh(); continue; }
    if (y - it.h < bottom && y < PH - top - 0.5) fresh();
    it.draw(page, left, y); y -= it.h;
  }
  doc.setProducer("Evrakçevir"); doc.setCreator("Evrakçevir");
  return new Blob([await doc.save()], { type: "application/pdf" });
}

/* ================= model -> DOCX ================= */
const xmlEsc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
async function modelToDocx(model) {
  let skippedImg = 0;
  const tw = pt => Math.round(pt * 20);
  const hex = c => c ? c.map(v => v.toString(16).padStart(2, "0")).join("") : null;
  function runXml(r) {
    const rp = [];
    if (r.family) rp.push(`<w:rFonts w:ascii="${xmlEsc(r.family)}" w:hAnsi="${xmlEsc(r.family)}" w:cs="${xmlEsc(r.family)}"/>`);
    if (r.bold) rp.push("<w:b/><w:bCs/>");
    if (r.italic) rp.push("<w:i/><w:iCs/>");
    if (r.underline) rp.push('<w:u w:val="single"/>');
    const h = hex(r.color); if (h && h !== "000000") rp.push(`<w:color w:val="${h}"/>`);
    if (r.size) rp.push(`<w:sz w:val="${Math.round(r.size * 2)}"/><w:szCs w:val="${Math.round(r.size * 2)}"/>`);
    const parts = r.text.split(/(\t|\n)/).map(s => s === "\t" ? "<w:tab/>" : s === "\n" ? "<w:br/>" : s ? `<w:t xml:space="preserve">${xmlEsc(s)}</w:t>` : "").join("");
    return `<w:r><w:rPr>${rp.join("")}</w:rPr>${parts}</w:r>`;
  }
  function paraXml(p) {
    const jc = { left: "left", center: "center", right: "right", justify: "both" }[p.align];
    const ind = `<w:ind w:left="${tw(p.leftIndent)}" w:right="${tw(p.rightIndent)}" ${p.firstIndent >= 0 ? `w:firstLine="${tw(p.firstIndent)}"` : `w:hanging="${tw(-p.firstIndent)}"`}/>`;
    const sp = `<w:spacing w:before="${tw(p.spaceAbove)}" w:after="${tw(p.spaceBelow)}" w:line="${Math.round(240 * (1 + p.lineSpacing))}" w:lineRule="auto"/>`;
    const runs = p.runs.map(r => { if (r.image) { skippedImg++; return ""; } return runXml(r); }).join("");
    return `<w:p><w:pPr>${sp}${ind}<w:jc w:val="${jc}"/></w:pPr>${runs}</w:p>`;
  }
  function tableXml(t, width) {
    const total = t.spans.reduce((a, b) => a + b, 0);
    const cols = t.spans.map(s => Math.round(s / total * width));
    const b = t.border ? "single" : "nil";
    const borders = ["top", "left", "bottom", "right", "insideH", "insideV"].map(k => `<w:${k} w:val="${b}" w:sz="4" w:space="0" w:color="000000"/>`).join("");
    let x = `<w:tbl><w:tblPr><w:tblW w:w="${cols.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${cols.map(c => `<w:gridCol w:w="${c}"/>`).join("")}</w:tblGrid>`;
    for (const row of t.rows) {
      x += "<w:tr>"; let ci = 0;
      for (const c of row) {
        const w = cols.slice(ci, ci + c.span).reduce((a, b) => a + b, 0); ci += c.span;
        const inner = blocksXml(c.blocks, w) || "<w:p/>";
        x += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${c.span > 1 ? `<w:gridSpan w:val="${c.span}"/>` : ""}</w:tcPr>${inner}${/<\/w:tbl>$/.test(inner) ? "<w:p/>" : ""}</w:tc>`;
      }
      x += "</w:tr>";
    }
    return x + "</w:tbl>";
  }
  function blocksXml(bs, width) { return bs.map(b => b.type === "para" ? paraXml(b) : b.type === "table" ? tableXml(b, width) : '<w:p><w:r><w:br w:type="page"/></w:r></w:p>').join(""); }
  const P = model.page;
  const pw = P.landscape ? 16838 : 11906, ph = P.landscape ? 11906 : 16838;
  const contentTw = pw - tw(P.left) - tw(P.right);
  const body = blocksXml(model.blocks, contentTw);
  const sect = `<w:sectPr><w:pgSz w:w="${pw}" w:h="${ph}"${P.landscape ? ' w:orient="landscape"' : ""}/><w:pgMar w:top="${tw(P.top)}" w:right="${tw(P.right)}" w:bottom="${tw(P.bottom)}" w:left="${tw(P.left)}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}${sect}</w:body></w:document>`;
  const fam = xmlEsc(model.base.family || "Times New Roman"), sz = Math.round((model.base.size || 12) * 2);
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${fam}" w:hAnsi="${fam}" w:cs="${fam}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:lang w:val="tr-TR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
  const z = new JSZip();
  z.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
  z.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  z.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  z.file("word/document.xml", docXml);
  z.file("word/styles.xml", stylesXml);
  const blob = await z.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
  return { blob, skippedImg };
}

/* ================= model -> UDF ================= */
async function modelToUdf(model) {
  let text = "";
  const f2 = n => (Math.round((+n || 0) * 100) / 100).toFixed(1);
  const runAttrs = r => `family="${xmlEsc(r.family || "Times New Roman")}" size="${f2(r.size || 12).replace(/\.0$/, "")}"${r.bold ? ' bold="true"' : ""}${r.italic ? ' italic="true"' : ""}${r.underline ? ' underline="true"' : ""}${r.color && r.color.join() !== "0,0,0" ? ` foreground="${((255 << 24) | (r.color[0] << 16) | (r.color[1] << 8) | r.color[2]) | 0}"` : ""}`;
  function para(p) {
    const al = { left: 0, center: 1, right: 2, justify: 3 }[p.align] ?? 0;
    const bs = p.baseStyle || model.base;
    let s = `<paragraph Alignment="${al}" LeftIndent="${f2(p.leftIndent)}" RightIndent="${f2(p.rightIndent)}" FirstLineIndent="${f2(p.firstIndent)}"${p.spaceAbove ? ` SpaceAbove="${f2(p.spaceAbove)}"` : ""}${p.spaceBelow ? ` SpaceBelow="${f2(p.spaceBelow)}"` : ""} LineSpacing="${f2(p.lineSpacing)}" family="${xmlEsc(bs.family || "Times New Roman")}" size="${f2(bs.size || 12).replace(/\.0$/, "")}">`;
    for (const r of p.runs) {
      if (r.image || !r.text) continue;
      const t = stripCtl(r.text);
      const start = text.length; text += t;
      s += `<content ${runAttrs(r)} startOffset="${start}" length="${t.length}" />`;
    }
    const st = text.length; text += "\n";
    s += `<content ${runAttrs(bs)} startOffset="${st}" length="1" />`;
    return s + "</paragraph>";
  }
  function table(t) {
    let s = `<table tableName="Sabit" columnCount="${t.cols}" columnSpans="${t.spans.map(v => Math.round(v)).join(",")}" border="${t.border ? "borderCell" : "borderNone"}">`;
    t.rows.forEach((row, i) => {
      s += `<row rowName="row${i + 1}" rowType="dataRow">`;
      for (const c of row) {
        let inner = c.blocks.filter(b => b.type === "para").map(para).join("");
        if (!inner) inner = para({ align: "left", leftIndent: 0, rightIndent: 0, firstIndent: 0, spaceAbove: 0, spaceBelow: 0, lineSpacing: 0, runs: [], baseStyle: model.base });
        s += `<cell${c.span > 1 ? ` colspan="${c.span}"` : ""}>${inner}</cell>`;
      }
      s += "</row>";
    });
    return s + "</table>";
  }
  function flat(bs) { return bs.map(b => b.type === "para" ? para(b) : b.type === "table" ? table(b) : "").join(""); }
  const els = flat(model.blocks);
  const P = model.page;
  const cdata = text.replace(/]]>/g, "]]]]><![CDATA[>");
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>\n<template format_id="1.8">\n<content><![CDATA[${cdata}]]></content>\n<properties><pageFormat mediaSizeName="1" leftMargin="${f2(P.left)}" rightMargin="${f2(P.right)}" topMargin="${f2(P.top)}" bottomMargin="${f2(P.bottom)}" paperOrientation="${P.landscape ? 0 : 1}" headerFOffset="20.0" footerFOffset="20.0" /></properties>\n<elements resolver="hvl-default">\n${els}\n</elements>\n<styles><style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=Dialog,name=Dialog,style=plain,size=12]" /><style name="hvl-default" family="${xmlEsc(model.base.family || "Times New Roman")}" size="${f2(model.base.size || 12).replace(/\.0$/, "")}" description="Gövde" /></styles>\n</template>\n`;
  const z = new JSZip(); z.file("content.xml", xml);
  return z.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/* ================= DOCX okuma ================= */
const WNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
async function readDocx(file) {
  let zip;
  try { zip = await JSZip.loadAsync(await file.arrayBuffer()); } catch (e) { throw userErr(file.name + ": .docx dosyası açılamadı. Eski .doc biçimindeyse Word'de .docx olarak kaydedin."); }
  const docF = zip.file("word/document.xml"); if (!docF) throw userErr(file.name + ": Word belgesi içeriği bulunamadı.");
  const parse = async p => { const f = zip.file(p); return f ? new DOMParser().parseFromString(await f.async("string"), "application/xml") : null; };
  const doc = await parse("word/document.xml"), stylesDoc = await parse("word/styles.xml"), numDoc = await parse("word/numbering.xml");
  const kids = (el, name) => [...el.childNodes].filter(n => n.nodeType === 1 && n.localName === name && n.namespaceURI === WNS);
  const kid = (el, name) => el ? kids(el, name)[0] || null : null;
  const wa = (el, name) => el ? (el.getAttributeNS(WNS, name) ?? el.getAttribute("w:" + name)) : null;
  const onOff = el => { if (!el) return undefined; const v = wa(el, "val"); return !(v === "false" || v === "0" || v === "none"); };
  function rPrStyle(rPr) {
    const s = {}; if (!rPr) return s;
    const f = kid(rPr, "rFonts"); if (f) { const n = wa(f, "ascii") || wa(f, "hAnsi") || wa(f, "cs"); if (n) s.family = n; }
    const b = onOff(kid(rPr, "b")); if (b !== undefined) s.bold = b;
    const i = onOff(kid(rPr, "i")); if (i !== undefined) s.italic = i;
    const u = kid(rPr, "u"); if (u) s.underline = wa(u, "val") !== "none";
    const sz = kid(rPr, "sz"); if (sz && +wa(sz, "val")) s.size = +wa(sz, "val") / 2;
    const c = kid(rPr, "color"); const cv = c && wa(c, "val"); if (cv && /^[0-9a-f]{6}$/i.test(cv)) s.color = [0, 2, 4].map(k => parseInt(cv.substr(k, 2), 16));
    return s;
  }
  function pPrProps(pPr) {
    const o = {}; if (!pPr) return o;
    const jc = kid(pPr, "jc"); if (jc) { const v = wa(jc, "val"); o.align = v === "both" || v === "distribute" ? "justify" : v === "center" ? "center" : (v === "right" || v === "end") ? "right" : "left"; }
    const ind = kid(pPr, "ind");
    if (ind) {
      const L = wa(ind, "left") ?? wa(ind, "start"), R = wa(ind, "right") ?? wa(ind, "end"), FL = wa(ind, "firstLine"), H = wa(ind, "hanging");
      if (L != null) o.leftIndent = +L / 20; if (R != null) o.rightIndent = +R / 20;
      if (FL != null) o.firstIndent = +FL / 20; if (H != null) o.firstIndent = -(+H) / 20;
    }
    const sp = kid(pPr, "spacing");
    if (sp) {
      const b = wa(sp, "before"), a = wa(sp, "after"), l = wa(sp, "line"), rule = wa(sp, "lineRule");
      if (b != null) o.spaceAbove = +b / 20; if (a != null) o.spaceBelow = +a / 20;
      if (l != null && (!rule || rule === "auto")) o.lineSpacing = Math.max(0, Math.min(2, +l / 240 - 1));
    }
    return o;
  }
  // stiller
  const styleMap = {}; let defRun = { family: "Times New Roman", size: 12 }, defPara = {};
  if (stylesDoc) {
    const dd = stylesDoc.getElementsByTagNameNS(WNS, "docDefaults")[0];
    if (dd) { const rp = dd.getElementsByTagNameNS(WNS, "rPr")[0]; Object.assign(defRun, rPrStyle(rp)); const pp = dd.getElementsByTagNameNS(WNS, "pPr")[0]; Object.assign(defPara, pPrProps(pp)); }
    for (const st of stylesDoc.getElementsByTagNameNS(WNS, "style")) {
      const id = wa(st, "styleId"); if (!id) continue;
      styleMap[id] = { based: wa(kid(st, "basedOn"), "val"), r: rPrStyle(kid(st, "rPr")), p: pPrProps(kid(st, "pPr")), num: kid(kid(st, "pPr"), "numPr"), type: wa(st, "type"), def: wa(st, "default") === "1" };
    }
  }
  const resolveStyle = (id, depth = 0) => { const s = styleMap[id]; if (!s || depth > 8) return { r: {}, p: {}, num: null }; const b = s.based ? resolveStyle(s.based, depth + 1) : { r: {}, p: {}, num: null }; return { r: Object.assign({}, b.r, s.r), p: Object.assign({}, b.p, s.p), num: s.num || b.num }; };
  const defaultParaId = Object.keys(styleMap).find(k => styleMap[k].type === "paragraph" && styleMap[k].def);
  // numaralandırma
  const absMap = {}, numMap = {};
  if (numDoc) {
    for (const an of numDoc.getElementsByTagNameNS(WNS, "abstractNum")) {
      const lv = {}; for (const l of kids(an, "lvl")) lv[wa(l, "ilvl")] = { fmt: wa(kid(l, "numFmt"), "val") || "decimal", text: wa(kid(l, "lvlText"), "val") || "%1.", start: +(wa(kid(l, "start"), "val") || 1) };
      absMap[wa(an, "abstractNumId")] = lv;
    }
    for (const n of numDoc.getElementsByTagNameNS(WNS, "num")) numMap[wa(n, "numId")] = absMap[wa(kid(n, "abstractNumId"), "val")];
  }
  const counters = {};
  const roman = n => { const m = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]]; let s = ""; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; };
  const letter = n => { let s = ""; while (n > 0) { n--; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); } return s; };
  function numLabel(numId, ilvl) {
    const lv = numMap[numId]; if (!lv || !lv[ilvl]) return null;
    const c = counters[numId] = counters[numId] || {};
    for (const k of Object.keys(c)) if (+k > ilvl) delete c[k];
    c[ilvl] = (c[ilvl] ?? (lv[ilvl].start - 1)) + 1;
    const L = lv[ilvl];
    if (L.fmt === "bullet") return "•";
    if (L.fmt === "none") return "";
    return L.text.replace(/%(\d)/g, (_, d) => {
      const li = +d - 1, v = c[li] ?? (lv[li] ? lv[li].start : 1), f = lv[li] ? lv[li].fmt : "decimal";
      return f === "lowerLetter" ? letter(v) : f === "upperLetter" ? letter(v).toUpperCase() : f === "lowerRoman" ? roman(v) : f === "upperRoman" ? roman(v).toUpperCase() : String(v);
    });
  }
  // gövde
  let pbAfter = false, imgSkipped = 0;
  function collectRuns(el, out) {
    for (const n of el.childNodes) {
      if (n.nodeType !== 1 || n.namespaceURI !== WNS) continue;
      const ln = n.localName;
      if (ln === "r") out.push(n);
      else if (["hyperlink", "ins", "smartTag", "sdt", "sdtContent", "fldSimple", "customXml"].includes(ln)) collectRuns(n, out);
    }
    return out;
  }
  function readPara(p) {
    const pPr = kid(p, "pPr");
    const sid = wa(kid(pPr, "pStyle"), "val") || defaultParaId;
    const st = resolveStyle(sid);
    const props = Object.assign({ align: "left", leftIndent: 0, rightIndent: 0, firstIndent: 0, spaceAbove: 0, spaceBelow: 0, lineSpacing: 0 }, defPara, st.p, pPrProps(pPr));
    const pRun = Object.assign({ bold: false, italic: false, underline: false, color: [0, 0, 0] }, defRun, st.r);
    const runs = [];
    const numPr = kid(pPr, "numPr"), sNum = st.num;
    let pbBefore = !!(pPr && onOff(kid(pPr, "pageBreakBefore")));
    if (numPr || sNum) {
      const numId = wa(kid(numPr, "numId"), "val") || wa(kid(sNum, "numId"), "val");
      const ilvl = +(wa(kid(numPr, "ilvl"), "val") || wa(kid(sNum, "ilvl"), "val") || 0);
      const lab = numId && numId !== "0" ? numLabel(numId, ilvl) : null;
      if (lab) runs.push(Object.assign({}, pRun, { text: lab + "\t" }));
    }
    for (const r of collectRuns(p, [])) {
      const rPr = kid(r, "rPr");
      const rs = wa(kid(rPr, "rStyle"), "val");
      const style = Object.assign({}, pRun, rs ? resolveStyle(rs).r : {}, rPrStyle(rPr));
      let t = "";
      for (const c of r.childNodes) {
        if (c.nodeType !== 1) continue;
        const ln = c.localName;
        if (ln === "t") t += c.textContent;
        else if (ln === "tab") t += "\t";
        else if (ln === "br") { if (wa(c, "type") === "page") pbAfter = true; else t += "\n"; }
        else if (ln === "cr") t += "\n";
        else if (ln === "noBreakHyphen") t += "-";
        else if (ln === "drawing" || ln === "pict") imgSkipped++;
      }
      if (t) runs.push(Object.assign({}, style, { text: t }));
    }
    return { block: Object.assign({ type: "para", runs, baseSize: pRun.size, baseStyle: pRun }, props), pbBefore };
  }
  function readTable(tbl) {
    const grid = kid(tbl, "tblGrid");
    const spans = grid ? kids(grid, "gridCol").map(g => +(wa(g, "w") || 0) / 20).filter(v => v > 0) : [];
    const rows = kids(tbl, "tr").map(tr => kids(tr, "tc").map(tc => {
      const tcPr = kid(tc, "tcPr"); const span = +(wa(kid(tcPr, "gridSpan"), "val") || 1);
      return { blocks: readBody(tc).filter(b => b.type === "para"), span };
    }));
    const cols = spans.length || Math.max(1, ...rows.map(r => r.reduce((s, c) => s + c.span, 0)));
    const tblPr = kid(tbl, "tblPr"); const tb = kid(tblPr, "tblBorders");
    const border = tb ? kids(tb, "insideV").concat(kids(tb, "top")).some(e => !["nil", "none"].includes(wa(e, "val"))) : true;
    return { type: "table", cols, spans: spans.length === cols ? spans : Array(cols).fill(1), rows, border };
  }
  function readBody(el) {
    const out = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 1 || n.namespaceURI !== WNS) continue;
      if (n.localName === "p") { pbAfter = false; const { block, pbBefore } = readPara(n); if (pbBefore && out.length) out.push({ type: "pb" }); out.push(block); if (pbAfter) out.push({ type: "pb" }); }
      else if (n.localName === "tbl") { const t = readTable(n); out.push(t); }
      else if (n.localName === "tc") { }
      else if (n.localName === "sdt") { const c = kid(n, "sdtContent"); if (c) out.push(...readBody(c)); }
      else if (n.localName === "tr") { /* tablo dışında satır olmaz */ }
      else if (n.localName === "tblPr") { }
      else if (n.localName === "tblGrid") { }
      else if (n.localName === "tcPr") { }
      else if (n.localName === "trPr") { }
      else if (n.localName === "customXml") out.push(...readBody(n));
    }
    return out;
  }
  const body = doc.getElementsByTagNameNS(WNS, "body")[0];
  const blocks = readBody(body);
  // sayfa ayarı
  const sect = body ? kids(body, "sectPr")[0] : null;
  const pgMar = sect ? kid(sect, "pgMar") : null, pgSz = sect ? kid(sect, "pgSz") : null;
  const m = k => pgMar && wa(pgMar, k) != null ? +wa(pgMar, k) / 20 : 70.9;
  const page = { left: m("left"), right: m("right"), top: m("top"), bottom: m("bottom"), landscape: !!(pgSz && wa(pgSz, "orient") === "landscape") };
  if (!blocks.some(b => b.type === "table" || (b.runs && b.runs.some(r => r.text && r.text.trim())))) throw userErr(file.name + ": Belgede metin bulunamadı.");
  return { model: { page, blocks, base: Object.assign({ bold: false, italic: false }, defRun) }, imgSkipped };
}

/* ================= PDF yardımcıları (pdf.js) ================= */

async function openPdfJs(bytes) {
  try { return await pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise; }
  catch (e) { if (e && e.name === "PasswordException") throw userErr("Bu PDF şifreli. Önce şifresini kaldırın."); throw userErr("PDF açılamadı, dosya bozuk olabilir."); }
}

/* ================= PDF -> UDF ================= */
async function pdfToModel(file, onProg) {
  const pdf = await openPdfJs(new Uint8Array(await file.arrayBuffer()));
  const blocks = []; let chars = 0, firstPage = null;
  for (let pi = 1; pi <= pdf.numPages; pi++) {
    const page = await pdf.getPage(pi);
    const vp = page.getViewport({ scale: 1 });
    if (!firstPage) firstPage = vp;
    const tc = await page.getTextContent();
    // yazı tipi adları (kalın/italik tespiti)
    let fontNames = {};
    try { await page.getOperatorList(); for (const it of tc.items) if (it.fontName && !(it.fontName in fontNames)) { try { const f = page.commonObjs.get(it.fontName); fontNames[it.fontName] = (f && (f.name || f.loadedName)) || ""; } catch (e) { fontNames[it.fontName] = ""; } } } catch (e) {}
    const items = tc.items.filter(it => it.str !== undefined && it.transform).map(it => {
      const [a, b, c, d, e, f] = it.transform;
      const size = Math.hypot(c, d) || Math.hypot(a, b) || 12;
      const fname = (fontNames[it.fontName] || "") + " " + ((tc.styles[it.fontName] || {}).fontFamily || "");
      return { str: it.str, x: e, y: f, w: it.width, size, eol: it.hasEOL, bold: /bold|black|heavy|semibold|demi/i.test(fname), italic: /italic|oblique/i.test(fname), sans: !/serif|times|roman|georgia|garamond|cambria/i.test(fname) || /sans/i.test(fname) };
    }).filter(it => it.str.length || it.eol);
    // satırlara grupla
    items.sort((p, q) => (Math.abs(q.y - p.y) > Math.min(p.size, q.size) * 0.45 ? q.y - p.y : p.x - q.x));
    const lines = [];
    for (const it of items) {
      if (!it.str.trim() && !it.str) continue;
      const L = lines[lines.length - 1];
      if (L && Math.abs(L.y - it.y) <= Math.max(L.size, it.size) * 0.45) { L.items.push(it); L.size = Math.max(L.size, it.size); }
      else lines.push({ y: it.y, size: it.size, items: [it] });
    }
    for (const L of lines) {
      L.items.sort((p, q) => p.x - q.x);
      L.x0 = L.items[0].x; const last = L.items[L.items.length - 1]; L.x1 = last.x + last.w;
      // satır içi parçaları biçime göre birleştir
      const runs = []; let prevEnd = null;
      for (const it of L.items) {
        let s = it.str;
        if (prevEnd != null && it.x - prevEnd > it.size * 0.18 && runs.length && !/\s$/.test(runs[runs.length - 1].text) && !/^\s/.test(s)) s = " " + s;
        prevEnd = it.x + it.w;
        const r = runs[runs.length - 1];
        if (r && r.bold === it.bold && r.italic === it.italic && Math.abs(r.size - it.size) < 0.6) r.text += s;
        else runs.push({ text: s, bold: it.bold, italic: it.italic, size: Math.round(it.size * 2) / 2, family: it.sans ? "Arial" : "Times New Roman", underline: false, color: [0, 0, 0] });
      }
      L.runs = runs.filter(r => r.text);
      L.text = L.runs.map(r => r.text).join("");
    }
    const real = lines.filter(l => l.text.trim());
    chars += real.reduce((s, l) => s + l.text.trim().length, 0);
    if (!real.length) { onProg && onProg(pi / pdf.numPages); continue; }
    const maxRight = Math.max(...real.map(l => l.x1)), minLeft = Math.min(...real.map(l => l.x0));
    const fullW = maxRight - minLeft;
    let para = null, prev = null;
    const flush = () => { if (para) { para.runs = para.runs.filter(r => r.text); blocks.push(para); } para = null; };
    for (const L of real) {
      const gap = prev ? prev.y - L.y : 0;
      const lineH = prev ? Math.max(prev.size, L.size) * 1.25 : 0;
      const centered = Math.abs((L.x0 + L.x1) / 2 - (minLeft + maxRight) / 2) < fullW * 0.04 && (L.x1 - L.x0) < fullW * 0.8 && L.x0 - minLeft > fullW * 0.08;
      const startsNew = !prev || gap > lineH * 1.35 || (prev.x1 - prev.x0) < fullW * 0.82 || centered || prev.centered || /^\s*([0-9]+[.)-]|[a-zçğıöşü][.)]|[•\-–])\s/i.test(L.text) || L.x0 - minLeft > fullW * 0.04 && !(prev.x0 - minLeft > fullW * 0.04);
      L.centered = centered;
      if (startsNew) {
        flush();
        const indent = Math.max(0, L.x0 - minLeft);
        para = { type: "para", align: centered ? "center" : "justify", leftIndent: 0, rightIndent: 0, firstIndent: centered ? 0 : Math.round(indent), spaceAbove: prev && gap > lineH * 1.35 ? Math.min(18, Math.round(gap - lineH)) : 0, spaceBelow: 0, lineSpacing: 0, runs: L.runs.map(r => Object.assign({}, r)), baseSize: L.size, baseStyle: Object.assign({}, L.runs[0]) };
      } else {
        const lastRun = para.runs[para.runs.length - 1];
        const first = L.runs[0];
        if (lastRun && /[A-Za-zÇĞİÖŞÜçğıöşü]-$/.test(lastRun.text) && first && /^[a-zçğıöşü]/.test(first.text.trimStart())) { lastRun.text = lastRun.text.slice(0, -1); first.text = first.text.trimStart(); }
        else if (lastRun && !/\s$/.test(lastRun.text)) lastRun.text += " ";
        for (const r of L.runs) { const lr = para.runs[para.runs.length - 1]; if (lr && lr.bold === r.bold && lr.italic === r.italic && lr.size === r.size) lr.text += r.text; else para.runs.push(Object.assign({}, r)); }
      }
      prev = L;
    }
    flush();
    for (const b of blocks) if (b.runs.length) { const lastR = b.runs[b.runs.length - 1]; lastR.text = lastR.text.replace(/\s+$/, ""); if (b.runs.filter(r => r.text).length && b.align === "justify" && b.runs.reduce((s, r) => s + r.text.length, 0) < 60) b.align = "left"; }
    onProg && onProg(pi / pdf.numPages);
  }
  if (chars < 15) throw userErr(file.name + ": Bu PDF'te seçilebilir metin yok, büyük olasılıkla taranmış bir belge. Dönüştürmek için önce OCR gerekir.");
  const sizes = blocks.flatMap(b => b.runs.map(r => r.size)).sort((a, b) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)] || 12;
  const w = firstPage ? firstPage.width : 595;
  const landscape = firstPage ? firstPage.width > firstPage.height : false;
  return { page: { left: 70.9, right: 70.9, top: 56.7, bottom: 56.7, landscape }, blocks, base: { family: "Times New Roman", size: median, bold: false, italic: false, color: [0, 0, 0] } };
}

/* ================= e-Fatura ================= */
function b64Utf8(b64) { const bytes = b64ToBytes(b64); let s = new TextDecoder("utf-8").decode(bytes); return s.replace(/^﻿/, ""); }
async function collectInvoiceXmls(files) {
  const out = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name) || f.type === "application/zip") {
      const z = await JSZip.loadAsync(await f.arrayBuffer());
      const entries = Object.values(z.files).filter(e => !e.dir && /\.xml$/i.test(e.name));
      for (const e of entries) out.push({ name: e.name.split("/").pop(), text: await e.async("string") });
      if (!entries.length) out.push({ name: f.name, error: "ZIP içinde XML dosyası yok." });
    } else out.push({ name: f.name, text: await f.text() });
  }
  return out;
}
const byLocal = (el, name) => el ? [...el.getElementsByTagNameNS("*", name)] : [];
const firstLocal = (el, name) => byLocal(el, name)[0] || null;
const childLocal = (el, name) => el ? [...el.children].filter(c => c.localName === name) : [];
const txt = (el, ...path) => { let cur = el; for (const p of path) { cur = cur ? (childLocal(cur, p)[0] || null) : null; } return cur ? cur.textContent.trim() : ""; };
function findXslt(xmlDoc) {
  for (const o of byLocal(xmlDoc, "EmbeddedDocumentBinaryObject")) {
    const fn = (o.getAttribute("filename") || "").toLowerCase(), mime = (o.getAttribute("mimeCode") || "").toLowerCase();
    const raw = o.textContent.trim(); if (!raw) continue;
    if (fn.endsWith(".xslt") || fn.endsWith(".xsl") || mime.includes("xsl")) { try { return b64Utf8(raw); } catch (e) {} }
  }
  for (const o of byLocal(xmlDoc, "EmbeddedDocumentBinaryObject")) {
    try { const s = b64Utf8(o.textContent.trim()); if (/<xsl:stylesheet|<xsl:transform/.test(s.slice(0, 4000))) return s; } catch (e) {}
  }
  return null;
}
function trMoney(v, cur) { const n = +v; if (!isFinite(n)) return esc(v); return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (cur ? " " + (cur === "TRY" ? "TL" : cur) : ""); }
function partyHtml(party) {
  if (!party) return "";
  const name = txt(party, "PartyName", "Name") || [txt(party, "Person", "FirstName"), txt(party, "Person", "FamilyName")].filter(Boolean).join(" ");
  const ids = childLocal(party, "PartyIdentification").map(pi => { const id = childLocal(pi, "ID")[0]; return id ? `${esc(id.getAttribute("schemeID") || "No")}: ${esc(id.textContent.trim())}` : ""; }).filter(Boolean);
  const addr = childLocal(party, "PostalAddress")[0];
  const adr = addr ? [txt(addr, "StreetName"), txt(addr, "BuildingNumber"), txt(addr, "CitySubdivisionName"), txt(addr, "CityName")].filter(Boolean).join(" ") : "";
  const tax = txt(party, "PartyTaxScheme", "TaxScheme", "Name");
  return `<b>${esc(name)}</b>${adr ? "<br>" + esc(adr) : ""}${tax ? "<br>Vergi Dairesi: " + esc(tax) : ""}${ids.length ? "<br>" + ids.join("<br>") : ""}`;
}
function plainInvoiceHtml(xmlDoc) {
  const root = xmlDoc.documentElement;
  const kind = root.localName === "DespatchAdvice" ? "e-İrsaliye" : "e-Fatura";
  const cur = txt(root, "DocumentCurrencyCode") || "TRY";
  const sup = childLocal(root, "AccountingSupplierParty")[0] || childLocal(root, "DespatchSupplierParty")[0];
  const cus = childLocal(root, "AccountingCustomerParty")[0] || childLocal(root, "DeliveryCustomerParty")[0];
  const lines = childLocal(root, "InvoiceLine").concat(childLocal(root, "DespatchLine"));
  const rows = lines.map((l, i) => {
    const q = childLocal(l, "InvoicedQuantity")[0] || childLocal(l, "DeliveredQuantity")[0];
    const price = txt(l, "Price", "PriceAmount"), amt = txt(l, "LineExtensionAmount");
    const tax = childLocal(l, "TaxTotal")[0]; const pct = tax ? txt(tax, "TaxSubtotal", "Percent") : "";
    return `<tr><td>${i + 1}</td><td>${esc(txt(l, "Item", "Name"))}</td><td class="r">${q ? esc((+q.textContent).toLocaleString("tr-TR")) + " " + esc(q.getAttribute("unitCode") || "") : ""}</td><td class="r">${price ? trMoney(price, cur) : ""}</td><td class="r">${pct ? "%" + esc(pct) : ""}</td><td class="r">${amt ? trMoney(amt, cur) : ""}</td></tr>`;
  }).join("");
  const lmt = childLocal(root, "LegalMonetaryTotal")[0];
  const taxes = childLocal(root, "TaxTotal").flatMap(t => childLocal(t, "TaxSubtotal")).map(s => `<tr><td>${esc(txt(s, "TaxCategory", "TaxScheme", "Name") || "Vergi")} ${txt(s, "Percent") ? "(%" + esc(txt(s, "Percent")) + ")" : ""}</td><td class="r">${trMoney(txt(s, "TaxAmount"), cur)}</td></tr>`).join("");
  const notes = childLocal(root, "Note").map(n => esc(n.textContent.trim())).filter(Boolean).join("<br>");
  const tot = (k, label) => { const v = txt(lmt, k); return v ? `<tr><td>${label}</td><td class="r">${trMoney(v, cur)}</td></tr>` : ""; };
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><style>
  body{font:12px/1.45 Arial,Helvetica,sans-serif;color:#111;margin:0;padding:28px 32px;width:730px}
  h1{font-size:20px;margin:0 0 2px} .sub{color:#555;margin-bottom:18px}
  .two{display:flex;gap:20px;margin-bottom:16px}.box{flex:1;border:1px solid #bbb;padding:10px;border-radius:4px}
  .box h3{margin:0 0 6px;font-size:11px;text-transform:uppercase;color:#666;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse} th,td{border:1px solid #bbb;padding:5px 6px;vertical-align:top} th{background:#f1f1f1;text-align:left}
  .r{text-align:right;white-space:nowrap} .meta td{border:0;padding:2px 6px 2px 0}
  .tot{width:50%;margin-left:auto;margin-top:12px} .tot tr:last-child td{font-weight:bold;background:#f1f1f1}
  .notes{margin-top:14px;color:#333}
  </style></head><body>
  <h1>${kind}</h1><div class="sub">${esc(txt(root, "ProfileID"))} · ${esc(txt(root, "InvoiceTypeCode") || txt(root, "DespatchAdviceTypeCode"))}</div>
  <table class="meta"><tr><td>Belge No:</td><td><b>${esc(txt(root, "ID"))}</b></td><td>Tarih:</td><td><b>${esc(txt(root, "IssueDate"))} ${esc(txt(root, "IssueTime"))}</b></td></tr><tr><td>ETTN:</td><td colspan="3">${esc(txt(root, "UUID"))}</td></tr></table><br>
  <div class="two"><div class="box"><h3>Satıcı</h3>${partyHtml(sup && childLocal(sup, "Party")[0])}</div><div class="box"><h3>Alıcı</h3>${partyHtml(cus && childLocal(cus, "Party")[0])}</div></div>
  <table><thead><tr><th>#</th><th>Mal / Hizmet</th><th class="r">Miktar</th><th class="r">Birim Fiyat</th><th class="r">KDV</th><th class="r">Tutar</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="tot">${tot("LineExtensionAmount", "Mal/Hizmet Toplamı")}${tot("AllowanceTotalAmount", "Toplam İskonto")}${taxes}${tot("TaxInclusiveAmount", "Vergiler Dahil Toplam")}${tot("PayableAmount", "Ödenecek Tutar")}</table>
  ${notes ? `<div class="notes"><b>Notlar:</b><br>${notes}</div>` : ""}
  </body></html>`;
}
function invoiceHtml(xmlText, mode) {
  const xmlDoc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (xmlDoc.getElementsByTagName("parsererror").length) throw userErr("XML okunamadı, dosya bozuk olabilir.");
  const ln = xmlDoc.documentElement.localName;
  if (!["Invoice", "DespatchAdvice", "CreditNote", "ApplicationResponse"].includes(ln)) throw userErr("Bu XML bir e-Fatura/e-Arşiv belgesi gibi görünmüyor.");
  let note = "";
  if (mode === "xslt") {
    const xslt = findXslt(xmlDoc);
    if (xslt && typeof XSLTProcessor !== "undefined") {
      try {
        const xsl = new DOMParser().parseFromString(xslt, "application/xml");
        const p = new XSLTProcessor(); p.importStylesheet(xsl);
        const out = p.transformToDocument(xmlDoc);
        if (out && out.documentElement) {
          let html = out.documentElement.outerHTML || new XMLSerializer().serializeToString(out);
          if (html.length > 200) return { html: "<!DOCTYPE html>" + html, note: "" };
        }
      } catch (e) { console.warn(e); }
      note = "Faturanın kendi tasarımı uygulanamadı, sade şablon kullanıldı.";
    } else if (!xslt) note = "Faturada gömülü tasarım yok, sade şablon kullanıldı.";
    else note = "Tarayıcınız fatura tasarımını desteklemiyor, sade şablon kullanıldı.";
  }
  return { html: plainInvoiceHtml(xmlDoc), note };
}
async function htmlToPdf(html, frame) {
  frame.classList.add("on");
  await new Promise(res => { frame.onload = res; frame.srcdoc = html; setTimeout(res, 4000); });
  await sleep(120);
  const d = frame.contentDocument;
  if (!d || !d.body) throw userErr("Fatura görünümü oluşturulamadı.");
  const imgs = [...d.images]; await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 2000); })));
  const width = Math.max(794, d.documentElement.scrollWidth);
  const canvas = await html2canvas(d.documentElement, { scale: 2, backgroundColor: "#ffffff", windowWidth: width, width, height: d.documentElement.scrollHeight, logging: false, useCORS: false });
  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.create();
  const PW = 595.28, PH = 841.89, M = 18;
  const scale = (PW - 2 * M) / canvas.width;
  const sliceH = Math.floor((PH - 2 * M) / scale);
  for (let y0 = 0; y0 < canvas.height; y0 += sliceH) {
    const h = Math.min(sliceH, canvas.height - y0);
    if (h < 8 && y0 > 0) break;
    const c = document.createElement("canvas"); c.width = canvas.width; c.height = h;
    const cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, h); cx.drawImage(canvas, 0, y0, canvas.width, h, 0, 0, canvas.width, h);
    const bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, "image/jpeg", 0.9))).arrayBuffer());
    const img = await pdf.embedJpg(bytes);
    const page = pdf.addPage([PW, PH]);
    page.drawImage(img, { x: M, y: PH - M - h * scale, width: canvas.width * scale, height: h * scale });
  }
  pdf.setProducer("Evrakçevir");
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

/* ================= görsel yardımcıları ================= */
function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => res({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); rej(userErr(file.name + ": Görsel açılamadı. HEIC ise telefonda JPG olarak kaydedin.")); };
    img.src = url;
  });
}
async function imageToJpegBytes(img, { rot = 0, maxSide = 2000, gray = false, quality = 0.88 } = {}) {
  let w = img.naturalWidth, h = img.naturalHeight;
  const k = Math.min(1, maxSide / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
  const swap = rot % 180 !== 0;
  const c = document.createElement("canvas"); c.width = swap ? h : w; c.height = swap ? w : h;
  const cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height);
  cx.translate(c.width / 2, c.height / 2); cx.rotate(rot * Math.PI / 180);
  if (gray) cx.filter = "grayscale(1) contrast(1.15)";
  cx.drawImage(img, -w / 2, -h / 2, w, h);
  const blob = await new Promise(r => c.toBlob(r, "image/jpeg", quality));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height };
}

/* UDF -> PDF */
if (document.getElementById("f-udf-pdf")) {
const sUdfPdf = fileList("udf-pdf", { accept: /\.udf$/i });
runner("udf-pdf", async () => {
  const out = [];
  for (let i = 0; i < sUdfPdf.files.length; i++) {
    const f = sUdfPdf.files[i];
    setStatus("udf-pdf", `${i + 1}/${sUdfPdf.files.length}: ${f.name} dönüştürülüyor…`);
    try { const m = await readUdfFile(f); out.push({ name: baseName(f.name) + ".pdf", blob: await modelToPdf(m) }); }
    catch (e) { console.error(e); out.push({ name: f.name, error: e.userMsg || "Dönüştürülemedi: " + e.message }); }
    setProgress("udf-pdf", (i + 1) / sUdfPdf.files.length);
  }
  showResults("udf-pdf", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("udf-pdf", ok ? `${ok} dosya hazır.` : "Dönüştürülebilen dosya olmadı.", ok ? "ok" : "err");
});
}
/* UDF -> Word */
if (document.getElementById("f-udf-word")) {
const sUdfWord = fileList("udf-word", { accept: /\.udf$/i });
runner("udf-word", async () => {
  const out = [];
  for (let i = 0; i < sUdfWord.files.length; i++) {
    const f = sUdfWord.files[i];
    setStatus("udf-word", `${i + 1}/${sUdfWord.files.length}: ${f.name} dönüştürülüyor…`);
    try { const m = await readUdfFile(f); const { blob, skippedImg } = await modelToDocx(m); out.push({ name: baseName(f.name) + ".docx", blob, note: skippedImg ? `${skippedImg} görsel aktarılmadı.` : "" }); }
    catch (e) { console.error(e); out.push({ name: f.name, error: e.userMsg || "Dönüştürülemedi: " + e.message }); }
    setProgress("udf-word", (i + 1) / sUdfWord.files.length);
  }
  showResults("udf-word", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("udf-word", ok ? `${ok} dosya hazır.` : "Dönüştürülebilen dosya olmadı.", ok ? "ok" : "err");
});
}
/* Word -> UDF */
if (document.getElementById("f-word-udf")) {
const sWordUdf = fileList("word-udf", { accept: /\.docx$/i });
runner("word-udf", async () => {
  const out = [];
  for (let i = 0; i < sWordUdf.files.length; i++) {
    const f = sWordUdf.files[i];
    setStatus("word-udf", `${i + 1}/${sWordUdf.files.length}: ${f.name} dönüştürülüyor…`);
    try { const { model, imgSkipped } = await readDocx(f); out.push({ name: baseName(f.name) + ".udf", blob: await modelToUdf(model), note: imgSkipped ? `${imgSkipped} görsel UDF'ye aktarılmadı.` : "" }); }
    catch (e) { console.error(e); out.push({ name: f.name, error: e.userMsg || "Dönüştürülemedi: " + e.message }); }
    setProgress("word-udf", (i + 1) / sWordUdf.files.length);
  }
  showResults("word-udf", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("word-udf", ok ? `${ok} dosya hazır.` : "Dönüştürülebilen dosya olmadı.", ok ? "ok" : "err");
});
}
/* PDF -> UDF */
if (document.getElementById("f-pdf-udf")) {
const sPdfUdf = fileList("pdf-udf", { accept: /\.pdf$|application\/pdf/i });
runner("pdf-udf", async () => {
  const out = [], n = sPdfUdf.files.length;
  for (let i = 0; i < n; i++) {
    const f = sPdfUdf.files[i];
    setStatus("pdf-udf", `${i + 1}/${n}: ${f.name} okunuyor…`);
    try { const m = await pdfToModel(f, p => setProgress("pdf-udf", (i + p) / n)); out.push({ name: baseName(f.name) + ".udf", blob: await modelToUdf(m) }); }
    catch (e) { console.error(e); out.push({ name: f.name, error: e.userMsg || "Dönüştürülemedi: " + e.message }); }
  }
  showResults("pdf-udf", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("pdf-udf", ok ? `${ok} dosya hazır.` : "Dönüştürülebilen dosya olmadı.", ok ? "ok" : "err");
});
}
/* e-Fatura */
if (document.getElementById("f-efatura")) {
const sEf = fileList("efatura", { accept: /\.(xml|zip)$/i });
runner("efatura", async () => {
  const mode = document.querySelector('input[name="ef-mode"]:checked').value;
  const frame = $("#v-efatura");
  setStatus("efatura", "XML dosyaları okunuyor…");
  const xmls = await collectInvoiceXmls(sEf.files);
  const out = [];
  for (let i = 0; i < xmls.length; i++) {
    const x = xmls[i];
    if (x.error) { out.push({ name: x.name, error: x.error }); continue; }
    setStatus("efatura", `${i + 1}/${xmls.length}: ${x.name} hazırlanıyor…`);
    try { const { html, note } = invoiceHtml(x.text, mode); const blob = await htmlToPdf(html, frame); out.push({ name: baseName(x.name) + ".pdf", blob, note }); }
    catch (e) { console.error(e); out.push({ name: x.name, error: e.userMsg || "Dönüştürülemedi: " + e.message }); }
    setProgress("efatura", (i + 1) / xmls.length);
  }
  showResults("efatura", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("efatura", ok ? `${ok} fatura hazır. Önizlemede son fatura görünüyor.` : "Dönüştürülebilen fatura olmadı.", ok ? "ok" : "err");
});
}
/* Kimlik */
if (document.getElementById("f-on")) {
const idState = { on: null, arka: null };
for (const side of ["on", "arka"]) {
  const input = $("#f-" + side), zone = $("#z-" + side), note = $("#n-" + side), rot = $("#rot-" + side);
  async function setFile(f) {
    if (!f) return;
    try {
      const { img, url } = await loadImage(f);
      idState[side] = { img, rot: 0, name: f.name };
      zone.innerHTML = ""; zone.appendChild(input);
      const pv = document.createElement("img"); pv.src = url; pv.alt = side === "on" ? "Ön yüz" : "Arka yüz"; zone.appendChild(pv);
      note.textContent = f.name; rot.disabled = false;
    } catch (e) { toast(e.userMsg || "Görsel açılamadı."); }
    $("#b-kimlik").disabled = !(idState.on || idState.arka); $("#r-kimlik").innerHTML = ""; setStatus("kimlik", "");
  }
  input.addEventListener("change", () => { setFile(input.files[0]); input.value = ""; });
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", e => { e.preventDefault(); zone.classList.remove("over"); setFile(e.dataTransfer.files[0]); });
  (HANDOFF.kimlik = HANDOFF.kimlik || { sides: [] }).sides.push(setFile);
  rot.addEventListener("click", () => { const s = idState[side]; if (!s) return; s.rot = (s.rot + 90) % 360; const pv = zone.querySelector("img"); if (pv) pv.style.transform = `rotate(${s.rot}deg)`; });
}
$("#b-kimlik").addEventListener("click", async () => {
  const btn = $("#b-kimlik"); btn.disabled = true; setStatus("kimlik", "Hazırlanıyor…");
  try {
    await ensureLibs();
    const { PDFDocument, rgb } = PDFLib;
    const big = document.querySelector('input[name="id-size"]:checked').value === "big";
    const gray = $("#id-gray").checked;
    const mm = v => v * 72 / 25.4;
    const PW = 595.28, PH = 841.89;
    const boxW = big ? mm(150) : mm(85.6), boxH = big ? mm(150 * 54 / 85.6) : mm(54);
    const doc = await PDFDocument.create(); const page = doc.addPage([PW, PH]);
    const gap = big ? mm(18) : mm(25);
    const totalH = boxH * 2 + gap;
    let top = big ? (PH + totalH) / 2 : PH - mm(35);
    for (const side of ["on", "arka"]) {
      const s = idState[side];
      const x = (PW - boxW) / 2, y = top - boxH;
      if (s) {
        const j = await imageToJpegBytes(s.img, { rot: s.rot, maxSide: 2400, gray, quality: 0.9 });
        const im = await doc.embedJpg(j.bytes);
        const k = Math.min(boxW / j.w, boxH / j.h); const w = j.w * k, h = j.h * k;
        page.drawImage(im, { x: x + (boxW - w) / 2, y: y + (boxH - h) / 2, width: w, height: h });
      } else page.drawRectangle({ x, y, width: boxW, height: boxH, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, borderDashArray: [3, 3] });
      top = y - gap;
    }
    doc.setProducer("Evrakçevir");
    showResults("kimlik", [{ name: "kimlik-on-arka.pdf", blob: new Blob([await doc.save()], { type: "application/pdf" }) }]);
    setStatus("kimlik", "PDF hazır.", "ok");
  } catch (e) { console.error(e); setStatus("kimlik", e.userMsg || "Bir hata oluştu: " + e.message, "err"); }
  finally { btn.disabled = false; }
});
}
/* Birleştir */
if (document.getElementById("f-birlestir")) {
const sMg = fileList("birlestir", { reorder: true, accept: /\.(pdf|jpe?g|png)$|application\/pdf|image\/(jpeg|png)/i });
runner("birlestir", async () => {
  const { PDFDocument } = PDFLib;
  const out = await PDFDocument.create();
  const fitA4 = $("#mg-a4").checked;
  const n = sMg.files.length; const skipped = [];
  for (let i = 0; i < n; i++) {
    const f = sMg.files[i];
    setStatus("birlestir", `${i + 1}/${n}: ${f.name}`);
    try {
      if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
        const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p));
      } else {
        const { img, url } = await loadImage(f);
        const j = await imageToJpegBytes(img, { maxSide: 2400, quality: 0.86 }); URL.revokeObjectURL(url);
        const im = await out.embedJpg(j.bytes);
        if (fitA4) {
          const land = j.w > j.h; const PW = land ? 841.89 : 595.28, PH = land ? 595.28 : 841.89, M = 28;
          const k = Math.min((PW - 2 * M) / j.w, (PH - 2 * M) / j.h); const w = j.w * k, h = j.h * k;
          out.addPage([PW, PH]).drawImage(im, { x: (PW - w) / 2, y: (PH - h) / 2, width: w, height: h });
        } else { const w = j.w * 0.75, h = j.h * 0.75; out.addPage([w, h]).drawImage(im, { x: 0, y: 0, width: w, height: h }); }
      }
    } catch (e) { console.error(e); skipped.push(f.name); }
    setProgress("birlestir", (i + 1) / n);
  }
  if (!out.getPageCount()) throw userErr("Hiçbir dosya eklenemedi. PDF'ler şifreli veya bozuk olabilir.");
  out.setProducer("Evrakçevir");
  const blob = new Blob([await out.save({ useObjectStreams: true })], { type: "application/pdf" });
  showResults("birlestir", [{ name: "birlesik-evrak.pdf", blob, note: `${out.getPageCount()} sayfa` + (skipped.length ? ` · Eklenemeyen: ${skipped.join(", ")}` : "") }]);
  setStatus("birlestir", "Birleştirildi.", skipped.length ? "warn" : "ok");
});
}
/* Sıkıştır */
if (document.getElementById("f-sikistir")) {
const sCz = fileList("sikistir", { multiple: false, accept: /\.pdf$|application\/pdf/i });
document.querySelectorAll('input[name="cz-t"]').forEach(r => r.addEventListener("change", () => { $("#cz-custom-row").style.display = r.value === "custom" && r.checked ? "block" : "none"; }));
async function rasterizePdf(pdf, { dpi, quality, gray }, onProg) {
  const { PDFDocument } = PDFLib;
  const out = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: dpi / 72 });
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(vp.width)); c.height = Math.max(1, Math.round(vp.height));
    const cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: cx, viewport: vp }).promise;
    if (gray) { const d = cx.getImageData(0, 0, c.width, c.height), a = d.data; for (let k = 0; k < a.length; k += 4) { const g = a[k] * 0.299 + a[k + 1] * 0.587 + a[k + 2] * 0.114; a[k] = a[k + 1] = a[k + 2] = g; } cx.putImageData(d, 0, 0); }
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", quality));
    const im = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    out.addPage([vp1.width, vp1.height]).drawImage(im, { x: 0, y: 0, width: vp1.width, height: vp1.height });
    page.cleanup(); c.width = c.height = 0;
    onProg && onProg(i / pdf.numPages);
  }
  out.setProducer("Evrakçevir");
  return new Blob([await out.save({ useObjectStreams: true })], { type: "application/pdf" });
}
runner("sikistir", async () => {
  const f = sCz.files[0];
  const sel = document.querySelector('input[name="cz-t"]:checked').value;
  const targetMB = sel === "custom" ? Math.max(0.05, +$("#cz-custom").value || 2) : +sel;
  const target = targetMB * 1048576 * 0.985;
  const gray = $("#cz-gray").checked;
  const bytes = new Uint8Array(await f.arrayBuffer());
  const label = (targetMB + "").replace(".", ",") + " MB";
  const outName = baseName(f.name) + "-kucuk.pdf";
  if (f.size <= target && !gray) { showResults("sikistir", [{ name: f.name, blob: f, note: "Dosya zaten sınırın altında, değiştirilmedi." }]); setStatus("sikistir", `Dosya zaten ${label} altında (${fmtSize(f.size)}).`, "ok"); return; }
  // 1) kayıpsız
  let best = null;
  if (!gray) {
    setStatus("sikistir", "Kayıpsız küçültme deneniyor…");
    try {
      const src = await PDFLib.PDFDocument.load(bytes.slice(0), { ignoreEncryption: true, updateMetadata: false });
      const b = new Blob([await src.save({ useObjectStreams: true })], { type: "application/pdf" });
      if (b.size < f.size) best = { blob: b, how: "kayıpsız" };
      if (b.size <= target) { showResults("sikistir", [{ name: outName, blob: b, note: `${fmtSize(f.size)} → ${fmtSize(b.size)} · Kalite kaybı yok, metin seçilebilir.` }]); setStatus("sikistir", `${label} altına indi.`, "ok"); return; }
    } catch (e) { console.warn(e); }
  }
  // 2) kademeli görüntüleme
  const pdf = await openPdfJs(bytes.slice(0));
  const steps = [{ dpi: 150, quality: 0.78 }, { dpi: 125, quality: 0.68 }, { dpi: 110, quality: 0.6 }, { dpi: 96, quality: 0.52 }, { dpi: 82, quality: 0.46 }, { dpi: 70, quality: 0.4 }, { dpi: 60, quality: 0.35 }];
  for (let s = 0; s < steps.length; s++) {
    const st = steps[s];
    setStatus("sikistir", `Kademe ${s + 1}/${steps.length}: ${st.dpi} dpi deneniyor…`);
    const b = await rasterizePdf(pdf, Object.assign({ gray }, st), p => setProgress("sikistir", (s + p) / steps.length));
    if (!best || b.size < best.blob.size) best = { blob: b, how: st.dpi + " dpi" };
    if (b.size <= target) {
      showResults("sikistir", [{ name: outName, blob: b, note: `${fmtSize(f.size)} → ${fmtSize(b.size)} · ${st.dpi} dpi${gray ? ", siyah-beyaz" : ""}. Sayfalar görüntüye çevrildi.` }]);
      setStatus("sikistir", `${label} altına indi.`, "ok"); return;
    }
  }
  showResults("sikistir", [{ name: outName, blob: best.blob, note: `${fmtSize(f.size)} → ${fmtSize(best.blob.size)} (en küçük sonuç).` }]);
  setStatus("sikistir", `${label} sınırına inilemedi. En küçük sonuç ${fmtSize(best.blob.size)}. Sayfa sayısı çoksa belgeyi bölüp ayrı yüklemeyi deneyin${gray ? "" : " ya da siyah-beyaz seçeneğini açın"}.`, "warn");
});
}


/* ================= ASN.1 / CMS (e-imza .imz) ================= */
function derParse(b, pos, end, depth) {
  depth = depth || 0; if (depth > 60) throw userErr("İmza dosyası çok derin iç içe, okunamadı.");
  const nodes = [];
  while (pos < end) {
    if (b[pos] === 0 && b[pos + 1] === 0) return { nodes, pos: pos + 2 };
    const tag = b[pos++]; let num = tag & 0x1f;
    if (num === 0x1f) { num = 0; let x; do { x = b[pos++]; num = num * 128 + (x & 0x7f); } while (x & 0x80); }
    let len = b[pos++]; let indef = false;
    if (len === 0x80) indef = true;
    else if (len & 0x80) { const n = len & 0x7f; if (n > 4) throw userErr("Geçerli bir e-imza dosyası değil."); len = 0; for (let i = 0; i < n; i++) len = len * 256 + b[pos++]; }
    const constructed = !!(tag & 0x20);
    const node = { tag, cls: tag >> 6, num, constructed, start: pos };
    if (indef) { if (!constructed) throw userErr("Geçerli bir e-imza dosyası değil."); const r = derParse(b, pos, end, depth + 1); node.children = r.nodes; node.end = r.pos - 2; pos = r.pos; }
    else {
      if (pos + len > end) throw userErr("İmza dosyası eksik ya da bozuk.");
      node.end = pos + len;
      if (constructed) node.children = derParse(b, pos, pos + len, depth + 1).nodes;
      pos += len;
    }
    nodes.push(node);
  }
  return { nodes, pos };
}
function derBytes(b, n) {
  if (!n.constructed) return b.subarray(n.start, n.end);
  const parts = n.children.map(c => derBytes(b, c)); const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
function derOid(b, n) {
  const v = b.subarray(n.start, n.end); if (!v.length) return "";
  const out = [Math.floor(v[0] / 40), v[0] % 40]; let x = 0;
  for (let i = 1; i < v.length; i++) { x = x * 128 + (v[i] & 0x7f); if (!(v[i] & 0x80)) { out.push(x); x = 0; } }
  return out.join(".");
}
const derText = (b, n) => new TextDecoder(n.num === 30 ? "utf-16be" : "utf-8").decode(b.subarray(n.start, n.end));
function nameAttr(b, nameNode, oid) {
  for (const set of (nameNode && nameNode.children) || []) for (const atv of set.children || []) { const [o, v] = atv.children || []; if (o && v && derOid(b, o) === oid) return derText(b, v); }
  return "";
}
function derTime(b, n) {
  const s = new TextDecoder().decode(b.subarray(n.start, n.end));
  const m = n.num === 23 ? s.match(/^(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)?Z/) : s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)?/);
  if (!m) return null;
  let y = +m[1]; if (n.num === 23) y += y < 50 ? 2000 : 1900;
  return new Date(Date.UTC(y, +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
}
const OID_SIGNED = "1.2.840.113549.1.7.2", OID_CN = "2.5.4.3", OID_SIGNTIME = "1.2.840.113549.1.9.5";
function parseCms(bytes) {
  const b = bytes;
  const root = derParse(b, 0, b.length).nodes[0];
  if (!root || !root.children || !root.children[0] || derOid(b, root.children[0]) !== OID_SIGNED) return null;
  const sd = root.children[1].children[0];
  const kids = sd.children;
  const eci = kids[2];
  let content = null;
  if (eci.children[1]) { const ex = eci.children[1]; const os = ex.children ? ex.children[0] : null; if (os) content = derBytes(b, os); }
  let certs = [], signerInfos = null;
  for (let i = 3; i < kids.length; i++) {
    const k = kids[i];
    if (k.cls === 2 && k.num === 0) certs = k.children || [];
    else if (k.cls === 0 && k.num === 17) signerInfos = k;
  }
  const certInfo = certs.filter(c => c.num === 16 && c.children).map(c => {
    const tbs = c.children[0]; const off = (tbs.children[0].cls === 2) ? 1 : 0;
    const serial = Array.from(b.subarray(tbs.children[off].start, tbs.children[off].end)).join(",");
    return { serial, subject: nameAttr(b, tbs.children[off + 4], OID_CN), issuer: nameAttr(b, tbs.children[off + 2], OID_CN) };
  });
  const signers = (signerInfos ? signerInfos.children : []).map(si => {
    const sid = si.children[1]; let cert = null;
    if (sid && sid.num === 16 && sid.children && sid.children[1]) { const ser = Array.from(b.subarray(sid.children[1].start, sid.children[1].end)).join(","); cert = certInfo.find(c => c.serial === ser); }
    let time = null;
    const sa = si.children.find(c => c.cls === 2 && c.num === 0);
    if (sa) for (const attr of sa.children || []) { if (attr.children && derOid(b, attr.children[0]) === OID_SIGNTIME) { const v = attr.children[1].children[0]; time = derTime(b, v); } }
    return { name: cert ? cert.subject : (certInfo[0] ? certInfo[0].subject : ""), issuer: cert ? cert.issuer : "", time };
  });
  return { content, signers };
}
function sniffExt(u) {
  const head = new TextDecoder("latin1").decode(u.subarray(0, 8));
  if (head.startsWith("%PDF")) return "pdf";
  if (u[0] === 0xFF && u[1] === 0xD8) return "jpg";
  if (u[0] === 0x89 && head.slice(1, 4) === "PNG") return "png";
  if (head.startsWith("PK")) return "zip";
  if (head.startsWith("II*") || head.startsWith("MM\u0000*")) return "tif";
  const t = new TextDecoder("utf-8").decode(u.subarray(0, 300)).replace(/^﻿/, "").trimStart();
  if (t.startsWith("<")) return "xml";
  return "bin";
}
async function refineZipExt(u) {
  try { const z = await JSZip.loadAsync(u); if (z.file("word/document.xml")) return "docx"; if (z.file("xl/workbook.xml")) return "xlsx"; if (z.file(/^Ustveri\//i).length || z.file(/^UstYazi\//i).length) return "eyp"; if (z.file("content.xml") && !z.file("mimetype")) return "udf"; } catch (e) {}
  return "zip";
}
async function openImz(file) {
  let bytes = new Uint8Array(await file.arrayBuffer());
  const asText = new TextDecoder("latin1").decode(bytes.subarray(0, 64)).trim();
  if (/^-----BEGIN|^MI[A-Za-z0-9+/]/.test(asText)) { try { bytes = b64ToBytes(new TextDecoder().decode(bytes).replace(/-----[^-]+-----/g, "")); } catch (e) {} }
  let name = file.name.replace(/\.(imz|p7s|p7m|cades)$/i, ""), allSigners = [], layers = 0, cms;
  for (;;) {
    try { cms = parseCms(bytes); } catch (e) { if (layers === 0) throw (e.userMsg ? e : userErr(file.name + ": Geçerli bir e-imza (.imz) dosyası değil.")); cms = null; }
    if (!cms) break;
    layers++; allSigners.push(...cms.signers);
    if (!cms.content) { if (layers === 1) throw userErr(file.name + ": Bu imza dosyası belgenin kendisini içermiyor (ayrık imza). Belge ayrı bir dosya olarak gelmiş olmalı."); break; }
    bytes = cms.content; name = name.replace(/\.(imz|p7s|p7m)$/i, "");
    if (layers > 6) break;
  }
  if (!layers) throw userErr(file.name + ": Geçerli bir e-imza (.imz / CAdES) dosyası değil.");
  let ext = sniffExt(bytes); if (ext === "zip") ext = await refineZipExt(bytes);
  if (ext !== "bin" && !name.toLowerCase().endsWith("." + ext)) name = name.replace(/\.(pdf|udf|docx|xlsx|xml|jpg|png|tif|zip|bin|eyp)$/i, "") + "." + ext;
  return { name, blob: new Blob([bytes]), ext, signers: allSigners, layers };
}
const fmtDate = d => d ? d.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "long", timeStyle: "short" }) : "";
if (document.getElementById("f-imz")) {
const sImz = fileList("imz", { accept: /\.(imz|p7s|p7m)$/i });
runner("imz", async () => {
  const out = [];
  for (let i = 0; i < sImz.files.length; i++) {
    const f = sImz.files[i];
    setStatus("imz", `${i + 1}/${sImz.files.length}: ${f.name} açılıyor…`);
    try {
      const r = await openImz(f);
      const who = r.signers.filter(s => s.name).map(s => s.name + (s.time ? " · " + fmtDate(s.time) : "")).join(" | ");
      const hint = r.ext === "udf" ? " İçerik bir UDF dosyası. PDF'e çevirmek için UDF → PDF aracını kullanın." : r.ext === "eyp" ? " İçerik bir e-Yazışma paketi. EYP açma aracını kullanın." : "";
      out.push({ name: r.name, blob: r.blob, note: (who ? "İmzalayan: " + who + "." : "İmzalayan bilgisi okunamadı.") + (r.layers > 1 ? ` ${r.layers} kat imza çözüldü.` : "") + hint });
    } catch (e) { console.error(e); out.push({ name: f.name, error: e.userMsg || "Açılamadı: " + e.message }); }
    setProgress("imz", (i + 1) / sImz.files.length);
  }
  showResults("imz", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("imz", ok ? `${ok} belge çıkarıldı.` : "Belge çıkarılamadı.", ok ? "ok" : "err");
});
}

/* ================= EYP (e-Yazışma Paketi) ================= */
async function openEyp(file) {
  let z;
  try { z = await JSZip.loadAsync(await file.arrayBuffer()); } catch (e) { throw userErr(file.name + ": Paket açılamadı. Dosya bozuk ya da şifreli olabilir."); }
  const dec = n => { try { return decodeURIComponent(n); } catch (e) { return n; } };
  const entries = Object.values(z.files).filter(e => !e.dir);
  const pick = re => entries.filter(e => re.test(dec(e.name)));
  const ust = pick(/^\/?UstYazi\//i), ekler = pick(/^\/?Ekler\//i), uv = pick(/(^|\/)Ustveri\.xml$/i)[0];
  if (!ust.length && !ekler.length) {
    if (pick(/sifre/i).length) throw userErr(file.name + ": Bu paket şifreli. Şifreli paketler yalnızca alıcı kurumun anahtarıyla açılabilir.");
    throw userErr(file.name + ": Pakette üst yazı ya da ek bulunamadı. Geçerli bir .eyp dosyası olmayabilir.");
  }
  const meta = {};
  if (uv) {
    try {
      const d = new DOMParser().parseFromString(await uv.async("string"), "application/xml");
      const get = n => { const el = d.getElementsByTagNameNS("*", n)[0]; return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; };
      meta.konu = get("Konu"); meta.tarih = get("Tarih"); meta.no = get("BelgeNo");
      const ol = d.getElementsByTagNameNS("*", "Olusturan")[0];
      if (ol) { const adi = ol.getElementsByTagNameNS("*", "Adi")[0] || ol.getElementsByTagNameNS("*", "Ad")[0]; meta.olusturan = (adi ? adi.textContent : ol.textContent).replace(/\s+/g, " ").trim().slice(0, 160); }
    } catch (e) {}
  }
  const items = [];
  for (const [list, label] of [[ust, "Üst yazı"], [ekler, "Ek"]]) for (const e of list) {
    const blob = await e.async("blob"); const nm = dec(e.name).split("/").pop();
    items.push({ name: nm, blob, note: label + (/\.imz$/i.test(nm) ? " · e-imzalı dosya, İMZ açma aracıyla içindeki belgeyi çıkarabilirsiniz." : "") });
  }
  return { meta, items };
}
if (document.getElementById("f-eyp")) {
const sEyp = fileList("eyp", { accept: /\.eyp$/i });
runner("eyp", async () => {
  const out = []; const metaBox = $("#m-eyp"); metaBox.innerHTML = "";
  for (let i = 0; i < sEyp.files.length; i++) {
    const f = sEyp.files[i];
    setStatus("eyp", `${i + 1}/${sEyp.files.length}: ${f.name} açılıyor…`);
    try {
      const r = await openEyp(f);
      const m = r.meta; const rows = [["Konu", m.konu], ["Sayı", m.no], ["Tarih", m.tarih ? m.tarih.replace("T", " ").slice(0, 16) : ""], ["Gönderen", m.olusturan]].filter(x => x[1]);
      if (rows.length) metaBox.insertAdjacentHTML("beforeend", `<div class="meta-card"><b>${esc(f.name)}</b>${rows.map(([k, v]) => `<div><span>${k}</span>${esc(v)}</div>`).join("")}</div>`);
      out.push(...r.items);
    } catch (e) { console.error(e); out.push({ name: f.name, error: e.userMsg || "Açılamadı: " + e.message }); }
    setProgress("eyp", (i + 1) / sEyp.files.length);
  }
  showResults("eyp", out);
  const ok = out.filter(o => !o.error).length;
  setStatus("eyp", ok ? `${ok} belge çıkarıldı.` : "Paket açılamadı.", ok ? "ok" : "err");
});
}

/* ================= e-Fatura -> Excel ================= */
const colName = i => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
async function makeXlsx(sheets) {
  const z = new JSZip();
  const sx = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  sheets.forEach((sh, si) => {
    const rows = sh.rows.map((r, ri) => `<row r="${ri + 1}">` + r.map((v, ci) => {
      const ref = colName(ci) + (ri + 1);
      if (v === null || v === undefined || v === "") return "";
      if (typeof v === "number" && isFinite(v)) return `<c r="${ref}" s="${sh.money && sh.money.includes(ci) ? 2 : 0}"><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${sx(v)}</t></is></c>`;
    }).join("") + "</row>").join("");
    const cols = (sh.widths || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
    const last = colName(Math.max(0, sh.rows[0].length - 1)) + Math.max(1, sh.rows.length);
    z.file(`xl/worksheets/sheet${si + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${rows}</sheetData><autoFilter ref="A1:${last}"/></worksheet>`);
  });
  z.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  z.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  const defNames = sheets.map((s, i) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${sx(s.name)}'!$A$1:$${colName(s.rows[0].length - 1)}$${s.rows.length}</definedName>`).join("");
  z.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${sx(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><definedNames>${defNames}</definedNames></workbook>`);
  z.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  z.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEFF3"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs></styleSheet>`);
  return z.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
function partyInfo(party) {
  if (!party) return { name: "", id: "" };
  const name = txt(party, "PartyName", "Name") || [txt(party, "Person", "FirstName"), txt(party, "Person", "FamilyName")].filter(Boolean).join(" ");
  let id = "";
  for (const pi of childLocal(party, "PartyIdentification")) { const el = childLocal(pi, "ID")[0]; if (el && /^(VKN|TCKN)$/i.test(el.getAttribute("schemeID") || "")) { id = el.textContent.trim(); break; } }
  return { name, id };
}
const numOr = v => { const n = parseFloat(v); return isFinite(n) ? n : ""; };
function invoiceRows(xmlText, fname) {
  const d = new DOMParser().parseFromString(xmlText, "application/xml");
  if (d.getElementsByTagName("parsererror").length) throw userErr(fname + ": XML okunamadı.");
  const r = d.documentElement;
  if (!["Invoice", "CreditNote"].includes(r.localName)) throw userErr(fname + ": e-Fatura/e-Arşiv faturası değil.");
  const sup = partyInfo(childLocal(childLocal(r, "AccountingSupplierParty")[0] || r, "Party")[0]);
  const cus = partyInfo(childLocal(childLocal(r, "AccountingCustomerParty")[0] || r, "Party")[0]);
  const lmt = childLocal(r, "LegalMonetaryTotal")[0];
  const kdv = childLocal(r, "TaxTotal").reduce((s, t) => s + (parseFloat(txt(t, "TaxAmount")) || 0), 0);
  const no = txt(r, "ID"), date = txt(r, "IssueDate").split("-").reverse().join(".");
  const head = [no, date, txt(r, "InvoiceTypeCode"), txt(r, "ProfileID"), sup.name, sup.id, cus.name, cus.id, txt(r, "DocumentCurrencyCode") || "TRY",
    numOr(txt(lmt, "LineExtensionAmount")), numOr(txt(lmt, "AllowanceTotalAmount")), numOr(txt(lmt, "TaxExclusiveAmount")), Math.round(kdv * 100) / 100, numOr(txt(lmt, "TaxInclusiveAmount")), numOr(txt(lmt, "PayableAmount")), txt(r, "UUID"), fname];
  const lines = childLocal(r, "InvoiceLine").concat(childLocal(r, "CreditNoteLine")).map((l, i) => {
    const q = childLocal(l, "InvoicedQuantity")[0] || childLocal(l, "CreditedQuantity")[0];
    const tt = childLocal(l, "TaxTotal")[0];
    return [no, date, sup.name, i + 1, txt(l, "Item", "Name"), q ? numOr(q.textContent) : "", q ? (q.getAttribute("unitCode") || "") : "", numOr(txt(l, "Price", "PriceAmount")), tt ? numOr(txt(tt, "TaxSubtotal", "Percent")) : "", tt ? numOr(txt(tt, "TaxAmount")) : "", numOr(txt(l, "LineExtensionAmount"))];
  });
  return { head, lines };
}
if (document.getElementById("f-efatura-excel")) {
const sEx = fileList("efatura-excel", { accept: /\.(xml|zip)$/i });
runner("efatura-excel", async () => {
  setStatus("efatura-excel", "XML dosyaları okunuyor…");
  const xmls = await collectInvoiceXmls(sEx.files);
  const H = [["Fatura No", "Tarih", "Fatura Tipi", "Senaryo", "Satıcı", "Satıcı VKN/TCKN", "Alıcı", "Alıcı VKN/TCKN", "Para Birimi", "Mal/Hizmet Toplamı", "İskonto", "Vergi Hariç Tutar", "Toplam Vergi", "Vergiler Dahil Toplam", "Ödenecek Tutar", "ETTN", "Dosya"]];
  const L = [["Fatura No", "Tarih", "Satıcı", "Sıra", "Mal / Hizmet", "Miktar", "Birim", "Birim Fiyat", "KDV %", "KDV Tutarı", "Tutar"]];
  const bad = [];
  xmls.forEach((x, i) => {
    if (x.error) { bad.push(x.name); return; }
    try { const r = invoiceRows(x.text, x.name); H.push(r.head); L.push(...r.lines); } catch (e) { bad.push(x.name); }
    setProgress("efatura-excel", (i + 1) / xmls.length);
  });
  if (H.length === 1) throw userErr("Okunabilen fatura bulunamadı. Dosyaların e-Fatura/e-Arşiv XML'i olduğundan emin olun.");
  const blob = await makeXlsx([
    { name: "Faturalar", rows: H, money: [9, 10, 11, 12, 13, 14], widths: [20, 12, 12, 16, 34, 15, 34, 15, 8, 16, 12, 16, 14, 18, 16, 38, 24] },
    { name: "Kalemler", rows: L, money: [7, 9, 10], widths: [20, 12, 34, 6, 40, 10, 8, 14, 8, 14, 16] }]);
  showResults("efatura-excel", [{ name: "fatura-listesi.xlsx", blob, note: `${H.length - 1} fatura, ${L.length - 1} kalem.` + (bad.length ? ` Okunamayan: ${bad.slice(0, 5).join(", ")}${bad.length > 5 ? "…" : ""}` : "") }]);
  setStatus("efatura-excel", "Excel hazır.", bad.length ? "warn" : "ok");
});
}

/* ================= Dilekçe oluşturucu ================= */
const DILEKCE = {
  genel: { makam: "… VALİLİĞİNE / KAYMAKAMLIĞINA / MÜDÜRLÜĞÜNE", konu: "", metin: "…………… konusunda başvuruda bulunmak istiyorum.\n\nTalebimin ayrıntıları şöyledir: ……………………………………………\n\nGereğini bilgilerinize arz ederim." },
  istifa: { makam: "… A.Ş. İNSAN KAYNAKLARI MÜDÜRLÜĞÜNE", konu: "İstifa", metin: "…/…/…… tarihinden bu yana şirketinizde …………… olarak çalışmaktayım.\n\nİşbu dilekçe ile görevimden kendi isteğimle istifa ettiğimi bildiririm. Yasal bildirim süresinin sonunda iş sözleşmemin sona ermesini, ücret, kullanılmayan yıllık izin ve diğer işçilik alacaklarımın tarafıma ödenmesini ve çalışma belgemin verilmesini talep ederim.\n\nGereğini bilgilerinize arz ederim." },
  bilgi: { makam: "… BAŞKANLIĞINA / MÜDÜRLÜĞÜNE", konu: "4982 sayılı Kanun kapsamında bilgi edinme başvurusu", metin: "4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında aşağıda belirttiğim bilgi ve belgelerin tarafıma verilmesini talep ediyorum:\n\n1. ……………………………………………\n2. ……………………………………………\n\nİstediğim bilgi ve belgelerin aşağıdaki e-posta ya da posta adresime gönderilmesini rica ederim.\n\nGereğini bilgilerinize arz ederim." },
};
function dilekceModel(d) {
  const base = { family: "Times New Roman", size: 12, bold: false, italic: false, underline: false, color: [0, 0, 0] };
  const P = (runs, o = {}) => ({ type: "para", align: o.align || "left", leftIndent: o.li || 0, rightIndent: 0, firstIndent: o.fi || 0, spaceAbove: o.sa || 0, spaceBelow: o.sb || 0, lineSpacing: o.ls || 0, runs: (Array.isArray(runs) ? runs : runs ? [typeof runs === "string" ? { text: runs } : runs] : []).map(r => Object.assign({}, base, r)), baseSize: 12, baseStyle: base });
  const B = [];
  B.push(P({ text: (d.makam || "").toLocaleUpperCase("tr-TR"), bold: true }, { align: "center" }));
  B.push(P(""), P(""));
  const TABS = { "Konu": "\t\t\t", "Adres": "\t\t\t", "Telefon": "\t\t", "E-posta": "\t\t", "T.C. Kimlik No": "\t" };
  if (d.konu) { B.push(P([{ text: "Konu", bold: true }, { text: TABS["Konu"] + ": " + d.konu }])); B.push(P("")); }
  const paras = (d.metin || "").split(/\n\s*\n/);
  for (const para of paras) { const t = para.trim(); if (!t) continue; const isList = /^\d+[.)-]\s/m.test(t) && t.split("\n").length > 1; if (isList) t.split("\n").forEach(l => l.trim() && B.push(P(l.trim(), { align: "left", li: 35.4, sb: 4 }))); else B.push(P(t.replace(/\s*\n\s*/g, " "), { align: "justify", fi: 35.4, sb: 8, ls: 0.15 })); }
  B.push(P(""));
  B.push(P(d.tarih || "", { align: "right" }));
  B.push(P({ text: d.ad || "Ad Soyad", bold: true }, { align: "right" }));
  B.push(P("İmza", { align: "right" }));
  B.push(P(""), P(""));
  const info = [["T.C. Kimlik No", d.tc], ["Adres", d.adres], ["Telefon", d.tel], ["E-posta", d.eposta]].filter(x => x[1] && x[1].trim());
  for (const [k, v] of info) B.push(P([{ text: k, bold: true }, { text: TABS[k] + ": " + v.trim().replace(/\s*\n\s*/g, ", ") }]));
  const ekler = (d.ekler || "").split("\n").map(s => s.trim()).filter(Boolean);
  if (ekler.length) { B.push(P("")); B.push(P({ text: "Ekler", bold: true })); ekler.forEach((e, i) => B.push(P(`${i + 1}. ${e.replace(/^\d+[.)-]\s*/, "")}`))); }
  return { page: { left: 70.9, right: 70.9, top: 70.9, bottom: 56.7, landscape: false }, blocks: B, base };
}
if (document.getElementById("dl-form")) {
  const sel = $("#dl-tur");
  $("#dl-tarih").value = new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" });
  const applyPreset = (k, force) => {
    const p = DILEKCE[k]; if (!p) return;
    for (const f of ["makam", "konu", "metin"]) { const el = $("#dl-" + f); if (force || !el.value.trim() || el.dataset.auto === "1") { el.value = p[f]; el.dataset.auto = "1"; } }
  };
  ["makam", "konu", "metin"].forEach(f => $("#dl-" + f).addEventListener("input", e => { e.target.dataset.auto = "0"; }));
  sel.addEventListener("change", () => applyPreset(sel.value, false));
  applyPreset(sel.value, true);
  const read = () => Object.fromEntries(["makam", "konu", "metin", "tarih", "ad", "tc", "adres", "tel", "eposta", "ekler"].map(k => [k, $("#dl-" + k).value]));
  const fileBase = () => ({ istifa: "istifa-dilekcesi", bilgi: "bilgi-edinme-dilekcesi" }[sel.value] || "dilekce");
  for (const [btnId, kind] of [["b-dl-docx", "docx"], ["b-dl-pdf", "pdf"], ["b-dl-udf", "udf"]]) {
    $("#" + btnId).addEventListener("click", async e => {
      e.preventDefault();
      const d = read();
      if (!d.ad.trim()) { setStatus("dilekce", "Ad soyad alanını doldurun.", "err"); $("#dl-ad").focus(); return; }
      setStatus("dilekce", "Hazırlanıyor…");
      try {
        await ensureLibs();
        const m = dilekceModel(d);
        const blob = kind === "pdf" ? await modelToPdf(m) : kind === "udf" ? await modelToUdf(m) : (await modelToDocx(m)).blob;
        showResults("dilekce", [{ name: fileBase() + "." + kind, blob }]);
        setStatus("dilekce", "Dilekçeniz hazır.", "ok");
      } catch (err) { console.error(err); setStatus("dilekce", "Bir hata oluştu: " + err.message, "err"); }
    });
  }
}

/* ================= PDF sayfa ayır / sil ================= */
function parseRanges(s, n) {
  const out = [];
  for (const part of s.split(/[,;]+/).map(x => x.trim()).filter(Boolean)) {
    let m = part.match(/^(\d+)$/), a, b;
    if (m) a = b = +m[1];
    else { m = part.match(/^(\d+)?\s*-\s*(\d+)?$/); if (!m || (!m[1] && !m[2])) throw userErr(`"${part}" anlaşılamadı. Örnek yazım: 1-3, 5, 8-`); a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : n; }
    if (a < 1 || b > n || a > b) throw userErr(`"${part}" aralığı belgede yok. Belge ${n} sayfa.`);
    const r = []; for (let i = a; i <= b; i++) r.push(i - 1); out.push({ label: a === b ? String(a) : `${a}-${b}`, pages: r });
  }
  if (!out.length) throw userErr("Sayfa numaralarını yazın. Örnek: 1-3, 5");
  return out;
}
if (document.getElementById("f-sayfa")) {
const sPg = fileList("sayfa", { multiple: false, accept: /\.pdf$|application\/pdf/i, onChange: async files => {
  $("#pg-info").textContent = "";
  if (!files.length) return;
  try { await ensureLibs(); const d = await PDFLib.PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true }); $("#pg-info").textContent = `Belge ${d.getPageCount()} sayfa.`; } catch (e) { $("#pg-info").textContent = "PDF okunamadı."; }
} });
document.querySelectorAll('input[name="pg-mode"]').forEach(r => r.addEventListener("change", () => { $("#pg-range-row").style.display = document.querySelector('input[name="pg-mode"]:checked').value === "each" ? "none" : "grid"; }));
runner("sayfa", async () => {
  const { PDFDocument } = PDFLib;
  const f = sPg.files[0];
  const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
  const n = src.getPageCount(); const mode = document.querySelector('input[name="pg-mode"]:checked').value;
  const make = async idx => { const d = await PDFDocument.create(); (await d.copyPages(src, idx)).forEach(p => d.addPage(p)); d.setProducer("Evrakçevir"); return new Blob([await d.save({ useObjectStreams: true })], { type: "application/pdf" }); };
  const bn = baseName(f.name); const out = [];
  if (mode === "each") { for (let i = 0; i < n; i++) { out.push({ name: `${bn}-s${i + 1}.pdf`, blob: await make([i]) }); setProgress("sayfa", (i + 1) / n); } }
  else {
    const ranges = parseRanges($("#pg-ranges").value, n);
    if (mode === "keep") { const idx = [...new Set(ranges.flatMap(r => r.pages))]; out.push({ name: `${bn}-secilen.pdf`, blob: await make(idx), note: `${idx.length} sayfa` }); }
    else if (mode === "remove") { const del = new Set(ranges.flatMap(r => r.pages)); const idx = [...Array(n).keys()].filter(i => !del.has(i)); if (!idx.length) throw userErr("Tüm sayfaları silemezsiniz."); out.push({ name: `${bn}-duzenlenmis.pdf`, blob: await make(idx), note: `${del.size} sayfa silindi, ${idx.length} sayfa kaldı.` }); }
    else for (const r of ranges) out.push({ name: `${bn}-${r.label}.pdf`, blob: await make(r.pages), note: `${r.pages.length} sayfa` });
  }
  showResults("sayfa", out); setStatus("sayfa", "Hazır.", "ok");
});
}

/* ================= ana sayfa: dosya türünü tanıyıp doğru araca gönder ================= */
const HStore = {
  open() { return new Promise((res, rej) => { let r; try { r = indexedDB.open("evrakcevir", 1); } catch (e) { return rej(e); } r.onupgradeneeded = () => r.result.createObjectStore("h"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async put(v) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("h", "readwrite"); t.objectStore("h").put(v, "pending"); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async take() { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("h", "readwrite"); const st = t.objectStore("h"); const g = st.get("pending"); g.onsuccess = () => { st.delete("pending"); res(g.result || null); }; g.onerror = () => rej(g.error); }); },
};
const ROUTES = [
  { re: /\.udf$/i, ids: ["udf-pdf", "udf-word"] },
  { re: /\.eyp$/i, ids: ["eyp"] },
  { re: /\.(imz|p7s|p7m)$/i, ids: ["imz"] },
  { re: /\.(xml|zip)$/i, ids: ["efatura", "efatura-excel"] },
  { re: /\.docx$/i, ids: ["word-udf"] },
  { re: /\.pdf$/i, ids: ["sikistir", "sayfa", "birlestir", "pdf-udf"] },
  { re: /\.(jpe?g|png)$/i, ids: ["kimlik", "birlestir"] },
];
if (document.getElementById("pick")) {
  const input = $("#pick"), box = $("#pick-choice");
  const hrefOf = id => { const a = document.querySelector(`a.card[data-id="${id}"]`); return a ? a.getAttribute("href") : null; };
  const titleOf = id => { const a = document.querySelector(`a.card[data-id="${id}"] h3`); return a ? a.textContent : id; };
  async function go(id, files) {
    try { await HStore.put({ tool: id, files, t: Date.now() }); } catch (e) {}
    location.href = hrefOf(id);
  }
  function handle(files) {
    if (!files.length) return;
    box.innerHTML = "";
    const routes = files.map(f => ROUTES.find(r => r.re.test(f.name)));
    if (routes.some(r => !r)) { box.innerHTML = `<p class="status" data-kind="err">Bu dosya türü için bir aracımız yok: ${esc(files.find((f, i) => !routes[i]).name)}</p>`; return; }
    let ids = routes[0].ids.filter(id => routes.every(r => r.ids.includes(id)));
    if (!ids.length) ids = ["birlestir"];
    if (ids.length === 1) return go(ids[0], files);
    box.innerHTML = `<p class="pick-q">${files.length > 1 ? files.length + " dosya" : esc(files[0].name)} ile ne yapmak istiyorsunuz?</p><div class="pick-opts">` + ids.map(id => `<button class="btn ghost" type="button" data-go="${id}">${esc(titleOf(id))}</button>`).join("") + "</div>";
    box.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go, files)));
    box.querySelector("button").focus();
  }
  input.addEventListener("change", () => { handle([...input.files]); input.value = ""; });
  const zone = $(".hero");
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("over"); });
  zone.addEventListener("dragleave", e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("over"); });
  zone.addEventListener("drop", e => { e.preventDefault(); zone.classList.remove("over"); handle([...e.dataTransfer.files]); });
  document.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); input.click(); }));
}
/* araç sayfası: ana sayfadan gelen dosyayı listeye ekle */
(async () => {
  const id = document.body.dataset.tool; if (!id) return;
  let p = null; try { p = await HStore.take(); } catch (e) { return; }
  if (!p || p.tool !== id || Date.now() - p.t > 10 * 60 * 1000 || !p.files) return;
  if (id === "kimlik" && HANDOFF.kimlik) { p.files.slice(0, 2).forEach((f, i) => HANDOFF.kimlik.sides[i] && HANDOFF.kimlik.sides[i](f)); return; }
  if (HANDOFF[id] && HANDOFF[id].add) HANDOFF[id].add(p.files);
})();
