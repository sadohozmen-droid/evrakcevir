# Evrakçevir (evrakcevir.com): çalışma kuralları

Türkiye'ye özgü resmî dosya biçimleri (UYAP UDF, KEP EYP, e-imza İMZ, GİB e-Fatura XML) için tarayıcıda çalışan, ücretsiz araçlar sitesi. Sahibi: Sadettin Hözmen. İlk 3 ay (Şubat 2027 ortasına kadar) tamamen ücretsiz, reklamsız; tek hedef **organik trafiği artırmak**.

## Yapı
- `build_site.py`: tüm siteyi `site/` klasörüne üretir (`pip install markdown` gerekir). `python build_site.py`
- `content.py`: araç sayfalarının başlık, açıklama, "kimin için / nasıl / elinize ne geçer" metinleri, ana sayfa metinleri ve SSS.
- `build_site.py` içindeki `TOOLS` listesi: araçların slug, adım, SSS ve kart metinleri.
- `rehber/*.md`: rehber yazıları → `/rehber/<slug>/`. Ön bilgi alanları: `title` (≤60 karakter), `h1`, `description` (150-160 karakter), `date`, `updated`, `tools` (araç id'leri, virgülle). `## Sık sorulan sorular` altındaki `### Soru` başlıkları otomatik olarak FAQ yapısal verisine dönüşür.
- `assets_src/`: `base.js` + `extra.js` → `site/assets/app.js`; `base.css` + `extra.css` + `v2.css` → `site/assets/style.css`.
- `main` dalına push → GitHub Actions siteyi derleyip evrakcevir.com'a yayınlar (1-2 dk). `site/` klasörünü commit etme.
- `ops/`: SEO planı (`seo-plan.md`), anahtar kelime takibi (`anahtar-kelimeler.md`), değişiklik günlüğü (`gunluk.md`), günlük raporlar (`raporlar/`).

## Yayınlamadan önce zorunlu kontrol
1. `python build_site.py` hatasız bitmeli; `node --check site/assets/app.js`.
2. Kırık iç bağlantı olmamalı (site/ içindeki tüm `href="/..."` dosyaya karşılık gelmeli).
3. Her sayfada başlık ≤ 60, açıklama 150-160 karakter.
4. JS'e dokunduysan `npm install` + `python test_v2.py` (Playwright, Chrome) geçmeli.
5. Değişikliği `ops/gunluk.md`'ye tarih ve tek satırla yaz.

## Metin kuralları (kesin)
- Uydurma yok: rakam, istatistik, kullanıcı sayısı, müşteri yorumu, referans, ödül, "en iyi / lider / 1 numara" gibi kanıtsız iddia yazma.
- Hukuki ve mali konularda yalnızca doğrulanabilir genel bilgi; kanun maddesi, süre, ücret gibi ayrıntıyı resmî kaynaktan (mevzuat.gov.tr, gib.gov.tr, uyap.gov.tr, cbddo.gov.tr) doğrulamadan yazma. Doğrulayamadığını yazma.
- Rakip sitelerin metnini kopyalama; kaynaklardan en fazla 15 kelimelik alıntı.
- Ton: sade, yardımsever, Türkçe yazım kurallarına uygun. İlk cümle soruyu doğrudan cevaplasın.
- Araçların yapmadığını vaat etme (imza doğrulama, şifreli EYP, OCR yok).
- Kişisel veri toplayan form, üyelik, reklam, takip kodu ekleme (sahibi istemeden).

## SEO çalışma ritmi
- Her rehber tek bir arama niyetine odaklanır, ilgili araç sayfasına ve 1-2 benzer rehbere iç bağlantı verir.
- Yeni sayfa açmadan önce `ops/anahtar-kelimeler.md`'de o niyetin başka bir sayfayla çakışmadığını kontrol et.
- Var olan sayfaları iyileştirmek, yeni sayfa açmak kadar değerlidir: Search Console'da gösterimi olup tıklaması düşük sayfaların başlık/açıklamasını iyileştir.
