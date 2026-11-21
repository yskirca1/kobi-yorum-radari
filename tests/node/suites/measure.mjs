// Sayfa uzunluğu ölçümü (eski audit.mjs). Kaydeder, başarısız saymaz: out/olcum.json, { [adres]: { desktop, phone } }.
// phone = scrollHeight / 812 (375x812); desktop = scrollHeight / 800 (1280x800). Gerçek fotoğraflar için: --real-images.
import { writeFileSync } from 'node:fs';
import { sleep } from '../lib/driver.mjs';

const ROUTES = ['#/', '#/kategori/filtre-kahve', '#/kategori/termos', '#/urun/filtre-kahve/52915799', '#/firsat', '#/yontem'];

export default async function ({ browser, base, check, out }) {
  const result = Object.fromEntries(ROUTES.map((r) => [r, {}]));
  for (const [w, h, mobile, key] of [[1280, 800, false, 'desktop'], [375, 812, true, 'phone']]) {
    const pg = await browser.page({ width: w, height: h, mobile, scheme: 'light' });
    for (const r of ROUTES) {
      await pg.goto('about:blank', 50);
      await pg.goto(base + '?a=' + Date.now() + r, 2200);
      // tembel görselleri yüklet, sonra yerleşimin oturmasını bekle
      await pg.eval(`document.querySelectorAll('img[loading=lazy]').forEach(i=>{i.loading='eager'; const s=i.src; i.src=''; i.src=s;}); 1`);
      await sleep(3500);
      const sh = await pg.eval('document.documentElement.scrollHeight');
      result[r][key] = Math.round((sh / h) * 10) / 10;
    }
    await pg.close();
  }
  writeFileSync(out + 'olcum.json', JSON.stringify(result, null, 2) + '\n');
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [`${pad('adres', 38)}${pad('masaüstü', 10)}telefon`, ...ROUTES.map((r) => `${pad(r, 38)}${pad(result[r].desktop.toFixed(1), 10)}${result[r].phone.toFixed(1)}`)];
  console.log(lines.join('\n'));
  check('ölçüm: her adres için iki değer kaydedildi', ROUTES.every((r) => result[r].desktop > 0 && result[r].phone > 0), JSON.stringify(result));
}
