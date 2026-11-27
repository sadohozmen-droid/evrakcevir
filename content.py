# -*- coding: utf-8 -*-
"""Evrakçevir metinleri. Başlık <= 60, açıklama 150-160 karakter hedeflenir.
who: kimin için · how: nasıl çalışır · gets: elinize geçenler · faq_override: soruya ilk cümlede cevap veren sürümler."""

TOOL_TEXT = {
 "udf-pdf": dict(
   title="UDF PDF Çevirme – UYAP UDF Dosyasını PDF'e Dönüştürün",
   desc="UYAP'tan inen UDF dosyasını Doküman Editörü kurmadan PDF'e çevirin. Hizalama, tablolar ve görseller korunur. Ücretsiz, telefonda da çalışır, dosya yüklenmez.",
   who="UYAP'tan karar, tebligat ya da dilekçe indiren vatandaşlar, avukatlar, şirketlerin hukuk ve insan kaynakları birimleri.",
   how="Araç UDF paketinin içindeki metni ve biçim bilgisini (paragraf hizası, girinti, yazı tipi boyutu, kalın ve italik yazı, tablolar, gömülü görseller) okur ve aynı düzende bir PDF sayfası dizer. İşlem tarayıcınızda yapılır, dosya internete gönderilmez.",
   gets=["Her bilgisayarda, telefonda ve tablette açılan bir PDF", "Birden fazla dosya seçtiyseniz hepsini tek ZIP'te indirme seçeneği"],
   faq_override={"Çıktı aslıyla birebir aynı mı?": "Büyük ölçüde aynıdır, ama birebir değildir. Metin, paragraf hizası, yazı boyutu, kalın ve italik yazı, tablolar ve gömülü görseller aktarılır. Üst bilgi, alt bilgi ve elektronik imza bilgisi PDF'e eklenmez. Resmî işlemlerde belgenin UYAP'taki aslı geçerlidir."}),
 "udf-word": dict(
   title="UDF Word Çevirme – UDF Dosyasını Word'e (DOCX) Dönüştürün",
   desc="UYAP UDF dosyasını düzenlenebilir Word (.docx) belgesine çevirin. Hizalama, girintiler, kalın ve italik yazı ile tablolar korunur. Ücretsiz, dosya yüklenmez.",
   who="Karar metninden alıntı yapacak avukatlar ve stajyerler, eski bir dilekçeyi yeni taslağa taşımak isteyenler.",
   how="UDF içindeki her paragraf, biçimiyle birlikte Word paragrafına; tablolar Word tablosuna dönüştürülür. Yazı tipi ve boyutu, satır aralığı, sayfa kenar boşlukları ve yatay/dikey sayfa ayarı da aktarılır.",
   gets=["Word, LibreOffice ve Google Dokümanlar'da açılan bir .docx dosyası", "Düzenlemeye hazır metin ve tablolar"],
   faq_override={"UDF'yi Word'e çevirince biçim bozulur mu?": "Hayır, biçim büyük ölçüde korunur. Paragraf hizası, girintiler, satır aralığı, yazı tipi ve boyutu ile tablolar aktarılır. UDF içindeki görseller Word çıktısına eklenmez. Görselli belgeler için UDF'yi PDF'e çevirin."}),
 "word-udf": dict(
   title="Word UDF Çevirme – Word Dilekçeyi UYAP UDF'ye Dönüştürün",
   desc="Word'de yazdığınız dilekçeyi UYAP'a uygun UDF formatına çevirin. Hizalama, numaralı maddeler, kalın ve altı çizili yazı ile tablolar aktarılır. Ücretsiz.",
   who="Dilekçesini Word'de yazıp UYAP Avukat Portal ya da Vatandaş Portal üzerinden göndermek isteyen avukatlar ve vatandaşlar.",
   how="Araç .docx dosyasındaki paragrafları, stilleri, numaralandırmayı ve tabloları okur, UDF'nin metin ve biçim yapısına yazar. Numaralı maddelerin numaraları metne çevrilerek korunur.",
   gets=["UYAP Doküman Editörü'nde açılabilecek bir .udf dosyası", "Görsel ya da sayfa sonu aktarılmadıysa hangilerinin atlandığını gösteren not"],
   faq_override={"Word'den UDF'ye çevrilen dosya UYAP'ta açılır mı?": "Açılması beklenir, ama göndermeden önce bir kez kontrol etmeniz gerekir. Dosya UDF yapısına uygun oluşturulur. Yine de UYAP'a yüklemeden önce UYAP Doküman Editörü'nde açıp görünümünü kontrol edin."}),
 "pdf-udf": dict(
   title="PDF UDF Çevirme – PDF'i UYAP UDF Formatına Dönüştürün",
   desc="Metin içeren PDF dosyasını paragraflarıyla birlikte UYAP UDF formatına çevirin. Kalın ve italik yazı korunur, bölünen kelimeler birleşir. Ücretsiz, yükleme yok.",
   who="Elinde yalnızca PDF'i olan bir metni UYAP'a UDF olarak göndermesi gerekenler.",
   how="Araç PDF'teki metin satırlarını konumlarına göre okur, aynı paragrafa ait satırları birleştirir, satır sonunda tireyle bölünmüş kelimeleri düzeltir ve ortalanmış başlıkları tanır. Sonuç UDF biçiminde yazılır.",
   gets=["Paragrafları ayrılmış, düzenlenebilir bir .udf dosyası"],
   faq_override={}),
 "efatura": dict(
   title="e-Fatura XML PDF Çevirme – e-Arşiv XML'i PDF'e Dönüştürün",
   desc="GİB e-Fatura, e-Arşiv ve e-İrsaliye XML dosyalarını PDF'e çevirin. Faturanın kendi tasarımı kullanılır, ZIP ile toplu dönüşüm yapılır. Ücretsiz, veri yüklenmez.",
   who="Gelen faturaları arşivleyen işletmeler, muhasebe büroları ve e-postayla XML fatura alan bireyler.",
   how="e-Fatura XML'inin içinde faturanın görünümünü belirleyen bir tasarım (XSLT) dosyası gömülüdür. Araç bu tasarımı bulup uygular ve sonucu A4 sayfalara yerleştirir. Tasarım yoksa satıcı, alıcı, kalemler, KDV ve toplamları gösteren sade bir şablon kullanır.",
   gets=["Her fatura için yazdırılabilir bir PDF", "Çok sayıda fatura için tek ZIP dosyası"],
   faq_override={}),
 "efatura-excel": dict(
   title="e-Fatura XML Excel'e Aktarma – Toplu Fatura Listesi Çıkarın",
   desc="e-Fatura ve e-Arşiv XML dosyalarını toplu olarak Excel'e aktarın. Fatura no, tarih, VKN, matrah, KDV ve tüm kalemler tek tabloda. Ücretsiz, dosya yüklenmez.",
   who="KDV beyannamesi öncesi alış faturalarını kontrol eden muhasebe büroları, cari mutabakat yapan işletmeler.",
   how="Araç her XML'den fatura başlığını (no, tarih, tip, senaryo, taraflar, VKN/TCKN, tutarlar, ETTN) ve tüm fatura kalemlerini okur. Tutarlar Excel'e sayı olarak yazılır; ilk satır sabitlenir ve filtre eklenir.",
   gets=["İki sayfalı bir Excel dosyası: Faturalar ve Kalemler", "Doğrudan toplanabilen ve filtrelenebilen tutar sütunları"],
   faq_override={}),
 "imz": dict(
   title="İMZ Dosyası Açma – e-İmzalı .imz Dosyasını PDF'e Çevirin",
   desc="e-imzalı .imz dosyasını program ve kart olmadan, telefonda bile açın. İçindeki PDF, Word ya da UDF belgeyi çıkarır, imzalayanı gösterir. Dosya yüklenmez.",
   who="KEP ya da e-postayla e-imzalı belge alan şirketler, vatandaşlar, avukatlar ve muhasebeciler.",
   how=".imz dosyası, asıl belgeyi ve elektronik imzayı birlikte taşıyan bir zarftır (CAdES). Araç zarfı açar, içindeki belgenin türünü kendisi bulur ve sertifikadaki imzalayan adını ve imza zamanını okur. Seri imzalı dosyalarda tüm katmanları sırayla açar.",
   gets=["İmzanın içindeki asıl belge (PDF, Word, UDF, XML)", "İmzalayanların adı ve imza zamanı"],
   faq_override={}),
 "eyp": dict(
   title="EYP Dosyası Açma – KEP ile Gelen Paketi Programsız Açın",
   desc="KEP ile gelen .eyp dosyasını program kurmadan, telefonda bile açın. Üst yazıyı ve ekleri ayrı ayrı indirin; konu, sayı ve gönderen görünür. Ücretsizdir.",
   who="Kamu kurumlarından KEP ile resmî yazı alan şirketler, dernekler, avukatlar ve vatandaşlar.",
   how=".eyp dosyası, e-Yazışma Teknik Rehberi'ne göre hazırlanmış bir pakettir: içinde üst yazı, ekler, belgenin üst verisi ve imza dosyaları bulunur. Araç paketi açar, üst yazıyı ve ekleri ayırır, üst veriden konu, sayı, tarih ve gönderen bilgisini okur.",
   gets=["Üst yazı ve her ek, ayrı dosyalar olarak", "Belgenin konu, sayı, tarih ve gönderen özeti"],
   faq_override={}),
 "dilekce": dict(
   title="Dilekçe Yazma – Word, PDF ve UDF Dilekçe Hazırlayın",
   desc="Valilik, kaymakamlık, belediye, okul ya da şirkete verilecek dilekçeyi doğru düzende hazırlayın. Word, PDF ya da UYAP'a uygun UDF olarak indirin. Ücretsiz.",
   who="Bir kuruma yazılı başvuru yapacak herkes: öğrenciler, çalışanlar, emekliler, esnaf.",
   how="Makamı, konuyu, metni ve bilgilerinizi yazarsınız; araç dilekçe düzenini kurar. Makam üstte ortalanır, metin iki yana yaslanır, tarih, ad soyad ve imza yeri sağ altta, adres ve ekler sol altta yer alır. Yazı tipi Times New Roman 12 puntodur.",
   gets=["Düzenlenebilir Word dosyası, yazdırılabilir PDF ya da UYAP için UDF"],
   faq_override={}),
 "istifa": dict(
   title="İstifa Dilekçesi Örneği – Word ve PDF Olarak Hazırlayın",
   desc="Hazır istifa dilekçesi örneğini kendi bilgilerinizle doldurun, Word ya da PDF olarak indirin. Bildirim süresi ve işçilik alacaklarınız saklı tutulur. Ücretsiz.",
   who="Kendi isteğiyle işten ayrılmaya karar veren çalışanlar.",
   how="Hazır metin; işe giriş tarihinizi ve pozisyonunuzu, kendi isteğinizle istifa ettiğinizi, yasal bildirim süresine uyulacağını ve ücret, yıllık izin gibi alacaklarınızın ödenmesi talebini içerir. Noktalı yerleri doldurup bilgilerinizi eklersiniz.",
   gets=["İmzalanıp işverene verilmeye hazır Word ya da PDF dilekçe"],
   faq_override={}),
 "bilgi": dict(
   title="Bilgi Edinme Dilekçesi Örneği – 4982 Sayılı Kanun Başvurusu",
   desc="4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında kamu kurumuna verilecek başvuru dilekçesini hazırlayın. İstediğiniz bilgileri yazın, Word ya da PDF indirin.",
   who="Bir kamu kurumunun faaliyetiyle ilgili bilgi ya da belge isteyen vatandaşlar, gazeteciler, dernekler.",
   how="Hazır metin, başvurunun 4982 sayılı Kanun'a dayandığını belirtir, istenen bilgileri madde madde sıralar ve cevabın gönderileceği adresi sorar. Kurumu, maddeleri ve bilgilerinizi yazmanız yeterlidir.",
   gets=["Kuruma verilmeye hazır Word ya da PDF başvuru dilekçesi"],
   faq_override={}),
 "kimlik": dict(
   title="Kimlik Ön Arka Tek Sayfa – Gerçek Boyutta PDF Fotokopi",
   desc="T.C. kimlik kartı ya da ehliyetin ön ve arka yüzünü tek A4 sayfaya gerçek boyutta (85,6 × 54 mm) yerleştirip PDF yapın. Ücretsiz, fotoğraflarınız yüklenmez.",
   who="İş başvurusu, banka, okul ya da resmî kurum için kimlik fotokopisi hazırlayanlar.",
   how="İki fotoğraf A4 sayfaya alt alta yerleştirilir. Gerçek boyut seçeneğinde her yüz 85,6 × 54 mm'lik alana sığdırılır; yazdırma ölçeği %100 seçildiğinde kartın kendi ölçüsünde çıkar. İsterseniz siyah-beyaz fotokopi görünümü verilir.",
   gets=["Yazdırılmaya hazır, tek sayfalık PDF"],
   faq_override={}),
 "birlestir": dict(
   title="PDF Birleştirme Ücretsiz – e-Devlet Belgeleri ve JPG Tek PDF",
   desc="PDF ve JPG dosyalarını ekleyin, sırasını ayarlayın, tek PDF'te birleştirin. e-Devlet barkodu bozulmaz, telefonda çalışır. Ücretsiz, üyeliksiz, yükleme yok.",
   who="Burs, iş, vize ya da ihale başvurusu için belgeleri tek dosyada toplaması gerekenler.",
   how="PDF sayfaları olduğu gibi kopyalanır, böylece e-Devlet barkodu ve karekodu bozulmaz. Fotoğraflar A4 sayfaya kenar boşluğuyla ortalanır; yatay fotoğraflar yatay sayfaya yerleşir.",
   gets=["Seçtiğiniz sırada tek bir PDF dosyası", "Eklenemeyen dosya varsa adıyla birlikte uyarı"],
   faq_override={}),
 "sikistir": dict(
   title="PDF Küçültme – PDF'i 1 MB, 2 MB ya da 5 MB Altına Düşürün",
   desc="PDF dosyasını başvuru sisteminin sınırına göre 1, 2, 5 ya da 10 MB altına küçültün. Hedef boyutu seçin, araç kademeli sıkıştırsın. Ücretsiz, dosya yüklenmez.",
   who="Üniversite, burs, iş ve ihale sistemlerine boyut sınırı olan belge yükleyenler.",
   how="Önce kalite kaybı olmayan küçültme denenir. Yetmezse sayfalar görüntüye çevrilip çözünürlük kademeli olarak düşürülür; hedefin altına inen ilk, yani en kaliteli sonuç verilir. Siyah-beyaz seçeneği boyutu daha da azaltır.",
   gets=["Hedef boyutun altında bir PDF", "İnilemezse en küçük sonuç ve ne yapılabileceğine dair öneri"],
   faq_override={}),
 "sayfa": dict(
   title="PDF Sayfa Silme ve Ayırma – Ücretsiz, Programsız",
   desc="PDF'ten sayfa silme: boş ya da gereksiz sayfaları tek seferde atın, istediğiniz sayfaları ayrı PDF yapın. Kalite düşmez, telefonda çalışır, dosya yüklenmez.",
   who="Taranmış belgelerdeki boş sayfaları atmak ya da uzun bir belgeyi bölmek isteyenler.",
   how="Sayfa numaralarını 2, 5-7 ya da 10- biçiminde yazarsınız. Seçilen sayfalar olduğu gibi kopyalanır; metin ve görüntü kalitesi değişmez.",
   gets=["Düzenlenmiş tek bir PDF ya da her aralık için ayrı PDF"],
   faq_override={}),
}

HOME = dict(
  title="UDF, EYP, İMZ ve e-Fatura Dosyası Açma | Evrakçevir",
  desc="UYAP UDF, KEP EYP, e-imzalı İMZ ve e-Fatura XML dosyalarını programsız açın; PDF, Word ve Excel'e çevirin. Ücretsiz, üyeliksiz, dosyanız cihazınızdan çıkmaz.",
)

HOME_PROBLEMS = [
  ("UYAP'tan inen .udf dosyası çift tıklayınca açılmıyor.", "UDF dosyasını PDF ya da Word olarak açın. UYAP Doküman Editörü kurmanız gerekmez.", ["udf-pdf", "udf-word"]),
  ("KEP ile gelen .eyp ya da .imz dosyası için program istiyor.", "Paketten üst yazıyı ve ekleri çıkarın, e-imzalı dosyanın içindeki belgeyi açın.", ["eyp", "imz"]),
  ("Ay sonunda yüzlerce e-Fatura XML'ini tek tek açmak gerekiyor.", "Hepsini tek seferde PDF'e çevirin ya da tek bir Excel tablosunda listeleyin.", ["efatura", "efatura-excel"]),
  ("Başvuru sistemi \"en fazla 2 MB\" diyor, dosya büyük.", "Boş sayfaları silin, sonra PDF'i hedef boyutun altına küçültün.", ["sayfa", "sikistir"]),
]

HOME_FAQ = [
  ("UDF dosyası nasıl açılır?", "UDF dosyasını UDF → PDF aracına bırakırsanız birkaç saniyede PDF olarak açılır. UYAP Doküman Editörü kurmanız gerekmez. Metni düzenlemek isterseniz UDF → Word aracını kullanın."),
  ("EYP dosyası nasıl açılır?", "EYP açma aracına bırakın; üst yazı ve ekler ayrı dosyalar olarak çıkar. Şifreli paketler yalnızca alıcı kurumun anahtarıyla açılabilir."),
  (".imz uzantılı dosya nasıl açılır?", "İMZ açma aracı, e-imzalı dosyanın içindeki PDF, Word ya da UDF belgeyi çıkarır ve imzalayanın adını gösterir. İmzanın hukuki geçerliliğini doğrulamaz; bunun için İmzager gibi bir e-imza programı gerekir."),
  ("Dosyalarım bir sunucuya yükleniyor mu?", "Hayır. Tüm dönüşümler tarayıcınızın içinde yapılır ve dosyanız internete gönderilmez. Sayfa açıldıktan birkaç saniye sonra internet bağlantınızı kesip deneyerek bunu kendiniz doğrulayabilirsiniz."),
  ("Ücretli mi, üyelik gerekiyor mu?", "Hayır. Tüm araçlar ücretsizdir; üyelik, e-posta adresi ya da kişisel bilgi istenmez."),
]
