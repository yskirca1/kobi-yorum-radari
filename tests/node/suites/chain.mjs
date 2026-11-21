// Tıklama zinciri, konu görünümü aritmetiği, alıntılar, süzgeç/sıralama adreste, öneriler, kontrol listesi, yazdırma (eski verify.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sleep } from '../lib/driver.mjs';

const DATA = fileURLToPath(new URL('../../../data/', import.meta.url));

export default async function ({ browser: b, base: BASE, check, out }) {
  const REG = JSON.parse(readFileSync(DATA + 'kategoriler.json', 'utf8')).filter((c) => c.durum === 'hazir');
  const CAT = Object.fromEntries(REG.map((c) => [c.id, JSON.parse(readFileSync(DATA + c.id + '.json', 'utf8'))]));
  const pct = (v) => '%' + (v * 100).toFixed(0);
  const pg = await b.page();
  await pg.goto(BASE + '#/', 1500);

  // ---- 1. aritmetik: konu görünümündeki parçalar başlıktaki oranı verir (bütün kategoriler, bütün şikâyet konuları; olumlu konular 3 kategoride)
  const READ = `(()=>{const rows=[...document.querySelectorAll('.tp-table tbody tr:not(.tp-g):not(.tp-tot)')].map(tr=>{const td=tr.querySelectorAll('td');return {r:parseInt(td[0].innerText.replace('%','')),n:parseInt(td[1].innerText.replace(/\\./g,'')),k:td[2].innerText}});
    const sub=[...document.querySelectorAll('.tp-table tbody tr.tp-tot')].map(tr=>tr.querySelector('td').innerText);
    const groups=[...document.querySelectorAll('.tp-table tbody')].map(tb=>[...tb.querySelectorAll('tr:not(.tp-g):not(.tp-tot)')].map(tr=>{const td=tr.querySelectorAll('td');return {r:parseInt(td[0].innerText.replace('%','')),n:parseInt(td[1].innerText.replace(/\\./g,''))}}));
    const foot=document.querySelector('.tp-all td').innerText; return {rows,sub,groups,foot,lead:document.querySelector('.tp-lead b')?.innerText};})()`;
  const bad = [], log = [];
  let nChecked = 0;
  for (const c of REG) {
    const d = CAT[c.id], P = d.urunler, N = P.reduce((a, p) => a + p.ornek_dusuk, 0);
    for (const t of d.temalar) {
      const exp = P.reduce((a, p) => a + (p.sikayet[t.id] || 0) * p.ornek_dusuk, 0) / N;
      await pg.hash(`#/kategori/${c.id}/konu/${t.id}`, 120);
      const g = await pg.eval(READ);
      const sn = g.rows.reduce((a, r) => a + r.n, 0), sk = g.rows.reduce((a, r) => a + r.r / 100 * r.n, 0);
      const fromParts = pct(sk / sn), ok = fromParts === g.foot && g.foot === pct(exp) && sn === N && g.lead === pct(exp);
      const segs = new Set(P.map((p) => p.segment)).size > 1;
      let segOk = true;
      if (segs) {
        g.groups.forEach((rows, i) => { const n = rows.reduce((a, r) => a + r.n, 0), k = rows.reduce((a, r) => a + r.r / 100 * r.n, 0); if (pct(k / n) !== g.sub[i]) segOk = false; });
        const big = P.filter((p) => p.segment !== 'KOBİ'), kobi = P.filter((p) => p.segment === 'KOBİ');
        const w = (R) => R.reduce((a, p) => a + (p.sikayet[t.id] || 0) * p.ornek_dusuk, 0) / R.reduce((a, p) => a + p.ornek_dusuk, 0);
        if (g.sub[0] !== pct(w(big)) || g.sub[1] !== pct(w(kobi))) segOk = false;
      }
      nChecked++;
      if (!ok || !segOk) bad.push([c.id, t.id, fromParts, g.foot, pct(exp), sn, N, g.sub]);
      if (['filtre-kahve', 'termos', 'sweatshirt'].includes(c.id) && d.temalar.indexOf(t) < 2) log.push(`${c.id}/${t.id}: Σ(oran×okunan)=${sk.toFixed(1)} ÷ ${sn} = ${(sk / sn * 100).toFixed(2)}% → ${fromParts}; başlık ${g.foot}; veriden ${pct(exp)}${segs ? `; segment ${g.sub.join(' / ')}` : ''}`);
    }
  }
  check(`A: topic parts reproduce headline and segment rates (${nChecked} topics, 12 categories)`, !bad.length, JSON.stringify(bad.slice(0, 5)));
  // olumlu: basit ortalama
  const badP = [];
  for (const cid of ['filtre-kahve', 'termos', 'nevresim-takimi']) {
    const d = CAT[cid];
    for (const k of d.olumlu_konular) {
      await pg.hash(`#/kategori/${cid}/sevilen/${k.id}`, 120);
      const g = await pg.eval(READ);
      const exp = d.urunler.reduce((a, p) => a + (p.olumlu[k.id] || 0), 0) / d.urunler.length;
      const offN = await pg.eval(`(()=>{const m=document.querySelector('.tp-off th')?.innerText.match(/geçmediği (\\d+) ürün/); return m?+m[1]:0})()`);
      const rows = g.rows.filter((r) => r.r > 0);
      const S = rows.reduce((a, r) => a + r.r, 0), cnt = rows.length + offN;
      if (pct(S / 100 / cnt) !== g.foot || g.foot !== pct(exp) || cnt !== d.urunler.length) badP.push([cid, k.id, S, cnt, g.foot, pct(exp)]);
      if (cid === 'filtre-kahve' && d.olumlu_konular.indexOf(k) < 2) log.push(`${cid}/sevilen/${k.id}: oranların toplamı ${S} ÷ ${cnt} ürün = ${(S / cnt).toFixed(2)}% → başlık ${g.foot}; veriden ${pct(exp)}`);
    }
  }
  check('A: positive topic parts reproduce the simple mean (3 categories)', !badP.length, JSON.stringify(badP.slice(0, 5)));
  writeFileSync(out + 'arith.txt', log.join('\n'));

  // ---- 2. alıntılar: konu görünümünde yalnızca o konuya etiketli alıntılar; eski kategoride ad→kimlik çözümü
  const foldTr = (s) => s.toLocaleLowerCase('tr');
  let qBad = [];
  for (const [cid, tid] of [['termos', 'sizdirma'], ['sweatshirt', 'tuylenme'], ['filtre-kahve', 'skt'], ['sal', 'renk']]) {
    const d = CAT[cid], t = d.temalar.find((x) => x.id === tid);
    const expQ = d.urunler.flatMap((p) => p.alinti.filter((a) => a.konu === tid || a.konu === t.ad).map((a) => a.metin));
    await pg.hash(`#/kategori/${cid}/konu/${tid}`, 200);
    const got = await pg.eval(`[...document.querySelectorAll('#tp-q .q blockquote')].map(e=>e.innerText.replace(/^"|"$/g,''))`);
    if (JSON.stringify([...got].sort()) !== JSON.stringify([...expQ].sort())) qBad.push([cid, tid, got.length, expQ.length]);
  }
  check('Q: topic view shows exactly the quotes tagged with the topic (id and display-name data)', !qBad.length, JSON.stringify(qBad));
  await pg.hash('#/kategori/termos/konu/isi', 300);
  check('Q: products without a quote are listed with a Trendyol link in a new tab', await pg.eval(`[...document.querySelectorAll('.tp-noq li a.ext')].every(a=>a.target==='_blank'&&/trendyol\\.com/.test(a.href)&&a.rel.includes('noopener')) && document.querySelectorAll('.tp-noq li').length>0`));

  // ---- 3. zincir: ana sayfa → kategori → konu → ürün-konu → Trendyol
  await pg.hash('#/', 900);
  await pg.mclick('.hero-cta a', 900);
  check('C: home entry opens demo category', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve');
  await pg.mclick('.issues li:nth-child(2) a', 900);
  check('C: summary complaint row opens topic view', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve/konu/skt' && (await pg.eval('scrollY')) === 0);
  await pg.mclick('.tp-table tbody th a.go', 1000);
  const h3 = await pg.eval('location.hash');
  check('C: topic row opens product at that topic, scrolled to the topic card', /^#\/urun\/filtre-kahve\/\d+\/konu\/skt$/.test(h3) && await pg.eval(`document.activeElement.id==='p-konu' && Math.abs(document.getElementById('p-konu').getBoundingClientRect().top) < 200`), h3);
  check('C: product topic card has quotes filtered to the topic and a clear link', await pg.eval(`document.querySelectorAll('#p-konu .q').length>=1 && [...document.querySelectorAll('#p-konu .q figcaption')].every(f=>f.innerText.includes('Son kullanma')) && !!document.querySelector('#p-konu a.linkbtn[href$="${h3.split('/konu')[0].slice(1)}"]')`));
  check('C: Trendyol link opens a new tab', await pg.eval(`(()=>{const a=document.querySelector('#p-konu .pk-more a');return a.target==='_blank'&&/trendyol\\.com/.test(a.href)})()`));
  await pg.back(900);
  check('C: back returns to topic view', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve/konu/skt');
  await pg.back(900);
  check('C: back again returns to category', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve');
  await pg.fwd(900);
  check('C: forward goes to topic view again', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve/konu/skt' && (await pg.eval('document.querySelector("h1").innerText')) === 'Son kullanma tarihi yakın geldi');
  await pg.click('.pk-more', 100);

  // ---- 4. süzgeç ve sıralama adreste
  await pg.hash('#/kategori/filtre-kahve', 800);
  await pg.click('.fact .fig', 900);
  check('F: "1-2 yıldız payı" figure opens product list sorted by 1-2 star share', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve?sirala=cok' && (await pg.eval('document.getElementById("sort").value')) === 'cok' && await pg.eval('Math.abs(document.getElementById("sec-urun").getBoundingClientRect().top) < 200'));
  await pg.back(900);
  await pg.click('.fact-seg div:nth-child(2) a', 900);
  check('F: KOBİ figure → KOBİ products sorted by 1-2 star share', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve?sirala=cok&tip=kobi'
    && await pg.eval(`[...document.querySelectorAll('#pgrid .seg')].every(s=>s.innerText==='KOBİ') && document.querySelector('input[name=segment][value="KOBİ"]').checked`));
  const order = await pg.eval(`[...document.querySelectorAll('#pgrid .pc-meta dd.neg')].map(e=>parseFloat(e.innerText.replace('%','').replace(',','.')))`);
  check('F: list really is sorted by 1-2 star share, descending', order.length > 1 && order.every((v, i) => !i || order[i - 1] >= v), JSON.stringify(order));
  await pg.eval(`(()=>{const s=document.getElementById('sort'); s.value='puan'; s.dispatchEvent(new Event('change',{bubbles:true}));})()`); await sleep(300);
  check('F: changing sort writes the address', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve?sirala=puan&tip=kobi');
  await pg.eval(`document.querySelector('input[name=segment][value="KOBİ"]').click()`); await sleep(300);
  check('F: unticking a filter writes the address', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve?sirala=puan');
  await pg.back(800);
  check('F: back restores the previous filter state', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve?sirala=puan&tip=kobi' && await pg.eval(`document.querySelector('input[name=segment][value="KOBİ"]').checked && document.getElementById('sort').value==='puan'`));
  await pg.back(800);
  check('F: back again → sort cok', (await pg.eval('location.hash')) === '#/kategori/filtre-kahve?sirala=cok&tip=kobi' && (await pg.eval('document.getElementById("sort").value')) === 'cok');
  await pg.fwd(800);
  check('F: forward → sort puan', (await pg.eval('document.getElementById("sort").value')) === 'puan');
  // yapıştırılan adres
  const pg2 = await b.page();
  await pg2.goto(BASE + '#/kategori/sweatshirt?sirala=dusuk&tip=buyuk&puan=4.5', 1500);
  check('F: pasted address opens the same view', await pg2.eval(`document.getElementById('sort').value==='dusuk' && document.querySelector('input[name=segment][value="Büyük marka"]').checked && document.querySelector('input[name=puan][value="4.5"]').checked && document.querySelectorAll('#chips .chip').length===2`));
  for (const bad of ['?sirala=xyz', '?tip=kobi,kobi', '?tip=foo', '?marka=yok', '?sikayet=zzz', '?puan=5', '?dusuk=a', '?x=1', '?sirala=cok&sirala=puan']) {
    await pg2.hash('#/kategori/sweatshirt' + bad, 300);
    if ((await pg2.eval('document.querySelector("h1").innerText')) !== 'Sayfa bulunamadı') check('F: bad query → not found ' + bad, false);
  }
  check('F: bad query values show "Sayfa bulunamadı"', true);
  for (const bad of ['#/kategori/termos/konu/yok', '#/kategori/termos/sevilen/yok', '#/kategori/termos/xyz/isi', '#/urun/termos/780345921/konu/yok', '#/urun/termos/780345921/foo/isi', '#/kategori/termos/konu/isi?sirala=cok', '#/kategori/yok/konu/isi']) {
    await pg2.hash(bad, 300);
    check('R: not found ' + bad, (await pg2.eval('document.querySelector("h1").innerText')) === 'Sayfa bulunamadı');
  }
  await pg2.close();
  // kaydırma geri gelir: ürün listesinde aşağı in, ürüne git, geri
  await pg.hash('#/kategori/filtre-kahve?sirala=cok', 900);
  await pg.eval('scrollTo(0, document.getElementById("pgrid").getBoundingClientRect().top + scrollY + 600)'); await sleep(300);
  const y0 = await pg.eval('scrollY');
  await pg.eval(`document.querySelector('#pgrid .pc:nth-child(5) .pc-name').click()`); await sleep(900);
  check('F: product page "tüm ürünler" keeps the filter', await pg.eval(`document.querySelector('.pnav-back').getAttribute('href')`) === '#/kategori/filtre-kahve?sirala=cok');
  await pg.back(1000);
  check('F: back restores scroll on filtered category', Math.abs((await pg.eval('scrollY')) - y0) < 5, `${y0} vs ${await pg.eval('scrollY')}`);

  // ---- 5. öneriler ve kontrol listesi
  await pg.hash('#/kategori/termos', 800);
  const recs = await pg.eval(`[...document.querySelectorAll('#sec-oneri .recs li')].map(li=>({links:[...li.querySelectorAll('.rec-ev a.go')].map(a=>a.getAttribute('href')), gen: !!li.querySelector('.rec-gen'), figs:[...li.querySelectorAll('.rec-ev b')].map(b=>b.innerText)}))`);
  const td = CAT.termos, avg = (id) => td.urunler.reduce((a, p) => a + (p.sikayet[id] || 0) * p.ornek_dusuk, 0) / td.urunler.reduce((a, p) => a + p.ornek_dusuk, 0);
  const recExp = td.oneriler.map((o) => ({ links: [...(o.konular || []).map((k) => `#/kategori/termos/konu/${k}`), ...(o.sevilenler || []).map((k) => `#/kategori/termos/sevilen/${k}`)], gen: !(o.konular || []).length && !(o.sevilenler || []).length }));
  check('O: recommendation links match data konular/sevilenler', JSON.stringify(recs.map((r) => ({ links: r.links, gen: r.gen }))) === JSON.stringify(recExp), JSON.stringify(recs));
  check('O: recommendation figures are the live topic rates', recs.every((r, i) => (td.oneriler[i].konular || []).every((k, j) => r.figs[j] === pct(avg(k)))));
  const ck = await pg.eval(`[...document.querySelectorAll('#sec-kontrol li')].map(li=>[...li.querySelectorAll('.ck-ev a')].map(a=>a.getAttribute('href')))`);
  check('O: checklist items carry evidence links', ck.slice(0, 5).every((l) => l.length === 1 && l[0].startsWith('#/kategori/termos/konu/')) && ck.slice(5).every((l, i) => l.length === recExp[i].links.length));
  // alanlar yokken: bellekte taslak (veri dosyası değiştirilmez)
  const pg3 = await b.page();
  await pg3.s('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const f=window.fetch;window.fetch=(u,o)=>f(u,o).then(r=>{if(!/data\\/termos\\.json/.test(String(u)))return r;return r.json().then(j=>{j.oneriler.forEach((x,i)=>{if(i===0)delete x.konular; if(i===1){x.konular=[];x.sevilenler=[];} if(i===2){delete x.konular; delete x.sevilenler;} if(i===3) x.konular=['yok-boyle-konu'];});return new Response(JSON.stringify(j),{headers:{'Content-Type':'application/json'}});});});})()` });
  await pg3.goto(BASE + '#/kategori/termos', 1500);
  const st = await pg3.eval(`[...document.querySelectorAll('#sec-oneri .recs li')].slice(0,4).map(li=>!!li.querySelector('.rec-gen') && !li.querySelector('.rec-ev b'))`);
  check('O: missing/empty/unknown fields → "Genel öneri" without figure (in-memory stub)', st.every(Boolean) && !pg3.errors.length, JSON.stringify(st) + pg3.errors);
  await pg3.close();

  // ---- 6. tıklanabilir rakamlar başka sayfalarda
  await pg.hash('#/firsat', 1200);
  check('L: #/firsat table cells link to evidence', await pg.eval(`document.querySelectorAll('#ft-body tr[data-row] a.go').length >= 12*4`));
  const fl = await pg.eval(`document.querySelector('#ft-body tr[data-row] td:nth-child(7) a.go')?.getAttribute('href')`);
  check('L: 1 numaralı şikâyet cell → topic view', /^#\/kategori\/[^/]+\/konu\/[^/]+$/.test(fl || ''), fl);
  await pg.hash('#/', 1500);
  check('L: home KPI figures link to Yöntem and card "En sık şikâyet" to topic view', await pg.eval(`document.querySelectorAll('.kpis a.go[href^="#/yontem"]').length===4 && document.querySelectorAll('a.cat-top[href*="/konu/"]').length===12`));
  await pg.click('.cat[data-cat="termos"] a.cat-top', 900);
  check('L: home card complaint opens topic view', (await pg.eval('location.hash')) === '#/kategori/termos/konu/isi');
  await pg.hash('#/', 1200);
  await pg.mclick('.cat[data-cat="sal"] .cat-img', 900);
  check('L: clicking the card picture still opens the category', (await pg.eval('location.hash')) === '#/kategori/sal');
  // karşılaştırma
  await pg.eval(`localStorage.setItem('kyr_cmp', JSON.stringify([{cat:'termos',id:'780345921'},{cat:'termos',id:'764617800'}]))`);
  await pg.hash('#/karsilastir', 900);
  check('L: compare table complaint cells → product at topic', await pg.eval(`[...document.querySelectorAll('.ctable a.go')].filter(a=>/\\/urun\\/termos\\/\\d+\\/(konu|sevilen)\\//.test(a.getAttribute('href'))).length >= 6`));
  await pg.eval(`localStorage.removeItem('kyr_cmp')`);
  // ürün sayfası çubukları ve rakip kartı
  await pg.hash('#/urun/termos/780345921', 900);
  check('L: product bars, rival card and quotes link to product topics', await pg.eval(`document.querySelectorAll('.hb.go-row[href*="/urun/termos/780345921/konu/"]').length>=3 && document.querySelectorAll('.hb.go-row[href*="/sevilen/"]').length>=3 && document.querySelectorAll('.gp-t a.go').length>=1`));
  // klavye: Enter ile açılır
  await pg.hash('#/kategori/termos', 900);
  await pg.eval(`document.querySelector('.issues a').focus()`);
  await pg.key('Enter', 'Enter', 13, 900);
  check('K: Enter on a complaint row opens the topic view', (await pg.eval('location.hash')) === '#/kategori/termos/konu/isi');

  // ---- 7. yazdırma: #/firsat telefon genişliğinde
  const pm = await b.page({ width: 375, height: 812, mobile: true });
  await pm.goto(BASE + '#/firsat', 1800);
  await pm.media('print');
  check('P: #/firsat at phone width prints the table', await pm.eval(`document.querySelector('.fp-wrap').getClientRects().length>0 && [...document.querySelectorAll('#ft-body tr[data-row]')].filter(r=>r.getClientRects().length).length===12`));
  await pm.media('');
  const pdfLen = await pm.pdf(out + 'firsat-375.pdf');
  check('P: PDF generated', pdfLen > 20000, pdfLen);
  await pm.close();

  check('no console errors', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));

}
