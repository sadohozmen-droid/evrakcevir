---
title: EYP Dosyası Nedir? KEP ile Gelen Paket Nasıl Açılır
h1: EYP dosyası nedir, nasıl açılır?
description: EYP, kamu kurumlarının resmî yazıyı ve eklerini tek dosyada gönderdiği e-Yazışma Paketidir. KEP ile gelen .eyp dosyasını programsız açmanın yolu burada.
date: 2026-11-16
updated: 2026-11-16
tools: eyp, imz, udf-pdf
---
EYP dosyası, bir kamu kurumunun resmî yazıyı, eklerini ve belgenin bilgilerini tek pakette gönderdiği **e-Yazışma Paketi**dir. Bilgisayarınız bu uzantıyı tanımadığı için çift tıklayınca açılmaz. Paketi programsız açmanın en kolay yolu, dosyayı [EYP açma aracına](/eyp-dosyasi-acma/) bırakıp üst yazıyı ve ekleri ayrı ayrı indirmektir.

## EYP dosyası nedir?

EYP, kamu kurumları arasında ve kurumlardan şirketlere ya da vatandaşlara gönderilen elektronik resmî yazıların standart paket biçimidir. Paketin yapısı, Cumhurbaşkanlığı Dijital Dönüşüm Ofisi Başkanlığının yayımladığı **e-Yazışma Teknik Rehberi**nde tanımlanır. Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik (10.06.2020 tarihli, 31151 sayılı Resmî Gazete) bu rehbere atıf yapar; rehber belgelerin yapısını, biçimini, imzalama ve şifreleme gibi teknik konularını düzenler.

Kurumların elektronik belge yönetim sistemleri (EBYS) yazıyı imzaladıktan sonra paketi kendiliğinden oluşturur. Size genellikle KEP (Kayıtlı Elektronik Posta) adresinize ek olarak ulaşır.

## EYP paketinin içinde ne var?

Bir .eyp dosyası aslında birkaç dosyayı bir arada tutan sıkıştırılmış bir kaptır. Açtığınızda genellikle şu bölümleri görürsünüz:

| Bölüm | İçinde ne var? | Sizin için anlamı |
|---|---|---|
| Üst yazı | Kurumun size yazdığı asıl resmî yazı (çoğunlukla PDF) | Okumanız gereken ana belge |
| Ekler | Yazıya eklenen belgeler (PDF, Word, Excel, görüntü, bazen .imz ya da .udf) | Yazıda "Ek-1, Ek-2" diye geçen dosyalar |
| Üst veri | Konu, sayı, tarih, gönderen kurum gibi bilgiler (XML) | Yazıyı kayda alırken işinize yarar |
| İmza dosyaları | Belgeyi imzalayanların elektronik imza bilgisi | Belgenin kim tarafından imzalandığını gösterir |

## EYP dosyası nasıl açılır? (programsız, adım adım)

1. KEP hesabınıza girip gelen iletideki .eyp ekini bilgisayarınıza ya da telefonunuza indirin.
2. [EYP dosyası açma aracını](/eyp-dosyasi-acma/) açın ve dosyayı kutuya bırakın.
3. "Paketi aç" düğmesine basın. Konu, sayı, tarih ve gönderen bilgisi ekranda görünür.
4. Üst yazıyı ve ekleri tek tek ya da hepsini birden ZIP olarak indirin.

Paket tarayıcınızın içinde açılır, dosya hiçbir sunucuya yüklenmez. Telefonda da aynı adımlar geçerlidir: dosyayı "Dosyalar" uygulamasından seçmeniz yeterlidir.

## Paketten .imz ya da .udf dosyası çıktıysa ne yapmalı?

Eklerden bazıları kendi içinde e-imzalı (.imz) ya da UYAP biçiminde (.udf) olabilir. Bu dosyalar da normal programlarla açılmaz:

- **.imz ekleri:** [İMZ dosyası açma aracı](/imz-dosyasi-acma/) imza zarfını açar ve içindeki PDF ya da Word belgesini verir.
- **.udf ekleri:** [UDF → PDF aracı](/udf-pdf-cevirme/) dosyayı okunabilir PDF'e çevirir. UDF'nin ne olduğunu [UDF dosyası nasıl açılır?](/rehber/udf-dosyasi-nasil-acilir/) rehberinde anlattık.

## EYP dosyası neden açılmıyor?

En sık üç neden vardır:

- **Bilgisayarda uygun program yok.** Windows, macOS ve telefonlar .eyp uzantısını tanımaz. Dosyayı bir EYP açıcıya bırakmanız gerekir.
- **Paket şifreli.** Yönetmeliğe göre idare dışına gönderilen e-imzalı belgeler gerekli hâllerde şifrelenebilir. Şifreli bir paket yalnızca alıcı kurumun şifre çözme anahtarıyla açılabilir; Evrakçevir dahil genel araçlar şifreli paketi açamaz.
- **Dosya eksik ya da bozuk indi.** İndirme yarıda kesildiyse paket açılmaz. Dosyayı KEP hesabınızdan yeniden indirmeyi deneyin.

Şifreli bir paket aldıysanız ve açamıyorsanız, gönderen kurumla iletişime geçip belgenin size hangi yolla iletilebileceğini sormanız en doğru yoldur.

## EYP'den çıkan PDF resmî belge yerine geçer mi?

Hayır, tek başına geçmez. Paketten çıkardığınız PDF, yazıyı okumanız ve dosyalamanız için bir kopyadır. Belgenin elektronik imzası paketin içindeki imza dosyalarıyla birlikte anlam taşır. Bir yere resmî olarak sunmanız gerekiyorsa paketin aslını (.eyp) saklayın ve karşı tarafa hangi biçimi kabul ettiğini sorun.

## Sık sorulan sorular

### EYP uzantısı ne demek?
EYP, "e-Yazışma Paketi" demektir. Kamu kurumlarının elektronik resmî yazıyı, eklerini, üst verisini ve imza bilgisini tek dosyada topladığı paket biçimidir.

### EYP dosyasını açmak için program kurmam gerekir mi?
Hayır, yalnızca okumak için program kurmanız gerekmez. [EYP açma aracı](/eyp-dosyasi-acma/) paketi tarayıcıda açar ve üst yazıyla ekleri ayrı dosyalar olarak verir.

### EYP dosyası telefonda açılır mı?
Evet, açılır. Telefonun tarayıcısında EYP açma aracını açıp dosyayı "Dosyalar" uygulamasından seçmeniz yeterlidir; çıkan PDF'leri telefonun PDF görüntüleyicisinde okuyabilirsiniz.

### Şifreli EYP dosyası nasıl açılır?
Şifreli paket yalnızca alıcı kurumun şifre çözme anahtarıyla açılabilir. Genel araçlar bu paketleri açamaz; böyle bir durumda gönderen kurumla iletişime geçin.

### EYP açma aracı imzanın geçerliliğini kontrol ediyor mu?
Hayır. Araç paketin içeriğini açar ama elektronik imzanın hukuki geçerliliğini doğrulamaz. İmza doğrulaması için e-imza programlarını kullanmanız gerekir.

### Dosyam bir sunucuya gönderiliyor mu?
Hayır. Evrakçevir'de paket tarayıcınızın içinde açılır ve hiçbir sunucuya yüklenmez.
