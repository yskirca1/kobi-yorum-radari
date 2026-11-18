import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
"""Measured contrast per theme: computed colours of real elements (+ effective background, alpha-composited),
plus variable pairs for states that are hard to reach (hover tints, bar tracks, logo on header)."""
import asyncio, json, re, sys
from playwright.async_api import async_playwright
B=BASE
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="4" height="6"><rect width="4" height="6" fill="#fff"/></svg>'
TH=['acik','krem','adacayi','koyu','gece']
CMP=[{'cat':'termos','id':'780345921'},{'cat':'termos','id':'748758153'}]
# (route, label, selector, pseudo, threshold, kind)  kind: text (fg vs bg) | border (border vs bg) | fill (el bg vs parent bg)
CHECKS=[
 ('#/','body: heading ink on page','#home-list .sec-top h2',None,7,'text'),
 ('#/','body: card title ink on panel','.cat-name h3',None,7,'text'),
 ('#/','body: reading line text','.reads-list li a > span:last-child',None,7,'text'),
 ('#/','muted on page','.alan-f > .muted',None,4.5,'text'),
 ('#/','muted on card','.cat-fig-t .muted',None,4.5,'text'),
 ('#/','link on page','.reads-all',None,4.5,'text'),
 ('#/','link: header','.top-link',None,4.5,'text'),
 ('#/','card headline (top complaint)','.cat-h',None,7,'text'),
 ('#/','red % on card','a.cat-top',None,4.5,'text'),
 ('#/','red label on card','.cat-k',None,4.5,'text'),
 ('#/','button label (search)','.search button',None,4.5,'text'),
 ('#/','placeholder text','#hq','::placeholder',4.5,'text'),
 ('#/kategori/termos','search input border','#q',None,3,'border'),
 ('#/','hero heading','.hero h1',None,7,'text-hero'),
 ('#/','hero lead','.lead',None,4.5,'text-hero'),
 ('#/','hero example chip','.ex-chip',None,4.5,'text-hero'),
 ('#/','hero KPI label','.kpis dt',None,4.5,'text-hero'),
 ('#/','hero demo link','.hero-demo',None,4.5,'text-hero'),
 ('#/','footer text','.foot p',None,4.5,'text-foot'),
 ('#/','footer link','.foot a',None,4.5,'text-foot'),
 ('#/','chip selected','.alan-f .chip.on',None,4.5,'text'),
 ('#/','chip unselected','.alan-f .chip:not(.on)',None,4.5,'text'),
 ('#/','chip border','.alan-f .chip:not(.on)',None,3,'border'),
 ('#/','theme button border','#theme',None,3,'border'),
 ('#/kategori/termos','red % (top complaint)','.issues .p',None,4.5,'text'),
 ('#/kategori/termos','red big figure','.fact b.neg',None,4.5,'text'),
 ('#/kategori/termos','complaint bar vs track','.issues .bar i',None,3,'fill'),
 ('#/kategori/termos','KOBİ badge','.seg.kobi',None,4.5,'text'),
 ('#/kategori/termos','Büyük marka badge','.seg.buyuk',None,4.5,'text'),
 ('#/kategori/termos','red % pill on product card','.pc-meta dd.neg',None,4.5,'text'),
 ('#/kategori/termos','filter count pill','.fg label small',None,4.5,'text'),
 ('#/kategori/termos','recommendation text','.recs span',None,7,'text'),
 ('#/kategori/termos','recommendation number','.recs li',':before',4.5,'text-pseudo'),
 ('#/kategori/termos','summary note muted','.note',None,4.5,'text'),
 ('#/kategori/termos','ghost button label','#print-btn',None,4.5,'text'),
 ('#/kategori/termos','ghost button border','#print-btn',None,3,'border'),
 ('#/kategori/termos','select border','#sort',None,3,'border'),
 ('#/kategori/termos','green (liked) bar vs track','.hb.like .tr i',None,3,'fill'),
 ('#/urun/termos/748758153','product red stat','.pstats dd.neg',None,4.5,'text'),
 ('#/urun/termos/748758153','product body list','.card .ul li',None,7,'text'),
 ('#/urun/termos/748758153','red bar vs track (product)','.hb.neg .tr i',None,3,'fill'),
 ('#/urun/termos/748758153','outline button label','.btn.out',None,4.5,'text'),
 ('#/urun/termos/748758153','quote text','.q span',None,7,'text'),
 ('#/karsilastir','table header (row)','.ctable th',None,4.5,'text'),
 ('#/karsilastir','red % in table','.ctable td.neg',None,4.5,'text'),
 ('#/karsilastir','compare bar? (n/a: hidden on compare)',None,None,0,'skip'),
 ('#/firsat','score number','.ft-score',None,7,'text'),
 ('#/firsat','rank number','.ft-rank',None,4.5,'text'),
 ('#/firsat','table header (sort)','.ftable thead .ft-sort',None,4.5,'text'),
 ('#/firsat','table header (sorted)','.ftable thead th[aria-sort] .ft-sort',None,4.5,'text'),
 ('#/firsat','red % in fırsat table','.ftable td .neg',None,4.5,'text'),
 ('#/firsat','link in sticky column','.ftable tbody th a',None,4.5,'text'),
 ('#/firsat','score bar vs track','.ftable td .mbar:not(.neg) i',None,3,'fill'),
 ('#/firsat','red mini-bar vs track','.ftable td .mbar.neg i',None,3,'fill'),
 ('#/firsat','preset selected','.segctl input:checked + span',None,4.5,'text'),
 ('#/firsat','preset unselected','.segctl input:not(:checked) + span',None,4.5,'text'),
 ('#/firsat','preset border','.segctl input:not(:checked) + span',None,3,'border'),
 ('#/firsat','expand button','.ft-exp',None,4.5,'text'),
 ('#/firsat','filter select border','#ff-d',None,3,'border'),
 # v17
 ('#/','grammar legend text','.grammar .gm',None,4.5,'text'),
 ('#/','gloss text','.reads .gloss .gl',None,4.5,'text'),
 ('#/','term button','.reads .tip',None,4.5,'text'),
 ('#/','term button border','.reads .tip',None,3,'border'),
 ('#/kategori/termos','fact heading','.fact-h',None,4.5,'text'),
 ('#/kategori/termos','fact text','.fact-t',None,4.5,'text'),
 ('#/kategori/termos','segment % red','.fact-seg dd.neg',None,4.5,'text'),
 ('#/kategori/termos','section nav','.secnav button:not([aria-current])',None,4.5,'text'),
 ('#/kategori/termos','section nav current','.secnav button[aria-current]',None,4.5,'text'),
 ('#/urun/termos/748758153','product nav link','.pnav a',None,4.5,'text'),
 ('#/urun/termos/748758153','product nav position','.pnav .muted',None,4.5,'text'),
 # v21: cevap cümlesi, renk dili, resimli oranlar
 ('#/kategori/termos','answer sentence','.phead .answer',None,7,'text'),
 ('#/kategori/termos','red phrase in answer','.answer .t-neg',None,4.5,'text'),
 ('#/kategori/termos','step answer','.step-answer',None,7,'text'),
 ('#/kategori/termos','step number','.step-n',None,4.5,'text'),
 ('#/kategori/termos','green legend word','.grammar .gm-like b',None,4.5,'skip'),
 ('#/kategori/termos','pictogram filled vs track','.picto .on',None,3,'fill'),
 ('#/kategori/filtre-kahve/sevilen/lezzet','green big figure','.big.like',None,4.5,'text'),
 ('#/kategori/filtre-kahve/konu/skt','comparison bar value','.cb-v',None,4.5,'text'),
 ('#/urun/termos/748758153','verdict sub line','.answer-sub',None,4.5,'text'),
 ('#/','grammar green word','.gm-like b',None,4.5,'text'),
 ('#/','grammar turquoise word','.gm-act b',None,4.5,'text'),
 ('#/firsat','top-3 category link','.t3-a',None,4.5,'text'),
 ('#/firsat','top-3 reason','.t3-r',None,4.5,'text'),
]
# variable pairs: [fg, bg, threshold, label]
VARS=[('--like','--panel',4.5,'liked green on panel'),('--like','--bg',4.5,'liked green on page'),('--like-bar','--track',1.5,'liked bar vs track (info)'),('--neg','--subtle',4.5,'red % on hovered/tinted row'),('--neg','--neg-soft',4.5,'red on red tint'),('--kobi-ink','--brand-soft',4.5,'KOBİ badge (var)'),
 ('--muted','--subtle',4.5,'muted on subtle'),('--ink','--subtle',7,'ink on subtle'),('--brand','--subtle',4.5,'link on subtle'),('--brand-ink','--brand',4.5,'button label (var)'),
 ('--neg-ink','--neg',4.5,'first complaint number'),('--line-2','--panel',3,'control border on panel'),('--line-2','--bg',3,'control border on page'),('--line-2','--band',3,'control border on band'),
 ('--brand-2','--track',3,'teal bar vs track'),('--neg-bar','--track',3,'red bar vs track'),('--muted','--track',3,'grey bar (big brand) vs track'),
 ('--hero-muted','--hero-2',4.5,'hero muted on hero-2'),('--hero-accent','--hero-2',4.5,'hero accent on hero-2'),('--hero-ink','--hero-2',7,'hero ink on hero-2'),
 ('--foot-ink','--foot',4.5,'footer text (var)'),('--bg','--ink',4.5,'selected chip (var)'),('--focus','--panel',3,'focus ring on panel'),('--focus','--bg',3,'focus ring on page'),
 ('--logo-ink','--band',4.5,'logo wordmark on header'),('--logo-accent','--band',3,'logo "Radar" on header'),('--logo-bubble','--band',1.0,'logo bubble (info)')]
JS=r"""
([checks, vars]) => {
  const tmp=document.createElement('div'); document.body.appendChild(tmp);
  const resolve=(v)=>{tmp.style.color=v; return getComputedStyle(tmp).color;};
  const parse=(c)=>{ const n=c.match(/[\d.]+/g).map(Number); if(c.startsWith('color(')) return [n[0]*255,n[1]*255,n[2]*255,n.length>3?n[3]:1]; return [n[0],n[1],n[2],n.length>3?n[3]:1]; };
  const over=(top,bot)=>{const a=top[3]; return [top[0]*a+bot[0]*(1-a), top[1]*a+bot[1]*(1-a), top[2]*a+bot[2]*(1-a), 1];};
  const pseudoBg=(e)=>{ for (const ps of ['::before']) { const b=getComputedStyle(e,ps); if(b.content!=='none' && (e.classList.contains('band')||e.classList.contains('foot'))) {
        if(b.backgroundImage && b.backgroundImage!=='none') return [parse(resolve('var(--hero)')), parse(resolve('var(--hero-2)'))];
        const c=parse(b.backgroundColor); if(c[3]>0) return [c]; } } return null; };
  const effBg=(el)=>{ let stack=[]; for(let e=el;e;e=e.parentElement){ const c=parse(getComputedStyle(e).backgroundColor); if(c[3]>0) stack.push(c); if(c[3]>=1) return [stack.reduceRight((acc,x)=>acc?over(x,acc):x,null)];
        const pb=pseudoBg(e); if(pb) return pb.map(b=>stack.reduceRight((acc,x)=>over(x,acc),b)); }
      const base=parse(getComputedStyle(document.documentElement).backgroundColor); const b=base[3]>0?base:parse(getComputedStyle(document.body).backgroundColor);
      return [stack.reduceRight((acc,x)=>over(x,acc),b)]; };
  const out=[];
  for (const [label, sel, pseudo, th, kind] of checks) {
    if(kind==='skip') continue;
    const els=[...document.querySelectorAll(sel)].filter(e=>e.getClientRects().length);
    if(!els.length){ out.push({label, missing:true}); continue; }
    const el=els[0], cs=getComputedStyle(el, pseudo||null);
    let fg, bgs;
    if(kind==='border'){ fg=parse(cs.borderTopColor); bgs=effBg(el.parentElement); }
    else if(kind==='fill'){ fg=parse(cs.backgroundColor); bgs=effBg(el.parentElement); }
    else { fg=parse(cs.color); bgs = pseudo && pseudo!=='::placeholder' ? [ (()=>{const c=parse(cs.backgroundColor); return c[3]>0? over(c, effBg(el)[0]) : effBg(el)[0];})() ] : effBg(el); }
    out.push({label, th, fg, bgs: bgs.map(b=> fg[3]<1? b : b), fgc: bgs.map(b=> fg[3]<1? over(fg,b): fg)});
  }
  const vout=vars.map(([a,b,th,label])=>({label, th, fgc:[parse(resolve(`var(${a})`))], bgs:[parse(resolve(`var(${b})`))]}));
  tmp.remove(); return out.concat(vout);
}"""
def lum(c):
  f=lambda v: (v/255)/12.92 if v/255<=0.03928 else ((v/255+0.055)/1.055)**2.4
  return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])
def cr(a,b): la,lb=lum(a),lum(b); return (max(la,lb)+.05)/(min(la,lb)+.05)
hx=lambda c:'#%02x%02x%02x'%tuple(round(x) for x in c[:3])
async def main():
  fails=0; worst={}
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    ctx=await br.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page()
    await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
    await pg.route('**/fonts.g*/**', lambda r: r.abort())
    await pg.goto(B)
    for t in TH:
      await pg.evaluate(f"localStorage.setItem('rr_theme','{t}'); localStorage.removeItem('rr_firsat_w'); localStorage.setItem('kyr_cmp', {json.dumps(json.dumps(CMP))})")
      rows=[]
      routes=sorted(set(c[0] for c in CHECKS), key=lambda r:[c[0] for c in CHECKS].index(r))
      for i,r in enumerate(routes):
        await pg.goto(B+r); await pg.reload()
        first=[c[2] for c in CHECKS if c[0]==r and c[2]][0]
        await pg.wait_for_selector(first, state='attached', timeout=8000); await pg.wait_for_timeout(200)
        assert await pg.evaluate("document.documentElement.dataset.theme")==t
        ch=[[c[1],c[2],c[3],c[4],c[5]] for c in CHECKS if c[0]==r]
        res=await pg.evaluate(JS,[ch, VARS if i==0 else []])
        for x in res:
          if x.get('missing'): print(f'FAIL [{t}] {x["label"]}: element not found'); fails+=1; continue
          c=min(cr(f,b) for f,b in zip(x['fgc'],x['bgs']))
          rows.append((c/x['th'] if x['th']>1 else 99, c, x['th'], x['label'], hx(x['fgc'][0]), hx(x['bgs'][0])))
          if c < x['th']-0.005: print(f'FAIL [{t}] {x["label"]}: {c:.2f} < {x["th"]}  ({hx(x["fgc"][0])} on {hx(x["bgs"][0])})'); fails+=1
      rows.sort()
      worst[t]=rows[:3]
      by={th:min([r for r in rows if r[2]==th]) for th in (7,4.5,3)}
      worst[t]=[by[k] for k in (7,4.5,3)]
      print(f'[{t}] {len(rows)} pairs; tightest per class:', ' | '.join(f'{th}:1 {l} {c:.2f} ({f} on {b})' for th,(_,c,_x,l,f,b) in by.items()))
    await br.close()
  json.dump({t:[(l,round(c,2),th,f,b) for _,c,th,l,f,b in v] for t,v in worst.items()}, open(outdir()+'contrast.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
  print('CONTRAST', 'OK' if not fails else f'{fails} FAIL')
  sys.exit(1 if fails else 0)
asyncio.run(main())
