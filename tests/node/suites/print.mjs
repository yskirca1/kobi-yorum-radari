// Yazdırma: kategori raporu (800 px), #/firsat telefonda (375 px), seçili kontrol listesi maddeleri (eski printshot.mjs + prt.mjs).
import { statSync } from 'node:fs';
import { sleep } from '../lib/driver.mjs';

export default async function ({ browser, base: BASE, check, out }) {
  const pg = await browser.page({ width: 800, height: 1100 });
  await pg.goto(BASE + '#/kategori/filtre-kahve', 1500);
  await pg.media('print');
  await sleep(300);
  await pg.shot(out + 'print-cat.png', true);
  check('kategori raporu: yazdırma görüntüsü alındı', statSync(out + 'print-cat.png').size > 5000);
  const bytes = await pg.pdf(out + 'print-cat.pdf');
  check('kategori raporu: PDF üretildi', bytes > 10000, bytes);
  const shown = await pg.eval(`({ans: !!document.querySelector('.answer')?.getClientRects().length, table: !!document.querySelector('.ptable')?.getClientRects().length, nav: getComputedStyle(document.getElementById('secnav')).display})`);
  check('kategori raporu: cevap ve ürün tablosu görünür, bölüm menüsü gizli', shown.ans && shown.table && shown.nav === 'none', JSON.stringify(shown));

  // seçili kontrol listesi maddeleri basılır
  await pg.media('');
  await pg.goto(BASE + '#/kategori/termos', 50);
  await pg.eval(`localStorage.setItem('rr_ck_termos', JSON.stringify(['t:isi','o:farki kapakta yarat']))`);
  await pg.s('Page.reload'); await sleep(1000);
  await pg.media('print'); await sleep(200);
  await pg.eval(`document.getElementById('sec-kontrol').scrollIntoView()`); await sleep(200);
  const on = await pg.eval(`document.querySelector('[data-ck]').closest('#sec-kontrol').querySelectorAll('li[data-on]').length`);
  check('kontrol listesi: seçili maddeler yazdırmada işaretli', on >= 1, on);
  await pg.shot(out + 'print-ck.png');
  await pg.eval(`localStorage.removeItem('rr_ck_termos')`);
  await pg.close();

  const m = await browser.page({ width: 375, height: 812, mobile: true });
  await m.goto(BASE + '#/firsat', 1500);
  const fbytes = await m.pdf(out + 'print-firsat-375.pdf');
  check('#/firsat telefon genişliği: PDF üretildi', fbytes > 20000, fbytes);
  await m.media('print'); await sleep(200);
  await m.shot(out + 'print-firsat-375.png', true);
  check('#/firsat telefon genişliği: yazdırma görüntüsü alındı', statSync(out + 'print-firsat-375.png').size > 5000);
  check('print: konsol temiz', !pg.errors.length && !pg.logs.length && !m.errors.length && !m.logs.length, JSON.stringify([pg.errors, pg.logs, m.errors, m.logs]));
  await m.close();
}
