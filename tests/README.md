# Testler

Playwright (Python) ile yazılmış kontrol betikleri. 12 Kasım 2026 oturumunda Claude'un bulut çalışma alanında yazıldı; yollar oraya göre sabit (`/home/claude/...`, ekran görüntüsü klasörleri, `http://localhost:8765`). Başka bir makinede çalıştırmadan önce bu yolları düzelt.

Çalıştırma: depo kökünde `python3 -m http.server 8765`, sonra betikler. Trendyol görsel sunucusuna erişim yoksa ürün görselleri yüklenmez; betikler bunu hata saymaz.

- `full.py`: bütün adresler × ekran boyutları × temalar; konsol hatası, yana taşma, bozuk görsel.
- `behave.py`: karşılaştırma, yönlendirme, kaydırma, filtre paneli, arama davranışları. Bilinen 6 eski kontrol başarısız: 4'ü artık "yakında" kategorisi kalmadığı için, "O" 8 kategori bağlantısı beklediği için, "K" kutunun karşılaştırma çubuğunun altında kalması yüzünden (site hatası değil).
- `firsat_ref.py` + `firsat_check.py`: "Hangi kategoriye girmeli?" sayfasındaki giriş puanı ve ölçütlerin `data/*.json` üzerinden bağımsız hesapla karşılaştırması, filtreler, sıralama.
- `contrast.py`: beş temada yazı/zemin kontrast ölçümü.
- `theme_check.py`: tema menüsü, kalıcılık, "Sistem" seçeneği.
- `print_check.py`: yazdırılabilir kategori raporu (PDF sayfa sayısı).
- `smoke.py`, `shots3.py`, `shots4.py`: hızlı kontrol ve ekran görüntüsü betikleri.
