import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import json, asyncio, sys
from playwright.async_api import async_playwright
B=BASE
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/><rect x="100" y="80" width="200" height="440" rx="30" fill="#557"/></svg>'
VP={'d':(1440,900),'t':(768,1024),'m':(390,844)}
ROUTES=[('home','#/'),('cat-termos','#/kategori/termos'),('cat-sweat','#/kategori/sweatshirt'),('cat-kedi','#/kategori/kedi-tirmalama'),('prod','#/urun/termos/748758153'),
 ('prod-empty1','#/urun/telefon-kilifi/169079728'),('prod-empty2','#/urun/telefon-kilifi/858914651'),('prod-empty3','#/urun/dogal-sabun/138018415'),
 ('cmp2','#/karsilastir'),('cmp4','#/karsilastir'),('cmp-empty','#/karsilastir'),('ara-hit','#/ara/kulakl%C4%B1k'),('ara-none','#/ara/bisiklet'),('ara-bebek','#/ara/bebek'),
 ('yontem','#/yontem'),('firsat','#/firsat'),('yakinda','#/kategori/bebek-arabasi'),('badcat','#/kategori/xyz'),('badprod','#/urun/termos/999'),('badprodcat','#/urun/xyz/1'),('badhash','#/foo/bar'),('ara-pct','#/ara/%'),('ara-pct2','#/ara/%25'),('ara-empty','#/ara/')]
CMP2=[{'cat':'termos','id':'780345921'},{'cat':'termos','id':'748758153'}]
CMP4=CMP2+[{'cat':'termos','id':'127482743'},{'cat':'termos','id':'81878270'}]
MEASURE='''() => {
 const W=document.documentElement.clientWidth, over=[];
 document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect(); if(r.width>0 && (r.right>W+1) && !e.closest('.ctable-box') && !e.closest('.filters') && getComputedStyle(e).position!=='fixed' && !e.closest('.band')) over.push(e.tagName+'.'+e.className+' r='+Math.round(r.right))});
 const broken=[...document.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth===0).length;
 return {title:document.title, sw:document.documentElement.scrollWidth, W, over:over.slice(0,5), broken};
}'''
async def main():
  out={}; bad=[]
  only=sys.argv[1:] 
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    for vk,(w,h) in VP.items():
      for theme in ['acik','krem','adacayi','koyu','gece']:
        if vk=='t' and theme not in ('acik','koyu'): continue
        ctx=await br.new_context(viewport={'width':w,'height':h}, color_scheme='light')
        pg=await ctx.new_page()
        await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        logs=[]
        pg.on('console', lambda m: logs.append((m.type, m.text[:200])) if m.type in('error','warning') and 'ERR_FAILED' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append(('pageerror',str(e)[:200])))
        await pg.goto(B); await pg.evaluate(f"localStorage.setItem('rr_theme','{theme}')")
        for name,hs in ROUTES:
          if only and name not in only: continue
          cm = CMP2 if name=='cmp2' else CMP4 if name=='cmp4' else []
          await pg.evaluate(f"localStorage.setItem('kyr_cmp', {json.dumps(json.dumps(cm))})")
          logs.clear()
          await pg.goto(B+hs); await pg.reload(); await pg.wait_for_timeout(500)
          m=await pg.evaluate(MEASURE); m['logs']=list(logs); m['url']=pg.url
          k=f'{vk}-{theme}-{name}'; out[k]=m
          if m['sw']>m['W'] or m['logs'] or m['over'] or m['broken']: bad.append((k,m))
          await pg.screenshot(path=outdir('full')+f'{k}.png', full_page=True)
        await ctx.close()
    await br.close()
  json.dump(out,open(outdir()+'measure.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
  print('checked',len(out),'bad',len(bad))
  for k,m in bad: print(k,m)
  for k in out:
    if k.startswith('d-light'): print(k, out[k]['title'], out[k]['url'][22:])
asyncio.run(main())
