# ReviewRadar tasarım sistemi (MASTER)

Kaynak: UI UX Pro Max `--design-system` çıktısı ("b2b analytics dashboard data insights", lacivert-kehribar "veri yoğun gösterge paneli"), tasarım belgesi `docs/superpowers/specs/2026-11-21-bitirme-turu-design.md` bölüm 1'e göre uyarlandı. Sonraki işler renk, yazı ve boşluk kararlarını buradan okur. Değerlerin tek kaynağı `style.css` başındaki tema bloklarıdır; bu dosya onların açıklamasıdır.

## Renk dili (değişmez kural)

| Renk | Anlam | Nerede |
|---|---|---|
| Kırmızı (`--color-neg`) | Yalnızca şikâyet | Şikâyet oranları, şikâyet çubukları, şikâyet simgesi |
| Yeşil (`--color-like`) | Yalnızca "müşterinin sevdiği" | Sevilen konular, sevilen çubukları, olumlu alıntı çizgisi |
| Lacivert (`--color-primary`) | Yalnızca tıklanır | Bağlantı, düğme, rakam bağlantısının "›" oku, odak halkası, etkin bölüm çizgisi |
| Kehribar (`--color-accent`) | Yalnızca birincil çağrı ve yıldız | "Ara" düğmeleri, "Örnekle başla", puan yıldızı (`--color-star`) |
| Nötr (`--color-bar-n`, `--color-text*`) | Bilgi | Gövde yazısı, nötr çubuklar, rozetler, adım numaraları |

- Gövde yazısı lacivert değil, nötr koyu (`#0F172A` ailesi): lacivert metin lacivert bağlantıyla karışır.
- Kehribar şikâyet rakamlarının yanında kullanılmaz (kırmızıya yakın düşer).
- Lacivert çubuk ve rozette kullanılmaz; tıklanır anlamı korunur. Kahraman bandının lacivert zemini bir zemindir, tıklanır işareti değildir; bant içindeki bağlantılar açık mavi (`--hero-accent`).
- Ana renk, üzerine gelme tonu ve ikincil ton (`--color-secondary`) yalnızca tıklanır öğede ya da bir denetimin seçili / etkin halinde (etkin bölüm, seçili öneri, sıralanan sütun) kullanılır. İlerleme ve ölçü çubukları nötr (`--color-bar-n`), madde imleri `--color-text-muted`. Tek bilinçli istisna renk dili anahtarıdır (`.grammar`): "Lacivert tıklanır" sözcüğü ve oku rengi göstermek için lacivert. `tests/node/suites/v22.mjs` bunu denetler.
- Bileşenlerde ham renk kodu yok: bileşenler `--brand`, `--cta`, `--ink` gibi takma adları ya da `--color-*` adlarını kullanır.

## Anlam adları ve takma adlar

Her tema `:root, [data-theme="…"]` üzerinde `--color-*` adlarını tanımlar. Eski adlar tek blokta (`:root, [data-theme]`) bunlara bağlanır:

`--brand` → `--color-primary`, `--brand-hover` → `--color-primary-hover`, `--brand-ink` → `--color-on-primary`, `--brand-2` → `--color-secondary`, `--brand-soft` → `--color-primary-soft`, `--cta` → `--color-accent`, `--cta-hover` → `--color-accent-hover`, `--cta-ink` → `--color-on-accent`, `--star` → `--color-star`, `--bg` → `--color-bg`, `--panel` → `--color-surface`, `--subtle` → `--color-surface-muted`, `--band` → `--color-band`, `--ink` → `--color-text`, `--ink-2` → `--color-text-2`, `--muted` → `--color-text-muted`, `--line` → `--color-border`, `--line-2` → `--color-border-strong`, `--track` → `--color-track`, `--focus` → `--color-focus`, `--neg*` → `--color-neg*`, `--like*` → `--color-like*`, `--bar-n` → `--color-bar-n`.

Takma ad bloğu `[data-theme]` taşıyan her öğede yeniden çözülür; tema menüsündeki küçük örnekler bu sayede kendi temalarının rengini gösterir. Bant ve altbilgi renkleri (`--hero*`, `--foot*`) ve logo renkleri (`--logo-*`, Görev 3) tema bloklarında doğrudan durur. Logo: balon ve "Radar" yazısı = tema ana rengi (`--logo-bubble` = `--logo-accent`); balon içindeki simge `--logo-fg` (açık temalarda `#FFFFFF`, koyu temalarda `#0B1A33`); "Review" yazısı tema yazı rengi (`--logo-ink`). Açık, Krem, Adaçayı: `#1E40AF`, ink `#0F172A` / `#1C1917` / `#142019`. Koyu, Gece mavisi: `#93C5FD`, ink `#E8EAED` / `#E2E8F0`. Yazdırma: `#1E40AF`, simge `#FFFFFF`, ink `#0F172A`.

## Beş tema

| Rol | Açık | Krem | Adaçayı | Koyu | Gece mavisi |
|---|---|---|---|---|---|
| primary | `#1E40AF` | `#1E40AF` | `#1E40AF` | `#93C5FD` | `#93C5FD` |
| primary-hover | `#1E3A8A` | `#1E3A8A` | `#1E3A8A` | `#BFDBFE` | `#BFDBFE` |
| on-primary | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#0B1A33` | `#0B1A33` |
| secondary | `#3B82F6` | `#3B82F6` | `#3B82F6` | `#60A5FA` | `#60A5FA` |
| primary-soft | `#DBEAFE` | `#DFE6F5` | `#DCE5F3` | `#1D2B45` | `#1E3157` |
| accent | `#D97706` | `#D97706` | `#D97706` | `#F59E0B` | `#F59E0B` |
| accent-hover | `#F59E0B` | `#F59E0B` | `#F59E0B` | `#FBBF24` | `#FBBF24` |
| on-accent | `#000000` | `#000000` | `#000000` | `#000000` | `#000000` |
| star | `#D97706` | `#B45309` | `#B45309` | `#FBBF24` | `#FBBF24` |
| bg | `#F8FAFC` | `#F5F0E6` | `#ECF1EC` | `#16181D` | `#0F172A` |
| surface | `#FFFFFF` | `#FFFCF5` | `#FAFCFA` | `#1E2127` | `#1A2337` |
| surface-muted | `#E9EEF6` | `#EDE6D8` | `#E1E8E2` | `#262A31` | `#222D44` |
| band (üst çubuk) | `#FFFFFF` | `#FFFCF5` | `#FAFCFA` | `#1A1D22` | `#131B2E` |
| text | `#0F172A` | `#1C1917` | `#142019` | `#E8EAED` | `#E2E8F0` |
| text-2 | `#334155` | `#3F3A35` | `#33433A` | `#C5CAD3` | `#CBD5E1` |
| text-muted | `#475569` | `#57514A` | `#4A5950` | `#9BA3AF` | `#9AA8BC` |
| border | `#DBEAFE` | `#E6DCCB` | `#D3DED5` | `#2F343C` | `#2A3550` |
| border-strong | `#7C8BA1` | `#8C8273` | `#7F9086` | `#6B7380` | `#64748B` |
| focus | = primary | = primary | = primary | = primary | = primary |
| neg / like | v21 değerleri | v21 | v21 | v21 | v21 |
| hero (bant) | `#1E3A8A` | `#233A73` | `#1F3A68` | `#1C2740` | `#1A2D5E` |
| hero-accent | `#BFDBFE` | `#BFDBFE` | `#BFDBFE` | `#93C5FD` | `#93C5FD` |
| foot | `#0F172A` | `#26221D` | `#1D2A26` | `#101216` | `#0A1120` |

Krem sıcak, Adaçayı yeşilimsi gri zeminini korur; ana renk hepsinde lacivert ailesindendir, koyu temalarda açık mavi. Kırmızı ve yeşil aileleri v21 değerlerindedir (Açık: `#a8452f`, `#2f6b2b`).

Kontrast (otomatik, `tests/node/suites/contrast.mjs`): her temada yazı rolleri (primary, text, muted, neg, like zemin ve kart üstünde; on-primary, on-accent kendi zeminlerinde; bant ve altbilgi yazıları) en az 4,5:1; yıldız 3:1; varış vurgusu çizgisi (ana renk %80) 3:1. Ayrıca görünür yazısı olan her öğe sayfada ölçülür.

Odak halkası: 2 px `--focus`. Koyu bantlarda (kahraman, altbilgi) halka bandın açık rengini alır.

Üzerine gelme: lacivert düğme `--brand-hover` zemine geçer (açık temalarda daha koyu, koyu temalarda daha açık; `#3B82F6` beyaz yazıyla 3,7:1 kaldığı için açık temada üzerine gelme rengi olarak kullanılmaz). Kehribar düğme `--cta-hover` (daha açık kehribar, siyah yazı).

## Yazı

- Yazı tipi: **Fira Sans** (400, 500, 600, 700; `display=swap`), gövde ve başlık. Yedek: "Segoe UI", system-ui, sans-serif.
- Taban 17 px (`html { font-size: 106.25% }`), satır yüksekliği 1,6.
- Ölçek (rem, 17 px taban): etiket .76-.85 · küçük .9 · gövde 1 · alt cevap 1,12 · h3 1,05 · h2 1,25-1,3 · adım başlığı 1,6 · cevap 2,15 · ana sayfa başlığı 3,1 (en çok).
- Ağırlık: gövde 400, etiket 500-600, başlık 600-700.
- Rakamlar tablo rakamıyla (`font-variant-numeric: tabular-nums`, `.num`).

## Boşluk ve biçim

- Boşluk ölçeği: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px.
- Köşe: kart 12 px (`--r`), düğme ve alan 8 px (`--r-sm`), hap 999 px.
- Kutu içinde kutu yok; adımlar zeminde, ince çizgiyle ayrılır. Gölge yalnızca açılır menü ve alt çubukta belirgin.
- Degrade dolgu, cam efekti, kayan bant ve dikkat çeken hareket yok. `prefers-reduced-motion` uyulur.

## Skill önerilerinden bilerek alınmayanlar

| Öneri | Neden alınmadı |
|---|---|
| Başlıklarda Fira Code | Tek aralıklı başlık teknik olmayan okur için okumayı zorlaştırır; Fira Code yüklenmez. |
| Lacivert gövde yazısı (`#1E3A8A`) | Lacivert metin lacivert bağlantıyla karışır, "lacivert = tıklanır" kuralını bozar; gövde nötr koyu. |
| Müşteri logosu şeridi / kayan logo bandı | Elde gerçek karşılığı yok; uydurma bir şey gösterilmez. Kayan bant ayrıca yasak. |
| "Satışla görüşün" (contact sales), video | Satılan bir ürün ya da satış ekibi yok; site bir proje çıktısı. |
| Mor-yeşil "canlı, blok tabanlı" sistem | Genç ve eğlence ürünlerine göre; yeşil vurgu "müşterinin sevdiği" yeşiliyle karışır. |
