"""v21 kontrolleri: "önce cevap" yeniden tasarımı.
- Her sayfa türünde cevap cümlesi (.answer-block, data-form) var; kategori, ürün ve konu cümleleri data/*.json'dan bağımsız hesaplanan
  değerlerle birebir aynı (12 kategori, bütün ürünler, bütün şikâyet ve olumlu konular). Türkçe ekler elle yazılmış tablodan.
- Resimli oran (svg.picto): aria-label cümleyle aynı ifade ve tam yüzde ("Yaklaşık her 4 yorumdan 1'i (%25)"); 10 balonda tam pay (yarım balon dahil), 100 noktada yuvarlanmış yüzde.
- Kategori sayfası numaralı adımlar: 1 Sorun · 2 Kimde · 3 Ne yapmalı · 4 Ürünler · 5 Kontrol listesi; bölüm menüsü aynı sıra.
- Ana sayfa: üst çubuktaki arama gizli, kahraman alanındaki arama aynı davranışta (öneriler, ok tuşları, Esc, Enter); örnek aramaların adresleri.
- Başlık sırası atlamasız, kimlikler tekil, 1280 ve 375 px'te yana taşma yok, konsol temiz.

Çalıştırma: depo kökünde `python -m http.server 8765`, sonra `python tests/v21_check.py`.
Not: bu bilgisayarda Python Playwright kurulu olmadığı için v21 aynı kontrollerin Node + CDP kopyasıyla (depo dışında, headless Edge) doğrulandı;
bu dosya Playwright kurulu bir makinede çalıştırılmadı.
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, launch_kwargs
import asyncio, json, math, unicodedata, re
from playwright.async_api import async_playwright
B = BASE
SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/></svg>'
R = []
def check(name, cond, info=''):
  R.append((name, bool(cond))); print(('PASS ' if cond else 'FAIL ') + name, '' if cond else info)

async def stub(pg):
  await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
  await pg.route('**/*trendyol.com/**', lambda r: r.abort())
  await pg.route('**/fonts.g*/**', lambda r: r.abort())

def rnd(x): return math.floor(x + 0.5)  # JS Math.round (pozitif sayılar)
def pct(v, d=0):
  s = f'{v * 100:.{d}f}'.replace('.', ',')
  return '%' + s
POSS = {0: "'ı", 1: "'i", 2: "'si", 3: "'ü", 4: "'ü", 5: "'i", 6: "'sı", 7: "'si", 8: "'i", 9: "'u"}
POSS10 = {10: "'u", 20: "'si", 30: "'u", 40: "'ı", 50: "'si", 60: "'ı", 70: "'i", 80: "'i", 90: "'ı", 0: "'ü"}
def poss(s):
  m = re.search(r',(\d+)$', s); n = int(m.group(1) if m else re.sub(r'\D', '', s) or 0)
  if n % 10: return POSS[n % 10]
  if n == 0: return "'ı"
  return POSS10[n % 100]
LOC = {"'i": "'inde", "'ı": "'ında", "'u": "'unda", "'ü": "'ünde", "'si": "'sinde", "'sı": "'sında"}
def possloc(s): return LOC[poss(s)]
LOCNAME = {'termos': 'Termos bardakta', 'sweatshirt': 'Sweatshirtte', 'bluetooth-kulaklik': 'Bluetooth kulaklıkta', 'sal': 'Şalda', 'telefon-kilifi': 'Telefon kılıfında',
  'dogal-sabun': 'Doğal sabunda', 'filtre-kahve': 'Filtre kahvede', 'bebek-arabasi': 'Bebek arabasında', 'kamp-sandalyesi': 'Kamp sandalyesinde',
  'yuz-serumu': 'Yüz serumunda', 'nevresim-takimi': 'Nevresim takımında'}
# Kesir kuralı: yüzde en yakın onluktan çok 1/4, 1/3, 1/2, 2/3, 3/4'e yakınsa kesir söylenir (%25 → "yaklaşık her 4 yorumdan 1'inde")
FR = [(25, "yaklaşık her 4 yorumdan 1'inde"), (100 / 3, "yaklaşık her 3 yorumdan 1'inde"), (50, 'yorumların yaklaşık yarısında'), (200 / 3, "yaklaşık her 3 yorumdan 2'sinde"), (75, "yaklaşık her 4 yorumdan 3'ünde")]
def share(x, d=0):
  P = rnd(x * 100 * 10 ** d) / 10 ** d
  if P < 9.5: return (100, rnd(P), None)
  n = rnd(P / 10); dT = abs(P - 10 * n)
  f = min(FR, key=lambda r: abs(P - r[0]))
  return (10, n, f[1] if abs(P - f[0]) < dT else None)
def perloc(s):
  b, n, f = s
  if f: return f
  if n >= b: return 'neredeyse hepsinde'
  if not n: return "yorumların %1'inden azında"
  return f'her {b} yorumdan yaklaşık {n}{possloc(str(n))}'
def fold(s):
  s = s.lower().replace('ı', 'i').replace('İ', 'i')
  s = unicodedata.normalize('NFD', s); s = ''.join(c for c in s if not unicodedata.combining(c))
  return re.sub(r'[^a-z0-9]+', ' ', s.replace("'", '')).strip()
def short(p):
  return p['kisa'].replace('Genel Markalar', 'Markasız') if fold(p['marka']) in fold(p['kisa']) else f"{'Markasız' if p['marka'] == 'Genel Markalar' else p['marka']} {p['kisa']}"
MIN = 30

ANS = """() => { const a = document.querySelector('#app .answer-block'); return a ? { f: a.dataset.form, t: a.querySelector('.answer').innerText.replace(/\\s+/g, ' ').trim() } : null; }"""

async def sentences(pg):
  reg = [c for c in json.load(open(DATA / 'kategoriler.json', encoding='utf-8')) if c['durum'] == 'hazir']
  for r in reg:
    c = json.load(open(DATA / f"{r['id']}.json", encoding='utf-8')); P = c['urunler']
    big = [p for p in P if p['segment'] != 'KOBİ']; kobi = [p for p in P if p['segment'] == 'KOBİ']
    def w(rows, k):
      n = sum(p['ornek_dusuk'] for p in rows)
      return sum(p['sikayet'].get(k, 0) * p['ornek_dusuk'] for p in rows) / n if n else 0
    tema = sorted([dict(t, tum=w(P, t['id']), buyuk=w(big, t['id']), kobi=w(kobi, t['id'])) for t in c['temalar']], key=lambda t: -t['tum'])
    await pg.goto(B + f"#/kategori/{r['id']}"); await pg.wait_for_timeout(500)
    a = await pg.evaluate(ANS); t0 = tema[0]
    loc = LOCNAME.get(r['id'], c['ad'] + 'nda')
    exp = f"{loc} 1-2 yıldızlı {perloc(share(t0['tum']))} aynı şikâyet var: {t0['unlem'].rstrip('!')}."
    check(f"category {r['id']}", a and a['t'] == exp, f"{a} vs {exp}")
    nBig = sum(p['ornek_dusuk'] for p in big); nKobi = sum(p['ornek_dusuk'] for p in kobi)
    for t in tema:
      await pg.goto(B + f"#/kategori/{r['id']}/konu/{t['id']}"); await pg.wait_for_timeout(250)
      a = await pg.evaluate(ANS)
      tops = sorted([(p['sikayet'].get(t['id'], 0), p['ornek_dusuk'], p) for p in P if p['sikayet'].get(t['id'], 0) > 0 and p['ornek_dusuk'] >= MIN], key=lambda x: (-x[0], -x[1]))
      most = f" En sık {short(tops[0][2])} ürününde ({pct(tops[0][0])})." if tops else ''
      if not t['tum'] > 0: exp = 'Bu şikâyet okunan 1-2 yıldızlı yorumlarda geçmiyor.'
      elif big and kobi and nBig >= MIN and nKobi >= MIN:
        b, k = rnd(t['buyuk'] * 100), rnd(t['kobi'] * 100); d = b - k; hi, lo = max(b, k), min(b, k)
        nums = f"büyük markada {pct(t['buyuk'])}, KOBİ'de {pct(t['kobi'])}"
        exp = (f"Büyük marka ve KOBİ ürünlerinde benzer sıklıkta: {nums}." if abs(d) < 5 else
               f"Bu şikâyet {'büyük marka' if d > 0 else 'KOBİ'} ürünlerinde {'çok daha' if hi >= 3 * lo and abs(d) >= 10 else 'daha'} sık: {nums}.") + most
      else:
        nOn = sum(1 for p in P if p['sikayet'].get(t['id'], 0) > 0 and p['ornek_dusuk'] > 0)
        spread = f"{len(P)} ürünün {nOn}{possloc(str(nOn))} geçiyor."
        exp = (f"{spread}{most} {'Büyük marka' if nBig < MIN else 'KOBİ'} ürünlerinde yalnızca {min(nBig, nKobi)} adet 1-2 yıldızlı yorum okundu; gruplar karşılaştırılmadı."
               if big and kobi else spread + most)
      check(f"topic {r['id']}/{t['id']}", a and a['t'] == exp, f"{a} vs {exp}")

async def pages(pg, W):
  for h in ['#/', '#/kategori/filtre-kahve', '#/kategori/kedi-tirmalama', '#/kategori/filtre-kahve/konu/skt', '#/kategori/filtre-kahve/sevilen/lezzet',
            '#/urun/filtre-kahve/52915799', '#/urun/telefon-kilifi/169079728', '#/ara/karaca', '#/firsat', '#/yontem', '#/kategori/yok']:
    await pg.goto(B + h); await pg.wait_for_timeout(900)
    r = await pg.evaluate("""() => {
      const hs = [...document.querySelectorAll('#app h1,#app h2,#app h3,#app h4')].map(e => +e.tagName[1]);
      let skip = hs[0] !== 1; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skip = true;
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      // etiket "… (%25)"; 10 balonda tam dolu balon = yüzdenin onda birinin tam kısmı (artanı kırpılmış yarım balon), 100 noktada nokta = yuvarlanmış yüzde
      const pic = [...document.querySelectorAll('svg.picto')].every(s => { const l = s.getAttribute('aria-label') || ''; const m = /\\(%(\\d+(?:,\\d)?)\\)$/.exec(l); if (!m) return false;
        const P = parseFloat(m[1].replace(',', '.')), full = s.querySelector('path.on:not([clip-path])').getAttribute('d').split('M').length - 1;
        return s.classList.contains('p10') ? full === Math.floor(P / 10 + 1e-9) : full === Math.round(P); });
      return { skip, dup: ids.length !== new Set(ids).size, pic, ans: !!document.querySelector('#app .answer-block'),
        top: getComputedStyle(document.querySelector('.top .search')).display, ov: document.documentElement.scrollWidth > document.documentElement.clientWidth }; }""")
    check(f'{W} {h}: headings, ids, pictograms, overflow', not r['skip'] and not r['dup'] and r['pic'] and not r['ov'], json.dumps(r))
    check(f'{W} {h}: answer block (home: hero)', r['ans'] or h == '#/')
    check(f'{W} {h}: header search hidden only on home', (r['top'] == 'none') == (h == '#/'), r['top'])
  await pg.goto(B + '#/kategori/filtre-kahve'); await pg.wait_for_timeout(700)
  ids = await pg.evaluate("[...document.querySelectorAll('.step.jump')].map(e => e.id)")
  nav = await pg.evaluate("[...document.querySelectorAll('#secnav [data-jump]')].map(b => b.dataset.jump)")
  check(f'{W} numbered steps and nav', ids == nav == ['sec-ozet', 'sec-icgoru', 'sec-oneri', 'sec-urun', 'sec-kontrol'], f'{ids} {nav}')
  await pg.goto(B + '#/'); await pg.wait_for_timeout(900)
  chips = await pg.evaluate("[...document.querySelectorAll('.ex-chip')].map(a => a.getAttribute('href'))")
  check(f'{W} example searches', chips[0] == '#/kategori/termos' and all(c.startswith('#/ara/') for c in chips[1:]), str(chips))
  await pg.click('#hq'); await pg.keyboard.type('sızdır'); await pg.wait_for_timeout(900)
  check(f'{W} hero search suggestions', await pg.evaluate("!document.getElementById('hsuggest').hidden && document.querySelectorAll('#hsuggest li[role=option]').length > 0"))
  await pg.keyboard.press('ArrowDown')
  check(f'{W} hero search arrow key', (await pg.get_attribute('#hq', 'aria-activedescendant') or '').startswith('hsg-'))
  await pg.keyboard.press('Escape')
  await pg.fill('#hq', 'termos'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(800)
  check(f'{W} hero search Enter → category', pg.url.endswith('#/kategori/termos'), pg.url)

async def main():
  async with async_playwright() as p:
    br = await p.chromium.launch(**launch_kwargs())
    for W, H, mob in [(1280, 860, False), (375, 760, True)]:
      ctx = await br.new_context(viewport={'width': W, 'height': H}, is_mobile=mob, has_touch=mob)
      pg = await ctx.new_page(); await stub(pg)
      errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
      await pages(pg, W)
      if W == 1280: await sentences(pg)
      check(f'{W} console clean', not errs, str(errs[:3]))
      await ctx.close()
    await br.close()
  print(sum(1 for _, c in R if c), '/', len(R), 'passed')

asyncio.run(main())
