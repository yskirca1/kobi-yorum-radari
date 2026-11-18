"""v20 kontrolleri: varış vurgusu.
Site içi bir bağlantı sayfanın belirli bir parçasına gidince o parça görünür alanda olmalı ve bir an vurgulanmalı
(Web Animations, id "rr-arrive"; öğede geçici `data-arriving`). Vurgu 1,8 sn sonra iz bırakmadan kalkmalı, yerleşim değişmemeli.
- Bağlantı türü → hedef: özet şikâyet satırı → konu başlığı (.tp-lead); konu tablosundaki ürün → #p-konu; ürün sayfasından "Kategoride %X" →
  o ürünün tablo satırı; bölüm menüsü → bölüm başlığı; öneri → .tp-lead; özet KOBİ rakamı → "Ürünler" başlığı + sıralama + süzgeç etiketi;
  "Bütün alıntıları göster" → #p-alinti; terim "?" → #/yontem bölümü; Yöntem "Bu hesabı ürün ürün gör" → döküm kartı;
  ana sayfa okuma satırı → #/firsat'taki aynı satır; #/firsat hücreleri → kategori özetindeki aynı rakam (yoksa liste başlığı) ya da konu başlığı.
- Bütün sayfaya giden bağlantılarda vurgu yok (kategori kartı, kırıntı, ana sayfa). Geri/ileri ve yenilemede vurgu yok.
- Doğrudan açılan ve yapıştırılan adreste vurgu var. Odak v19'daki gibi. Azaltılmış hareket: sabit vurgu. Baskıda görünmez. Konsol temiz.
1280 ve 375 genişlikte.

Çalıştırma: depo kökünde `python -m http.server 8765`, sonra `python tests/v20_check.py`.
Not: bu bilgisayarda Python Playwright kurulu olmadığı için v20 aynı kontrollerin Node + CDP kopyasıyla (depo dışında, headless Edge) doğrulandı;
bu dosya Playwright kurulu bir makinede çalıştırılmadı.
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, launch_kwargs
import asyncio, json
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

# Çalışan vurgular, hedefleri ve görünür bant (yapışkan başlık / bölüm menüsü altı, karşılaştırma çubuğu üstü)
ARR = """() => {
  const top = document.querySelector('.top'), nav = document.getElementById('secnav'), bar = document.getElementById('cmpbar');
  const lim = Math.max(top ? top.getBoundingClientRect().bottom : 0, nav ? nav.getBoundingClientRect().bottom : 0);
  const bot = innerHeight - (bar && !bar.hidden ? bar.offsetHeight : 0);
  const a = document.activeElement;
  return { active: a === document.body ? 'body' : (a.id || a.tagName), t: document.getAnimations().filter(x => x.id === 'rr-arrive').map(x => {
    const e = x.effect.target, r = e.getBoundingClientRect();
    return { tag: e.tagName, id: e.id, cls: String(e.className), key: e.dataset.fig || e.dataset.read || '', txt: e.innerText.slice(0, 60), vis: r.top >= lim - 1 && r.top < bot - 10, run: x.playState === 'running' }; }) }; }"""
SNAP = "() => [...document.querySelectorAll('#app *')].slice(0, 400).map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v)).join(','); }).join(';') + '|' + scrollY"
LEFT = "() => document.getAnimations().filter(a => a.id === 'rr-arrive').length + document.querySelectorAll('[data-arriving]').length"

TPLEAD = lambda x: 'tp-lead' in x['cls']
LIST = lambda x: x['id'] == 'urun-t' or x['tag'] == 'LABEL' or 'chip' in x['cls']

async def run(br, w, h, mobile, tag):
  ctx = await br.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile); pg = await ctx.new_page(); await stub(pg)
  errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
  async def click(sel, t=900):
    await pg.locator(sel).first.click(); await pg.wait_for_timeout(t)
  async def go(hs, t=900): await pg.evaluate(f"location.hash={json.dumps(hs)}"); await pg.wait_for_timeout(t)
  async def arr(name, pred, every=False, wait=350):
    await pg.wait_for_timeout(wait); a = await pg.evaluate(ARR)
    for _ in range(30):  # yumuşak kaydırma uzun sürebilir (telefonda bölüm menüsü): vurgu kaydırma bitince başlar
      if a['t']: break
      await pg.wait_for_timeout(100); a = await pg.evaluate(ARR)
    ok = a['t'] and (all(pred(x) for x in a['t']) if every else pred(a['t'][0])) and all(x['vis'] and x['run'] for x in a['t'])
    check(f'{tag} {name}', ok, json.dumps(a, ensure_ascii=False))
    if a['t']:
      s1 = await pg.evaluate(SNAP); await pg.wait_for_timeout(2000); s2 = await pg.evaluate(SNAP)
      check(f'{tag} {name}: gone, no layout change', await pg.evaluate(LEFT) == 0 and s1 == s2)
    return a
  async def none(name, wait=450):
    await pg.wait_for_timeout(wait); a = await pg.evaluate(ARR)
    check(f'{tag} {name}: no highlight', not a['t'], json.dumps(a['t'], ensure_ascii=False))

  await pg.goto(B); await pg.wait_for_timeout(1500)
  await none('home')
  await click('.hero-cta a'); await none('hero CTA → category')
  await click('.issues li:nth-child(2) a'); a = await arr('summary row → topic headline', TPLEAD)
  check(f'{tag} focus unchanged on topic view', a['active'] == 'body')
  await click('.tp-table tbody th a.go'); a = await arr('topic product → #p-konu', lambda x: x['id'] == 'p-konu')
  check(f'{tag} focus unchanged on product topic', a['active'] == 'p-konu')
  pid = (await pg.evaluate('location.hash')).split('/')[3]
  await click('#p-konu .pk-fig a.go'); await arr('"Kategoride %" → product row', lambda x: x['tag'] == 'TR')
  check(f'{tag} row is that product', await pg.evaluate(f"""!!document.querySelector('.tp-table a[href*="/{pid}/"]')"""))
  await pg.go_back(); await none('back')
  await pg.go_forward(); await none('forward')
  await go('#/kategori/filtre-kahve')
  await click('[data-jump="sec-oneri"]', 100); a = await arr('section nav → heading', lambda x: x['id'] == 'oneri-t', wait=350)
  check(f'{tag} focus unchanged on section nav', a['active'] == 'sec-oneri')
  await click('#sec-oneri .recs li:nth-child(2) .rec-ev a.go'); await arr('recommendation → topic headline', TPLEAD)
  await pg.go_back(); await pg.wait_for_timeout(800)
  await click('[data-fig="dusuk-kobi"] a'); a = await arr('KOBİ figure → list heading, sort, chip', LIST, every=True)
  check(f'{tag} three targets', len(a['t']) == 3)
  check(f'{tag} focus unchanged on filtered list', a['active'] == 'sec-urun')
  await click('.pc .pc-meta a.go'); await arr('product card complaint → #p-konu', lambda x: x['id'] == 'p-konu')
  await click('#p-konu .pk-top a'); await arr('"Bütün alıntıları göster" → #p-alinti', lambda x: x['id'] == 'p-alinti')
  await go('#/kategori/filtre-kahve')
  await click('#sec-ozet .tip', 200); await click('#sec-ozet .tip-box a'); await arr('tip → #/yontem section', lambda x: x['id'] == 'y-sikayet')
  await go('#/yontem'); await click('#y-oran a[data-to="dokum"]'); await arr('"Bu hesabı ürün ürün gör" → breakdown card', lambda x: x['tag'] == 'SECTION')
  await go('#/', 2000); await click('.cat .cat-a'); await none('category card')
  await go('#/', 2000); k = await pg.evaluate("document.querySelector('.reads-list li:nth-child(2) a').dataset.to")
  await click('.reads-list li:nth-child(2) a', 1300); await arr('home reading → #/firsat reading', lambda x: 'read:' + x['key'] == k)
  row = '.fc[data-row="filtre-kahve"] .fc-m' if mobile else '#ft-body tr[data-row="filtre-kahve"]'
  for href, pred, nm in [('#/kategori/filtre-kahve?sirala=cok', lambda x: x['key'] == 'dusuk', '1-2 yıldız payı → figure'),
                         ('#/kategori/filtre-kahve?sirala=cok&tip=kobi', lambda x: x['key'] == 'dusuk-kobi', 'KOBİ → figure'),
                         ('#/kategori/filtre-kahve?tip=buyuk', LIST, 'büyük marka payı → list')]:
    await go('#/firsat', 1300); await click(f'{row} a[href="{href}"]', 1000); await arr('#/firsat ' + nm, pred)
  await go('#/firsat', 1300); await click(f'{row} a[href^="#/kategori/filtre-kahve/konu/"]', 1000); await arr('#/firsat complaint → topic headline', TPLEAD)
  await go('#/yontem/alinti', 1000); await arr('pasted #/yontem/alinti', lambda x: x['id'] == 'y-alinti', wait=50)
  await pg.reload(); await pg.wait_for_timeout(1500); await none('reload')
  for hs, pred in [('#/kategori/filtre-kahve/konu/skt', TPLEAD), ('#/urun/filtre-kahve/52915799/konu/skt', lambda x: x['id'] == 'p-konu'),
                   ('#/yontem/oran', lambda x: x['id'] == 'y-oran'), ('#/kategori/filtre-kahve?sirala=cok&tip=kobi', LIST)]:
    p2 = await ctx.new_page(); await stub(p2); await p2.goto(B + hs); await p2.wait_for_timeout(1300)
    a = await p2.evaluate(ARR); check(f'{tag} direct open {hs}', a['t'] and pred(a['t'][0]) and a['t'][0]['vis'], json.dumps(a, ensure_ascii=False))
    await p2.close()
  check(f'{tag} console clean', not errs, str(errs[:3]))
  await ctx.close()

async def main():
  async with async_playwright() as p:
    br = await p.chromium.launch(**launch_kwargs())
    await run(br, 1280, 900, False, 'D')
    await run(br, 375, 812, True, 'M')
    ctx = await br.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); pg = await ctx.new_page(); await stub(pg)
    await pg.goto(B + '#/kategori/filtre-kahve/konu/skt'); await pg.wait_for_timeout(1300)
    k = await pg.evaluate("(()=>{const a=document.getAnimations().find(a=>a.id==='rr-arrive'); const f=a.effect.getKeyframes(); return f.every(x=>x.boxShadow===f[0].boxShadow) && a.effect.getTiming().duration===1800})()")
    check('reduced motion: static highlight, same duration', k)
    await pg.wait_for_timeout(2000); check('reduced motion: removed', await pg.evaluate(LEFT) == 0)
    await pg.evaluate("location.hash='#/yontem/oneri'"); await pg.wait_for_timeout(400)
    await pg.emulate_media(media='print')
    s = await pg.evaluate("(()=>{const e=document.getElementById('y-oneri'), c=getComputedStyle(e); return e.hasAttribute('data-arriving') && c.boxShadow==='none' && c.outlineStyle==='none'})()")
    check('print: no highlight', s)
    await ctx.close(); await br.close()
  print(f"\n{sum(1 for _, ok in R if ok)} passed, {sum(1 for _, ok in R if not ok)} failed")

asyncio.run(main())
