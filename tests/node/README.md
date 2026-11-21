# Node kontrol takımı

Tarayıcı kontrolleri: yalnızca Node 18+ yerleşikleri ve kurulu Microsoft Edge (`--headless=new`, Chrome DevTools Protocol). Kurulum yok, `npm install` yok, Python yok.

```
node tests/node/run.mjs                      # bütün takımlar (yaklaşık 25 dk)
node tests/node/run.mjs smoke arrive         # seçilenler
node tests/node/run.mjs measure --real-images  # görseller Trendyol'dan gerçekten yüklenir
```

- Çalıştırma başına **tek** Edge açılır. Her sayfa kendi tarayıcı bağlamında (ayrı localStorage) çalışır. Bitince (hata olsa da) süreç öldürülür ve geçici profil (`rr-edge-*`) silinir.
- Site, depo kökünden kendi küçük sunucusuyla (boş bir portta) sunulur. `RR_BASE=https://...` verilirse o adres denetlenir (ör. canlı site). `RR_EDGE` Edge dosyasının yolunu değiştirir.
- Varsayılan olarak Trendyol görsel istekleri düz bir SVG ile karşılanır (ağ gerekmez). `--real-images` bunu kapatır.
- Çıktı: `PASS`/`FAIL` satırları, sonra `N passed, M failed`; biri bile başarısızsa çıkış kodu 1. Ekran görüntüleri, PDF ve `olcum.json` `tests/node/out/` altına yazılır (git'e girmez).

## Takımlar (`suites/`)

Her takım `export default async function ({ browser, base, check, out })`; `check(ad, ok, bilgi)` sonucu kaydeder.

| Takım | Ne denetler |
| --- | --- |
| `smoke` | Her adres türü 1280 ve 375 px: başlık, geçersiz adreslerde "Sayfa bulunamadı", yana taşma yok, konsol temiz |
| `chain` | Konu görünümü aritmetiği (12 kategori), alıntılar, tıklama zinciri ve geri/ileri, süzgeç ve sıralama adreste, öneri kanıt bağlantıları, kontrol listesi, `#/firsat` yazdırma |
| `regress` | Karşılaştırma (en çok 4, tek kategori), kaydırma geri gelir, rakip kartı (141 ürün), kontrol listesi kalıcılığı, arama, telefon zinciri ve süzgeç çekmecesi |
| `arrive` | Varış vurgusu: hedef, görünür alan, iz bırakmadan kalkma, yerleşim değişmez, odak, azaltılmış hareket, yazdırma, beş tema |
| `sentences` | Her kategori, ürün ve konu cümlesi, `data/*.json`'dan bağımsız hesapla ve elle yazılmış Türkçe ek tablosuyla birebir |
| `v21` | Başlık sırası, tekil kimlik, resimli oran = yazılı oran, cevap cümlesi, ana sayfa araması, çekmece, odak halkası, yazdırma, yerleşim kayması, tam sayfa görüntüler |
| `contrast` | Beş tema x 1280/375 x 10 sayfa türü: görünür yazısı olan her öğe en az 4,5:1; her temada renk rolü çiftleri (`--color-*`) 4,5:1, yıldız ve varış vurgusu çizgisi 3:1 |
| `v22` | Yeni kimlik (ana renk, Fira Sans, kehribar çağrı, renk anlamı, logo, eski tema kayıtları, `?v=22`); telefonda katlanan sayfalar (kategori, Yöntem, fırsat); ana sayfa fotoğrafları ve yıldız çubuğu; fotoğraf ya da yazı tipi gelmeyince sayfa; arayüz metni (uzun tire, terimler, turkuaz); kural denetimi (dokunmatikte 44 px, fareyle 24 px, hedefler arası 8 px, odak halkası ve odağın örtülmemesi, en küçük yazı 12 px, yıldız 4,5:1, azaltılmış hareket, el imleci) |
| `print` | Kategori raporu PDF'i, seçili kontrol listesi maddeleri, `#/firsat` telefonda |
| `measure` | Sayfa uzunlukları, `out/olcum.json`; kaydeder, başarısız saymaz |

## Ekran görüntüleri

`node tests/node/tools/shots.mjs --real-images`: 11 sayfa türü 1280 ve 375 px, Açık ve Koyu temada (üst ekran ve tam sayfa), ana sayfa ve kategori ayrıca Krem, Adaçayı ve Gece mavisinde; `.onizleme/v22/<no>-<sayfa>-<genişlik>-<tema>[-tam].png` (112 dosya, git'e girmez). `--out=` başka klasör, `--only=02,05` yalnızca seçilen sayfalar. Tek Edge, geçici profil silinir.

## v21 ölçümü

Ölçüt: telefon = `scrollHeight / 812` (375x812); masaüstü = `scrollHeight / 800` (1280x800). Görseller gerçek (`--real-images`). Görev 4-5 için başlangıç değeri.

Komut: `node tests/node/run.mjs measure --real-images` (21 Kasım 2026, v21 kodu). Değerler ekran sayısı:

```
adres                                 masaüstü  telefon
#/                                    2.9       6.2
#/kategori/filtre-kahve               10.5      20.3
#/kategori/termos                     8.6       15.4
#/urun/filtre-kahve/52915799          3.3       5.7
#/firsat                              3.2       7.8
#/yontem                              6.7       11.2
```

## v22 ölçümü

Komut: `node tests/node/run.mjs v22 measure --real-images` (21 Kasım 2026, `v22-bitirme`, Görev 10). Aynı ölçüt; v21 değerleri yukarıda.

```
adres                                 masaüstü  telefon   (v21: masaüstü / telefon)
#/                                    3.0       6.2       (2.9 / 6.2)
#/kategori/filtre-kahve               10.6      7.5       (10.5 / 20.3)
#/kategori/termos                     8.7       7.1       (8.6 / 15.4)
#/urun/filtre-kahve/52915799          3.5       5.6       (3.3 / 5.7)
#/firsat                              3.3       4.4       (3.2 / 7.8)
#/yontem                              8.6       2.8       (6.7 / 11.2)
```

Telefon hedefleri (spec): kategori en çok 8, Yöntem ve fırsat en çok 5 ekran; üçü de tuttu. Masaüstünde Yöntem uzadı: bölüm çizgileri ve içindekiler (Görev 5) ile uzun metin satırının en fazla yaklaşık 75 harfe indirilmesi (Görev 9).
