import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio, json, sys, math
import firsat_ref as F
from playwright.async_api import async_playwright
B=BASE
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/></svg>'
OUT=outdir('firsat')
R=[]
def check(n,c,i=''): R.append((n,bool(c))); print(('PASS ' if c else 'FAIL ')+n, i if not c or len(str(i))<200 else str(i)[:200])
P=lambda v,d=1: '%'+f'{v*100:.{d}f}'.replace('.',',')
I=lambda v: f'{v:,}'.replace(',','.')
async def stub(pg):
  await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
  await pg.route('**/fonts.g*/**', lambda r: r.abort())
ROWS="""() => [...document.querySelectorAll('#ft-body tr[data-row]')].map(tr=>({id:tr.dataset.row, name:tr.querySelector('th a').innerText.trim(), rank:(tr.querySelector('.ft-rank')||{}).innerText||null,
  cells:[...tr.querySelectorAll(':scope > td')].map(td=>td.innerText.replace(/\\s+/g,' ').trim()), score:+tr.querySelector('.ft-score').innerText}))"""
COMPS_JS="""() => Object.fromEntries([...document.querySelectorAll('#ft-body .ft-dbox')].map(d=>[d.id.slice(4), Object.fromEntries([...d.querySelectorAll('[data-comp]')].map(td=>[td.dataset.comp, td.innerText.trim()]))]))"""
rows=F.ref(); REF={r['id']:r for r in rows}; N=len(rows)
COMP=F.components(rows)
def comp_ok(dom):
  bad=[]
  for i,c in COMP.items():
    for k in F.COMPS:
      exp='–' if c[k] is None else str(F.jsround(c[k]))
      if dom.get(i,{}).get(k)!=exp: bad.append((i,k,dom.get(i,{}).get(k),exp))
  return bad
async def scores_ok(pg, w, label):
  s,order,_=F.scores(rows,w)
  d=await pg.evaluate(ROWS)
  got={x['id']:x['score'] for x in d}
  check(f'[{label}] every score equals reference', got==s, str({k:(got.get(k),s[k]) for k in s if got.get(k)!=s[k]}))
  check(f'[{label}] order + rank numbers = reference', [x['id'] for x in d]==order and [x['rank'] for x in d]==[str(i+1) for i in range(N)], str([x['id'] for x in d]))
  return d
async def slider_to(pg, i, v):
  sel=f'[data-wi="{i}"]'; await pg.focus(sel); await pg.keyboard.press('Home')
  for _ in range(v): await pg.keyboard.press('ArrowRight')
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    ctx=await br.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page(); await stub(pg)
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto(B); await pg.evaluate("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('rr_theme','light')")
    await pg.goto(B+'#/firsat'); await pg.wait_for_timeout(700)
    d=await pg.evaluate(ROWS)
    check('row count = ready categories with data', len(d)==N, f'{len(d)} vs {N}')
    # raw value columns (same as v14)
    bad=[]
    for x in d:
      r=REF[x['id']]
      exp=[P(r['dusuk']), 'Büyük marka yok' if r['buyukPay'] is None else P(r['buyukPay']), '–' if r['kobi'] is None else P(r['kobi']), '–' if r['buyuk'] is None else P(r['buyuk']),
           f"{r['sikayet']} {P(r['sikayetV'],0)}", str(r['urun']), I(r['okunan'])]
      if x['cells'][1:]!=exp: bad.append((x['name'],x['cells'][1:],exp))
    check('raw value columns equal reference for every row', not bad, str(bad))
    check('default sort = score desc, aria-sort', await pg.get_attribute('th[data-col="puan"]','aria-sort')=='descending')
    check('default preset Dengeli checked', await pg.is_checked('input[name="fs-preset"][value="dengeli"]'))
    # expand all rows -> component values
    for x in d: await pg.click(f'[data-exp="{x["id"]}"]')
    dom=await pg.evaluate(COMPS_JS)
    check('expand: aria-expanded true + detail rows', await pg.evaluate("[...document.querySelectorAll('[data-exp]')].every(b=>b.getAttribute('aria-expanded')==='true')") and len(dom)==N)
    b=comp_ok(dom); check('component scores equal reference (all rows)', not b, str(b))
    PRES=await pg.evaluate("[...document.querySelectorAll('input[name=fs-preset]')].map(i=>i.value)")
    RANK={}
    for k,w in F.PRESETS.items():
      await pg.click(f'input[name="fs-preset"][value="{k}"] + span'); await pg.wait_for_timeout(100)
      dd=await scores_ok(pg,w,k)
      RANK[k]=[(x['name'],x['score']) for x in dd]
      b=comp_ok(await pg.evaluate(COMPS_JS)); check(f'[{k}] components unchanged, details stay open', not b and len(await pg.evaluate(COMPS_JS))==N)
      desc=await pg.inner_text('#fs-desc'); check(f'[{k}] preset sentence shown', len(desc)>10, desc)
      if k=='dengeli': await pg.screenshot(path=OUT+'firsat-d-light-expanded.png', full_page=True)
    # collapse one
    first=d[0]['id']; await pg.click(f'[data-exp="{first}"]')
    check('collapse: aria-expanded false, detail removed', await pg.get_attribute(f'[data-exp="{first}"]','aria-expanded')=='false' and await pg.locator(f'#ftd-{first}').count()==0)
    for x in d[1:]: await pg.click(f'[data-exp="{x["id"]}"]')
    # keyboard preset: arrow keys move selection, focus stays on radio
    await pg.click('input[name="fs-preset"][value="dengeli"] + span')
    await pg.focus('input[name="fs-preset"][value="dengeli"]'); await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(100)
    check('keyboard: ArrowRight selects next preset, focus kept', await pg.is_checked('input[name="fs-preset"][value="guvenli"]') and await pg.evaluate("document.activeElement.value")=='guvenli')
    await scores_ok(pg,F.PRESETS['guvenli'],'guvenli via keyboard')
    # custom via keyboard on sliders
    y0=await pg.evaluate('scrollY')
    await pg.click('input[name="fs-preset"][value="fark"] + span'); await pg.focus('input[name="fs-preset"][value="fark"]'); await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(100)
    check('Kendin ayarla reveals sliders, starting from previous preset', await pg.is_visible('#fs-sliders') and await pg.evaluate("[...document.querySelectorAll('[data-wi]')].map(s=>+s.value)")==F.PRESETS['fark'], await pg.evaluate("[...document.querySelectorAll('[data-wi]')].map(s=>+s.value)"))
    for i,v in enumerate([5,0,2,0,1]): await slider_to(pg,i,v)
    await pg.wait_for_timeout(100)
    check('slider keyboard sets weights, focus stays on slider', await pg.evaluate("[...document.querySelectorAll('[data-wi]')].map(s=>+s.value)")==[5,0,2,0,1] and await pg.evaluate("document.activeElement.dataset.wi")=='4')
    await scores_ok(pg,[5,0,2,0,1],'custom 5,0,2,0,1')
    RANK['custom 5,0,2,0,1']=[(x['name'],x['score']) for x in await pg.evaluate(ROWS)]
    await pg.evaluate('scrollTo(0,0)'); await pg.screenshot(path=OUT+'firsat-d-custom-expanded.png', full_page=True)
    # persistence
    await pg.reload(); await pg.wait_for_timeout(700)
    check('persist: custom preset + weights after reload', await pg.is_checked('input[name="fs-preset"][value="ozel"]') and await pg.evaluate("[...document.querySelectorAll('[data-wi]')].map(s=>+s.value)")==[5,0,2,0,1])
    await scores_ok(pg,[5,0,2,0,1],'custom after reload')
    # switch to preset and back keeps custom weights
    await pg.click('input[name="fs-preset"][value="dengeli"] + span'); await pg.click('input[name="fs-preset"][value="ozel"] + span')
    check('custom weights survive preset round trip', await pg.evaluate("[...document.querySelectorAll('[data-wi]')].map(s=>+s.value)")==[5,0,2,0,1])
    # all zero
    for i in range(5): await slider_to(pg,i,0)
    await pg.wait_for_timeout(100)
    check('all-zero note visible', await pg.is_visible('#fs-zero'))
    await scores_ok(pg,[0,0,0,0,0],'all zero')
    s0,_,_=F.scores(rows,[0]*5); s1,_,_=F.scores(rows,[1]*5); check('all-zero == equal weights (reference)', s0==s1)
    # single-weight on kobi only: rows lacking kobi fall back to equal over remaining
    for i,v in enumerate([0,0,0,5,0]): await slider_to(pg,i,v)
    await scores_ok(pg,[0,0,0,5,0],'only kobi weight (edge)')
    await pg.click('input[name="fs-preset"][value="dengeli"] + span'); await pg.wait_for_timeout(100)
    # 4-criteria mark
    miss=[i for i,c in COMP.items() if c['kobi'] is None]
    marks=await pg.evaluate("[...document.querySelectorAll('#ft-body tr[data-row]')].filter(tr=>tr.querySelector('.ft-eksik')).map(tr=>tr.dataset.row)")
    check('"4 ölçüt" mark exactly on rows missing a segment', sorted(marks)==sorted(miss), f'{marks} vs {miss}')
    # sorting other columns
    base={x['id']:x['score'] for x in await pg.evaluate(ROWS)}
    for col,key in [('dusuk','dusuk'),('buyukPay','buyukPay'),('sik','sikayetV')]:
      await pg.focus(f'button[data-sort="{col}"]'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
      o=await pg.evaluate(ROWS); vals=[REF[x['id']][key] for x in o]; nn=[v for v in vals if v is not None]
      check(f'sort {col} desc via keyboard, focus kept, no rank numbers', nn==sorted(nn,reverse=True) and await pg.evaluate("document.activeElement.dataset.sort")==col and all(x['rank'] is None for x in o))
    await pg.click('button[data-sort="ad"]'); o=[x['name'] for x in await pg.evaluate(ROWS)]
    check('sort name A→Z', await pg.evaluate("(a)=>a.every((x,i)=>!i||a[i-1].localeCompare(x,'tr')<=0)", o))
    await pg.click('button[data-sort="puan"]'); await pg.wait_for_timeout(100)
    check('back to score desc', await pg.get_attribute('th[data-col="puan"]','aria-sort')=='descending')
    await pg.click('button[data-sort="puan"]'); o=await pg.evaluate(ROWS)
    check('score asc toggle', [x['score'] for x in o]==sorted(x['score'] for x in o))
    await pg.click('button[data-sort="puan"]')
    # filters
    def fexp(f):
      out=[]
      for r in rows:
        if f.get('ust') and r['ust']!=f['ust']: continue
        if f.get('b20') and not (r['buyukPay'] is None or r['buyukPay']<0.2): continue
        if f.get('kobi') and not (r['buyuk'] is None or (r['kobi'] is not None and r['kobi']<=r['buyuk'])): continue
        if f.get('maxD') and not r['dusuk']<=f['maxD']+1e-12: continue
        out.append(r['id'])
      return sorted(out)
    async def apply(f):
      await pg.click('[data-fust=""]') if await pg.is_visible('#ff-clear')==False else await pg.click('#ff-clear')
      if f.get('ust'): await pg.click(f'[data-fust="{f["ust"]}"]')
      if f.get('b20'): await pg.check('#ff-b20')
      if f.get('kobi'): await pg.check('#ff-kobi')
      if f.get('maxD'): await pg.select_option('#ff-d', str(f['maxD']))
      await pg.wait_for_timeout(80)
    for f in [{'ust':'Giyim'},{'b20':1},{'kobi':1},{'maxD':0.1},{'maxD':0.15},{'maxD':0.2},{'b20':1,'kobi':1},{'ust':'Kozmetik','maxD':0.15},{'b20':1,'kobi':1,'maxD':0.1}]:
      await apply(f)
      o=await pg.evaluate(ROWS); ids=sorted(x['id'] for x in o)
      n=await pg.inner_text('#ff-n')
      check(f'filter {f}: rows = reference, scores unchanged, count text', ids==fexp(f) and all(base[x['id']]==x['score'] for x in o) and n==f'{len(ids)} / {N} kategori', f'{ids} vs {fexp(f)} | {n}')
    await apply({'ust':'Mutfak','maxD':0.1})
    check('empty state shown, table hidden', await pg.is_visible('#ff-empty') and not await pg.is_visible('#ctable-wrap') and '0 / ' in await pg.inner_text('#ff-n'))
    await pg.click('[data-ffclear]'); await pg.wait_for_timeout(80)
    check('empty-state clear restores all', len(await pg.evaluate(ROWS))==N and not await pg.is_visible('#ff-clear'))
    await apply({'b20':1,'kobi':1})
    await pg.reload(); await pg.wait_for_timeout(700)
    check('filters persist on reload (same tab)', await pg.is_checked('#ff-b20') and await pg.is_checked('#ff-kobi') and sorted(x['id'] for x in await pg.evaluate(ROWS))==fexp({'b20':1,'kobi':1}))
    pg2=await ctx.new_page(); await stub(pg2); await pg2.goto(B+'#/firsat'); await pg2.wait_for_timeout(700)
    check('new visit (new tab): filters reset, weights kept', not await pg2.is_checked('#ff-b20') and len(await pg2.evaluate(ROWS))==N and await pg2.is_checked('input[name="fs-preset"][value="dengeli"]'))
    await pg2.close()
    await pg.click('#ff-clear')
    # yöntem
    await pg.goto(B+'#/yontem'); await pg.wait_for_timeout(500)
    t=await pg.inner_text('#giris-puani')
    check('yöntem: Giriş puanı section with components and presets', all(x in t for x in ['Büyük marka baskısı az','Yorum hacmi yüksek','Dengeli','Güvenli giriş','Rakibi az pazar','Fark yaratmak istiyorum','1, 3, 1, 2, 1']) and 'Sınırlar' in await pg.inner_text('#app'))
    await pg.goto(B); await pg.wait_for_timeout(500)
    lt=await pg.inner_text('.reads-all'); h=await pg.evaluate("document.querySelector('.reads-all').getBoundingClientRect().height")
    check('home link text, one line', 'Kategorileri puanla ve karşılaştır' in lt and h<30, f'{lt} {h}')
    await pg.screenshot(path=OUT+'home-d-light.png')
    check('no page errors (desktop run)', not errs, str(errs))
    await ctx.close()
    # viewports x themes
    for theme in ['light','dark']:
      for w,h,tag in [(1440,900,'d'),(768,1024,'t'),(390,844,'m')]:
        ctx=await br.new_context(viewport={'width':w,'height':h}); pg=await ctx.new_page(); await stub(pg)
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(B); await pg.evaluate(f"localStorage.setItem('rr_theme','{theme}'); localStorage.setItem('rr_firsat_w', JSON.stringify({{p:'ozel',w:[5,0,2,0,1],c:true}}))")
        await pg.goto(B+'#/firsat'); await pg.reload(); await pg.wait_for_timeout(700)
        await pg.locator('[data-exp]:visible').first.click(); await pg.wait_for_timeout(100)
        sw=await pg.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]')
        check(f'{tag}-{theme}: no page overflow (sliders open, row expanded)', sw[0]<=sw[1], str(sw))
        if tag=='m':
          # v17: telefonda tablo yerine kategori kartları; sıralama seçimi ve "Puan ayrıntısı" kartta
          st=await pg.evaluate("(()=>{const d=document.querySelector('#fcards .ft-dbox').getBoundingClientRect(); return {cards:document.querySelectorAll('#fcards .fc').length, table:document.getElementById('ctable-wrap').hidden, sort:!document.getElementById('fsort-m').hidden, comps:document.querySelectorAll('#fcards .ft-dbox [data-comp]').length, dbox:[Math.round(d.left), Math.round(d.right), innerWidth]}})()")
          check(f'm-{theme}: one card per category, table hidden, sort control, detail box in view', st['cards']==N and st['table'] and st['sort'] and st['comps']==5 and st['dbox'][0]>=0 and st['dbox'][1]<=st['dbox'][2], str(st))
          sc=await pg.evaluate("[...document.querySelectorAll('#fcards .ft-score')].map(x=>+x.innerText)")
          s_ref,order,_=F.scores(rows,[5,0,2,0,1])
          check(f'm-{theme}: card scores and order = reference', sc==[s_ref[i] for i in order], str(sc))
          await pg.select_option('#fm-sort','dusuk'); await pg.wait_for_timeout(100)
          o=await pg.evaluate("[...document.querySelectorAll('#fcards .fc')].map(x=>x.dataset.row)")
          check(f'm-{theme}: sort select (1-2 yıldız payı desc)', o==[r['id'] for r in sorted(rows,key=lambda r:-r['dusuk'])], str(o))
          await pg.click('#fm-dir'); await pg.wait_for_timeout(100)
          o=await pg.evaluate("[...document.querySelectorAll('#fcards .fc')].map(x=>x.dataset.row)")
          check(f'm-{theme}: direction button (asc)', o==[r['id'] for r in sorted(rows,key=lambda r:r['dusuk'])], str(o))
          await pg.select_option('#fm-sort','puan')
        await pg.evaluate("localStorage.setItem('rr_firsat_w', JSON.stringify({p:'dengeli',w:[1,1,1,1,1],c:false}))"); await pg.reload(); await pg.wait_for_timeout(700)
        sw=await pg.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]')
        check(f'{tag}-{theme}: no page overflow (default)', sw[0]<=sw[1], str(sw))
        await pg.screenshot(path=OUT+f'firsat-{tag}-{theme}.png', full_page=True)
        check(f'{tag}-{theme}: no page errors', not errs, str(errs))
        await ctx.close()
    # print
    ctx=await br.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page(); await stub(pg)
    await pg.goto(B); await pg.evaluate("localStorage.setItem('rr_theme','dark')")
    await pg.goto(B+'#/firsat'); await pg.reload(); await pg.wait_for_timeout(700)
    await pg.emulate_media(media='print')
    inf=await pg.evaluate("({bg:getComputedStyle(document.body).backgroundColor, ctrl:getComputedStyle(document.querySelector('.fs-ctrl')).display, ff:getComputedStyle(document.querySelector('.ff')).display, cap:document.getElementById('prt-w').innerText, capVis:getComputedStyle(document.getElementById('prt-w')).display})")
    check('print: light bg, controls hidden, preset caption shown', inf['bg']=='rgb(255, 255, 255)' and inf['ctrl']=='none' and inf['ff']=='none' and inf['capVis']!='none' and 'Dengeli' in inf['cap'], str(inf))
    await pg.pdf(path=OUT+'print-firsat.pdf', format='A4', print_background=True)
    await ctx.close()
    # failed category skipped
    ctx=await br.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page(); await stub(pg)
    await pg.route('**/sal.json*', lambda r: r.fulfill(status=500, body='x'))
    await pg.goto(B+'#/firsat'); await pg.wait_for_timeout(800)
    n=await pg.locator('#ft-body tr[data-row]').count(); note=await pg.inner_text('.fp-note')
    check('failed category skipped, not fatal', n==N-1 and 'yüklenemediği' in note, f'{n}')
    await ctx.close(); await br.close()
  print('RANKINGS:'); [print(' ',k,' > '.join(f'{a} {b}' for a,b in v)) for k,v in RANK.items()]
  print(sum(o for _,o in R),'/',len(R),'passed')
asyncio.run(main())
