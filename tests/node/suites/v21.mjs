// v21: sayfa başına başlık sırası, tekil kimlik, resimli oran = yazılı oran, cevap cümlesi, arama, kontrol listesi, çekmece, odak halkası, yazdırma, yerleşim kayması; sonra tam sayfa ekran görüntüleri (eski a21.mjs + full21.mjs).
import { mkdirSync, statSync } from 'node:fs';
import { sleep } from '../lib/driver.mjs';

export default async function ({ browser, base: BASE, check, out }) {
  const OUT = out + 'v21/';
  mkdirSync(OUT, { recursive: true });
  const br = browser;
  const PAGES = ['#/', '#/kategori/filtre-kahve', '#/kategori/kedi-tirmalama', '#/kategori/telefon-kilifi', '#/kategori/filtre-kahve/konu/skt', '#/kategori/filtre-kahve/sevilen/lezzet',
    '#/urun/filtre-kahve/52915799', '#/urun/filtre-kahve/52915799/konu/skt', '#/urun/telefon-kilifi/169079728', '#/urun/sal/778137757', '#/karsilastir', '#/ara/karaca', '#/ara/zzzz', '#/firsat', '#/yontem', '#/yontem/cumle', '#/kategori/yok', '#/kategori/filtre-kahve?sirala=cok&tip=kobi'];
  for (const [W, mob] of [[1280, false], [375, true]]) {
    const pg = await br.page({ width: W, height: mob ? 760 : 860, mobile: mob });
    await pg.goto(BASE + '#/', 1200);
    await pg.eval(`localStorage.setItem('kyr_cmp', JSON.stringify([{cat:'filtre-kahve',id:'52915799'},{cat:'filtre-kahve',id:'788858071'}])); true`);
    for (const h of PAGES) {
      await pg.goto('about:blank', 50); await pg.goto(BASE + h, 1400);
      const r = await pg.eval(`(()=>{
        const hs=[...document.querySelectorAll('#app h1,#app h2,#app h3,#app h4')].filter(e=>e.getClientRects().length||e.closest('.sr-only')).map(e=>+e.tagName[1]);
        let skip=hs[0]!==1; for(let i=1;i<hs.length;i++) if(hs[i]>hs[i-1]+1) skip=true;
        const ids=[...document.querySelectorAll('[id]')].map(e=>e.id), dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
        // each pictogram: label "B yorumdan yaklaşık N" must match the % printed next to it (rounded the same way)
        const pic=[...document.querySelectorAll('svg.picto')].map(s=>{const l=s.getAttribute('aria-label')||'',m=/\\(%(\\d+(?:,\\d)?)\\)$/.exec(l);
          const box=s.closest('.afig,.fact-row,.cat-fig,.pk-row'); const t=box?box.innerText:''; const pm=/%(\\d+(?:,\\d)?)/.exec(t); if(!m||!pm) return 'unparsed:'+l+'|'+t.slice(0,40);
          const P=parseFloat(pm[1].replace(',','.')), ten=s.classList.contains('p10');
          const full=s.querySelector('path.on:not([clip-path])').getAttribute('d').split('M').length-1, part=s.querySelector('path.on[clip-path]');
          const expFull=ten?Math.floor(P/10+1e-9):Math.round(P), okPart=ten?(!!part)===((P/10-Math.floor(P/10+1e-9))>=0.05):!part;
          return (m[1]===pm[1] && full===expFull && okPart && (ten===(P>=9.5)))?'':'mismatch:'+l+' vs %'+pm[1]+' full '+full;}).filter(Boolean);
        const ans=document.querySelector('#app .answer-block');
        return {hs:hs.join(''),skip,dup,pic,ans:ans?{f:ans.dataset.form,t:ans.innerText.slice(0,90)}:null,
          topSearch:getComputedStyle(document.querySelector('.top .search')).display, ov:document.documentElement.scrollWidth>document.documentElement.clientWidth}})()`);
      check(`${W} ${h}: heading order without skips`, !r.skip, r.hs);
      check(`${W} ${h}: unique ids`, !r.dup.length, r.dup.join(','));
      check(`${W} ${h}: pictograms match their %`, !r.pic.length, r.pic.join(' ; '));
      check(`${W} ${h}: answer sentence present`, h === '#/' || (r.ans && r.ans.t.length > 5 && r.ans.f !== undefined), JSON.stringify(r.ans));
      check(`${W} ${h}: header search hidden only on home`, (r.topSearch === 'none') === (h === '#/'), r.topSearch);
      check(`${W} ${h}: no horizontal overflow`, !r.ov);
    }
    // hero search: type, arrow, enter
    await pg.eval(`localStorage.removeItem('kyr_cmp'); true`);
    await pg.goto('about:blank', 50); await pg.goto(BASE + '#/', 1200);
    await pg.eval(`document.getElementById('hq').focus(); true`);
    await pg.s('Input.insertText', { text: 'sızdır' }); await sleep(900);
    const sg = await pg.eval(`({open:!document.getElementById('hsuggest').hidden, exp:document.getElementById('hq').getAttribute('aria-expanded'), n:document.querySelectorAll('#hsuggest li[role=option]').length, ids:[...document.querySelectorAll('#hsuggest [id]')].every(e=>e.id.startsWith('h'))})`);
    check(`${W} hero search opens grouped suggestions`, sg.open && sg.exp === 'true' && sg.n > 0 && sg.ids, JSON.stringify(sg));
    await pg.key('ArrowDown', 'ArrowDown', 40);
    const ad = await pg.eval(`document.getElementById('hq').getAttribute('aria-activedescendant')`);
    check(`${W} hero search arrow key selects option`, !!ad && ad.startsWith('hsg-'), ad);
    await pg.key('Escape', 'Escape', 27);
    check(`${W} hero search Esc closes`, await pg.eval(`document.getElementById('hsuggest').hidden`));
    await pg.eval(`(()=>{const q=document.getElementById('hq'); q.value='termos'; q.dispatchEvent(new Event('input',{bubbles:true})); return true})()`);
    for (let i = 0; i < 50 && !(await pg.eval(`document.querySelectorAll('#hsuggest li[role=option]').length`)); i++) await sleep(100); // soğuk bağlamda arama dizini geç gelir
    await sleep(300); await pg.key('Enter', 'Enter', 13, 900);
    check(`${W} hero search Enter "termos" → category`, (await pg.eval('location.hash')) === '#/kategori/termos', await pg.eval('location.hash'));
    await pg.goto('about:blank', 50); await pg.goto(BASE + '#/', 1200);
    const chips = await pg.eval(`[...document.querySelectorAll('.ex-chip')].map(a=>a.getAttribute('href'))`);
    check(`${W} example chips: category, brand, complaints`, JSON.stringify(chips) === JSON.stringify(['#/kategori/termos', '#/ara/Karaca', '#/ara/s%C4%B1zd%C4%B1r%C4%B1yor', '#/ara/t%C3%BCylenme']), JSON.stringify(chips));
    await pg.mclick('.ex-chip:nth-of-type(3)', 1500);
    check(`${W} chip "sızdırıyor" → results with complaint topics`, await pg.eval(`location.hash.startsWith('#/ara/') && document.querySelectorAll('#sr-s ~ .sr-list a, .sres .sr-list').length>0`));
    // checklist persistence
    await pg.goto('about:blank', 50); await pg.goto(BASE + '#/kategori/termos', 1300);
    await pg.eval(`localStorage.removeItem('rr_ck_termos'); true`);
    await pg.click('#sec-kontrol [data-ck]', 300);
    await pg.goto('about:blank', 50); await pg.goto(BASE + '#/kategori/termos', 1300);
    check(`${W} checklist persists`, await pg.eval(`document.querySelector('#sec-kontrol [data-ck]').checked && document.getElementById('ck-n').textContent.startsWith('1 /')`));
    await pg.click('#ck-reset', 300);
    // mobile drawer
    if (mob) {
      await pg.click('#f-open', 400);
      const d = await pg.eval(`({open:document.getElementById('filters').classList.contains('open'), role:document.getElementById('filters').getAttribute('role'), f:document.activeElement.id})`);
      check('375 filter drawer opens as dialog, focus on close', d.open && d.role === 'dialog' && d.f === 'f-close', JSON.stringify(d));
      await pg.key('Escape', 'Escape', 27, 400);
      const d2 = await pg.eval(`({open:document.getElementById('filters').classList.contains('open'), inert:document.getElementById('filters').inert, f:document.activeElement.id})`);
      check('375 Esc closes drawer, inert, focus back on Filtrele', !d2.open && d2.inert && d2.f === 'f-open', JSON.stringify(d2));
    }
    // keyboard: focus ring visible on answer figure link
    await pg.goto('about:blank', 50); await pg.goto(BASE + '#/kategori/filtre-kahve', 1300);
    await pg.eval(`document.querySelector('.afig a.go').focus(); true`);
    check(`${W} focus ring on answer figure`, await pg.eval(`(()=>{const s=getComputedStyle(document.activeElement); return s.outlineStyle!=='none' && parseFloat(s.outlineWidth)>=2})()`));
    // print: category and firsat
    if (!mob) {
      await pg.media('print');
      const pr = await pg.eval(`({steps:[...document.querySelectorAll('.step')].filter(e=>e.getClientRects().length).map(e=>e.id), table:!!document.querySelector('.ptable').getClientRects().length, nav:getComputedStyle(document.getElementById('secnav')).display, ans:!!document.querySelector('.answer').getClientRects().length})`);
      check('print: category report shows answer, steps 1-3, product table, checklist; no nav', pr.ans && pr.table && pr.nav === 'none' && ['sec-ozet', 'sec-icgoru', 'sec-oneri', 'sec-kontrol'].every((x) => pr.steps.includes(x)), JSON.stringify(pr));
      await pg.media('');
      const n = await pg.pdf(OUT + 'kategori-filtre-kahve.pdf'); check('print: category PDF produced', n > 10000);
      await pg.goto('about:blank', 50); await pg.goto(BASE + '#/firsat', 1500);
      await pg.media('print');
      const fp = await pg.eval(`({table:!!document.querySelector('.ftable').getClientRects().length, ans:document.getElementById('fs-ans').innerText})`);
      check('print: #/firsat prints table + answer', fp.table && fp.ans.length > 20, JSON.stringify(fp));
      await pg.media(''); await pg.pdf(OUT + 'firsat.pdf');
    }
    for (const e of pg.errors.concat(pg.logs)) console.log('  console:', e);
    check(`${W} console clean`, !pg.errors.length && !pg.logs.length);
    await pg.close();
  }
  // no layout shift on home: card heights before and after category data arrive
  {
    const pg = await br.page({ width: 1280, height: 860 });
    await pg.s('Network.enable');
    await pg.s('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 200000, uploadThroughput: 200000 });
    await pg.goto(BASE + '#/', 50);
    for (let i = 0; i < 60 && !(await pg.eval(`!!document.querySelector('.cat')`)); i++) await sleep(100);
    const a = await pg.eval(`({wait:document.querySelectorAll('.cat-top-w.wait').length, h:[...document.querySelectorAll('.cat')].map(e=>Math.round(e.getBoundingClientRect().height)).join(','), y:document.querySelector('.reads')?.getBoundingClientRect().top})`);
    await sleep(6000);
    const b = await pg.eval(`({wait:document.querySelectorAll('.cat-top-w.wait').length, h:[...document.querySelectorAll('.cat')].map(e=>Math.round(e.getBoundingClientRect().height)).join(',')})`);
    check('home renders before category files (placeholders) and fills without height change', a.wait > 0 && b.wait === 0 && a.h === b.h, JSON.stringify({ a, b }));
    await pg.close();
  }

  // Tam sayfa ekran görüntüleri (eski full21.mjs): her adres iki genişlikte, dosya oluşur ve konsol temiz kalır.
  const SHOTS = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve/konu/skt', '#/urun/filtre-kahve/52915799', '#/firsat'];
  for (const W of [1280, 375]) {
    const mob = W < 700;
    const pg = await browser.page({ width: W, height: mob ? 760 : 860, mobile: mob });
    await pg.goto(BASE + '#/', 300);
    await pg.eval(`localStorage.removeItem('kyr_cmp'); localStorage.setItem('rr_theme', 'acik'); true`);
    for (const h of SHOTS) {
      await pg.goto('about:blank', 100); await pg.goto(BASE + h, 1500);
      await pg.eval('document.getAnimations().forEach(a => a.finish()); scrollTo(0, 0); true'); await sleep(200);
      const f = `${OUT}${h.replace(/[^a-z0-9]+/gi, '_')}-${W}.png`;
      await pg.shot(f, true);
      check(`${W} ${h}: tam sayfa görüntüsü alındı`, statSync(f).size > 5000, f);
    }
    check(`${W} ekran görüntüsü gezintisinde konsol temiz`, !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
    await pg.close();
  }
}
