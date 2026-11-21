// Ekran görüntüleri: her sayfa türü 1280 ve 375 px, Açık ve Koyu temada (üst ekran ve tam sayfa); ana sayfa ve kategori ayrıca Krem, Adaçayı, Gece mavisinde.
// Kullanım: node tests/node/tools/shots.mjs [--real-images] [--out=.onizleme/v22] [--only=01,02]
// Dosya adı: <no>-<sayfa>-<genişlik>-<tema>[-tam].png. Tek Edge açılır, geçici profil kapanışta silinir. Görseller --real-images ile Trendyol'dan gerçekten yüklenir.
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from '../lib/driver.mjs';
import { startServer } from '../lib/server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const args = process.argv.slice(2);
const realImages = args.includes('--real-images');
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const OUT = resolve(ROOT, opt('out', '.onizleme/v22'));
const only = opt('only', '') ? opt('only', '').split(',') : null;

// karşılaştırma: verideki ilk iki filtre kahve
const fk = JSON.parse(readFileSync(join(ROOT, 'data/filtre-kahve.json'), 'utf8')).urunler.slice(0, 2).map((p) => ({ cat: 'filtre-kahve', id: p.id }));
const PAGES = [
  ['01', 'ana-sayfa', '#/'],
  ['02', 'kategori', '#/kategori/filtre-kahve'],
  ['03', 'konu', '#/kategori/filtre-kahve/konu/skt'],
  ['04', 'sevilen-konu', '#/kategori/filtre-kahve/sevilen/lezzet'],
  ['05', 'urun', '#/urun/filtre-kahve/52915799'],
  ['06', 'urun-konu', '#/urun/filtre-kahve/52915799/konu/skt'],
  ['07', 'karsilastir', '#/karsilastir'],
  ['08', 'arama', '#/ara/karaca'],
  ['09', 'firsat', '#/firsat'],
  ['10', 'yontem', '#/yontem'],
  ['11', 'bulunamadi', '#/kategori/yok'],
];
const JOBS = [];
for (const [no, name, hash] of PAGES) for (const th of ['acik', 'koyu']) for (const w of [1280, 375]) JOBS.push({ no, name, hash, th, w });
for (const th of ['krem', 'adacayi', 'gece']) for (const [no, name, hash] of PAGES.slice(0, 2)) for (const w of [1280, 375]) JOBS.push({ no, name, hash, th, w });

mkdirSync(OUT, { recursive: true });
const server = await startServer(ROOT);
const browser = await launch({ realImages });
let n = 0;
try {
  for (const w of [1280, 375]) {
    const mob = w < 700;
    const pg = await browser.page({ width: w, height: mob ? 812 : 900, mobile: mob });
    await pg.goto(server.url + '#/', 300);
    for (const j of JOBS.filter((x) => x.w === w && (!only || only.includes(x.no)))) {
      // karşılaştırma seçimi yalnızca karşılaştırma sayfasında (öbür sayfalarda alttaki çubuk görüntüyü kapatmasın)
      const cmp = j.name === 'karsilastir' ? `localStorage.setItem('kyr_cmp', ${JSON.stringify(JSON.stringify(fk))})` : `localStorage.removeItem('kyr_cmp')`;
      await pg.eval(`localStorage.setItem('rr_theme','${j.th}'); ${cmp}; true`);
      await pg.goto('about:blank', 50);
      await pg.goto(server.url + '?s=' + Date.now() + j.hash, 1800);
      // tembel görselleri hemen yükle, animasyonları bitir, yerleşim otursun
      await pg.eval(`document.querySelectorAll('img[loading=lazy]').forEach(i=>{i.loading='eager'}); true`);
      await sleep(realImages ? 3000 : 600);
      await pg.eval(`document.getAnimations().forEach(a=>a.finish()); scrollTo(0,0); true`);
      await sleep(150);
      const base = join(OUT, `${j.no}-${j.name}-${j.w}-${j.th}`);
      await pg.shot(base + '.png');
      await pg.shot(base + '-tam.png', true);
      n += 2;
    }
    if (pg.errors.length || pg.logs.length) console.log(`${w}: konsol`, JSON.stringify([pg.errors, pg.logs]).slice(0, 600));
    await pg.close();
  }
} finally {
  await browser.close();
  await server.stop();
}
console.log(`${n} görüntü: ${OUT}`);
