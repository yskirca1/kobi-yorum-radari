# Arayüz metni okuması (v22, Görev 8)

Tarih: 21 Kasım 2026. Kapsam: `app.js` ve `index.html` içindeki bütün kullanıcıya görünen metinler (şablon cümleler, düğmeler, başlıklar, "?" açıklamaları, Yöntem, `aria-label`, `title`, yer tutucu). `data/*.json` içindeki metinler kapsam dışı (veri değişmez).

## Ölçüt

Spec'in kuralları: terimler "1-2 yıldız payı" ve "şikâyet oranı"; uzun tire yok; emoji yok; başlıklar cümle düzeninde; kısa, satıcının gözünden; eski "turkuaz" kalmaz. Anlamı değiştiren düzeltme yapılmaz; hiçbir rakam ya da bir cümlenin hangi rakamı söylediği değişmez.

## Bulunanlar

- Uzun tire (—): arayüzde yok. Boş hücredeki "–" kısa tire (tablo boşluğu), kural dışı değil.
- "Turkuaz": arayüzde yok (yalnızca `PROJE_NOTLARI.md` ve `DEMO.md` eski kimliği anlatıyordu; Görev 10'da güncellendi).
- "1-2 yıldız oranı" / "şikâyet payı": arayüz metninde yok. **Veride var:** `data/*.json` içinde 36 yerde "1-2 yıldız oranı" yazıyor (ürünlerin "dikkat" ve "ders" notları, 4 öneri metni; bebek arabası, doğal sabun, filtre kahve, kamp sandalyesi, kedi tırmalama, nevresim takımı, yüz serumu). Bunlar ürün sayfasındaki "Bu ürünün zayıf noktaları" / "Rakip bir KOBİ için ders" kartlarında ve kategori sayfasındaki önerilerde görünür. `data/` düzenlenmediği için kaldı; site sahibine bildirildi.
- Başlıklar cümle düzeninde; emoji yok.
- Aynı şey için iki farklı söz ve birkaç teknik kelime bulundu (aşağıdaki tablo).

## Değişiklikler

| Yer | Önce | Sonra | Neden |
|---|---|---|---|
| Ürün sayfası, açılan konu kartı (sağ üst bağlantı) | Bütün alıntıları göster (N) | Bütün örnek yorumları göster (N) | Site bu yorumlara her yerde "örnek yorum" diyor ("?" açıklaması, Yöntem, kart başlıkları); "alıntı" iç terim |
| Ürün sayfası, "Bu rakip nerede açık veriyor?" kartının alt notu | Bu karşılaştırma nasıl yapıldı? | Bu karşılaştırma nasıl yapılıyor? | Aynı Yöntem bölümüne giden iki bağlantı iki farklı sözle yazılmıştı (az yorumlu üründe "yapılıyor") |
| Karşılaştırma tablosu, satır başlığı | Segment | Satıcı tipi | Sitenin geri kalanı (süzgeç, Yöntem) "Satıcı tipi" diyor; "segment" teknik kelime |
| Kategori raporu (yazdırma), ürün tablosu sütunu | Segment | Satıcı tipi | Aynı neden |
| Karşılaştırma tablosu, satır başlığı | "Önerilen" ile gerçek arası fark | "Önerilen" ortalaması ile genel puan farkı | "Gerçek" öbür değerin sahte olduğunu ima ediyordu; satır "Önerilen" ilk yorumların ortalaması ile ürünün genel ortalama puanı arasındaki farkı gösterir (hesap aynı) |
| Karşılaştırma tablosu, satır başlığı | En büyük 3 şikâyet | En sık 3 şikâyet | Sitenin her yerinde "en sık şikâyet"; liste şikâyet oranına göre sıralı (sıra aynı) |
| `#/firsat`, KOBİ ya da büyük marka sütununda boş hücrenin ipucu (`title`) | Bu segmentte ürün yok | Bu satıcı tipinde ürün yok | "Segment" yerine sitenin terimi |
| `#/firsat`, telefon satırının ayrıntısı | Büyük marka yorum payı | Büyük markaların yorum payı | Tablo sütunu, ana sayfa ve Yöntem "Büyük markaların yorum payı" diyor |
| `#/firsat`, "Puan ayrıntısı" tablosundaki ham değer | Büyük marka yorum payı %X | Büyük markaların yorum payı %X | Aynı neden |
| Ürün sayfası, müşterinin sevdiği konu kartı (`#/urun/…/sevilen/…`) | "Önerilen" sıralamada okunan N yorumun %X kadarında geçiyor | "Önerilen" sıralamada okunan N yorumun %X'inde geçiyor | "%X kadarında" bozuk Türkçe; şikâyet kartındaki kalıpla aynı ek ("%31'inde"); ek sitenin ek fonksiyonuyla (`sfxLoc`) kurulur |

Şablon cümleler (`catAnswer`, `segAnswer`, `topicAnswer`, `prodVerdict`) değişmedi; `sentences` takımı aynı beklentilerle geçer.

## Bilerek dokunulmayanlar

- "Yöntem: Bu rakamlar nasıl hesaplandı?" (iki noktadan sonra büyük harf): iki noktadan sonra tam cümle geldiği için Türkçe yazım kuralına uygun.
- "Ort. puan" (yazdırma tablosu): dar sütun, kısaltma basılı raporda yerinde.
- "Puan filtresinde 1-2 yıldızlı yorum çıkmadı…" (örneği boş ürünler): Trendyol'un kendi filtresini anlatıyor; Yöntem'le aynı söz.

## Kontrol

`tests/node/suites/v22.mjs` içinde `copyText`: 11 sayfa türünde (ana sayfa, kategori, konu, sevilen konu, ürün, ürün-konu, iki ürünlü karşılaştırma, arama, fırsat, Yöntem, bulunamadı) sayfanın bütün metni, kapalı bölümler ve "?" açıklamaları, `aria-label`, `title`, `placeholder` ve sekme başlığı dahil: uzun tire yok, "1-2 yıldız oranı" ve "şikâyet payı" yok, "turkuaz" yok. Veriden gelen metin (öneri metni, "dikkat"/"ders" notları, müşteri alıntıları) bu kontrolden çıkarılır.
