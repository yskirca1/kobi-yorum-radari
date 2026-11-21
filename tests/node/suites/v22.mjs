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

  check('konsol temiz', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
  await pg.close();
}
