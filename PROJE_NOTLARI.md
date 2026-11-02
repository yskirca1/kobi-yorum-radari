# ReviewRadar — Proje Notları

> Bu dosya, projeyi yeni bir Claude oturumunda (ya da yeni bir hesapta) kaldığı yerden devam ettirmek için yazıldı.
> Yeni oturumda ilk mesaj: **"yskirca1/kobi-yorum-radari deposundaki PROJE_NOTLARI.md dosyasını oku, projeye devam edelim."**
> Son güncelleme: 2 Kasım 2026 (sweatshirt eklendi)

## 1. Proje nedir?

- **Bağlam:** Hamilik Okulu Vakfı, 3. sınıf pazarlama projesi. Jüriye sunulacak; çalışan bir ürün + sunum bekleniyor.
- **Fikir:** KOBİ'ler için müşteri yorumu analizi. Kullanıcı satmak istediği ürünün kategorisini arar (örn. "termos"); site o kategorideki rakip ürünlerin yorumlarından çıkan **en sık şikâyetleri**, **müşterinin neyi sevdiğini** ve **pazara girerken nelere dikkat etmesi gerektiğini** gösterir. Ürünler filtrelenip karşılaştırılabilir.
- **İsim:** ReviewRadar (önce "KOBİ Yorum Radarı" çalışma adıydı). Olası slogan: "Neden? Nasıl?" (müşteri neden almıyor, sen nasıl aldırırsın).
- **Canlı site:** https://yskirca1.github.io/kobi-yorum-radari/
- **Depo:** https://github.com/yskirca1/kobi-yorum-radari (GitHub Pages, main dalı, kök dizin)

## 2. Geçen yılın birincisi: TradeTrend

- Sunumu incelendi (TradeTrend_sunum.pdf). "Ne, Ne Zaman, Nerede?" — 4 kaynaktan ürün trend skoru, 7 bölge, 6 haftalık tahmin, ithalat fırsatları. Canlı MVP: tradetrend.vercel.app
- Sunum yapısı tam bir girişim sunumu: problem istatistiği → çözüm/MVP → TAM/SAM/SOM → 4 persona → rakip matrisi → pazarlama stratejisi (CAC/LTV) → SaaS iş modeli (Freemium/Pro/Enterprise) → yol haritası → ekip → 5 yıllık finansal → yatırım talebi.
- **Konumlanmamız:** TradeTrend "ne satılır" diyor; biz "o ürünü satarken rakipten nasıl daha iyi olunur" diyoruz. Rakip slaytında saygılı tek satırla anılacak, eleştirilmeyecek. Entegrasyon fikri yarışmadan sonra, yazılı ortaklık anlaşmasıyla değerlendirilecek.
- **Bizim üstünlüğümüz:** her rakam gerçek yorum verisinden geliyor ve sitede doğrulanabiliyor. Finansal projeksiyonlarda abartıdan kaçın, varsayımları açık yaz.

## 3. Şu ana kadar yapılanlar

### Veri (termos bardak kategorisi)
- Trendyol'da "termos bardak" araması, "En çok değerlendirilen" sıralama. 350–500 ml kahve/çay tipi 8 ürün:
  - Büyük marka: Stanley Aerolight 0,47 L (780345921), Karaca Rainbow 500 ml (764617800), Karaca Skyfall 350 ml (772111095), Espressolab No:36 500 ml (257539628)
  - KOBİ: Vivien Home dijital göstergeli 500 ml (748758153), Sedef Silver 500 ml (127482743), WarmShield 400 ml (81878270), MissCafe Snape 380 ml (112084901)
- Her ürün için iki örnek: **"Önerilen" sıralamanın ilk 100 yorumu** + **Puan filtresinde 1 ve 2 yıldız seçilerek ilk 100 yorum**. Toplam 1.544 yorum okundu (Skyfall'da 55, Espressolab'da 89 olumsuz yorum vardı).
- Toplama betiği: `tools/toplama.js`. Konu sözlüğü: `tools/temalar.json`.
- Termos toplaması Claude masaüstü uygulamasının içindeki tarayıcıyla yapıldı. Ham yorumlar kullanıcının bilgisayarında `Belgeler\Claude\Hamilik Projesi\termos_yorumlari_trendyol.csv` dosyasında; özetler `data/termos.json` içinde.

### Yeni toplama yöntemi (yer imi, kredi harcamaz)
- `tools/yer_imi.html` açılır, "ReviewRadar Topla" düğmesi yer imleri çubuğuna sürüklenir. Kullanıcı Brave kullanıyor.
- Ürünün sayfasında yer imine tıklanır (yorumlar sayfasına geçer, tekrar tıklanır). 3-5 dk sonra `rv_<urunId>.json` iner: `{meta (görsel, toplama_tarihi dahil), dist, top, neg}`. Kutu kırmızıysa sorun kutuda yazar.
- **Ürünler tek tek toplanmalı ve tarayıcı penceresi görünür kalmalı**: arka plandaki sekmede/pencerede Trendyol yeni yorum yüklemiyor (paralel denemede hepsi 20-40 yorumda kaldı).
- Trendyol notları: Puan filtresindeki kutucuklar `<button role="checkbox" aria-checked>`, yalnızca menü açıkken DOM'da; düğmeler `data-testid="filter-toggle-rate" / filter-apply-button-rate`. Filtreden sonra sayfa yüksekliği eski listede kalıyor, bu yüzden liste sonundaki 1px işarete kaydırılıyor.
- Ham dosyalar kullanıcının bilgisayarında `Belgeler\Claude\Hamilik Projesi\veri\<kategori>\` klasöründe. Analiz: `tools/sweatshirt/analiz.py` (konu sözlüğü) ve `olustur.py` (`data/<kategori>.json` üretir); yeni kategori için kopyalanıp sözlük uyarlanır.

### Temel bulgular (termos)
- 8 ürünün 9.100 yazılı yorumunun **%16,3'ü 1-2 yıldız**; ama "Önerilen" sıralamanın ilk 100 yorumunda 8 üründe **0** adet 1-2 yıldızlı yorum var.
- En sık şikâyetler (1-2 yıldızlı yorumlarda geçme oranı): **Isıyı tutmuyor %40**, Sızdırma %24, Kapak/mekanizma %21, Zamanla bozulma %12.
- KOBİ ürünlerinde sızdırma (%31) ve kapak (%24) şikâyeti büyük markaların yaklaşık iki katı; büyük markalarda sahtelik/garanti (Stanley %26) öne çıkıyor.
- Sedef Silver olumlu yorumlarının %35'i hediye paketi/notundan söz ediyor; Espressolab'da söz verilen hediye kahve eksik gelince 1 yıldız geliyor.
- Vivien Home'da bebek/mama kullanımı ve dijital gösterge arızası öne çıkıyor.
- Oranlar anahtar kelime eşleşmesiyle hesaplandı, yaklaşıktır. "Dikkat" ve "ders" notları Claude'un olumsuz yorumları okuyarak yazdığı yorumlardır (ölçüm değil).

### Temel bulgular (sweatshirt, 2 Kasım 2026, 12 ürün)
- 12 ürün: büyük marka Tudors (siyah, bordo, haki) ve Madmext; KOBİ Modagen (kapüşonlu, 3'lü set), Altamira, Grimelange (vanilya, siyah), Trendgar 3'lü, Co Trendiz (hoodie, taşlı). Kullanıcının kararıyla aynı modelin renkleri ayrı ürün sayıldı (renklerin yorumları birbirinden ayrı, ortak yorum yok denecek kadar az).
- 34.073 yazılı yorum, 2.354 yorum okundu. Yazılı yorumların %11,6'sı 1-2 yıldız; "Önerilen" ilk 100'de 12 üründe **0** (termosla aynı bulgu).
- 1-2 yıldız payı: büyük markalarda %3,1-5,3 (havuz %3,8), KOBİ'de %4,4-38,3 (havuz %17,3). En yüksek Modagen 3'lü (%38).
- En sık tekil şikâyet tüylenme %18,5; ince/kalitesiz kumaş %14,5 (KOBİ %18, büyük %6); dar kalıp %12; bol kalıp %11; yanlış beden/ürün %9 (büyük markada %13).
- Beden ve kalıp sorunları birlikte olumsuz yorumların %32'si. Olumlu yorumların %19'u boy-kilo-beden yazıyor; %23'ü hediye (Tudors'ta yaklaşık yarısı).
- Renk varyantı bulgusu: aynı modelde Grimelange tüylenme vanilya %26, siyah %51; Tudors siyahı dar, hakisi bol, bordosu boya akıtıyor; 3'lü setlerde parçalar farklı kalıpta.
- Madmext: olumsuz yorumların %40'ı ilandaki başka satıcılardan (önerilen ilk 100'de %1).

### Temel bulgular (Bluetooth kulaklık, 2 Kasım 2026, 12 ürün)
- Büyük marka: Xiaomi Redmi Buds 4 Lite, Buds 6 Play (beyaz, siyah), Huawei FreeBuds SE 2. KOBİ: Favors Dots E6s, Favors Pro, Abbruch Pro 5 (Favors mağazası), Barbanti Air 2 ve Pro (Deseja, NesCase satıyor), Teknoloji Gelsin, Trktech Pro 5 Plus, Tarçın Air Pro 2.
- 125.453 yazılı yorum, 2.400 okundu. Yazılı yorumların **%25'i 1-2 yıldız** (en riskli kategori; büyük marka %14,7, KOBİ %27). "Önerilen" ilk 100'lerde 1.200 yorumdan yalnızca 9'u 1-2 yıldız (%0,75); 7'si Trktech'te.
- En sık şikâyet kısa sürede bozulma %25. Arıza grubu (bozulma, tek taraf, şarj almama) KOBİ %36, büyük %22; şarj sorunları KOBİ %18, büyük %5.
- Büyük markanın açığı: ses az/boğuk/dışarı veriyor %31 (KOBİ %10), kulağa oturmuyor %11 (KOBİ %2), kutudan kablo çıkmadı %8.
- KOBİ önerilen yorumlarının %19'u satıcının hediyesine (kılıf, kahve) teşekkür ediyor (Barbanti Air 2 %54, büyük markada ~0). Tarçın'ın olumsuzlarının %10'u hediye karşılığı yorum yazdırıldığını söylüyor.
- KOBİ ürünlerinde 1-2 yıldızlı yorumların önemli kısmının metni olumlu (Abbruch'ta yaklaşık üçte biri); puan tek başına yanıltıcı.

### Temel bulgular (şal, 2 Kasım 2026, 12 ürün)
- Büyük marka: Armine (Medine İpeği, Trend 2206), Aker Elegance, Modakaşmir (Aya, Neo Pamuk). KOBİ: Mira İpek (3 model), Bambu Kraş 3'lü (Genel Markalar), Organic Scarfs 3'lü, Afvente, Naciye Sultan 4'lü. 8'ini kullanıcı topladı, 4'ünü (Armine x2, Aker, Modakaşmir Aya) Claude uygulama tarayıcısında topladı.
- En az riskli kategori: yazılı yorumların %8,9'u 1-2 yıldız; büyük marka %9,5, KOBİ %8,8 (fark yok). Önerilen ilk 100'lerde 1.200 yorumdan 3'ü 1-2 yıldız.
- Yanlış renk/ürün %16 ve renk farkı %14 (birlikte yerel 8 üründe %29); en kötü 3'lü/4'lü setler (Organic Scarfs 1-2 payı %27).
- Büyük marka şallarını çoğunlukla bayiler satıyor; büyük markada defo %28 (KOBİ %10), yıkamada solma/tüylenme %10 (Modakaşmir Neo %18).

### Temel bulgular (telefon kılıfı, 2 Kasım 2026, 12 ürün; hepsi Claude tarayıcısında toplandı)
- KOBİ: Fibaks (2), Go Aksesuar (4), Powerfox, KVK Privacy (2). Büyük marka: Spigen Liquid Air, Apple MagSafe Silikon ve Şeffaf (çok az yorum).
- 26.183 yazılı yorumun yalnızca 59'u büyük markada (%0,2): pazar KOBİ'lerin. 1-2 yıldız payı %9,4.
- Sararma/kararma %22 (1 numara), telefona oturmama %15 ("13/14/15 uyumlu" Fibaks Mat ve KVK Lansman'da %37), çizik/kusurlu %11 (şeffaflarda %23-26), baskı/taş soyulması %6 (süslemelilerde %18-20).
- KOBİ önerilen yorumlarının %25'i satıcının hediyesine (kablo/şarj koruyucu) teşekkür ediyor (Fibaks %53).
- Apple silikon kılıfın 5 olumsuz yorumu elle sınıflandırıldı; 2'si "logo yok, çakma gibi".
- Sitede `onerilen_n` alanı eklendi: önerilen yorum sayısı 100'den azsa "okunan" ve "ilk 100" sayıları buna göre hesaplanıyor.

### Temel bulgular (doğal sabun, 2 Kasım 2026, 11 ürün; hepsi Claude tarayıcısında toplandı)
- KOBİ: Rise and Shine (Aloe Vera, Pirinç Özlü), Genel Markalar Kojik Asitli, Agarta Pirinç, Efsun Eşek Sütü & Aloe, ASKA Çam Ardıç Katranı, Tala (Pirinç, Keçi Sütü). Büyük marka: Hacı Şakir (Saf Beyaz, Saf Doğal), Dalan Antik Defneli. Eyüp Sabri Tuncer keçi sütü sabunu yalnızca 12 yorumla çıkarıldı.
- 12.551 yazılı yorumda büyük markaların payı %4,5: katı doğal sabun pazarı da KOBİ'lerin. 1-2 yıldız payı %11,8.
- Etkisiz bulma %12 (1 numara; "beyazlatıcı" pirinç sabunlarında %22-24), kurutma/yanma/sivilce %9 (Tala Pirinç %22), koku %9 (Efsun %19), çabuk erime/küçük %7 (en ucuz Genel Markalar setinde %19, 1-2 yıldız %23,8).
- Kabak lifli sabunlarda lif şikâyeti %12 (sert, az, dökülüyor). Rise and Shine'da "eskisi gibi değil" %13-14 ve orijinallik şüphesi %7-8; önerilen yorumlarının %40'ı "yıllardır kullanıyorum".
- Büyük markaların az sayıdaki şikâyeti ürüne değil satıcıya: Dalan'da yanlış ürün %33, paket %27.
- Sözlük tarayıcıda `rv_sozluk_sabun` olarak duruyor; araçlar `tools/dogal-sabun/`.

### Claude'un uygulama tarayıcısıyla toplama (kullanıcı istemezse dosya indirme YOK)
- Kod `tools/toplama.js` sitedeki kopyasından (`https://yskirca1.github.io/kobi-yorum-radari/tools/toplama.js`) tarayıcının localStorage'ına `rvcode` olarak yüklenir, indirme satırı çıkarılır; her ürün `localStorage['rv_<id>']` içinde kalır. İndirme yapılınca uygulama kullanıcıdan izin istiyor; kullanıcı bunu istemedi.
- Trendyol yeni yorumları ancak sayfada **gerçek bir kullanıcı kaydırması** olduktan sonra yüklüyor: her üründe sayfa açılınca küçük bir ekran görüntüsü (scale 0.1) + bir fare tekerleği kaydırması, sonra betik. Claude penceresi ekranda görünür olmalı.
- Oranlar, Python sözlüğü JSON olarak tarayıcıya gönderilip orada hesaplanıyor (JS'de \w yerine [\p{L}\d_] ve 'u' bayrağı); bağlama yalnızca özet ve okunacak örnek yorumlar geliyor. Örnek: `tools/sal/sal_tarayici.json`.
- Arama sonuçları sayfa açmadan `fetch('/sr?q=...&sst=MOST_RATED')` ile alınıp ayrıştırılabiliyor.

### Site
- Dosyalar: `index.html`, `style.css`, `app.js`, `favicon.svg`, `data/kategoriler.json` (kategori listesi + eş anlamlılar), `data/termos.json` (kategori verisi), `logo/` (logo dosyaları).
- Sayfalar (hash yönlendirme): `#/` ana sayfa, `#/kategori/<id>`, `#/urun/<kategori>/<urunId>`, `#/karsilastir`, `#/ara/<terim>`.
- Özellikler: arama (eş anlamlılar), kategori özeti (en sık 4 şikâyet + 3 temel bilgi), sol filtre paneli (satıcı tipi, marka, en sık şikâyet, puan, 1-2 yıldız oranı), ürün kartları (Trendyol görselleri doğrudan bağlantıyla), ürün sayfası, 2-4 ürün karşılaştırma, açık/koyu tema.
- Kategori başlığında toplama tarihi gösterilmiyor (kullanıcı isteği); tarih veri dosyasında `toplama` alanında duruyor.
- Ana sayfada alan (üst kategori) filtresi var; arama sonuçları ana sayfayla aynı kartları kullanıyor (hazır olmayan kategoride görsel yerine yer tutucu). Marka filtresi yalnızca marka sayısı ürünlerin 3/4'ünü geçmiyorsa görünür.
- **CSS ya da JS değişince `index.html` içindeki `?v=` numarası artırılmalı**, yoksa tarayıcılar eski dosyayı önbellekten okuyor. Veri dosyaları önbelleğe takılmadan çekiliyor.
- Kategori görseli kartta kırpılmadan gösterilir; yine de ürünün ortada ve net olduğu bir fotoğraf seç.
- Yeni kategori eklemek: `data/<id>.json` dosyasını `termos.json` ile aynı yapıda üret, `data/kategoriler.json` içinde durumunu `"hazir"` yap, `urun`/`yorum`/`gorsel` alanlarını doldur.
- `data/<id>.json` yapısı: `{id, ad, ust, esanlam[], toplama, kaynak, temalar[{id, ad, unlem}], olumlu_konular[{id, ad}], oneriler[{baslik, metin}], urunler[{id, kisa, marka, ad, segment ("Büyük marka"|"KOBİ"), gorsel, link, yazili, yildiz[1..5 sayıları], ort, onerilen_ort, onerilen_dusuk, ornek_dusuk, sikayet{temaId: oran}, olumlu{konuId: oran}, dikkat[], ders[], alinti[{konu, yildiz, metin}]}]}`

### Tasarım kararları
- Sade, kurumsal pazar yeri görünümü; "yapay zekâ havası" veren şeylerden (trend yazı tipleri, renkli kutular, her yerde etiket/gölge) kaçınılıyor.
- Yazı tipi: IBM Plex Sans. Renkler: beyaz zemin, turkuaz marka rengi (logo balonu #14b8a6, buton/link #0d8a7f; koyu temada #2dd4bf), kırmızı yalnızca şikâyet oranlarında.
- Logo: turkuaz konuşma balonu içinde radar (halkalar + tarama dilimi + sinyal noktası) + tek satır "Review**Radar**" ("Radar" turkuaz). Dosyalar `logo/` klasöründe (açık, koyu, şeffaf, ikon; SVG + PNG).

## 4. Kararlar ve ilkeler

- **Yasal yaklaşım:** Trendyol'dan otomatik veri çekmek kullanım koşullarına aykırı; proje için tek seferlik, yavaş ve az sayfayla "araştırma örneklemi" olarak toplanıyor. Kişisel veri (yorumcu adı) toplanmıyor. Sunumda sürekli sistem vizyonu yasal kanallarla anlatılacak: satıcının kendi mağazasını bağlaması (Trendyol Partner API), pazar yeri veri ortaklığı, lisanslı veri sağlayıcılar.
- **Trendyol'a fikir götürmek:** şimdi değil. Önce kanıt (çok kategori + gerçek KOBİ kullanıcı geri bildirimi), sonra resmi iş ortaklığı/entegratör kanalları, yöntem değil sonuç paylaşılır, gerekirse NDA. Tek pazar yerine bağımlı iş modeli kurma (Hepsiburada, n11, Amazon, ajanslar, bankaların KOBİ programları da hedef).
- **GitHub:** Claude bu depoya push yapabiliyor (yeni hesapta da yazma erişimi verildi). Depo ayarları (Pages, depo adı) kullanıcı tarafından yapılır. İsim kesinleşirse depo adı `reviewradar` yapılabilir.

## 5. Sıradaki adımlar

0. **Sıradaki kategoriler:** termos ✓, sweatshirt ✓ (12 ürün), Bluetooth kulaklık ✓ (12 ürün), şal ✓ (12 ürün), telefon kılıfı ✓ (12 ürün), doğal sabun ✓ (11 ürün). Sırada yakında listesi: kamp sandalyesi, kedi tırmalama tahtası, filtre kahve, bebek arabası. Hedef: her kategoride 12 ürün. Spor tayt kullanıcı isteğiyle listeden çıkarıldı, siteye eklenmeyecek. Önerilen: Bluetooth kulaklık (elektronik) ve yüz serumu / doğal sabun (kozmetik): ETBİS'e göre en büyük alanlar.
1. **50 kategori listesi:** KOBİ'lerin rekabet ettiği, yorumu bol kategoriler. Taslak "yakında" listesi: bebek arabası, telefon kılıfı, doğal sabun, kedi tırmalama tahtası, filtre kahve, kamp sandalyesi. Liste kullanıcıyla netleştirilecek.
2. **Veri toplama:** 5'erli partiler hâlinde, zamana yayarak. Her kategoride ortak konular (dayanıklılık, beden/ölçü, görselden farklı, kargo/paket, sahtelik, eksik parça, koku, fiyat) + kategoriye özel 2-4 konu.
3. **Otomasyon (sunuma kadar "canlı MVP"):** bilgisayarda çalışan toplama programı (Python + Playwright), Claude API ile otomatik konu sınıflandırma ve not üretimi (kullanıcının Anthropic API anahtarı gerekir), sonuçların GitHub'a otomatik yüklenmesi, tarihli kayıtlarla zaman içinde değişim takibi.
4. **Sunum (pazarlama dersi olduğu için en kritik eksik):** isim/slogan ✓, problem istatistiği, 3-4 persona (yeni girecek esnaf, mevcut Trendyol satıcısı, üretici), hedef pazar (TAM/SAM/SOM), rakip tablosu (Trendyol'un kendi yapay zekâ özeti, NeSatılır, TradeTrend, yabancı yorum analiz araçları), kendi ürünümüzün pazarlama stratejisi (kanallar, CAC/LTV), iş modeli (abonelik ya da kategori raporu), yol haritası, ekip, mütevazı ve varsayımları açık finansal tablo.
