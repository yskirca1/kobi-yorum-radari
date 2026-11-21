# ReviewRadar bitirme turu: yeni görünüm ve son rötuşlar (v22)

Tarih: 21 Kasım 2026. Durum: onay bekliyor. Başlangıç: v21 (commit `aba7c3c`), iki adreste yayında.

## Amaç ve neden

ReviewRadar, Hamilik Okulu Vakfı pazarlama projesi: KOBİ sahibine, girmek istediği ürün kategorisinde müşterilerin en çok neden şikâyet ettiğini Trendyol yorumlarından gösteren statik bir site. Jüriye canlı gösterilecek; gerçek kullanıcı teknik olmayan, çoğu zaman telefondan bakan bir esnaf.

Site sahibi "son hal" istiyor: yapılabilecek geliştirmeler yapılsın, site ulaşabileceği en iyi seviyeye gelsin. Yeni özellik istemiyor; mevcut sitenin daha iyi görünmesini ve pürüzsüz çalışmasını istiyor. İki kararı kendisi verdi:

1. Yeni yetenek eklemek yerine **bitirme turu** yapılacak (yol A).
2. Sitenin kimliği korunmayacak; **UI UX Pro Max skill'inin önerdiği yeni görünüme** geçilecek.

## Hedefler

1. Site gözle görülür biçimde yeni ve tutarlı bir görsel kimliğe kavuşur (renk, yazı tipi, logo rengi, beş tema).
2. Telefonda sayfalar belirgin biçimde kısalır; en uzun sayfa (kategori) bugünkünün yarısından kısa olur.
3. Ana sayfada kategori fotoğrafları yeniden görünür hale gelir.
4. UI UX Pro Max kural listesinin 1-9. öncelikleri (erişilebilirlik, dokunma, performans, stil, düzen, yazı ve renk, hareket, form ve geri bildirim, gezinme) siteye tek tek uygulanır; uymayan her madde ya düzeltilir ya da gerekçesiyle kayda geçer.
5. Fotoğraf gelmediğinde ve bağlantı yavaşken sayfa düzgün durur.
6. Kontroller depoda durur ve bu bilgisayarda tek komutla çalışır.

## Kapsam dışı

- Yeni kategori, yeni veri, yeni özellik (satıcının kendi ürününü kıyaslaması vb.).
- Sunum (slaytlar, persona, pazar büyüklüğü).
- Sitenin başka bir altyapıya taşınması.
- `tools/` altındaki veri betikleri.

## Olursa başarısızlık sayılacak şeyler

- Herhangi bir rakamın, oranın, alıntının ya da hesap yönteminin değişmesi; veride olmayan bir şeyin (müşteri referansı, müşteri logosu, kullanıcı sayısı) siteye konması.
- v17-v21'de çalışan bir davranışın bozulması: adresler (`DEMO.md` ve `PROJE_NOTLARI.md` içindekilerin hepsi), süzgeç ve sıralamanın adreste durması, konu görünümleri ve toplam tabloları, ürün sayfasının konuda açılması, öneri-şikâyet bağlantıları, arama, rakip kartı, kontrol listesi ve işaretlerin saklanması, yazdırma (kategori raporu ve `#/firsat`), "?" açıklamaları, varış vurgusu, karşılaştırma kuralları, "Sayfa bulunamadı" durumları, kaydırma yerinin geri gelmesi, telefondaki süzgeç çekmecesi.
- Kırmızının şikâyet dışında, yeşilin "müşterinin sevdiği" dışında bir anlamda kullanılması.
- Sitenin oyuncak ya da reklam sayfası gibi görünmesi: cam efekti, geçişli renk dolguları, kayan bantlar, dikkat çekmek için hareket.
- Demo akışının (`DEMO.md`) herhangi bir adımının değişmesi ya da uzaması.

## Kısıtlar

- Statik site: `index.html`, `app.js`, `style.css`, `data/*.json`. Kütüphane, çatı, derleme adımı yok. GitHub Pages ve Vercel'de aynen çalışır.
- `data/` değişmez.
- Arayüz Türkçe; metinler sade, kısa, satıcının gözünden; uzun tire ve emoji yok.
- Beş temanın hepsinde yazı kontrastı en az 4,5:1; tıklanabilir ögelerin odak halkası görünür.
- Azaltılmış hareket tercihine uyulur.
- Canlıya gönderim yalnızca site sahibinin onayıyla. Yerelde commit serbest.
- Otomatik tarayıcı kontrolleri tek bir tarayıcı örneğiyle yapılır ve geçici profilleri iş bitince silinir (bu bilgisayarda çok sayıda başsız Edge açmak Alt+Tab'de bayat girdi bırakıyor).

## Değerlendirilen yollar

**Ne yapılacağı**

| Yol | Ne | Artı | Eksi | Sonuç |
|---|---|---|---|---|
| A. Bitirme turu | Denetimde çıkanları kapatmak, yeni özellik yok | Jüri önünde pürüz kalmaz, risk düşük | Yeni bir yetenek eklemez | **Seçildi** (site sahibi) |
| B. Yeni yetenek | Kendi ürününü kıyaslama, yeni kategoriler | Sunumda anlatacak yeni şey | Toplama ve yeni hata riski; pürüzler kalır | Sonraya bırakıldı |
| C. Baştan kurmak | Modern bir altyapıya taşımak | Yok | Görünürde kazanç yok, her şeyi riske atar | Elendi |

**Nasıl görüneceği**

| Yol | Ne | Artı | Eksi | Sonuç |
|---|---|---|---|---|
| Kimliği korumak | Turkuaz, IBM Plex, logo kalır; skill kural kitabı olur | Risk düşük | Site "aynı" görünür | Site sahibi istemedi |
| Yeni görünüm | Skill'in önerdiği renk ve yazı tipi | Gözle görülür fark | Logo ve beş tema yeniden kurulur | **Seçildi** (site sahibi) |

Skill iki tasarım sistemi önerdi. Mor-yeşil "canlı, blok tabanlı" olanı genç ve eğlence odaklı ürünler için; yeşil vurgusu "müşterinin sevdiği" yeşiliyle karışır. Lacivert-kehribar "veri yoğun gösterge paneli" olanı iş verisi gösteren bir araca daha yakın. **Lacivert-kehribar seçildi** (tasarımcının kararı; site sahibine "siteye daha yakın" diye sunuldu).

## Tasarım

### 1. Yeni kimlik

Kaynak: UI UX Pro Max `--design-system` çıktısı, "b2b analytics dashboard data insights" sorgusu.

| Rol | Açık temada değer | Kullanım |
|---|---|---|
| Ana renk | `#1E40AF` (lacivert) | Tıklanabilir her şey: bağlantı, düğme, "›", odak halkası, etkin bölüm |
| İkincil | `#3B82F6` | Üzerine gelme, ikincil vurgu |
| Vurgu | `#D97706` (kehribar) | Yalnızca birincil çağrı düğmesi ("Ara", "Örnekle başla") ve yıldız |
| Zemin / kart | `#F8FAFC` / `#FFFFFF` | Sayfa ve kart zemini |
| Yazı | `#1E3A8A` yerine nötr koyu (tasarımcının kararı, aşağıda) | Gövde metni |
| Kenar / soluk | `#DBEAFE` / `#E9EEF6` | Çizgi, soluk zemin |
| Şikâyet | mevcut kırmızı ailesi | Değişmez anlam |
| Sevilen | mevcut yeşil ailesi | Değişmez anlam |

Tasarımcının kararları (site sahibi bunları ayrıca söylemedi):

- **Gövde yazısı lacivert değil, nötr koyu gri-lacivert** olur (`#0F172A` civarı). Skill `#1E3A8A` öneriyor; ama lacivert metin, lacivert bağlantıyla karışır ve "lacivert = tıklanır" kuralını bozar.
- **Yazı tipi Fira Sans** (gövde ve başlık). Skill başlık için Fira Code öneriyor; tek aralıklı başlık teknik olmayan okur için okunmayı zorlaştırır. Fira Code yüklenmez. Rakamlar Fira Sans'ın tablo rakamlarıyla yazılır.
- **Logo biçimi aynı kalır, rengi değişir:** balon lacivert, "Radar" kelimesi lacivert. `logo/` altındaki SVG ve PNG dosyaları ile `favicon.svg` yeni renkle yeniden üretilir; paylaşım görseli (`og:image`) güncellenir.
- **Beş tema korunur** (Sistem, Açık, Krem, Adaçayı, Koyu, Gece mavisi) ve hepsi yeni paletten türetilir. Krem ve Adaçayı sıcak ve yeşilimsi zeminler olarak kalır; ana renk hepsinde lacivert ailesindendir (koyu temalarda açık mavi).
- **Kehribar yalnızca birincil çağrıda** kullanılır; kırmızıya yakın düşmemesi için şikâyet rakamlarının yanında yer almaz.
- **Renkler anlam adlarıyla tanımlanır** (`--color-primary`, `--color-on-primary`, `--color-accent`…); mevcut `--brand`, `--neg`, `--like` değişkenleri bunlara bağlanır ya da yerlerini alır. Bileşenlerde ham renk kodu kalmaz.
- **Skill'in "sayfa kalıbı" önerisi (müşteri logoları, satışla görüşün, video) uygulanmaz:** elde karşılığı yok.
- Skill'in tasarım sistemi, uyarlanmış haliyle `design-system/reviewradar/MASTER.md` olarak depoya yazılır; sonraki işler oradan okur.

### 2. Telefonda kısalan sayfalar

Bugün (375 px): kategori 15-20 ekran, Yöntem 11, fırsat 8, ana sayfa 6, ürün 6.

- **Kategori sayfası, 4. adım (Ürünler):** telefonda ürünler yatay satır kart olur (solda küçük fotoğraf, sağda ad, puan, 1-2 yıldız payı, en sık şikâyet). İlk 4 ürün görünür, kalanı "Tüm ürünleri göster (N)" ile açılır. Süzgeç ya da sıralama adreste varsa liste açık gelir. Masaüstü ızgarası kalır.
- **Kategori sayfası, 5. adım (Kontrol listesi):** telefonda kapalı gelir, başlığında ilerleme sayısı görünür; dokununca açılır. İşaret varsa açık gelir.
- **Kategori sayfası, 2. adım içindeki "Müşteriler neyi seviyor?":** ilk 4 satır, kalanı "tümünü göster".
- **Yöntem:** başta bölüm bağlantılarından oluşan içindekiler; telefonda bölümler başlığa dokununca açılır. `#/yontem/<bölüm>` ile gelindiğinde o bölüm açık gelir ve varış vurgusu çalışır.
- **Fırsat:** telefonda ilk üç kategori kartı zaten üstte; kalan kategoriler kısa satırlar halinde listelenir, satıra dokununca ayrıntı açılır.
- **Hedef:** kategori sayfası telefonda en çok 8 ekran; Yöntem ve fırsat en çok 5 ekran (kapalı halleriyle). "Ekran" = 375×812 px görünüm alanı yüksekliği; ölçüm `scrollHeight / 812`.
- **Hedef bir sınır değil, yön** (tasarımcının kararı). Kategori sayfasında 1-3. adımlar (Sorun, Kimde, Ne yapmalı) ve baştaki cümle ile balon resmi **kapatılamaz ve kaldırılamaz**: demo akışı (`DEMO.md` 2, 5, 6. adımlar) bunların açık olmasına dayanıyor. Bu adımlar yalnızca görsel olarak sıkıştırılabilir (boşluk, satır yüksekliği, resim boyutu). İzin verilen yollarla 8 ekrana inilemezse içerik kesilmez; ulaşılan sayı raporlanır.
- Kapalı gelen hiçbir içerik yazdırmada gizli kalmaz; yazdırma her şeyi açık basar.
- Sayfa içi arama (Ctrl+F) kapalı bölümlerde de bulsun diye kapalı bölümler `hidden="until-found"` ya da `<details>` ile yapılır.

### 3. Ana sayfa

- Kategori kartında fotoğraf büyür: masaüstünde kartın solunda dikey bir alan (yaklaşık 96×128 px), telefonda 72×96 px. Fotoğraf kırpılmaz.
- Kartın başlığı 1 numaralı şikâyet olmaya devam eder.
- Tanıtım bandı yeni kimlikle: düz lacivert zemin, büyük arama, örnek aramalar, "Örnekle başla".

### 4. Ürün sayfası

- "Yıldız dağılımı" kartı tek satırlık yığılmış bir çubuğa (5 parça, altında yüzdeler) iner ve hüküm bölümünün içine alınır; boş kalan kart kalkar.

### 5. Dayanıklılık

- Fotoğraf gelmezse yerinde nötr bir yer tutucu (ürün simgesi) durur; yükseklik değişmez.
- Fotoğraflar için yer baştan ayrılır; yükleme sırasında sayfa oynamaz.
- Yazı tipi gelmezse sistem yazı tipiyle sayfa okunur kalır; yazı tipi geldiğinde satır kırılımı belirgin değişmesin diye yedek yazı tipinin ölçüleri Fira Sans'a yaklaştırılır.
- Kategori verisi gelmezse bugünkü "Tekrar dene" ekranı yeni kimlikle durur.

### 6. Metin okuması

Sitedeki bütün arayüz metinleri (şablon cümleler, düğmeler, açıklamalar, Yöntem) baştan sona bir kez okunur: terim tutarlılığı ("1-2 yıldız payı", "şikâyet oranı"), gereksiz uzunluk, yazım. Veri dosyalarındaki metinlere dokunulmaz. Anlamı değiştiren düzeltme yapılmaz; yapılan her değişiklik listelenir.

### 7. Kural listesi denetimi

`C:\Users\yskir\.claude\skills\ui-ux-pro-max\references\quick-reference.md` içindeki kurallar 1-9. öncelik sırasıyla siteye uygulanır. Statik, çatısız bir web sitesine uymayan kurallar (yerel uygulama, alt gezinme çubuğu, GSAP) "uygulanmaz" diye işaretlenir. Sonuç `docs/superpowers/specs/2026-11-21-kural-denetimi.md` dosyasına tablo olarak yazılır: kural, durum (uyuyor / düzeltildi / uygulanmaz / bilerek bırakıldı), not.

Önceden bilinen sapmalar: dokunma alanları bazı yerlerde 32-36 px (kural 44 px), "?" düğmeleri 20 px (görünmez alanı 36 px), ★ rengi 4,5:1'in altında.

### 8. Çalışan kontroller

- `tests/node/` altında, yalnızca Node ve bilgisayardaki Edge ile çalışan kontrol betikleri: önceki turlarda geçici klasörde duran sürücü ve kontrol takımları (tıklama zinciri, adresler, varış vurgusu, cümle-rakam uyumu, kontrast, yazdırma, telefon genişliğinde taşma) depoya alınır.
- **Betikler duruyor; yeniden yazılmayacak.** Yedekleri depo klasöründe `.onizleme/kontrol-yedek/` altında (git'e girmeyen klasör): sürücü `cdp.mjs`; takımlar `verify.mjs` (v19 tıklama zinciri ve adresler), `regress.mjs` (genel), `v20.mjs` (varış vurgusu), `sent21.mjs` (cümle-rakam uyumu), `full21.mjs` ve `a21.mjs` (v21 kontrolleri), `contrast21.mjs` (kontrast), `smoke.mjs`, `printshot.mjs`, `audit.mjs` (gerçek fotoğraflarla ekran görüntüsü ve sayfa uzunluğu), `mycheck.mjs` (demo zinciri ve vurgu). Sürücü bugün her betikte yeni tarayıcı açıyor ve Trendyol görsellerini yer tutucuyla değiştiriyor; tek tarayıcıya ve "gerçek fotoğraf" seçeneğine uyarlanması gerekir.
- **Bu iş planın ilk adımıdır:** yeniden tasarım başlamadan takım depoya alınır ve v21 üzerinde geçtiği görülür; böylece sonraki her adım aynı takımla sınanır. Yeni markaya göre değişen seçiciler ve renk beklentileri ilgili adımda güncellenir.
- Tek komut: `node tests/node/run.mjs` yerel sunucuyu açar, tek tarayıcıyla bütün takımı çalıştırır, sunucuyu ve tarayıcıyı kapatır, geçici profili siler, geçen ve kalan sayısını yazar.
- Mevcut Python betikleri (`tests/*.py`) silinmez; README'de hangisinin çalıştığı yazılır.

## Uygulayana bırakılanlar

- Beş temanın kesin renk değerleri (yukarıdaki roller ve kontrast kuralı içinde).
- Boşluk ve yazı ölçeğinin kesin değerleri; kart, düğme ve çubukların yeni biçimi.
- Kapalı gelen bölümlerin tam etkileşimi (`<details>` ya da düğme), animasyon süresi.
- PNG logo dosyalarının nasıl yeniden üretileceği.
- İşin kaç parçaya bölüneceği ve sırası.

## Doğrulama

- Her sayfa türü (ana sayfa, kategori, konu, sevilen konu, ürün, ürün-konu, karşılaştırma, arama, fırsat, Yöntem, bulunamadı) 1280 ve 375 px'te, Açık ve Koyu temada; ana sayfa ve kategori ayrıca Krem, Adaçayı, Gece mavisinde ekran görüntüsüyle, **gerçek ürün fotoğraflarıyla**.
- `node tests/node/run.mjs` bütün takımı geçer.
- Telefonda sayfa uzunluğu hedefleri ölçülür ve raporlanır.
- `DEMO.md` akışı baştan sona tıklanarak yürünür.
- Ekran görüntüleri `.onizleme/v22/` klasörüne konur; site sahibi canlıya göndermeden önce bakar.

## Belgeler ve kayıt

- `PROJE_NOTLARI.md` ("Tasarım kararları": yeni kimlik; turkuaz ve IBM Plex kararlarının site sahibinin isteğiyle değiştiği), `DEMO.md` (ekranda görünenler), `index.html` içindeki `?v=` 22 olur.
- Echo notları ve masaüstündeki "Claude Çalışmalarım" kopyası güncellenir.
