# Jüri demosu: 2-3 dakikalık akış

Akış yalnızca sitenin kendi bağlantılarıyla yürür; ayrı bir kılavuz ekranı yok. Adresler canlı sitenin köküne göredir: `https://yskirca1.github.io/kobi-yorum-radari/` + aşağıdaki `#/…` kısmı. Her adres doğrudan yapıştırılarak da açılır, geri ve ileri tuşları çalışır. Bir bağlantı sayfanın belirli bir parçasına gidiyorsa (konu başlığındaki oran, tablodaki ürün satırı, konu kartı, süzgeçli liste, Yöntem bölümü) o parça açılınca bir an turkuaz zeminle vurgulanır, sonra kendiliğinden söner.

## Neden filtre kahve?

Demo kategorisi **Filtre kahve**. Seçim, her kategoride en sık 4 şikâyet için "saklanan örnek yorum o konunun ne kadarını kapsıyor?" sorusuyla yapıldı (her ürünün konudaki yaklaşık yorum sayısı, o üründe o konuya etiketli bir alıntı varsa "kapsanmış" sayıldı):

| Kategori | En sık 4 şikâyette alıntıyla kapsanan pay |
|---|---|
| Filtre kahve | %92 (tat %97, son kullanma tarihi %94, patlak paket %90, bayat %66) |
| Telefon kılıfı | %85 |
| Bebek arabası | %73 |
| Termos bardak | %38 (en düşük) |

Filtre kahvede şikâyet oranı %10 ve üstü olan her ürünün o konuda en az bir alıntısı var (tat 12/12, son kullanma tarihi 5/5, patlak paket 4/4, bayat 2/2). Yani jüri hangi ürüne tıklarsa tıklasın büyük ihtimalle müşterinin kendi cümlesini görür. Hikâyesi de net: büyük markada şikâyet satıcı ve lojistikten (son kullanma tarihi yakın ürün), KOBİ'de damak tadından geliyor. Ana sayfadaki "Örnekle başla" düğmesi bu kategoriye gider.

## Akış

**1. Ana sayfa** `#/`
- Tıkla: koyu banttaki **"Örnekle başla: Filtre kahve"** düğmesi.
- Söyle: "Rakip ürünlerin binlerce yorumunu tek tek okuduk; şimdi bir kategoriye bakalım."

**2. Kategori özeti** `#/kategori/filtre-kahve`
- Göster: "En sık şikâyetler" listesi (Tadı ve aroması beklentiyi karşılamıyor %25, Tarihi yaklaşmış ürün geliyor %20, Paketi patlak geliyor %11, Bayat geliyor %5).
- Tıkla: **"Tarihi yaklaşmış ürün geliyor %20"** satırı.
- Söyle: "Müşterinin beşte biri son kullanma tarihi yakın ürün aldığını yazıyor. Bu %20 nereden geliyor, bakalım."

**3. Konu görünümü** `#/kategori/filtre-kahve/konu/skt`
- Göster: başlıktaki satır (büyük marka ürünlerinde %30, KOBİ ürünlerinde %2) ve "Bu oran hangi ürünlerden oluşuyor?" tablosu. Tchibo Profesional %59 en üstte; altta toplam: yaklaşık 152,3 yorum ÷ 780 okunan 1-2 yıldızlı yorum = %20.
- Tıkla: tablodaki **"Tchibo Profesional Special Filtre Kahve 4x250 g"**.
- Söyle: "Bu sorun büyük markaların sorunu. KOBİ'nin en kolay farkı: taze kahve."

**4. Ürün sayfası, aynı konu** `#/urun/filtre-kahve/52915799/konu/skt`
- Göster: sayfa doğrudan konu kartında açılır: bu üründe şikâyet oranı %59, müşterinin kendi cümlesi (2 yıldız: "SON KULLANIM TARİHİNE 2 AY KALAN KAHVEYİ GÖNDERDİĞİNİZ İÇİN TESEKKURLER").
- Tıkla (isteğe bağlı): **"Bu ürünün bütün yorumları Trendyol'da"** (yeni sekmede açılır).
- Söyle: "Her rakamın arkasında gerçek yorum var; isterseniz Trendyol'da kendiniz okuyabilirsiniz."

**5. Ne yapmalı?** Tarayıcının geri tuşuyla iki kez geri gel ya da kırıntıdaki "Filtre kahve"ye tıkla, sonra bölüm menüsünde **"Ne yapmalı?"**.
- Göster: 2. öneri "Taze kahve en güçlü kozun", altında "Dayandığı şikâyet: Son kullanma tarihi yakın geldi %20".
- Söyle: "Öneriler şikâyete bağlı; oran tıklanınca aynı kanıta döner."

**6. Kapanış (süre kalırsa)** Özet kutusunda "1-2 yıldız payı, satıcı tipine göre" altındaki **KOBİ %7,0**.
- Adres: `#/kategori/filtre-kahve?sirala=cok&tip=kobi`
- Söyle: "KOBİ ürünleri, en çok 1-2 yıldız alandan başlayarak. Bu görünümün de kendi adresi var; satıcıya bağlantı olarak gönderilebilir."

## "Bu rakam nereden?" sorularına hangi tık

| Soru | Tık | Ne görünür |
|---|---|---|
| "%20 şikâyet oranı nereden?" | Özetteki şikâyet satırı → `#/kategori/filtre-kahve/konu/skt` | Ürün ürün oran, okunan 1-2 yıldızlı yorum ve yaklaşık yorum; toplamı başlıktaki oranı verir. |
| "Bu ürün için ne yazmışlar?" | Konu tablosunda ürün adı → `#/urun/filtre-kahve/<ürün>/konu/<konu>` | O konuya etiketli saklanan alıntılar, yıldızıyla. Alıntı yoksa site bunu yazar ve Trendyol bağlantısı verir. |
| "%7,7 (1-2 yıldız payı) nereden?" | Özetteki %7,7 → `#/kategori/filtre-kahve?sirala=cok` | Ürünler 1-2 yıldız payına göre sıralı; her kartta ürünün payı. Hesap: "?" düğmesi ve `#/yontem/yildiz`. |
| "7 / 1.300 ne demek?" | Özetteki 7 / 1.300 → `#/yontem/iki-ornek` | Neden iki ayrı örnek okunduğu: "Önerilen" sıralamada düşük puanlı yorum neredeyse hiç görünmüyor. |
| "KOBİ ile büyük marka farkı nereden?" | Özetteki %8,1 / %7,0 ya da İçgörüler'de "Büyük marka mı, KOBİ mi?" satırı | O tipin ürünleri ya da konunun segment ara toplamları. |
| "Öneri neye dayanıyor?" | Önerinin altındaki konu bağlantısı | Konu görünümü; eşlemenin nasıl yapıldığı `#/yontem/oneri`. |
| "Yorumlar gerçek mi, tarihleri ne?" | Ürün sayfasında "Trendyol'da" bağlantısı; `#/yontem/alinti` | Alıntılar kelimesi kelimesine; tarih saklanmadı, bunu Yöntem açıkça yazar. |
| "Ana sayfadaki 440.358 nereden?" | Ana sayfadaki rakam → `#/yontem/yildiz` | Yöntem sayfası, rakamlar veriden canlı hesaplanır. |
| "Hangi kategoriye girmeli?" | Üst menü → `#/firsat` | Kategoriler tek tabloda; hücreler ilgili kategori görünümüne gider. |

## Hazırlık

- Sunumdan önce siteyi bir kez aç (veri dosyaları önbelleğe girsin) ve temayı "Açık" seç.
- Telefonda göstereceksen aynı akış çalışır; konu tablosu satır satır kart olarak görünür.
- Karşılaştırma çubuğu açıksa "Temizle" ile kapat; ekranın altını kaplamasın.
