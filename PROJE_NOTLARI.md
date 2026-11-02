# ReviewRadar — Proje Notları

> Bu dosya, projeyi yeni bir Claude oturumunda (ya da yeni bir hesapta) kaldığı yerden devam ettirmek için yazıldı.
> Yeni oturumda ilk mesaj: **"yskirca1/kobi-yorum-radari deposundaki PROJE_NOTLARI.md dosyasını oku, projeye devam edelim."**
> Son güncelleme: 2 Kasım 2026

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
- Toplama, Claude masaüstü uygulamasının içindeki tarayıcıyla yapıldı (kullanıcının bilgisayarı açık olmalı). Ham veri tarayıcının localStorage'ında `rv_<urunId>` anahtarlarıyla duruyordu; özetler `data/termos.json` içinde.

### Temel bulgular (termos)
- 8 ürünün 9.100 yazılı yorumunun **%16,3'ü 1-2 yıldız**; ama "Önerilen" sıralamanın ilk 100 yorumunda 8 üründe **0** adet 1-2 yıldızlı yorum var.
- En sık şikâyetler (1-2 yıldızlı yorumlarda geçme oranı): **Isıyı tutmuyor %40**, Sızdırma %24, Kapak/mekanizma %21, Zamanla bozulma %12.
- KOBİ ürünlerinde sızdırma (%31) ve kapak (%24) şikâyeti büyük markaların yaklaşık iki katı; büyük markalarda sahtelik/garanti (Stanley %26) öne çıkıyor.
- Sedef Silver olumlu yorumlarının %35'i hediye paketi/notundan söz ediyor; Espressolab'da söz verilen hediye kahve eksik gelince 1 yıldız geliyor.
- Vivien Home'da bebek/mama kullanımı ve dijital gösterge arızası öne çıkıyor.
- Oranlar anahtar kelime eşleşmesiyle hesaplandı, yaklaşıktır. "Dikkat" ve "ders" notları Claude'un olumsuz yorumları okuyarak yazdığı yorumlardır (ölçüm değil).

### Site
- Dosyalar: `index.html`, `style.css`, `app.js`, `favicon.svg`, `data/kategoriler.json` (kategori listesi + eş anlamlılar), `data/termos.json` (kategori verisi), `logo/` (logo dosyaları).
- Sayfalar (hash yönlendirme): `#/` ana sayfa, `#/kategori/<id>`, `#/urun/<kategori>/<urunId>`, `#/karsilastir`, `#/ara/<terim>`.
- Özellikler: arama (eş anlamlılar), kategori özeti (en sık 4 şikâyet + 3 temel bilgi), sol filtre paneli (satıcı tipi, marka, en sık şikâyet, puan, 1-2 yıldız oranı), ürün kartları (Trendyol görselleri doğrudan bağlantıyla), ürün sayfası, 2-4 ürün karşılaştırma, açık/koyu tema.
- Yeni kategori eklemek: `data/<id>.json` dosyasını `termos.json` ile aynı yapıda üret, `data/kategoriler.json` içinde durumunu `"hazir"` yap, `urun`/`yorum`/`gorsel` alanlarını doldur.
- `data/<id>.json` yapısı: `{id, ad, ust, esanlam[], toplama, kaynak, temalar[{id, ad, unlem}], olumlu_konular[{id, ad}], oneriler[{baslik, metin}], urunler[{id, kisa, marka, ad, segment ("Büyük marka"|"KOBİ"), gorsel, link, yazili, yildiz[1..5 sayıları], ort, onerilen_ort, onerilen_dusuk, ornek_dusuk, sikayet{temaId: oran}, olumlu{konuId: oran}, dikkat[], ders[], alinti[{konu, yildiz, metin}]}]}`

### Tasarım kararları
- Sade, kurumsal pazar yeri görünümü; "yapay zekâ havası" veren şeylerden (trend yazı tipleri, renkli kutular, her yerde etiket/gölge) kaçınılıyor.
- Yazı tipi: IBM Plex Sans. Renkler: beyaz zemin, turkuaz marka rengi (logo balonu #14b8a6, buton/link #0d8a7f; koyu temada #2dd4bf), kırmızı yalnızca şikâyet oranlarında.
- Logo: turkuaz konuşma balonu içinde radar (halkalar + tarama dilimi + sinyal noktası) + tek satır "Review**Radar**" ("Radar" turkuaz). Dosyalar `logo/` klasöründe (açık, koyu, şeffaf, ikon; SVG + PNG).

## 4. Kararlar ve ilkeler

- **Yasal yaklaşım:** Trendyol'dan otomatik veri çekmek kullanım koşullarına aykırı; proje için tek seferlik, yavaş ve az sayfayla "araştırma örneklemi" olarak toplanıyor. Kişisel veri (yorumcu adı) toplanmıyor. Sunumda sürekli sistem vizyonu yasal kanallarla anlatılacak: satıcının kendi mağazasını bağlaması (Trendyol Partner API), pazar yeri veri ortaklığı, lisanslı veri sağlayıcılar.
- **Trendyol'a fikir götürmek:** şimdi değil. Önce kanıt (çok kategori + gerçek KOBİ kullanıcı geri bildirimi), sonra resmi iş ortaklığı/entegratör kanalları, yöntem değil sonuç paylaşılır, gerekirse NDA. Tek pazar yerine bağımlı iş modeli kurma (Hepsiburada, n11, Amazon, ajanslar, bankaların KOBİ programları da hedef).
- **GitHub:** Claude bu depoya push yapabiliyor (Claude GitHub uygulaması yskirca1 hesabına kurulu). Depo ayarları (Pages, depo adı) kullanıcı tarafından yapılır. İsim kesinleşirse depo adı `reviewradar` yapılabilir.

## 5. Sıradaki adımlar

1. **50 kategori listesi:** KOBİ'lerin rekabet ettiği, yorumu bol kategoriler. Taslak "yakında" listesi: bebek arabası, telefon kılıfı, doğal sabun, kedi tırmalama tahtası, spor tayt, filtre kahve, kamp sandalyesi. Liste kullanıcıyla netleştirilecek.
2. **Veri toplama:** 5'erli partiler hâlinde, zamana yayarak. Her kategoride ortak konular (dayanıklılık, beden/ölçü, görselden farklı, kargo/paket, sahtelik, eksik parça, koku, fiyat) + kategoriye özel 2-4 konu.
3. **Otomasyon (sunuma kadar "canlı MVP"):** bilgisayarda çalışan toplama programı (Python + Playwright), Claude API ile otomatik konu sınıflandırma ve not üretimi (kullanıcının Anthropic API anahtarı gerekir), sonuçların GitHub'a otomatik yüklenmesi, tarihli kayıtlarla zaman içinde değişim takibi.
4. **Sunum (pazarlama dersi olduğu için en kritik eksik):** isim/slogan ✓, problem istatistiği, 3-4 persona (yeni girecek esnaf, mevcut Trendyol satıcısı, üretici), hedef pazar (TAM/SAM/SOM), rakip tablosu (Trendyol'un kendi yapay zekâ özeti, NeSatılır, TradeTrend, yabancı yorum analiz araçları), kendi ürünümüzün pazarlama stratejisi (kanallar, CAC/LTV), iş modeli (abonelik ya da kategori raporu), yol haritası, ekip, mütevazı ve varsayımları açık finansal tablo.
