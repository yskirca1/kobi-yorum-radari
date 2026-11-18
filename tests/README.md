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
- `smoke.py`, `shots3.py`, `shots4.py`: hızlı kontrol ve ekran görüntüsü betikleri.

Not (18 Kasım 2026, v18): bu bilgisayarda Python Playwright kurulu değil; v18 aynı kontrollerin depo dışındaki Node + CDP kopyasıyla kurulu headless Edge'de doğrulandı. `v18_check.py` Playwright kurulu bir makinede çalıştırılmadı.

Not (18 Kasım 2026, v19): v19 de aynı yolla (depo dışındaki Node + CDP sürücüsü, headless Edge) doğrulandı; `v19_check.py` Playwright'la çalıştırılmadı. v19'da değişen beklentiler: `v18_check.py` konu araması artık tam konu görünümünü bekler (eski kutu yok); `firsat_check.py` telefonda tablonun DOM'da olup CSS'le gizlendiğini bekler (yazdırmada tablo basılsın diye).
