// Karşılaştırma (en çok 4, tek kategori), kaydırma geri gelir, rakip kartı, kontrol listesi, arama, telefon zinciri ve çekmece (eski regress.mjs).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sleep } from '../lib/driver.mjs';

const DATA = fileURLToPath(new URL('../../../data/', import.meta.url));

export default async function ({ browser: b, base: BASE, check }) {
  const REG = JSON.parse(readFileSync(DATA + 'kategoriler.json', 'utf8')).filter((c) => c.durum === 'hazir');
  const pg = await b.page({ width: 1440, height: 900 });
  await pg.goto(BASE + '#/kategori/termos', 300); await pg.eval("localStorage.removeItem('kyr_cmp')"); await pg.s('Page.reload'); await sleep(1200);
  // compare max 4 + keeps scroll
  await pg.eval("scrollTo(0, document.getElementById('pgrid').getBoundingClientRect().top + scrollY - 160)"); const y0 = await pg.eval('scrollY');
  for (let i = 1; i <= 4; i++) await pg.eval(`document.querySelectorAll('#pgrid input[data-cmp]')[${i - 1}].click()`);
  await sleep(200);
  check('K: ticking compare keeps scroll', (await pg.eval('scrollY')) === y0);
  await pg.eval(`document.querySelectorAll('#pgrid input[data-cmp]')[4].click()`); await sleep(300);
  check('D: 5th refused', JSON.parse(await pg.eval("localStorage.getItem('kyr_cmp')")).length === 4 && (await pg.eval("document.getElementById('cmpbar-msg').innerText")).includes('En fazla 4'));
  await pg.hash('#/kategori/sal', 700);
  await pg.eval(`document.querySelectorAll('#pgrid input[data-cmp]')[0].click()`); await sleep(300);
  check('D: cross-category asks', (await pg.eval("document.querySelectorAll('[data-ask]').length")) === 2);
  await pg.click('[data-ask=no]', 200);
  await pg.eval("localStorage.removeItem('kyr_cmp')");
  // K: back/forward restore
  await pg.hash('#/kategori/termos', 700);
  await pg.eval('scrollTo(0,1400)'); await sleep(200); const yb = await pg.eval('scrollY');
  await pg.eval("document.querySelectorAll('.pc-name')[2].click()"); await sleep(600);
  check('K: new navigation goes to top', (await pg.eval('scrollY')) === 0);
  await pg.eval('scrollTo(0,300)'); await sleep(200);
  await pg.back(700); check('K: back restores scroll', Math.abs((await pg.eval('scrollY')) - yb) < 3, `${yb} ${await pg.eval('scrollY')}`);
  await pg.fwd(700); check('K: forward restores scroll', Math.abs((await pg.eval('scrollY')) - 300) < 3, await pg.eval('scrollY'));
  // rival card all products (names unchanged by link wrapper)
  const GOT = `(()=>{const c=document.querySelector('.gp-card'); if(!c) return 'none-card'; const t=c.innerText; if(/en az 30 gerekiyor/.test(t)) return 'small'; if(/Hiçbir konuda/.test(t)) return 'nodiff'; return 'cols:'+c.querySelectorAll('.gp-col').length+':'+c.querySelectorAll('.gp-t a.go').length+':'+c.querySelectorAll('.gp-t').length;})()`;
  let rb = [];
  for (const c of REG) { const d = JSON.parse(readFileSync(DATA + c.id + '.json', 'utf8')); for (const p of d.urunler) { await pg.hash(`#/urun/${c.id}/${p.id}`, 90); const g = await pg.eval(GOT); if (g.startsWith('cols:')) { const [, , a, t] = g.split(':'); if (a !== t) rb.push([c.id, p.id, g]); } } }
  check('G: every rival-card topic is a link (141 products)', !rb.length, JSON.stringify(rb.slice(0, 3)));
  // checklist persistence
  await pg.hash('#/kategori/sweatshirt', 700); await pg.eval("localStorage.removeItem('rr_ck_sweatshirt')"); await pg.s('Page.reload'); await sleep(1200);
  await pg.eval("document.querySelectorAll('[data-ck]')[0].click(); document.querySelectorAll('[data-ck]')[6].click()"); await sleep(200);
  await pg.s('Page.reload'); await sleep(1200);
  check('C: checklist persists', (await pg.eval("document.getElementById('ck-n').innerText")).startsWith('2 /'));
  await pg.eval("document.getElementById('ck-reset').click()");
  // search topic suggestion goes to topic view
  await pg.eval(`(()=>{const q=document.getElementById('q'); q.focus(); q.value='sızdırıyor'; q.dispatchEvent(new Event('input'));})()`); await sleep(800);
  check('S: complaint suggestion → topic view address', (await pg.eval(`[...document.querySelectorAll('#suggest li[role=option]')].map(o=>o.dataset.href)`)).includes('#/kategori/termos/konu/sizdirma'));
  check('no console errors (desktop)', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));

  // ---- telefon, koyu tema
  const m = await b.page({ width: 375, height: 812, mobile: true });
  await m.goto(BASE + '#/', 300); await m.eval("localStorage.setItem('rr_theme','koyu')"); await m.s('Page.reload'); await sleep(1500);
  await m.mclick('.hero-cta a', 1000);
  await m.mclick('.issues li:nth-child(1) a', 1000);
  check('M: phone chain step 2 → topic view', (await m.eval('location.hash')) === '#/kategori/filtre-kahve/konu/tat');
  await m.mclick('.tp-table tbody th a.go', 1000);
  check('M: phone chain step 3 → product at topic, card in view', /\/konu\/tat$/.test(await m.eval('location.hash')) && await m.eval(`Math.abs(document.getElementById('p-konu').getBoundingClientRect().top) < 220`));
  await m.back(900); check('M: phone back → topic view', (await m.eval('location.hash')) === '#/kategori/filtre-kahve/konu/tat');
  await m.fwd(900); check('M: phone forward → product', /\/konu\/tat$/.test(await m.eval('location.hash')));
  // drawer with filters in the address
  await m.hash('#/kategori/filtre-kahve?tip=kobi', 900);
  check('M: filtered address scrolls to products on phone', await m.eval(`Math.abs(document.getElementById('sec-urun').getBoundingClientRect().top) < 260`));
  await m.click('#f-open', 400);
  check('J: drawer opens, focus inside', await m.eval("document.getElementById('filters').classList.contains('open') && !!document.activeElement.closest('#filters')"));
  await m.eval(`document.querySelector('#filters input[name=puan][value="4.5"]').click()`); await sleep(300);
  check('J: filter change in drawer writes address, drawer stays open', (await m.eval('location.hash')) === '#/kategori/filtre-kahve?tip=kobi&puan=4.5' && await m.eval("document.getElementById('filters').classList.contains('open')"));
  await m.key('Escape', 'Escape', 27, 400);
  check('J: Esc closes drawer, focus back on button', await m.eval("!document.getElementById('filters').classList.contains('open') && document.activeElement.id==='f-open' && document.getElementById('filters').inert"));
  const views = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve?sirala=cok&tip=kobi', '#/kategori/filtre-kahve/konu/skt', '#/kategori/termos/konu/isi', '#/kategori/sweatshirt/sevilen/boykilo', '#/urun/filtre-kahve/788858071/konu/skt', '#/urun/termos/780345921/sevilen/orijinal', '#/urun/termos/780345921', '#/firsat', '#/yontem', '#/ara/tüylenme'];
  const ov = [];
  for (const v of views) { await m.hash(v, 700); const w = await m.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth'); if (w > 0) ov.push([v, w]); }
  check('M: no horizontal overflow at 375 on new/changed views', !ov.length, JSON.stringify(ov));
  check('no console errors (phone)', !m.errors.length && !m.logs.length, JSON.stringify([m.errors, m.logs]));

}
