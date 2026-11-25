---
title: UYAP Doküman Editörü Nedir, Nasıl Kurulur? (Hatalar)
h1: UYAP Doküman Editörü nedir, nasıl kurulur?
description: UYAP Doküman Editörü UDF belgelerini açan ve hazırlayan resmî programdır. Nereden indirilir, Windows'a nasıl kurulur, javaw ve açılmama hatası nasıl çözülür?
date: 2026-11-25
updated: 2026-11-25
tools: udf-pdf, udf-word, word-udf
---
UYAP Doküman Editörü, Adalet Bakanlığı'nın UYAP için hazırladığı ve UDF uzantılı belgeleri açan, oluşturan ve yazdıran ücretsiz programdır. Programı UYAP Vatandaş Portalı'ndaki "Programlar" bölümünden indirip bilgisayarınıza kurarsınız. Belgeyi yalnızca okumak istiyorsanız kurulum şart değildir; UDF dosyasını tarayıcıda PDF'e çevirmeniz yeterlidir.

## UYAP Doküman Editörü ne işe yarar?

UYAP'ta hazırlanan kararlar, tutanaklar, tebligatlar ve dilekçeler UDF biçimindedir. Word ya da PDF okuyucular bu biçimi tanımaz; dosyaya çift tıkladığınızda açılmamasının nedeni budur. Doküman Editörü bu dosyaları açan ve yeniden UDF olarak kaydeden resmî araçtır.

Programa ne zaman ihtiyaç duyarsınız:

| İhtiyacınız | Program gerekir mi? | Daha kısa yol |
|---|---|---|
| Kararı ya da tebligatı okumak, yazdırmak | Hayır | [UDF → PDF aracı](/udf-pdf-cevirme/) |
| Metinden alıntı yapmak, düzenlemek | Hayır | [UDF → Word aracı](/udf-word-cevirme/) |
| Word'de yazdığınız dilekçeyi UDF yapmak | Hayır, ama göndermeden önce kontrol önerilir | [Word → UDF aracı](/word-udf-cevirme/) |
| UYAP'a sık belge hazırlamak, UDF'yi düzenleyip kaydetmek | Evet | Doküman Editörü'nü kurun |

## UYAP Doküman Editörü nereden indirilir?

Resmî indirme yeri UYAP Vatandaş Portalı'dır (vatandas.uyap.gov.tr). Portalın sol menüsündeki "Programlar" sekmesinde "UYAP Editör Programı" yer alır. Aynı sayfada programın çalışması için gereken Java sürümü de bulunur.

Programın Windows'un yanı sıra macOS ile Pardus ve Debian tabanlı Linux sistemleri için de sürümleri yayımlanır. Programı tanımadığınız indirme sitelerinden değil, UYAP'ın kendi sayfasından indirmeniz en güvenli yoldur; böylece güncel sürümü de almış olursunuz.

## Windows'a nasıl kurulur?

UYAP Vatandaş Portalı'ndaki kullanım kılavuzuna göre kurulum şu adımlarla yapılır:

1. Vatandaş Portalı'nda "Programlar" bölümünü açın ve "UYAP Editör Programı"nı indirin.
2. İnen uyap.zip dosyasına sağ tıklayıp "Klasöre çıkart" deyin.
3. Oluşan "uyap" klasörünü açın.
4. İçindeki UKI_V ile başlayan .exe dosyasına çift tıklayın ve ekrandaki adımları tamamlayın.

Kurulum bitince bir UDF dosyasına çift tıklayın. Açılmazsa dosyaya sağ tıklayıp "Birlikte aç" ile UYAP Editör'ü seçin.

Program Java ile çalışır. Bilgisayarınızda uyumlu bir Java yoksa önce onu kurmanız gerekir; aksi hâlde aşağıdaki "javaw" hatasını görürsünüz.

## "Javaw bulunamıyor" hatası nasıl çözülür?

Bu hata, Windows'un Java'yı bulamadığı anlamına gelir. UYAP'ın resmî kılavuzundaki çözüm iki adımdır:

1. **Java kurulu mu bakın.** Kurulu değilse Vatandaş Portalı'ndaki "Programlar" sayfasından uyumlu Java'yı indirip kurun.
2. **Kuruluysa Java'yı yol değişkenine ekleyin.** Java'nın kurulu olduğu klasördeki `bin` klasörünün yolunu kopyalayın (örneğin `C:\Program Files (x86)\Java\jre...\bin`). Ardından "Gelişmiş Sistem Ayarları → Gelişmiş → Ortam Değişkenleri" yolunu izleyip "Path" değişkenini düzenleyin, kopyaladığınız yolu başa yapıştırın ve sonuna noktalı virgül koyun.

Adalet Bakanlığı'nın kılavuzunda programın 32 bit Java için hazırlandığı, 64 bit sistemlerde bu ayarın gerekebileceği belirtilir.

## Editör açılmıyor ya da siyah ekranda kalıyorsa ne yapmalı?

Resmî kılavuz şu sırayı önerir:

1. Programın güncel sürümünü indirip kurun.
2. Windows'ta `C:\Users\<kullanıcı adınız>\.uki` klasörünü açın ve içindeki `acilisdegerleri.xml` ile `tercihler.xml` dosyalarını silin. Bu dosyalar programın kayıtlı ayarlarıdır; silindiğinde program varsayılan ayarlarla açılır.
3. Sorun sürerse Denetim Masası'ndan "Uyap Kelime İşlemci"yi kaldırın, bilgisayarı yeniden başlatın ve güncel sürümü baştan kurun. Kaldırmadan önce kayıtlı belgelerinizi yedekleyin.

Mac'te ayar dosyaları ev klasörünüzdeki gizli `.uki` klasöründedir. Finder'da Cmd + Shift + . tuşlarıyla gizli klasörleri görünür yapabilirsiniz.

İşiniz acilse ve yalnızca belgeyi okumanız gerekiyorsa, sorunu çözmeye uğraşmadan UDF dosyasını [PDF'e çevirip](/udf-pdf-cevirme/) açabilirsiniz.

## Telefonda UDF dosyası nasıl açılır?

Telefonda en kısa yol, dosyayı tarayıcıda PDF'e çevirmektir. [UDF → PDF aracını](/udf-pdf-cevirme/) telefonunuzun tarayıcısında açın, UDF dosyasını "Dosyalar" uygulamasından seçin ve oluşan PDF'i açın. Dönüşüm telefonunuzda yapılır, dosya internete yüklenmez. Diğer yollar için [UDF dosyası nasıl açılır](/rehber/udf-dosyasi-nasil-acilir/) rehberine bakabilirsiniz.

## Doküman Editörü olmadan UDF hazırlanabilir mi?

Evet. Dilekçenizi Word'de yazıp [Word → UDF aracı](/word-udf-cevirme/) ile UDF dosyasına çevirebilirsiniz. Elinizde yalnızca metin içeren bir PDF varsa [PDF → UDF aracı](/pdf-udf-cevirme/) da kullanılabilir. UYAP'a göndermeden önce oluşan dosyayı bir kez Doküman Editörü'nde açıp kontrol etmeniz önerilir.

e-İmzalı bir belge aldıysanız ve dosya .imz uzantılıysa, bu ayrı bir biçimdir: [.imz dosyası nedir](/rehber/imz-dosyasi-nedir/) rehberinde nasıl açılacağını anlattık.

## Sık sorulan sorular

### UYAP Doküman Editörü ücretli mi?
Hayır, ücretsizdir. Program UYAP Vatandaş Portalı'ndaki "Programlar" bölümünden ücretsiz indirilir.

### UDF dosyasını okumak için programı kurmam şart mı?
Hayır, şart değildir. Belgeyi yalnızca okumak ya da yazdırmak istiyorsanız UDF dosyasını tarayıcıda PDF'e çevirmeniz yeterlidir. Program, UDF dosyasını düzenleyip yeniden kaydetmeniz gerektiğinde lazımdır.

### UYAP Doküman Editörü Mac'te çalışır mı?
Evet, macOS için ayrı bir sürümü yayımlanır. Pardus ve Debian tabanlı Linux sistemleri için de sürüm bulunur.

### "Javaw" hatası neden çıkar?
Windows Java'yı bulamadığı için çıkar. Uyumlu Java'yı kurmak ya da kurulu Java'nın `bin` klasörünü Path ortam değişkenine eklemek sorunu çözer.

### Editör açılmıyor, siyah ekranda kalıyor; ne yapmalıyım?
Önce güncel sürümü kurun, ardından kullanıcı klasörünüzdeki `.uki` klasöründe bulunan `acilisdegerleri.xml` ve `tercihler.xml` dosyalarını silin. Sorun sürerse programı kaldırıp bilgisayarı yeniden başlatın ve baştan kurun.

### PDF'e çevrilen UDF resmî belge yerine geçer mi?
Hayır. PDF, belgeyi okumanız ve paylaşmanız için bir kopyadır. Resmî işlemlerde belgenin UYAP'taki aslı geçerlidir.
