// Her adres türü 1280 ve 375 genişlikte: başlık var, konsol temiz, yana taşma yok.
const ROUTES = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve/konu/tat', '#/kategori/termos/konu/isi', '#/kategori/termos/sevilen/isi',
  '#/kategori/filtre-kahve?sirala=cok&tip=kobi', '#/firsat', '#/yontem', '#/yontem/oran', '#/karsilastir', '#/ara/kargo'];
const NOT_FOUND = ['#/kategori/filtre-kahve?sirala=xx', '#/kategori/termos/konu/nope', '#/urun/filtre-kahve/X'];

export default async function ({ browser, base, check }) {
  for (const [w, h, mobile] of [[1280, 900, false], [375, 812, true]]) {
    const pg = await browser.page({ width: w, height: h, mobile });
    await pg.goto(base + '#/', 1500);
    const pid = await pg.eval(`(async()=>{const d=await (await fetch('data/filtre-kahve.json')).json(); return d.urunler[0].id})()`);
    const probe = `({h1: document.querySelector('h1')?.innerText || '', ow: document.documentElement.scrollWidth > innerWidth + 1, w: document.documentElement.scrollWidth, title: document.title})`;
    for (const r of [...ROUTES, `#/urun/filtre-kahve/${pid}`, `#/urun/filtre-kahve/${pid}/konu/tat`, `#/urun/filtre-kahve/${pid}/sevilen/hediye`]) {
      await pg.hash(r, 900);
      const i = await pg.eval(probe);
      check(`${w} ${r}: başlık var, sayfa bulundu`, i.h1 && i.h1 !== 'Sayfa bulunamadı', JSON.stringify(i));
      check(`${w} ${r}: yana taşma yok`, !i.ow, `scrollWidth ${i.w}`);
    }
    for (const r of [...NOT_FOUND, `#/urun/filtre-kahve/${pid}/konu/zzz`]) {
      await pg.hash(r, 900);
      const i = await pg.eval(probe);
      check(`${w} ${r}: "Sayfa bulunamadı"`, i.h1 === 'Sayfa bulunamadı', JSON.stringify(i));
      check(`${w} ${r}: yana taşma yok`, !i.ow, `scrollWidth ${i.w}`);
    }
    check(`${w} konsol temiz`, !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
    await pg.close();
  }
}
