# ReviewRadar v22 Finishing Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give ReviewRadar a new visual identity (navy, amber call-to-action, Fira Sans), make its phone pages much shorter, and close the gaps found in the live audit, without changing any number, address or behaviour.

**Architecture:** The site is a static, hash-routed single page (`index.html`, `app.js`, `style.css`, `data/*.json`) with no build step. Colours already flow through CSS custom properties per theme, so the identity change is a token layer plus font and logo; the phone work is markup and CSS in existing render functions. A Node + Chrome DevTools Protocol test harness, driving the installed Edge with one browser instance, moves into the repo first and gates every later task.

**Tech Stack:** Plain HTML/CSS/JS (ES2020), Node 18+ for tests (no npm packages), Microsoft Edge (installed), Python 3 only for `python -m http.server` fallback. UI text is Turkish.

**Spec:** `docs/superpowers/specs/2026-11-21-bitirme-turu-design.md` (Turkish). Read it and `PROJE_NOTLARI.md` ("Site", "Tasarım kararları", v17-v21) and `DEMO.md` before any task.

## Global Constraints

- No number, rate, quote or calculation method changes. `data/` and `tools/` are never edited. Nothing is invented (no testimonials, client logos, user counts).
- Static site only: no libraries, frameworks, build step or server code.
- Every address in `DEMO.md` and `PROJE_NOTLARI.md` keeps working, including filters and sort in the address and "Sayfa bulunamadı" for invalid ones.
- All v17-v21 behaviour keeps working: topic views and their sum tables, product-at-topic, recommendation evidence links, search, rival card, checklist persistence, print (category report and `#/firsat`), `tip()` explanations, arrival highlight, compare rules (max 4, one category), scroll restoration, mobile filter drawer accessibility.
- Colour meaning: red = complaint only, green = "what customers like" only, primary navy = clickable only, amber = primary call-to-action and the star only.
- Five themes (Açık, Krem, Adaçayı, Koyu, Gece mavisi) plus Sistem; text contrast at least 4.5:1 in all five; visible focus ring on every interactive element.
- `prefers-reduced-motion` respected. No glass effects, gradient fills, marquees or attention-seeking motion.
- Turkish copy: plain, short, seller's point of view, sentence-case headings, no em dashes, no emoji. Terms stay "1-2 yıldız payı" (star share) and "şikâyet oranı" (topic rate).
- Phone breakpoint: `max-width: 640px` (the one the site already uses for `#/firsat`). "Screen" = `scrollHeight / 812` at a 375×812 viewport.
- Automated browser checks use ONE browser instance per run and delete their temporary profile afterwards.
- `?v=` in `index.html` is `22` when the work is done (bump once, in Task 2).
- Commit locally after every task; never push.

## Review Focus

1. **Deep link into folded content.** Opening `#/kategori/<id>?tip=kobi`, `#/yontem/oran`, or following an in-site link whose arrival-highlight target sits inside a folded block on a phone: the block must open and the target must be visible and highlighted. (Tests in Tasks 4 and 5.)
2. **Stored state meets new markup.** A browser that already holds `rr_ck_<id>` ticks or an old `rr_theme` value (`light`, `dark`, `acik`, `krem`, `adacayi`, `koyu`, `gece`) must show the ticks (checklist opens, progress correct) and the mapped theme. (Tests in Tasks 2 and 4.)
3. **Photo never arrives.** Image host blocked or offline: a neutral placeholder holds the same box, no layout shift, no broken-image icon, text still readable. (Test in Task 7.)
4. **Find-in-page and print with folded blocks.** Ctrl+F must find text inside folded blocks (they open), and print must output every folded block open. (Tests in Tasks 4 and 5.)
5. **Small or one-sided categories in the new layouts.** `kedi-tirmalama` (one segment), `telefon-kilifi` (tiny big-brand sample), a filter that leaves 0-4 products: the folded product list must not show a "show all (0)" control or an empty state that looks broken. (Test in Task 4.)

---

## File Structure

| File | Responsibility |
|---|---|
| `tests/node/lib/driver.mjs` | Launch one headless Edge, open pages, evaluate, click, screenshot, PDF. From `.onizleme/kontrol-yedek/cdp.mjs`. |
| `tests/node/lib/server.mjs` | Start and stop a static server for the repo root. |
| `tests/node/run.mjs` | Runner: server + one browser + all suites, summary, cleanup, exit code. |
| `tests/node/suites/*.mjs` | One suite per concern (chain, regress, arrive, sentences, v21, contrast, print, smoke, measure, v22). |
| `tests/node/README.md` | How to run; what each suite covers. |
| `style.css` | Token layer (new), themes, components. |
| `index.html` | Font link, `?v=22`, theme bootstrap, logo colours via tokens. |
| `app.js` | Render functions: `home`, `category`, `checklist`, `product`, `firsat`, `method`, `arrivalFor`. |
| `logo/*`, `favicon.svg` | Recoloured brand assets. |
| `design-system/reviewradar/MASTER.md` | The adopted design system, adapted from the skill output. |
| `docs/superpowers/specs/2026-11-21-kural-denetimi.md` | Rule-by-rule audit table. |
| `PROJE_NOTLARI.md`, `DEMO.md` | Updated decisions and demo screens. |

---

### Task 1: Test harness in the repo, green on v21

**Files:**
- Create: `tests/node/lib/driver.mjs`, `tests/node/lib/server.mjs`, `tests/node/run.mjs`, `tests/node/suites/{chain,regress,arrive,sentences,v21,contrast,print,smoke,measure}.mjs`, `tests/node/README.md`
- Modify: `tests/README.md` (point to `tests/node/`), `.gitignore` (add `tests/node/out/`)
- Source material (read, do not delete): `.onizleme/kontrol-yedek/*.mjs`

**Interfaces:**
- Produces:
  - `driver.mjs`: `launch({ realImages = false } = {}) → Promise<Browser>`; `Browser.page({ width = 1280, height = 900, mobile = false, scheme = null }) → Promise<Page>`; `Browser.close()` kills Edge and deletes its temp profile. `Page` keeps the methods of the old `cdp.mjs` (`goto, hash, eval, click, mclick, key, back, fwd, shot, pdf, media, scheme, size, close, errors, logs`).
  - `server.mjs`: `startServer(rootDir) → Promise<{ url: string, stop(): Promise<void> }>` on a free port, serving `rootDir` with correct MIME types (Node `http`, no Python dependency).
  - Suite contract: each suite file `export default async function ({ browser, base, check, out })`, where `check(name: string, ok: boolean, info?: string)` records a result and `out` is `tests/node/out/`.
  - Runner: `node tests/node/run.mjs [suiteName ...] [--real-images]`; env `RR_BASE` overrides the local server (e.g. the live site). Prints `PASS`/`FAIL` lines, then `N passed, M failed`; exit code 1 if any failed. Always closes the browser and server, also on error.
  - `measure.mjs` suite writes `tests/node/out/olcum.json`: `{ [route]: { desktop: screens, phone: screens } }` for `#/`, `#/kategori/filtre-kahve`, `#/kategori/termos`, `#/urun/filtre-kahve/52915799`, `#/firsat`, `#/yontem`, and prints the table. It records, it does not fail.

- [ ] **Step 1: Write `tests/node/suites/smoke.mjs` against the suite contract** (every route type at 1280 and 375, console clean, `document.documentElement.scrollWidth <= innerWidth`), taken from `.onizleme/kontrol-yedek/smoke.mjs`.
- [ ] **Step 2: Run `node tests/node/run.mjs smoke`.** Expected: fails with "Cannot find module" for `run.mjs`.
- [ ] **Step 3: Write `lib/driver.mjs`, `lib/server.mjs`, `run.mjs`** to the interfaces above. `launch` must be called once per run; the old per-script `launch()` calls go away. `realImages: false` keeps the old stub (Trendyol image requests answered with a placeholder SVG); `true` skips `Fetch.enable`.
- [ ] **Step 4: Run `node tests/node/run.mjs smoke`.** Expected: all PASS, `0 failed`, and afterwards no `msedge.exe` process with `--headless` remains (`tasklist | findstr msedge` shows only the user's own).
- [ ] **Step 5: Port the remaining suites** from the backup, one file each, to the suite contract: `chain` ← `verify.mjs`, `regress` ← `regress.mjs`, `arrive` ← `v20.mjs` + `mycheck.mjs`, `sentences` ← `sent21.mjs`, `v21` ← `full21.mjs` + `a21.mjs`, `contrast` ← `contrast21.mjs`, `print` ← `printshot.mjs`/`prt.mjs`, `measure` ← `audit.mjs`. Keep every existing assertion; change only how the page is obtained.
- [ ] **Step 6: Run `node tests/node/run.mjs`.** Expected: `0 failed` on unchanged v21 code. If a ported check fails on v21, fix the port, not the site, unless the failure reproduces by hand; report any real site bug instead of editing around it.
- [ ] **Step 7: Run `node tests/node/run.mjs measure --real-images`** and paste the printed table into `tests/node/README.md` under "v21 ölçümü" (baseline for Tasks 4-5).
- [ ] **Step 8: Commit** (`tests: Node kontrol takımı depoda, tek tarayıcı, tek komut`).

---

### Task 2: New identity: tokens, themes, font

**Files:**
- Modify: `style.css` (theme blocks at the top, lines 1-80, and any raw colour in components), `index.html` (font link, `theme-color` metas, `?v=22`, theme bootstrap list unchanged), `app.js` (only if a colour is hard-coded: `flashArrive` reads `--brand`)
- Create: `design-system/reviewradar/MASTER.md`, `tests/node/suites/v22.mjs`
- Modify: `tests/node/suites/contrast.mjs` (new expected roles)

**Interfaces:**
- Produces semantic tokens defined per theme on `:root, [data-theme="…"]`:
  `--color-primary`, `--color-primary-hover`, `--color-on-primary`, `--color-accent`, `--color-on-accent`, `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-neg`, `--color-like`, `--color-focus`.
- The existing variables stay as aliases in one block (`--brand: var(--color-primary)`, `--brand-ink: var(--color-on-primary)`, `--bg: var(--color-bg)`, `--panel: var(--color-surface)`, `--ink: var(--color-text)`, `--muted: var(--color-text-muted)`, `--line: var(--color-border)`, `--neg: var(--color-neg)`, `--like: var(--color-like)`, `--focus: var(--color-focus)`), so component rules are not rewritten wholesale. New token `--cta: var(--color-accent)` / `--cta-ink: var(--color-on-accent)` for the primary call-to-action.
- `--font: "Fira Sans", "Segoe UI", system-ui, sans-serif`.

Açık theme values fixed by the spec: primary `#1E40AF`, primary-hover `#3B82F6` (use only where contrast allows; otherwise a darker hover), on-primary `#FFFFFF`, accent `#D97706`, on-accent `#000000`, bg `#F8FAFC`, surface `#FFFFFF`, text `#0F172A`, border `#DBEAFE`, muted surface `#E9EEF6`. Red and green families keep their v21 values. The other four themes are derived by the implementer: Krem keeps a warm ground, Adaçayı a green-grey ground, Koyu and Gece mavisi dark grounds with a light blue primary; each must pass the contrast suite.

- [ ] **Step 1: Write the failing checks in `tests/node/suites/v22.mjs`:**
  - `kimlik: açık temada ana renk` → `getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim().toLowerCase() === '#1e40af'`
  - `kimlik: yazı tipi Fira Sans` → `getComputedStyle(document.body).fontFamily` starts with `"Fira Sans"` (or `Fira Sans`)
  - `kimlik: Ara düğmesi kehribar` → on `#/`, the hero search submit button's computed background equals the resolved `--color-accent`
  - `kimlik: bağlantı lacivert, gövde yazısı değil` → on `#/kategori/termos`, a `.klik`-style evidence link colour equals resolved `--color-primary`, and `body` colour does not
  - `kimlik: kırmızı ve yeşil yerinde` → resolved `--neg` and `--like` in Açık equal their v21 values (`#a8452f`, `#2f6b2b`)
  - `tema: eski kayıtlar` → for each of `light, dark, acik, krem, adacayi, koyu, gece`: set `localStorage.rr_theme`, reload, `document.documentElement.dataset.theme` is `acik, koyu, acik, krem, adacayi, koyu, gece` respectively
  - `sürüm: ?v=22` → `document.querySelector('script[src*="app.js"]').src` ends with `v=22`
- [ ] **Step 2: Run `node tests/node/run.mjs v22`.** Expected: the identity and version checks FAIL, the theme-mapping check PASSES (it pins existing behaviour).
- [ ] **Step 3: Implement** the token layer and five themes in `style.css`, the alias block, the Fira Sans link in `index.html` (weights 400, 500, 600, 700, `display=swap`), `theme-color` metas, `?v=22`. Replace raw hex colours in component rules with tokens. Remove the v21 "turkuaz = tıklanır" wording in comments and in the home legend text (`Turkuaz tıklanır` becomes `Lacivert tıklanır`), and update the matching sentence in the Yöntem page.
- [ ] **Step 4: Update `tests/node/suites/contrast.mjs`** expected roles (primary on bg/surface, on-primary on primary, on-accent on accent, text and muted text on bg/surface, neg and like on bg/surface) for all five themes at 4.5:1; arrival-highlight outline at 3:1.
- [ ] **Step 5: Run `node tests/node/run.mjs`.** Expected: `0 failed`. Checks in older suites that asserted turquoise values are updated to read the token instead of a literal.
- [ ] **Step 6: Write `design-system/reviewradar/MASTER.md`:** the adopted roles and values for all five themes, type scale, spacing scale, the colour-meaning rule, and the list of skill suggestions deliberately not taken (Fira Code headings, navy body text, logo carousel, "contact sales") with the reason from the spec.
- [ ] **Step 7: Commit** (`v22: yeni kimlik (lacivert, kehribar çağrı, Fira Sans), beş tema`).

---

### Task 3: Logo, favicon and share image in the new colour

**Files:**
- Modify: `logo/reviewradar_ikon.svg`, `logo/reviewradar_logo_acik.svg`, `logo/reviewradar_logo_koyu.svg`, `logo/reviewradar_logo_seffaf.svg`, `favicon.svg`, `style.css` (`--logo-bubble`, `--logo-accent`, `--logo-ink`, `--logo-fg` per theme)
- Regenerate: the four `logo/*.png` files at their current pixel sizes (headless Edge screenshot of the SVG on a transparent or matching ground; one-off script under `tests/node/tools/logo-png.mjs`)
- Modify: `tests/node/suites/v22.mjs`

**Interfaces:**
- Consumes: `--color-primary` from Task 2; `launch` from Task 1.
- Produces: logo shape unchanged; bubble and the word "Radar" in the primary colour of the theme.

- [ ] **Step 1: Add failing checks:** `logo: balon ana renkte` → inline header logo's bubble path computed fill equals resolved `--logo-bubble`, and `--logo-bubble` in Açık is `#1e40af`; `logo: dosyalarda turkuaz kalmadı` → none of `logo/*.svg` and `favicon.svg` (fetched as text) contains `14b8a6`, `0d9488`, `2dd4bf` or `0d8a7f`; `logo: og görseli yükleniyor` → `logo/reviewradar_logo_acik.png` responds 200 with `naturalWidth === 2166`.
- [ ] **Step 2: Run `node tests/node/run.mjs v22`.** Expected: the two colour checks FAIL.
- [ ] **Step 3: Recolour** the SVG files and the per-theme logo tokens; regenerate the PNG files at identical dimensions with `tests/node/tools/logo-png.mjs`.
- [ ] **Step 4: Run `node tests/node/run.mjs v22 contrast`.** Expected: PASS.
- [ ] **Step 5: Commit** (`v22: logo ve favicon yeni renkte`).

---

### Task 4: Category page on a phone: product rows, folded checklist

**Files:**
- Modify: `app.js` (`category` ~line 867, `checklist` ~711, `ckSync` ~723, `arrivalFor` ~1100, the liked-topics block inside `category`), `style.css`
- Modify: `tests/node/suites/v22.mjs`, `tests/node/suites/print.mjs`

**Interfaces:**
- Consumes: Task 1 `measure` baseline.
- Produces (phone only, `max-width: 640px`; desktop unchanged):
  - Product list in step 4: each product a horizontal row card (photo left about 64×84, uncropped; name, rating, 1-2 yıldız payı, top complaint right). First 4 rows visible; the rest inside a container with `hidden="until-found"` and a button `#p-more` (`aria-expanded`, `aria-controls`, label `Tüm ürünleri göster (N)` / `Daha az göster`), where N is the total count after filters.
  - The list renders fully open, with no `#p-more`, when the address has any filter or sort query, or when 4 or fewer products remain.
  - Checklist (step 5): wrapped in `<details id="ck-fold">` whose `<summary>` shows the step heading and the `N / M işaretlendi` count; closed by default on phones, open on desktop and whenever any tick is stored.
  - "Müşteriler neyi seviyor?": first 4 rows, rest behind `#like-more` with the same pattern.
  - Shared helper `openFoldFor(el: Element): void` in `app.js`: opens every ancestor `<details>` and reveals every ancestor `[hidden="until-found"]` of `el`; `arrive()` calls it before `ensureVisible`. Task 5 reuses it.

- [ ] **Step 1: Write the failing checks (375×812 unless stated):**
  - `telefon: ürünler satır kart` → on `#/kategori/filtre-kahve`, first product card's bounding height `< 140` and its image width `<= 80`
  - `telefon: ilk 4 ürün, kalanı kapalı` → 4 product cards visible (`getClientRects().length > 0`), `#p-more` text is `Tüm ürünleri göster (13)`, `aria-expanded="false"`
  - `telefon: tümünü göster açar` → click `#p-more`; 13 cards visible; `aria-expanded="true"`
  - `telefon: süzgeçli adres açık gelir` → `#/kategori/filtre-kahve?sirala=cok&tip=kobi`: 7 cards visible, no `#p-more`
  - `telefon: 4 ve altı üründe düğme yok` → `#/kategori/kedi-tirmalama?dusuk=1` (or the first filter value that leaves ≤ 4 products; compute from data in the test): all visible, no `#p-more`, no element with text `(0)`
  - `telefon: kontrol listesi kapalı, sayaç görünür` → `#ck-fold` not `open`, its summary contains `0 / 11 işaretlendi`
  - `telefon: işaret varsa açık gelir` → set `localStorage.rr_ck_termos = '["t:isi"]'`, open `#/kategori/termos`: `#ck-fold.open === true`, summary contains `1 / 11`
  - `telefon: varış vurgusu kapalı bölümü açar` → from `#/urun/filtre-kahve/52915799` click "← Filtre kahve: tüm ürünler" after applying a filter in session, or open `#/kategori/filtre-kahve?tip=kobi` directly: the `[data-arriving]` element is visible in the viewport
  - `masaüstü: ızgara ve açık liste değişmedi` (1280) → 13 cards visible, no `#p-more`, `#ck-fold.open === true`
  - `yazdırma: kapalı bölümler açık basılır` (in `print.mjs`, phone width, print media) → all 13 products in the print table and all 11 checklist items have layout boxes
  - `sayfa içi arama` → the hidden container has attribute `hidden="until-found"` (so Ctrl+F reveals it); dispatching a `beforematch` event on it sets `#p-more[aria-expanded="true"]`
  - `ölçüm: kategori telefonda kısaldı` → `scrollHeight / 812` for `#/kategori/filtre-kahve` is recorded and is less than half of the v21 baseline from Task 1; print the number (target from the spec: at most 8; report if not reached, do not cut steps 1-3)
- [ ] **Step 2: Run `node tests/node/run.mjs v22 print`.** Expected: the new checks FAIL.
- [ ] **Step 3: Implement** in `category`, `checklist`, `ckSync`, the liked block, `openFoldFor`, and CSS. Steps 1-3 of the page (Sorun, Kimde, Ne yapmalı) and the lead sentence with its pictogram stay open and present; they may only be tightened visually (spacing, row height, pictogram size).
- [ ] **Step 4: Run `node tests/node/run.mjs`.** Expected: `0 failed`.
- [ ] **Step 5: Commit** (`v22: telefonda kategori sayfası kısaldı (satır kartlar, kapalı kontrol listesi)`).

---

### Task 5: Yöntem and Fırsat on a phone

**Files:**
- Modify: `app.js` (`method` ~line 1702, `firsat` ~1497, route handling of `#/yontem/<bölüm>` ~1263-1300), `style.css`
- Modify: `tests/node/suites/v22.mjs`, `tests/node/suites/print.mjs`

**Interfaces:**
- Consumes: `openFoldFor` from Task 4.
- Produces:
  - Yöntem: a table of contents `<nav id="m-toc" aria-label="Bu sayfada">` listing every section as a link to `#/yontem/<bölüm>`. Each section is `<details class="m-sec" id="m-<bölüm>">` with its heading in `<summary>`; all open at widths above 640px, all closed on phones except the one named in the address.
  - Fırsat on phones: the top-three cards stay; below them every category is a compact row (rank, name, giriş puanı, 1-2 yıldız payı) inside `<details class="fz-row">` whose body holds the existing card detail (segment shares, top complaint, big-brand review share, "Puan ayrıntısı"). Sort select, direction button, presets and filters unchanged.

- [ ] **Step 1: Write the failing checks (375×812 unless stated):**
  - `yöntem: içindekiler` → `#m-toc a` count equals the number of `.m-sec`; every `href` matches `^#/yontem/[a-z-]+$`
  - `yöntem: telefonda bölümler kapalı` → on `#/yontem`, no `.m-sec[open]`
  - `yöntem: adresteki bölüm açık ve vurgulu` → on `#/yontem/oran`, `#m-oran[open]`, its heading within the viewport, and it carried `data-arriving`
  - `yöntem: içindekilerden tıklayınca açılır` → click the `#m-toc` link for `alinti`; `location.hash === '#/yontem/alinti'` and `#m-alinti[open]`
  - `yöntem: masaüstünde hepsi açık` (1280) → every `.m-sec` is `open`
  - `fırsat: telefonda kısa satırlar` → 12 `.fz-row`, none `open`; first row text contains the category name and its score
  - `fırsat: satır açılınca ayrıntı` → open the first row; "Puan ayrıntısı" control is visible inside it
  - `fırsat: sıralama korunur` → change the sort select to 1-2 yıldız payı; the first row's category changes accordingly (compare with the order computed from the page's own data)
  - `yazdırma: yöntem ve fırsat açık basılır` (`print.mjs`) → every `.m-sec` body and the full `#/firsat` table have layout boxes in print media at phone width
  - `ölçüm` → `scrollHeight / 812` for `#/yontem` and `#/firsat` recorded; spec target at most 5 each, report the numbers
- [ ] **Step 2: Run `node tests/node/run.mjs v22 print`.** Expected: new checks FAIL.
- [ ] **Step 3: Implement.** `<details>` cannot be forced open by CSS: set `open` from JS using `matchMedia('(max-width: 640px)')`, and update on its `change` event. In print, open all with a `beforeprint` handler and restore on `afterprint`.
- [ ] **Step 4: Run `node tests/node/run.mjs`.** Expected: `0 failed`. Existing `tip()` links to `#/yontem/<bölüm>` and the `arrive` suite must still pass.
- [ ] **Step 5: Commit** (`v22: Yöntem içindekiler ve katlanır bölümler, fırsat telefonda kısa satırlar`).

---

### Task 6: Home cards with visible photos, product star bar

**Files:**
- Modify: `app.js` (`home` ~line 547 and its card template ~509, `product` ~1248), `style.css`
- Modify: `tests/node/suites/v22.mjs`

**Interfaces:**
- Produces:
  - Home category card: photo in a portrait box on the left, 96×128 px on desktop and 72×96 px on phones, `object-fit: contain`, `width`/`height` attributes set; the card title remains the number-one complaint.
  - Product page: the "Yıldız dağılımı" card is removed; a single stacked bar `div.stars-bar` with five segments (5 to 1 star, widths = shares) and a text line of the five percentages sits inside the verdict block. It has `role="img"` and an `aria-label` listing the five percentages.

- [ ] **Step 1: Write the failing checks:**
  - `ana sayfa: fotoğraf kutusu` → at 1280 the first card image's rendered box is 96×128 (±1); at 375 it is 72×96 (±1); `objectFit === 'contain'`
  - `ana sayfa: kart başlığı şikâyet` → first card's heading text equals the category's top complaint wording used in v21 (`Isıyı tutmuyor` for termos)
  - `ürün: yıldız çubuğu` → on `#/urun/termos/780345921`, `.stars-bar` has 5 segments whose widths sum to the bar width (±2px) and whose percentages equal `yildiz[i] / yazili` from `data/termos.json` rounded as on screen; no heading `Yıldız dağılımı` remains
  - `ürün: çubuğun metin karşılığı` → `.stars-bar` `aria-label` contains all five percentages
- [ ] **Step 2: Run `node tests/node/run.mjs v22`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `node tests/node/run.mjs`.** Expected: `0 failed`.
- [ ] **Step 5: Commit** (`v22: ana sayfada görünür fotoğraflar, ürün sayfasında yıldız çubuğu`).

---

### Task 7: Resilience: missing photos, late font, no layout shift

**Files:**
- Modify: `app.js` (image error handling; one shared `onerror` path), `style.css` (`@font-face` fallback metrics, placeholder), `index.html` (font preload if needed)
- Modify: `tests/node/suites/v22.mjs`

**Interfaces:**
- Produces: every product and category `<img>` sits in a box with fixed aspect; on `error` the image is replaced by `span.img-ph` (inline SVG product icon, `aria-hidden`), same box. A local fallback face `"Fira Sans Fallback"` (`src: local("Segoe UI"), local("Arial")`) with `size-adjust`/`ascent-override` tuned to Fira Sans, listed after `"Fira Sans"` in `--font`.

- [ ] **Step 1: Write the failing checks** (page opened with image requests failed via `Fetch.failRequest` for `*dsmcdn.com*`, and separately with `fonts.gstatic.com` blocked):
  - `fotoğraf yok: yer tutucu` → on `#/` and `#/kategori/termos`, every image box contains `.img-ph`, no `<img>` with `naturalWidth === 0` is visible
  - `fotoğraf yok: kutu aynı` → each card's bounding height equals its height in the normal run (±1px)
  - `fotoğraf yok: konsol temiz` → no uncaught exception
  - `yazı tipi yok: sayfa okunur` → `document.fonts.check('1rem "Fira Sans"') === false` and the lead sentence has a non-zero box; line count of the lead sentence differs by at most 1 from the normal run
  - `kayma yok` → `PerformanceObserver` layout-shift sum over the first 4 seconds of `#/` and `#/kategori/termos` is `< 0.1` at both widths, with real images
- [ ] **Step 2: Run `node tests/node/run.mjs v22 --real-images`.** Expected: placeholder checks FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `node tests/node/run.mjs` and `node tests/node/run.mjs v22 --real-images`.** Expected: `0 failed` in both.
- [ ] **Step 5: Commit** (`v22: fotoğraf ve yazı tipi gelmediğinde sayfa bozulmuyor`).

---

### Task 8: Copy pass over interface text

**Files:**
- Modify: `app.js`, `index.html` (strings only)
- Create: `docs/superpowers/specs/2026-11-21-metin-degisiklikleri.md`
- Modify: `tests/node/suites/sentences.mjs` only if a template's wording changes

**Interfaces:**
- Consumes: sentence templates `catAnswer`, `segAnswer`, `topicAnswer`, `prodVerdict` (app.js ~174-250).

- [ ] **Step 1: Read every user-visible string in `app.js` and `index.html`** and list problems against the Global Constraints (term mixing, em dashes, long sentences, typos, title-case headings, leftover "turkuaz").
- [ ] **Step 2: Add checks to `v22.mjs`:** `metin: uzun tire yok` → `document.body.innerText` on each of the 11 route types contains no `—`; `metin: terimler` → no occurrence of `1-2 yıldız oranı` or `şikâyet payı` on any route; `metin: turkuaz kalmadı` → no `Turkuaz`/`turkuaz` on any route.
- [ ] **Step 3: Run `node tests/node/run.mjs v22`.** Record which fail.
- [ ] **Step 4: Fix the strings.** No change of meaning; no change to any figure or to which figures a sentence cites. Strings inside `data/*.json` are out of scope.
- [ ] **Step 5: Write `2026-11-21-metin-degisiklikleri.md`:** a table of every change (where, before, after, why).
- [ ] **Step 6: Run `node tests/node/run.mjs`.** Expected: `0 failed`, including `sentences`.
- [ ] **Step 7: Commit** (`v22: arayüz metinleri okuması`).

---

### Task 9: Rule audit against UI UX Pro Max, and fixes

**Files:**
- Read: `C:\Users\yskir\.claude\skills\ui-ux-pro-max\references\quick-reference.md` (priorities 1-9), `references/pro-rules.md` (pre-delivery checklist)
- Create: `docs/superpowers/specs/2026-11-21-kural-denetimi.md`
- Modify: `style.css`, `app.js` as the audit requires; `tests/node/suites/v22.mjs`

**Interfaces:**
- Produces the audit table with columns `Kural | Öncelik | Durum (uyuyor / düzeltildi / uygulanmaz / bilerek bırakıldı) | Not`. Every rule in priorities 1-9 has a row. Rules for native apps, bottom tab bars and GSAP are `uygulanmaz` with one line of reason.

- [ ] **Step 1: Write checks for the measurable rules:**
  - `dokunma: 44 px` → at 375, every visible `a, button, summary, input, select, label[for]` inside `#app` and the header has a hit box of at least 44×44 (count padding and `::after` hit areas via `getBoundingClientRect` of the element or its pseudo-area wrapper), or sits in a text paragraph as an inline link; list offenders by selector
  - `dokunma: aralık` → no two separate targets closer than 8px vertically in the section nav, filter panel and chip rows
  - `odak: her etkileşimli ögede görünür` → tabbing through `#/`, `#/kategori/termos`, `#/urun/termos/780345921`, `#/firsat`: every focused element has a non-`none` outline or box-shadow
  - `yazı: en küçük boyut` → no visible text in `#app` below 12px computed size
  - `yıldız: kontrast` → the ★ colour reaches 3:1 against its ground in all five themes
  - `hareket: azaltılmış` → with `prefers-reduced-motion: reduce`, `document.getAnimations()` after navigation contains no running animation longer than the arrival highlight's static hold
  - `imleç` → every `a[href]`, `button`, `summary` has `cursor: pointer`
- [ ] **Step 2: Run `node tests/node/run.mjs v22`.** Record failures (known: 32-36px targets, 20px "?" buttons, ★ contrast).
- [ ] **Step 3: Fix** what fails; where a rule is knowingly not met, the check lists that selector in an explicit allow-list with the reason, and the audit row says `bilerek bırakıldı`.
- [ ] **Step 4: Walk the remaining (non-measurable) rules** in priorities 1-9 against the site and fill the table.
- [ ] **Step 5: Run `node tests/node/run.mjs`.** Expected: `0 failed`.
- [ ] **Step 6: Commit** (`v22: UI UX Pro Max kural denetimi ve düzeltmeler`).

---

### Task 10: Final verification, screenshots, documents

**Files:**
- Create: `.onizleme/v22/*.png` (not committed), `tests/node/tools/shots.mjs`
- Modify: `PROJE_NOTLARI.md`, `DEMO.md`, `tests/node/README.md`, `tests/README.md`

**Interfaces:**
- Consumes everything above.

- [ ] **Step 1: Write `tests/node/tools/shots.mjs`:** with `--real-images`, screenshot (top of page and full page) every route type (home, category, topic, liked topic, product, product at topic, compare with two products, search results, fırsat, yöntem, not-found) at 1280 and 375 in Açık and Koyu, plus home and category in Krem, Adaçayı and Gece mavisi, into `.onizleme/v22/` with names `<no>-<sayfa>-<genişlik>-<tema>[-tam].png`.
- [ ] **Step 2: Run it against the local build** and look at every image. Fix what looks wrong (wrapping, clipped text, cramped rows, unreadable contrast, photo boxes), re-run the full suite after each fix.
- [ ] **Step 3: Run `node tests/node/run.mjs` and `node tests/node/run.mjs v22 measure --real-images`.** Expected: `0 failed`; paste the new measure table under "v22 ölçümü" in `tests/node/README.md` next to the v21 baseline.
- [ ] **Step 4: Walk `DEMO.md`** step by step in the `arrive` suite's demo chain at both widths (already automated) and by reading the screenshots; update `DEMO.md` wherever the screen now shows something different (colours named, folded blocks, star bar). Addresses must not change.
- [ ] **Step 5: Update `PROJE_NOTLARI.md`:** header and handover note (v22), "Site" (what changed), "Tasarım kararları" (new identity; turquoise and IBM Plex replaced at the owner's request; colour-meaning rule; phone folding rules; test command).
- [ ] **Step 6: Commit** (`v22: son doğrulama, belgeler`).
- [ ] **Step 7: Confirm cleanup:** no headless Edge process left; no `rr-edge-*` folder left in the system temp folder.
