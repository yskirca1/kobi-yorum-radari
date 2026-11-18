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
- `smoke.py`, `shots3.py`, `shots4.py`: hızlı kontrol ve ekran görüntüsü betikleri.
