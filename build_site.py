#!/usr/bin/env python3
"""Evrakçevir çok sayfalı statik site üretici.
Alan adı değişirse sadece SITE değişkenini düzenleyip tekrar çalıştırın."""
import json, os, re, html, datetime, shutil

SITE = os.environ.get("SITE", "https://evrakcevir.com")
BRAND = "Evrakçevir"
OUT = "site"
TODAY = datetime.date.today().isoformat()

def _src_date():
    """Site kaynağının son değiştiği gün (sitemap lastmod). ops/ commitleri lastmod'u değiştirmesin."""
    import subprocess
    try:
        d = subprocess.run(["git", "log", "-1", "--format=%cs", "--", "build_site.py", "content.py", "sections.json", "assets_src"],
                           capture_output=True, text=True, timeout=10).stdout.strip()
        return d or TODAY
    except Exception:
        return TODAY
SRC_DATE = _src_date()
SECS = json.load(open("sections.json", encoding="utf-8"))

def simple_sec(id, h, lead, accept, drop_title, drop_sub, btn, note="", multiple=True, extra_left="", extra_right=""):
    m = " multiple" if multiple else ""
    note_html = f'<p class="note">{note}</p>' if note else ""
    return f"""
    <a class="back" href="#">← Tüm araçlar</a>
    <h2>{h}</h2>
    <p class="lead">{lead}</p>
    <div class="cols">
      <div class="panel">
        <label class="drop"><input type="file" id="f-{id}" accept="{accept}"{m}><strong>{drop_title}</strong><span>{drop_sub}</span></label>
        <ul class="files" id="l-{id}"></ul>{extra_left}
      </div>
      <div class="panel">{extra_right}
        <button class="btn" id="b-{id}" disabled>{btn}</button>
        <div class="bar" id="p-{id}"><i></i></div>
        <p class="status" id="s-{id}"></p>
        <div class="results" id="r-{id}"></div>
        {note_html}
      </div>
    </div>
  """

SECS["imz"] = simple_sec("imz", "İMZ dosyası açma", "e-imzalı .imz dosyasının içindeki asıl belgeyi (PDF, Word, UDF, XML) çıkarır, kimin ve ne zaman imzaladığını gösterir. Program kurmanız gerekmez.", ".imz,.p7s,.p7m", "İMZ dosyalarını buraya bırakın", ".imz, .p7s veya .p7m", "Belgeyi çıkar", "Araç imzanın hukuki geçerliliğini doğrulamaz, yalnızca içindeki belgeyi açar. Geçerlilik kontrolü için İmzager gibi bir e-imza programı kullanın.")
SECS["eyp"] = simple_sec("eyp", "EYP dosyası açma", "KEP ile ya da kurumlardan gelen .eyp e-Yazışma paketini açın. Üst yazı ve ekleri ayrı ayrı indirin. Konu, sayı, tarih ve gönderen bilgisini görün.", ".eyp", "EYP dosyalarını buraya bırakın", "e-Yazışma paketi (.eyp)", "Paketi aç", "Şifreli paketler yalnızca alıcı kurumun anahtarıyla açılabilir. İmza geçerliliği bu araçta doğrulanmaz.", extra_right='\n        <div id="m-eyp" style="display:grid;gap:8px"></div>')
SECS["efatura-excel"] = simple_sec("efatura-excel", "e-Fatura XML'den Excel'e aktarma", "Yüzlerce e-Fatura ve e-Arşiv XML'ini tek Excel dosyasında listeleyin: fatura no, tarih, satıcı, alıcı, VKN/TCKN, matrah, KDV ve toplamlar. İkinci sayfada tüm fatura kalemleri yer alır.", ".xml,.zip,text/xml,application/xml,application/zip", "Fatura XML veya ZIP dosyalarını bırakın", "Bir ay boyunca gelen tüm faturaları birlikte seçebilirsiniz", "Excel'e aktar", "Tutarlar sayı olarak yazılır, Excel'de doğrudan toplanıp filtrelenebilir.")
PG_RIGHT = """
        <div class="opt">
          <label class="t">Ne yapılsın?</label>
          <div class="chips" role="radiogroup" aria-label="İşlem">
            <label class="chip"><input type="radio" name="pg-mode" value="remove" checked><span>Sayfaları sil</span></label>
            <label class="chip"><input type="radio" name="pg-mode" value="keep"><span>Sadece bunları al</span></label>
            <label class="chip"><input type="radio" name="pg-mode" value="split"><span>Aralıklara böl</span></label>
            <label class="chip"><input type="radio" name="pg-mode" value="each"><span>Her sayfa ayrı</span></label>
          </div>
        </div>
        <div class="opt" id="pg-range-row"><label class="t" for="pg-ranges">Sayfalar</label><input class="num" style="width:100%" id="pg-ranges" type="text" placeholder="Örnek: 2, 5-7, 10-"></div>"""
SECS["sayfa"] = simple_sec("sayfa", "PDF sayfa ayırma ve silme", "Taranmış dosyadaki boş sayfaları silin, belgeyi parçalara ayırın ya da yalnızca gereken sayfaları alın. Yükleme sınırına takılan dosyalar için en temiz çözüm.", ".pdf,application/pdf", "PDF dosyasını bırakın", "Tek dosya", "Uygula", multiple=False, extra_left='\n        <p class="note" id="pg-info"></p>', extra_right=PG_RIGHT)

def dilekce_sec(preset, h, lead):
    opts = "".join(f'<option value="{k}"{" selected" if k == preset else ""}>{v}</option>' for k, v in [("genel", "Genel dilekçe"), ("istifa", "İstifa dilekçesi"), ("bilgi", "Bilgi edinme başvurusu")])
    return f"""
    <a class="back" href="#">← Tüm araçlar</a>
    <h2>{h}</h2>
    <p class="lead">{lead}</p>
    <form class="cols" id="dl-form" onsubmit="return false">
      <div class="panel form">
        <label>Dilekçe türü<select id="dl-tur">{opts}</select></label>
        <label>Makam (kime yazılıyor)<input id="dl-makam" type="text" autocomplete="off"></label>
        <label>Konu <small>İsteğe bağlı</small><input id="dl-konu" type="text" autocomplete="off"></label>
        <label>Dilekçe metni <small>Paragrafları boş satırla ayırın. Noktalı yerleri doldurun.</small><textarea id="dl-metin" rows="11"></textarea></label>
        <label>Ekler <small>Her satıra bir ek</small><textarea id="dl-ekler" rows="3" placeholder="Nüfus cüzdanı fotokopisi"></textarea></label>
      </div>
      <div class="panel form">
        <div class="row2"><label>Ad Soyad<input id="dl-ad" type="text" autocomplete="name"></label><label>Tarih<input id="dl-tarih" type="text"></label></div>
        <label>T.C. Kimlik No <small>İsteğe bağlı</small><input id="dl-tc" type="text" inputmode="numeric" maxlength="11" autocomplete="off"></label>
        <label>Adres<textarea id="dl-adres" rows="2" autocomplete="street-address"></textarea></label>
        <div class="row2"><label>Telefon<input id="dl-tel" type="tel" autocomplete="tel"></label><label>E-posta<input id="dl-eposta" type="email" autocomplete="email"></label></div>
        <div class="btn-row"><button class="btn" id="b-dl-docx" type="button">Word indir</button><button class="btn ghost" id="b-dl-pdf" type="button">PDF</button><button class="btn ghost" id="b-dl-udf" type="button">UDF</button></div>
        <p class="status" id="s-dilekce"></p>
        <div class="results" id="r-dilekce"></div>
        <p class="note">Bilgileriniz yalnızca tarayıcınızda kullanılır, hiçbir yere gönderilmez. Hukuki sonuç doğuracak dilekçeler için bir avukata danışın.</p>
      </div>
    </form>
  """
SECS["dilekce"] = dilekce_sec("genel", "Dilekçe yazma aracı", "Valilik, kaymakamlık, belediye, okul ya da şirkete verilecek dilekçeyi doğru düzende hazırlayın. Makamı, metni ve bilgilerinizi yazın, Word, PDF veya UYAP'a uygun UDF olarak indirin.")
SECS["istifa"] = dilekce_sec("istifa", "İstifa dilekçesi hazırla", "Hazır istifa dilekçesi metnini kendi bilgilerinizle doldurun ve Word ya da PDF olarak indirin. Metin, yasal bildirim süresini ve işçilik alacaklarınızı saklı tutacak biçimde yazılmıştır.")
SECS["bilgi"] = dilekce_sec("bilgi", "Bilgi edinme dilekçesi hazırla", "4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında kamu kurumlarına verilecek başvuru dilekçesini hazırlayın. İstediğiniz bilgi ve belgeleri maddeler hâlinde yazın, Word veya PDF olarak indirin.")

CDN = {
    "pdflib": "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
    "fontkit": "https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
    "jszip": "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    "pdfjs": "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    "pdfworker": "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    "h2c": "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "fonts": "/assets/fonts.js",
}

TOOLS = [
  dict(id="udf-pdf", slug="udf-pdf-cevirme", tag="UYAP", card="UDF → PDF", fmt=(".udf", ".pdf"),
       libs=["pdflib", "fontkit", "jszip", "fonts"],
       title="UDF PDF Çevirme – UYAP UDF Dosyasını PDF'e Dönüştür",
       desc="UYAP UDF dosyasını Doküman Editörü kurmadan ücretsiz PDF'e çevirin. Hizalama, tablolar ve görseller korunur. Dosya cihazınızdan çıkmaz.",
       card_desc="UYAP Doküman Editörü olmadan .udf dosyasını PDF olarak açın.",
       steps=["UYAP'tan indirdiğiniz .udf dosyasını kutuya sürükleyin ya da tıklayıp seçin. Birden fazla dosyayı aynı anda ekleyebilirsiniz.",
              "\"PDF'e dönüştür\" düğmesine basın. Dönüşüm tarayıcınızda birkaç saniyede tamamlanır.",
              "Hazır olan PDF'i indirin. Birden fazla dosya varsa hepsini tek ZIP olarak alabilirsiniz."],
       about=["UDF, UYAP (Ulusal Yargı Ağı Projesi) sisteminin kendi belge biçimidir. Mahkeme kararları, tensip zaptları, tebligatlar ve UYAP üzerinden hazırlanan dilekçeler bu uzantıyla iner. Bilgisayarınızda UYAP Doküman Editörü yoksa bu dosyalar açılmaz.",
              "Bu araç UDF dosyasının içindeki metni ve biçim bilgisini okuyup aynı düzende bir PDF oluşturur. PDF'i her bilgisayarda, telefonda ve tablette açabilir, e-postayla gönderebilir ya da yazdırabilirsiniz."],
       faq=[("UDF dosyası nasıl açılır?", "UDF dosyaları normalde UYAP Doküman Editörü ile açılır. Editörü kurmak istemiyorsanız dosyayı bu sayfada PDF'e çevirip herhangi bir PDF okuyucuyla açabilirsiniz."),
            ("Dosyam bir sunucuya yükleniyor mu?", "Hayır. Dönüşüm tamamen tarayıcınızda yapılır, dosya internete gönderilmez. Bu yüzden gizli dava evrakı için de güvenle kullanabilirsiniz."),
            ("Çıktı aslıyla birebir aynı mı?", "Metin, paragraf hizası, yazı boyutu, kalın ve italik yazı, tablolar ve gömülü görseller aktarılır. Üst bilgi, alt bilgi ve elektronik imza bilgisi PDF'e eklenmez. Resmî işlemlerde belgenin UYAP'taki aslı geçerlidir."),
            ("Telefonda çalışır mı?", "Evet. Android ve iPhone tarayıcılarında da çalışır. Dosyayı Dosyalar uygulamasından seçmeniz yeterlidir."),
            ("Ücretli mi, üyelik gerekiyor mu?", "Hayır. Araç ücretsizdir ve üyelik istemez.")]),
  dict(id="udf-word", slug="udf-word-cevirme", tag="UYAP", card="UDF → Word", fmt=(".udf", ".docx"),
       libs=["jszip"],
       title="UDF Word Çevirme – UDF Dosyasını DOCX'e Dönüştür",
       desc="UYAP UDF dosyasını düzenlenebilir Word (.docx) belgesine ücretsiz çevirin. Metin, biçim ve tablolar korunur, dosya yüklenmez.",
       card_desc="Karar ve tebligat metnini düzenlenebilir Word belgesine aktarın.",
       steps=["UDF dosyanızı kutuya bırakın veya seçin.",
              "\"Word'e dönüştür\" düğmesine basın.",
              "İnen .docx dosyasını Word, LibreOffice ya da Google Dokümanlar'da açıp düzenleyin."],
       about=["Bir karar metninden alıntı yapmak, eski bir dilekçeyi yeni bir taslağa taşımak ya da UYAP'tan gelen metni düzenlemek için UDF'yi Word'e çevirmek gerekir. Bu araç paragraf hizasını, girintileri, kalın, italik ve altı çizili yazıyı ve tabloları Word belgesine aktarır."],
       faq=[("UDF'yi Word'e çevirince biçim bozulur mu?", "Paragraf hizası, girintiler, satır aralığı, yazı tipi ve boyutu ile tablolar korunur. UDF içindeki görseller Word çıktısına eklenmez. Görselli belgeler için UDF'yi PDF'e çevirin."),
            ("Google Dokümanlar'da açabilir miyim?", "Evet. Oluşan .docx dosyasını Google Drive'a yükleyip Google Dokümanlar ile açabilirsiniz."),
            ("Dosyam güvende mi?", "Dönüşüm tarayıcınızda yapılır, dosya hiçbir sunucuya gönderilmez.")]),
  dict(id="word-udf", slug="word-udf-cevirme", tag="UYAP", card="Word → UDF", fmt=(".docx", ".udf"),
       libs=["jszip"],
       title="Word UDF Çevirme – DOCX Dilekçeyi UYAP UDF'ye Dönüştür",
       desc="Word'de yazdığınız dilekçeyi UYAP'a uygun UDF formatına ücretsiz çevirin. Hizalama, numaralı maddeler ve tablolar aktarılır.",
       card_desc="Word'de yazdığınız dilekçeyi UYAP'a uygun UDF biçimine çevirin.",
       steps=["Word belgenizi .docx olarak kaydedin. Eski .doc biçimindeyse Word'de \"Farklı Kaydet\" ile .docx seçin.",
              "Dosyayı kutuya bırakın ve \"UDF'ye dönüştür\" düğmesine basın.",
              "İnen .udf dosyasını UYAP Doküman Editörü'nde bir kez açıp kontrol edin, ardından sisteme yükleyin."],
       about=["Avukatlar ve vatandaşlar dilekçelerini çoğunlukla Word'de yazar, ama UYAP Avukat Portal ve Vatandaş Portal'a gönderilecek belgeler için UDF biçimi istenir. Bu araç Word belgesindeki paragraf hizasını, girintileri, satır aralığını, kalın, italik ve altı çizili yazıyı, numaralı maddeleri ve tabloları UDF'ye aktarır."],
       faq=[("Word'den UDF'ye çevrilen dosya UYAP'ta açılır mı?", "Dosya UDF yapısına uygun olarak oluşturulur. Göndermeden önce UYAP Doküman Editörü'nde açıp görünümünü kontrol etmenizi öneririz."),
            ("Hangi biçimler aktarılır?", "Hizalama (sola, ortaya, sağa, iki yana), girintiler, satır aralığı, yazı tipi ve boyutu, kalın, italik, altı çizili yazı, numaralı ve madde işaretli listeler ve tablolar aktarılır. Görseller ve sayfa sonları aktarılmaz."),
            (".doc dosyası destekleniyor mu?", "Hayır, yalnızca .docx desteklenir. Eski .doc dosyasını Word'de açıp \"Farklı Kaydet → Word Belgesi (.docx)\" ile kaydedebilirsiniz."),
            ("Elimde yalnızca PDF var, UDF'ye çevirebilir miyim?", "Evet, ama bu araçla değil. Metin içeren PDF'ler için \"PDF UDF Çevirme\" aracını kullanın; PDF'teki metni paragraflarıyla okuyup .udf dosyası oluşturur. Taranmış PDF'lerde metin olmadığı için bu dönüşüm yapılamaz.")]),
  dict(id="pdf-udf", slug="pdf-udf-cevirme", tag="UYAP", card="PDF → UDF", fmt=(".pdf", ".udf"),
       libs=["jszip", "pdfjs", "pdfworker"],
       title="PDF UDF Çevirme – PDF'i UYAP UDF Formatına Dönüştür",
       desc="Metin içeren PDF dosyasını paragraflarıyla birlikte UYAP UDF formatına ücretsiz çevirin. Kalın ve italik yazı korunur, dosya yüklenmez.",
       card_desc="Metin içeren PDF'i paragraflarıyla birlikte UDF belgesine dönüştürün.",
       steps=["PDF dosyanızı kutuya bırakın veya seçin.",
              "\"UDF'ye dönüştür\" düğmesine basın. Araç metni okur, satırları paragraflara birleştirir.",
              "Oluşan .udf dosyasını indirip UYAP Doküman Editörü'nde kontrol edin."],
       about=["PDF olarak elinizde olan bir dilekçeyi ya da metni UYAP'a göndermek için UDF'ye çevirmeniz gerekebilir. Araç PDF'teki metni okur, satır sonlarında bölünmüş kelimeleri birleştirir, paragrafları ayırır ve kalın, italik yazıyı korur."],
       faq=[("PDF'yi UDF'ye nasıl dönüştürürüm?", "PDF dosyasını bu sayfadaki kutuya bırakıp \"UDF'ye dönüştür\" düğmesine basmanız yeterlidir, program kurmanız gerekmez. Araç metni paragraflarıyla okur ve indirilebilir bir .udf dosyası oluşturur. Dosya tarayıcınızda işlenir, sunucuya yüklenmez. UYAP'a göndermeden önce dosyayı UYAP Doküman Editörü'nde açıp kontrol edin."),
            ("Taranmış PDF'i UDF'ye çevirebilir miyim?", "Hayır. Taranmış PDF'ler fotoğraf olduğu için içlerinde metin yoktur. Önce bir OCR aracıyla metne çevrilmeleri gerekir."),
            ("Tablolar korunuyor mu?", "PDF'ten okunan tablolar düz metin satırlarına dönüşür. Tablolu belgeler için Word aslınız varsa \"Word'ü UDF'ye çevir\" aracı daha iyi sonuç verir.")]),
  dict(id="efatura", slug="e-fatura-xml-pdf-cevirme", tag="GİB", card="e-Fatura XML → PDF", fmt=(".xml", ".pdf"),
       libs=["jszip", "pdflib", "h2c"],
       title="e-Fatura XML PDF Çevirme – e-Arşiv XML'i PDF'e Dönüştür",
       desc="GİB e-Fatura, e-Arşiv ve e-İrsaliye XML dosyalarını ücretsiz PDF'e çevirin. Faturanın kendi tasarımı kullanılır, ZIP ile toplu dönüşüm yapılır.",
       card_desc="e-Fatura, e-Arşiv ve e-İrsaliye XML'lerini okunur PDF yapın. ZIP ile toplu.",
       steps=["e-Fatura veya e-Arşiv XML dosyalarını ya da bunları içeren ZIP'i kutuya bırakın.",
              "Görünümü seçin. \"Faturanın kendi tasarımı\" seçiliyse XML içindeki tasarım kullanılır.",
              "\"PDF'e dönüştür\" düğmesine basın ve faturaları tek tek ya da ZIP olarak indirin."],
       about=["e-Fatura ve e-Arşiv faturaları UBL-TR standardında XML dosyası olarak gelir. XML dosyası tarayıcıda açıldığında okunmaz. Faturanın görünümü, XML'in içine gömülü bir tasarım (XSLT) dosyasıyla belirlenir.",
              "Bu araç XML içindeki tasarımı bulup faturayı aslındaki görünümüyle PDF'e çevirir. Tasarım yoksa satıcı, alıcı, kalemler, KDV ve toplamları gösteren sade bir fatura şablonu kullanır. Muhasebe büroları birçok faturayı ZIP içinde topluca dönüştürebilir."],
       faq=[("e-Fatura XML dosyası nasıl açılır?", "XML dosyasını bu sayfaya bırakıp PDF'e çevirmeniz yeterli. Oluşan PDF'i her cihazda açabilir ve yazdırabilirsiniz. Diğer yollar e-Fatura XML dosyası nasıl açılır rehberimizde."),
            ("XML faturayı açınca neden kod görünüyor?", "Tarayıcı ve Not Defteri, XML'in içindeki fatura tasarımını (XSLT) uygulamadığı için ham etiketleri gösterir. Dosya bozuk değildir; PDF'e çevirdiğinizde fatura aslındaki görünümüyle açılır."),
            ("PDF'e çevrilen fatura XML'in yerine geçer mi?", "Hayır. Faturanın asıl kaydı XML dosyasıdır; PDF okumak, yazdırmak ve paylaşmak içindir. XML dosyasını silmeyin."),
            ("e-İrsaliye XML'i de çevrilir mi?", "Evet. e-İrsaliye (DespatchAdvice) belgeleri de desteklenir."),
            ("Birden fazla faturayı aynı anda çevirebilir miyim?", "Evet. Birden fazla XML seçebilir ya da faturaları içeren ZIP dosyasını bırakabilirsiniz. Sonuçları tek ZIP olarak indirebilirsiniz."),
            ("Fatura bilgilerim bir yere gönderiliyor mu?", "Hayır. Dönüşüm tarayıcınızda yapılır, fatura verileri hiçbir sunucuya gönderilmez.")]),
  dict(id="kimlik", slug="kimlik-on-arka-tek-sayfa", tag="Fotokopi", card="Kimlik ön-arka", fmt=(".jpg", ".pdf"),
       libs=["pdflib", "jszip"],
       title="Kimlik Ön Arka Tek Sayfa PDF – Gerçek Boyutta Kimlik Fotokopisi",
       desc="T.C. kimlik kartı veya ehliyetin ön ve arka yüzünü tek A4 sayfaya gerçek boyutta (85,6 × 54 mm) yerleştirip PDF yapın. Ücretsiz, dosya yüklenmez.",
       card_desc="Kimlik veya ehliyetin iki yüzünü tek A4 sayfaya, gerçek boyutta yerleştirin.",
       steps=["Kimliğinizin ön ve arka yüzünü telefonla, düz bir zeminde ve üstten çekin.",
              "Ön yüz ve arka yüz fotoğraflarını ilgili kutulara ekleyin. Gerekirse \"Döndür\" ile çevirin.",
              "\"PDF oluştur\" düğmesine basın. Yazdırırken ölçeği %100 seçin."],
       about=["İş başvurusu, banka, okul ya da resmî kurumlar çoğu zaman kimlik fotokopisinin ön ve arka yüzünü tek sayfada ister. Bu araç iki fotoğrafı A4 sayfaya alt alta yerleştirir. \"Gerçek boyut\" seçeneğinde kart, yazdırıldığında kimlik kartının kendi ölçüsü olan 85,6 × 54 mm çıkar.",
              "Yeni çipli T.C. kimlik kartı, sürücü belgesi, öğrenci kartı ve banka kartı aynı ölçüdedir, hepsi için kullanılabilir."],
       faq=[("Kimlik fotoğrafım internete yükleniyor mu?", "Hayır. Fotoğraflar yalnızca tarayıcınızda işlenir, hiçbir sunucuya gönderilmez."),
            ("Yazdırınca neden küçük ya da büyük çıkıyor?", "Yazdırma ekranında \"Sayfaya sığdır\" seçiliyse ölçü değişir. Ölçeği \"%100\" ya da \"Gerçek boyut\" seçin."),
            ("Siyah-beyaz fotokopi gibi yapabilir miyim?", "Evet. \"Siyah-beyaz fotokopi görünümü\" seçeneğini işaretleyin.")]),
  dict(id="birlestir", slug="pdf-birlestirme", tag="e-Devlet", card="Evrak birleştir", fmt=(".pdf .jpg", ".pdf"),
       libs=["pdflib", "jszip"],
       title="PDF Birleştirme – e-Devlet Belgelerini ve Fotoğrafları Tek PDF Yap",
       desc="e-Devlet belgelerini, PDF'leri ve JPG fotoğrafları sıralayıp tek PDF'te birleştirin. Ücretsiz, üyeliksiz, dosyalar cihazınızdan çıkmaz.",
       card_desc="e-Devlet belgeleri, PDF'ler ve fotoğraflardan sıralı tek dosya yapın.",
       steps=["Birleştirmek istediğiniz PDF, JPG veya PNG dosyalarını ekleyin.",
              "Okları kullanarak dosyaların sırasını ayarlayın.",
              "\"Birleştir\" düğmesine basın ve tek PDF'i indirin."],
       about=["Burs, iş, vize ve ihale başvurularında e-Devlet'ten alınan belgeler (adli sicil kaydı, öğrenci belgesi, SGK hizmet dökümü, ikametgâh) çoğu zaman tek PDF olarak istenir. Bu araç PDF'leri ve fotoğrafları istediğiniz sırada tek dosyada birleştirir. Fotoğraflar otomatik olarak A4 sayfaya yerleştirilir."],
       faq=[("Kaç dosya birleştirebilirim?", "Bir sınır yok. Çok büyük dosyalarda işlem cihazınızın belleğine bağlı olarak biraz uzun sürebilir."),
            ("e-Devlet barkodlu belgeler bozulur mu?", "Hayır. PDF sayfaları olduğu gibi kopyalanır, barkod ve karekod korunur."),
            ("Birleşik dosya çok büyük oldu, ne yapmalıyım?", "\"PDF'i boyut sınırına göre küçült\" aracıyla dosyayı istediğiniz MB sınırının altına indirebilirsiniz.")]),
  dict(id="sikistir", slug="pdf-kucultme", tag="Başvuru", card="Boyut sınırına küçült", fmt=(".pdf", "≤ 2 MB"),
       libs=["pdflib", "jszip", "pdfjs", "pdfworker"],
       title="PDF Küçültme – PDF'i 1 MB, 2 MB, 5 MB Altına Düşür",
       desc="PDF dosyasını başvuru sisteminin sınırına göre 1, 2, 5 veya 10 MB altına ücretsiz küçültün. Hedef boyutu seçin, araç kademeli olarak sıkıştırsın.",
       card_desc="PDF'i 1, 2, 5 veya 10 MB sınırının altına indirin.",
       steps=["Küçültmek istediğiniz PDF'i ekleyin.",
              "Başvuru sisteminin istediği hedef boyutu seçin (örneğin 2 MB).",
              "\"Küçült\" düğmesine basın. Araç PDF'i sınırın altına inene kadar kademeli olarak sıkıştırır."],
       about=["Üniversite, burs, iş ve ihale başvuru sistemleri yüklenen dosyalar için çoğu zaman boyut sınırı koyar. Taranmış belgeler ve fotoğraflı PDF'ler bu sınırı kolayca aşar. Bu araçta yalnızca hedef boyutu seçersiniz, gerisini araç halleder.",
              "Önce kalite kaybı olmayan küçültme denenir. Yetmezse sayfalar görüntüye çevrilip çözünürlük kademeli olarak düşürülür ve sınırın altına inen ilk, yani en kaliteli sonuç verilir."],
       faq=[("PDF küçültünce kalite düşer mi?", "Önce kayıpsız küçültme denenir. Yetmezse sayfalar görüntüye çevrilir. Bu durumda metin seçilemez ama belge okunur kalır. Araç hedefe inen en yüksek kaliteli sonucu seçer."),
            ("Sınırın altına inemedi, ne yapabilirim?", "\"Siyah-beyaz yap\" seçeneğini açın. Hâlâ inmiyorsa belgeyi parçalara ayırıp ayrı ayrı yüklemeyi deneyin."),
            ("Dosyam yükleniyor mu?", "Hayır. Küçültme tarayıcınızda yapılır, dosya hiçbir sunucuya gönderilmez.")]),
]

DL_LIBS = ["pdflib", "fontkit", "jszip", "fonts"]
TOOLS += [
  dict(id="imz", slug="imz-dosyasi-acma", tag="e-İmza", card="İMZ dosyası açma", fmt=(".imz", ".pdf"), libs=["jszip"],
       title="İMZ Dosyası Açma – e-İmzalı .imz Dosyasını PDF'e Çevir",
       desc="e-imzalı .imz dosyasını programsız açın. İçindeki PDF, Word veya UDF belgeyi çıkarır, imzalayanı ve imza tarihini gösterir. Dosya yüklenmez.",
       card_desc="e-imzalı .imz dosyasının içindeki belgeyi çıkarın, imzalayanı görün.",
       steps=["e-imzalı .imz (veya .p7s, .p7m) dosyasını kutuya bırakın.",
              "\"Belgeyi çıkar\" düğmesine basın. Araç imza katmanını açar, içindeki belgenin türünü kendisi bulur.",
              "Çıkan PDF, Word, UDF ya da XML dosyasını indirin. İmzalayanın adı ve imza zamanı sonucun altında görünür."],
       about=["e-imza ile imzalanan belgeler çoğu zaman .imz uzantısıyla gelir. Bu dosya, asıl belgeyi ve elektronik imzayı birlikte taşıyan bir zarftır (CAdES). Windows bu uzantıyı tanımadığı için dosya çift tıklayınca açılmaz.",
              "Bu araç zarfı açar ve içindeki belgeyi aslı gibi verir. Birden fazla kişinin sırayla imzaladığı (seri imzalı) dosyalarda tüm imza katmanlarını çözer ve her imzalayanı listeler."],
       faq=[(".imz dosyası nasıl açılır?", "Dosyayı bu sayfaya bırakmanız yeterli. İçindeki belge çıkarılır ve normal bir PDF ya da Word dosyası olarak indirilir. İmzager veya benzeri bir e-imza programı kurmanız gerekmez."),
            ("İMZ dosyası PDF'e nasıl çevrilir?", "Dosyayı bu sayfaya bırakın. İçindeki belge PDF ise doğrudan PDF olarak iner. Belge UDF ise UDF → PDF aracıyla PDF'e çevirebilirsiniz; Word ise Word dosyası olarak iner, Word'den PDF'e çeviri bu sitede yok."),
            ("İmzanın geçerli olup olmadığını gösteriyor mu?", "Hayır. Araç imzalayanın adını ve imza zamanını gösterir ama sertifika geçerliliğini ve imzanın bütünlüğünü doğrulamaz. Hukuki doğrulama için İmzager gibi bir e-imza programı kullanın."),
            ("İMZ dosyası nedir?", ".imz, e-imzalı belgenin imzayla birlikte saklandığı dosyadır: asıl belge (PDF, Word, UDF, XML), imzalayanın sertifikası ve imza bilgisi aynı zarfın içindedir. Ayrıntılar .imz dosyası nedir rehberimizde."),
            ("Açmak için e-imza kartı gerekir mi?", "Hayır. Kart ve kart okuyucu yalnızca imzalamak için gerekir. Belgeyi okumak için dosyayı bu sayfaya bırakmanız yeterli; telefonda da çalışır."),
            (".p7s ve .p7m dosyaları da açılıyor mu?", "Evet. Bunlar .imz ile aynı türden (CAdES) imza dosyalarıdır. Yalnız belgeyi içermeyen ayrık imza dosyalarında asıl belge size ayrı bir dosya olarak gelmiş olmalıdır."),
            ("İçinden UDF çıktı, ne yapmalıyım?", "UDF → PDF aracıyla çıkan UDF dosyasını PDF'e çevirebilirsiniz."),
            ("Dosyam bir yere gönderiliyor mu?", "Hayır. İşlem tarayıcınızda yapılır.")]),
  dict(id="eyp", slug="eyp-dosyasi-acma", tag="KEP", card="EYP dosyası açma", fmt=(".eyp", ".pdf"), libs=["jszip"],
       title="EYP Dosyası Açma – e-Yazışma Paketini Programsız Aç",
       desc="KEP ile gelen .eyp e-Yazışma paketini programsız açın. Üst yazıyı ve ekleri indirin, konu, sayı, tarih ve gönderen bilgisini görün. Ücretsiz.",
       card_desc="KEP ile gelen .eyp paketinden üst yazıyı ve ekleri çıkarın.",
       steps=["KEP hesabınızdan ya da e-postadan indirdiğiniz .eyp dosyasını kutuya bırakın.",
              "\"Paketi aç\" düğmesine basın. Konu, sayı, tarih ve gönderen bilgisi gösterilir.",
              "Üst yazıyı ve ekleri tek tek ya da hepsini ZIP olarak indirin."],
       about=["Kamu kurumları resmî yazışmalarını e-Yazışma Teknik Rehberi'ne uygun e-Yazışma Paketi (.eyp) olarak gönderir. KEP (Kayıtlı Elektronik Posta) ile şirketlere ve vatandaşlara gelen resmî yazılar da çoğunlukla bu biçimdedir.",
              ".eyp dosyası, üst yazıyı, ekleri, belgeye ait üst verileri ve elektronik imzayı tek pakette toplar. Bu araç paketi açar, üst yazıyı ve ekleri ayırır. Paket içinde e-imzalı (.imz) bir ek varsa İMZ açma aracıyla onu da açabilirsiniz."],
       faq=[("EYP dosyası nedir?", "EYP, kamu kurumlarının resmî yazıyı, eklerini, üst verisini ve imza bilgisini tek dosyada topladığı e-Yazışma Paketidir. Ayrıntılar EYP dosyası nedir rehberimizde."),
            ("EYP dosyası nasıl açılır?", "Dosyayı bu sayfaya bırakın. Üst yazı ve ekler ayrı dosyalar olarak listelenir, istediğinizi indirebilirsiniz."),
            ("EYP dosyası telefonda açılır mı?", "Evet. Bu sayfayı telefonun tarayıcısında açın ve dosyayı Dosyalar uygulamasından seçin. Çıkan PDF'leri telefonun PDF görüntüleyicisinde okuyabilirsiniz."),
            ("EYP dosyası Word'e çevrilir mi?", "Doğrudan değil. Paketi açınca üst yazı ve ekler kendi biçimleriyle çıkar. Ek .udf ise UDF'den Word'e çevirme aracıyla Word'e çevirebilirsiniz; PDF'ten Word'e çeviri bu sitede yok."),
            ("Şifreli EYP açılır mı?", "Hayır. Şifreli paketler yalnızca alıcı kurumun şifre çözme anahtarıyla açılabilir."),
            ("İmzanın geçerliliği kontrol ediliyor mu?", "Hayır. Bu araç paketin içeriğini açar. İmza geçerliliği için İmzager gibi bir e-imza programı kullanın.")]),
  dict(id="efatura-excel", slug="e-fatura-xml-excel-aktarma", tag="Muhasebe", card="e-Fatura → Excel", fmt=(".xml", ".xlsx"), libs=["jszip"],
       title="e-Fatura XML Excel'e Aktarma – Toplu Fatura Listesi Çıkar",
       desc="e-Fatura ve e-Arşiv XML dosyalarını toplu olarak Excel'e aktarın. Fatura no, tarih, VKN, matrah, KDV ve kalemler tek tabloda. Ücretsiz, dosya yüklenmez.",
       card_desc="Yüzlerce fatura XML'ini tek Excel tablosunda listeleyin.",
       steps=["Ay boyunca gelen e-Fatura ve e-Arşiv XML dosyalarını ya da bunları içeren ZIP'i kutuya bırakın.",
              "\"Excel'e aktar\" düğmesine basın.",
              "İnen Excel'de \"Faturalar\" sayfasında fatura başına bir satır, \"Kalemler\" sayfasında tüm mal ve hizmet satırları yer alır."],
       about=["KDV beyannamesi öncesi alış faturalarını kontrol etmek, cari mutabakat yapmak ya da faturaları muhasebe programına aktarmak için XML'leri tek tek açmak saatler sürer. Bu araç tüm faturaları okuyup tek bir Excel tablosu oluşturur.",
              "Faturalar sayfasında fatura no, tarih, tip, senaryo, satıcı ve alıcı unvanı, VKN/TCKN, mal/hizmet toplamı, iskonto, toplam vergi, vergiler dahil tutar, ödenecek tutar ve ETTN bulunur. Tutarlar sayı olarak yazıldığı için doğrudan toplanabilir ve filtrelenebilir."],
       faq=[("Kaç faturayı aynı anda aktarabilirim?", "Bir sınır yok. Yüzlerce XML'i ya da büyük bir ZIP dosyasını tek seferde işleyebilirsiniz."),
            ("e-Arşiv faturaları da okunuyor mu?", "Evet. e-Fatura ve e-Arşiv faturaları aynı UBL-TR yapısını kullandığı için ikisi de desteklenir."),
            ("Fatura verilerim bir yere gönderiliyor mu?", "Hayır. Tüm işlem tarayıcınızda yapılır. Müşteri bilgileri bilgisayarınızdan çıkmaz.")]),
  dict(id="dilekce", slug="dilekce-yazma", tag="Dilekçe", card="Dilekçe yazma", fmt=("form", ".docx .udf"), libs=DL_LIBS,
       title="Dilekçe Yazma Aracı – Word, PDF ve UDF Dilekçe Hazırla",
       desc="Valilik, kaymakamlık, belediye, okul veya şirkete dilekçeyi doğru formatta hazırlayın. Word, PDF ya da UYAP'a uygun UDF olarak indirin. Ücretsiz.",
       card_desc="Resmî dilekçeyi doğru düzende hazırlayıp Word, PDF veya UDF indirin.",
       steps=["Dilekçenin verileceği makamı yazın (örneğin \"Esenler Kaymakamlığına\").",
              "Konuyu ve dilekçe metnini yazın, en alta eklerinizi sıralayın.",
              "Ad soyad, adres ve iletişim bilgilerinizi girip Word, PDF ya da UDF olarak indirin. Çıktıyı yazdırıp imzalayın."],
       about=["Dilekçe, bir kuruma isteğinizi ya da şikâyetinizi yazılı olarak ileten belgedir. Makam üstte ortalanır, metin iki yana yaslanır, tarih, ad soyad ve imza sağ altta, adres ve ekler sol altta yer alır. Bu araç bu düzeni sizin için kurar.",
              "Hazırladığınız dilekçeyi Word olarak indirip düzenlemeye devam edebilir, PDF olarak yazdırabilir ya da UYAP'a göndermek için UDF olarak kaydedebilirsiniz."],
       faq=[("Dilekçede hangi bilgiler olmalı?", "Makam, konu, açık bir talep, tarih, ad soyad, imza ve adres. Kurum isterse T.C. kimlik numarası ve telefon da eklenir. Ek belge varsa \"Ekler\" başlığı altında sıralanır."),
            ("Dilekçe hangi yazı tipiyle yazılır?", "Araç, resmî yazışmalarda yaygın olan Times New Roman 12 punto kullanır."),
            ("e-Devlet üzerinden dilekçe verebilir miyim?", "Birçok kurum e-Devlet üzerinden başvuru kabul eder. Kurumun e-Devlet hizmeti yoksa dilekçeyi yazdırıp imzalayarak elden ya da posta ile verebilirsiniz.")]),
  dict(id="istifa", slug="istifa-dilekcesi", tag="Dilekçe", card="İstifa dilekçesi", fmt=("form", ".docx .pdf"), libs=DL_LIBS,
       title="İstifa Dilekçesi Örneği 2026 – Word ve PDF Olarak Hazırla",
       desc="Hazır istifa dilekçesi örneğini kendi bilgilerinizle doldurun, Word veya PDF olarak indirin. Bildirim süresi ve işçilik alacakları saklı tutulur.",
       card_desc="Hazır istifa dilekçesini doldurup Word veya PDF indirin.",
       steps=["Şirket unvanını ve işe giriş tarihinizi, pozisyonunuzu metindeki noktalı yerlere yazın.",
              "Ad soyad ve iletişim bilgilerinizi girin.",
              "Word ya da PDF olarak indirin, imzalayıp işverene teslim edin ve teslim aldıklarına dair imza ya da kaşe isteyin."],
       about=["İstifa dilekçesi, işçinin iş sözleşmesini kendi isteğiyle sona erdirdiğini işverene yazılı olarak bildirdiği belgedir. Buradaki örnek metin, bildirim süresine uyulacağını ve ücret, yıllık izin gibi alacakların ödenmesi talebini içerir.",
              "Haklı bir nedenle (örneğin ücretin ödenmemesi) ayrılıyorsanız, bu durum istifadan farklı sonuçlar doğurur. Böyle bir durumda dilekçeyi vermeden önce bir avukata danışmanız önerilir."],
       faq=[("İstifa dilekçesinde gerekçe yazmak zorunlu mu?", "Hayır. Kendi isteğinizle ayrılıyorsanız gerekçe yazmanız gerekmez. Yazdığınız gerekçe ileride aleyhinize yorumlanabileceği için dikkatli olun."),
            ("İstifa edince tazminat alınır mı?", "Kendi isteğiyle istifa eden işçi kural olarak kıdem tazminatı alamaz. Haklı nedenle fesih gibi istisnai durumlar için bir avukata danışın."),
            ("Dilekçeyi nasıl teslim etmeliyim?", "İki nüsha hazırlayın, birini işverene verin, diğerine teslim alındığına dair tarih ve imza alın. Alternatif olarak noter veya KEP ile gönderebilirsiniz.")]),
  dict(id="bilgi", slug="bilgi-edinme-dilekcesi", tag="Dilekçe", card="Bilgi edinme dilekçesi", fmt=("form", ".docx .pdf"), libs=DL_LIBS,
       title="Bilgi Edinme Dilekçesi Örneği – 4982 Sayılı Kanun Başvurusu",
       desc="4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında kamu kurumlarına verilecek başvuru dilekçesini hazırlayın. Word veya PDF olarak indirin.",
       card_desc="4982 sayılı Kanun kapsamında kamu kurumuna bilgi edinme başvurusu hazırlayın.",
       steps=["Başvuracağınız kurumu (örneğin belediye başkanlığı) makam alanına yazın.",
              "İstediğiniz bilgi ve belgeleri metinde maddeler hâlinde yazın.",
              "Ad soyad, adres ve imza bilgilerini ekleyip Word ya da PDF olarak indirin."],
       about=["4982 sayılı Bilgi Edinme Hakkı Kanunu, herkese kamu kurum ve kuruluşlarının faaliyetleriyle ilgili bilgi ve belge isteme hakkı tanır. Başvuru dilekçeyle ya da kurumun elektronik başvuru kanalıyla yapılır.",
              "Hazır metin, kanuna dayanılarak bilgi talep edildiğini belirtir ve cevabın hangi adrese gönderileceğini sorar. İstediğiniz bilgiyi açık ve somut yazmanız, başvurunun reddedilme riskini azaltır."],
       faq=[("Bilgi edinme başvurusu nereye yapılır?", "Bilgiyi istediğiniz kamu kurumuna yapılır. Kurumun e-Devlet veya kendi internet sitesindeki başvuru formunu da kullanabilirsiniz."),
            ("Başvuru ücretli mi?", "Başvuru ücretsizdir. İstenen belgenin çoğaltılması gerekiyorsa kurum maliyet karşılığı bir ücret isteyebilir."),
            ("Hangi bilgiler istenemez?", "Devlet sırrı, ticari sır, kişisel verilerin gizliliği gibi kanunda sayılan istisnalar kapsamındaki bilgiler verilmeyebilir.")]),
  dict(id="sayfa", slug="pdf-sayfa-ayirma", tag="Başvuru", card="PDF sayfa ayır / sil", fmt=(".pdf", ".pdf"), libs=["pdflib", "jszip"],
       title="PDF Sayfa Ayırma ve Silme – Sayfa Çıkar, Böl, Boş Sayfaları At",
       desc="PDF'ten sayfa silin, istediğiniz sayfaları ayrı PDF olarak alın ya da belgeyi aralıklara bölün. Ücretsiz, dosya yüklenmez.",
       card_desc="Boş sayfaları silin, belgeyi bölün ya da istediğiniz sayfaları alın.",
       steps=["PDF dosyasını ekleyin. Sayfa sayısı kutunun altında görünür.",
              "Ne yapılacağını seçin: sayfaları sil, sadece bunları al, aralıklara böl ya da her sayfayı ayır.",
              "Sayfa numaralarını yazın (örneğin 2, 5-7, 10-) ve \"Uygula\"ya basın."],
       about=["Taranmış dosyalardaki boş arka yüzler, dosya boyutunu gereksiz yere büyütür ve başvuru sistemlerinin sınırına takılır. Bu sayfaları silmek, sıkıştırmadan önce kalite kaybı olmadan boyut düşürmenin en temiz yoludur.",
              "Uzun bir belgeyi bölümlere ayırmak ya da yalnızca gereken sayfaları ayrı bir PDF olarak almak için de aynı aracı kullanabilirsiniz."],
       faq=[("Sayfa numaralarını nasıl yazarım?", "Virgülle ayırın. Tek sayfa için 4, aralık için 2-6, belirli sayfadan sona kadar için 10- yazın."),
            ("Sayfa silince kalite düşer mi?", "Hayır. Kalan sayfalar olduğu gibi kopyalanır, metin ve görüntü kalitesi değişmez."),
            ("Dosyam yükleniyor mu?", "Hayır. İşlem tarayıcınızda yapılır.")]),
]
GROUPS = [("UYAP ve dilekçe", ["udf-pdf", "udf-word", "word-udf", "pdf-udf", "dilekce", "istifa", "bilgi"]),
          ("e-İmza ve KEP", ["imz", "eyp"]),
          ("e-Fatura ve muhasebe", ["efatura", "efatura-excel"]),
          ("Başvuru evrakı", ["kimlik", "birlestir", "sikistir", "sayfa"])]
TOOL_BY_ID = {t["id"]: t for t in TOOLS}
GROUP_OF = {i: g for g, ids in GROUPS for i in ids}

def e(s): return html.escape(s, quote=True)

# ---------- varlıklar (assets_src -> site/assets) ----------
import hashlib
os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
_css = "\n".join(open(f"assets_src/{n}.css", encoding="utf-8").read() for n in ("base", "extra", "v2"))
_js = open("assets_src/base.js", encoding="utf-8").read() + "\n" + open("assets_src/extra.js", encoding="utf-8").read()
open(os.path.join(OUT, "assets/style.css"), "w", encoding="utf-8").write(_css)
open(os.path.join(OUT, "assets/app.js"), "w", encoding="utf-8").write(_js)
shutil.copy("assets_src/fonts.js", os.path.join(OUT, "assets/fonts.js"))
VER = hashlib.md5((_css + _js).encode()).hexdigest()[:8]


# ================= v2 görüntüleme =================
from content import TOOL_TEXT, HOME, HOME_PROBLEMS, HOME_FAQ
for t in TOOLS:
    x = TOOL_TEXT.get(t["id"], {})
    for k in ("title", "desc", "who", "how", "gets"):
        if k in x: t[k] = x[k]
    if x.get("faq_override"):
        t["faq"] = [(q, x["faq_override"].get(q, a)) for q, a in t["faq"]]
    t["desc_card"] = t["card_desc"]

FAVICON = "data:image/svg+xml," + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23c8102e'/%3E%3Cpath d='M10 6h9l5 5v15H10z' fill='%23fff'/%3E%3Cpath d='M12.5 15h9M12.5 19h9M12.5 23h5' stroke='%23c8102e' stroke-width='1.6'/%3E%3C/svg%3E"
LOGO = '<span class="mark" aria-hidden="true"><svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M2 1h8l4 4v12H2z" fill="#fff"/><path d="M10 1v4h4" fill="none" stroke="#c8102e" stroke-width="1.4"/><path d="M4.5 9h7M4.5 12h7M4.5 15h4" stroke="#c8102e" stroke-width="1.4"/></svg></span>'

def ld(obj): return f'<script type="application/ld+json">{json.dumps(obj, ensure_ascii=False)}</script>'
def faq_ld(faq): return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}

def head(title, desc, path, jsonld, body_attrs="", current=""):
    url = SITE + path
    nav = f'<nav class="topnav" aria-label="Ana menü"><a href="/#araclar"{" aria-current=\"page\"" if current == "araclar" else ""}>Araçlar</a><a href="/rehber/">Rehberler</a><a href="/hakkimizda/"{" aria-current=\"page\"" if current == "hakkimizda" else ""}>Hakkımızda</a></nav>'
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="tr_TR">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#c8102e">
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v={VER}">
{"".join(ld(j) for j in jsonld)}
</head>
<body{body_attrs}>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/">{LOGO}{BRAND}</a>
    {nav}
  </div>
</header>
"""

def foot(with_js=True):
    tool_links = "".join(f'<a href="/{t["slug"]}/">{e(t["card"])}</a>' for t in TOOLS)
    js = f'<script src="/assets/app.js?v={VER}" defer></script>\n' if with_js else ""
    return f"""<footer>
  <div class="wrap" style="display:grid;gap:10px">
    <nav aria-label="Tüm araçlar">{tool_links}</nav>
    <div style="display:flex;justify-content:space-between;gap:6px 16px;flex-wrap:wrap;align-items:center">
      <span>{BRAND} · Dosyalar cihazınızda işlenir, hiçbir sunucuya gönderilmez.</span>
      <nav aria-label="Kurumsal"><a href="/hakkimizda/">Hakkımızda</a><a href="/gizlilik/">Gizlilik ve KVKK</a></nav>
    </div>
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
{js}</body>
</html>
"""

def card(t):
    return f'<a class="card" data-id="{t["id"]}" href="/{t["slug"]}/"><div class="head"><span class="tag">{e(t["tag"])}</span></div><h3>{e(t["card"])}</h3><p>{e(t["card_desc"])}</p><div class="fmt"><b>{e(t["fmt"][0])}</b>→<b>{e(t["fmt"][1])}</b></div></a>'

def write(path, content):
    full = os.path.join(OUT, path.strip("/"), "index.html") if path != "/" else os.path.join(OUT, "index.html")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(content)

# ---------- rehberler (rehber/*.md) ----------
import glob as _glob
try:
    import markdown as _md
except ImportError:
    _md = None
GUIDES = []
for _f in sorted(_glob.glob("rehber/*.md")):
    _raw = open(_f, encoding="utf-8").read()
    _m = re.match(r"^---\n(.*?)\n---\n(.*)$", _raw, re.S)
    if not _m: continue
    _meta = {}
    for _line in _m.group(1).splitlines():
        if ":" in _line:
            k, v = _line.split(":", 1); _meta[k.strip()] = v.strip()
    _meta["body_md"] = _m.group(2).strip()
    _meta.setdefault("slug", os.path.basename(_f)[:-3])
    _meta["tools"] = [x.strip() for x in _meta.get("tools", "").split(",") if x.strip() in TOOL_BY_ID]
    GUIDES.append(_meta)
GUIDES.sort(key=lambda g: g.get("date", ""), reverse=True)

# ---------- araç sayfaları ----------
for t in TOOLS:
    path = f"/{t['slug']}/"
    sec = SECS[t["id"]]
    sec = re.sub(r'<div class="faq">.*?</div>\s*', "", sec, flags=re.S)
    sec = sec.replace('<a class="back" href="#">← Tüm araçlar</a>', f'<nav class="crumbs" aria-label="Konum"><a href="/">Ana sayfa</a><span>›</span><span>{e(t["card"])}</span></nav>')
    sec = re.sub(r"<h2>(.*?)</h2>", r"<h1>\1</h1>", sec, count=1)
    jsonld = [
        {"@context": "https://schema.org", "@type": "WebApplication", "name": t["card"] + " · " + BRAND, "url": SITE + path,
         "applicationCategory": "UtilitiesApplication", "operatingSystem": "Web", "inLanguage": "tr",
         "description": t["desc"], "offers": {"@type": "Offer", "price": "0", "priceCurrency": "TRY"}},
        faq_ld(t["faq"]),
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Ana sayfa", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": t["card"], "item": SITE + path}]},
    ]
    steps = "".join(f"<li><span>{e(s)}</span></li>" for s in t["steps"])
    gets = "".join(f"<li>{e(g)}</li>" for g in t.get("gets", []))
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in t["faq"])
    same = [o for o in TOOLS if o["id"] != t["id"] and GROUP_OF.get(o["id"]) == GROUP_OF.get(t["id"])]
    others = (same + [o for o in TOOLS if o["id"] != t["id"] and o not in same])[:4]
    target = "#dl-makam" if t["id"] in ("dilekce", "istifa", "bilgi") else f"#f-{t['id']}" if t["id"] != "kimlik" else "#f-on"
    next_btn = "Dilekçeyi doldurun" if t["id"] in ("dilekce", "istifa", "bilgi") else "Fotoğrafları seçin" if t["id"] == "kimlik" else "Dosyanızı seçin"
    my_guides = [g for g in GUIDES if t["id"] in g["tools"]]
    guides_sec = (f'<section class="related"><p class="section-title">İlgili rehberler</p><nav class="grid">'
                  + "".join(f'<a class="card" href="/rehber/{g["slug"]}/"><h3>{e(g.get("h1", g.get("title", "")))}</h3><p>{e(g.get("description", ""))}</p></a>' for g in my_guides)
                  + '</nav></section>') if my_guides else ""
    body = f"""<main class="wrap">
<section class="tool on" data-tool="{t['id']}">{sec}</section>
<div class="content">
  <section><h2>Ne işe yarar, kimin için?</h2><p>{e(t["about"][0])}</p><p><b>Kimin için:</b> {e(t.get("who", ""))}</p></section>
  <section><h2>Nasıl çalışır?</h2><p>{e(t.get("how", ""))}</p></section>
  <section><h2>Elinize ne geçer?</h2><ul class="gets">{gets}</ul></section>
  <section><h2>Sık sorulan sorular</h2><div class="qa">{faq}</div></section>
  <section class="next"><h2>3 adımda kullanın</h2><ol class="steps">{steps}</ol><p class="note" style="margin:0">Ücretsizdir; üyelik ya da kişisel bilgi istenmez.</p><a class="btn" href="{target}" onclick="var el=document.querySelector('{target}');if(el){{el.scrollIntoView({{behavior:'smooth',block:'center'}});setTimeout(function(){{el.focus()}},300)}};return false;">{next_btn}</a></section>
</div>
{guides_sec}<section class="related"><p class="section-title">Benzer araçlar</p><nav class="grid">{"".join(card(o) for o in others)}</nav></section>
<div style="height:48px"></div>
</main>
"""
    attrs = f' data-tool="{t["id"]}" data-libs="{",".join(t["libs"])}"'
    write(path, head(t["title"], t["desc"], path, jsonld, attrs) + body + foot())

# ---------- ana sayfa ----------
seal = '''<svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="60" cy="60" r="41" fill="none" stroke="currentColor" stroke-width="1.2"/><defs><path id="sp" d="M60,60 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0"/></defs><text><textPath href="#sp">CİHAZINIZDA İŞLENDİ · YÜKLENMEDİ ·</textPath></text><path d="M42 61l12 12 24-26" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
paper = f'<div class="paper" aria-hidden="true"><div class="ph">T.C.<br>… MAHKEMESİ</div><i class="m"></i><i></i><i></i><i class="s"></i><i></i><i class="m"></i><i class="s"></i><div class="fmt"><b>.udf</b>→<b>.pdf</b></div>{seal}</div>'
probs = "".join(f'<div class="prob"><p class="q">{e(q)}</p><div class="a"><p>{e(a)}</p><div class="links">' + "".join(f'<a href="/{TOOL_BY_ID[i]["slug"]}/">{e(TOOL_BY_ID[i]["card"])}</a>' for i in ids) + '</div></div></div>' for q, a, ids in HOME_PROBLEMS)
groups = "".join(f'<section class="home-group"><h3 style="font-size:18px">{e(g)}</h3><nav class="grid" aria-label="{e(g)}">' + "".join(card(TOOL_BY_ID[i]) for i in ids) + '</nav></section>' for g, ids in GROUPS)
hfaq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in HOME_FAQ)
home_ld = [{"@context": "https://schema.org", "@type": "WebSite", "name": BRAND, "url": SITE + "/", "inLanguage": "tr", "description": HOME["desc"]},
           {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": t["card"], "url": SITE + f"/{t['slug']}/"} for i, t in enumerate(TOOLS)]},
           faq_ld(HOME_FAQ)]
home_body = f"""<main class="wrap">
  <section class="hero" aria-labelledby="h1">
    <div class="hero-copy">
      <h1 id="h1">Resmî dosyaları tarayıcıda açın</h1>
      <p class="sub">UDF, EYP, İMZ ve e-Fatura XML dosyalarını PDF, Word ve Excel'e çevirin. Program kurmadan, üye olmadan.</p>
      <div class="hero-cta">
        <label class="btn" for="pick">Dosyanızı seçin</label>
        <input type="file" id="pick" class="sr" multiple accept=".udf,.eyp,.imz,.p7s,.p7m,.xml,.zip,.docx,.pdf,.jpg,.jpeg,.png">
        <a class="btn ghost" href="#araclar">Tüm araçlar</a>
      </div>
      <p class="accepts">.udf · .eyp · .imz · .xml · .docx · .pdf · .jpg</p>
      <div id="pick-choice" aria-live="polite"></div>
      <ul class="trust"><li>Dosyanız internete yüklenmez</li><li>Üyelik yok</li><li>Ücretsiz</li></ul>
    </div>
    {paper}
  </section>

  <section class="sec" aria-labelledby="sorun">
    <h2 id="sorun">Sık karşılaşılan dört dosya sorunu</h2>
    <div class="problems">{probs}</div>
  </section>

  <section class="sec" id="araclar" aria-labelledby="araclar-h">
    <h2 id="araclar-h">Araçlar</h2>
    <p class="intro">Her araç tek bir işi yapar. Dosya türünü bilmiyorsanız yukarıdaki "Dosyanızı seçin" düğmesini kullanın, doğru araç kendiliğinden açılır.</p>
    {groups}
  </section>

  <section class="sec" aria-labelledby="nasil">
    <h2 id="nasil">Nasıl çalışıyor?</h2>
    <ol class="flow">
      <li><b>Dosyanızı seçin</b><span>Bilgisayarınızdan ya da telefonunuzdan dosyayı seçin veya sayfaya sürükleyin.</span></li>
      <li><b>Tarayıcınızda dönüştürülür</b><span>Dönüşüm sizin cihazınızda, birkaç saniyede yapılır. Dosya bir sunucuya gönderilmez.</span></li>
      <li><b>İndirin</b><span>Sonucu PDF, Word, Excel ya da UDF olarak indirin. Birden fazla dosyayı tek ZIP'te alabilirsiniz.</span></li>
    </ol>
  </section>

  <section class="sec" aria-labelledby="kanit">
    <h2 id="kanit">Kendiniz doğrulayabilirsiniz</h2>
    <div class="proof">
      <div><b>Dosya yüklenmez</b><span>Sayfa açıldıktan birkaç saniye sonra internet bağlantınızı kesin. Araçlar çalışmaya devam eder, çünkü işlem cihazınızda yapılır.</span></div>
      <div><b>Resmî standartlar</b><span>UDF (UYAP), e-Yazışma Paketi, CAdES e-imza ve UBL-TR e-Fatura biçimleri, yayımlanmış yapılarına göre okunur.</span></div>
      <div><b>Sınırlar açıkça yazılı</b><span>İmza geçerliliği doğrulanmaz, şifreli paketler açılmaz, taranmış PDF metne çevrilmez. Her araç sayfasında ne yapmadığı yazar.</span></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="sss">
    <h2 id="sss">Sık sorulan sorular</h2>
    <div class="qa">{hfaq}</div>
  </section>

  <section class="closing" aria-labelledby="son">
    <h2 id="son">Dosyanız elinizdeyse şimdi açın</h2>
    <p>Kurulum, üyelik ya da sıra beklemek yok. Dosyayı seçtiğiniz anda işlem başlar.</p>
    <label class="btn" for="pick">Dosyanızı seçin</label>
  </section>
</main>
"""
write("/", head(HOME["title"], HOME["desc"], "/", home_ld, "", "") + home_body + foot())

# ---------- hakkımızda ----------
about_title = f"Hakkımızda – {BRAND} Nasıl Çalışır"
about_desc = f"{BRAND}, UYAP, KEP ve e-Fatura dosyalarını tarayıcıda açan ücretsiz araçlardır. Dosyanız cihazınızda işlenir, hiçbir sunucuya yüklenmez, üyelik istenmez."
about_body = f"""<main class="wrap"><article class="legal" style="max-width:780px">
<h1>Hakkımızda</h1>
<p>{BRAND}, Türkiye'de resmî yazışmada kullanılan ama sıradan programlarla açılmayan dosya biçimleri için yapılmış ücretsiz araçlardır: UYAP'ın UDF dosyaları, KEP ile gelen e-Yazışma paketleri (EYP), e-imzalı İMZ dosyaları ve GİB e-Fatura XML'leri.</p>
<div class="about-facts">
  <div><b>Desteklenen biçimler</b><span>UDF, EYP, İMZ / P7S, UBL-TR XML, DOCX, PDF, JPG, PNG</span></div>
  <div><b>Çıktılar</b><span>PDF, Word (.docx), Excel (.xlsx), UDF</span></div>
  <div><b>İşlemin yapıldığı yer</b><span>Sizin tarayıcınız. Dosyalar sunucumuza gönderilmez.</span></div>
  <div><b>Ücret ve üyelik</b><span>Ücretsiz, üyelik istemez.</span></div>
</div>
<h2>Bizimle çalışmak nasıl?</h2>
<ol class="steps">
  <li><span><b>Dosyanız sizde kalır.</b> Dönüşüm tarayıcınızın içinde yapılır. Dava evrakı, fatura ya da kimlik fotoğrafı internete gönderilmez, bizim tarafımızda saklanmaz.</span></li>
  <li><span><b>Sizden bilgi istemeyiz.</b> Üyelik, e-posta adresi ya da telefon numarası sormayız. Dilekçe aracına yazdıklarınız da yalnızca sizin cihazınızda kullanılır.</span></li>
  <li><span><b>Yapamadığımızı açıkça yazarız.</b> e-İmzanın hukuki geçerliliğini doğrulamayız, şifreli EYP paketlerini açamayız, taranmış PDF'i metne çeviremeyiz. Her araç sayfasında bu sınırlar yazılıdır.</span></li>
</ol>
</article></main>
"""
write("/hakkimizda/", head(about_title, about_desc, "/hakkimizda/", [], "", "hakkimizda") + about_body + foot(False))

# ---------- gizlilik ----------
priv = f"""<main class="wrap"><article class="legal">
<h1>Gizlilik ve KVKK</h1>
<p>Son güncelleme: {TODAY}</p>
<h2>Dosyalarınız</h2>
<p>{BRAND} araçlarına eklediğiniz dosyalar (UDF, Word, PDF, XML, fotoğraf) yalnızca kendi cihazınızdaki tarayıcıda işlenir. Bu dosyalar sunucularımıza gönderilmez, kaydedilmez ve üçüncü kişilerle paylaşılmaz. Ana sayfada seçtiğiniz dosya, ilgili araç sayfasına aktarılmak üzere yalnızca tarayıcınızın kendi deposunda birkaç saniyeliğine tutulur ve araç sayfası açılınca silinir.</p>
<h2>Kişisel veriler</h2>
<p>Site üyelik gerektirmez ve ad, e-posta ya da T.C. kimlik numarası gibi kişisel veri toplamaz. Siteyi barındıran hizmet sağlayıcı, güvenlik ve hizmetin sürdürülmesi amacıyla IP adresi ve tarayıcı bilgisi gibi standart erişim kayıtlarını tutabilir.</p>
<h2>Dış kaynaklar</h2>
<p>Sayfalar, dönüştürme kütüphanelerini ve yazı tiplerini içerik dağıtım ağlarından (cdnjs, unpkg, Google Fonts) yükler. Bu hizmetler, dosyayı sunmak için IP adresinizi görebilir. Dosyalarınız bu hizmetlere de gönderilmez.</p>
</article></main>
"""
write("/gizlilik/", head(f"Gizlilik ve KVKK | {BRAND}", f"{BRAND} araçlarında dosyalarınız cihazınızda işlenir, sunucuya yüklenmez ve saklanmaz. Kişisel veri toplanmaz. Gizlilik ve KVKK bilgilendirmesini okuyun.", "/gizlilik/", []) + priv + foot(False))

# ---------- 404, sitemap, robots, CNAME ----------
nf = head("Sayfa bulunamadı | " + BRAND, "Aradığınız sayfa bulunamadı.", "/404.html", []) + f"""<main class="wrap"><section class="legal"><h1>Sayfa bulunamadı</h1><p>Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Araçlardan birini seçin:</p><nav class="grid">{"".join(card(t) for t in TOOLS)}</nav></section></main>""" + foot(False)
nf = nf.replace('<link rel="canonical" href="' + SITE + '/404.html">', '<meta name="robots" content="noindex">')
open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(nf)
urls = ["/"] + [f"/{t['slug']}/" for t in TOOLS] + ["/hakkimizda/", "/gizlilik/"]
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
    f"  <url><loc>{SITE}{u}</loc><lastmod>{SRC_DATE}</lastmod></url>\n" for u in urls) + "</urlset>\n"
open(os.path.join(OUT, "sitemap.xml"), "w").write(sm)
open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
open(os.path.join(OUT, "CNAME"), "w").write(SITE.replace("https://", "") + "\n")
open(os.path.join(OUT, ".nojekyll"), "w").write("")
for f in ("_headers",):
    if os.path.exists(os.path.join(OUT, f)): os.remove(os.path.join(OUT, f))
print("ok", len(urls), "sayfa")


def _faq_from_md(md_text):
    sec = re.split(r"^## Sık sorulan sorular\s*$", md_text, flags=re.M)
    if len(sec) < 2: return []
    out = []
    for blk in re.split(r"^### ", sec[1], flags=re.M)[1:]:
        lines = blk.strip().split("\n", 1)
        q = lines[0].strip(); a = re.sub(r"\s+", " ", re.sub(r"[*_`#>\[\]]|\(http[^)]*\)", "", lines[1] if len(lines) > 1 else "")).strip()
        a = re.split(r"\n## ", a)[0]
        if q and a: out.append((q, a))
    return out

for g in GUIDES:
    path = f"/rehber/{g['slug']}/"
    body_html = _md.markdown(g["body_md"], extensions=["tables", "sane_lists"]) if _md else "<p>" + e(g["body_md"]) + "</p>"
    faq = _faq_from_md(g["body_md"])
    tools_html = "".join(card(TOOL_BY_ID[i]) for i in g["tools"])
    jsonld = [{"@context": "https://schema.org", "@type": "Article", "headline": g.get("title", ""), "description": g.get("description", ""),
               "datePublished": g.get("date", TODAY), "dateModified": g.get("updated", g.get("date", TODAY)), "inLanguage": "tr",
               "mainEntityOfPage": SITE + path, "publisher": {"@type": "Organization", "name": BRAND}},
              {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                  {"@type": "ListItem", "position": 1, "name": "Ana sayfa", "item": SITE + "/"},
                  {"@type": "ListItem", "position": 2, "name": "Rehberler", "item": SITE + "/rehber/"},
                  {"@type": "ListItem", "position": 3, "name": g.get("title", ""), "item": SITE + path}]}]
    if faq: jsonld.append(faq_ld(faq))
    page = f"""<main class="wrap"><article class="legal guide" style="max-width:760px">
<nav class="crumbs" aria-label="Konum"><a href="/">Ana sayfa</a><span>›</span><a href="/rehber/">Rehberler</a></nav>
<h1>{e(g.get('h1', g.get('title', '')))}</h1>
<p class="note">Güncelleme: {e(g.get('updated', g.get('date', '')))}</p>
{body_html}
</article>
{f'<section class="related"><p class="section-title">Bu rehberde geçen araçlar</p><nav class="grid">{tools_html}</nav></section>' if tools_html else ''}
<div style="height:48px"></div></main>
"""
    write(path, head(g.get("title", ""), g.get("description", ""), path, jsonld) + page + foot(False))

if GUIDES:
    items = "".join(f'<a class="card" href="/rehber/{g["slug"]}/"><h3>{e(g.get("h1", g.get("title", "")))}</h3><p>{e(g.get("description", ""))}</p></a>' for g in GUIDES)
    write("/rehber/", head(f"Rehberler – UDF, EYP, e-İmza ve e-Fatura | {BRAND}", f"UYAP UDF, KEP EYP, e-imzalı İMZ ve e-Fatura XML dosyalarıyla ilgili adım adım rehberler. Dosya nasıl açılır, nasıl çevrilir, nelere dikkat edilir; hepsi burada.", "/rehber/", [])
          + f'<main class="wrap"><section class="legal" style="max-width:none"><h1>Rehberler</h1><p class="note">Resmî dosya biçimleriyle ilgili adım adım anlatımlar.</p><nav class="grid">{items}</nav></section></main>' + foot(False))
    sm = open(os.path.join(OUT, "sitemap.xml")).read().replace("</urlset>\n", "".join(f"  <url><loc>{SITE}/rehber/{g['slug']}/</loc><lastmod>{g.get('updated', g.get('date', TODAY))}</lastmod></url>\n" for g in GUIDES) + f"  <url><loc>{SITE}/rehber/</loc><lastmod>{max([SRC_DATE] + [str(g.get('updated', g.get('date', SRC_DATE))) for g in GUIDES])}</lastmod></url>\n</urlset>\n")
    open(os.path.join(OUT, "sitemap.xml"), "w").write(sm)
print("rehber:", len(GUIDES))

# ---------- static/ klasörü (doğrulama dosyaları vb.) olduğu gibi kopyalanır ----------
if os.path.isdir("static"):
    for _n in os.listdir("static"):
        shutil.copy(os.path.join("static", _n), os.path.join(OUT, _n))
