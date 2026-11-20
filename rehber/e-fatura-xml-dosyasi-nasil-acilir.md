---
title: e-Fatura XML Dosyası Nasıl Açılır? Programsız PDF ve Excel
h1: e-Fatura XML dosyası nasıl açılır?
description: e-Fatura ve e-Arşiv XML dosyasını programsız açmanın yolları: faturayı kendi tasarımıyla PDF'e çevirme, Excel'e aktarma, ZIP içindeki faturalar ve sık hatalar.
date: 2026-11-20
updated: 2026-11-20
tools: efatura, efatura-excel
---
e-Fatura XML dosyasını açmanın en kolay yolu, dosyayı faturanın kendi tasarımıyla PDF'e çevirmektir. [e-Fatura XML → PDF aracına](/e-fatura-xml-pdf-cevirme/) dosyayı bırakırsınız, fatura bilgisayarınızda ya da telefonunuzda okunur bir PDF olarak iner. Program kurmanız, üye olmanız gerekmez.

## e-Fatura XML dosyası nedir?

e-Fatura, kâğıt yerine elektronik ortamda düzenlenen faturadır ve dosya biçimi XML'dir. Gelir İdaresi Başkanlığı'nın (GİB) e-Fatura entegrasyon kılavuzuna göre XML dosyaları "UBL-TR Paketinde yer verilen şemalara uygun" hazırlanır. UBL-TR, uluslararası UBL standardının Türkiye'ye uyarlanmış hâlidir.

XML bir veri dosyasıdır: satıcı, alıcı, vergi numarası, kalemler, KDV ve toplamlar etiketler arasında düz metin olarak yazılır. Faturanın kâğıttaki gibi görünmesini sağlayan ayrı bir tasarım dosyası (XSLT) kullanılır. GİB kılavuzu bu tasarım tanımının XML dosyasının içinde bulunmasını şart koşar. Yani faturanın görünümü dosyanın içinde hazır bekler; onu okuyacak bir araç gerekir.

## XML faturayı çift tıklayınca neden kod görünüyor?

XML dosyasını çift tıkladığınızda Windows onu genellikle tarayıcıda ya da Not Defteri'nde açar. İkisi de içerikteki tasarımı uygulamaz; ekranda `<cbc:ID>`, `<cac:AccountingSupplierParty>` gibi etiketlerle dolu uzun bir metin görürsünüz. Dosya bozuk değildir, yalnızca faturanın "ham verisini" görüyorsunuzdur.

## e-Fatura XML dosyası nasıl açılır? (3 yol)

| Yol | Ne işe yarar | Program gerekir mi? |
|---|---|---|
| PDF'e çevirmek | Faturayı aslındaki görünümüyle okumak, yazdırmak, e-postayla iletmek | Hayır |
| Excel'e aktarmak | Çok sayıda faturayı tek tabloda listelemek, toplamak, kontrol etmek | Hayır |
| Görüntüleyici programı ya da muhasebe yazılımı | Faturayı kayıtlı olduğunuz sistem içinde açmak | Evet |

### 1. Yol: XML'i PDF'e çevirin

1. [e-Fatura XML → PDF aracını](/e-fatura-xml-pdf-cevirme/) açın.
2. XML dosyasını ya da faturaları içeren ZIP dosyasını kutuya bırakın.
3. Görünüm olarak "Faturanın kendi tasarımı"nı seçili bırakın.
4. "PDF'e dönüştür" düğmesine basın, PDF'i indirin.

Araç XML'in içindeki tasarımı bulup uygular, bu yüzden fatura satıcının hazırladığı düzende görünür. Tasarım bulunamazsa satıcı, alıcı, kalemler, KDV ve toplamları gösteren sade bir şablon kullanılır. Dönüşüm tarayıcınızda yapılır; fatura bilgileri hiçbir sunucuya gönderilmez.

### 2. Yol: Faturaları Excel'e aktarın

Ay sonunda onlarca alış faturasını kontrol edecekseniz faturaları tek tek açmak yerine [e-Fatura XML → Excel aracını](/e-fatura-xml-excel-aktarma/) kullanın. İnen Excel dosyasında "Faturalar" sayfasında fatura başına bir satır (fatura no, tarih, satıcı, alıcı, VKN/TCKN, matrah, KDV, toplam, ETTN), "Kalemler" sayfasında tüm mal ve hizmet satırları bulunur. Tutarlar sayı olarak yazıldığı için doğrudan toplanıp filtrelenebilir.

### 3. Yol: Görüntüleyici ya da muhasebe programı

GİB, e-Fatura dosyalarını görüntülemek için "e-Fatura Görüntüleyici" adlı bir program yayımlamış ve kullanım kılavuzunu e-Belge sitesinde (ebelge.gib.gov.tr) paylaşmıştır. Faturayı bir entegratör ya da muhasebe yazılımı üzerinden alıyorsanız fatura o programın içinde zaten okunur biçimde görünür. Elinizde yalnızca XML dosyası varsa ve bir şey kurmak istemiyorsanız 1. yol yeterlidir.

## ZIP içinde gelen faturalar nasıl açılır?

Faturalar e-postayla ya da portaldan toplu indirildiğinde ZIP olarak da gelebilir. ZIP'i açmanıza gerek yok: dosyayı doğrudan [PDF aracına](/e-fatura-xml-pdf-cevirme/) ya da [Excel aracına](/e-fatura-xml-excel-aktarma/) bırakın. Araç içindeki XML faturaları bulur ve hepsini birlikte işler. Birden çok faturayı çevirdiğinizde PDF'leri tek ZIP olarak indirebilirsiniz.

## e-Arşiv faturası ve e-İrsaliye XML'i de açılır mı?

Evet. e-Arşiv fatura, alıcısı e-Fatura sistemine kayıtlı olmayan kişi ve firmalara düzenlenen elektronik faturadır; size XML olarak geldiyse aynı araçla açabilirsiniz. e-İrsaliye XML'i de PDF aracında desteklenir. Size PDF olarak gelen bir e-Arşiv faturası için ise çevirmeye gerek yoktur; PDF'i doğrudan açabilirsiniz.

## Nelere dikkat edilmeli?

- **PDF bir görüntüdür.** GİB kılavuzuna göre XML ile tasarım arasında çelişki olursa XML esas alınır. Resmî kayıt ve saklama için XML dosyasını silmeyin.
- **İmza doğrulanmaz.** e-Fatura mali mühürle imzalanır; Evrakçevir faturayı okunur hâle getirir ama mühürün geçerliliğini kontrol etmez. e-imzalı dosyalarla ilgili ayrıntılar [.imz dosyası nedir](/rehber/imz-dosyasi-nedir/) rehberinde.
- **Faturanın gerçek olup olmadığını** öğrenmek için düzenleyen firmaya ya da GİB'in resmî kanallarına başvurun; dosyayı açmak bunu göstermez.

## Sık sorulan sorular

### e-Fatura XML dosyası hangi programla açılır?
Program kurmadan, tarayıcıda [e-Fatura XML → PDF aracı](/e-fatura-xml-pdf-cevirme/) ile açılır. GİB'in e-Fatura Görüntüleyici programı ya da faturayı aldığınız muhasebe yazılımı da kullanılabilir.

### e-Fatura XML dosyası telefonda nasıl açılır?
Telefonun tarayıcısında PDF aracını açıp XML'i "Dosyalar" uygulamasından seçmeniz yeterlidir. Oluşan PDF'i telefonunuzun PDF görüntüleyicisinde açabilir ya da paylaşabilirsiniz.

### XML faturayı PDF'e çevirmek güvenli mi?
Evrakçevir'de dönüşüm tarayıcınızda yapılır ve fatura verileri hiçbir sunucuya gönderilmez. Bu yüzden müşteri ve tutar bilgileri bilgisayarınızdan çıkmaz.

### PDF'e çevrilen e-Fatura resmî belge yerine geçer mi?
Hayır, faturanın asıl kaydı XML dosyasıdır. PDF okumak, yazdırmak ve paylaşmak içindir; saklama yükümlülüğü için XML dosyasını koruyun.

### Fatura PDF'te farklı görünüyor, neden?
XML içinde tasarım (XSLT) yoksa ya da okunamazsa araç sade bir şablon kullanır. Bilgiler aynıdır, yalnızca görünüm satıcının tasarımından farklıdır.

### Faturadaki kalemleri Excel'e nasıl alırım?
[e-Fatura XML → Excel aracına](/e-fatura-xml-excel-aktarma/) XML ya da ZIP dosyalarını bırakın. Kalemler ayrı bir sayfada, her satırda bir mal veya hizmet olacak şekilde listelenir.
