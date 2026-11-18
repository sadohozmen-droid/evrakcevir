---
title: İMZ Dosyası Nedir? e-İmzalı .imz Belge Nasıl Açılır
h1: .imz dosyası nedir, e-imzalı belge nasıl açılır?
description: .imz dosyası, asıl belgeyi ve elektronik imzayı birlikte taşıyan bir zarftır. İçindeki PDF ya da Word belgeyi programsız çıkarmanın kolay yolu bu rehberde.
date: 2026-11-18
updated: 2026-11-18
tools: imz, eyp, udf-pdf
---
.imz dosyası, elektronik imzayla imzalanmış bir belgenin, imzayla birlikte tek dosyada saklanmış hâlidir: asıl belge (PDF, Word, UDF ya da XML) imza bilgisinin içine paketlenir. Bilgisayarınız bu uzantıyı tanımadığı için dosya çift tıklayınca açılmaz. İçindeki belgeyi okumanın en kolay yolu, dosyayı [İMZ dosyası açma aracına](/imz-dosyasi-acma/) bırakıp çıkan belgeyi indirmektir.

## .imz dosyası nedir?

e-imza programları bir belgeyi imzaladığında, belgeyi değiştirmez; onu imza bilgileriyle birlikte bir **zarfın** içine koyar. Bu zarfın uluslararası adı CAdES'tir (CMS tabanlı elektronik imza biçimi). Türkiye'de bu zarf çoğu zaman **.imz** uzantısıyla kaydedilir. Aynı yapıdaki dosyalar bazı programlarda **.p7s** ya da **.p7m** uzantısıyla da karşınıza çıkabilir.

Zarfın içinde genellikle şunlar bulunur:

| Bölüm | İçinde ne var? | Sizin için anlamı |
|---|---|---|
| Asıl belge | İmzalanan dosyanın kendisi (PDF, Word, UDF, XML…) | Okumanız gereken belge |
| İmzalayanın sertifikası | Ad soyad, sertifikayı veren kuruluş, geçerlilik tarihleri | Belgeyi kimin imzaladığını gösterir |
| İmza değeri | Belgenin içeriğine bağlı şifreli imza verisi | Belgenin sonradan değişip değişmediğini anlamaya yarar |
| İmza zamanı | İmzanın atıldığı tarih ve saat | Belgenin ne zaman imzalandığını gösterir |

Birden fazla kişi belgeyi sırayla imzaladıysa (seri imza), zarflar iç içe geçer. Bu yüzden bazen dosya adı `belge.pdf.imz.imz` gibi birden fazla uzantıyla biter.

## .imz dosyası nereden gelir?

En sık şu yollarla gelir:

- **KEP (Kayıtlı Elektronik Posta) iletisinin eki olarak.** Şirketler, avukatlar ve kurumlar e-imzalı belgeyi KEP ile gönderdiğinde ek çoğu zaman .imz olur.
- **EYP paketinin içinden.** Kamu kurumlarından gelen [EYP dosyasını](/rehber/eyp-dosyasi-nedir/) açtığınızda eklerden biri .imz çıkabilir.
- **e-posta ya da flaş bellekle.** e-imza programıyla imzalanmış bir sözleşme, rapor ya da tutanak doğrudan size iletilmiş olabilir.

## .imz dosyası nasıl açılır? (programsız, adım adım)

1. Dosyayı KEP hesabınızdan, e-postadan ya da paketten bilgisayarınıza veya telefonunuza indirin.
2. [İMZ dosyası açma aracını](/imz-dosyasi-acma/) açın ve dosyayı kutuya bırakın. .p7s ve .p7m dosyaları da kabul edilir.
3. "Belgeyi çıkar" düğmesine basın. Araç imza katmanlarını açar ve içindeki belgenin türünü kendisi bulur.
4. Çıkan PDF, Word, UDF ya da XML dosyasını indirin. İmzalayanın adı ve imza zamanı sonucun altında görünür.

Dosya tarayıcınızın içinde açılır, hiçbir sunucuya yüklenmez. Seri imzalı dosyalarda araç tüm katmanları sırayla çözer.

## İçinden .udf ya da .xml çıktıysa ne yapmalı?

Zarfın içindeki belge her zaman PDF olmayabilir:

- **.udf çıktıysa:** Belge UYAP biçimindedir. [UDF → PDF aracı](/udf-pdf-cevirme/) ile okunabilir PDF'e çevirebilirsiniz. Ayrıntılar [UDF dosyası nasıl açılır?](/rehber/udf-dosyasi-nasil-acilir/) rehberinde.
- **.xml çıktıysa ve bir e-Fatura ise:** [e-Fatura XML → PDF aracı](/e-fatura-xml-pdf-cevirme/) faturayı okunur hâle getirir.
- **.docx ya da .doc çıktıysa:** Word, LibreOffice ya da telefonunuzdaki ofis uygulamasıyla açılır.

## .imz dosyası neden açılmıyor?

En sık nedenler şunlardır:

- **Bilgisayarda uygun program yok.** Windows, macOS ve telefonlar .imz uzantısını tanımaz. Dosyayı bir İMZ açıcıya bırakmanız ya da bir e-imza programı kullanmanız gerekir.
- **Ayrık imza.** Bazı imza dosyaları belgenin kendisini içermez, yalnızca imzayı taşır. Bu durumda belge size ayrı bir dosya olarak gelmiş olmalıdır; asıl belgeyi o dosyada arayın.
- **Dosya eksik ya da bozuk indi.** İndirme yarıda kesildiyse zarf açılmaz. Dosyayı yeniden indirmeyi deneyin.
- **Dosya şifreli.** Belge alıcıya özel şifrelenmişse yalnızca alıcının anahtarıyla açılabilir; genel araçlar şifreli dosyayı açamaz.

## e-imzalı belge geçerli mi, nasıl kontrol edilir?

Güvenli elektronik imza, 5070 sayılı Elektronik İmza Kanunu'nun 5. maddesine göre **elle atılan imza ile aynı hukuki sonucu doğurur**. Aynı madde, kanunların resmî şekle ya da özel bir merasime bağladığı işlemlerin ve teminat sözleşmelerinin güvenli elektronik imzayla yapılamayacağını da belirtir.

İmzanın gerçekten geçerli olup olmadığını (sertifikanın geçerliliği, belgenin imzadan sonra değişmediği) anlamak için bir **e-imza programı** gerekir. Örneğin TÜBİTAK BİLGEM'in geliştirdiği İmzager, imzalı belgelerin imzalarını görüntüleme ve doğrulama işlevine sahiptir.

Evrakçevir'in İMZ aracı imzalayanın adını ve imza zamanını **gösterir**, ama imzanın hukuki geçerliliğini **doğrulamaz**. Çıkardığınız PDF, belgeyi okumanız için bir kopyadır; bir yere resmî olarak sunacaksanız .imz dosyasının aslını saklayın.

## Sık sorulan sorular

### .imz uzantısı ne demek?
.imz, e-imzalı belgenin imzayla birlikte saklandığı dosyanın uzantısıdır. İçinde asıl belge, imzalayanın sertifikası ve imza bilgisi bulunur.

### .imz dosyasını açmak için e-imza kartı gerekir mi?
Hayır, yalnızca okumak için e-imza kartı ya da kart okuyucu gerekmez. Kart, belgeyi imzalamak için gerekir; [İMZ açma aracı](/imz-dosyasi-acma/) kartsız ve programsız çalışır.

### .imz dosyası telefonda açılır mı?
Evet, açılır. Telefonun tarayıcısında İMZ açma aracını açıp dosyayı "Dosyalar" uygulamasından seçmeniz yeterlidir; çıkan PDF'i telefonun PDF görüntüleyicisinde okuyabilirsiniz.

### .imz ile .p7s arasında fark var mı?
İkisi de aynı türden (CMS/CAdES) imza dosyasıdır; fark çoğunlukla imzalayan programın verdiği uzantıdır. Bazı .p7s dosyaları ise belgeyi içermeyen ayrık imzadır.

### Çıkan PDF'i resmî belge olarak kullanabilir miyim?
Tek başına hayır. Elektronik imza .imz dosyasının içinde anlam taşır; çıkardığınız PDF bir okuma kopyasıdır. Resmî bir yere sunacaksanız aslını saklayın ve karşı tarafa hangi biçimi kabul ettiğini sorun.

### Dosyam bir sunucuya gönderiliyor mu?
Hayır. Evrakçevir'de .imz dosyası tarayıcınızın içinde açılır ve hiçbir sunucuya yüklenmez.
