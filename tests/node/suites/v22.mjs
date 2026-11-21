// v22 kimlik: lacivert ana renk, kehribar birincil çağrı, Fira Sans, kırmızı ve yeşil yerinde, eski tema kayıtları, sürüm ?v=22.
const resolve = (v) => `(()=>{const p=document.createElement('i');p.style.color='var(${v})';document.body.appendChild(p);const c=getComputedStyle(p).color;p.remove();return c})()`;

export default async function ({ browser, base: BASE, check }) {
  const pg = await browser.page({ width: 1280, height: 900 });
  await pg.goto(BASE + '#/', 200);
  await pg.eval(`localStorage.setItem('rr_theme','acik'); true`);
  await pg.goto('about:blank', 50); await pg.goto(BASE + '#/', 1300);

  const prim = await pg.eval(`getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim().toLowerCase()`);
  check('kimlik: açık temada ana renk', prim === '#1e40af', prim);

  const ff = await pg.eval(`getComputedStyle(document.body).fontFamily`);
  check('kimlik: yazı tipi Fira Sans', /^"?Fira Sans"?/.test(ff), ff);

  const ara = await pg.eval(`(()=>{const b=document.querySelector('#hsearch button[type=submit], #hsearch button'); return b?getComputedStyle(b).backgroundColor:null})()`);
  const acc = await pg.eval(resolve('--color-accent'));
  check('kimlik: Ara düğmesi kehribar', !!ara && ara === acc, `${ara} vs ${acc}`);

  const neg = await pg.eval(resolve('--neg')), like = await pg.eval(resolve('--like'));
  check('kimlik: kırmızı ve yeşil yerinde', neg === 'rgb(168, 69, 47)' && like === 'rgb(47, 107, 43)', `${neg} ${like}`);

  const src = await pg.eval(`document.querySelector('script[src*="app.js"]').src`);
  check('sürüm: ?v=22', src.endsWith('v=22'), src);

  await pg.goto('about:blank', 50); await pg.goto(BASE + '#/kategori/termos', 1500);
  const pr = await pg.eval(resolve('--color-primary')), body = await pg.eval(`getComputedStyle(document.body).color`);
  // öneri kanıt bağlantısı (rakam bağlantısı a.go): oku lacivert; yazı bağlantısı (ör. "Tüm ürünler", geri, bölüm bağlantısı) kendi rengiyle lacivert
  const link = await pg.eval(`(()=>{const go=document.querySelector('#app .recs .rec-ev a.go') || document.querySelector('#app a.go');
    const txt=[...document.querySelectorAll('#app a, #app .linkbtn')].filter(a=>a.getClientRects().length && !a.matches('a.go')).map(a=>getComputedStyle(a).color);
    return {go:go?getComputedStyle(go,'::after').color:null, txt:[...new Set(txt)]}})()`);
  check('kimlik: bağlantı lacivert, gövde yazısı değil', link.go === pr && link.txt.includes(pr) && body !== pr, JSON.stringify({ link, pr, body }));

  // üst çubuktaki "Ara" da kehribar
  await pg.goto('about:blank', 50); await pg.goto(BASE + '#/kategori/termos', 1300);
  const ara2 = await pg.eval(`getComputedStyle(document.querySelector('#search button')).backgroundColor`);
  check('kimlik: üst çubuk Ara düğmesi kehribar', ara2 === acc, `${ara2} vs ${acc}`);

  // Renk anlamı: ana renk (ve üzerine gelme / ikincil tonu) yalnızca tıklanır öğede ya da bir denetimin seçili halinde.
  // Tek bilinçli istisna: renk dili açıklaması (.grammar), "Lacivert tıklanır" anahtarı rengi göstermek zorunda.
  const PRIM = `(()=>{const r=v=>{const p=document.createElement('i');p.style.color='var('+v+')';document.body.appendChild(p);const c=getComputedStyle(p).color;p.remove();return c};
    const P=['--color-primary','--color-primary-hover','--color-secondary'].map(r);
    const OK='a[href],button,summary,input,select,label,[role=tab],[role=button],[aria-current],[aria-pressed],[aria-selected],.grammar';
    const sel=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\\s+/).join('.'):'');
    const bad=new Set();
    for(const e of document.querySelectorAll('#app *')){
      if(!e.getClientRects().length) continue;
      const cs=getComputedStyle(e); if(cs.visibility==='hidden') continue;
      const hits=[['color',cs.color],['bg',cs.backgroundColor],['border-top',cs.borderTopColor]].filter(([,v])=>P.includes(v)).map(([k])=>k);
      for(const ps of ['::before','::after','::marker']){const c=getComputedStyle(e,ps); if(c.content!=='none'||ps==='::marker'){ if(P.includes(c.color)&&(ps!=='::marker'||cs.display==='list-item')) hits.push(ps);} }
      if(hits.length && !e.closest(OK)) bad.add(sel(e)+' ['+[...new Set(hits)].join(',')+']');
    }
    return [...bad]})()`;
  const where = {};
  for (const h of ['#/', '#/kategori/termos', '#/urun/termos/780345921', '#/karsilastir', '#/firsat']) {
    if (h === '#/karsilastir') await pg.eval(`localStorage.setItem('kyr_cmp', JSON.stringify([{cat:'termos',id:'780345921'},{cat:'termos',id:'764617800'}])); true`);
    await pg.goto('about:blank', 50); await pg.goto(BASE + h, 1500);
    await pg.eval('document.getAnimations().forEach(a=>a.finish()); true');
    const b = await pg.eval(PRIM);
    if (b.length) where[h] = b;
  }
  await pg.eval(`localStorage.removeItem('kyr_cmp'); true`);
  check('renk anlamı: lacivert yalnızca tıklanırda', !Object.keys(where).length, JSON.stringify(where));

  const want = { light: 'acik', dark: 'koyu', acik: 'acik', krem: 'krem', adacayi: 'adacayi', koyu: 'koyu', gece: 'gece' };
  const got = {};
  for (const k of Object.keys(want)) {
    await pg.eval(`localStorage.setItem('rr_theme','${k}'); true`);
    await pg.goto('about:blank', 50); await pg.goto(BASE + '#/', 600);
    got[k] = await pg.eval('document.documentElement.dataset.theme');
  }
  check('tema: eski kayıtlar', JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));

  // Logo: balon ana renkte, dosyalarda eski turkuaz yok, paylaşım görseli yükleniyor
  await pg.eval(`localStorage.setItem('rr_theme','acik'); true`);
  await pg.goto('about:blank', 50); await pg.goto(BASE + '#/', 900);
  const lg = await pg.eval(`(()=>{const p=document.querySelector('a.logo .logo-svg path');const r=document.createElement('i');r.style.color='var(--logo-bubble)';document.body.appendChild(r);const c=getComputedStyle(r).color;r.remove();
    return {fill:p?getComputedStyle(p).fill:null, tok:c, raw:getComputedStyle(document.documentElement).getPropertyValue('--logo-bubble').trim().toLowerCase()}})()`);
  check('logo: balon ana renkte', !!lg.fill && lg.fill === lg.tok && lg.raw === '#1e40af', JSON.stringify(lg));

  const svgs = ['favicon.svg', 'logo/reviewradar_ikon.svg', 'logo/reviewradar_logo_acik.svg', 'logo/reviewradar_logo_koyu.svg', 'logo/reviewradar_logo_seffaf.svg'];
  const found = await pg.eval(`(async()=>{const bad=[];for(const f of ${JSON.stringify(svgs)}){const t=(await (await fetch(f)).text()).toLowerCase();for(const c of ['14b8a6','0d9488','2dd4bf','0d8a7f']) if(t.includes(c)) bad.push(f+':'+c)}return bad})()`);
  check('logo: dosyalarda turkuaz kalmadı', !found.length, JSON.stringify(found));

  const og = await pg.eval(`(async()=>{const u='logo/reviewradar_logo_acik.png';const r=await fetch(u);const w=await new Promise(res=>{const i=new Image();i.onload=()=>res(i.naturalWidth);i.onerror=()=>res(0);i.src=u+'?t='+Date.now()});return {status:r.status,w}})()`);
  check('logo: og görseli yükleniyor', og.status === 200 && og.w === 2166, JSON.stringify(og));

  check('konsol temiz', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
  await pg.close();

  await phoneCategory(browser, BASE, check);
  await methodAndFirsat(browser, BASE, check);
  await homeAndStars(browser, BASE, check);
}

// Görünür: kutusu var ve kapalı bir <details> ya da hidden="until-found" içinde değil (checkVisibility içerik görünürlüğüne de bakar)
const VIS = `(e)=>!!e && e.getClientRects().length>0 && e.checkVisibility()`;
const until = async (pg, expr, ms = 6000) => { for (let i = 0; i < ms / 100; i++) { if (await pg.eval(expr)) return true; await new Promise((r) => setTimeout(r, 100)); } return false; };

// Görev 4: kategori sayfası telefonda (satır kartlar, ilk 4 ürün, kapalı kontrol listesi, kapalı sevilen listesi)
async function phoneCategory(browser, BASE, check) {
  const ph = await browser.page({ width: 375, height: 812, mobile: true });
  const state = `(()=>{const V=${VIS};const m=document.getElementById('p-more');const rest=m&&document.getElementById(m.getAttribute('aria-controls'));
    const cards=[...document.querySelectorAll('#pgrid .pc')];const c=cards[0],i=c&&c.querySelector('.pc-img');
    return {all:cards.length, vis:cards.filter(V).length, h:c?c.getBoundingClientRect().height:0, iw:i?i.getBoundingClientRect().width:0, ih:i?i.getBoundingClientRect().height:0,
      more:m?m.textContent.trim():null, exp:m?m.getAttribute('aria-expanded'):null, hid:rest?rest.getAttribute('hidden'):null,
      zero:[...document.querySelectorAll('#app *')].some(e=>V(e)&&!e.children.length&&e.textContent.includes('(0)'))}})()`;
  await ph.goto(BASE + '#/kategori/filtre-kahve', 1500);
  let s = await ph.eval(state);
  check('telefon: ürünler satır kart', s.h > 0 && s.h < 140 && s.iw > 0 && s.iw <= 80, JSON.stringify(s));
  check('telefon: ilk 4 ürün, kalanı kapalı', s.vis === 4 && s.more === 'Tüm ürünleri göster (13)' && s.exp === 'false', JSON.stringify(s));
  check('sayfa içi arama: kalan ürünler hidden="until-found"', s.hid === 'until-found', JSON.stringify(s));
  const sh = await ph.eval('document.documentElement.scrollHeight / 812');
  console.log(`  ölçüm: #/kategori/filtre-kahve telefonda ${sh.toFixed(1)} ekran (v21: 20,3; hedef en çok 8)`);
  check('ölçüm: kategori telefonda kısaldı', sh < 20.3 / 2, sh.toFixed(2));
  const ck = await ph.eval(`(()=>{const d=document.getElementById('ck-fold');return d?{open:d.open,sum:d.querySelector('summary').textContent.replace(/\\s+/g,' ')}:null})()`);
  check('telefon: kontrol listesi kapalı, sayaç görünür', ck && !ck.open && ck.sum.includes('0 / 11 işaretlendi'), JSON.stringify(ck));
  const lk = await ph.eval(`(()=>{const V=${VIS};const rows=[...document.querySelectorAll('.liked .hb')];const b=document.getElementById('like-more');return {all:rows.length,vis:rows.filter(V).length,exp:b?b.getAttribute('aria-expanded'):null}})()`);
  check('telefon: sevilen listede ilk 4 satır', lk.all > 4 ? lk.vis === 4 && lk.exp === 'false' : lk.vis === lk.all, JSON.stringify(lk));
  await ph.click('#p-more', 300);
  s = await ph.eval(state);
  check('telefon: tümünü göster açar', s.vis === 13 && s.exp === 'true' && s.more === 'Daha az göster', JSON.stringify(s));
  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/kategori/filtre-kahve', 1300);
  await ph.eval(`(()=>{const m=document.getElementById('p-more');document.getElementById(m.getAttribute('aria-controls')).dispatchEvent(new Event('beforematch'));return true})()`);
  s = await ph.eval(state);
  check('sayfa içi arama: beforematch listeyi açar', s.exp === 'true' && s.vis === 13, JSON.stringify(s));

  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/kategori/filtre-kahve?sirala=cok&tip=kobi', 1300);
  s = await ph.eval(state);
  check('telefon: süzgeçli adres açık gelir', s.vis === 7 && s.all === 7 && s.more === null, JSON.stringify(s));

  // 4 ya da daha az ürün bırakan ilk süzgeç (veriden hesaplanır)
  const few = await ph.eval(`(async()=>{const j=await (await fetch('data/kedi-tirmalama.json')).json();const D=[['10-alti',0,.1],['10-20',.1,.2],['20-ustu',.2,1.01]];
    for(const [k,lo,hi] of D){const n=j.urunler.filter(p=>{const d=(p.yildiz[0]+p.yildiz[1])/p.yazili;return d>=lo&&d<hi}).length; if(n>=1&&n<=4) return {k,n};} return null})()`);
  if (few) {
    await ph.goto('about:blank', 50); await ph.goto(BASE + '#/kategori/kedi-tirmalama?dusuk=' + few.k, 1300);
    s = await ph.eval(state);
    check('telefon: 4 ve altı üründe düğme yok', s.vis === few.n && s.more === null && !s.zero, JSON.stringify({ few, s }));
  } else check('telefon: 4 ve altı üründe düğme yok (süzgeç bulunamadı)', false);

  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/kategori/termos', 200);
  await ph.eval(`localStorage.setItem('rr_ck_termos','["t:isi"]'); true`);
  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/kategori/termos', 1300);
  const ck2 = await ph.eval(`(()=>{const d=document.getElementById('ck-fold');return d?{open:d.open,sum:d.querySelector('summary').textContent.replace(/\\s+/g,' ')}:null})()`);
  check('telefon: işaret varsa açık gelir', ck2 && ck2.open && ck2.sum.includes('1 / 11'), JSON.stringify(ck2));
  await ph.eval(`localStorage.removeItem('rr_ck_termos'); true`);

  // Varış vurgusu: doğrudan açılan süzgeçli adres; vurgulanan öğe görünür alanda
  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/kategori/filtre-kahve?tip=kobi', 200);
  const got = await until(ph, `!!document.querySelector('[data-arriving]')`);
  const ar = await ph.eval(`[...document.querySelectorAll('[data-arriving]')].map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.tagName,ok:${VIS}(e)&&r.top>=0&&r.top<innerHeight}})`);
  check('telefon: varış vurgusu görünür alanda', got && ar.length && ar.every((x) => x.ok), JSON.stringify(ar));
  check('telefon: konsol temiz', !ph.errors.length && !ph.logs.length, JSON.stringify([ph.errors, ph.logs]));
  await ph.close();

  const dk = await browser.page({ width: 1280, height: 900 });
  await dk.goto(BASE + '#/kategori/filtre-kahve', 1500);
  const d = await dk.eval(`(()=>{const V=${VIS};const lk=[...document.querySelectorAll('.liked .hb')];return {vis:[...document.querySelectorAll('#pgrid .pc')].filter(V).length, more:!!document.getElementById('p-more'), ck:document.getElementById('ck-fold')?.open, like:lk.filter(V).length===lk.length, cols:getComputedStyle(document.getElementById('pgrid')).gridTemplateColumns.split(' ').length}})()`);
  check('masaüstü: ızgara ve açık liste değişmedi', d.vis === 13 && !d.more && d.ck === true && d.like && d.cols >= 3, JSON.stringify(d));
  await dk.close();
}

// Görev 5: Yöntem içindekiler ve katlanır bölümler; fırsat telefonda kısa satırlar
async function methodAndFirsat(browser, BASE, check) {
  const ph = await browser.page({ width: 375, height: 812, mobile: true });
  await ph.goto(BASE + '#/yontem', 1500);
  const toc = await ph.eval(`(()=>{const a=[...document.querySelectorAll('#m-toc a')];const s=[...document.querySelectorAll('.m-sec')];
    return {n:a.length, secs:s.length, hrefs:a.map(x=>x.getAttribute('href')), bad:a.map(x=>x.getAttribute('href')).filter(h=>!/^#\\/yontem\\/[a-z-]+$/.test(h)), open:s.filter(d=>d.open).map(d=>d.id), label:document.getElementById('m-toc')?.getAttribute('aria-label')}})()`);
  check('yöntem: içindekiler', toc.n > 0 && toc.n === toc.secs && !toc.bad.length && toc.label === 'Bu sayfada', JSON.stringify(toc));
  check('yöntem: telefonda bölümler kapalı', toc.secs > 0 && !toc.open.length, JSON.stringify(toc.open));
  const ysh = await ph.eval('document.documentElement.scrollHeight / 812');
  console.log(`  ölçüm: #/yontem telefonda ${ysh.toFixed(1)} ekran (v21: 11,2; hedef en çok 5)`);
  check('ölçüm: yöntem telefonda kayıt', ysh > 0, ysh);

  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/yontem/oran', 200);
  const seen = await until(ph, `!!document.querySelector('#y-oran[data-arriving]')`);
  const o = await ph.eval(`(()=>{const d=document.getElementById('y-oran');const h=d.querySelector('summary h2').getBoundingClientRect();return {open:d.open, inView:h.top>=0&&h.bottom<=innerHeight, others:[...document.querySelectorAll('.m-sec[open]')].map(x=>x.id)}})()`);
  check('yöntem: adresteki bölüm açık ve vurgulu', seen && o.open && o.inView && o.others.length === 1, JSON.stringify({ seen, o }));

  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/yontem', 1300);
  await ph.mclick('#m-toc a[href="#/yontem/alinti"]', 1200);
  const al = await ph.eval(`({h:location.hash, open:document.getElementById('y-alinti')?.open})`);
  check('yöntem: içindekilerden tıklayınca açılır', al.h === '#/yontem/alinti' && al.open === true, JSON.stringify(al));

  // fırsat: ilk üç kart kalır, kalan her kategori kısa satır
  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/firsat', 1800);
  const fz = await ph.eval(`(()=>{const V=${VIS};const r=[...document.querySelectorAll('.fz-row')];const f=r[0];
    return {n:r.length, open:r.filter(d=>d.open).length, t3:[...document.querySelectorAll('#t3 .t3c')].filter(V).length, first:f?f.querySelector('summary').textContent.replace(/\\s+/g,' ').trim():'', row:f?f.closest('[data-row]').dataset.row:'', h:f?f.getBoundingClientRect().height:0}})()`);
  const rows = await ph.eval(`(async()=>{const reg=(await (await fetch('data/kategoriler.json')).json()).filter(c=>c.durum==='hazir');const out=[];
    for(const c of reg){const j=await (await fetch('data/'+c.id+'.json')).json();const y=j.urunler.reduce((a,p)=>a+p.yazili,0),d=j.urunler.reduce((a,p)=>a+p.yildiz[0]+p.yildiz[1],0);out.push({id:c.id,ad:j.ad||c.ad,dusuk:d/y})}return out})()`);
  const firstAd = (rows.find((r) => r.id === fz.row) || {}).ad || '';
  const score = await ph.eval(`document.querySelector('.fc[data-row="${fz.row}"] .fz-score')?.textContent.trim()`);
  check('fırsat: telefonda kısa satırlar', fz.n === 12 && fz.open === 0 && fz.t3 === 3 && fz.first.includes(firstAd) && !!score && fz.first.includes(score) && fz.h < 90, JSON.stringify({ fz, firstAd, score }));
  await ph.mclick('.fz-row > summary', 500);
  const det = await ph.eval(`(()=>{const V=${VIS};const f=document.querySelector('.fz-row');const b=f.querySelector('.ft-exp');return {open:f.open, btn:V(b)&&b.textContent.includes('Puan ayrıntısı')}})()`);
  check('fırsat: satır açılınca ayrıntı', det.open && det.btn, JSON.stringify(det));
  await ph.eval(`(()=>{const s=document.getElementById('fm-sort');s.value='dusuk';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await new Promise((r) => setTimeout(r, 400));
  const top = [...rows].sort((a, b) => b.dusuk - a.dusuk)[0];
  const f2 = await ph.eval(`document.querySelector('.fz-row')?.closest('[data-row]').dataset.row`);
  check('fırsat: sıralama korunur', f2 === top.id && f2 !== fz.row, JSON.stringify({ f2, want: top.id, before: fz.row }));
  await ph.goto('about:blank', 50); await ph.goto(BASE + '#/firsat', 1800);
  const fsh = await ph.eval('document.documentElement.scrollHeight / 812');
  console.log(`  ölçüm: #/firsat telefonda ${fsh.toFixed(1)} ekran (v21: 7,8; hedef en çok 5)`);
  check('ölçüm: fırsat telefonda kayıt', fsh > 0, fsh);
  check('yöntem ve fırsat: konsol temiz', !ph.errors.length && !ph.logs.length, JSON.stringify([ph.errors, ph.logs]));
  await ph.close();

  const dk = await browser.page({ width: 1280, height: 900 });
  await dk.goto(BASE + '#/yontem', 1500);
  const all = await dk.eval(`(()=>{const s=[...document.querySelectorAll('.m-sec')];return {n:s.length, open:s.filter(d=>d.open).length}})()`);
  check('yöntem: masaüstünde hepsi açık', all.n > 0 && all.open === all.n, JSON.stringify(all));
  await dk.close();
}

// Görev 6: ana sayfada görünür fotoğraflar, ürün sayfasında yıldız çubuğu
async function homeAndStars(browser, BASE, check) {
  const box = `(()=>{const i=document.querySelector('.cat .cat-img img');const r=i.closest('.cat-img').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),fit:getComputedStyle(i).objectFit,aw:i.getAttribute('width'),ah:i.getAttribute('height')}})()`;
  const res = {};
  for (const [w, h, mob, W, H] of [[1280, 900, false, 96, 128], [375, 812, true, 72, 96]]) {
    const pg = await browser.page({ width: w, height: h, mobile: mob });
    await pg.goto(BASE + '#/', 1500);
    res[w] = await pg.eval(box);
    res[w].ok = Math.abs(res[w].w - W) <= 1 && Math.abs(res[w].h - H) <= 1 && res[w].fit === 'contain' && !!res[w].aw && !!res[w].ah;
    if (w === 1280) {
      const t = await pg.eval(`document.querySelector('.cat[data-cat="termos"] .cat-h')?.textContent.trim()`);
      check('ana sayfa: kart başlığı şikâyet', t === 'Isıyı tutmuyor', t);
    }
    await pg.close();
  }
  check('ana sayfa: fotoğraf kutusu', res[1280].ok && res[375].ok, JSON.stringify(res));

  const pg = await browser.page({ width: 1280, height: 900 });
  await pg.goto(BASE + '#/urun/termos/780345921', 1500);
  const sb = await pg.eval(`(async()=>{const j=await (await fetch('data/termos.json')).json();const p=j.urunler.find(u=>u.id==='780345921');
    const bar=document.querySelector('.stars-bar');if(!bar) return {none:true};
    const seg=[...bar.children];const sum=seg.reduce((a,e)=>a+e.getBoundingClientRect().width,0);
    const want=[5,4,3,2,1].map(s=>'%'+(p.yildiz[s-1]/p.yazili*100).toFixed(0));
    const shown=[...document.querySelectorAll('.stars-leg b')].map(b=>b.textContent.trim());
    return {n:seg.length, sum, bw:bar.getBoundingClientRect().width, want, shown, inV:!!bar.closest('.verdict'), role:bar.getAttribute('role'), label:bar.getAttribute('aria-label')||'',
      head:[...document.querySelectorAll('h1,h2,h3,h4')].some(h=>/Yıldız dağılımı/.test(h.textContent))}})()`);
  check('ürün: yıldız çubuğu', !sb.none && sb.n === 5 && Math.abs(sb.sum - sb.bw) <= 2 && JSON.stringify(sb.want) === JSON.stringify(sb.shown) && sb.inV && !sb.head, JSON.stringify(sb));
  check('ürün: çubuğun metin karşılığı', sb.role === 'img' && (sb.want || []).every((x) => sb.label.includes(x)), JSON.stringify(sb));
  check('ana sayfa ve ürün: konsol temiz', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
  await pg.close();
}

