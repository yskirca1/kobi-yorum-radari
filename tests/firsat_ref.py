import json,os
D='/home/claude/kobi-yorum-radari/data/'
def ref():
  reg=json.load(open(D+'kategoriler.json')); out=[]
  for c in reg:
    if c.get('durum')!='hazir': continue
    try: d=json.load(open(D+c['id']+'.json'))
    except Exception as e: print('skip',c['id'],e); continue
    P=d['urunler']
    yaz=sum(p['yazili'] for p in P); dus=sum(p['yildiz'][0]+p['yildiz'][1] for p in P)
    big=[p for p in P if p['segment']!='KOBİ']; kobi=[p for p in P if p['segment']=='KOBİ']
    seg=lambda R: (sum(p['yildiz'][0]+p['yildiz'][1] for p in R)/sum(p['yazili'] for p in R)) if R else None
    n=sum(p['ornek_dusuk'] for p in P)
    tw=[(t['ad'], sum(p['sikayet'].get(t['id'],0)*p['ornek_dusuk'] for p in P)/n if n else 0) for t in d['temalar']]
    tw.sort(key=lambda x:-x[1])
    out.append(dict(id=c['id'],ad=d['ad'],ust=d['ust'],dusuk=dus/yaz,buyukPay=(sum(p['yazili'] for p in big)/yaz) if big else None,
      kobi=seg(kobi),buyuk=seg(big),sikayet=tw[0][0],sikayetV=tw[0][1],urun=len(P),okunan=sum(p.get('onerilen_n',100)+p['ornek_dusuk'] for p in P),yazili=yaz))
  return out
if __name__=='__main__':
  for r in sorted(ref(),key=lambda r:-r['dusuk']): print(r)

# ---- Giriş puanı: bağımsız referans ----
import math
COMPS=['rekabet','risk','sorun','kobi','talep']
PRESETS={'dengeli':[1,1,1,1,1],'guvenli':[1,3,1,2,1],'rakipsiz':[3,1,1,2,1],'fark':[1,1,3,1,2]}
def jsround(x): return math.floor(x+0.5)
def components(rows):
  def mm(vals):
    v=[x for x in vals if x is not None]; lo,hi=min(v),max(v)
    return lambda x: None if x is None else (50.0 if hi==lo else (x-lo)/(hi-lo)*100)
  diff=lambda r: (r['kobi']-r['buyuk']) if (r['kobi'] is not None and r['buyuk'] is not None) else None
  fr=mm([r['dusuk'] for r in rows]); fs=mm([r['sikayetV'] for r in rows]); fk=mm([diff(r) for r in rows]); ft=mm([math.log(r['yazili']/r['urun']) for r in rows])
  out={}
  for r in rows:
    d=diff(r)
    out[r['id']]={'rekabet':100*(1-(r['buyukPay'] or 0)),'risk':100-fr(r['dusuk']),'sorun':fs(r['sikayetV']),
      'kobi':None if d is None else 100-fk(d),'talep':ft(math.log(r['yazili']/r['urun']))}
  return out
def scores(rows,w):
  C=components(rows); W=[1]*5 if not any(w) else w; res={}
  for r in rows:
    c=C[r['id']]; ws=[0 if c[k] is None else W[i] for i,k in enumerate(COMPS)]
    if not any(ws): ws=[0 if c[k] is None else 1 for k in COMPS]
    res[r['id']]=sum(ws[i]*c[k] for i,k in enumerate(COMPS) if ws[i])/sum(ws)
  order=sorted(rows,key=lambda r:(-jsround(res[r['id']]),r['dusuk']))
  return {r['id']:jsround(res[r['id']]) for r in rows}, [r['id'] for r in order], C
