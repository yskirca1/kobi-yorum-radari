"""v18 kontrolleri: gruplu arama (kategori, ürün/marka, şikâyet konusu), rakip kartı (bütün ürünlerde bağımsız hesapla
karşılaştırma), giriş kontrol listesi (kalıcılık, sıfırlama, depolama kapalıyken, yazdırma), telefonda başlık satırı.

Çalıştırma: depo kökünde `python -m http.server 8765`, sonra `python tests/v18_check.py`.
Not: bu bilgisayarda Python Playwright kurulu olmadığı için v18 aynı kontrollerin Node + CDP kopyasıyla (depo dışında) doğrulandı.
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio, json, math, re
from playwright.async_api import async_playwright
B = BASE
SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/></svg>'
REG = json.load(open(DATA / 'kategoriler.json', encoding='utf-8'))
READY = [c for c in REG if c.get('durum') == 'hazir']
R = []
def check(name, cond, info=''):
  R.append((name, bool(cond))); print(('PASS ' if cond else 'FAIL ') + name, info)

async def stub(pg):
  await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
  await pg.route('**/fonts.g*/**', lambda r: r.abort())

# Rakip kartının kuralları (app.js GAP ile aynı; bağımsız yazıldı)
def expected_gap(cat):
  P = cat['urunler']; N = sum(p['ornek_dusuk'] for p in P)
  avg = {t['id']: sum(p['sikayet'].get(t['id'], 0) * p['ornek_dusuk'] for p in P) / N for t in cat['temalar']}
  out = {}
  for p in P:
    n = p['ornek_dusuk']
    if n == 0: out[p['id']] = 'none-card'; continue
    if n < 30: out[p['id']] = 'small'; continue
    W, Bt = [], []
    for t in cat['temalar']:
      v = p['sikayet'].get(t['id'], 0); a = avg[t['id']]; z = (v - a) / math.sqrt(max(a * (1 - a), 1e-4) / n)
      if v - a >= 0.1 - 1e-9 and v >= 1.5 * a and round(v * n) >= 5 and z >= 2: W.append((t['ad'], v - a))
      elif a - v >= 0.1 - 1e-9 and v <= a / 2 and z <= -2: Bt.append((t['ad'], a - v))
    s = lambda L: '|'.join(x[0] for x in sorted(L, key=lambda x: -x[1])[:3])
    out[p['id']] = f'W:{s(W)} B:{s(Bt)}' if W or Bt else 'nodiff'
  return out

GOT = """(()=>{const c=document.querySelector('.gp-card'); if(!c) return 'none-card'; const t=c.innerText;
  if(/en az 30 gerekiyor/.test(t)) return 'small'; if(/Hiçbir konuda/.test(t)) return 'nodiff';
  const col=(i)=>[...c.querySelectorAll('.gp-col')[i].querySelectorAll('.gp-t')].map(e=>e.innerText).join('|'); return 'W:'+col(0)+' B:'+col(1);})()"""

async def main():
  async with async_playwright() as p:
    br = await p.chromium.launch(**launch_kwargs())
    ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page(); await stub(pg)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(B); await pg.wait_for_timeout(1500)
    sug = lambda: pg.evaluate("[...document.querySelectorAll('#suggest li[role=option]')].map(o=>o.dataset.href)")
    # --- arama: Türkçe harfler, aksansız yazım, büyük/küçük harf, ek toleransı
    for q, want in [('karaca', '#/urun/termos/764617800'), ('KARACA', '#/urun/termos/764617800'), ('Stanley', '#/urun/termos/780345921'),
                    ('tüylenme', '#/kategori/sweatshirt/konu/tuylenme'), ('TUYLENME', '#/kategori/sweatshirt/konu/tuylenme'),
                    ('sızdırıyor', '#/kategori/termos/konu/sizdirma'), ('SIZDIRIYOR', '#/kategori/termos/konu/sizdirma'),
                    ('İQON', '#/urun/nevresim-takimi/'), ('loreal', '#/urun/yuz-serumu/'), ('termos', '#/kategori/termos')]:
      await pg.fill('#q', q); await pg.wait_for_timeout(150)
      s = await sug(); check(f'S: "{q}" suggests {want}', any(x.startswith(want) for x in s), str(s[:4]))
    await pg.fill('#q', 'kargo'); await pg.wait_for_timeout(150)
    check('S: grouped list with "all results" option', await pg.locator('#suggest [role=group] .sg-h').count() >= 1 and any(x.startswith('#/ara/kargo') for x in await sug()))
    await pg.fill('#q', 'karaca'); await pg.wait_for_timeout(150)
    await pg.press('#q', 'ArrowDown'); await pg.press('#q', 'ArrowDown')
    sel = await pg.evaluate("document.querySelector('#suggest [aria-selected=true]')?.dataset.href")
    check('S: arrows set aria-activedescendant', sel and await pg.get_attribute('#q', 'aria-activedescendant'))
    await pg.press('#q', 'Enter'); await pg.wait_for_timeout(500)
    check('S: Enter opens active option', pg.url.endswith(sel), pg.url)
    await pg.fill('#q', 'karaca'); await pg.press('#q', 'Enter'); await pg.wait_for_timeout(800)
    check('S: no category match -> grouped results page', pg.url.endswith('#/ara/karaca') and await pg.locator('.sr-list li').count() == 4)
    await pg.fill('#q', 'termos'); await pg.press('#q', 'Enter'); await pg.wait_for_timeout(600)
    check('S: exact category name -> category page', pg.url.endswith('#/kategori/termos'))
    await pg.goto(B + '#/ara/zzqxw'); await pg.wait_for_timeout(800)
    check('S: no-result state', 'sonuç bulunamadı' in await pg.inner_text('h1') and await pg.locator('.cat-links a').count() == len(READY))
    await pg.goto(B + '#/ara/t%C3%BCylenme'); await pg.wait_for_timeout(800)
    await pg.locator('.sr-list a').first.click(); await pg.wait_for_timeout(800)
    check('S: topic hit opens category with the topic box', pg.url.endswith('#/kategori/sweatshirt/konu/tuylenme') and 'Tüylenme' in await pg.inner_text('#konu h2'))
    # Veri gecikirken öneri listesi "yükleniyor" der, veri gelince yenilenir
    pg2 = await ctx.new_page(); await stub(pg2)
    await pg2.add_init_script("(()=>{const f=window.fetch;window.fetch=(u,o)=>/data\\/(?!kategoriler)/.test(String(u))?new Promise(r=>setTimeout(r,2500)).then(()=>f(u,o)):f(u,o);})()")
    await pg2.goto(B + '#/yontem'); await pg2.wait_for_timeout(600)
    await pg2.fill('#q', 'karaca'); await pg2.wait_for_timeout(200)
    check('S: lazy data: loading note', 'yükleniyor' in await pg2.inner_text('#suggest'))
    await pg2.wait_for_timeout(3000)
    check('S: lazy data: suggestions refresh', any(x.startswith('#/urun/termos/764617800') for x in await pg2.evaluate("[...document.querySelectorAll('#suggest li[role=option]')].map(o=>o.dataset.href)")))
    await pg2.close()
    # --- rakip kartı: bütün ürünler
    bad = []
    for c in READY:
      cat = json.load(open(DATA / f"{c['id']}.json", encoding='utf-8')); exp = expected_gap(cat)
      for pid, e in exp.items():
        await pg.goto(B + f"#/urun/{c['id']}/{pid}"); await pg.wait_for_timeout(250)
        g = await pg.evaluate(GOT)
        if g != e: bad.append((c['id'], pid, e, g))
    check('G: rival card = independent computation for every product', not bad, str(bad[:3]))
    # --- kontrol listesi
    await pg.goto(B + '#/kategori/sweatshirt'); await pg.evaluate("localStorage.removeItem('rr_ck_sweatshirt')"); await pg.reload(); await pg.wait_for_timeout(800)
    n = await pg.locator('[data-ck]').count()
    sw = json.load(open(DATA / 'sweatshirt.json', encoding='utf-8'))
    check('C: 5 complaints + recommendations', n == 5 + len(sw['oneriler']), str(n))
    await pg.locator('[data-ck]').nth(0).check(); await pg.locator('[data-ck]').nth(6).check()
    check('C: progress count', (await pg.inner_text('#ck-n')) == f'2 / {n}')
    await pg.reload(); await pg.wait_for_timeout(800)
    check('C: persists per category', (await pg.inner_text('#ck-n')) == f'2 / {n}')
    await pg.emulate_media(media='print')
    pr = await pg.evaluate("({ticks:[...document.querySelectorAll('#sec-kontrol li[data-on] .ck-prt')].map(e=>getComputedStyle(e,'::before').content), inputs:[...document.querySelectorAll('#sec-kontrol input')].filter(e=>e.getClientRects().length).length})")
    check('C: prints with ticked state', len(pr['ticks']) == 2 and all('✓' in t for t in pr['ticks']) and pr['inputs'] == 0, str(pr))
    await pg.pdf(path=outdir('print') + 'v18-sweatshirt.pdf', format='A4', print_background=True, prefer_css_page_size=True)
    await pg.emulate_media(media='screen')
    await pg.click('#ck-reset')
    check('C: reset', (await pg.inner_text('#ck-n')) == f'0 / {n}' and await pg.evaluate("localStorage.getItem('rr_ck_sweatshirt')") is None)
    ctx3 = await br.new_context(viewport={'width': 375, 'height': 812}, is_mobile=True, has_touch=True); pg3 = await ctx3.new_page(); await stub(pg3)
    await pg3.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}})")
    e3 = []; pg3.on('pageerror', lambda e: e3.append(str(e)))
    await pg3.goto(B + '#/kategori/termos'); await pg3.wait_for_timeout(1000)
    await pg3.locator('[data-ck]').first.check()
    check('C: works without storage', (await pg3.inner_text('h1')) == 'Termos bardak' and (await pg3.inner_text('#ck-n')).startswith('1 /') and 'saklamıyor' in await pg3.inner_text('#ck-store') and not e3, str(e3))
    check('Q: phone meta line is a 2-column grid without bullets', await pg3.evaluate("getComputedStyle(document.querySelector('.meta')).display==='grid' && getComputedStyle(document.querySelector('.meta li+li'),'::before').display==='none'"))
    await ctx3.close()
    check('no page errors', not errs, str(errs[:3]))
    await br.close()
  print(f"\n{sum(1 for _, ok in R if ok)} passed, {sum(1 for _, ok in R if not ok)} failed")

asyncio.run(main())
