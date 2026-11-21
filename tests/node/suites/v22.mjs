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
