# Testler

Playwright (Python) ile yazılmış kontrol betikleri. Yollar depoya göre (`tests/_common.py`); çıktılar (ekran görüntüleri, PDF, json) `tests/out/` altına yazılır.

Kurulum (bir kez): `pip install playwright`. Windows'ta kurulu Edge kullanılır (`channel="msedge"`), ayrıca tarayıcı indirmek gerekmez; başka sistemde `python -m playwright install chromium`.

Çalıştırma: depo kökünde `python -m http.server 8765`, sonra başka bir pencerede örneğin `python tests/behave.py`. Windows'ta Türkçe çıktı için `set PYTHONIOENCODING=utf-8`.

- `RR_BASE`: sitenin adresi (varsayılan `http://localhost:8765/`).
- `RR_CHROME`: belirli bir tarayıcı dosyası kullanmak için yolu.

Trendyol görsel sunucusuna erişim yoksa ürün görselleri yüklenmez; betikler bunu hata saymaz.

- `full.py`: bütün adresler × ekran boyutları × temalar; konsol hatası, yana taşma, bozuk görsel.
- `behave.py`: karşılaştırma, yönlendirme, kaydırma, filtre paneli, arama davranışları; v17 kontrolleri (kategori sayfası bölüm sırası ve bölüm menüsü, özet kutusu, terim açıklamaları, ürün sayfasında önceki/sonraki, ana sayfanın veri gelmeden açılması). "Yakında" kontrolleri `data/kategoriler.json` içeriğine göre kurulur (şu an bütün kategoriler hazır).
- `firsat_ref.py` + `firsat_check.py`: "Hangi kategoriye girmeli?" sayfasındaki giriş puanı ve ölçütlerin `data/*.json` üzerinden bağımsız hesapla karşılaştırması, filtreler, sıralama; telefonda kart görünümü.
- `contrast.py`: beş temada yazı/zemin kontrast ölçümü.
- `theme_check.py`: tema menüsü, kalıcılık, "Sistem" seçeneği.
- `print_check.py`: yazdırılabilir kategori raporu (PDF sayfa sayısı; `pdftoppm` varsa sayfa görüntüleri).
- `v18_check.py`: v18 kontrolleri: gruplu arama (Türkçe harf ve aksansız yazım, ek toleransı, ok tuşları, veri gecikirken "yükleniyor" satırı), şikâyet konusundan kategoriye geçiş, ürün sayfasındaki rakip kartının bütün ürünlerde bağımsız hesapla karşılaştırılması, giriş kontrol listesi (kalıcılık, sıfırlama, depolama kapalıyken, yazdırma), telefonda başlık bilgi satırı.
- `v19_check.py`: v19 kontrolleri: konu görünümünde ürün ürün parçaların başlıktaki oranı ve segment ara toplamlarını vermesi (bütün kategoriler, bütün şikâyet konuları; olumlu konularda basit ortalama), yalnızca etiketli alıntılar, tıklama zinciri (ana sayfa → kategori → konu → ürün-konu → Trendyol) ve geri/ileri, adresteki süzgeç ve sıralama, geçersiz adresler, önerilerin konu bağlantıları ve alanlar yokken "Genel öneri", `#/firsat` telefon genişliğinde yazdırma.
- `v20_check.py`: varış vurgusu: her bağlantı türünde vurgulanan öğe, görünür alanda olması, 1,8 sn sonra iz bırakmadan kalkması ve yerleşimin değişmemesi; bütün sayfaya giden bağlantılarda, geri/ileri ve yenilemede vurgu olmaması; doğrudan açılan ve yapıştırılan adres; odak; azaltılmış hareket; yazdırma (1280 ve 375 px).
- `smoke.py`, `shots3.py`, `shots4.py`: hızlı kontrol ve ekran görüntüsü betikleri.

Not (18 Kasım 2026, v18): bu bilgisayarda Python Playwright kurulu değil; v18 aynı kontrollerin depo dışındaki Node + CDP kopyasıyla kurulu headless Edge'de doğrulandı. `v18_check.py` Playwright kurulu bir makinede çalıştırılmadı.

Not (18 Kasım 2026, v19): v19 de aynı yolla (depo dışındaki Node + CDP sürücüsü, headless Edge) doğrulandı; `v19_check.py` Playwright'la çalıştırılmadı. v19'da değişen beklentiler: `v18_check.py` konu araması artık tam konu görünümünü bekler (eski kutu yok); `firsat_check.py` telefonda tablonun DOM'da olup CSS'le gizlendiğini bekler (yazdırmada tablo basılsın diye).

Not (18 Kasım 2026, v20): v20 de aynı yolla doğrulandı; `v20_check.py` Playwright'la çalıştırılmadı. v20'de değişen beklenti: `#/firsat`taki 1-2 yıldız payı, KOBİ ve büyük marka 1-2 yıldız payı hücrelerinden gelince kategori sayfası ürün listesine değil özet kutusundaki aynı rakama açılır (odak özet bölümünde); doğrudan açılan süzgeçli adres eskisi gibi ürün listesine açılır.

- `v21_check.py`: "önce cevap" yeniden tasarımı: her sayfa türünde cevap cümlesi; kategori ve şikâyet konusu cümlelerinin `data/*.json`'dan bağımsız hesapla birebir karşılaştırılması (Türkçe ekler elle yazılmış tablodan); resimli oranın (`svg.picto`) metin karşılığı ve dolu balon sayısı; numaralı adımlar ve bölüm menüsü; ana sayfadaki arama kutusu ve örnek aramalar; başlık sırası, tekil kimlikler, yana taşma (1280 ve 375 px).

Not (18 Kasım 2026, v21): v21 de depo dışındaki Node + CDP sürücüsüyle headless Edge'de doğrulandı; `v21_check.py` Playwright'la çalıştırılmadı. Depo dışı kopya ürün hükümlerini (141 ürün) ve olumlu konu cümlelerini de karşılaştırdı. v21'de değişen beklentiler: kategori sayfası sırası 1 Sorun (`sec-ozet`) · 2 Kimde (`sec-icgoru`) · 3 Ne yapmalı (`sec-oneri`) · 4 Ürünler · 5 Kontrol listesi; özet kutusu (`.sum-side`) yok, rakamlar `#sec-ozet .facts` ve `#sec-icgoru .fact-seg` içinde; ürün sayfasındaki 4'lü kutu (`.stat`) yerine `.pstats`; ana sayfa kartında yer tutucu `.cat-top-w.wait`, şikâyet oranı bağlantısı `a.cat-top`; `#/firsat`tan satıcı tipi rakamına gelince odak `sec-icgoru`. Sayfalar biraz daha geç oturduğu için varış vurgusu kontrollerinde yükleme beklemesi 500 ms yerine 900 ms.
