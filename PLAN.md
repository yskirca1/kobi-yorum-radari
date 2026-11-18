# PLAN: her rakam kanıtına kadar tıklanabilsin

Tarih: 18 Kasım 2026. Durum: inceleme bitti, uygulama başlamadı. Bu plan onay bekliyor.

## Başlangıç noktası

- Canlıda v17 var. Çalışma klasöründe commit edilmemiş v18 değişiklikleri duruyor (geniş arama, ürün sayfasında "Bu rakip nerede açık veriyor?" kartı, giriş kontrol listesi, kalite düzeltmeleri). v18'i alt ajan yazdı ve kendi kontrollerinden geçirdi; ana oturumda gözle kontrol edilmedi.
- v18 bu işin bir parçasını zaten getiriyor: `#/kategori/<id>/konu/<temaId>` adresi var. Ancak yalnızca aramadan ulaşılıyor, sayfanın başında küçük bir kutu olarak açılıyor, en çok geçen 3 ürünü gösteriyor ve yorum göstermiyor.
- Ana sayfanın bütün dosyaları beklemesi v17'de giderildi; bu madde kapalı.

## Verinin izin verdiği ve vermediği

İncelemede `data/` dosyalarına bakıldı. Sonuç:

| İstenen | Veride durum |
|---|---|
| Bir oranın hangi ürünlerden oluştuğu | Var. Her üründe her konu için `sikayet` oranı ve okunan 1-2 yıldızlı yorum sayısı (`ornek_dusuk`) duruyor; kategori oranı bunlardan hesaplanıyor. Her ürünün katkısı gösterilebilir. |
| Konuya ait örnek yorumlar | Kısmen. Toplam 461 alıntı var, ürün başına 3-4 tane. Olumsuz alıntıların hepsi bir şikâyet konusuna bağlanabiliyor (7 kategoride konu kimliğiyle, 5 kategoride konu adıyla). En sık 4 konuda, oranı %10 ve üstü olan ürün-konu çiftlerinin yaklaşık üçte ikisinde 1 alıntı var; termosta 26 çiftin yalnızca 8'inde. |
| Yorum tarihi | Yok. Hiçbir veri dosyasında yorum tarihi tutulmuyor. |
| Ham yorumlar | Depoda ve bu bilgisayarda yok. Termosun CSV dosyası eski çalışma alanında kalmış; diğer kategorilerin ham yorumları Claude masaüstü uygulamasının Chat sekmesindeki tarayıcıda. |
| Önerinin dayandığı şikâyet | Yok. `oneriler` yalnızca `baslik` ve `metin` içeriyor; hangi konuya dayandığı veride yazmıyor. |

Bunun anlamı:

1. Zincirin "o konuya ait örnek yorumlar" halkası yalnızca eldeki alıntılarla kurulabilir: konu başına ürün başına en çok 1-2 alıntı, yıldızıyla, tarihsiz. Alıntı olmayan yerde site bunu açıkça yazar ve ürünün Trendyol sayfasına yönlendirir. Hiçbir yorum uydurulmaz.
2. Tarih gösterilemez. Kategorinin toplama tarihi veride var ama kullanıcı isteğiyle sitede gösterilmiyor.
3. Önerileri şikâyete bağlamak için her öneriye bir alan eklemek gerekir (aşağıda "Veri yapısı değişikliği").

## Veri yapısı değişikliği (onay gerekli)

`data/<kategori>.json` içindeki her öneriye `konular` alanı eklenir: o önerinin dayandığı şikâyet ve olumlu konu kimlikleri. Örnek:

```json
{ "baslik": "Farkı kapakta yarat", "metin": "…", "konular": ["sizdirma", "kapak"] }
```

- 70 öneri var. Eşleme, öneri metni okunarak elle yapılır; metinde adı geçen konu dışında bir şey eklenmez. Metni hiçbir konuya dayanmayan öneri boş kalır ve sitede "genel öneri" olarak görünür.
- Rakam eklenmez. Öneri kartında görünen oranlar, bağlanan konunun verideki oranından sitede hesaplanır.
- Mevcut alanlar ve sayılar değişmez. `tools/<kategori>/olustur.py` betikleri de aynı alanı üretecek şekilde güncellenir; yoksa veri yeniden üretildiğinde eşleme kaybolur.
- 5 eski kategoride (termos, sweatshirt, kulaklık, şal, telefon kılıfı) alıntıların `konu` alanı konu adı olarak yazılmış. Veri değiştirilmez; site adı kimliğe çevirir.

## İncelemede bulunan kopukluklar

Yerelde (v18 çalışma kopyası) masaüstü genişliğinde sayfa yapısı üzerinden bakıldı.

Kategori sayfası
- Özet kutusundaki 4 şikâyet çubuğu tıklanmıyor.
- "Tüm yazılı yorumlar %X", "Müşterinin ilk gördüğü yorumlar N / M" ve "satıcı tipine göre" rakamları tıklanmıyor.
- "Ne yapmalı?" önerilerinde hiç bağlantı yok.
- İçgörü kartlarında ("Müşteriler neyi seviyor?", "Büyük marka mı, KOBİ mi?") satırlar tıklanmıyor.
- Ürün kartındaki "En sık şikâyet" yazısı konuya gitmiyor.
- Konu görünümü yalnızca aramadan açılıyor, başlığı "Aradığın şikâyet", 3 ürünle sınırlı, yorum yok.

Ürün sayfası
- Şikâyet ve "Neyi seviyorlar?" çubukları tıklanmıyor.
- "Müşterinin kendi sözleriyle" alıntıları konuya göre süzülemiyor; bir konunun alıntısına adresle gidilemiyor.
- "Bu rakip nerede açık veriyor?" kartındaki konular tıklanmıyor.
- Trendyol bağlantısı var ve yeni sekmede açılıyor.

Hangi kategoriye girmeli?
- Tablo hücreleri (1-2 yıldız payı, büyük marka payı, 1 numaralı şikâyet) tıklanmıyor; yalnızca kategori adı bağlantı.
- Telefon genişliğinde yazdırınca boş çıkıyor (v17'den kalan).

Ana sayfa
- Dört büyük rakam ve kategori kartındaki "En sık şikâyet" kutusu kanıta gitmiyor.

Karşılaştırma
- Hücreler tıklanmıyor (bu sayfa incelemede ayrıca açılmadı; kod üzerinden doğrulanacak).

## Yapılacaklar

### 1. Konu görünümü: zincirin orta halkası
`#/kategori/<id>/konu/<temaId>` tam bir görünüm olur (kutudan çıkar, başlığı konunun adı olur):
- Kategori oranı ve nasıl oluştuğu: konunun geçtiği bütün ürünler, her birinin oranı, okunan 1-2 yıldızlı yorum sayısı ve yaklaşık yorum adedi (oran × okunan yorum, "yaklaşık" diye yazılır). Büyük marka ve KOBİ ayrımı.
- O konudaki eldeki alıntılar, ürün adı ve yıldızıyla. Alıntısı olmayan ürünler için "bu konuda örnek alıntı yok".
- Her satır ürün sayfasında o konuya gider.
- Bu konuya bağlı öneriler (konular alanı onaylanırsa).
- Olumlu konular için eş görünüm: `#/kategori/<id>/sevilen/<konuId>`.
- Adresler mevcut konu kimliklerini kullanır (örnek: `#/kategori/termos/konu/sizdirma`). Kimlikler veride tanımlı; "kargo-hasari" gibi yeni adlar üretilmez.

### 2. Ürün sayfasında konu
- `#/urun/<kategori>/<urunId>/konu/<temaId>`: sayfa o konu vurgulanmış ve alıntılar o konuya süzülmüş açılır; "bütün alıntıları göster" ile süzgeç kalkar.
- Şikâyet ve sevilen çubukları, rakip kartındaki konular ve "zayıf noktalar" bu adreslere bağlanır.
- Alıntıların altında "Yorumların tamamı Trendyol'da" bağlantısı (yeni sekme).

### 3. Her rakam tıklanır
- Kategori özeti: şikâyet çubukları konu görünümüne; "1-2 yıldız payı" ürün listesine (en çok 1-2 yıldız sıralamasıyla); "ilk görülen yorumlar" Yöntem'deki ilgili bölüme; satıcı tipi rakamları o tipe süzülmüş ürün listesine.
- İçgörü kartlarındaki satırlar konu ya da sevilen görünümüne.
- Ürün kartındaki "En sık şikâyet" konu görünümüne.
- Fırsat tablosu ve telefon kartları: hücreler ilgili kategori görünümüne.
- Karşılaştırma tablosu: şikâyet hücreleri ürünün o konusuna.
- Ana sayfa: dört rakam Yöntem'e; karttaki "En sık şikâyet" konu görünümüne.
- Süzgeç ve sıralama da adrese yazılır (örnek: `#/kategori/termos?sirala=dusuk&tip=kobi`), böylece "satıcı tipine göre" gibi bağlantılar paylaşılabilir ve geri tuşu doğru çalışır.
- Tıklanabilir rakamlar tek tip görünür (altı noktalı çizgi ve ok), böylece neyin tıklanacağı tahmin edilmez.

### 4. Öneriler kanıta bağlanır
- Her öneri kartında "Dayandığı şikâyet: Sızdırma %24, Kapak %21" satırı; her biri konu görünümüne gider.
- Giriş kontrol listesindeki maddeler de aynı bağlantıları alır.

### 5. Jüri demosu
- Ayrı bir kılavuz ekranı yok. Akış sitenin kendi bağlantılarıyla yürür; ana sayfada akışın ilk adımına götüren tek bir belirgin giriş bulunur.
- `DEMO.md`: 2-3 dakikalık adım adım akış (hangi ekran, neye tıklanır, ne söylenir, jüri "bu rakam nereden?" derse hangi tıkla gösterilir). Kategori, alıntısı en dolu olanlardan seçilir.

### 6. v17'den kalanlar
- `#/firsat` telefon genişliğinde yazdırılınca tablo basılır.
- Krem ve Adaçayı temaları bütün sayfa türlerinde ekran görüntüsüyle gözle kontrol edilir.

### 7. Belgeler
- Yöntem sayfası: "Bir oran hangi ürünlerden oluşuyor?", "Örnek yorumlar nasıl seçildi, neden az?" ve öneri-şikâyet bağlantısı bölümleri.
- `PROJE_NOTLARI.md`, `tests/` ve Echo notları güncellenir.

## Sıra ve kontrol

1. v18'i ana oturumda gözle kontrol et, yerelde commit et (temel).
2. Öneri-konu eşlemesi (onaylanırsa): 12 kategori, sonuç kullanıcıya tablo olarak gösterilir.
3. Konu görünümü ve ürün sayfasında konu (madde 1-2).
4. Tıklanır rakamlar ve adrese yazılan süzgeçler (madde 3-4).
5. Demo akışı ve `DEMO.md` (madde 5).
6. Kalanlar, Yöntem, notlar (madde 6-7).

Her adımdan sonra: masaüstü ve telefon genişliğinde, bir açık ve bir koyu temada sayfa kontrolü; doğrudan adresle açma, geri tuşu ve konsol kontrolü; yerelde commit. Canlıya gönderim yalnızca kullanıcı onayıyla.

## Onay bekleyen kararlar

1. Önerilere `konular` alanının eklenmesi (veri yapısı değişikliği).
2. Örnek yorumların eldeki alıntılarla sınırlı ve tarihsiz kalması. Diğer yol: ham yorumları Chat sekmesindeki tarayıcıdan dışarı almak; bu, o sekmede kullanıcının yapacağı bir iş ve ayrı bir adım.
3. v18'in temel olarak kabul edilmesi.
