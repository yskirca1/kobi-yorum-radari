# UI UX Pro Max kural denetimi (v22, Görev 9)

Tarih: 21 Kasım 2026. Kaynak: `C:\Users\yskir\.claude\skills\ui-ux-pro-max\references\quick-reference.md`, öncelik 1-9 (10. öncelik "Charts & Data" spec'in kapsamı dışında). Kurallar statik, çatısız, Türkçe bir web sitesine (ReviewRadar, `index.html` + `app.js` + `style.css`) uygulandı. Skill'in `pro-rules.md` dosyası kendi notuna göre yerel (iOS/Android) uygulama içindir; web için yalnızca quick-reference kullanıldı.

Durumlar: **uyuyor** (bugünkü kod kurala uyuyor), **düzeltildi** (bu görevde düzeltildi), **uygulanmaz** (kural bu tür bir siteye ait değil; gerekçe notta), **bilerek bırakıldı** (kurala uyulmuyor, nedeni notta).

Ölçülen kurallar `tests/node/suites/v22.mjs` içindeki `audit` bölümünde sınanır ("Kontrol" sütunu). Ölçüm yeri: 11 sayfa türü (ana sayfa, kategori, konu, sevilen konu, ürün, ürün-konu, iki ürünlü karşılaştırma, arama, fırsat, Yöntem, bulunamadı).

## Özet

Toplam 193 satır: 129 uyuyor, 35 uygulanmaz, 18 bilerek bırakıldı, 11 düzeltildi.

## Tablo

| Kural | Öncelik | Durum | Not |
|---|---|---|---|
| `color-contrast` | 1 Erişilebilirlik | düzeltildi | Yazı 4,5:1 beş temada (`contrast` takımı: 5 tema × 2 genişlik × 10 sayfa türü). Yıldız (★) Açık temada 3,2:1, Krem ve Adaçayı 4,4:1 idi; yazı karakteri olduğu için 4,5:1 hedeflendi: Açık `#B45309`, Krem ve Adaçayı `#A15C07` (kehribar ailesi, anlam aynı; koyu temalar `#FBBF24` zaten 9:1). Kontrol: `yıldız: kontrast`; `contrast` takımında yıldız eşiği 3:1 → 4,5:1. |
| `focus-states` | 1 Erişilebilirlik | uyuyor | 2 px ana renk halkası (`:focus-visible`), koyu bantlarda açık renk. Kontrol: `odak: her etkileşimli ögede görünür` (4 sayfada Tab ile 54-126 öğe). |
| `alt-text` | 1 Erişilebilirlik | uyuyor | Ürün sayfası ve karşılaştırma görselinde ürün adı; süs görselleri `alt=""`; yüklenemeyen görselin yer tutucusu adı "(görsel yüklenemedi)" ile söyler. |
| `aria-labels` | 1 Erişilebilirlik | uyuyor | "?" düğmeleri "Ne demek: …", karşılaştırma çubuğundaki görseller ve "Çıkar" düğmeleri ürün adıyla, tema düğmesi seçili temayı söyler. |
| `icon-context` | 1 Erişilebilirlik | uyuyor | Yazının yanındaki simgeler `aria-hidden`; telefonda ürün satırındaki şikâyet simgesinin yazısı ekran okuyucuda ("En sık şikâyet"). |
| `keyboard-nav` | 1 Erişilebilirlik | uyuyor | Sekme sırası görünüm sırasıyla aynı; tema menüsü ok, Home, End, Esc; süzgeç çekmecesi ve "?" Esc ile kapanır. |
| `form-labels` | 1 Erişilebilirlik | uyuyor | Onay kutuları ve seçimler `label` içinde; arama kutusu `aria-label` taşır (görünür etiket konusu 8. öncelikte `input-labels`). |
| `skip-links` | 1 Erişilebilirlik | uyuyor | "İçeriğe geç" bağlantısı. |
| `heading-hierarchy` | 1 Erişilebilirlik | uyuyor | h1 → h2 → h3 (`v21` takımı denetler). |
| `color-not-only` | 1 Erişilebilirlik | uyuyor | Şikâyet kırmızısının yanında simge ve "şikâyet" sözü; karşılaştırmada en iyi değer kalın; seçili çip dolu zemin ve `aria-pressed`. |
| `dynamic-type` | 1 Erişilebilirlik | uyuyor | Ölçüler `rem`; kök yazı boyu tarayıcı ayarıyla ölçeklenir (106,25%). Tarayıcı yazı boyu 200% ile ayrıca denenmedi. |
| `reduced-motion` | 1 Erişilebilirlik | uyuyor | Azaltılmış harekette geçişler kapalı, varış vurgusu sabit. Kontrol: `hareket: azaltılmış hareket tercihinde yalnızca sabit vurgu`. |
| `voiceover-sr` | 1 Erişilebilirlik | uyuyor | Resimli oranların metin karşılığı `aria-label`da, gizli adım numaraları ("Adım 2: "), canlı bölgeler (`aria-live`). |
| `escape-routes` | 1 Erişilebilirlik | uyuyor | Süzgeç çekmecesinde "Kapat", Esc ve arka perde; karşılaştırma sorusunda "Vazgeç"; "Sayfa bulunamadı"da dönüş düğmesi. |
| `keyboard-shortcuts` | 1 Erişilebilirlik | uyuyor | Sitenin kendi kısayolu yok, tarayıcı kısayolları ezilmiyor; sürükleme yok. |
| `focus-not-obscured` | 1 Erişilebilirlik | düzeltildi | `#/firsat` tablosu ve sütun sıralama düğmeleri Tab ile odaklanınca yapışkan başlığın altında kalıyordu. `html` üzerinde `scroll-padding` (üst çubuk; kategori sayfasında bölüm menüsü de; altta karşılaştırma çubuğu); bölümlerin `scroll-margin`i buna göre küçültüldü (bölüme gitmede toplam kaydırma aynı). Kontrol: `odak: yapışkan başlık ya da karşılaştırma çubuğu odağı örtmez` (düzeltme geçici olarak kaldırılınca `#/firsat`ta başarısız olduğu görüldü). |
| `focus-not-obscured-enhanced` | 1 Erişilebilirlik | uyuyor | Aynı kontrol odaklı öğenin bütününün görünmesini ister (ekrandan uzun tabloda üst kenarı). |
| `focus-appearance` | 1 Erişilebilirlik | uyuyor | Halka 2 px ana renk; ana renk zemine karşı 4,5:1 ve üstü (`contrast` takımı, roller). |
| `dragging-alternative` | 1 Erişilebilirlik | uyuyor | Tek sürüklenen denetim "Kendin ayarla" kaydırıcıları: yerel `input type=range`, ok tuşları ve tıklamayla da çalışır. |
| `web-target-size` | 1 Erişilebilirlik | düzeltildi | Fareyle her hedef en az 24×24 px, metin içi bağlantı ya da WCAG 2.5.8 aralık istisnası (24 px çaplı daire başka hedefe değmez). Öneri ve kontrol listesi dayanaklarında yan yana duran 17 px'lik bağlantılar ve ürün kartındaki şikâyet bağlantısı satır içi dolguyla 25 px (yerleşim değişmez). Kontrol: `dokunma: masaüstünde en az 24 px (WCAG 2.5.8)`. |
| `consistent-help` | 1 Erişilebilirlik | uyuyor | "?" açıklamaları terimin hemen yanında; altbilgide her sayfada aynı yerde Yöntem bağlantısı. |
| `redundant-entry` | 1 Erişilebilirlik | uygulanmaz | Çok adımlı form yok. |
| `accessible-authentication` | 1 Erişilebilirlik | uygulanmaz | Giriş yok. |
| `auto-rotation-controls` | 1 Erişilebilirlik | uygulanmaz | Kendiliğinden dönen içerik yok. |
| `contextual-live-badge-updates` | 1 Erişilebilirlik | uyuyor | Karşılaştırma çubuğu iletisi, fırsat sayacı ("N / 12 kategori") ve cevap cümlesi `aria-live="polite"`; odak taşınmaz. |
| `touch-target-size` | 2 Dokunma | düzeltildi | Telefonda (dokunmatik) 44×44 px altında kalanlar: logo 28, üst çubuk bağlantısı 37, tema düğmesi 33, çipler 34-35, rakam bağlantıları 27-43, kırıntı 35, "?" 36, sıralama seçimleri 32-41, çubuk satırları 36, süzgeç etiketleri 25, tek başına duran yazı bağlantıları 17-24, "Çıkar" 37, ilk üç kategori adı 33. Görünür boyutu büyütmek yerleşimi değiştirecek yerlerde görünmez `::before` dokunma alanı; düğme, seçim, süzgeç etiketi, ağırlık seçimi ve çubuk satırlarında gerçek 44 px. Yalnızca `pointer: coarse`; masaüstü görünümü aynı. "?" görünmez alanı 36 → 44 px. Kontrol: `dokunma: 44 px` (11 sayfa türü ve süzgeç çekmecesi). |
| `touch-target-size (istisna)` | 2 Dokunma | bilerek bırakıldı | Telefonda ürün satırındaki ad bağlantısı 40 px (2 satır). Aynı ürüne giden 64×84 px fotoğraf bağlantısı hemen solunda (WCAG 2.5.8 eşdeğer hedef istisnası); satır 140 px altında kalsın diye ad büyütülmedi. Kontrolde izin listesinde (`TOUCH_OK`). |
| `touch-spacing` | 2 Dokunma | düzeltildi | Alan çipleri, fırsat çipleri, ağırlık seçimi ve Yöntem içindekiler arasında 6 px vardı; 8 px yapıldı. Kontrol: `dokunma: hedefler arası en az 8 px` (bölüm menüsü, süzgeç çekmecesi, çip satırları, içindekiler). |
| `hover-vs-tap` | 2 Dokunma | uyuyor | Hiçbir şey yalnızca üzerine gelince açılmıyor ("?" tıklama ya da dokunma ile). |
| `loading-buttons` | 2 Dokunma | uyuyor | Uzun süren düğme işlemi yok; sayfa yüklenirken "Yükleniyor…" ve iskelet. |
| `error-feedback` | 2 Dokunma | uyuyor | Karşılaştırma kuralı çiğnenince çubukta ileti; geçersiz adreste "Sayfa bulunamadı" ve nedeni. |
| `cursor-pointer` | 2 Dokunma | uyuyor | Kontrol: `imleç: tıklanır ögelerde el imleci` (11 sayfa türü). |
| `gesture-conflicts` | 2 Dokunma | bilerek bırakıldı | Telefonda alan çipleri ve karşılaştırma tablosu kendi kutusunda yana kayar (sayfa kaymaz; tabloda "Tabloyu yana kaydır" ipucu). Çipleri alt alta dizmek sayfayı uzatırdı. |
| `tap-delay` | 2 Dokunma | uyuyor | `width=device-width` görünüm etiketi; katlanır başlık ve "Tümünü göster" düğmelerinde `touch-action: manipulation`. |
| `standard-gestures` | 2 Dokunma | uyuyor | Özel hareket yok. |
| `system-gestures` | 2 Dokunma | uyuyor | Sistem hareketlerini engelleyen bir şey yok. |
| `press-feedback` | 2 Dokunma | uyuyor | Üzerine gelme ve seçili halleri; tarayıcının dokunma vurgusu kapatılmadı. |
| `haptic-feedback` | 2 Dokunma | uygulanmaz | Web sitesi, titreşim yok. |
| `gesture-alternative` | 2 Dokunma | uyuyor | Her işlem görünür bir denetimle yapılır. |
| `safe-area-awareness` | 2 Dokunma | uyuyor | Kenar boşlukları, süzgeç çekmecesi ve karşılaştırma çubuğu `env(safe-area-inset-*)` ile. |
| `no-precision-required` | 2 Dokunma | düzeltildi | `touch-target-size` ile aynı düzeltme. |
| `swipe-clarity` | 2 Dokunma | uyuyor | Yana kayan çip satırında son çip kenarda kesik görünür; tabloda yazılı ipucu ve sağ kenar solması. |
| `drag-threshold` | 2 Dokunma | uygulanmaz | Sürükleme yok. |
| `image-optimization` | 3 Performans | bilerek bırakıldı | Ürün fotoğrafları Trendyol'un sunucusundan doğrudan geliyor; biçim ve `srcset` elde değil. Kutular sabit ölçülü, liste görselleri tembel yükleniyor. |
| `image-dimension` | 3 Performans | uyuyor | Her `img` `width`/`height` taşır, kutusu CSS'te sabit. Kontrol: `kayma yok` (Görev 7). |
| `font-loading` | 3 Performans | uyuyor | `display=swap`; ölçüleri Fira Sans'a ayarlı yedek yazı tipi (Görev 7). |
| `font-preload` | 3 Performans | bilerek bırakıldı | Google Fonts dosya adresleri sürümlü; önceden yükleme bağlantısı zamanla kırılır. `preconnect` var. |
| `critical-css` | 3 Performans | uyuyor | Tek stil dosyası `head` içinde; tema ilk boyamadan önce satır içi betikle seçiliyor. |
| `lazy-loading` | 3 Performans | uygulanmaz | Derleme adımı yok (spec kısıtı); tek `app.js`. |
| `bundle-splitting` | 3 Performans | uygulanmaz | Aynı neden. |
| `third-party-scripts` | 3 Performans | uyuyor | Dış betik yok; yalnızca Google Fonts stili. |
| `reduce-reflows` | 3 Performans | uyuyor | Kaydırma izleme `requestAnimationFrame` ile, dinleyiciler `passive`. |
| `content-jumping` | 3 Performans | uyuyor | Ana sayfa kartları ve okuma şeridi için yer önceden ayrılı. Kontrol: `kayma yok` (ilk 4 saniyede düzen kayması 0,1'in altında). |
| `lazy-load-below-fold` | 3 Performans | uyuyor | Kart ve liste görselleri `loading="lazy"`; ürün sayfasının ana görseli `fetchpriority="high"`. |
| `virtualize-lists` | 3 Performans | uygulanmaz | En uzun liste 13 ürün ya da 12 kategori. |
| `main-thread-budget` | 3 Performans | uyuyor | Ağır hesap yok; ayrıca ölçülmedi. |
| `progressive-loading` | 3 Performans | uyuyor | 150 ms sonra "Yükleniyor…" ve iskelet çubukları. |
| `input-latency` | 3 Performans | uyuyor | Ölçülmedi; etkileşimler eşzamanlı DOM güncellemesi. |
| `tap-feedback-speed` | 3 Performans | uyuyor | Aynı. |
| `debounce-throttle` | 3 Performans | uyuyor | Kaydırma `requestAnimationFrame` ile seyreltiliyor; arama yerel ve hızlı. |
| `offline-support` | 3 Performans | bilerek bırakıldı | Çevrimdışı mod yok (servis çalışanı yeni özellik olurdu); veri gelmezse "Veri yüklenemedi" ve "Tekrar dene". |
| `network-fallback` | 3 Performans | uyuyor | Fotoğraf gelmezse yer tutucu, yazı tipi gelmezse ayarlı yedek (Görev 7). |
| `style-match` | 4 Stil | uyuyor | Skill'in "veri yoğun gösterge paneli" önerisi (lacivert-kehribar), site sahibinin seçimi. |
| `consistency` | 4 Stil | uyuyor | Bütün sayfalar aynı başlık bandı, cevap cümlesi ve kart dili. |
| `no-emoji-icons` | 4 Stil | uyuyor | Yalnızca satır içi SVG çizgi simgeler. |
| `color-palette-from-product` | 4 Stil | uyuyor | Palet skill'in iş verisi sorgusundan (spec). |
| `effects-match-style` | 4 Stil | uyuyor | Düz yüzey, ince çizgi, tek gölge ölçeği; cam ve geçişli dolgu yok. |
| `platform-adaptive` | 4 Stil | uygulanmaz | Yerel uygulama değil. |
| `state-clarity` | 4 Stil | uyuyor | Üzerine gelme, seçili (dolu çip, `aria-current` alt çizgisi) ve devre dışı (yarı saydam "Karşılaştır") halleri ayrı. |
| `elevation-consistent` | 4 Stil | uyuyor | `--shadow-sm`, `--shadow`, `--shadow-lg`, `--shadow-up` belirteçleri. |
| `dark-mode-pairing` | 4 Stil | uyuyor | Beş tema aynı rollerden; koyu temalarda açık mavi ana renk. |
| `icon-style-consistent` | 4 Stil | uyuyor | Tek simge ailesi, 1,8 çizgi, `currentColor`. |
| `system-controls` | 4 Stil | uyuyor | Yerel `select`, onay kutusu, `details`, `input type=range`. |
| `blur-purpose` | 4 Stil | uyuyor | Bulanıklık yok. |
| `primary-action` | 4 Stil | uyuyor | Kehribar yalnızca "Ara" ve "Örnekle başla" (çerçeveli, ikincil). |
| `viewport-meta` | 5 Düzen | uyuyor | `width=device-width, initial-scale=1`, yakınlaştırma açık. |
| `mobile-first` | 5 Düzen | bilerek bırakıldı | CSS masaüstünden telefona yazılmış (v11'den beri); sonuç 375 px'te her sayfa türünde ölçülüyor (`smoke`, `v22`, ekran görüntüleri). Baştan yazmak risk, görünür kazancı yok. |
| `breakpoint-consistency` | 5 Düzen | bilerek bırakıldı | Telefon sınırı her yerde 640 px; 420, 860, 900, 960 px bileşene özel (bölüm menüsü yazısı, süzgeç çekmecesi, ürün başlığı, üst çubuk). |
| `readable-font-size` | 5 Düzen | düzeltildi | Gövde 17 px, telefonda da. Telefonda satıcı tipi rozeti 10,5 px, bölüm menüsü numaraları 11,9 px, masaüstünde fırsat sıralama oku 11,2 px idi; en az 12 px yapıldı. Kontrol: `yazı: en küçük boyut 12 px`. |
| `line-length-control` | 5 Düzen | düzeltildi | Masaüstünde Yöntem paragrafları, notlar ve açıklamalar satırda 90-105 harfe çıkıyordu; uzun metinlere `max-width: 60ch` (ölçüm: en çok 72 harf, küçük yazılı notta 79). Telefonda değişiklik yok. |
| `horizontal-scroll` | 5 Düzen | uyuyor | `smoke` her adres türünde yana taşma olmadığını denetler. |
| `spacing-scale` | 5 Düzen | uyuyor | 4-8-12-16-24-32-48 ölçeği (v21); birkaç 6 ve 10 px ara değer var. |
| `touch-density` | 5 Düzen | düzeltildi | `touch-spacing` ile aynı. |
| `container-width` | 5 Düzen | uyuyor | `.wrap` en fazla 1200 px. |
| `z-index-management` | 5 Düzen | uyuyor | Katmanlar sabit: içerik 1, öneri listesi 5, bölüm menüsü 15, üst çubuk 20, açıklama kutusu 25, karşılaştırma çubuğu 30, çekmece perdesi 35, çekmece 40, tema menüsü 50, "İçeriğe geç" 100. |
| `fixed-element-offset` | 5 Düzen | uyuyor | Karşılaştırma çubuğu açıkken altbilginin altında çubuk kadar boşluk; odak ve bölüme gitme için `scroll-padding` (bu görev). |
| `scroll-behavior` | 5 Düzen | uyuyor | İç kaydırma yalnızca tablolarda ve öneri listesinde, `overscroll-behavior: contain`. |
| `viewport-units` | 5 Düzen | uyuyor | `100dvh` (yedeği `100vh`). |
| `orientation-support` | 5 Düzen | uyuyor | Yatay telefonda (812 px) geniş düzen kullanılır; ayrıca ölçülmedi. |
| `content-priority` | 5 Düzen | uyuyor | Telefonda ikincil içerik katlı (Görev 4-5): ürünlerin ilk 4'ü, kontrol listesi, Yöntem bölümleri, fırsat satırları. |
| `visual-hierarchy` | 5 Düzen | uyuyor | Cevap cümlesi > adım başlığı > gövde; boyut ve kalınlıkla. |
| `compact-label-overflow` | 5 Düzen | uyuyor | Rozetler ve çipler kısa ve tam metin. |
| `chip-collection-reflow` | 5 Düzen | bilerek bırakıldı | Telefonda alan çipleri tek satırda kendi içinde kayar (yazılar küçülmez, hepsi erişilebilir); alt alta dizmek ana sayfayı ve fırsatı uzatırdı. |
| `line-height` | 6 Yazı ve renk | uyuyor | Gövde 1,6. |
| `line-length` | 6 Yazı ve renk | düzeltildi | `line-length-control` ile aynı. |
| `font-pairing` | 6 Yazı ve renk | uyuyor | Tek aile (Fira Sans) başlık ve gövdede. |
| `font-scale` | 6 Yazı ve renk | bilerek bırakıldı | Ana ölçek belgeli (v21), ama küçük yazılarda .82, .84, .86, .88, .9, .92rem gibi yakın değerler var. Birleştirmek çok sayıda yerleşimi değiştirir; görünür kazancı yok. |
| `contrast-readability` | 6 Yazı ve renk | uyuyor | Koyu yazı açık zeminde, açık yazı koyu zeminde; `contrast` takımı. |
| `text-styles-system` | 6 Yazı ve renk | uygulanmaz | Yerel yazı sistemi (iOS, Material) yok. |
| `weight-hierarchy` | 6 Yazı ve renk | uyuyor | Başlık 600-700, gövde 400, etiket 500-600. |
| `color-semantic` | 6 Yazı ve renk | uyuyor | `--color-*` anlam adları; bileşenlerde ham renk yok (Görev 2). |
| `color-dark-mode` | 6 Yazı ve renk | uyuyor | Koyu temalar açık tonlarla, ayrı ölçüldü. |
| `color-accessible-pairs` | 6 Yazı ve renk | uyuyor | Her temada rol çiftleri 4,5:1 (`contrast` takımı, yıldız dahil). |
| `color-not-decorative-only` | 6 Yazı ve renk | uyuyor | Kırmızı ve yeşil yanında simge ve söz. |
| `truncation-strategy` | 6 Yazı ve renk | bilerek bırakıldı | Ürün kartında ad 2 satırda kesilir; tam ad bağlantının metninde (ekran okuyucu okur) ve ürün sayfasının başlığında. |
| `letter-spacing` | 6 Yazı ve renk | uyuyor | Gövdede varsayılan; büyük başlıklarda hafif sıkı, büyük harfli etiketlerde açık. |
| `number-tabular` | 6 Yazı ve renk | uyuyor | Rakamlar `tabular-nums`. |
| `whitespace-balance` | 6 Yazı ve renk | uyuyor | Adımlar arası boşluk ve ince çizgi. |
| `heading-line-balance` | 6 Yazı ve renk | uyuyor | Başlıklarda `text-wrap: balance`, cümlelerde `pretty`. |
| `long-token-wrapping` | 6 Yazı ve renk | uyuyor | `smoke` yana taşma yok; uzun ürün adları satıra sığar. |
| `duration-timing` | 7 Hareket | uyuyor | Kısa geçişler 0,15-0,2 sn; varış vurgusu 1,8 sn, bir kez. |
| `transform-performance` | 7 Hareket | bilerek bırakıldı | Kontrol listesi ilerleme çubuğu `width` ile 0,2 sn geçiş yapar (6 px yüksekliğinde tek öğe, başka şey kaymaz). Diğer hareketler `transform` ve gölge. |
| `loading-states` | 7 Hareket | uyuyor | 150 ms'den kısa yüklemede gösterge çıkmaz, sonra "Yükleniyor…". |
| `excessive-motion` | 7 Hareket | uyuyor | Sayfa başına en fazla bir hareket (varış vurgusu). |
| `easing` | 7 Hareket | uyuyor | Vurgu yumuşak girip çıkar; geçişler varsayılan eğriyle. |
| `motion-meaning` | 7 Hareket | uyuyor | Vurgu "buraya geldin" der; ok dönmesi açık ya da kapalıyı. |
| `state-transition` | 7 Hareket | bilerek bırakıldı | Katlanır bölümler anında açılır (yalnızca ok döner): sakin görünüm kuralı ve sayfa içi arama ve yazdırmayla uyumlu. |
| `continuity` | 7 Hareket | uygulanmaz | Sayfa geçiş animasyonu yok (spec: dikkat çekmek için hareket yok). |
| `parallax-subtle` | 7 Hareket | uygulanmaz | Paralaks yok. |
| `spring-physics` | 7 Hareket | uygulanmaz | Yay hareketi yok. |
| `exit-faster-than-enter` | 7 Hareket | uyuyor | Çekmece giriş ve çıkış 0,2 sn; vurgunun sönmesi girişinden uzun ama tek ve sakin (v20 kararı). |
| `stagger-sequence` | 7 Hareket | uygulanmaz | Liste giriş animasyonu yok. |
| `shared-element-transition` | 7 Hareket | uygulanmaz | Sayfa geçiş hareketi yok. |
| `interruptible` | 7 Hareket | uyuyor | Yeni gezinme vurguyu hemen durdurur (`arriveStop`). |
| `no-blocking-animation` | 7 Hareket | uyuyor | Hiçbir hareket girdiyi engellemez. |
| `fade-crossfade` | 7 Hareket | uygulanmaz | İçerik değişiminde geçiş yok. |
| `scale-feedback` | 7 Hareket | uyuyor | Masaüstünde ürün fotoğrafı üzerine gelince %4 büyür; azaltılmış harekette yok. |
| `gesture-feedback` | 7 Hareket | uygulanmaz | Sürükleme ve kaydırma hareketi yok. |
| `hierarchy-motion` | 7 Hareket | uygulanmaz | Sayfa geçiş hareketi yok. |
| `motion-consistency` | 7 Hareket | uyuyor | Aynı süreler (0,15 / 0,2 sn). |
| `opacity-threshold` | 7 Hareket | uyuyor | Solan öğe yok. |
| `modal-motion` | 7 Hareket | uyuyor | Süzgeç çekmecesi düğmenin tarafından (soldan) kayar. |
| `navigation-direction` | 7 Hareket | uygulanmaz | Sayfa geçiş hareketi yok. |
| `layout-shift-avoid` | 7 Hareket | uyuyor | Vurgu `box-shadow` ve `outline` ile; `arrive` takımı yerleşimin değişmediğini denetler. |
| `cancellable-state-transitions` | 7 Hareket | uyuyor | Vurgu her yeni gezinmede iptal edilir; son hal animasyonun bitişine bağlı değil. |
| `input-labels` | 8 Form ve geri bildirim | bilerek bırakıldı | Arama kutusunun görünür etiketi yok: yer tutucu, büyüteç simgesi, "Ara" düğmesi ve `aria-label` var; kalıp tanıdık ve ilk ekranda yer dar. Diğer bütün girdiler görünür etiketli. |
| `error-placement` | 8 Form ve geri bildirim | uygulanmaz | Doğrulanan alan yok. |
| `submit-feedback` | 8 Form ve geri bildirim | uyuyor | Arama hemen sonuç sayfasına ya da kategoriye gider; boş arama hiçbir şey yapmaz. |
| `ime-composition-enter` | 8 Form ve geri bildirim | uyuyor | Enter tarayıcının kendi form gönderimi (özel tuş işleyicisi yok). |
| `required-indicators` | 8 Form ve geri bildirim | uygulanmaz | Zorunlu alan yok. |
| `empty-states` | 8 Form ve geri bildirim | uyuyor | "Bu filtrelere uyan ürün yok" ve "Filtreleri temizle"; sonuçsuz aramada örnekler ve kategori bağlantıları; boş karşılaştırmada dönüş yolu. |
| `toast-dismiss` | 8 Form ve geri bildirim | uyuyor | Karşılaştırma çubuğu iletisi 4 sn sonra kalkar. |
| `confirmation-dialogs` | 8 Form ve geri bildirim | bilerek bırakıldı | "İşaretleri temizle" ve karşılaştırmada "Temizle" sormadan siler. Yalnızca seçim varken görünürler, etkileri küçük ve yeniden yapmak kolay; onay penceresi akışı uzatırdı. |
| `input-helper-text` | 8 Form ve geri bildirim | uyuyor | Kontrol listesi ve ağırlık seçiminde kalıcı açıklama satırları. |
| `disabled-states` | 8 Form ve geri bildirim | uyuyor | 2'den az üründe "Karşılaştır" yarı saydam ve `aria-disabled`; tıklanınca nedenini söyler. |
| `progressive-disclosure` | 8 Form ve geri bildirim | uyuyor | "Kendin ayarla" kaydırıcıları, "Puan ayrıntısı", katlanır bölümler. |
| `inline-validation` | 8 Form ve geri bildirim | uygulanmaz | Doğrulanan alan yok. |
| `input-type-keyboard` | 8 Form ve geri bildirim | uyuyor | Arama `type=search`. |
| `password-toggle` | 8 Form ve geri bildirim | uygulanmaz | Parola yok. |
| `autofill-support` | 8 Form ve geri bildirim | uygulanmaz | Kişisel bilgi alanı yok (aramada `autocomplete=off` bilerek: sitenin kendi öneri listesi var). |
| `undo-support` | 8 Form ve geri bildirim | bilerek bırakıldı | `confirmation-dialogs` ile aynı gerekçe. |
| `success-feedback` | 8 Form ve geri bildirim | uyuyor | Kontrol listesinde "N / M işaretlendi" ve çubuk; karşılaştırma çubuğunda seçilen sayısı. |
| `error-recovery` | 8 Form ve geri bildirim | uyuyor | "Veri yüklenemedi" ekranında "Tekrar dene"; "Sayfa bulunamadı"da dönüş düğmesi. |
| `multi-step-progress` | 8 Form ve geri bildirim | uyuyor | Kategori sayfası numaralı 5 adım ve yapışkan adım menüsü (bulunulan adım işaretli). |
| `form-autosave` | 8 Form ve geri bildirim | uyuyor | Kontrol listesi işaretleri ve fırsat ağırlıkları tarayıcıda saklanır. |
| `sheet-dismiss-confirm` | 8 Form ve geri bildirim | uygulanmaz | Kaydedilmemiş değişiklik taşıyan pencere yok. |
| `error-clarity` | 8 Form ve geri bildirim | uyuyor | İletiler nedeni ve çıkışı söyler ("Karşılaştırma tek kategoride yapılır…"). |
| `field-grouping` | 8 Form ve geri bildirim | uyuyor | Kontrol listesi ve ağırlıklar `fieldset`/`legend`; süzgeç grupları başlıklı. |
| `read-only-distinction` | 8 Form ve geri bildirim | uygulanmaz | Salt okunur alan yok. |
| `focus-management` | 8 Form ve geri bildirim | uygulanmaz | Gönderilen form hatası yok (gezinmedeki odak 9. öncelikte, `focus-on-route-change`). |
| `error-summary` | 8 Form ve geri bildirim | uygulanmaz | Aynı neden. |
| `touch-friendly-input` | 8 Form ve geri bildirim | uyuyor | Arama kutusu telefonda 44 px üstü; seçimler 44 px (bu görev). |
| `destructive-emphasis` | 8 Form ve geri bildirim | bilerek bırakıldı | Silme düğmeleri kırmızı değil: kırmızı yalnızca şikâyet anlamında (spec'in renk kuralı). |
| `toast-accessibility` | 8 Form ve geri bildirim | uyuyor | İleti `aria-live="polite"`, odağı almaz (tek istisna: başka kategoriden ürün seçilince çıkan soru; karar gerektirdiği için "Yeni karşılaştırma başlat"a odaklanır). |
| `aria-live-errors` | 8 Form ve geri bildirim | uyuyor | "Veri yüklenemedi" `role="alert"`. |
| `contrast-feedback` | 8 Form ve geri bildirim | uyuyor | İletiler gövde yazısı renginde, 4,5:1. |
| `timeout-feedback` | 8 Form ve geri bildirim | bilerek bırakıldı | Veri isteğinde süre sınırı yok: bağlantı hiç yanıt vermezse "Yükleniyor…" kalır; hata gelirse "Tekrar dene". Dosyalar küçük; sınır koymak yavaş bağlantıda gereksiz hata gösterebilir. |
| `bottom-nav-limit` | 9 Gezinme | uygulanmaz | Alt gezinme çubuğu yok. |
| `drawer-usage` | 9 Gezinme | uyuyor | Çekmece yalnızca telefonda süzgeçler için. |
| `back-behavior` | 9 Gezinme | uyuyor | Geri tuşu önceki görünüme ve kaydırma yerine döner (`regress`). |
| `deep-linking` | 9 Gezinme | uyuyor | Her görünümün adresi var; süzgeç ve sıralama adreste. |
| `tab-bar-ios` | 9 Gezinme | uygulanmaz | Yerel uygulama değil. |
| `top-app-bar-android` | 9 Gezinme | uygulanmaz | Yerel uygulama değil. |
| `nav-label-icon` | 9 Gezinme | uyuyor | Üst çubukta yazılı bağlantı; tema düğmesi telefonda yalnızca simge, ama gezinme ögesi değil ve ekran okuyucu adı "Tema: …". |
| `nav-state-active` | 9 Gezinme | uyuyor | `#/firsat`ta üst bağlantı ve kategori sayfasında bulunulan adım işaretli (`aria-current`). |
| `nav-hierarchy` | 9 Gezinme | uyuyor | Üst çubuk (site) ve adım menüsü (sayfa içi) ayrı. |
| `modal-escape` | 9 Gezinme | uyuyor | Çekmecede "Kapat", Esc ve perde. |
| `search-accessible` | 9 Gezinme | uyuyor | Her sayfada üst çubukta; ana sayfada büyük kutu ve örnek aramalar. |
| `breadcrumb-web` | 9 Gezinme | uyuyor | İç sayfalarda kırıntı. |
| `state-preservation` | 9 Gezinme | uyuyor | Süzgeç, sıralama, açık ürün listesi ve kaydırma yeri korunur. |
| `gesture-nav-support` | 9 Gezinme | uyuyor | Tarayıcının geri/ileri hareketi adres geçmişiyle çalışır. |
| `tab-badge` | 9 Gezinme | uygulanmaz | Rozetli gezinme yok. |
| `overflow-menu` | 9 Gezinme | uyuyor | Tema seçimi tek düğmenin menüsünde. |
| `bottom-nav-top-level` | 9 Gezinme | uygulanmaz | Alt gezinme yok. |
| `adaptive-navigation` | 9 Gezinme | uygulanmaz | İçerik sitesi; yan gezinme çubuğu gerektirecek kadar üst sayfa yok. |
| `back-stack-integrity` | 9 Gezinme | bilerek bırakıldı | Tanınmayan ilk parça (ör. `#/xyz`) sessizce ana sayfaya döner (v12'den beri belgeli davranış); bilinen sayfa türünde geçersiz değer "Sayfa bulunamadı" gösterir. |
| `navigation-consistency` | 9 Gezinme | uyuyor | Üst çubuk her sayfada aynı yerde; ana sayfada üst çubuktaki arama gizli çünkü aynı kutu kahraman alanında. |
| `avoid-mixed-patterns` | 9 Gezinme | uyuyor | Tek üst çubuk, sayfa içinde adım menüsü. |
| `modal-vs-navigation` | 9 Gezinme | uyuyor | Gezinme pencere içinde değil. |
| `focus-on-route-change` | 9 Gezinme | düzeltildi | Bağlantıya tıklayınca eski sayfa silinip odak `body`ye düşüyordu; artık yeni sayfanın ana içeriğine (`#app`) taşınıyor (kaydırmadan; yalnızca odak kaybolduysa; ilk açılışta ve sayfanın kendi odakladığı bölüm varken değişmez). `arrive` takımında konu görünümü beklentisi `body` → `app`. |
| `persistent-nav` | 9 Gezinme | uyuyor | Üst çubuk yapışkan. |
| `destructive-nav-separation` | 9 Gezinme | uygulanmaz | Hesap, çıkış gibi tehlikeli gezinme yok. |
| `empty-nav-state` | 9 Gezinme | uyuyor | "Yakında" kategoriler soluk ve "Yakında" yazılı; tıklanmaz. |

