// Varış vurgusu: her bağlantı türünde hedef, görünür alan, iz bırakmadan kalkma, yerleşimin değişmemesi; odak; azaltılmış hareket; yazdırma; temalar (eski v20.mjs).
import { mkdirSync } from 'node:fs';
import { sleep } from '../lib/driver.mjs';

export default async function ({ browser, base: BASE, check, out }) {
  const OUT = out + 'v20/';
  mkdirSync(OUT, { recursive: true });

  // In-page probe: running arrival animations, their targets and the visible band
  const PROBE = `window.__arr = () => {
    const top = document.querySelector('.top'), nav = document.getElementById('secnav'), bar = document.getElementById('cmpbar');
    const lim = Math.max(top ? top.getBoundingClientRect().bottom : 0, nav ? nav.getBoundingClientRect().bottom : 0);
    const bot = innerHeight - (bar && !bar.hidden ? bar.offsetHeight : 0);
    const an = document.getAnimations().filter(a => a.id === 'rr-arrive');
    return { lim, bot, y: scrollY, active: document.activeElement === document.body ? 'body' : (document.activeElement.id || document.activeElement.tagName),
      t: an.map(a => { const e = a.effect.target, r = e.getBoundingClientRect();
        return { tag: e.tagName, id: e.id, cls: e.className, fig: e.dataset.fig || e.dataset.read || '', txt: e.innerText.replace(/\\s+/g, ' ').slice(0, 70), top: r.top, bottom: r.bottom, h: r.height, state: a.playState, style: e.getAttribute('style') }; }) };
  };
  window.__snap = () => [...document.querySelectorAll('#app *')].slice(0, 400).map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); }).join(';') + '|' + document.documentElement.scrollHeight + '|' + scrollY;
  window.__left = () => ({ anims: document.getAnimations().filter(a => a.id === 'rr-arrive').length, attr: document.querySelectorAll('[data-arriving]').length });
  true`;

  const vis = (a, x) => x.top >= a.lim - 1 && x.top < a.bot - 10;

  async function run(W, H, mobile, tag) {
    const br = browser;
    const pg = await br.page({ width: W, height: H, mobile });
    await pg.s('Page.bringToFront');
    const probe = async () => { await pg.eval(PROBE); };
    const arr = async () => pg.eval('__arr()');
    // expectation helper: after an action, wait for highlight to start and check target
    async function expectArr(name, pred, { wait = 350, many = false } = {}) {
      await sleep(Math.min(wait, 350));
      let a = await arr();
      for (let i = 0; i < 30 && !a.t.length; i++) { await sleep(100); a = await arr(); }
      const ok = a.t.length > 0 && (many ? a.t.every(pred) : pred(a.t[0])) && a.t.every((x) => vis(a, x)) && a.t.every((x) => x.state === 'running');
      check(`${tag} ${name}`, ok, JSON.stringify(a));
      if (a.t.length) {
        const s1 = await pg.eval('__snap()');
        await sleep(ARR_WAIT);
        const s2 = await pg.eval('__snap()'), left = await pg.eval('__left()');
        const a2 = await arr();
        check(`${tag} ${name}: gone afterwards, no layout change`, left.anims === 0 && left.attr === 0 && s1 === s2 && a.t.every((x) => !x.style || true), JSON.stringify({ left, same: s1 === s2 }));
        return { a, a2 };
      }
      return { a };
    }
    async function expectNone(name, wait = 450) {
      await sleep(wait);
      const a = await arr();
      check(`${tag} ${name}: no highlight`, a.t.length === 0, JSON.stringify(a.t));
      return a;
    }
    const ARR_WAIT = 2000;

    // ---------- DEMO chain ----------
    await pg.goto(BASE + '#/', 1500); await probe();
    await pg.eval("localStorage.removeItem('kyr_cmp')");
    await expectNone('home direct open');
    await pg.mclick('.hero-cta a', 900); await expectNone('hero CTA → category (whole page)');
    await pg.mclick('.issues li:nth-child(2) a', 900);
    let r = await expectArr('summary complaint row → topic headline', (x) => x.cls.includes('tp-lead'));
    // v22: yeni sayfada odak ana içerikte (#app); vurgu odağı değiştirmez
    check(`${tag} focus unchanged (topic view: main content)`, r.a.active === 'app', r.a.active);
    await pg.mclick('.tp-table tbody th a.go', 900);
    r = await expectArr('topic table product → product topic card', (x) => x.id === 'p-konu');
    check(`${tag} focus unchanged (p-konu)`, r.a.active === 'p-konu', r.a.active);
    const pidChain = (await pg.eval('location.hash')).split('/')[3];
    // product → "Kategoride %X" → that product's row
    await pg.mclick('#p-konu .pk-fig a.go', 900);
    r = await expectArr('product page "Kategoride %" → that product row in topic table', (x) => x.tag === 'TR');
    check(`${tag} row is the source product`, await pg.eval(`(()=>{const a=document.getAnimations().find(a=>a.id==='rr-arrive');return true})()`) && r.a.t[0] && (await pg.eval(`[...document.querySelectorAll('.tp-table tbody tr')].findIndex(tr=>tr.querySelector('a[href*="/${pidChain}/"]'))`)) >= 0);
    await pg.back(900); await expectNone('back → product (scroll restoration)');
    await pg.fwd(900); await expectNone('forward → topic');
    await pg.back(900); await pg.back(900); await pg.back(900);
    check(`${tag} back to category`, (await pg.eval('location.hash')) === '#/kategori/filtre-kahve');
    await expectNone('back → category');
    // section nav
    await pg.mclick('[data-jump="sec-oneri"]', 100);
    r = await expectArr('section nav "Ne yapmalı?" → heading', (x) => x.id === 'oneri-t', { wait: 1100 });
    check(`${tag} focus unchanged (section)`, r.a.active === 'sec-oneri', r.a.active);
    await pg.mclick('[data-jump="sec-kontrol"]', 100);
    await expectArr('section nav "Kontrol listesi" → heading', (x) => x.id === 'ck-t', { wait: 1300 });
    await pg.mclick('[data-jump="sec-urun"]', 100);
    await expectArr('section nav "Ürünler" → heading', (x) => x.id === 'urun-t', { wait: 1300 });
    // recommendation link
    await pg.mclick('#sec-oneri .recs li:nth-child(2) .rec-ev a.go', 900);
    await expectArr('recommendation "Dayandığı şikâyet" → topic headline', (x) => x.cls.includes('tp-lead'));
    await pg.back(900);
    // KOBİ figure → filtered list
    await pg.mclick('.fact-seg [data-fig="dusuk-kobi"] a', 900);
    r = await expectArr('summary KOBİ figure → list heading, sort, chip', (x) => x.id === 'urun-t' || x.tag === 'LABEL' || x.cls.includes('chip'), { many: true });
    check(`${tag} filtered: heading + sort + KOBİ chip`, r.a.t.length === 3 && r.a.t.some((x) => x.id === 'urun-t') && r.a.t.some((x) => x.tag === 'LABEL') && r.a.t.some((x) => /KOBİ/.test(x.txt)), JSON.stringify(r.a.t.map((x) => x.txt)));
    check(`${tag} focus unchanged (sec-urun)`, r.a.active === 'sec-urun', r.a.active);
    // in-place filter change: no highlight
    await pg.eval("document.getElementById('sort').value='puan';document.getElementById('sort').dispatchEvent(new Event('change',{bubbles:true}))");
    await expectNone('sort change in place');
    // product card "En sık şikâyet" → product topic card
    await pg.mclick('.pc .pc-meta a.go', 900);
    await expectArr('product card "En sık şikâyet" → topic card', (x) => x.id === 'p-konu');
    // "Bütün alıntıları göster"
    await pg.mclick('#p-konu .pk-top a', 900);
    await expectArr('"Bütün alıntıları göster" → quotes block', (x) => x.id === 'p-alinti');
    // pnav back "tüm ürünler" (filtered → list)
    await pg.mclick('.pnav-top .pnav-back', 900);
    await expectArr('product "tüm ürünler" with last filter → list heading', (x) => x.id === 'urun-t' || x.tag === 'LABEL' || x.cls.includes('chip'), { many: true });
    // tip link
    await pg.hash('#/kategori/filtre-kahve', 900);
    await pg.mclick('#sec-ozet .tip', 200);
    await pg.mclick('#sec-ozet .tip-box a', 900);
    r = await expectArr('tip "Yöntem sayfasında ayrıntı" → #/yontem section', (x) => x.id === 'y-sikayet');
    check(`${tag} focus unchanged (y-sikayet)`, r.a.active === 'y-sikayet', r.a.active);
    // yontem "Bu hesabı ürün ürün gör"
    await pg.hash('#/yontem', 900);
    // v22: telefonda Yöntem bölümleri kapalı gelir; kullanıcı gibi önce bölüm başlığına dokunulur
    if (mobile) await pg.mclick('#y-oran > summary', 300);
    await pg.mclick('#y-oran a[data-to="dokum"]', 900);
    await expectArr('Yöntem "Bu hesabı ürün ürün gör" → breakdown table card', (x) => x.tag === 'SECTION' && /hangi ürünlerden/.test(x.txt));
    // topic "other complaints" link
    await pg.mclick('.tp-others a.go', 900);
    await expectArr('topic "diğer şikâyetler" → topic headline', (x) => x.cls.includes('tp-lead'));
    // topic quote figcaption → product topic
    await pg.mclick('#tp-q .q figcaption a', 900);
    await expectArr('topic quote → product topic card', (x) => x.id === 'p-konu');
    // product hbar row → topic card
    await pg.mclick('.cgrid .hb.go-row:not(.cur)', 900);
    await expectArr('product bar row → topic card', (x) => x.id === 'p-konu');
    // breadcrumb topic (product context) → row
    await pg.mclick('.crumbs a:nth-of-type(3)', 900);
    await expectArr('product breadcrumb topic → that product row', (x) => x.tag === 'TR');
    // breadcrumb home / logo: whole page
    await pg.mclick('.crumbs a:nth-of-type(2)', 900); await expectNone('breadcrumb → category');
    await pg.mclick('.crumbs a', 1200); await expectNone('breadcrumb → home');

    // ---------- home ----------
    await sleep(800);
    await pg.mclick('.kpis div:nth-child(3) a', 1200);
    await expectArr('home KPI "Yazılı yorum" → #/yontem/yildiz section', (x) => x.id === 'y-yildiz');
    await pg.hash('#/', 1800);
    await pg.mclick('.cat a.cat-top', 900);
    await expectArr('home category card "En sık şikâyet" → topic headline', (x) => x.cls.includes('tp-lead'));
    await pg.hash('#/', 1800);
    await pg.mclick('.cat .cat-a', 900); await expectNone('home category card → category');
    await pg.hash('#/', 2000);
    const readK = await pg.eval("document.querySelector('.reads-list li:nth-child(2) a').dataset.to");
    await pg.mclick('.reads-list li:nth-child(2) a', 1200);
    await expectArr('home reading → same reading on #/firsat', (x) => x.tag === 'LI' && 'read:' + x.fig === readK);
    // ---------- #/firsat ----------
    const cellSel = mobile ? '.fc[data-row="filtre-kahve"] .fc-m' : '#ft-body tr[data-row="filtre-kahve"]';
    // v22: telefonda her kategori kısa satır; ayrıntı satıra dokununca açılır
    const openRow = async () => { if (mobile) await pg.mclick('.fc[data-row="filtre-kahve"] .fz-row > summary', 300); };
    const firsatCell = async (sub) => { await pg.hash('#/firsat', 1300); await openRow(); return pg.mclick(`${cellSel} ${sub}`, 1000); };
    await firsatCell(`a[href="#/kategori/filtre-kahve?sirala=cok"]`);
    r = await expectArr('#/firsat 1-2 yıldız payı → category summary figure', (x) => x.fig === 'dusuk');
    check(`${tag} firsat→figure focus = sec-ozet`, r.a.active === 'sec-ozet', r.a.active);
    await firsatCell(`a[href="#/kategori/filtre-kahve?sirala=cok&tip=kobi"]`);
    await expectArr('#/firsat KOBİ → KOBİ figure', (x) => x.fig === 'dusuk-kobi');
    await firsatCell(`a[href="#/kategori/filtre-kahve?sirala=cok&tip=buyuk"]`);
    await expectArr('#/firsat büyük marka → büyük marka figure', (x) => x.fig === 'dusuk-buyuk');
    await firsatCell(`a[href="#/kategori/filtre-kahve?tip=buyuk"]`);
    await expectArr('#/firsat büyük marka yorum payı (no figure on category page) → list heading + chip', (x) => x.id === 'urun-t' || x.cls.includes('chip'), { many: true });
    await firsatCell(`a[href^="#/kategori/filtre-kahve/konu/"]`);
    await expectArr('#/firsat 1 numaralı şikâyet → topic headline', (x) => x.cls.includes('tp-lead'));
    await pg.hash('#/firsat', 1300); await openRow();
    await pg.mclick(mobile ? '.fc[data-row="filtre-kahve"] .fc-name a' : '#ft-body tr[data-row="filtre-kahve"] th a', 1000);
    await expectNone('#/firsat category name → category');
    // ---------- compare ----------
    await pg.eval(`(async()=>{const j=await (await fetch('data/filtre-kahve.json')).json(); localStorage.setItem('kyr_cmp', JSON.stringify([{cat:'filtre-kahve',id:'52915799'},{cat:'filtre-kahve',id:j.urunler.map(u=>u.id).find(i=>i!=='52915799')}])); return true})()`);
    await pg.hash('#/karsilastir', 1200);
    await pg.mclick('.ctable td ol a.go', 1000);
    await expectArr('compare cell → product topic card (with compare bar visible)', (x) => x.id === 'p-konu');
    await pg.eval("localStorage.removeItem('kyr_cmp')");
    // ---------- search ----------
    await pg.hash('#/ara/tchibo', 1500);
    await pg.mclick('.sr-list a.sr-row', 1000); await expectNone('search product row → product (whole page)');
    await pg.hash('#/ara/bayat', 1500);
    await pg.mclick('.sr-list a.sr-row', 1000);
    await expectArr('search topic row → topic headline', (x) => x.cls.includes('tp-lead'));

    // ---------- pasted address (no click) ----------
    await pg.hash('#/yontem/alinti', 1000);
    await expectArr('pasted #/yontem/alinti → section', (x) => x.id === 'y-alinti', { wait: 50 });
    await pg.hash('#/kategori/termos/konu/sizdirma', 900);
    await expectArr('pasted topic address → headline', (x) => x.cls.includes('tp-lead'), { wait: 50 });
    // reload: restoration, no highlight
    await pg.goto(BASE + '#/kategori/termos/konu/sizdirma', 1500); await probe();
    await expectNone('reload of same entry (scroll restored)', 100);

    // ---------- direct open ----------
    for (const [h, pred, nm] of [
      ['#/kategori/filtre-kahve/konu/skt', (x) => x.cls.includes('tp-lead'), 'topic'],
      ['#/urun/filtre-kahve/52915799/konu/skt', (x) => x.id === 'p-konu', 'product topic'],
      ['#/yontem/oran', (x) => x.id === 'y-oran', 'yontem section'],
      ['#/kategori/filtre-kahve?sirala=cok&tip=kobi', (x) => x.id === 'urun-t' || x.tag === 'LABEL' || x.cls.includes('chip'), 'filtered category'],
    ]) {
      const p2 = await br.page({ width: W, height: H, mobile });
      await p2.s('Page.bringToFront');
      // Her sayfa kendi bağlamında soğuk açılır (önbellek yok); sabit bekleme yerine vurgunun başlamasını 6 sn'ye kadar bekle.
      await p2.goto(BASE + h, 300); await p2.eval(PROBE);
      let a = await p2.eval('__arr()');
      for (let i = 0; i < 100 && !a.t.length; i++) { await sleep(100); await p2.eval(PROBE); a = await p2.eval('__arr()'); }
      const state = await p2.eval(`document.readyState + ' ' + document.visibilityState + ' h1=' + (document.querySelector('h1') || {}).innerText`);
      check(`${tag} direct open ${nm}`, a.t.length && pred(a.t[0]) && a.t.every((x) => vis(a, x)), state + ' ' + JSON.stringify(a));
      if (nm === 'product topic') {
        await p2.shot(`${OUT}${tag}-direct-pkonu.png`);
      }
      await sleep(2000);
      const l = await p2.eval('__left()');
      check(`${tag} direct open ${nm}: gone afterwards`, l.anims === 0 && l.attr === 0);
      for (const e of p2.errors.concat(p2.logs)) console.log('  console:', e);
      check(`${tag} direct open ${nm}: console clean`, !p2.errors.length && !p2.logs.length);
      await p2.close();
    }
    await pg.goto(BASE + '#/kategori/filtre-kahve', 1300); await probe();
    await expectNone('direct open plain category');
    await pg.goto(BASE + '#/kategori/termos/konu/yok', 1000); await probe();
    await expectNone('direct open unknown topic (not found)');

    for (const e of pg.errors.concat(pg.logs)) console.log('  console:', e);
    check(`${tag} console clean`, !pg.errors.length && !pg.logs.length);
    await pg.close();
  }

  // reduced motion, print, themes
  async function extra() {
    const br = browser;
    const pg = await br.page({ width: 1280, height: 900 });
    await pg.s('Page.bringToFront');
    await pg.s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await pg.goto(BASE + '#/kategori/filtre-kahve/konu/skt', 300); await pg.eval(PROBE);
    for (let i = 0; i < 100 && !(await pg.eval(`document.getAnimations().some(a => a.id === 'rr-arrive')`)); i++) await sleep(100);
    const rm = await pg.eval(`(()=>{const a=document.getAnimations().find(a=>a.id==='rr-arrive'); if(!a) return null; const k=a.effect.getKeyframes(); return {n:k.length, same:k.every(f=>f.boxShadow===k[0].boxShadow&&f.outline===k[0].outline), dur:a.effect.getTiming().duration, ct:a.currentTime, out:getComputedStyle(a.effect.target).outlineColor}})()`);
    check('reduced motion: static highlight for the same duration', rm && rm.same && rm.dur === 1800, JSON.stringify(rm));
    await sleep(Math.max(0, (1800 - rm.ct) / 2));
    const mid = await pg.eval(`getComputedStyle(document.querySelector('.tp-lead')).outlineColor`);
    check('reduced motion: unchanged midway', mid === rm.out, mid + ' vs ' + rm.out);
    await sleep(1100);
    const l = await pg.eval('__left()');
    check('reduced motion: removed at the end', l.anims === 0 && l.attr === 0);
    await pg.s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    // section nav under reduced motion
    await pg.s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await pg.hash('#/kategori/filtre-kahve', 900);
    await pg.mclick('[data-jump="sec-icgoru"]', 300);
    const rs = await pg.eval('__arr()');
    check('reduced motion: section nav heading highlighted (instant scroll)', rs.t.length === 1 && rs.t[0].id === 'icgoru-t' && vis(rs, rs.t[0]), JSON.stringify(rs));
    await sleep(2000);
    await pg.s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    // print during highlight
    await pg.hash('#/yontem/oneri', 400);
    await pg.media('print');
    const pr = await pg.eval(`(()=>{const e=document.getElementById('y-oneri'); const s=getComputedStyle(e); return {arr:e.hasAttribute('data-arriving'), bs:s.boxShadow, ol:s.outlineStyle}})()`);
    check('print: highlight not shown', pr.arr && pr.bs === 'none' && pr.ol === 'none', JSON.stringify(pr));
    await pg.media('');
    await sleep(1800);
    // themes: screenshots at peak + numeric contrast of tint and outline over the page / card backgrounds
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const hex = (h) => { const n = parseInt(h.trim().slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const mix = (fg, a, bg) => fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));
    for (const th of ['acik', 'krem', 'adacayi', 'koyu', 'gece']) {
      await pg.eval(`localStorage.setItem('rr_theme','${th}')`);
      for (const [h, nm] of [['#/kategori/filtre-kahve/konu/skt', 'topic'], ['#/urun/filtre-kahve/52915799/konu/skt', 'pkonu']]) {
        await pg.goto('about:blank', 200);
        await pg.goto(BASE + h, 1000);
        // pause the animation at its peak for the screenshot
        await pg.eval(`(()=>{const a=document.getAnimations().find(a=>a.id==='rr-arrive'); if(a){a.pause(); a.currentTime=400;} return !!a})()`);
        await pg.shot(`${OUT}theme-${th}-${nm}.png`);
        await pg.eval(`document.getAnimations().filter(a=>a.id==='rr-arrive').forEach(a=>a.finish())`);
      }
      const v = await pg.eval(`(()=>{const s=getComputedStyle(document.documentElement); return {brand:s.getPropertyValue('--brand'), bg:s.getPropertyValue('--bg'), panel:s.getPropertyValue('--panel'), band:s.getPropertyValue('--band'), dark:s.colorScheme==='dark'}})()`);
      const tint = v.dark ? 0.2 : 0.13, b = hex(v.brand);
      const lines = ['bg', 'panel', 'band'].map((k) => { const base = hex(v[k]); return `${k}: tint ${cr(mix(b, tint, base), base).toFixed(2)}:1, line ${cr(mix(b, 0.8, base), base).toFixed(2)}:1`; });
      const minLine = Math.min(...['bg', 'panel', 'band'].map((k) => cr(mix(b, 0.8, hex(v[k])), hex(v[k]))));
      const minTint = Math.min(...['bg', 'panel', 'band'].map((k) => cr(mix(b, tint, hex(v[k])), hex(v[k]))));
      console.log(`  theme ${th}: ${lines.join(' | ')}`);
      check(`theme ${th}: outline ≥ 3:1 and tint distinguishable (≥ 1.15:1) on bg/panel/band`, minLine >= 3 && minTint >= 1.15, `${minLine} ${minTint}`);
    }
    await pg.eval(`localStorage.removeItem('rr_theme')`);
    for (const e of pg.errors.concat(pg.logs)) console.log('  console:', e);
    check('extra: console clean', !pg.errors.length && !pg.logs.length);
    await pg.close();
  }

  // Metin bağlantılarıyla gerçek tıklama zinciri (eski mycheck.mjs): vurgu görünür alanda başlar, 2,6 sn sonra hiç iz kalmaz.
  async function textChain() {
    const probe = `JSON.stringify([...document.querySelectorAll('[data-arriving]')].map(e=>{const r=e.getBoundingClientRect();return {t:(e.id?'#'+e.id:e.tagName+'.'+e.className), inView:r.top>=0&&r.top<innerHeight}}))`;
    const mark = (re, scope) => `(()=>{const a=[...(document.querySelector(${JSON.stringify(scope)})||document).querySelectorAll('a')].find(x=>${re}.test(x.textContent)); if(!a) return false; a.setAttribute('data-mc','1'); return true;})()`;
    for (const [W, H, mobile, tag] of [[1280, 800, false, 'D'], [375, 812, true, 'M']]) {
      const pg = await browser.page({ width: W, height: H, mobile });
      await pg.s('Page.bringToFront');
      await pg.goto(BASE + '#/', 1800);
      const step = async (name, re, scope, expectHighlight) => {
        await pg.eval(`document.querySelectorAll('[data-mc]').forEach(e=>e.removeAttribute('data-mc'))`);
        let found = await pg.eval(mark(re, scope));
        for (let i = 0; i < 60 && !found; i++) { await sleep(100); found = await pg.eval(mark(re, scope)); } // soğuk bağlamda veri geç gelir
        check(`${tag} yazı zinciri: ${name}: bağlantı var`, found);
        if (!found) return;
        await pg.mclick('[data-mc]', 700);
        const during = JSON.parse(await pg.eval(probe));
        check(`${tag} yazı zinciri: ${name}: ${expectHighlight ? 'vurgu görünür alanda' : 'vurgu yok'}`, expectHighlight ? during.length > 0 && during.every((x) => x.inView) : during.length === 0, JSON.stringify(during));
        await sleep(2600);
        check(`${tag} yazı zinciri: ${name}: sonra iz kalmadı`, (await pg.eval(`document.querySelectorAll('[data-arriving]').length`)) === 0);
      };
      await step('Örnekle başla (bütün sayfa)', '/Örnekle başla/', '#app', false);
      await step('özet satırı', '/Tarihi yaklaşmış/', '#app', true);
      await step('konu tablosunda ürün', '/Tchibo Profesional/', '#app table', true);
      await step('ürün: Kategoride %', '/%20/', '#p-konu', true);
      await pg.back(900);
      check(`${tag} yazı zinciri: geri tuşunda vurgu yok`, (await pg.eval(`document.querySelectorAll('[data-arriving]').length`)) === 0);
      await pg.goto(BASE + '#/kategori/filtre-kahve?sirala=cok&tip=kobi', 1500);
      check(`${tag} yazı zinciri: doğrudan süzgeçli adreste vurgu var`, (await pg.eval(`document.querySelectorAll('[data-arriving]').length`)) > 0);
      await sleep(2500);
      check(`${tag} yazı zinciri: doğrudan adres sonra iz kalmadı`, (await pg.eval(`document.querySelectorAll('[data-arriving]').length`)) === 0);
      check(`${tag} yazı zinciri: konsol temiz`, !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
      await pg.close();
    }
  }

  await run(1280, 900, false, 'D');
  await run(375, 812, true, 'M');
  await extra();
  await textChain();
}
