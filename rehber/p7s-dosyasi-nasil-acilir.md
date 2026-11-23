---
title: P7S Dosyası Nasıl Açılır? smime.p7s ve .p7m Rehberi
h1: .p7s dosyası nasıl açılır?
description: .p7s bir elektronik imza dosyasıdır. e-postadaki smime.p7s ekini açmanıza gerek yoktur; belge içeren .p7s ve .p7m dosyalarını ise programsız açabilirsiniz.
date: 2026-11-23
updated: 2026-11-23
tools: imz, eyp
---
.p7s dosyası, bir belgeye ya da e-postaya atılmış elektronik imzayı taşıyan dosyadır. e-postanın ekinde gördüğünüz **smime.p7s** yalnızca imzadır; iletinin metni zaten e-postanın kendisidir, bu eki açmanız gerekmez. Size belge olarak gelen bir .p7s ya da .p7m dosyasının içindeki PDF veya Word belgeyi ise [İMZ dosyası açma aracına](/imz-dosyasi-acma/) bırakarak program kurmadan çıkarabilirsiniz.

## .p7s dosyası nedir?

.p7s uzantısı, CMS (Cryptographic Message Syntax, eski adıyla PKCS #7) biçimindeki imza verisi için kullanılır. e-posta imzalama standardı S/MIME'ı tanımlayan RFC 8551, imza verisi taşıyan bu türe .p7s, imzalı ya da şifreli iletinin tamamını taşıyan türe ise .p7m uzantısını verir.

Türkiye'de e-imza programlarının ürettiği **.imz** dosyaları da aynı CMS yapısındadır. Yani .p7s, .p7m ve .imz çoğu zaman aynı türden zarfın farklı adlarıdır. Aradaki fark, zarfın içinde belgenin bulunup bulunmamasıdır:

| Dosya | İçinde belge var mı? | Ne yapmalı? |
|---|---|---|
| e-postadaki **smime.p7s** | Hayır, yalnızca imza | Açmanıza gerek yok; iletinin metnini okuyun |
| Belge olarak gelen **.p7s** (ör. `sozlesme.pdf.p7s`) | Olabilir | [İMZ açma aracıyla](/imz-dosyasi-acma/) belgeyi çıkarın |
| İmzalı **.p7m** (ör. `fatura.xml.p7m`) | Evet | Aynı araçla belgeyi çıkarın |
| Şifreli **.p7m** (e-postada smime.p7m) | Var, ama şifreli | Yalnızca alıcının sertifikasıyla, e-posta programında açılır |
| **.imz** | Evet | Ayrıntılar [.imz dosyası nedir?](/rehber/imz-dosyasi-nedir/) rehberinde |

## e-postadaki smime.p7s eki nedir, silebilir miyim?

smime.p7s, gönderenin e-postasını dijital sertifikayla imzaladığını gösterir. İleti iki parça olarak gelir: biri sizin okuduğunuz metin, diğeri bu metne ait imza. İmzayı tanıyan e-posta programları eki göstermez, bunun yerine iletinin imzalı olduğunu bir simgeyle belirtir. İmzayı tanımayan programlar ise dosyayı sıradan bir ek gibi listeler.

Bu ek bir belge içermez. Çift tıklayınca bir şey açılmaması ya da bir araç "belgeyi içermiyor" demesi normaldir. Eki silmek iletinin metnini bozmaz; ancak imzanın sonradan kontrol edilebilmesini istiyorsanız iletiyi olduğu gibi saklamanız yeterlidir.

## Belge içeren .p7s veya .p7m dosyası nasıl açılır? (adım adım)

1. Dosyayı e-postadan, KEP hesabınızdan ya da bir paketin içinden bilgisayarınıza veya telefonunuza indirin.
2. [İMZ dosyası açma aracını](/imz-dosyasi-acma/) açın ve .p7s ya da .p7m dosyasını kutuya bırakın.
3. "Belgeyi çıkar" düğmesine basın. Araç imza zarfını açar ve içindeki belgenin türünü kendisi bulur.
4. Çıkan PDF, Word, UDF ya da XML dosyasını indirin. İmzalayanın adı ve imza zamanı sonucun altında görünür.

Dosya tarayıcınızın içinde açılır, hiçbir sunucuya yüklenmez. Birden fazla kişinin sırayla imzaladığı dosyalarda araç imza katmanlarını sırayla çözer.

Araç "Bu imza dosyası belgenin kendisini içermiyor (ayrık imza)" derse elinizdeki dosya yalnızca imzadır. Bu durumda belge size ayrı bir dosya olarak gelmiş olmalıdır; aynı adı taşıyan PDF ya da Word dosyasını arayın.

## İçinden .udf, .xml ya da .eyp çıktıysa ne yapmalı?

Zarfın içindeki belge her zaman PDF olmayabilir:

- **.udf çıktıysa:** UYAP belgesidir. [UDF → PDF aracıyla](/udf-pdf-cevirme/) PDF'e çevirebilirsiniz.
- **.xml çıktıysa ve bir faturaysa:** [e-Fatura XML → PDF aracı](/e-fatura-xml-pdf-cevirme/) faturayı okunur hâle getirir. Ayrıntılar [e-Fatura XML dosyası nasıl açılır?](/rehber/e-fatura-xml-dosyasi-nasil-acilir/) rehberinde.
- **.eyp çıktıysa:** Bu bir e-Yazışma paketidir. [EYP dosyası açma aracıyla](/eyp-dosyasi-acma/) üst yazıyı ve ekleri çıkarabilirsiniz.
- **.docx çıktıysa:** Word, LibreOffice ya da telefonunuzdaki ofis uygulamasıyla açılır.

## .p7s dosyası neden açılmıyor?

En sık nedenler şunlardır:

- **Dosya yalnızca imza (ayrık imza).** smime.p7s eklerinin tamamı ve bazı belge imzaları bu türdendir. Açılacak bir belge yoktur; belge ayrı gelmiştir.
- **Dosya şifreli.** Şifreli .p7m iletileri yalnızca alıcının özel anahtarıyla, genellikle sertifikanın kurulu olduğu e-posta programında açılır. Genel araçlar şifreli dosyayı açamaz.
- **Dosya eksik ya da bozuk indi.** İndirme yarıda kesildiyse zarf çözülmez; dosyayı yeniden indirin.
- **Bilgisayarda uygun program yok.** Windows, macOS ve telefonlar bu uzantıları belge olarak tanımaz; dosyayı bir imza açıcıya bırakmanız gerekir.

## İmzanın geçerli olup olmadığı nasıl anlaşılır?

İmzanın geçerliliğini (sertifikanın geçerli olması, belgenin imzadan sonra değişmemesi) anlamak için bir **e-imza programı** ya da imzayı doğrulayabilen bir e-posta programı gerekir. Türkiye'de güvenli elektronik imza, 5070 sayılı Elektronik İmza Kanunu'na göre elle atılan imzayla aynı hukuki sonucu doğurur; bu konuda ayrıntılar [.imz dosyası nedir?](/rehber/imz-dosyasi-nedir/) rehberinde.

Evrakçevir'in İMZ aracı imzalayanın adını ve imza zamanını **gösterir**, ama imzanın geçerliliğini **doğrulamaz**. Çıkardığınız belge okumanız için bir kopyadır; resmî bir işlemde kullanacaksanız .p7s ya da .p7m dosyasının aslını saklayın.

## Sık sorulan sorular

### .p7s uzantısı ne demek?
.p7s, CMS (PKCS #7) biçiminde elektronik imza taşıyan dosyanın uzantısıdır. e-postalarda iletinin imzasını, bazı belgelerde ise imzayla birlikte belgenin kendisini taşır.

### smime.p7s virüs mü?
Hayır, smime.p7s eki bir program değil, imza verisidir ve çalıştırılmaz. Yine de tanımadığınız kişilerden gelen eklerde her zaman olduğu gibi dikkatli olun.

### .p7s ile .p7m arasında fark nedir?
.p7s çoğunlukla yalnızca imzayı, .p7m ise imzalı ya da şifreli içeriğin tamamını taşır. İmzalı .p7m dosyasının içinden belge çıkarılabilir; şifreli .p7m yalnızca alıcının anahtarıyla açılır.

### .p7s dosyasını açmak için e-imza kartı gerekir mi?
Hayır, belgeyi okumak için e-imza kartı gerekmez. Kart, belgeyi imzalamak için kullanılır; [İMZ açma aracı](/imz-dosyasi-acma/) kartsız ve programsız çalışır.

### .p7s dosyası telefonda açılır mı?
Evet, belge içeren .p7s ve .p7m dosyaları telefonda açılır. Telefonun tarayıcısında İMZ açma aracını açıp dosyayı "Dosyalar" uygulamasından seçmeniz yeterlidir.

### Dosyam bir sunucuya gönderiliyor mu?
Hayır. Evrakçevir'de .p7s ve .p7m dosyaları tarayıcınızın içinde açılır ve hiçbir sunucuya yüklenmez.
