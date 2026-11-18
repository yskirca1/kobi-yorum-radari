"""v19 kontrolleri: her rakam kanıtına tıklanır.
- Konu görünümü (#/kategori/<id>/konu/<tema>, /sevilen/<konu>): ürün ürün parçalar başlıktaki oranı ve segment ara toplamlarını verir
  (bütün kategoriler, bütün şikâyet konuları; olumlu konularda basit ortalama), yalnızca konuya etiketli alıntılar gösterilir.
- Tıklama zinciri: ana sayfa → kategori → konu → ürün-konu (konu kartına kayar) → Trendyol (yeni sekme); geri/ileri.
- Süzgeç ve sıralama adreste (?sirala=cok&tip=kobi), geri/ileri, yapıştırılan adres, geçersiz değer → "Sayfa bulunamadı".
- Öneriler ve kontrol listesi konulara bağlı; alan yoksa "Genel öneri" (veri değiştirilmeden, istek yanıtı bellekte değiştirilerek).
- #/firsat telefon genişliğinde yazdırılınca tablo basılır.

Çalıştırma: depo kökünde `python -m http.server 8765`, sonra `python tests/v19_check.py`.
Not: bu bilgisayarda Python Playwright kurulu olmadığı için v19 aynı kontrollerin Node + CDP kopyasıyla (depo dışında, headless Edge) doğrulandı;
bu dosya Playwright kurulu bir makinede çalıştırılmadı.
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio, json
from playwright.async_api import async_playwright
B = BASE
SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/></svg>'
REG = [c for c in json.load(open(DATA / 'kategoriler.json', encoding='utf-8')) if c.get('durum') == 'hazir']
CAT = {c['id']: json.load(open(DATA / f"{c['id']}.json", encoding='utf-8')) for c in REG}
R = []
def check(name, cond, info=''):
  R.append((name, bool(cond))); print(('PASS ' if cond else 'FAIL ') + name, '' if cond else info)
def pct(v): return '%' + format(v * 100, '.0f')  # JS toFixed(0) ile aynı yuvarlama bu veride (kontrol edildi)

async def stub(pg):
  await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
  await pg.route('**/*trendyol.com/**', lambda r: r.abort())
  await pg.route('**/fonts.g*/**', lambda r: r.abort())

READ = """() => { const row = (tr) => { const td = tr.querySelectorAll('td'); return { r: parseInt(td[0].innerText.replace('%', '')), n: parseInt(td[1].innerText.replace(/\\./g, '')) }; };
  return { groups: [...document.querySelectorAll('.tp-table tbody')].map(tb => [...tb.querySelectorAll('tr:not(.tp-g):not(.tp-tot)')].map(row)),
    sub: [...document.querySelectorAll('.tp-table tbody tr.tp-tot')].map(tr => tr.querySelector('td').innerText),
    foot: document.querySelector('.tp-all td').innerText,
    off: +((document.querySelector('.tp-off th')?.innerText.match(/geçmediği (\\d+) ürün/) || [0, 0])[1]) }; }"""

async def main():
  async with async_playwright() as p:
    br = await p.chromium.launch(**launch_kwargs())
    ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page(); await stub(pg)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(B); await pg.wait_for_timeout(1200)
    h = lambda: pg.evaluate('location.hash')
    async def go(hs, t=300): await pg.evaluate(f"location.hash={json.dumps(hs)}"); await pg.wait_for_timeout(t)
    # --- aritmetik
    bad = []
    for cid, d in CAT.items():
      P = d['urunler']; segs = len({x['segment'] for x in P}) > 1
      w = lambda R_, t: sum(x['sikayet'].get(t, 0) * x['ornek_dusuk'] for x in R_) / sum(x['ornek_dusuk'] for x in R_)
      for t in d['temalar']:
        await go(f"#/kategori/{cid}/konu/{t['id']}", 150); g = await pg.evaluate(READ)
        rows = [r for grp in g['groups'] for r in grp]; n = sum(r['n'] for r in rows); k = sum(r['r'] / 100 * r['n'] for r in rows)
        ok = pct(k / n) == g['foot'] == pct(w(P, t['id'])) and n == sum(x['ornek_dusuk'] for x in P)
        if segs:
          for i, grp in enumerate(g['groups']):
            gn = sum(r['n'] for r in grp); gk = sum(r['r'] / 100 * r['n'] for r in grp)
            ok = ok and pct(gk / gn) == g['sub'][i]
          ok = ok and g['sub'] == [pct(w([x for x in P if x['segment'] != 'KOBİ'], t['id'])), pct(w([x for x in P if x['segment'] == 'KOBİ'], t['id']))]
        if not ok: bad.append((cid, t['id'], g['foot']))
    check('A: topic parts reproduce headline and segment rates (all categories, all complaints)', not bad, str(bad[:5]))
    badp = []
    for cid in ['filtre-kahve', 'termos', 'nevresim-takimi']:
      d = CAT[cid]
      for k in d['olumlu_konular']:
        await go(f"#/kategori/{cid}/sevilen/{k['id']}", 150); g = await pg.evaluate(READ)
        rows = [r for r in g['groups'][0] if r['r'] > 0]; cnt = len(rows) + g['off']
        exp = sum(x['olumlu'].get(k['id'], 0) for x in d['urunler']) / len(d['urunler'])
        if not (pct(sum(r['r'] for r in rows) / 100 / cnt) == g['foot'] == pct(exp) and cnt == len(d['urunler'])): badp.append((cid, k['id']))
    check('A: positive topic = simple mean of product rates', not badp, str(badp))
    # --- alıntılar yalnızca etiketli konuda (5 eski kategoride konu adı kimliğe çevrilir)
    qb = []
    for cid, tid in [('termos', 'sizdirma'), ('sweatshirt', 'tuylenme'), ('filtre-kahve', 'skt'), ('sal', 'renk')]:
      d = CAT[cid]; t = next(x for x in d['temalar'] if x['id'] == tid)
      exp = sorted(a['metin'] for x in d['urunler'] for a in x['alinti'] if a['konu'] in (tid, t['ad']))
      await go(f'#/kategori/{cid}/konu/{tid}')
      got = sorted(await pg.evaluate("[...document.querySelectorAll('#tp-q .q blockquote')].map(e=>e.innerText.replace(/^\"|\"$/g,''))"))
      if got != exp: qb.append((cid, tid, len(got), len(exp)))
    check('Q: only quotes tagged with the topic', not qb, str(qb))
    # --- zincir
    await go('#/', 900); await pg.click('.hero-cta a'); await pg.wait_for_timeout(700)
    check('C: home entry → demo category', await h() == '#/kategori/filtre-kahve')
    await pg.click('.issues li:nth-child(2) a'); await pg.wait_for_timeout(700)
    check('C: complaint row → topic view', await h() == '#/kategori/filtre-kahve/konu/skt')
    await pg.locator('.tp-table tbody th a.go').first.click(); await pg.wait_for_timeout(800)
    check('C: product row → product at topic, focus on topic card', (await h()).endswith('/konu/skt') and await pg.evaluate("document.activeElement.id==='p-konu'"))
    check('C: Trendyol link in new tab', await pg.evaluate("(()=>{const a=document.querySelector('#p-konu .pk-more a');return a.target==='_blank'&&/trendyol\\.com/.test(a.href)})()"))
    await pg.go_back(); await pg.wait_for_timeout(600); check('C: back → topic view', await h() == '#/kategori/filtre-kahve/konu/skt')
    await pg.go_forward(); await pg.wait_for_timeout(600); check('C: forward → product', (await h()).endswith('/konu/skt') and (await h()).startswith('#/urun/'))
    # --- süzgeç adreste
    await go('#/kategori/filtre-kahve', 600); await pg.click('.fact-seg div:nth-child(2) a'); await pg.wait_for_timeout(600)
    check('F: KOBİ figure → ?sirala=cok&tip=kobi', await h() == '#/kategori/filtre-kahve?sirala=cok&tip=kobi' and await pg.evaluate("document.getElementById('sort').value==='cok'"))
    await pg.select_option('#sort', 'puan'); await pg.wait_for_timeout(200)
    check('F: sort writes address', await h() == '#/kategori/filtre-kahve?sirala=puan&tip=kobi')
    await pg.go_back(); await pg.wait_for_timeout(600)
    check('F: back restores previous sort', await pg.evaluate("document.getElementById('sort').value") == 'cok')
    for q in ['?sirala=x', '?tip=foo', '?x=1', '?puan=5', '?sirala=cok&sirala=puan']:
      await go('#/kategori/sweatshirt' + q)
      check('F: bad query → not found ' + q, await pg.inner_text('h1') == 'Sayfa bulunamadı')
    for bad_ in ['#/kategori/termos/konu/yok', '#/kategori/termos/sevilen/yok', '#/urun/termos/780345921/konu/yok', '#/kategori/termos/konu/isi?sirala=cok']:
      await go(bad_); check('R: not found ' + bad_, await pg.inner_text('h1') == 'Sayfa bulunamadı')
    # --- öneriler: alanlar veriden; yoksa "Genel öneri"
    await go('#/kategori/termos', 600)
    links = await pg.evaluate("[...document.querySelectorAll('#sec-oneri .recs li')].map(li=>[...li.querySelectorAll('.rec-ev a.go')].map(a=>a.getAttribute('href')))")
    exp = [[f'#/kategori/termos/konu/{k}' for k in (o.get('konular') or [])] + [f'#/kategori/termos/sevilen/{k}' for k in (o.get('sevilenler') or [])] for o in CAT['termos']['oneriler']]
    check('O: recommendation links = data konular/sevilenler', links == exp, str(links))
    pg2 = await ctx.new_page(); await stub(pg2)
    async def strip(route):
      r = await route.fetch(); j = await r.json()
      for o in j['oneriler']: o.pop('konular', None); o.pop('sevilenler', None)
      await route.fulfill(response=r, body=json.dumps(j))
    await pg2.route('**/data/termos.json*', strip)
    await pg2.goto(B + '#/kategori/termos'); await pg2.wait_for_timeout(1000)
    check('O: without fields every recommendation is "Genel öneri" without figure', await pg2.evaluate("[...document.querySelectorAll('#sec-oneri .recs li')].every(li=>li.querySelector('.rec-gen') && !li.querySelector('.rec-ev b'))"))
    await pg2.close()
    # --- yazdırma: #/firsat telefon genişliğinde
    ctx3 = await br.new_context(viewport={'width': 375, 'height': 812}, is_mobile=True, has_touch=True); pg3 = await ctx3.new_page(); await stub(pg3)
    await pg3.goto(B + '#/firsat'); await pg3.wait_for_timeout(1200)
    await pg3.emulate_media(media='print')
    check('P: phone-width print shows the table', await pg3.evaluate("[...document.querySelectorAll('#ft-body tr[data-row]')].filter(r=>r.getClientRects().length).length") == len(REG))
    await pg3.emulate_media(media='screen')
    sw = await pg3.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    check('M: no overflow at 375 (#/firsat)', sw <= 0, sw)
    await ctx3.close()
    check('no page errors', not errs, str(errs[:3]))
    await br.close()
  print(f"\n{sum(1 for _, ok in R if ok)} passed, {sum(1 for _, ok in R if not ok)} failed")

asyncio.run(main())
