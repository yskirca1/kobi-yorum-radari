// Her kategori, ürün ve şikâyet konusu sayfasındaki cevap cümlesi, data/*.json'dan bağımsız hesaplanan rakamlarla ve elle yazılmış Türkçe ek tablosuyla karşılaştırılır (eski sent21.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sleep } from '../lib/driver.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));

export default async function ({ browser, base: BASE, check, out }) {
  const REG = JSON.parse(readFileSync(REPO + 'data/kategoriler.json', 'utf8')).filter((c) => c.durum === 'hazir');
  const pct = (v, d = 0) => '%' + (v * 100).toFixed(d).replace('.', ',');
  // independent Turkish suffix tables (written by hand, not derived from app.js)
  const POSS = { 0: "'ı", 1: "'i", 2: "'si", 3: "'ü", 4: "'ü", 5: "'i", 6: "'sı", 7: "'si", 8: "'i", 9: "'u" };
  const POSS10 = { 10: "'u", 20: "'si", 30: "'u", 40: "'ı", 50: "'si", 60: "'ı", 70: "'i", 80: "'i", 90: "'ı", 100: "'ü" };
  const poss = (s) => { const m = /,(\d+)$/.exec(s); const n = parseInt(m ? m[1] : s.replace(/\D/g, ''), 10); if (n % 10) return POSS[n % 10]; if (n === 0) return "'ı"; return POSS10[n % 100 || 100]; };
  const LOC = { "'i": "'inde", "'ı": "'ında", "'u": "'unda", "'ü": "'ünde", "'si": "'sinde", "'sı": "'sında" };
  const possLoc = (s) => LOC[poss(s)];
  const LOCNAME = { termos: 'Termos bardakta', sweatshirt: 'Sweatshirtte', 'bluetooth-kulaklik': 'Bluetooth kulaklıkta', sal: 'Şalda', 'telefon-kilifi': 'Telefon kılıfında', 'dogal-sabun': 'Doğal sabunda', 'kedi-tirmalama': null, 'filtre-kahve': 'Filtre kahvede', 'bebek-arabasi': 'Bebek arabasında', 'kamp-sandalyesi': 'Kamp sandalyesinde', 'yuz-serumu': 'Yüz serumunda', 'nevresim-takimi': 'Nevresim takımında' };
  const fold = (s) => s.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/['’`]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const shortName = (p) => (fold(p.kisa).includes(fold(p.marka)) ? p.kisa.replace('Genel Markalar', 'Markasız') : `${p.marka === 'Genel Markalar' ? 'Markasız' : p.marka} ${p.kisa}`);
  // fraction rule (independent): nearer to 1/4, 1/3, 1/2, 2/3, 3/4 than to the nearest tenth -> say the fraction
  const FR = [[25, "yaklaşık her 4 yorumdan 1'inde", "yaklaşık her 4 yorumdan 1'i"], [100 / 3, "yaklaşık her 3 yorumdan 1'inde", "yaklaşık her 3 yorumdan 1'i"], [50, 'yorumların yaklaşık yarısında', 'yorumların yaklaşık yarısı'], [200 / 3, "yaklaşık her 3 yorumdan 2'sinde", "yaklaşık her 3 yorumdan 2'si"], [75, "yaklaşık her 4 yorumdan 3'ünde", "yaklaşık her 4 yorumdan 3'ü"]];
  const shareOf = (x, d = 0) => { const P = Math.round(x * 100 * 10 ** d) / 10 ** d; if (P < 9.5) return { base: 100, n: Math.round(P) };
    const n = Math.round(P / 10), dT = Math.abs(P - 10 * n); let f = null; for (const r of FR) if (Math.abs(P - r[0]) < dT && (!f || Math.abs(P - r[0]) < Math.abs(P - f[0]))) f = r; return { base: 10, n, f }; };
  const perLoc = (s) => s.f ? s.f[1] : (s.n >= s.base ? 'neredeyse hepsinde' : !s.n ? "yorumların %1'inden azında" : `her ${s.base} yorumdan yaklaşık ${s.n}${possLoc(String(s.n))}`);
  const perNom = (s) => s.f ? s.f[2] : (s.n >= s.base ? 'neredeyse hepsi' : !s.n ? "yorumların %1'inden azı" : `her ${s.base} yorumdan yaklaşık ${s.n}${poss(String(s.n))}`);
  const MIN = 30;

  const issues = [], forms = { cat: {}, seg: {}, prod: {}, topic: {}, pos: {} }, fallbacks = [];
  const bump = (k, f, who) => { forms[k][f] = (forms[k][f] || 0) + 1; };
  const ok = (cond, msg) => { if (!cond) issues.push(msg); };

  const br = browser;
  const pg = await br.page({ width: 1280, height: 900 });
  await pg.goto(BASE + '#/', 1200);
  const read = async (h) => {
    await pg.hash(h, 0);
    for (let i = 0; i < 200; i++) {
      await sleep(60);
      const r = await pg.eval(`(()=>{ if(location.hash!==${JSON.stringify(h)}) return null; const a=document.querySelector('#app .answer-block'); if(!a) return null;
        const s=document.querySelector('#sec-icgoru'); return {form:a.dataset.form, text:a.querySelector('.answer').innerText.replace(/\\s+/g,' ').trim(), sub:(a.querySelector('.answer-sub')||{}).innerText||'',
        seg: s ? {form:s.dataset.form, text:s.querySelector('.step-answer').innerText.replace(/\\s+/g,' ').trim()} : null, h1: (document.querySelector('h1')||{}).innerText}; })()`);
      if (r) return r;
    }
    return { form: 'TIMEOUT', text: await pg.eval(`location.hash + ' h1=' + (document.querySelector('h1') || {}).innerText`) + ' ' + JSON.stringify(pg.errors.concat(pg.logs).slice(-2)) };
  };

  for (const r of REG) {
    const c = JSON.parse(readFileSync(REPO + `data/${r.id}.json`, 'utf8')), P = c.urunler;
    const isK = (p) => p.segment === 'KOBİ', big = P.filter((p) => !isK(p)), kobi = P.filter(isK);
    const w = (rows, k) => { const n = rows.reduce((a, p) => a + p.ornek_dusuk, 0); return n ? rows.reduce((a, p) => a + (p.sikayet[k] || 0) * p.ornek_dusuk, 0) / n : 0; };
    const tema = c.temalar.map((t) => ({ ...t, tum: w(P, t.id), buyuk: w(big, t.id), kobi: w(kobi, t.id) })).sort((a, b) => b.tum - a.tum);
    const yaz = P.reduce((a, p) => a + p.yazili, 0), dus = P.reduce((a, p) => a + p.yildiz[0] + p.yildiz[1], 0), catLow = dus / yaz;
    const nBig = big.reduce((a, p) => a + p.ornek_dusuk, 0), nKobi = kobi.reduce((a, p) => a + p.ornek_dusuk, 0), iki = big.length && kobi.length;
    // --- category
    const A = await read(`#/kategori/${r.id}`), t0 = tema[0];
    bump('cat', A.form);
    const loc = LOCNAME[r.id] || `${c.ad.split(' ').slice(0, -1).join(' ')} ${c.ad.split(' ').pop()}`;
    if (LOCNAME[r.id] === null) { /* compound: check generic */ }
    const expCat = `${LOCNAME[r.id] ?? c.ad + 'nda'} 1-2 yıldızlı ${perLoc(shareOf(t0.tum))} aynı şikâyet var: ${t0.unlem.replace(/!$/, '')}.`;
    ok(A.form === 'standart' && A.text === expCat, `CAT ${r.id}: "${A.text}" ≠ "${expCat}"`);
    // segment step
    const lowSeg = (R) => R.reduce((a, p) => a + p.yildiz[0] + p.yildiz[1], 0) / R.reduce((a, p) => a + p.yazili, 0);
    let expSegForm;
    if (!iki) expSegForm = 'tek-grup';
    else if (nBig < MIN || nKobi < MIN) expSegForm = 'iki-grup-az-yorum';
    else { const g = tema.filter((t) => t.tum > 0).map((t) => Math.abs(Math.round(t.buyuk * 100) - Math.round(t.kobi * 100))).sort((a, b) => b - a)[0]; expSegForm = g >= 5 ? 'iki-grup' : 'iki-grup-fark-yok'; }
    bump('seg', A.seg.form);
    ok(A.seg.form === expSegForm, `SEG ${r.id}: form ${A.seg.form} ≠ ${expSegForm}`);
    if (iki) { ok(A.seg.text.includes(`büyük markada ${pct(lowSeg(big), 1)}, KOBİ'de ${pct(lowSeg(kobi), 1)}`), `SEG ${r.id}: segment 1-2 star shares missing: ${A.seg.text}`); }
    else ok(A.seg.text.startsWith(`Örneklemdeki ${P.length} ürünün hepsi ${kobi.length ? 'KOBİ' : 'büyük marka'} ürünü.`), `SEG ${r.id}: ${A.seg.text}`);
    if (expSegForm !== 'iki-grup' && expSegForm !== 'tek-grup' || (expSegForm === 'tek-grup')) fallbacks.push(`kategori ${r.id}, "Kimde var?": ${A.seg.form} → ${A.seg.text}`);
    if (expSegForm === 'iki-grup-az-yorum') ok(A.seg.text.includes(`yalnızca ${Math.min(nBig, nKobi)} adet`), `SEG ${r.id}: low n text`);
    // --- products
    for (const p of P) {
      const V = await read(`#/urun/${r.id}/${p.id}`);
      bump('prod', V.form);
      const n = p.ornek_dusuk, sik = Object.entries(p.sikayet).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      let exp;
      if (n === 0) exp = 'ornek-yok';
      else {
        let worse = [];
        if (n >= MIN) tema.forEach((t) => { const v = p.sikayet[t.id] || 0, a = t.tum, d = v - a, z = d / Math.sqrt(Math.max(a * (1 - a), 1e-4) / n); if (d >= 0.1 - 1e-9 && v >= 1.5 * a && Math.round(v * n) >= 5 && z >= 2) worse.push({ t, v, a }); });
        worse.sort((x, y) => Math.abs(y.v - y.a) - Math.abs(x.v - x.a));
        if (worse.length) { exp = 'zayif-nokta'; const x = worse[0]; ok(V.text === `Zayıf noktası: ${x.t.ad}.`, `PROD ${p.id}: "${V.text}"`); ok(V.sub.startsWith(`1-2 yıldızlı yorumlarının ${pct(x.v)}${possLoc(pct(x.v))} geçiyor; kategoride ${pct(x.a)}.`), `PROD ${p.id} sub: ${V.sub}`); }
        else if (!sik.length) exp = 'sikayet-yok';
        else { const t = tema.find((x) => x.id === sik[0][0]); exp = n >= MIN ? 'belirgin-fark-yok' : 'az-yorum'; ok(V.text === `En sık şikâyeti: ${t.ad}.`, `PROD ${p.id}: "${V.text}"`); ok(V.sub.includes(`${pct(sik[0][1])}${possLoc(pct(sik[0][1]))} geçiyor; kategoride ${pct(t.tum)}.`), `PROD ${p.id} sub: ${V.sub}`); }
      }
      ok(V.form === exp, `PROD ${r.id}/${p.id}: form ${V.form} ≠ ${exp}`);
      const low = (p.yildiz[0] + p.yildiz[1]) / p.yazili, yP = pct(low, 1);
      const yTxt = p.yildiz[0] + p.yildiz[1] === 0 ? 'Yazılı yorumlarında 1-2 yıldız yok.' : `Yazılı yorumlarının ${yP}${poss(yP)} 1-2 yıldız (${perNom(shareOf(low, 1))}); kategoride ${pct(catLow, 1)}.`;
      ok(V.sub.endsWith(`${isK(p) ? 'KOBİ ürünü' : 'Büyük marka ürünü'}. ${yTxt}`), `PROD ${p.id} tail: "${V.sub}" vs "${yTxt}"`);
      if (exp !== 'zayif-nokta') fallbacks.push(`ürün ${r.id}/${p.id} ${p.kisa} (okunan 1-2★ ${n}): ${V.form} → ${V.text}`);
    }
    // --- complaint topics
    for (const t of tema) {
      const T = await read(`#/kategori/${r.id}/konu/${t.id}`);
      bump('topic', T.form);
      const tops = P.map((p) => ({ p, v: p.sikayet[t.id] || 0, n: p.ornek_dusuk })).filter((x) => x.v > 0 && x.n >= MIN).sort((a, b) => b.v - a.v || b.n - a.n);
      const most = tops[0] ? ` En sık ${shortName(tops[0].p)} ürününde (${pct(tops[0].v)}).` : '';
      let exp, txt;
      if (!(t.tum > 0)) { exp = 'gecmiyor'; txt = 'Bu şikâyet okunan 1-2 yıldızlı yorumlarda geçmiyor.'; }
      else if (iki && nBig >= MIN && nKobi >= MIN) {
        const b = Math.round(t.buyuk * 100), k = Math.round(t.kobi * 100), d = b - k, hi = Math.max(b, k), lo = Math.min(b, k), nums = `büyük markada ${pct(t.buyuk)}, KOBİ'de ${pct(t.kobi)}`;
        if (Math.abs(d) < 5) { exp = 'iki-grup-benzer'; txt = `Büyük marka ve KOBİ ürünlerinde benzer sıklıkta: ${nums}.` + most; }
        else { exp = 'iki-grup'; txt = `Bu şikâyet ${d > 0 ? 'büyük marka' : 'KOBİ'} ürünlerinde ${hi >= 3 * lo && Math.abs(d) >= 10 ? 'çok daha' : 'daha'} sık: ${nums}.` + most; }
      } else {
        const nOn = P.filter((p) => (p.sikayet[t.id] || 0) > 0 && p.ornek_dusuk > 0).length, spread = `${P.length} ürünün ${nOn}${possLoc(String(nOn))} geçiyor.`;
        if (iki) { exp = 'iki-grup-az-yorum'; txt = `${spread}${most} ${nBig < MIN ? 'Büyük marka' : 'KOBİ'} ürünlerinde yalnızca ${Math.min(nBig, nKobi)} adet 1-2 yıldızlı yorum okundu; gruplar karşılaştırılmadı.`; }
        else { exp = 'tek-grup'; txt = spread + most; }
      }
      ok(T.form === exp && T.text === txt, `TOPIC ${r.id}/${t.id}: [${T.form}] "${T.text}" ≠ [${exp}] "${txt}"`);
      if (!most && t.tum > 0) fallbacks.push(`konu ${r.id}/${t.id}: en sık geçtiği ürün yazılmadı (konu, ${MIN}+ yorumu okunan hiçbir üründe geçmiyor)`);
    }
    // --- positive topics
    for (const k of c.olumlu_konular) {
      const T = await read(`#/kategori/${r.id}/sevilen/${k.id}`);
      bump('pos', T.form);
      const avg = P.reduce((a, p) => a + (p.olumlu[k.id] || 0), 0) / P.length;
      const tops = P.map((p) => ({ p, v: p.olumlu[k.id] || 0, n: p.onerilen_n ?? 100 })).filter((x) => x.v > 0 && x.n >= MIN).sort((a, b) => b.v - a.v || b.n - a.n);
      const txt = !(avg > 0) ? 'Bu konu okunan yorumlarda geçmiyor.' : `Trendyol'un ilk gösterdiği yorumlarda ürün başına ortalama ${perLoc(shareOf(avg))} geçiyor.${tops[0] ? ` En sık ${shortName(tops[0].p)} ürününde (${pct(tops[0].v)}).` : ''}`;
      ok(T.text === txt, `POS ${r.id}/${k.id}: "${T.text}" ≠ "${txt}"`);
      if (!(avg > 0) || !tops[0]) fallbacks.push(`olumlu konu ${r.id}/${k.id}: ${T.form} → ${T.text}`);
    }
    console.log('done', r.id);
  }
  const byKind = {};
  for (const x of issues) { const k = x.split(' ')[0]; (byKind[k] ||= []).push(x); }
  for (const [k, label] of [['CAT', 'kategori cümleleri'], ['SEG', 'kimde var adımı'], ['PROD', 'ürün hükümleri'], ['TOPIC', 'şikâyet konusu cümleleri'], ['POS', 'olumlu konu cümleleri']]) {
    check(`cümleler: ${label} bağımsız hesapla birebir`, !(byKind[k] || []).length, (byKind[k] || []).slice(0, 3).join(' | '));
  }
  check('cümleler: bilinmeyen sorun türü yok', Object.keys(byKind).every((k) => ['CAT', 'SEG', 'PROD', 'TOPIC', 'POS'].includes(k)), Object.keys(byKind).join(','));
  console.log(`  ${issues.length} sorun, ${fallbacks.length} yedek cümle (out/sentences-fallbacks.txt)`);
  writeFileSync(out + 'sentences-fallbacks.txt', fallbacks.join('\n'));
  check('cümleler: konsol temiz', !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
  await pg.close();
}
