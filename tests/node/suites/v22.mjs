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
  await resilience(browser, BASE, check);
  await copyText(browser, BASE, check);
  await audit(browser, BASE, check);
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

// Görev 7: fotoğraf ya da yazı tipi gelmezse sayfa bozulmuyor; yükleme sırasında sayfa oynamıyor
async function resilience(browser, BASE, check) {
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const routes = ['#/', '#/kategori/termos'];
  const eager = `document.querySelectorAll('img[loading=lazy]').forEach(i=>{i.loading='eager'}); true`;
  const boxes = `[...document.querySelectorAll('.cat, .pc')].map(e=>Math.round(e.getBoundingClientRect().height*10)/10)`;
  const lead = `(()=>{const e=document.querySelector('#app .answer, #app .lead');const r=e.getBoundingClientRect();const lh=parseFloat(getComputedStyle(e).lineHeight);return {h:r.height, lines:Math.round(r.height/lh)}})()`;
  const open = async (pg, r, wait = 2500) => { await pg.goto('about:blank', 50); await pg.goto(BASE + '?r=' + Date.now() + r, 300); await pg.eval(eager); await pause(wait); };
  for (const [w, h, mob] of [[375, 812, true], [1280, 900, false]]) {
    const tag = w < 700 ? 'telefon' : 'masaüstü';
    const ok = await browser.page({ width: w, height: h, mobile: mob });
    const noImg = await browser.page({ width: w, height: h, mobile: mob, block: ['dsmcdn.com'] });
    const noFont = await browser.page({ width: w, height: h, mobile: mob, block: ['fonts.gstatic.com'] });
    for (const r of routes) {
      await open(ok, r);
      const base = { b: await ok.eval(boxes), l: await ok.eval(lead) };
      // kayma: ilk 4 saniyedeki layout-shift toplamı (kullanıcı girdisi olmadan)
      await ok.goto('about:blank', 50); await ok.goto(BASE + '?c=' + Date.now() + r, 4000);
      const cls = await ok.eval(`new Promise(res=>{let s=0;new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput&&e.startTime<4000) s+=e.value; res(s)}).observe({type:'layout-shift',buffered:true}); setTimeout(()=>res(s),300)})`);
      check(`kayma yok: ${tag} ${r}`, cls < 0.1, cls.toFixed(4));

      await open(noImg, r, 3500);
      const ph = await noImg.eval(`(()=>{const B=[...document.querySelectorAll('.cat-img, .pc-img, .prod-img')];
        return {n:B.length, ph:B.filter(b=>b.querySelector('.img-ph svg')).length, broken:[...document.querySelectorAll('#app img')].filter(i=>i.getClientRects().length&&i.complete&&!i.naturalWidth).length,
          aria:B.every(b=>{const p=b.querySelector('.img-ph');return !p||p.getAttribute('aria-hidden')==='true'||p.getAttribute('role')==='img'})}})()`);
      check(`fotoğraf yok: yer tutucu (${tag} ${r})`, ph.n > 0 && ph.ph === ph.n && !ph.broken && ph.aria, JSON.stringify(ph));
      const b2 = await noImg.eval(boxes);
      check(`fotoğraf yok: kutu aynı (${tag} ${r})`, b2.length === base.b.length && b2.every((x, i) => Math.abs(x - base.b[i]) <= 1), JSON.stringify({ base: base.b, now: b2 }));

      await open(noFont, r, 3000);
      const f = await noFont.eval(`({fira:document.fonts.check('1rem "Fira Sans"'), l:${lead}})`);
      check(`yazı tipi yok: sayfa okunur (${tag} ${r})`, f.fira === false && f.l.h > 0 && Math.abs(f.l.lines - base.l.lines) <= 1, JSON.stringify({ f, base: base.l }));
    }
    check(`fotoğraf ve yazı tipi yok: konsol temiz (${tag})`, ![ok, noImg, noFont].some((p) => p.errors.length), JSON.stringify([ok.errors, noImg.errors, noFont.errors]));
    for (const p of [ok, noImg, noFont]) await p.close();
  }
}

// Görev 8: arayüz metni. Her sayfa türünde (11 tür) sayfanın bütün metni (kapalı bölümler, "?" açıklamaları, aria-label, title, placeholder ve sekme başlığı dahil)
// uzun tire, yanlış terim ve eski "turkuaz" içermez. Veri dosyalarından gelen metin (öneri metni, ürünün "dikkat"/"ders" notları, müşteri alıntıları) kapsam dışı:
// data/ düzenlenmez ve bazı notlarda "1-2 yıldız oranı" yazıyor (raporda kayıtlı).
async function copyText(browser, BASE, check) {
  const pg = await browser.page({ width: 1280, height: 900 });
  const DATA = '.recs li > span:not([class]), .cgrid .ul, blockquote';
  const routes = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve/konu/skt', '#/kategori/filtre-kahve/sevilen/lezzet', '#/urun/filtre-kahve/52915799',
    '#/urun/filtre-kahve/52915799/konu/skt', '#/karsilastir', '#/ara/karaca', '#/firsat', '#/yontem', '#/kategori/yok'];
  const text = `(()=>{const b=document.body.cloneNode(true);b.querySelectorAll('script, ${DATA}').forEach(e=>e.remove());
    const at=[...b.querySelectorAll('[aria-label],[title],[placeholder]')].map(e=>[e.getAttribute('aria-label'),e.getAttribute('title'),e.getAttribute('placeholder')].filter(Boolean).join(' '));
    return [document.title, b.textContent, ...at].join(' ')})()`;
  const bad = { dash: {}, term: {}, tur: {} };
  for (const h of routes) {
    await pg.goto('about:blank', 50); await pg.goto(BASE + h, 1500);
    if (h === '#/karsilastir') {
      // iki ürün: verideki ilk iki filtre kahve
      await pg.eval(`(async()=>{const j=await (await fetch('data/filtre-kahve.json')).json();localStorage.setItem('kyr_cmp',JSON.stringify(j.urunler.slice(0,2).map(p=>({cat:'filtre-kahve',id:p.id}))));return true})()`);
      await pg.goto('about:blank', 50); await pg.goto(BASE + h, 1500);
    }
    const t = await pg.eval(text);
    const ctx = (re) => { const m = re.exec(t); return m ? t.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ') : null; };
    const d = ctx(/—/), tm = ctx(/1-2 yıldız oranı|şikâyet payı|şikayet payı/i), tu = ctx(/turkuaz/i);
    if (d) bad.dash[h] = d; if (tm) bad.term[h] = tm; if (tu) bad.tur[h] = tu;
    if (h === '#/karsilastir') { const n = await pg.eval(`document.querySelectorAll('.ctable td.num').length`); if (!n) bad.term[h] = 'karşılaştırma tablosu çizilmedi'; }
  }
  await pg.eval(`localStorage.removeItem('kyr_cmp'); true`);
  check('metin: uzun tire yok (11 sayfa türü)', !Object.keys(bad.dash).length, JSON.stringify(bad.dash));
  check('metin: terimler (1-2 yıldız payı, şikâyet oranı)', !Object.keys(bad.term).length, JSON.stringify(bad.term));
  check('metin: turkuaz kalmadı', !Object.keys(bad.tur).length, JSON.stringify(bad.tur));
  check('metin: konsol temiz', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
  await pg.close();
}

// Görev 9: UI UX Pro Max kural denetiminin ölçülebilen kuralları (docs/superpowers/specs/2026-11-21-kural-denetimi.md).
const ALL_ROUTES = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve/konu/skt', '#/kategori/filtre-kahve/sevilen/lezzet', '#/urun/filtre-kahve/52915799',
  '#/urun/filtre-kahve/52915799/konu/skt', '#/karsilastir', '#/ara/karaca', '#/firsat', '#/yontem', '#/kategori/yok'];
// Bilerek 44 px'in altında bırakılanlar (seçici: neden). Denetim tablosunda "bilerek bırakıldı".
const TOUCH_OK = {
  'a.pc-name': 'telefonda ürün satırındaki ad (2 satır, 40 px); aynı ürüne giden 64x84 fotoğraf bağlantısı hemen solunda (WCAG 2.5.8 eşdeğer hedef). Satır 140 px altında kalsın diye ad büyütülmedi.',
};
// Dokunma alanı: öğenin kutusu, konumlu ::before/::after ile genişletilmiş alanı dahil (ör. "?" düğmesinin görünmez çerçevesi)
// MIN 24 (fare, WCAG 2.5.8): küçük hedef, merkezine konan 24 px çaplı daire başka bir hedefe ya da başka küçük hedefin dairesine değmiyorsa geçer (aralık istisnası).
const TOUCH = (MIN = 44) => `(()=>{
  const SEL='a[href], button, summary, input:not([type=hidden]), select, label[for], label:has(input)';
  const sel=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\s+/)[0]:'');
  const vis=e=>e.getClientRects().length>0&&e.checkVisibility({visibilityProperty:true,opacityProperty:true});
  const blockOf=e=>{let x=e.parentElement;while(x&&getComputedStyle(x).display.startsWith('inline'))x=x.parentElement;return x};
  const T=[];
  for(const e of document.querySelectorAll(SEL)){
    if(!e.closest('#app, .top')||!vis(e)) continue;
    if(e.matches('input')&&e.closest('label')) continue;
    if(e.matches('input')){const r=e.getBoundingClientRect(); if(r.width<=2||r.height<=2) continue;}
    if(e.closest('[aria-hidden=true]')&&e.tabIndex<0) continue;
    const r=e.getBoundingClientRect(); let L=r.left,Tp=r.top,R=r.right,B=r.bottom;
    for(const ps of ['::before','::after']){const c=getComputedStyle(e,ps); if(c.content==='none'||c.position!=='absolute') continue;
      let cb=e; if(getComputedStyle(e).position==='static'){cb=e.parentElement;while(cb&&getComputedStyle(cb).position==='static')cb=cb.parentElement;} if(!cb) continue;
      const q=cb.getBoundingClientRect(),n=v=>parseFloat(v)||0;
      L=Math.min(L,q.left+n(c.left));Tp=Math.min(Tp,q.top+n(c.top));R=Math.max(R,q.right-n(c.right));B=Math.max(B,q.bottom-n(c.bottom));}
    const small=!(R-L>=${MIN}-.5&&B-Tp>=${MIN}-.5);
    // metin içindeki satır içi bağlantı (WCAG 2.5.8 istisnası)
    const inline=e.matches('a')&&getComputedStyle(e).display==='inline'&&(b=>b&&b.textContent.trim().length>e.textContent.trim().length+15)(blockOf(e));
    T.push({e,r,small:small&&!inline,cx:(r.left+r.right)/2,cy:(r.top+r.bottom)/2});
  }
  const dist=(x,y,q)=>Math.hypot(Math.max(q.left-x,0,x-q.right),Math.max(q.top-y,0,y-q.bottom));
  const out={};
  for(const t of T){ if(!t.small) continue;
    if(${MIN}<44){ const ok=T.every(o=>o===t||o.e.contains(t.e)||t.e.contains(o.e)||(dist(t.cx,t.cy,o.r)>=12&&(!o.small||Math.hypot(t.cx-o.cx,t.cy-o.cy)>=24))); if(ok) continue; }
    const k=sel(t.e); if(!out[k]) out[k]=Math.round(t.r.width)+'x'+Math.round(t.r.height);
  }
  return out})()`;
async function audit(browser, BASE, check) {
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const cmp = `(async()=>{const j=await (await fetch('data/filtre-kahve.json')).json();localStorage.setItem('kyr_cmp',JSON.stringify(j.urunler.slice(0,2).map(p=>({cat:'filtre-kahve',id:p.id}))));return true})()`;
  // 1) dokunma alanı 44 px (telefon), 2) yazı en az 12 px (iki genişlik)
  const MINTXT = `(()=>{const out={};for(const e of document.querySelectorAll('#app *')){if(!e.getClientRects().length||!e.checkVisibility()) continue;
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) continue; if(e.closest('.sr-only,.print-only')) continue;
    const f=parseFloat(getComputedStyle(e).fontSize); if(f<11.95){const k=e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\\s+/)[0]:''); out[k]=f.toFixed(1);}}return out})()`;
  const small = {}, small24 = {}, tiny = {};
  for (const [w, h, mob] of [[375, 812, true], [1280, 900, false]]) {
    const pg = await browser.page({ width: w, height: h, mobile: mob });
    await pg.goto(BASE + '#/', 300); await pg.eval(cmp);
    for (const r of ALL_ROUTES) {
      await pg.goto('about:blank', 50); await pg.goto(BASE + r, 1500);
      await pg.eval('document.getAnimations().forEach(a=>a.finish()); true');
      if (mob) {
        const t = await pg.eval(TOUCH());
        for (const [k, v] of Object.entries(t)) if (!TOUCH_OK[k]) (small[r] ||= {})[k] = v;
        if (r === '#/kategori/filtre-kahve') {
          await pg.mclick('#f-open', 500);
          const f = await pg.eval(TOUCH());
          for (const [k, v] of Object.entries(f)) if (!TOUCH_OK[k] && !(small[r] || {})[k]) (small[r + ' (süzgeç çekmecesi)'] ||= {})[k] = v;
        }
      } else {
        // fareyle: WCAG 2.5.8 en az 24x24 px
        const t = await pg.eval(TOUCH(24));
        if (Object.keys(t).length) small24[r] = t;
      }
      const m = await pg.eval(MINTXT);
      if (Object.keys(m).length) tiny[w + ' ' + r] = m;
    }
    await pg.close();
  }
  check('dokunma: 44 px (telefon, 11 sayfa türü)', !Object.keys(small).length, JSON.stringify(small));
  check('dokunma: masaüstünde en az 24 px (WCAG 2.5.8)', !Object.keys(small24).length, JSON.stringify(small24));
  check('yazı: en küçük boyut 12 px (11 sayfa türü, iki genişlik)', !Object.keys(tiny).length, JSON.stringify(tiny));

  // 3) dokunma aralığı: bölüm menüsü, süzgeç çekmecesi, çip satırları; iki ayrı hedefin kutuları arasında en az 8 px
  const GAP = (box) => `(()=>{const B=[...document.querySelectorAll(${JSON.stringify(box)})];const bad=[];
    for(const b of B){const T=[...b.querySelectorAll('a[href],button,label,select')].filter(e=>e.getClientRects().length&&e.checkVisibility()&&!e.parentElement.closest('label'));
      for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i].getBoundingClientRect(),c=T[j].getBoundingClientRect();
        if(T[i].contains(T[j])||T[j].contains(T[i])) continue;
        const gx=Math.max(c.left-a.right,a.left-c.right),gy=Math.max(c.top-a.bottom,a.top-c.bottom);
        if(Math.max(gx,gy)<7.5) bad.push((T[i].textContent.trim().slice(0,14))+' / '+(T[j].textContent.trim().slice(0,14))+' '+Math.round(Math.max(gx,gy)));}}
    return bad})()`;
  const gaps = {};
  const ph = await browser.page({ width: 375, height: 812, mobile: true });
  for (const [r, box, open] of [['#/', '.alan-f, .ex', null], ['#/kategori/filtre-kahve?tip=kobi&sirala=cok', '#secnav, #chips', null], ['#/kategori/filtre-kahve', '#filters', '#f-open'], ['#/firsat', '.ff-alan, .segctl, .ff', null], ['#/yontem', '#m-toc', null]]) {
    await ph.goto('about:blank', 50); await ph.goto(BASE + r, 1500);
    if (open) await ph.mclick(open, 500);
    const g = await ph.eval(GAP(box));
    if (g.length) gaps[r + ' ' + box] = g.slice(0, 8);
  }
  await ph.close();
  check('dokunma: hedefler arası en az 8 px', !Object.keys(gaps).length, JSON.stringify(gaps));

  // 4) odak: Tab ile gezilen her öğede görünür halka (öğenin, kartının ya da yanındaki görünür kutunun outline'ı ya da box-shadow'u)
  const FOC = `(()=>{const e=document.activeElement; if(!e||e===document.body) return null; if(e.dataset.rrTab) return {again:true}; e.dataset.rrTab='1';
    const on=x=>{if(!x) return false; const s=getComputedStyle(x); return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=1)||s.boxShadow!=='none'};
    const k=e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\\s+/)[0]:'');
    // gizlenmez: #app içindeki odaklı öğe yapışkan başlığın / bölüm menüsünün altında ya da karşılaştırma çubuğunun arkasında kalmaz
    let hid=false; if(e.closest('#app')&&!e.closest('#secnav')){const t=document.querySelector('.top'),n=document.getElementById('secnav'),b=document.getElementById('cmpbar');
      const tb=t?t.getBoundingClientRect().bottom:0, nr=n&&n.getBoundingClientRect(), lim=nr&&nr.top<=tb+1?Math.max(tb,nr.bottom):tb, bot=innerHeight-(b&&!b.hidden?b.offsetHeight:0), r=e.getClientRects()[0]||e.getBoundingClientRect();
      // bölüm menüsü yalnızca yapışıkken sayılır; öğe bütünüyle görünür alanda (ekrandan uzun kutuda üst kenarı)
      hid=!(r.top>=lim-1&&(r.bottom<=bot+1||(r.height>bot-lim&&r.top<bot-4)));}
    return {k, ok: on(e)||on(e.nextElementSibling)||on(e.closest('.cat')), hid}})()`;
  const nofocus = {}, hidden = {};
  const dk = await browser.page({ width: 1280, height: 900 });
  await dk.goto(BASE + '#/', 300); await dk.eval(cmp);
  for (const r of ['#/', '#/kategori/termos', '#/urun/termos/780345921', '#/firsat']) {
    await dk.goto('about:blank', 50); await dk.goto(BASE + r, 1500);
    let n = 0;
    for (let i = 0; i < 300; i++) {
      await dk.key('Tab', 'Tab', 9, 15);
      const f = await dk.eval(FOC);
      if (!f) continue;
      if (f.again) break;
      n++;
      if (!f.ok) (nofocus[r] ||= new Set()).add(f.k);
      if (f.hid) (hidden[r] ||= new Set()).add(f.k);
    }
    console.log(`  odak: ${r} Tab ile ${n} öğe`);
    if (n < 5) (nofocus[r] ||= new Set()).add('Tab ile yalnızca ' + n + ' öğe gezildi');
    // tema menüsü (ok tuşlarıyla açılır)
    if (r === '#/') { await dk.eval(`document.getElementById('theme').focus(); true`); await dk.key('ArrowDown', 'ArrowDown', 40, 100); const f = await dk.eval(FOC); if (f && !f.again && !f.ok) (nofocus[r] ||= new Set()).add(f.k); await dk.key('Escape', 'Escape', 27, 100); }
  }
  await dk.close();
  const sets = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...v]])));
  check('odak: her etkileşimli ögede görünür', !Object.keys(nofocus).length, sets(nofocus));
  check('odak: yapışkan başlık ya da karşılaştırma çubuğu odağı örtmez', !Object.keys(hidden).length, sets(hidden));

  // 5) yıldız (★) rengi beş temada zeminine karşı en az 4,5:1 (yazı karakteri olduğu için yazı eşiği; kehribar anlamı korunur)
  const STAR = `(()=>{const parse=s=>{const m=(s.match(/[\\d.]+/g)||[0,0,0,0]).map(Number);return {r:m[0],g:m[1],b:m[2],a:m.length>3?m[3]:1}};
    const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
    const bg=e=>{for(let x=e;x;x=x.parentElement){const c=parse(getComputedStyle(x).backgroundColor);if(c.a>=1) return c; if(x.classList.contains('band')){const b=parse(getComputedStyle(x,'::before').backgroundColor); if(b.a>=1) return b;}} return parse(getComputedStyle(document.body).backgroundColor)};
    return [...document.querySelectorAll('.stars .s')].filter(e=>e.getClientRects().length).map(e=>{const a=lum(parse(getComputedStyle(e).color)),b=lum(bg(e));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)})})()`;
  const stars = {};
  const sp = await browser.page({ width: 1280, height: 900 });
  for (const th of ['acik', 'krem', 'adacayi', 'koyu', 'gece']) {
    await sp.goto(BASE + '#/', 200); await sp.eval(`localStorage.setItem('rr_theme','${th}'); true`);
    for (const r of ['#/kategori/termos', '#/urun/termos/780345921']) {
      await sp.goto('about:blank', 50); await sp.goto(BASE + r, 1300);
      const v = await sp.eval(STAR);
      const lo = Math.min(...v);
      if (!v.length || lo < 4.5) stars[th + ' ' + r] = v.length ? lo.toFixed(2) : 'yıldız yok';
    }
  }
  await sp.close();
  check('yıldız: kontrast en az 4,5:1 (beş tema)', !Object.keys(stars).length, JSON.stringify(stars));

  // 6) azaltılmış hareket: gezinmeden sonra çalışan tek animasyon sabit varış vurgusu (ARR_MS süresi), başka geçiş ya da animasyon yok
  const rm = await browser.page({ width: 1280, height: 900 });
  await rm.s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const motion = {};
  for (const r of ['#/kategori/filtre-kahve?tip=kobi', '#/yontem/oran', '#/urun/filtre-kahve/52915799/konu/skt']) {
    await rm.goto('about:blank', 50); await rm.goto(BASE + r, 900);
    // üzerine gelme ve katlama geçişleri de denensin (fare kartın üstüne gelir; Yöntem'de bir bölüm kapanıp açılır)
    const c = await rm.eval(`(()=>{const e=document.querySelector('.pc, .hb.go-row');if(!e) return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
    if (c) await rm.s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y });
    if (r.startsWith('#/yontem')) { await rm.eval(`document.querySelector('.m-sec:not(#y-oran) > summary').click(); true`); }
    await pause(80);
    const a = await rm.eval(`document.getAnimations().map(a=>{const k=a.effect&&a.effect.getKeyframes?a.effect.getKeyframes():[];const t=a.effect.getComputedTiming();
      const same=k.length<2||k.every(x=>x.boxShadow===k[0].boxShadow&&x.outline===k[0].outline);return {id:a.id||a.constructor.name+':'+(a.transitionProperty||a.animationName||''),d:t.duration,same,state:a.playState}})`);
    const bad = a.filter((x) => x.state === 'running' && !(x.id === 'rr-arrive' && x.same && x.d <= 1800));
    if (bad.length) motion[r] = bad;
  }
  await rm.close();
  check('hareket: azaltılmış hareket tercihinde yalnızca sabit vurgu', !Object.keys(motion).length, JSON.stringify(motion));

  // 7) imleç: tıklanır her öğe (bağlantı, düğme, katlanır başlık) el imleci gösterir
  const CUR = `[...document.querySelectorAll('a[href], button, summary')].filter(e=>e.closest('#app, .top')&&e.getClientRects().length&&getComputedStyle(e).cursor!=='pointer').map(e=>e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\\s+/)[0]:''))`;
  const cur = {};
  const cp = await browser.page({ width: 1280, height: 900 });
  await cp.goto(BASE + '#/', 300); await cp.eval(cmp);
  for (const r of ALL_ROUTES) {
    await cp.goto('about:blank', 50); await cp.goto(BASE + r, 1400);
    const c = [...new Set(await cp.eval(CUR))];
    if (c.length) cur[r] = c;
  }
  check('imleç: tıklanır ögelerde el imleci', !Object.keys(cur).length, JSON.stringify(cur));
  check('denetim: konsol temiz', !cp.errors.length && !cp.logs.length, JSON.stringify([cp.errors, cp.logs]));
  await cp.close();
}
