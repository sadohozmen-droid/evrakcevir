
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
