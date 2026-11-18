(() => {
  const app = document.getElementById('app');
  const cache = {};
  let REG = [];
  const SITE = 'ReviewRadar';
  // Sekme başlığı ve sayfaya özel açıklama (meta description); açıklama verilmezse sitenin genel cümlesi
  const metaDesc = document.querySelector('meta[name="description"]'), DESC0 = metaDesc ? metaDesc.content : '';
  const setTitle = (t, d) => { document.title = t ? `${t} · ${SITE}` : SITE; if (metaDesc) metaDesc.content = d || DESC0; };
  const pct = (v, d = 0) => '%' + (v * 100).toFixed(d).replace('.', ',');
  const int = (v) => Number(v).toLocaleString('tr-TR');
  const dec = (v) => Number(v).toFixed(2).replace('.', ',');
  // İşaretli fark: +0,15 / −0,15 / 0,00 (eksi için gerçek eksi işareti)
  const sgn = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? '0,00' : (r > 0 ? '+' : '−') + dec(Math.abs(r)); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => s.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
  // Arama için: Türkçe küçük harf, aksansız (ş→s, â→a, é→e), kesme işareti silinir (L'Oréal = loreal), diğer noktalama boşluğa döner. "Tüylenme", "TUYLENME", "tuylenme" aynı.
  const fold = (s) => norm(String(s).replace(/['’`]/g, '')).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const isKobi = (p) => p.segment === 'KOBİ';
  const markaAd = (m) => (m === 'Genel Markalar' ? 'Markasız' : m);
  const onerN = (p) => p.onerilen_n ?? 100;
  const ready = () => REG.filter((c) => c.durum === 'hazir');
  const regOf = (id) => REG.find((c) => c.id === id);

  const getJSON1 = (u) => fetch(u, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  const getJSON = (u) => getJSON1(u).catch(() => getJSON1(u.replace(/^data\//, '')));
  // Başarısız yükleme önbellekte kalmaz; "Tekrar dene" yeniden ister.
  // LOADED: gelmiş kategori verileri (arama dizini bunu eşzamanlı okur; gelmeyen kategori aramada henüz yoktur)
  const LOADED = {};
  const loadCat = (id) => (cache[id] ??= getJSON(`data/${id}.json`).then(enrich).then((c) => { LOADED[id] = c; return c; }).catch((e) => { delete cache[id]; throw e; }));

  function enrich(c) {
    const P = c.urunler;
    const w = (rows, k) => { const n = rows.reduce((a, p) => a + p.ornek_dusuk, 0); return n ? rows.reduce((a, p) => a + (p.sikayet[k] || 0) * p.ornek_dusuk, 0) / n : 0; };
    const big = P.filter((p) => !isKobi(p)), kobi = P.filter(isKobi);
    c.tema = c.temalar.map((t) => ({ ...t, tum: w(P, t.id), buyuk: w(big, t.id), kobi: w(kobi, t.id) })).sort((a, b) => b.tum - a.tum);
    c.temaMap = Object.fromEntries(c.tema.map((t) => [t.id, t]));
    c.olk = c.olumlu_konular.map((k) => ({ ...k, tum: P.reduce((a, p) => a + (p.olumlu[k.id] || 0), 0) / P.length })).sort((a, b) => b.tum - a.tum);
    c.olkMap = Object.fromEntries(c.olk.map((k) => [k.id, k]));
    const yaz = P.reduce((a, p) => a + p.yazili, 0), dus = P.reduce((a, p) => a + p.yildiz[0] + p.yildiz[1], 0);
    c.top = { yazili: yaz, dusukN: dus, dusuk: dus / yaz, okunan: P.reduce((a, p) => a + onerN(p) + p.ornek_dusuk, 0), onerilenN: P.reduce((a, p) => a + onerN(p), 0), onerilen: P.reduce((a, p) => a + p.onerilen_dusuk, 0), ornek: P.reduce((a, p) => a + p.ornek_dusuk, 0) };
    P.forEach((p) => {
      p.dusuk = (p.yildiz[0] + p.yildiz[1]) / p.yazili;
      p.sik = Object.entries(p.sikayet).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ ...c.temaMap[k], v }));
      p.sev = Object.entries(p.olumlu).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ ...c.olkMap[k], v }));
    });
    return c;
  }

  // 1-2 yıldız örneği boş olan ürünler: kırmızı %0 ya da "-" yerine tek nötr cümle
  const noLow = (p) => p.ornek_dusuk === 0;
  const noLowText = (p) => (p.yildiz[0] + p.yildiz[1] > 0 || p.onerilen_dusuk > 0
    ? 'Puan filtresinde 1-2 yıldızlı yorum çıkmadı, bu yüzden şikâyet oranı hesaplanmadı.'
    : 'Bu üründe 1-2 yıldızlı yorum yok.');
  const noLowShort = (p) => (p.yildiz[0] + p.yildiz[1] > 0 || p.onerilen_dusuk > 0 ? 'Hesaplanmadı' : '1-2 yıldızlı yorum yok');
  const negCls = (v) => (v > 0 ? 'neg' : '');

  // ---- terim açıklamaları: "?" düğmesi aç/kapa (dokunma ve klavyeyle; üzerine gelince açılmaz). Ayrıntı Yöntem sayfasında. ----
  const TIPS = {
    yildiz: ['1-2 yıldız payı', "Trendyol'daki tüm yazılı yorumların yüzde kaçının 1 ya da 2 yıldız olduğu. Kategoride bütün ürünlerin yorumları birlikte sayılır.", 'yildiz'],
    sikayet: ['şikâyet oranı', 'Okunan 1-2 yıldızlı yorumların yüzde kaçında bu sorunun geçtiği. Bir yorum birden çok soruna girebilir, bu yüzden toplamı 100 etmez.', 'sikayet'],
    onerilen: ['"Önerilen" sıralama', 'Trendyol ürün sayfasında yorumları önce "Önerilen" sırasıyla gösterir. Müşterinin ilk okuduğu yorumlar bunlar. Her üründe bu sıranın ilk 100 yorumu okundu; yorumu az olan üründe daha azı.', 'iki-ornek'],
    segment: ['KOBİ ve büyük marka', 'Büyük marka: herkesin bildiği ulusal ya da uluslararası markalar ve büyük mağaza zincirlerinin kendi ürünleri. KOBİ: küçük ve orta ölçekli satıcılar; internetten büyüyen yerli markalar da bu grupta.', 'segment'],
  };
  let tipN = 0;
  const tip = (k, inline) => {
    const [term, text, a] = TIPS[k], id = 'tip-' + (++tipN);
    return `<span class="tipw${inline ? ' inl' : ''}"><button type="button" class="tip" aria-expanded="false" aria-controls="${id}" aria-label="Ne demek: ${esc(term)}"><span aria-hidden="true">?</span></button>`
      + `<span class="tip-box" id="${id}" hidden>${esc(text)} <a href="#/yontem/${a}">Yöntem sayfasında ayrıntı</a></span></span>`;
  };
  const gloss = (keys) => `<p class="gloss"><span class="muted">Terimler:</span> ${keys.map((k) => `<span class="gl">${esc(TIPS[k][0][0].toLocaleUpperCase('tr') + TIPS[k][0].slice(1))}${tip(k)}</span>`).join('')}</p>`;
  const setTip = (b, on) => {
    const box = document.getElementById(b.getAttribute('aria-controls'));
    if (!box) return;
    b.setAttribute('aria-expanded', String(on));
    box.hidden = !on;
    box.style.left = '';
    if (!on || b.closest('.inl')) return;
    // Ekran kenarından taşmasın (telefonda yana kaydırma olmasın)
    const r = box.getBoundingClientRect(), W = document.documentElement.clientWidth, m = 12;
    let dx = 0;
    if (r.right > W - m) dx = W - m - r.right;
    if (r.left + dx < m) dx = m - r.left;
    if (dx) box.style.left = (parseFloat(getComputedStyle(box).left) + dx) + 'px';
  };
  const openTip = () => document.querySelector('.tip[aria-expanded="true"]');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.tip');
    if (b) { const on = b.getAttribute('aria-expanded') !== 'true'; document.querySelectorAll('.tip[aria-expanded="true"]').forEach((x) => setTip(x, false)); setTip(b, on); return; }
    if (!e.target.closest('.tip-box')) document.querySelectorAll('.tip[aria-expanded="true"]').forEach((x) => setTip(x, false));
  });

  // Görsel yüklenemezse tarayıcının kırık simgesi yerine nötr yer tutucu
  document.addEventListener('error', (e) => {
    const i = e.target;
    if (!(i instanceof HTMLImageElement) || i.dataset.failed) return;
    i.dataset.failed = '1';
    const ph = document.createElement('span');
    ph.className = 'img-ph';
    ph.setAttribute('role', 'img');
    ph.setAttribute('aria-label', i.alt ? i.alt + ' (görsel yüklenemedi)' : 'Görsel yüklenemedi');
    if (!i.closest('.cmpbar')) ph.textContent = 'Görsel yok';
    i.replaceWith(ph);
  }, true);

  // ---- karşılaştırma seçimi ----
  const CK = 'kyr_cmp', MAXC = 4;
  const getCmp = () => { try { const v = JSON.parse(localStorage.getItem(CK)); return Array.isArray(v) ? v : []; } catch { return []; } };
  const setCmp = (v) => { try { localStorage.setItem(CK, JSON.stringify(v)); } catch {} syncChecks(); drawBar(); };
  const inCmp = (v, cat, id) => v.some((x) => x.cat === cat && x.id === id);
  const toggleCmp = (cat, id, on) => {
    const v = getCmp();
    if (!on) { setCmp(v.filter((x) => !(x.cat === cat && x.id === id))); return 'ok'; }
    if (inCmp(v, cat, id)) return 'ok';
    if (v.length && v[0].cat !== cat) return 'cat';
    if (v.length >= MAXC) return 'max';
    setCmp([...v, { cat, id }]);
    return 'ok';
  };
  const syncChecks = () => { const v = getCmp(); document.querySelectorAll('input[data-cmp]').forEach((i) => { i.checked = inCmp(v, i.dataset.cat, i.dataset.cmp); }); };
  let barMsg = null, barTimer = 0;
  const bar = document.getElementById('cmpbar'), barItems = document.getElementById('cmpbar-items'), barMsgEl = document.getElementById('cmpbar-msg'), barAct = document.getElementById('cmpbar-act'), cmpGo = document.getElementById('cmp-go');
  const flash = (text) => { clearTimeout(barTimer); barMsg = { type: 'info', text }; drawBar(); barTimer = setTimeout(() => { if (barMsg && barMsg.type === 'info') { barMsg = null; drawBar(); } }, 4000); };
  let barTok = 0;
  async function drawBar() {
    const v = getCmp(), tok = ++barTok;
    const setH = () => document.documentElement.style.setProperty('--cmpbar-h', bar.hidden ? '0px' : bar.offsetHeight + 'px');
    if (!v.length || location.hash.startsWith('#/karsilastir')) { bar.hidden = true; barMsg = null; setH(); return; }
    let c = null;
    try { c = await loadCat(v[0].cat); } catch { c = null; }
    if (tok !== barTok) return;
    const thumbs = v.map((x) => {
      const p = c && c.urunler.find((u) => u.id === x.id);
      const name = p ? p.kisa : x.id;
      return `<button type="button" class="cmp-th" data-rm="${esc(x.id)}" data-rmcat="${esc(x.cat)}" aria-label="${esc(name)}: karşılaştırmadan çıkar" title="${esc(name)}: çıkar">${p ? `<img src="${esc(p.gorsel)}" alt="" referrerpolicy="no-referrer">` : '<span class="img-ph"></span>'}<span class="x" aria-hidden="true">×</span></button>`;
    }).join('');
    const catName = c ? c.ad : (regOf(v[0].cat)?.ad || '');
    barItems.innerHTML = thumbs + `<span class="cmp-count"><b class="num">${v.length} / ${MAXC}</b> ürün seçildi${catName ? ` <span class="muted">· ${esc(catName)}</span>` : ''}${v.length < 2 ? '<br><span class="muted">Karşılaştırmak için en az 2 ürün seç</span>' : ''}</span>`;
    if (barMsg && barMsg.type === 'ask') {
      barMsgEl.innerHTML = `<span>Karşılaştırma tek kategoride yapılır. Seçimin ${esc(catName)} kategorisinde. Yeni karşılaştırma başlatılsın mı?</span><span class="cmpbar-btns"><button type="button" class="btn" data-ask="yes">Yeni karşılaştırma başlat</button><button type="button" class="btn ghost" data-ask="no">Vazgeç</button></span>`;
      barMsgEl.className = 'cmpbar-msg ask';
      barAct.hidden = true;
    } else if (barMsg && barMsg.type === 'info') {
      barMsgEl.innerHTML = `<span>${esc(barMsg.text)}</span>`;
      barMsgEl.className = 'cmpbar-msg info';
      barAct.hidden = false;
    } else { barMsgEl.innerHTML = ''; barMsgEl.className = 'cmpbar-msg'; barAct.hidden = false; }
    cmpGo.setAttribute('aria-disabled', String(v.length < 2));
    bar.hidden = false;
    setH();
  }
  cmpGo.addEventListener('click', (e) => { if (getCmp().length < 2) { e.preventDefault(); flash('Karşılaştırmak için en az 2 ürün seç.'); } });
  document.getElementById('cmp-clear').addEventListener('click', () => { barMsg = null; setCmp([]); });
  bar.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { toggleCmp(rm.dataset.rmcat, rm.dataset.rm, false); return; }
    const a = e.target.closest('[data-ask]');
    if (!a) return;
    const pend = barMsg && barMsg.pending;
    barMsg = null;
    if (a.dataset.ask === 'yes' && pend) { setCmp([{ cat: pend.cat, id: pend.id }]); }
    else drawBar();
    const back = pend && document.querySelector(`input[data-cmp="${CSS.escape(pend.id)}"][data-cat="${CSS.escape(pend.cat)}"]`);
    if (back) back.focus();
  });
  document.addEventListener('change', (e) => {
    const t = e.target.closest('input[data-cmp]');
    if (!t) return;
    const res = toggleCmp(t.dataset.cat, t.dataset.cmp, t.checked);
    if (res === 'max') { t.checked = false; flash(`En fazla ${MAXC} ürün karşılaştırılabilir.`); }
    else if (res === 'cat') {
      t.checked = false;
      clearTimeout(barTimer);
      barMsg = { type: 'ask', pending: { cat: t.dataset.cat, id: t.dataset.cmp } };
      drawBar().then(() => { const y = barMsgEl.querySelector('[data-ask="yes"]'); if (y) y.focus({ preventScroll: true }); });
    } else if (barMsg && barMsg.type === 'ask') { barMsg = null; drawBar(); }
    syncChecks();
  });
  window.addEventListener('storage', (e) => { if (e.key === CK) { syncChecks(); drawBar(); } });

  // ---- arama ----
  const form = document.getElementById('search'), q = document.getElementById('q'), sug = document.getElementById('suggest');
  // Kategoriler: ad ve eş anlamlılar (kategoriler.json, hemen hazır)
  const match = (s) => {
    const n = fold(s); if (!n) return [];
    return REG.map((c) => {
      const terms = [c.ad, ...(c.esanlam || [])].map(fold);
      const score = terms.some((t) => t === n) ? 3 : terms.some((t) => t.startsWith(n) || n.startsWith(t)) ? 2 : terms.some((t) => t.includes(n) || n.includes(t)) ? 1 : 0;
      return { c, score };
    }).filter((x) => x.score).sort((a, b) => b.score - a.score || (a.c.durum === 'hazir' ? -1 : 1)).map((x) => x.c);
  };
  // Ürün/marka ve şikâyet konuları: kelime kelime eşleşme. Türkçe ekler için kök toleransı:
  // "sızdırıyor" ~ "sızdırma", "tüylendi" ~ "tüylenme", "renk" ~ "rengi". Her arama kelimesi bir yerde geçmeli.
  const STOP = new Set(['ve', 'ile', 'mi', 'mu', 'de', 'da', 'bir', 'icin']);
  const toks = (s) => fold(s).split(' ').filter((w) => w && !STOP.has(w));
  const wordHit = (q, t) => {
    if (t.startsWith(q)) return q.length >= 2 || t === q ? 2 : 0;
    if (q.length >= 4 && 'kgtdpbc'.includes(q[q.length - 1]) && t.startsWith(q.slice(0, -1))) return 1;
    let i = 0; const m = Math.min(q.length, t.length);
    while (i < m && q[i] === t[i]) i++;
    return i >= 5 && i >= 0.7 * m ? 1 : 0;
  };
  // own: öğenin kendi adı (en az bir kelime burada geçmeli), ctx: bağlam (kategori adı), "Karaca termos" gibi aramalar için
  const itemScore = (qt, qf, own, ctx) => {
    const ow = own.flatMap(toks), cw = ctx.flatMap(toks);
    let s = 0, inOwn = false;
    for (const w of qt) {
      const a = Math.max(0, ...ow.map((t) => wordHit(w, t))), b = Math.max(0, ...cw.map((t) => wordHit(w, t)));
      if (!a && !b) return 0;
      if (a) inOwn = true;
      s += Math.max(a, b);
    }
    if (!inOwn) return 0;
    const of = own.map(fold);
    return s + (of.some((x) => x === qf) ? 3 : of.some((x) => x.includes(qf)) ? 2 : 0);
  };
  const MAXR = 40;
  function searchAll(term) {
    const qf = fold(term), qt = toks(term), cats = match(term), prods = [], topics = [];
    const r = ready(), loaded = r.filter((c) => LOADED[c.id]);
    if (qt.length) for (const rc of loaded) {
      const c = LOADED[rc.id], ctx = [c.ad, ...(c.esanlam || [])];
      c.urunler.forEach((p) => { const s = itemScore(qt, qf, [p.marka, markaAd(p.marka), p.ad, p.kisa], ctx); if (s) prods.push({ c, p, s }); });
      c.tema.forEach((t, i) => { const s = itemScore(qt, qf, [t.ad, t.unlem], ctx); if (s && t.tum > 0) topics.push({ c, t, rank: i + 1, s }); });
    }
    prods.sort((a, b) => b.s - a.s || b.p.yazili - a.p.yazili);
    topics.sort((a, b) => b.s - a.s || b.t.tum - a.t.tum);
    return { cats, prods: prods.slice(0, MAXR), topics: topics.slice(0, MAXR), nProd: prods.length, nTopic: topics.length, pending: r.length - loaded.length };
  }
  const prodName = (p) => `${markaAd(p.marka)} ${p.ad.replace(p.marka, '').trim()}`;
  const konuHref = (c, t) => `#/kategori/${c.id}/konu/${t.id}`;
  // Ürün ve şikâyet dizini kategori dosyalarına bağlı: kutuya odaklanınca hepsi istenir, geldikçe öneriler yenilenir
  let warm = null;
  const warmIndex = () => { if (warm || !REG.length) return; warm = Promise.all(ready().map((c) => loadCat(c.id).then(() => { if (document.activeElement === q && q.value.trim()) drawSug(true); }).catch(() => null))).then(() => { warm = null; if (document.activeElement === q && q.value.trim()) drawSug(true); }); };
  let sugIdx = -1;
  const sugOpts = () => [...sug.querySelectorAll('li[role="option"]:not([aria-disabled="true"])')];
  const closeSug = () => { sug.hidden = true; sugIdx = -1; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); };
  const markSug = () => {
    const o = sugOpts();
    o.forEach((li, i) => li.setAttribute('aria-selected', String(i === sugIdx)));
    if (o[sugIdx]) { q.setAttribute('aria-activedescendant', o[sugIdx].id); o[sugIdx].scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
  };
  // Gruplu öneri listesi: Kategoriler, Ürünler ve markalar, Şikâyet konuları (her grupta en fazla 4) + "tüm sonuçlar"
  const SG_MAX = 4;
  function drawSug(keep) {
    const term = q.value.trim();
    if (!fold(term)) { sug.innerHTML = ''; closeSug(); return; }
    const prevHref = keep && sugOpts()[sugIdx]?.dataset.href;
    const R = searchAll(term);
    let n = 0;
    const opt = (href, main, sub) => `<li role="option" id="sg-${n++}" aria-selected="false" data-href="${esc(href)}"><a href="${esc(href)}" tabindex="-1"><span>${main}</span><small class="muted">${sub}</small></a></li>`;
    const grp = (key, title, items) => (items.length ? `<li role="group" aria-labelledby="sgh-${key}" class="sg-grp"><div class="sg-h" id="sgh-${key}">${title}</div><ul role="presentation">${items.join('')}</ul></li>` : '');
    const cats = R.cats.slice(0, SG_MAX).map((c) => (c.durum === 'hazir' ? opt(`#/kategori/${c.id}`, esc(c.ad), `${int(c.urun)} ürün`)
      : `<li role="option" id="sg-${n++}" aria-disabled="true" class="off"><span>${esc(c.ad)}</span><small class="muted">Yakında</small></li>`));
    const prods = R.prods.slice(0, SG_MAX).map(({ c, p }) => opt(`#/urun/${c.id}/${p.id}`, esc(prodName(p)), esc(c.ad)));
    const topics = R.topics.slice(0, SG_MAX).map(({ c, t }) => opt(konuHref(c, t), esc(t.ad), `${esc(c.ad)} · şikâyet oranı ${pct(t.tum)}`));
    const more = R.cats.length > SG_MAX || R.nProd > SG_MAX || R.nTopic > SG_MAX || (R.nProd + R.nTopic && R.cats.length + R.nProd + R.nTopic > 1);
    const any = cats.length + prods.length + topics.length;
    sug.innerHTML = grp('k', 'Kategoriler', cats) + grp('u', 'Ürünler ve markalar', prods) + grp('s', 'Şikâyet konuları', topics)
      + (any && more ? `<li role="option" id="sg-${n++}" aria-selected="false" class="sg-all" data-href="#/ara/${esc(encodeURIComponent(term))}"><a href="#/ara/${esc(encodeURIComponent(term))}" tabindex="-1"><span>"${esc(term)}" için tüm sonuçlar</span><span aria-hidden="true">→</span></a></li>` : '')
      + (R.pending ? '<li role="presentation" class="sg-note muted">Ürün ve şikâyet sonuçları yükleniyor…</li>' : '');
    const show = !!(any || R.pending);
    sugIdx = -1;
    if (prevHref) { sugIdx = sugOpts().findIndex((o) => o.dataset.href === prevHref); }
    sug.hidden = !show;
    q.setAttribute('aria-expanded', String(show));
    markSug();
  }
  q.addEventListener('focus', warmIndex);
  q.addEventListener('input', () => { warmIndex(); drawSug(false); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!sug.hidden) { e.preventDefault(); closeSug(); } return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const o = sugOpts(); if (sug.hidden || !o.length) return;
    e.preventDefault();
    sugIdx = e.key === 'ArrowDown' ? (sugIdx + 1) % o.length : (sugIdx <= 0 ? o.length - 1 : sugIdx - 1);
    markSug();
  });
  sug.addEventListener('mousedown', (e) => { if (e.target.closest('li.off, .sg-h, .sg-note')) e.preventDefault(); });
  sug.addEventListener('click', (e) => { if (e.target.closest('li.off')) { e.preventDefault(); return; } if (e.target.closest('a')) { closeSug(); q.blur(); } });
  q.addEventListener('blur', () => setTimeout(closeSug, 150));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const o = sugOpts()[sugIdx];
    if (!sug.hidden && o) { closeSug(); location.hash = o.dataset.href; q.blur(); return; }
    const term = q.value.trim();
    if (!fold(term)) { closeSug(); return; }
    closeSug();
    // Kategori adı ya da eş anlamlısıyla birebir aynıysa kategoriye; tek kategori eşleşip ürün/şikâyet sonucu yoksa yine kategoriye; yoksa sonuç sayfası
    const R = searchAll(term), m = R.cats, f = fold(term);
    const exact = m.find((c) => [c.ad, ...(c.esanlam || [])].some((t) => fold(t) === f));
    const one = exact || (m.length === 1 && !R.nProd && !R.nTopic ? m[0] : null);
    location.hash = one && one.durum === 'hazir' ? `#/kategori/${one.id}` : `#/ara/${encodeURIComponent(term)}`;
    q.blur();
  });

  const hbar = (rows, cls = '', avgKey) => `<div class="hbars">${rows.map((r) => {
    const max = Math.max(...rows.map((x) => Math.max(x.v, avgKey ? x[avgKey] || 0 : 0)), 0.01);
    return `<div class="hb ${cls}"><span>${esc(r.ad)}</span><span class="tr"><i style="width:${(r.v / max) * 100}%"></i>${avgKey && r[avgKey] != null ? `<s style="left:${(r[avgKey] / max) * 100}%" title="Kategori ortalaması ${pct(r[avgKey])}"></s>` : ''}</span><span class="v">${pct(r.v)}</span></div>`;
  }).join('')}</div>`;

  // ---- görünümler ----
  // Kategori kartı (ana sayfa ve arama ortak). Hazır olmayan kategori tıklanamaz, soluk kart olarak görünür.
  const catCard = (c, d) => c.durum !== 'hazir' ? soonCard(c) : `
          <a class="cat" href="#/kategori/${esc(c.id)}" data-cat="${esc(c.id)}">
            <div class="cat-img">${c.gorsel ? `<img src="${esc(c.gorsel)}" alt="" width="400" height="600" referrerpolicy="no-referrer" loading="lazy" decoding="async">` : `<span class="cat-ph">${esc(c.ad)}</span>`}</div>
            <div class="cat-body"><small>${esc(c.ust)}</small><h3>${esc(c.ad)}</h3>
              <span class="muted num cat-n">${int(c.urun)} ürün · ${int(c.yorum)} yorum incelendi</span>${catTop(d)}
              <span class="cat-go">Analizi incele <span aria-hidden="true">→</span></span></div>
          </a>`;
  // Kategori verisi gelmeden yeri ayrılmış boş kutu; veri gelince doldurulur (sayfa zıplamaz)
  const catTop = (d) => (d === undefined ? '<span class="cat-top wait" aria-hidden="true"></span>'
    : d && d.tema[0] ? `<span class="cat-top">En sık şikâyet: ${esc(d.tema[0].ad)} <b class="num">${pct(d.tema[0].tum)}</b></span>` : '');
  const soonCard = (c) => `<div class="soon-card" aria-label="${esc(c.ad)}, yakında"><small>${esc(c.ust)}</small><b>${esc(c.ad)}</b><span class="tag">Yakında</span></div>`;

  const loadAll = async () => { const r = ready(); return Object.fromEntries((await Promise.all(r.map((c) => loadCat(c.id).catch(() => null)))).map((d, i) => [r[i].id, d])); };
  const totals = (data) => {
    const r = ready(), D = Object.values(data).filter(Boolean);
    const s = (f) => D.reduce((a, d) => a + f(d), 0);
    return { kat: r.length, urun: r.reduce((a, c) => a + (c.urun || 0), 0), yazili: s((d) => d.top.yazili), okunan: r.reduce((a, c) => a + (c.yorum || 0), 0),
      dusukN: s((d) => d.top.dusukN), onerilenN: s((d) => d.top.onerilenN), onerilen: s((d) => d.top.onerilen), ornek: s((d) => d.top.ornek), tam: D.length === r.length };
  };
  // yazili null ise (kategori dosyaları henüz gelmedi) yeri ayrılmış "…" gösterilir, sonra doldurulur
  const kpiList = (t, cls = 'kpis') => `<dl class="${cls}">
          <div><dt>Analiz edilen kategori</dt><dd class="num">${t.kat}</dd></div>
          <div><dt>İncelenen ürün</dt><dd class="num">${int(t.urun)}</dd></div>
          <div><dt>Yazılı yorum</dt><dd class="num" id="kpi-yazili">${t.yazili == null ? '<span aria-hidden="true">…</span><span class="sr-only">yükleniyor</span>' : int(t.yazili)}</dd></div>
          <div><dt>Tek tek okunan yorum</dt><dd class="num">${int(t.okunan)}</dd></div>
        </dl>`;

  let homeAlan = '';
  // Ana sayfa yalnızca kategoriler.json ile hemen çizilir; kategori dosyalarına bağlı rakamlar geldikçe yerine yazılır.
  async function home(isStale) {
    setTitle('');
    const r0 = ready();
    const data = {};
    const alanlar = [...new Set(r0.map((c) => c.ust))].sort((a, b) => a.localeCompare(b, 'tr'));
    if (homeAlan && !alanlar.includes(homeAlan)) homeAlan = '';
    const t0 = { kat: r0.length, urun: r0.reduce((a, c) => a + (c.urun || 0), 0), okunan: r0.reduce((a, c) => a + (c.yorum || 0), 0), yazili: null };
    app.innerHTML = `
      <section class="band hero-band">
        <div class="hero">
          <span class="eyebrow">KOBİ'ler için müşteri yorumu analizi</span>
          <h1>Satmak istediğin üründe müşteri neden memnun değil?</h1>
          <p class="lead">Rakip ürünlerin binlerce yorumunu tek tek okuduk. Bir kategori seç; en sık şikâyetleri, müşterinin neyi sevdiğini ve pazara girerken neye dikkat etmen gerektiğini gör.</p>
          <p class="steps"><span class="sr-only">Nasıl kullanılır: </span><span><b>1.</b> Kategori seç</span><span><b>2.</b> Şikâyetleri gör</span><span><b>3.</b> Ürünleri karşılaştır</span></p>
        </div>
        ${kpiList(t0)}
      </section>
      <div class="alan-f" role="group" aria-label="Alana göre filtrele"><span class="muted">Alan:</span>
        ${['', ...alanlar].map((a) => `<button type="button" class="chip${a === homeAlan ? ' on' : ''}" data-alan="${esc(a)}" aria-pressed="${a === homeAlan}">${a ? esc(a) : 'Tümü'}</button>`).join('')}</div>
      <div id="home-list"></div>
      <section class="reads" id="reads" aria-labelledby="reads-t"></section>`;
    const draw = () => {
      const sec = (c) => !homeAlan || c.ust === homeAlan;
      const r = r0.filter(sec), soon = REG.filter((c) => c.durum !== 'hazir' && sec(c));
      document.getElementById('home-list').innerHTML = `
        <section class="sec"><div class="sec-top"><h2>Analiz edilen kategoriler</h2><span class="muted num">${r.length} kategori</span></div>
          <div class="cats">${r.map((c) => catCard(c, data[c.id])).join('')}</div>
        </section>
        ${soon.length ? `<section class="sec soon-sec" aria-labelledby="soon-t"><div class="sec-top"><h2 id="soon-t">Yakında</h2></div><div class="soon-cats">${soon.map(soonCard).join('')}</div></section>` : ''}`;
      app.querySelectorAll('[data-alan]').forEach((x) => { const on = x.dataset.alan === homeAlan; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    };
    app.onclick = (e) => { const x = e.target.closest('[data-alan]'); if (x) { homeAlan = x.dataset.alan; draw(); } };
    draw();
    // Beklenmez: yönlendirme burada biter ("Yükleniyor…" ekranı ana sayfanın üstüne yazılmaz)
    Promise.all(r0.map((c) => loadCat(c.id).catch(() => null).then((d) => {
      if (isStale()) return;
      data[c.id] = d;
      const card = app.querySelector(`.cat[data-cat="${CSS.escape(c.id)}"] .cat-top.wait`);
      if (card) card.outerHTML = catTop(d);
    }))).then(() => {
      if (isStale()) return;
      const kp = document.getElementById('kpi-yazili');
      if (kp) kp.textContent = int(totals(data).yazili);
      fillReads(data);
    });
  }
  // Ana sayfa okuma şeridi: kategori verisi geldikçe doldurulur, yüksekliği CSS'te ayrılmıştır
  function fillReads(data) {
    const el = document.getElementById('reads');
    if (!el) return;
    const reads = readings(catRows(data));
    if (!reads.length) { el.remove(); return; }
    el.innerHTML = `<div class="sec-top"><h2 id="reads-t" class="label">Kategoriler yan yana</h2><a class="reads-all" href="#/firsat">Kategorileri puanla ve karşılaştır <span aria-hidden="true">→</span></a></div>
      <ul class="reads-list">${reads.map((x) => `<li><a href="#/firsat"><span class="label">${esc(x.k)}</span><span>${x.t}</span></a></li>`).join('')}</ul>
      ${gloss(['yildiz', 'sikayet', 'segment'])}`;
  }

  // Arama sonuçları: kategoriler, ürünler ve markalar, şikâyet konuları. Bütün kategori dosyaları beklenir;
  // yüklenemeyen kategori varsa sonuçların eksik olabileceği yazılır.
  async function search(term, isStale) {
    const data = await loadAll();
    if (isStale()) return;
    const R = searchAll(term), m = R.cats, nHit = m.length + R.nProd + R.nTopic;
    setTitle(`"${term}" araması`, `ReviewRadar'da "${term}" araması: eşleşen kategoriler, ürünler ve şikâyet konuları.`);
    const avail = ready();
    const cnt = [m.length && `${m.length} kategori`, R.nProd && `${R.nProd} ürün`, R.nTopic && `${R.nTopic} şikâyet konusu`].filter(Boolean).join(' · ');
    const failNote = R.pending ? `<p class="note sr-fail">${R.pending} kategorinin verisi yüklenemedi; ürün ve şikâyet sonuçları eksik olabilir.</p>` : '';
    const prodRow = ({ c, p }) => `<li><a class="sr-row" href="#/urun/${esc(c.id)}/${esc(p.id)}">
        <span class="sr-img"><img src="${esc(p.gorsel)}" alt="" width="48" height="60" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>
        <span class="sr-main"><b>${esc(markaAd(p.marka))}</b> ${esc(p.ad.replace(p.marka, '').trim())}<small class="muted">${esc(c.ad)} · ${esc(p.segment)}</small></span>
        <span class="sr-fig"><span class="num ${negCls(p.dusuk)}">${pct(p.dusuk, 1)}</span><small class="muted">1-2 yıldız payı</small></span></a></li>`;
    const topicRow = ({ c, t, rank }) => `<li><a class="sr-row" href="${esc(konuHref(c, t))}">
        <span class="sr-main"><b>${esc(t.ad)}</b><small class="muted">${esc(c.ad)} · en sık ${rank}. şikâyet</small></span>
        <span class="sr-fig"><span class="num neg">${pct(t.tum)}</span><small class="muted">şikâyet oranı</small></span></a></li>`;
    const more = (n, shown) => (n > shown ? `<p class="muted sr-more">İlk ${shown} sonuç gösteriliyor. Aramayı daraltabilirsin.</p>` : '');
    app.innerHTML = `<div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Arama</div>
      <div class="chead"><h1>${nHit ? `"${esc(term)}" için sonuçlar` : `"${esc(term)}" için sonuç bulunamadı`}</h1>${nHit ? `<p class="muted num">${cnt}</p>` : ''}</div></div>
      ${nHit ? `${failNote}
        ${m.length ? `<section class="sres" aria-labelledby="sr-k"><h2 id="sr-k">Kategoriler</h2><div class="cats search-res">${m.map((c) => catCard(c, data[c.id])).join('')}</div></section>` : ''}
        ${R.nProd ? `<section class="sres" aria-labelledby="sr-u"><h2 id="sr-u">Ürünler ve markalar</h2><ul class="sr-list">${R.prods.map(prodRow).join('')}</ul>${more(R.nProd, R.prods.length)}</section>` : ''}
        ${R.nTopic ? `<section class="sres" aria-labelledby="sr-s"><h2 id="sr-s">Şikâyet konuları ${tip('sikayet')}</h2><p class="muted">Konuya tıklayınca kategori sayfası o şikâyetle açılır.</p><ul class="sr-list">${R.topics.map(topicRow).join('')}</ul>${more(R.nTopic, R.topics.length)}</section>` : ''}`
      : `<div class="empty"><p>Kategori, ürün, marka ya da şikâyet adıyla arayabilirsin. Örneğin "Karaca", "tüylenme", "sızdırıyor".</p>${failNote}<p>Şu an analiz edilen kategoriler:</p><ul class="cat-links">${avail.map((c) => `<li><a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a></li>`).join('')}</ul></div>`}`;
  }

  let lastCat = (() => { try { return sessionStorage.getItem('rr_last_cat') || ''; } catch { return ''; } })();
  const rememberCat = (id) => { lastCat = id; try { sessionStorage.setItem('rr_last_cat', id); } catch {} };

  function notFound(msg, back) {
    setTitle('Sayfa bulunamadı');
    app.innerHTML = `<div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Bulunamadı</div><div class="chead"><h1>Sayfa bulunamadı</h1></div></div><div class="empty"><p class="muted">${esc(msg || 'Aradığın sayfa bu sitede yok.')}</p>${back || '<a class="btn" href="#/">Ana sayfaya dön</a>'}</div>`;
  }

  // Mobil filtre çekmecesi
  let drawerReturn = null;
  const drawerMQ = matchMedia('(max-width: 860px)');
  function openDrawer() {
    const aside = document.getElementById('filters'), bd = document.getElementById('f-backdrop');
    if (!aside) return;
    drawerReturn = document.getElementById('f-open');
    aside.classList.add('open'); aside.inert = false;
    aside.setAttribute('role', 'dialog'); aside.setAttribute('aria-modal', 'true');
    if (bd) bd.hidden = false;
    document.body.classList.add('drawer-open');
    drawerReturn?.setAttribute('aria-expanded', 'true');
    document.getElementById('f-close')?.focus();
  }
  function closeDrawer(returnFocus = true) {
    const aside = document.getElementById('filters'), bd = document.getElementById('f-backdrop');
    document.body.classList.remove('drawer-open');
    if (bd) bd.hidden = true;
    if (!aside || !aside.classList.contains('open')) return;
    aside.classList.remove('open');
    aside.removeAttribute('role'); aside.removeAttribute('aria-modal');
    aside.inert = drawerMQ.matches;
    document.getElementById('f-open')?.setAttribute('aria-expanded', 'false');
    if (returnFocus && drawerReturn) drawerReturn.focus();
  }
  const syncDrawerInert = () => { const a = document.getElementById('filters'); if (a) a.inert = drawerMQ.matches && !a.classList.contains('open'); if (!drawerMQ.matches) closeDrawer(false); };
  drawerMQ.addEventListener('change', syncDrawerInert);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const t = openTip();
    if (t) { e.preventDefault(); setTip(t, false); t.focus(); return; }
    const a = document.getElementById('filters');
    if (a && a.classList.contains('open')) { e.preventDefault(); closeDrawer(); }
  });

  // ---- giriş kontrol listesi: kategorinin en sık 5 şikâyeti (özet kutusundaki adıyla) + önerilerinin başlıkları; işaretler kategori başına localStorage'da ----
  const CKP = 'rr_ck_', ckMem = {};
  let ckStore = null; // localStorage yazılabiliyor mu (ilk kullanımda denenir)
  const ckCanStore = () => {
    if (ckStore === null) { try { localStorage.setItem(CKP + 't', '1'); localStorage.removeItem(CKP + 't'); ckStore = true; } catch { ckStore = false; } }
    return ckStore;
  };
  const ckGet = (cid) => {
    if (ckCanStore()) { try { const v = JSON.parse(localStorage.getItem(CKP + cid)); if (Array.isArray(v)) return new Set(v); } catch {} }
    return new Set(ckMem[cid] || []);
  };
  const ckSet = (cid, s) => { ckMem[cid] = [...s]; if (ckCanStore()) { try { if (s.size) localStorage.setItem(CKP + cid, JSON.stringify([...s])); else localStorage.removeItem(CKP + cid); } catch {} } };
  const ckItems = (c) => [
    ...c.tema.filter((t) => t.tum > 0).slice(0, 5).map((t) => ({ k: 't:' + t.id, g: 's', t: t.unlem.replace(/!$/, ''), sub: `şikâyet oranı ${pct(t.tum)}` })),
    ...c.oneriler.map((o) => ({ k: 'o:' + fold(o.baslik).slice(0, 48), g: 'o', t: o.baslik })),
  ];
  function checklist(c) {
    const items = ckItems(c), on = ckGet(c.id);
    const li = (it) => `<li${on.has(it.k) ? ' data-on=""' : ''}><label><input type="checkbox" data-ck="${esc(it.k)}"${on.has(it.k) ? ' checked' : ''}><span class="ck-prt" aria-hidden="true"></span><span class="ck-t">${esc(it.t)}${it.sub ? ` <small class="muted num">${esc(it.sub)}</small>` : ''}</span></label></li>`;
    const g = (k, title, hint) => `<fieldset class="ck-g"><legend>${title}</legend><p class="muted ck-hint">${hint}</p><ul>${items.filter((it) => it.g === k).map(li).join('')}</ul></fieldset>`;
    return `<section class="card ck-card jump" id="sec-kontrol" tabindex="-1" aria-labelledby="ck-t">
        <div class="ck-head"><h2 id="ck-t">Giriş kontrol listesi</h2><p class="ck-prog"><b class="num" id="ck-n"></b> <span id="ck-of"></span></p></div>
        <p class="muted">Bu kategorinin en sık şikâyetlerinden ve önerilerinden çıkarıldı. Ürününde ve ilanında hallettiklerini işaretle.</p>
        <div class="ck-bar" aria-hidden="true"><i id="ck-bar"></i></div>
        <div class="ck-groups">${g('s', 'En sık şikâyetler', 'Ürününde ve ilanında bu sorunu önlediysen işaretle.')}${g('o', 'Öneriler', 'Uyguladığında işaretle.')}</div>
        <p class="ck-foot"><button type="button" class="linkbtn" id="ck-reset">İşaretleri temizle</button><span class="muted" id="ck-store"></span></p>
      </section>`;
  }
  function ckSync(c) {
    const box = document.getElementById('sec-kontrol');
    if (!box) return;
    const all = [...box.querySelectorAll('[data-ck]')], n = all.filter((i) => i.checked).length;
    all.forEach((i) => { const l = i.closest('li'); if (i.checked) l.setAttribute('data-on', ''); else l.removeAttribute('data-on'); });
    document.getElementById('ck-n').textContent = `${n} / ${all.length}`;
    document.getElementById('ck-of').textContent = 'işaretlendi';
    document.getElementById('ck-bar').style.width = (all.length ? (n / all.length) * 100 : 0) + '%';
    document.getElementById('ck-reset').hidden = !n;
    document.getElementById('ck-store').textContent = ckCanStore() ? 'İşaretler bu tarayıcıda saklanır.' : 'Bu tarayıcı işaretleri saklamıyor; sayfayı kapatınca silinir.';
  }

  // Aramadan gelen şikâyet konusu (#/kategori/<id>/konu/<tema>): sayfanın başında o konunun rakamları
  function konuBox(c, t) {
    const rank = c.tema.indexOf(t) + 1, segIki = new Set(c.urunler.map((p) => p.segment)).size > 1;
    const top = c.urunler.filter((p) => p.ornek_dusuk >= GAP.minN && (p.sikayet[t.id] || 0) > 0).sort((a, b) => b.sikayet[t.id] - a.sikayet[t.id]).slice(0, 3);
    return `<section class="konu-box prt-hide" id="konu" tabindex="-1" aria-labelledby="konu-t">
        <div class="konu-top"><span class="label">Aradığın şikâyet</span><a class="linkbtn" href="#/kategori/${esc(c.id)}">Kapat<span class="sr-only">: şikâyet kutusunu kapat</span></a></div>
        <h2 id="konu-t">${esc(t.ad)}</h2>
        <p>Şikâyet oranı <b class="neg num">${pct(t.tum)}</b>: okunan <span class="nowrap">1-2 yıldızlı</span> yorumların bu kadarında geçiyor. Bu kategorinin en sık ${rank}. şikâyeti (${c.tema.length} konu içinde).${segIki ? ` Büyük marka ürünlerinde <b class="neg num">${pct(t.buyuk)}</b>, KOBİ ürünlerinde <b class="neg num">${pct(t.kobi)}</b>.` : ''}</p>
        ${top.length ? `<div class="konu-p"><h3>En çok geçtiği ürünler</h3><ol>${top.map((p) => `<li><a href="#/urun/${esc(c.id)}/${esc(p.id)}">${esc(prodName(p))}</a> <b class="neg num">${pct(p.sikayet[t.id])}</b></li>`).join('')}</ol><p class="muted">En az ${GAP.minN} adet 1-2 yıldızlı yorumu okunan ürünler arasında.</p></div>` : ''}
      </section>`;
  }

  async function category(id, isStale, konu) {
    const r = regOf(id);
    if (!r) { notFound('Bu kategori bu sitede yok.'); return; }
    if (r.durum !== 'hazir') {
      setTitle(`${r.ad} (yakında)`);
      app.innerHTML = `<div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(r.ad)}</div><div class="chead"><h1>${esc(r.ad)}</h1></div></div><div class="empty"><p class="muted">Bu kategorinin yorumları henüz toplanmadı.</p><a class="btn" href="#/">Kategorilere dön</a></div>`;
      return;
    }
    const c = await loadCat(id);
    if (isStale()) return;
    rememberCat(id);
    const kt = konu ? c.temaMap[konu] : null;
    setTitle(kt ? `${kt.ad}: ${c.ad}` : c.ad, `${c.ad}: ${c.urunler.length} ürünün ${int(c.top.yazili)} yazılı yorumundan en sık şikâyetler, satıcı için öneriler ve giriş kontrol listesi.`);
    const top4 = c.tema.slice(0, 4), max = top4[0].tum;
    const seg = c.tema.filter((t) => t.id !== 'gosterge').slice(0, 5);
    const segIki = new Set(c.urunler.map((p) => p.segment)).size > 1;
    const sort = sessionSort[id] || 'yorum';
    const tamYuz = c.top.onerilenN === c.urunler.length * 100;
    const sl = segLow(c), on = c.top.onerilen;
    const SECS = [['sec-ozet', 'Özet'], ['sec-oneri', 'Ne yapmalı?'], ['sec-icgoru', 'İçgörüler'], ['sec-urun', 'Ürünler'], ['sec-kontrol', 'Kontrol<span class="sn-long"> listesi</span>']];
    app.innerHTML = `
      <div class="band phead">
        <div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(c.ust)} / ${esc(c.ad)}</div>
        <div class="chead"><p class="print-only prt-brand">${SITE} · Kategori raporu</p><span class="eyebrow">${esc(c.ust)}</span><h1>${esc(c.ad)}</h1>
          <ul class="meta num"><li><b>${c.urunler.length}</b> ürün</li><li><b>${int(c.top.yazili)}</b> yazılı yorum</li><li><b>${int(c.top.okunan)}</b> yorum okundu</li><li>Kaynak: <b>${esc(c.kaynak)}</b></li></ul>
          <div class="chead-act"><button type="button" class="btn ghost" id="print-btn">Raporu yazdır / PDF</button></div></div>
      </div>
      <nav class="band secnav" id="secnav" aria-label="Sayfanın bölümleri"><div class="secnav-in">${SECS.map(([id, t]) => `<button type="button" data-jump="${id}">${t}</button>`).join('')}</div></nav>
      ${kt ? konuBox(c, kt) : ''}
      <section class="summary jump" id="sec-ozet" tabindex="-1" aria-labelledby="sum-t">
        <div class="sum-main">
          <h2 class="label" id="sum-t">En sık şikâyetler ${tip('sikayet')}</h2>
          <ol class="issues">${top4.map((t) => `<li><span class="t">${esc(t.unlem.replace(/!$/, ''))}</span><span class="p">${pct(t.tum)}</span><span class="bar"><i style="width:${(t.tum / max) * 100}%"></i></span></li>`).join('')}</ol>
          <p class="note">Yüzde, şikâyet oranıdır: 1-2 yıldızlı yorumların kaçında bu sorunun geçtiğini gösterir. Bir yorum birden fazla soruna girebilir. <a href="#/yontem">Bu rakamlar nasıl hesaplandı?</a></p>
        </div>
        <div class="sum-side">
          <div class="fact"><span class="fact-h">Tüm yazılı yorumlar ${tip('yildiz')}</span><b class="neg">${pct(c.top.dusuk, 1)}</b>
            <span>1-2 yıldız payı: ${int(c.top.yazili)} yorumdan ${int(c.top.dusukN)} tanesi 1 ya da 2 yıldız.</span></div>
          <div class="fact"><span class="fact-h">Müşterinin ilk gördüğü yorumlar ${tip('onerilen')}</span><b>${int(on)} / ${int(c.top.onerilenN)}</b>
            <span>${tamYuz ? `Trendyol'un "Önerilen" sıralamasında her ürünün ilk 100 yorumu.` : `Trendyol'un "Önerilen" sıralamasında okunan yorumlar (yorumu az olan üründe 100'den az).`} ${on ? `${int(on)} tanesi 1-2 yıldızlı.` : 'Hiçbiri 1-2 yıldızlı değil.'}</span></div>
          ${segIki ? `<div class="fact"><span class="fact-h">1-2 yıldız payı, satıcı tipine göre ${tip('segment')}</span>
            <dl class="fact-seg"><div><dt>Büyük marka</dt><dd class="neg num">${pct(sl.buyuk, 1)}</dd></div><div><dt>KOBİ</dt><dd class="neg num">${pct(sl.kobi, 1)}</dd></div></dl></div>` : ''}
        </div>
      </section>
      <section class="card recs-card jump" id="sec-oneri" tabindex="-1" aria-labelledby="oneri-t"><h2 id="oneri-t">Ne yapmalı? Bu kategoriye girecek KOBİ için öneriler</h2><ol class="recs" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">${c.oneriler.map((o) => `<li><b>${esc(o.baslik)}</b><span>${esc(o.metin)}</span></li>`).join('')}</ol></section>
      <section class="jump" id="sec-icgoru" tabindex="-1" aria-labelledby="icgoru-t">
      <h2 class="sec-h" id="icgoru-t">Kategori içgörüleri</h2>
      <div class="cgrid">
        <section class="card prt-hide"${segIki ? '' : ' style="grid-column:1/-1"'}><h3>Müşteriler neyi seviyor?</h3><p class="muted">Olumlu yorumlarda en sık geçen konular.</p>${hbar(c.olk.slice(0, 6).map((k) => ({ ad: k.ad, v: k.tum })))}</section>
        ${segIki ? `<section class="card"><h3>Büyük marka mı, KOBİ mi? ${tip('segment')}</h3><p class="muted">Aynı sorunun iki gruptaki şikâyet oranı.</p><div class="legend"><span><i style="background:var(--muted)"></i>Büyük marka</span><span><i style="background:var(--neg-bar)"></i>KOBİ</span></div>
          <div class="hbars">${seg.map((t) => { const m = Math.max(...seg.map((x) => Math.max(x.buyuk, x.kobi))); return `<div class="hb"><span>${esc(t.ad)}</span><span style="display:grid;gap:3px"><span class="tr"><i style="width:${(t.buyuk / m) * 100}%;background:var(--muted)"></i></span><span class="tr"><i style="width:${(t.kobi / m) * 100}%;background:var(--neg-bar)"></i></span></span><span class="v">${pct(t.buyuk)}<br>${pct(t.kobi)}</span></div>`; }).join('')}</div></section>` : ''}
      </div></section>
      <section class="jump" id="sec-urun" tabindex="-1" aria-labelledby="urun-t">
      <div class="tools"><h2 id="urun-t">Ürünler <span class="muted num" style="font-weight:400" id="pcount"></span></h2>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn ghost f-open" id="f-open" aria-controls="filters" aria-expanded="false">Filtrele</button>
          <label class="muted">Sırala <select id="sort">
          <option value="yorum">En çok yorum</option><option value="puan">En yüksek puan</option><option value="dusuk">En az 1-2 yıldız</option><option value="cok">En çok 1-2 yıldız</option></select></label>
        </div></div>
      <div class="plist">
        <aside class="filters" id="filters" aria-label="Filtreler">${filterPanel(c)}</aside>
        <div class="f-backdrop" id="f-backdrop" hidden></div>
        <div><div class="chips" id="chips"></div><div class="pgrid" id="pgrid"></div></div>
      </div></section>
      ${printProducts(c)}
      ${checklist(c)}
      ${printFoot(c)}`;
    secSpy();
    ckSync(c);
    const sel = document.getElementById('sort'); sel.value = sort;
    const st = (filterState[id] ??= { segment: [], marka: [], sikayet: [], puan: '', dusuk: '' });
    const aside = document.getElementById('filters');
    aside.inert = drawerMQ.matches;
    aside.querySelectorAll('input').forEach((i) => {
      const v = st[i.name];
      i.checked = Array.isArray(v) ? v.includes(i.value) : v === i.value;
    });
    const draw = () => {
      const f = PSORT[sel.value];
      const list = c.urunler.filter((p) => passes(p, st)).sort(f);
      const cm = getCmp();
      document.getElementById('pgrid').innerHTML = list.length ? list.map((p) => card(c, p, cm)).join('')
        : '<div class="empty" style="grid-column:1/-1"><p>Bu filtrelere uyan ürün yok.</p><button type="button" class="btn ghost" data-clear>Filtreleri temizle</button></div>';
      document.getElementById('pcount').textContent = `(${list.length} / ${c.urunler.length})`;
      const chips = [];
      for (const k of ['segment', 'marka', 'sikayet']) st[k].forEach((v) => chips.push([k, v, k === 'sikayet' ? c.temaMap[v].ad : v]));
      if (st.puan) chips.push(['puan', st.puan, PUAN[st.puan]]);
      if (st.dusuk) chips.push(['dusuk', st.dusuk, '1-2 yıldız payı: ' + DUSUK[st.dusuk][0]]);
      document.getElementById('chips').innerHTML = chips.map(([k, v, t]) => `<button type="button" class="chip" data-k="${k}" data-v="${esc(v)}" aria-label="${esc(t)} filtresini kaldır">${esc(t)} ×</button>`).join('')
        + (chips.length ? '<button type="button" class="linkbtn" data-clear>Tümünü temizle</button>' : '');
    };
    const clear = () => { Object.assign(st, { segment: [], marka: [], sikayet: [], puan: '', dusuk: '' }); aside.querySelectorAll('input').forEach((i) => { i.checked = false; }); draw(); };
    aside.addEventListener('change', (e) => {
      const i = e.target;
      if (i.type === 'checkbox') st[i.name] = [...aside.querySelectorAll(`input[name="${CSS.escape(i.name)}"]:checked`)].map((x) => x.value);
      else st[i.name] = i.value;
      draw();
    });
    app.onclick = (e) => {
      const j = e.target.closest('[data-jump]');
      if (j) { jumpTo(j.dataset.jump); return; }
      if (e.target.closest('[data-clear]')) { clear(); return; }
      const ch = e.target.closest('.chip');
      if (ch) {
        const { k, v } = ch.dataset;
        if (Array.isArray(st[k])) st[k] = st[k].filter((x) => x !== v); else st[k] = '';
        const inp = aside.querySelector(`input[name="${CSS.escape(k)}"][value="${CSS.escape(v)}"]`); if (inp) inp.checked = false;
        draw();
      }
      if (e.target.closest('#print-btn')) { window.print(); return; }
      if (e.target.closest('#ck-reset')) {
        ckSet(id, new Set());
        app.querySelectorAll('[data-ck]').forEach((i) => { i.checked = false; });
        ckSync(c);
        app.querySelector('[data-ck]')?.focus();
        return;
      }
      if (e.target.closest('#f-open')) openDrawer();
      if (e.target.closest('#f-close') || e.target.closest('#f-backdrop')) closeDrawer();
    };
    sel.addEventListener('change', () => { sessionSort[id] = sel.value; draw(); });
    app.onchange = (e) => {
      const i = e.target.closest('[data-ck]');
      if (!i) return;
      const s = ckGet(id);
      if (i.checked) s.add(i.dataset.ck); else s.delete(i.dataset.ck);
      ckSet(id, s);
      ckSync(c);
    };
    draw();
  }
  // Yazdırma raporu: ekranda gizli (display:none, ekran okuyucu da okumaz), yalnızca baskıda görünür
  const SITE_URL = document.querySelector('meta[property="og:url"]')?.content || '';
  const printProducts = (c) => `
      <section class="print-only prt-products"><h2>Ürünler</h2>
        <table class="ptable"><thead><tr><th>Ürün</th><th>Segment</th><th class="num">Ort. puan</th><th class="num">1-2 yıldız payı</th><th>En sık şikâyet</th></tr></thead><tbody>
        ${[...c.urunler].sort((a, b) => b.yazili - a.yazili).map((p) => `<tr><td><b>${esc(markaAd(p.marka))}</b> ${esc(p.ad.replace(p.marka, '').trim())}</td><td>${esc(p.segment)}</td><td class="num">${dec(p.ort)}</td><td class="num ${negCls(p.dusuk)}">${pct(p.dusuk, 1)}</td>`
          + `<td>${noLow(p) ? `<span class="muted">${esc(noLowShort(p))}</span>` : p.sik[0] ? `${esc(p.sik[0].ad)} <span class="neg num">${pct(p.sik[0].v)}</span>` : ''}</td></tr>`).join('')}
        </tbody></table></section>`;
  const printFoot = (c) => `
      <p class="print-only prt-foot">${SITE} · ${esc(SITE_URL)}#/kategori/${esc(c.id)} · Şikâyet oranı, okunan 1-2 yıldızlı yorumların yüzde kaçında o konunun geçtiğini gösterir; konular anahtar kelimeyle bulunduğu için oranlar yaklaşıktır.</p>`;
  const filterState = {};
  const PSORT = { yorum: (a, b) => b.yazili - a.yazili, puan: (a, b) => b.ort - a.ort, dusuk: (a, b) => a.dusuk - b.dusuk, cok: (a, b) => b.dusuk - a.dusuk };
  // 1-2 yıldız payı, satıcı tipine göre (segmentte ürün yoksa null). Kategori özeti ve #/firsat ortak.
  const segLow = (c) => {
    const P = c.urunler, low = (R) => { const y = R.reduce((a, p) => a + p.yazili, 0); return R.length && y ? R.reduce((a, p) => a + p.yildiz[0] + p.yildiz[1], 0) / y : null; };
    return { kobi: low(P.filter(isKobi)), buyuk: low(P.filter((p) => !isKobi(p))) };
  };

  // ---- kategori sayfası bölüm menüsü: düğmeyle bölüme kaydır, kaydırırken bulunulan bölümü işaretle ----
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function jumpTo(id) {
    const t = document.getElementById(id);
    if (!t) return;
    t.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    t.focus({ preventScroll: true });
  }
  let spyFn = null;
  function secSpy() {
    if (spyFn) removeEventListener('scroll', spyFn);
    const nav = document.getElementById('secnav');
    if (!nav) { spyFn = null; return; }
    const items = [...nav.querySelectorAll('[data-jump]')].map((b) => [b, document.getElementById(b.dataset.jump)]);
    let raf = 0;
    const upd = () => {
      raf = 0;
      if (!nav.isConnected) { removeEventListener('scroll', spyFn); spyFn = null; return; }
      const off = nav.getBoundingClientRect().bottom + 24, end = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      let cur = items[0];
      for (const it of items) if (it[1].getBoundingClientRect().top <= off) cur = it;
      if (end) cur = items[items.length - 1];
      items.forEach((it) => { if (it === cur) it[0].setAttribute('aria-current', 'location'); else it[0].removeAttribute('aria-current'); });
    };
    spyFn = () => { if (!raf) raf = requestAnimationFrame(upd); };
    addEventListener('scroll', spyFn, { passive: true });
    upd();
  }
  const PUAN_L = [['4.5', '4,5 ve üzeri'], ['4.0', '4 ve üzeri'], ['3.5', '3,5 ve üzeri']];
  const PUAN = Object.fromEntries(PUAN_L);
  const DUSUK = { a: ['%10 altı', 0, 0.1], b: ['%10 - %20', 0.1, 0.2], c: ['%20 üzeri', 0.2, 1.01] };
  const passes = (p, st) =>
    (!st.segment.length || st.segment.includes(p.segment)) &&
    (!st.marka.length || st.marka.includes(p.marka)) &&
    (!st.sikayet.length || st.sikayet.includes(p.sik[0]?.id)) &&
    (!st.puan || p.ort >= Number(st.puan)) &&
    (!st.dusuk || (p.dusuk >= DUSUK[st.dusuk][1] && p.dusuk < DUSUK[st.dusuk][2]));
  function filterPanel(c) {
    const P = c.urunler;
    const count = (fn) => P.filter(fn).length;
    const group = (title, name, items, type = 'checkbox') => `<div class="fg"><h3>${title}</h3>${items.map(([v, label, n]) =>
      `<label><input type="${type}" name="${name}" value="${esc(v)}">${esc(label)}<small>${n}</small></label>`).join('')}</div>`;
    const segs = [...new Set(P.map((p) => p.segment))];
    const markalar = [...new Set(P.map((p) => p.marka))].sort((a, b) => a.localeCompare(b, 'tr'));
    const tops = [...new Set(P.map((p) => p.sik[0]?.id).filter(Boolean))];
    return `<div class="f-head"><h2 style="font-size:1.1rem">Filtreler</h2><button type="button" class="linkbtn f-close" id="f-close">Kapat</button></div>`
      + (segs.length > 1 ? group('Satıcı tipi' + tip('segment', true), 'segment', segs.map((s) => [s, s, count((p) => p.segment === s)])) : '')
      // Markaların çoğundan tek ürün varken marka filtresi ürün listesini tekrarlar; marka sayısı ürünlerin 3/4'ünü geçmiyorsa göster
      + (markalar.length <= P.length * 0.75 ? group('Marka', 'marka', markalar.map((m) => [m, markaAd(m), count((p) => p.marka === m)])) : '')
      + group('En sık şikâyet', 'sikayet', tops.map((t) => [t, c.temaMap[t].ad, count((p) => p.sik[0]?.id === t)]))
      + group('Ortalama puan', 'puan', PUAN_L.map(([v, l]) => [v, l, count((p) => p.ort >= Number(v))]), 'radio')
      + group('1-2 yıldız payı' + tip('yildiz', true), 'dusuk', Object.entries(DUSUK).map(([v, [l, lo, hi]]) => [v, l, count((p) => p.dusuk >= lo && p.dusuk < hi)]), 'radio')
      + '<div class="fg"><button type="button" class="btn ghost" data-clear>Filtreleri temizle</button></div>';
  }
  const sessionSort = {};
  const segBadge = (p) => `<span class="seg ${isKobi(p) ? 'kobi' : 'buyuk'}">${esc(p.segment)}</span>`;
  const card = (c, p, cm) => `
    <article class="pc">
      <a class="pc-img" href="#/urun/${esc(c.id)}/${esc(p.id)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.gorsel)}" alt="" width="400" height="600" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>
      <div class="pc-body">
        ${segBadge(p)}
        <a class="pc-name" href="#/urun/${esc(c.id)}/${esc(p.id)}"><b>${esc(markaAd(p.marka))}</b> ${esc(p.ad.replace(p.marka, '').trim())}</a>
        <div class="stars"><span class="s" aria-hidden="true">★</span><b class="num">${dec(p.ort)}</b><span class="muted num">(${int(p.yazili)} yorum)</span></div>
        <dl class="pc-meta">
          <div><dt>1-2 yıldız payı</dt><dd class="${negCls(p.dusuk)} num">${pct(p.dusuk, 1)}</dd></div>
          <div class="stack"><dt>En sık şikâyet</dt><dd${noLow(p) ? ' class="none"' : ''}>${esc(noLow(p) ? noLowShort(p) : p.sik[0]?.ad || '')}</dd></div>
        </dl>
        <label class="pc-cmp"><input type="checkbox" data-cmp="${esc(p.id)}" data-cat="${esc(c.id)}" ${inCmp(cm, c.id, p.id) ? 'checked' : ''}>Karşılaştır</label>
      </div>
    </article>`;

  // ---- rakibin açık verdiği ve az şikâyet aldığı konular: ürünün şikâyet oranı kategori ortalamasıyla (ürün dahil, hbar'daki ince çizgi) ----
  // Fazla: en az 10 puan yukarıda, ortalamanın en az 1,5 katı, en az 5 yorumda geçiyor ve z ≥ 2. Az: en az 10 puan aşağıda, ortalamanın en fazla yarısı ve z ≤ −2.
  // z = (ürün − ortalama) / √(ortalama × (1 − ortalama) / n), n = ürünün okunan 1-2 yıldızlı yorum sayısı. n < 30 ise konu konu fark gösterilmez.
  const GAP = { minN: 30, pts: 0.10, ratio: 1.5, minK: 5, z: 2, max: 3 };
  function gaps(c, p) {
    const n = p.ornek_dusuk, worse = [], better = [];
    if (n < GAP.minN) return null;
    c.tema.forEach((t) => {
      const v = p.sikayet[t.id] || 0, a = t.tum, d = v - a, z = d / Math.sqrt(Math.max(a * (1 - a), 1e-4) / n);
      if (d >= GAP.pts - 1e-9 && v >= GAP.ratio * a && Math.round(v * n) >= GAP.minK && z >= GAP.z) worse.push({ t, v, a });
      else if (-d >= GAP.pts - 1e-9 && v <= a / 2 && z <= -GAP.z) better.push({ t, v, a });
    });
    const by = (x, y) => Math.abs(y.v - y.a) - Math.abs(x.v - x.a);
    return { worse: worse.sort(by).slice(0, GAP.max), better: better.sort(by).slice(0, GAP.max) };
  }
  // Fark rakamı ekrandaki yuvarlanmış yüzdelerden: "%31, kategoride %17, +14 puan" kendi içinde tutarlı
  const dPts = (v, a) => { const d = Math.round(v * 100) - Math.round(a * 100); return (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + ' puan'; };
  function gapCard(c, p) {
    const g = gaps(c, p), n = p.ornek_dusuk;
    const row = (x, bad) => `<li><span class="gp-t">${esc(x.t.ad)}</span><span class="gp-v num"><b${bad ? ' class="neg"' : ''}>${pct(x.v)}</b> <span class="muted">kategoride ${pct(x.a)}</span></span><span class="gp-d num">${dPts(x.v, x.a)}</span></li>`;
    const col = (title, hint, list, bad) => `<div class="gp-col"><h3>${title}</h3><p class="muted">${hint}</p>${list.length ? `<ul class="gp-list">${list.map((x) => row(x, bad)).join('')}</ul>` : '<p class="gp-none">Belirgin fark yok.</p>'}</div>`;
    const body = !g
      ? `<p class="gp-none">Bu üründe yalnızca ${n} adet <span class="nowrap">1-2 yıldızlı</span> yorum okundu. Konu konu karşılaştırma için en az ${GAP.minN} gerekiyor; bu yüzden fark gösterilmedi.</p>`
      : !g.worse.length && !g.better.length
        ? `<p class="gp-none">Hiçbir konuda kategori ortalamasından belirgin bir fark yok.</p>`
        : `<div class="gp-cols">${col('Açık verdiği konular', 'Yorum yazanlar bu konularda kategoriden belirgin fazla şikâyet ediyor. Rakip olarak burada öne çıkabilirsin.', g.worse, true)}${col('Az şikâyet aldığı konular', 'Bu konularda kategoriden belirgin az şikâyet var. Burada bu ürünü geçmek zor.', g.better, false)}</div>`;
    if (!g) return `<section class="card gp-card" aria-labelledby="gp-t"><h2 id="gp-t">Bu rakip nerede açık veriyor?</h2>${body}
        <p class="note"><a href="#/yontem/rakip">Bu karşılaştırma nasıl yapılıyor?</a></p></section>`;
    return `<section class="card gp-card" aria-labelledby="gp-t"><h2 id="gp-t">Bu rakip nerede açık veriyor? ${tip('sikayet')}</h2>
        <p class="muted">Bu ürünün şikâyet oranları kategori ortalamasıyla karşılaştırıldı. Okunan ${n} adet <span class="nowrap">1-2 yıldızlı</span> yoruma dayanır; ürünün kalitesini değil, yorum yazanların ne yazdığını gösterir.</p>
        ${body}
        <p class="note">Küçük farklar sayılmaz: en az ${Math.round(GAP.pts * 100)} puan ve ortalamanın belirgin üstü ya da altı gerekir. <a href="#/yontem/rakip">Bu karşılaştırma nasıl yapıldı?</a></p></section>`;
  }

  async function product(cid, pid, isStale) {
    const r = regOf(cid);
    if (!r || r.durum !== 'hazir') { notFound('Bu ürün ya da kategori bu sitede yok.'); return; }
    const c = await loadCat(cid);
    if (isStale()) return;
    const p = c.urunler.find((u) => u.id === pid);
    if (!p) { notFound('Bu ürün bu kategoride yok.', `<a class="btn" href="#/kategori/${esc(c.id)}">${esc(c.ad)} sayfasına dön</a>`); return; }
    rememberCat(cid);
    setTitle(p.kisa, `${p.ad} (${c.ad}): 1-2 yıldız payı ${pct(p.dusuk, 1)}${noLow(p) || !p.sik[0] ? '' : `, en sık şikâyet "${p.sik[0].ad}"`}. Rakibin açık verdiği konular ve müşteri yorumları.`);
    const on = inCmp(getCmp(), c.id, p.id);
    const yt = p.yazili, n = onerN(p), empty = noLow(p);
    // Önceki / sonraki ürün: kategori sayfasındaki sıralama ve (bu ürün içindeyse) filtreler
    let list = [...c.urunler];
    const fst = filterState[c.id], fl = fst ? list.filter((x) => passes(x, fst)) : list;
    const filt = fl.length > 1 && fl.length < list.length && fl.includes(p);
    if (filt) list = fl;
    list.sort(PSORT[sessionSort[c.id] || 'yorum']);
    const i = list.indexOf(p), L = list.length, prev = list[(i - 1 + L) % L], next = list[(i + 1) % L];
    const pnav = (where) => `<nav class="pnav pnav-${where}" aria-label="${where === 'top' ? 'Aynı kategorideki ürünler' : 'Aynı kategorideki ürünler (sayfa sonu)'}">
        <a class="pnav-back" href="#/kategori/${esc(c.id)}"><span aria-hidden="true">←</span> ${esc(c.ad)}: tüm ürünler</a>
        ${L > 1 ? `<span class="pnav-step"><a href="#/urun/${esc(c.id)}/${esc(prev.id)}" aria-label="Önceki ürün: ${esc(prev.kisa)}"><span aria-hidden="true">‹</span> Önceki</a>
        <span class="muted num">${i + 1} / ${L}${filt ? ' (filtreli)' : ''}</span>
        <a href="#/urun/${esc(c.id)}/${esc(next.id)}" aria-label="Sonraki ürün: ${esc(next.kisa)}">Sonraki <span aria-hidden="true">›</span></a></span>` : ''}</nav>`;
    app.innerHTML = `
      <div class="band phead">
      <div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a> / ${esc(p.kisa)}</div>
      ${pnav('top')}
      <div class="prod">
        <div class="prod-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" width="400" height="600" decoding="async" fetchpriority="high" referrerpolicy="no-referrer"></div>
        <div class="prod-info">
          <div class="prod-head">
          <span class="prod-seg">${segBadge(p)}${tip('segment')}</span>
          <h1>${esc(p.ad)}</h1>
          <div class="stars"><span class="s" aria-hidden="true">★</span><b class="num">${dec(p.ort)}</b><span class="muted num">${int(yt)} yazılı yorum</span></div>
          </div>
          <div class="stats">
            <div class="stat"><small>Ortalama puan</small><b>${dec(p.ort)}</b></div>
            <div class="stat"><small>"Önerilen" ilk ${n} ${tip('onerilen')}</small><b>${dec(p.onerilen_ort)}</b></div>
            <div class="stat"><small>1-2 yıldız payı ${tip('yildiz')}</small><b class="${p.dusuk > 0 ? 'alert' : ''}">${pct(p.dusuk, 1)}</b></div>
            ${empty ? '' : `<div class="stat"><small>En sık şikâyet</small><b class="stat-t">${esc(p.sik[0]?.ad || '')}</b></div>`}
          </div>
          <div class="pact">
            <a class="btn out" href="${esc(p.link)}" target="_blank" rel="noopener">Trendyol'da gör</a>
            <label class="btn ghost"><input type="checkbox" data-cmp="${esc(p.id)}" data-cat="${esc(c.id)}" ${on ? 'checked' : ''}>Karşılaştırmaya ekle</label>
          </div>
        </div>
      </div>
      </div>
      <div class="cgrid">
        ${empty ? `<p class="nodata">${esc(noLowText(p))}</p>` : gapCard(c, p)}
        ${empty ? '' : `<section class="card"><h2>En çok neden şikâyet ediyorlar? ${tip('sikayet')}</h2><p class="muted">Şikâyet oranı: 1-2 yıldızlı yorumların yüzde kaçında geçtiği. İnce çizgi kategori ortalaması.</p>${hbar(p.sik.slice(0, 7).map((t) => ({ ad: t.ad, v: t.v, avg: t.tum })), 'neg', 'avg')}</section>`}
        <section class="card"><h2>Neyi seviyorlar?</h2><p class="muted">"Önerilen" sıralamanın ilk ${n} yorumunda geçme oranı.</p>${hbar(p.sev.slice(0, 7).map((k) => ({ ad: k.ad, v: k.v })))}</section>
        <section class="card"><h2>Bu ürünün zayıf noktaları</h2><ul class="ul">${p.dikkat.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Rakip bir KOBİ için ders</h2><ul class="ul">${p.ders.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Yıldız dağılımı</h2>${hbar([5, 4, 3, 2, 1].map((s) => ({ ad: s + ' yıldız', v: p.yildiz[s - 1] / yt })))}</section>
        ${p.alinti.length ? `<section class="card"><h2>Müşterinin kendi sözleriyle</h2><div class="quotes">${p.alinti.map((a) => `<div class="q"><span>"${esc(a.metin)}"</span><small>${a.yildiz} yıldız · ${esc(c.temaMap[a.konu]?.ad || a.konu)}</small></div>`).join('')}</div></section>` : ''}
      </div>
      ${pnav('bottom')}`;
  }

  async function compare(isStale) {
    let v = getCmp();
    if (v.length && !(regOf(v[0].cat)?.durum === 'hazir')) { v = []; }
    const c = v.length ? await loadCat(v[0].cat) : null;
    if (isStale()) return;
    setTitle('Karşılaştır', 'Aynı kategoriden 2-4 ürünü yan yana karşılaştır: puan, 1-2 yıldız payı, en büyük şikâyetler ve sevilen konular.');
    const P = c ? v.map((x) => c.urunler.find((u) => u.id === x.id)).filter(Boolean) : [];
    if (P.length < 2) {
      const lc = regOf(lastCat);
      const back = lc && lc.durum === 'hazir' ? `<a class="btn" href="#/kategori/${esc(lc.id)}">${esc(lc.ad)} sayfasına dön</a>` : '<a class="btn" href="#/">Kategorilere git</a>';
      app.innerHTML = `<div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Karşılaştır</div><div class="chead"><h1>Karşılaştır</h1></div></div><div class="empty"><p class="muted">${P.length === 1 ? 'Şu an 1 ürün seçili. ' : ''}Karşılaştırmak için bir kategori sayfasındaki ürün kartlarından 2 ile 4 arasında ürün seç.</p>${back}</div>`;
      return;
    }
    rememberCat(c.id);
    const bestIdx = (vals, hi) => { const t = hi ? Math.max(...vals) : Math.min(...vals); return vals.map((x) => x === t && new Set(vals).size > 1); };
    const ortB = bestIdx(P.map((p) => p.ort), true), dusB = bestIdx(P.map((p) => p.dusuk), false), gapB = bestIdx(P.map((p) => Math.abs(Math.round((p.onerilen_ort - p.ort) * 100))), false);
    const row = (h, cells, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${h}</th>${cells.join('')}</tr>`;
    app.innerHTML = `
      <div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a> / Karşılaştır</div>
      <div class="chead"><h1>${P.length} ürünü karşılaştır</h1><p class="muted">Kalın yazılan değer gruptaki en iyi sonuç. En fazla ${MAXC} ürün, aynı kategoriden.</p>${gloss(['yildiz', 'onerilen', 'segment'])}</div></div>
      <p class="scroll-hint muted" id="scroll-hint" hidden>Tabloyu yana kaydır <span aria-hidden="true">→</span></p>
      <div class="ctable-wrap" id="ctable-wrap"><div class="ctable-box" id="ctable-box" tabindex="0" role="region" aria-label="Karşılaştırma tablosu"><table class="ctable">
        <tbody>
        ${row('<span class="sr-only">Ürün görseli</span>', P.map((p) => `<td><div class="ct-top"><a href="#/urun/${esc(c.id)}/${esc(p.id)}" class="ct-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" width="400" height="600" decoding="async" referrerpolicy="no-referrer"></a><button type="button" class="ct-rm" data-rm-col="${esc(p.id)}" aria-label="${esc(p.kisa)}: karşılaştırmadan çıkar">Çıkar <span aria-hidden="true">×</span></button></div></td>`))}
        ${row('Ürün', P.map((p) => `<td><b>${esc(markaAd(p.marka))}</b><br>${esc(p.ad.replace(p.marka, '').trim())}</td>`))}
        ${row('Segment', P.map((p) => `<td>${esc(p.segment)}</td>`))}
        ${row('Ortalama puan', P.map((p, i) => `<td class="num${ortB[i] ? ' best' : ''}">${dec(p.ort)}</td>`))}
        ${row('1-2 yıldız payı', P.map((p, i) => `<td class="num ${negCls(p.dusuk)}${dusB[i] ? ' best' : ''}">${pct(p.dusuk, 1)}</td>`))}
        ${row('"Önerilen" ile gerçek arası fark', P.map((p, i) => `<td class="num${gapB[i] ? ' best' : ''}">${sgn(p.onerilen_ort - p.ort)} puan</td>`))}
        ${row('Yazılı yorum', P.map((p) => `<td class="num">${int(p.yazili)}</td>`))}
        ${row('En büyük 3 şikâyet', P.map((p) => noLow(p) ? `<td class="muted">${esc(noLowShort(p))}</td>` : `<td><ol>${p.sik.slice(0, 3).map((t) => `<li>${esc(t.ad)} <span class="neg num">${pct(t.v)}</span></li>`).join('')}</ol></td>`))}
        ${row('En çok sevilen 3 konu', P.map((p) => `<td><ol>${p.sev.slice(0, 3).map((k) => `<li>${esc(k.ad)} <span class="muted num">${pct(k.v)}</span></li>`).join('')}</ol></td>`))}
        </tbody></table></div></div>`;
    app.onclick = (e) => {
      const b = e.target.closest('[data-rm-col]');
      if (!b) return;
      toggleCmp(c.id, b.dataset.rmCol, false);
      route({ keep: true });
    };
    scrollTable();
  }

  // Yana kayan tablo: ipucu ve sağ kenar solması (karşılaştırma ve fırsat tablosu ortak)
  let scrollUpd = null;
  function scrollTable() {
    const box = document.getElementById('ctable-box'), wrap = document.getElementById('ctable-wrap'), hint = document.getElementById('scroll-hint');
    if (!box) return;
    const upd = () => {
      if (!box.isConnected) return;
      const over = box.scrollWidth > box.clientWidth + 1;
      hint.hidden = !over;
      wrap.classList.toggle('more', over && box.scrollLeft + box.clientWidth < box.scrollWidth - 2);
    };
    box.addEventListener('scroll', upd, { passive: true });
    if (scrollUpd) window.removeEventListener('resize', scrollUpd);
    scrollUpd = upd;
    window.addEventListener('resize', upd, { passive: true });
    upd();
  }

  // ---- kategoriler arası karşılaştırma (#/firsat) ----
  const pts = (v) => (v * 100).toFixed(1).replace('.', ',') + ' puan';
  const andJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ve ' + a[a.length - 1]);
  const catStats = (id, c) => {
    const P = c.urunler, big = P.filter((p) => !isKobi(p)), sl = segLow(c);
    return { id, ad: c.ad, ust: c.ust, yazili: c.top.yazili, dusuk: c.top.dusuk, buyukPay: big.length ? big.reduce((a, p) => a + p.yazili, 0) / c.top.yazili : null,
      kobi: sl.kobi, buyuk: sl.buyuk, sik: c.tema[0] || null, urun: P.length, okunan: c.top.okunan };
  };
  const catRows = (data) => ready().filter((r) => data[r.id]).map((r) => catStats(r.id, data[r.id]));
  // Üç okuma satırı: ana sayfa şeridi ve fırsat sayfası ortak kullanır
  function readings(rows) {
    const out = [], B = (r) => `<b>${esc(r.ad)}</b>`;
    if (rows.length >= 2) {
      const s = [...rows].sort((a, b) => b.dusuk - a.dusuk), hi = s[0], lo = s[s.length - 1];
      out.push({ k: 'Risk', t: `En riskli kategori ${B(hi)}: yazılı yorumlarda 1-2 yıldız payı <b class="num">${pct(hi.dusuk, 1)}</b>. En sakin kategori ${B(lo)}: payı <b class="num">${pct(lo.dusuk, 1)}</b>.` });
    }
    const under = rows.filter((r) => r.buyukPay != null && r.buyukPay < 0.1).sort((a, b) => a.buyukPay - b.buyukPay), none = rows.filter((r) => r.buyukPay == null);
    if (under.length || none.length) {
      out.push({ k: "Pazar KOBİ'lerin", t: [under.length ? `Büyük markaların yorum payı %10'un altında: ${andJoin(under.map((r) => `${B(r)} (payı <span class="num">${pct(r.buyukPay, 1)}</span>)`))}.` : '',
        none.length ? `${andJoin(none.map(B))} ${none.length > 1 ? 'örneklemlerinde' : 'örnekleminde'} büyük marka yok.` : ''].filter(Boolean).join(' ') });
    } else if (rows.length) out.push({ k: 'Büyük markalar', t: "Her kategoride büyük markalar yorumların en az %10'unu alıyor." });
    const both = rows.filter((r) => r.kobi != null && r.buyuk != null).sort((a, b) => (b.kobi - b.buyuk) - (a.kobi - a.buyuk));
    if (both.length) {
      const g = both[0];
      out.push({ k: 'KOBİ farkı', t: g.kobi > g.buyuk
        ? `KOBİ ile büyük marka arasındaki en büyük fark ${B(g)} kategorisinde: 1-2 yıldız payı KOBİ ürünlerinde <b class="num">${pct(g.kobi, 1)}</b>, büyük markalarda <b class="num">${pct(g.buyuk, 1)}</b> (fark <span class="num">${pts(g.kobi - g.buyuk)}</span>).`
        : 'Hiçbir kategoride KOBİ ürünlerinin 1-2 yıldız payı büyük markalarınkinden yüksek değil.' });
    }
    return out;
  }

  // ---- Giriş puanı: beş ölçütün ağırlıklı ortalaması (0-100). Ölçütler ve ağırlıklar sayfada ve Yöntem'de açıkça yazılı. ----
  const COMPS = [
    { k: 'rekabet', ad: 'Büyük marka baskısı az', acik: 'Büyük markaların yorum payı ne kadar düşükse o kadar yüksek: 100 × (1 − büyük marka payı). Büyük marka ürünü yoksa 100.' },
    { k: 'risk', ad: 'Memnuniyetsizlik düşük', acik: '1-2 yıldız payı en düşük kategori 100, en yüksek kategori 0; arası doğrusal.' },
    { k: 'sorun', ad: 'Çözülecek sorun net', acik: '1 numaralı şikâyetin şikâyet oranı en yüksek kategori 100, en düşük 0. Tek baskın şikâyet, çözülecek ve reklamda söylenecek net bir şey demek.' },
    { k: 'kobi', ad: 'KOBİ büyük markaya yakın', acik: "KOBİ ürünlerinin 1-2 yıldız payı eksi büyük markalarınki: fark en küçük (KOBİ en iyi durumda) kategori 100, en büyük 0. Kategoride iki gruptan biri yoksa bu ölçüt atlanır, ağırlığı diğer ölçütlere dağılır." },
    { k: 'talep', ad: 'Yorum hacmi yüksek', acik: 'Örneklemdeki ürün başına yazılı yorum sayısı, logaritmik ölçekte; en yüksek 100, en düşük 0. Talebin kaba bir işaretidir, satış rakamı değildir.' },
  ];
  const PRESETS = [
    { k: 'dengeli', ad: 'Dengeli', w: [1, 1, 1, 1, 1], acik: 'Beş ölçüt eşit ağırlıkta.' },
    { k: 'guvenli', ad: 'Güvenli giriş', w: [1, 3, 1, 2, 1], acik: "Müşterinin az şikâyet ettiği ve KOBİ'lerin büyük markalara yakın durduğu kategorileri öne çıkarır." },
    { k: 'rakipsiz', ad: 'Rakibi az pazar', w: [3, 1, 1, 2, 1], acik: "Konuşmanın büyük markalarda değil KOBİ'lerde olduğu kategorileri öne çıkarır." },
    { k: 'fark', ad: 'Fark yaratmak istiyorum', w: [1, 1, 3, 1, 2], acik: 'Tek bir baskın şikâyeti olan ve yorum hacmi yüksek kategorileri öne çıkarır: o sorunu çözersen öne çıkabileceğin yerler.' },
  ];
  const OZEL = { k: 'ozel', ad: 'Kendin ayarla', acik: 'Her ölçütün ağırlığını 0 ile 5 arasında kendin seç.' };
  const WK = 'rr_firsat_w', FK = 'rr_firsat_f';
  const getW = () => { try { const v = JSON.parse(localStorage.getItem(WK)); if (v && (PRESETS.some((p) => p.k === v.p) || v.p === 'ozel') && Array.isArray(v.w) && v.w.length === 5) return { p: v.p, w: v.w.map((x) => Math.max(0, Math.min(5, Math.round(+x) || 0))), c: !!v.c }; } catch {} return { p: 'dengeli', w: [1, 1, 1, 1, 1], c: false }; };
  const setW = (v) => { try { localStorage.setItem(WK, JSON.stringify(v)); } catch {} };
  const F0 = () => ({ ust: '', buyuk20: false, kobiOk: false, maxD: '' });
  const getF = () => { try { return { ...F0(), ...JSON.parse(sessionStorage.getItem(FK)) }; } catch { return F0(); } };
  const setF = (v) => { try { sessionStorage.setItem(FK, JSON.stringify(v)); } catch {} };
  const weightsOf = (st) => (st.p === 'ozel' ? st.w : PRESETS.find((p) => p.k === st.p).w);

  // Ham değerler ve ölçüt puanları. Min-max ölçekleme HER ZAMAN yüklü tüm kategorilerle yapılır (filtre puanı değiştirmez).
  function scoreBase(rows) {
    const mm = (vals) => { const v = vals.filter((x) => x != null), lo = Math.min(...v), hi = Math.max(...v); return (x) => (x == null ? null : hi === lo ? 50 : ((x - lo) / (hi - lo)) * 100); };
    rows.forEach((r) => {
      r.raw = { rekabet: r.buyukPay, risk: r.dusuk, sorun: r.sik ? r.sik.tum : null, kobi: r.kobi != null && r.buyuk != null ? r.kobi - r.buyuk : null, talep: r.yazili / r.urun };
    });
    const sRisk = mm(rows.map((r) => r.raw.risk)), sSorun = mm(rows.map((r) => r.raw.sorun)), sKobi = mm(rows.map((r) => r.raw.kobi)), sTalep = mm(rows.map((r) => Math.log(r.raw.talep)));
    rows.forEach((r) => {
      r.comp = { rekabet: 100 * (1 - (r.buyukPay ?? 0)), risk: 100 - sRisk(r.raw.risk), sorun: sSorun(r.raw.sorun), kobi: r.raw.kobi == null ? null : 100 - sKobi(r.raw.kobi), talep: sTalep(Math.log(r.raw.talep)) };
      r.eksik = COMPS.filter((c) => r.comp[c.k] == null).length;
    });
  }
  // Ağırlıklı ortalama; eksik ölçütün ağırlığı satırda diğerlerine orantılı dağılır. Ağırlıkların hepsi 0 ise eşit ağırlık.
  function scoreApply(rows, w) {
    const allZero = w.every((x) => !x), W = allZero ? [1, 1, 1, 1, 1] : w;
    rows.forEach((r) => {
      let ws = COMPS.map((c, i) => (r.comp[c.k] == null ? 0 : W[i]));
      if (!ws.some(Boolean)) ws = COMPS.map((c) => (r.comp[c.k] == null ? 0 : 1)); // kalan ölçütlerin hepsi 0 ağırlıklıysa eşit ağırlık
      const t = ws.reduce((a, x) => a + x, 0);
      r.puanTam = COMPS.reduce((a, c, i) => a + (ws[i] ? ws[i] * r.comp[c.k] : 0), 0) / t;
      r.puan = Math.round(r.puanTam);
    });
    [...rows].sort((a, b) => b.puan - a.puan || a.dusuk - b.dusuk).forEach((r, i) => { r.sira = i + 1; });
    return allZero;
  }

  const FCOLS = [
    { k: 'ad', h: 'Kategori', txt: true },
    { k: 'puan', h: 'Giriş puanı' },
    { k: 'dusuk', h: '1-2 yıldız payı' },
    { k: 'buyukPay', h: 'Büyük markaların yorum payı' },
    { k: 'kobi', h: '1-2 yıldız payı: KOBİ' },
    { k: 'buyuk', h: '1-2 yıldız payı: Büyük marka' },
    { k: 'sik', h: '1 numaralı şikâyet', val: (r) => (r.sik ? r.sik.tum : null) },
    { k: 'urun', h: 'Ürün', cls: 'c-urun' },
    { k: 'okunan', h: 'Okunan yorum' },
  ];
  const fSort = { k: 'puan', dir: 'desc' };
  const fMQ = matchMedia('(max-width: 640px)');
  const fOpen = new Set();
  const fNum = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
  async function firsat(isStale) {
    const data = await loadAll();
    if (isStale()) return;
    const rows = catRows(data), failed = ready().length - rows.length;
    if (!rows.length && ready().length) throw new Error('firsat: veri yok');
    setTitle('Hangi kategoriye girmeli?', 'Kategorileri 1-2 yıldız payı, büyük marka payı ve en sık şikâyete göre karşılaştır; giriş puanının ağırlıklarını kendin seç.');
    scoreBase(rows);
    let ws = getW(), fl = getF();
    const alanlar = [...new Set(rows.map((r) => r.ust))].sort((a, b) => a.localeCompare(b, 'tr'));
    if (fl.ust && !alanlar.includes(fl.ust)) fl.ust = '';
    const maxD = Math.max(...rows.map((r) => r.dusuk), 0.01);
    const nU = rows.map((r) => r.urun), uMin = Math.min(...nU), uMax = Math.max(...nU);
    const dash = '<span class="muted" title="Bu segmentte ürün yok">–</span>';
    const cell = {
      puan: (r) => `<b class="ft-score">${r.puan}</b>${r.eksik ? `<small class="ft-eksik" title="KOBİ ile büyük marka karşılaştırılamadı; puan ${5 - r.eksik} ölçütle hesaplandı">${5 - r.eksik} ölçüt</small>` : ''}<span class="mbar" aria-hidden="true"><i style="width:${r.puanTam}%"></i></span>`,
      dusuk: (r) => `<span class="neg">${pct(r.dusuk, 1)}</span><span class="mbar neg" aria-hidden="true"><i style="width:${(r.dusuk / maxD) * 100}%"></i></span>`,
      buyukPay: (r) => (r.buyukPay == null ? '<span class="muted">Büyük marka yok</span>' : `${pct(r.buyukPay, 1)}<span class="mbar" aria-hidden="true"><i style="width:${r.buyukPay * 100}%"></i></span>`),
      kobi: (r) => (r.kobi == null ? dash : `<span class="neg">${pct(r.kobi, 1)}</span>`),
      buyuk: (r) => (r.buyuk == null ? dash : `<span class="neg">${pct(r.buyuk, 1)}</span>`),
      sik: (r) => (r.sik ? `${esc(r.sik.ad)} <span class="neg num">${pct(r.sik.tum)}</span>` : dash),
      urun: (r) => int(r.urun),
      okunan: (r) => int(r.okunan),
    };
    const rawTxt = {
      rekabet: (r) => (r.buyukPay == null ? 'Büyük marka yok' : `Büyük marka yorum payı ${pct(r.buyukPay, 1)}`),
      risk: (r) => `1-2 yıldız payı ${pct(r.dusuk, 1)}`,
      sorun: (r) => (r.sik ? `${esc(r.sik.ad)}: şikâyet oranı ${pct(r.sik.tum)}` : '–'),
      kobi: (r) => (r.raw.kobi == null ? (r.buyuk == null ? 'Büyük marka yok, ölçüt atlandı' : 'KOBİ ürünü yok, ölçüt atlandı') : `KOBİ ${pct(r.kobi, 1)}, büyük marka ${pct(r.buyuk, 1)} (fark ${r.raw.kobi > 0 ? '+' : r.raw.kobi < 0 ? '−' : ''}${pts(Math.abs(r.raw.kobi))})`),
      talep: (r) => `Ürün başına ${int(Math.round(r.raw.talep))} yazılı yorum`,
    };
    const reads = readings(rows);
    const NC = FCOLS.length;
    app.innerHTML = `
      <div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Kategorileri karşılaştır</div>
        <div class="chead"><h1>Hangi kategoriye girmeli?</h1>
          <p class="muted">Kategoriler giriş puanına göre sıralı. Giriş puanı beş ölçütü tek sayıda toplar; ağırlıkları sen seçersin. "Puan ayrıntısı" puanın nereden geldiğini gösterir.</p>${gloss(['yildiz', 'sikayet', 'segment'])}</div></div>
      ${reads.length ? `<ul class="reads-list fp-reads">${reads.map((x) => `<li><span class="label">${esc(x.k)}</span><span>${x.t}</span></li>`).join('')}</ul>` : ''}
      <section class="fs-ctrl" aria-labelledby="fs-t">
        <div class="fs-row"><h2 class="label" id="fs-t">Giriş puanı ağırlığı</h2>
          <fieldset class="segctl"><legend class="sr-only">Ağırlık seçimi</legend>${[...PRESETS, OZEL].map((p) => `<label><input type="radio" name="fs-preset" value="${p.k}"><span>${esc(p.ad)}</span></label>`).join('')}</fieldset></div>
        <p class="fs-desc" id="fs-desc" aria-live="polite"></p>
        <div class="fs-sliders" id="fs-sliders" hidden>${COMPS.map((c, i) => `<label class="fs-sl"><span>${esc(c.ad)}</span><input type="range" min="0" max="5" step="1" data-wi="${i}" aria-valuetext=""><output class="num" data-wo="${i}"></output></label>`).join('')}
          <p class="fs-zero muted" id="fs-zero" hidden>Tüm ağırlıklar 0; puan eşit ağırlıklarla hesaplandı.</p></div>
        <p class="note fs-note">Giriş puanı bir okuma kolaylığıdır: bu sitedeki kategorileri, örneklemdeki ürünlere bakarak birbirine göre sıralar. Pazar tahmini değildir; ağırlığı değiştirirsen sıra da değişir. <a href="#/yontem">Giriş puanı nasıl hesaplanıyor?</a></p>
      </section>
      <div class="ff" role="group" aria-label="Kategori filtreleri">
        <div class="ff-alan"><span class="muted">Alan:</span>${['', ...alanlar].map((a) => `<button type="button" class="chip" data-fust="${esc(a)}">${a ? esc(a) : 'Tümü'}</button>`).join('')}</div>
        <label class="ff-c"><input type="checkbox" id="ff-b20">Büyük marka payı %20'nin altında</label>
        <label class="ff-c"><input type="checkbox" id="ff-kobi">KOBİ, büyük markadan geride değil</label>
        <label class="ff-c">1-2 yıldız payı en fazla <select id="ff-d"><option value="">Tümü</option><option value="0.1">%10</option><option value="0.15">%15</option><option value="0.2">%20</option></select></label>
        <span class="ff-n muted num" id="ff-n" aria-live="polite"></span><button type="button" class="linkbtn" id="ff-clear">Filtreleri temizle</button>
      </div>
      <p class="print-only prt-w" id="prt-w"></p>
      <div class="fsort-m" id="fsort-m" hidden><label>Sırala <select id="fm-sort">${FCOLS.map((c) => `<option value="${c.k}">${esc(c.k === 'ad' ? 'Kategori adı' : c.h)}</option>`).join('')}</select></label>
        <button type="button" class="btn ghost" id="fm-dir"></button></div>
      <ol class="fcards" id="fcards" hidden aria-label="Kategoriler"></ol>
      <p class="scroll-hint muted" id="scroll-hint" hidden>Tabloyu yana kaydır <span aria-hidden="true">→</span></p>
      <div class="ctable-wrap fp-wrap" id="ctable-wrap"><div class="ctable-box" id="ctable-box" tabindex="0" role="region" aria-label="Kategori karşılaştırma tablosu"><table class="ctable ftable">
        <caption class="sr-only">Kategorilerin karşılaştırması. Sütun başlığındaki düğmeyle sıralanır; satırdaki "Puan ayrıntısı" düğmesi ölçütleri açar.</caption>
        <thead><tr>${FCOLS.map((c) => `<th scope="col" class="${c.txt || c.k === 'sik' ? 'txt' : ''} ${c.cls || ''}" data-col="${c.k}"><button type="button" class="ft-sort" data-sort="${c.k}">${esc(c.h)}<span class="ft-ar" aria-hidden="true"></span></button></th>`).join('')}</tr></thead>
        <tbody id="ft-body"></tbody></table></div></div>
      <div class="empty ff-empty" id="ff-empty" hidden><p>Bu filtrelere uyan kategori yok.</p><button type="button" class="btn ghost" data-ffclear>Filtreleri temizle</button></div>
      <p class="note fp-note"><span id="ft-foot"></span>Her kategori ${uMin === uMax ? uMin : `${uMin}-${uMax}`} üründen oluşan bir örneklem. Bu tablo pazarın tamamını değil, örneklemdeki ürünleri karşılaştırır. 1-2 yıldız payları ürünlerin Trendyol'daki tüm yazılı yorumlarından, şikâyet oranı ise okunan 1-2 yıldızlı yorumlardan hesaplandı.${failed > 0 ? ` ${failed} kategorinin verisi yüklenemediği için tabloda yok.` : ''} <a href="#/yontem">Bu rakamlar nasıl hesaplandı?</a></p>`;
    const $ = (id) => document.getElementById(id);
    const body = $('ft-body'), sliders = [...app.querySelectorAll('[data-wi]')];
    const passes = (r) => (!fl.ust || r.ust === fl.ust) && (!fl.buyuk20 || r.buyukPay == null || r.buyukPay < 0.2)
      && (!fl.kobiOk || r.buyuk == null || (r.kobi != null && r.kobi <= r.buyuk)) && (!fl.maxD || r.dusuk <= Number(fl.maxD) + 1e-12);
    const syncCtl = () => {
      app.querySelectorAll('input[name="fs-preset"]').forEach((i) => { i.checked = i.value === ws.p; });
      const pr = ws.p === 'ozel' ? OZEL : PRESETS.find((p) => p.k === ws.p), w = weightsOf(ws);
      $('fs-desc').textContent = pr.acik;
      $('fs-sliders').hidden = ws.p !== 'ozel';
      sliders.forEach((s) => { const i = +s.dataset.wi; s.value = ws.w[i]; s.setAttribute('aria-valuetext', `${ws.w[i]} / 5`); app.querySelector(`[data-wo="${i}"]`).textContent = ws.w[i]; });
      $('prt-w').textContent = `Giriş puanı ağırlığı: ${pr.ad} (${COMPS.map((c, i) => `${c.ad} ${w[i]}`).join(', ')})`;
      app.querySelectorAll('[data-fust]').forEach((b) => { const on = b.dataset.fust === fl.ust; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      $('ff-b20').checked = fl.buyuk20; $('ff-kobi').checked = fl.kobiOk; $('ff-d').value = fl.maxD;
    };
    const detail = (r, w) => `<tr class="ft-detail"><td colspan="${NC}">${dbox(r, w)}</td></tr>`;
    const dbox = (r, w) => {
      let ws2 = COMPS.map((c, i) => (r.comp[c.k] == null ? 0 : w[i]));
      if (!ws2.some(Boolean)) ws2 = COMPS.map((c) => (r.comp[c.k] == null ? 0 : 1));
      const t = ws2.reduce((a, x) => a + x, 0);
      return `<div class="ft-dbox" id="ftd-${esc(r.id)}">
        <table class="ft-comp"><caption class="sr-only">${esc(r.ad)}: giriş puanının ölçütleri</caption><thead><tr><th scope="col">Ölçüt</th><th scope="col">Ham değer</th><th scope="col" class="num">Ölçüt puanı</th><th scope="col" class="num">Ağırlık</th></tr></thead><tbody>
        ${COMPS.map((c, i) => `<tr${r.comp[c.k] == null ? ' class="muted"' : ''}><th scope="row">${esc(c.ad)}</th><td>${rawTxt[c.k](r)}</td><td class="num" data-l="Ölçüt puanı " data-comp="${c.k}">${r.comp[c.k] == null ? '–' : Math.round(r.comp[c.k])}</td><td class="num" data-l="Ağırlık ">${r.comp[c.k] == null ? '–' : `${w[i]}${t ? ` <span class="muted">(%${Math.round((ws2[i] / t) * 100)})</span>` : ''}`}</td></tr>`).join('')}
        </tbody></table><p class="muted">Giriş puanı = ölçüt puanlarının ağırlıklı ortalaması = <b class="num">${fNum(r.puanTam)}</b>, yuvarlanınca <b class="num">${r.puan}</b>.</p></div>`;
    };
    // Telefonda tablo yerine kategori başına bir kart (aynı sıralama, filtre ve "Puan ayrıntısı")
    const fcard = (r, rank, w) => `<li class="fc" data-row="${esc(r.id)}">
        <div class="fc-top"><div class="fc-name">${rank ? `<span class="ft-rank num" aria-label="${r.sira}. sıra">${r.sira}</span>` : ''}<span><a href="#/kategori/${esc(r.id)}">${esc(r.ad)}</a><small class="muted num">${esc(r.ust)} · ${int(r.urun)} ürün · ${int(r.okunan)} okunan yorum</small></span></div>
          <div class="fc-score"><b class="ft-score num">${r.puan}</b><small class="muted">Giriş puanı${r.eksik ? ` (${5 - r.eksik} ölçüt)` : ''}</small></div></div>
        <dl class="fc-m">
          <div><dt>1-2 yıldız payı</dt><dd class="num"><span class="neg">${pct(r.dusuk, 1)}</span></dd></div>
          <div><dt>KOBİ'de</dt><dd class="num">${cell.kobi(r)}</dd></div>
          <div><dt>Büyük markada</dt><dd class="num">${cell.buyuk(r)}</dd></div>
          <div class="fc-w2"><dt>1 numaralı şikâyet</dt><dd>${cell.sik(r)}</dd></div>
          <div><dt>Büyük marka yorum payı</dt><dd class="num">${r.buyukPay == null ? '<span class="muted">Yok</span>' : pct(r.buyukPay, 1)}</dd></div>
        </dl>
        <button type="button" class="ft-exp" data-exp="${esc(r.id)}" aria-expanded="${fOpen.has(r.id)}" aria-controls="ftd-${esc(r.id)}">Puan ayrıntısı<span class="sr-only">: ${esc(r.ad)}</span></button>
        ${fOpen.has(r.id) ? dbox(r, w) : ''}</li>`;
    const draw = () => {
      const w = weightsOf(ws), allZero = scoreApply(rows, w), wEff = allZero ? [1, 1, 1, 1, 1] : w;
      $('fs-zero').hidden = !(ws.p === 'ozel' && allZero);
      const col = FCOLS.find((c) => c.k === fSort.k), v = col.val || ((r) => r[col.k]), m = fSort.dir === 'asc' ? 1 : -1;
      const vis = rows.filter(passes).sort((a, b) => {
        if (col.k === 'puan') return (a.sira - b.sira) * (m === -1 ? 1 : -1);
        const x = v(a), y = v(b);
        if (x == null || y == null) return x == null && y == null ? 0 : x == null ? 1 : -1;
        return (col.txt ? x.localeCompare(y, 'tr') : x - y) * m || a.ad.localeCompare(b.ad, 'tr');
      });
      const rank = col.k === 'puan', mob = fMQ.matches;
      $('fcards').innerHTML = mob ? vis.map((r) => fcard(r, rank, wEff)).join('') : '';
      $('fcards').hidden = !mob || !vis.length; $('fsort-m').hidden = !mob;
      $('fm-sort').value = fSort.k;
      $('fm-dir').textContent = col.txt ? (fSort.dir === 'asc' ? "A'dan Z'ye" : "Z'den A'ya") : (fSort.dir === 'asc' ? 'Küçükten büyüğe' : 'Büyükten küçüğe');
      $('fm-dir').setAttribute('aria-label', `Sıralama yönü: ${$('fm-dir').textContent}. Tersine çevir`);
      body.innerHTML = mob ? '' : vis.map((r) => `<tr data-row="${esc(r.id)}"><th scope="row"><div class="ft-name">${rank ? `<span class="ft-rank num" aria-label="${r.sira}. sıra">${r.sira}</span>` : ''}<a href="#/kategori/${esc(r.id)}">${esc(r.ad)}</a></div>`
        + `<button type="button" class="ft-exp" data-exp="${esc(r.id)}" aria-expanded="${fOpen.has(r.id)}" aria-controls="ftd-${esc(r.id)}">Puan ayrıntısı<span class="sr-only">: ${esc(r.ad)}</span></button></th>`
        + `${FCOLS.slice(1).map((c) => `<td class="${c.k === 'sik' ? 'txt' : 'num'} ${c.cls || ''}">${cell[c.k](r)}</td>`).join('')}</tr>${fOpen.has(r.id) ? detail(r, wEff) : ''}`).join('');
      $('ctable-wrap').hidden = mob || !vis.length; $('ff-empty').hidden = !!vis.length; $('scroll-hint').hidden = true;
      $('ff-n').textContent = `${vis.length} / ${rows.length} kategori`;
      $('ff-clear').hidden = !(fl.ust || fl.buyuk20 || fl.kobiOk || fl.maxD);
      const ek = vis.filter((r) => r.eksik);
      $('ft-foot').textContent = ek.length ? `"${5 - ek[0].eksik} ölçüt" işaretli satırda KOBİ ile büyük marka karşılaştırılamadığı için puan kalan ölçütlerle hesaplandı. ` : '';
      app.querySelectorAll('th[data-col]').forEach((th) => {
        const on = th.dataset.col === fSort.k;
        if (on) th.setAttribute('aria-sort', fSort.dir === 'asc' ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort');
        th.querySelector('.ft-ar').textContent = on ? (fSort.dir === 'asc' ? '↑' : '↓') : '↕';
      });
      syncCtl();
      if (vis.length && !mob) scrollTable();
    };
    fMQ.onchange = () => { if ($('fcards')) keepFocus(null); };
    const keepFocus = (sel) => { const y = scrollY; draw(); const el = sel && app.querySelector(sel); if (el && document.activeElement !== el) el.focus({ preventScroll: true }); scrollTo(scrollX, y); };
    app.onchange = (e) => {
      const t = e.target;
      if (t.name === 'fs-preset') {
        // "Kendin ayarla" ilk kez açılınca o anki hazır ayardan başlar; sonra kendi ağırlıkları saklanır, hazır ayara geçip dönünce kaybolmaz
        ws = t.value === 'ozel' ? { p: 'ozel', w: ws.c ? ws.w : [...weightsOf(ws)], c: true } : { ...ws, p: t.value };
        setW(ws); keepFocus(`input[name="fs-preset"][value="${t.value}"]`); return;
      }
      if (t.id === 'fm-sort') { const k = t.value; if (fSort.k !== k) { fSort.k = k; fSort.dir = FCOLS.find((c) => c.k === k).txt ? 'asc' : 'desc'; } keepFocus('#fm-sort'); return; }
      if (t.id === 'ff-b20') fl.buyuk20 = t.checked; else if (t.id === 'ff-kobi') fl.kobiOk = t.checked; else if (t.id === 'ff-d') fl.maxD = t.value; else return;
      setF(fl); keepFocus('#' + t.id);
    };
    app.oninput = (e) => {
      const s = e.target.closest('[data-wi]');
      if (!s) return;
      ws = { p: 'ozel', w: ws.w.map((x, i) => (i === +s.dataset.wi ? +s.value : x)), c: true };
      setW(ws); keepFocus(`[data-wi="${s.dataset.wi}"]`);
    };
    app.onclick = (e) => {
      const b = e.target.closest('[data-sort]');
      if (b) {
        const k = b.dataset.sort, txt = FCOLS.find((c) => c.k === k).txt;
        if (fSort.k === k) fSort.dir = fSort.dir === 'asc' ? 'desc' : 'asc';
        else { fSort.k = k; fSort.dir = txt ? 'asc' : 'desc'; }
        keepFocus(`[data-sort="${k}"]`); return;
      }
      if (e.target.closest('#fm-dir')) { fSort.dir = fSort.dir === 'asc' ? 'desc' : 'asc'; keepFocus('#fm-dir'); return; }
      const x = e.target.closest('[data-exp]');
      if (x) { const id = x.dataset.exp; if (fOpen.has(id)) fOpen.delete(id); else fOpen.add(id); keepFocus(`[data-exp="${CSS.escape(id)}"]`); return; }
      const u = e.target.closest('[data-fust]');
      if (u) { fl.ust = u.dataset.fust; setF(fl); keepFocus(`[data-fust="${CSS.escape(fl.ust)}"]`); return; }
      if (e.target.closest('#ff-clear') || e.target.closest('[data-ffclear]')) { fl = F0(); setF(fl); keepFocus('[data-fust=""]'); }
    };
    draw();
  }

  async function method(isStale) {
    const data = await loadAll();
    if (isStale()) return;
    setTitle('Yöntem', 'ReviewRadar rakamları nasıl hesaplanıyor: hangi yorumlar okundu, şikâyet oranı, 1-2 yıldız payı, rakip karşılaştırması ve giriş puanı.');
    const t = totals(data);
    const oran = t.onerilenN ? t.onerilen / t.onerilenN : 0, gercek = t.yazili ? t.dusukN / t.yazili : 0;
    app.innerHTML = `
      <div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Yöntem</div>
        <div class="chead"><h1>Yöntem: Bu rakamlar nasıl hesaplandı?</h1></div></div>
      <article class="doc">
        ${kpiList(t, 'doc-kpis')}
        <section><h2>Veri nereden geliyor?</h2>
          <p>Rakamlar Trendyol'daki ürün yorumlarından geliyor. Yorumlar bir araştırma örneklemi olarak tek seferde toplandı. Yorum yazanların adları toplanmadı.</p></section>
        <section id="y-iki-ornek" tabindex="-1"><h2>Her üründe hangi yorumlar okundu?</h2>
          <p>Her ürün için iki ayrı örnek okundu:</p>
          <ul class="ul"><li>Trendyol'un "Önerilen" sıralamasındaki ilk 100 yorum. Ürün sayfası yorumları önce bu sırayla gösterdiği için müşterinin ilk okuduğu yorumlar bunlar. Yorumu az olan üründe bu sırada 100'den az yorum var; o üründe hepsi okundu.</li><li>1 ya da 2 yıldız verilmiş en fazla 100 yorum. Üründe bu kadar düşük puanlı yorum yoksa daha azı.</li></ul></section>
        <section><h2>Neden iki ayrı örnek?</h2>
          <p>"Önerilen" sıralamada düşük puanlı yorum neredeyse hiç görünmüyor. Yalnızca ilk sayfayı okursan sorunları göremezsin.</p>
          ${t.tam && t.onerilenN ? `<p>Bu sitedeki ${t.kat} kategoride "Önerilen" sıralamada okunan ${int(t.onerilenN)} yorumun yalnızca ${int(t.onerilen)} tanesi 1-2 yıldızlı (payı ${pct(oran, 1)}). Oysa tüm yazılı yorumlarda 1-2 yıldız payı ${pct(gercek, 1)}. Şikâyet oranları bu yüzden ayrıca okunan ${int(t.ornek)} adet 1-2 yıldızlı yorumdan hesaplandı.</p>` : ''}</section>
        <section id="y-sikayet" tabindex="-1"><h2>Şikâyet oranı ne demek?</h2>
          <p>Bir konunun şikâyet oranı, okunan 1-2 yıldızlı yorumların yüzde kaçında o konudan söz edildiğini gösterir.</p>
          <ul class="ul"><li>Konular her kategori için hazırlanan anahtar kelimelerle bulundu. Bu yüzden oranlar yaklaşıktır.</li><li>Bir yorum birden fazla konuya girebilir. Bu yüzden oranların toplamı 100 etmez.</li><li>Kategori ortalamasında her ürün, okunan 1-2 yıldızlı yorum sayısı kadar ağırlık taşır.</li></ul></section>
        <section id="y-yildiz" tabindex="-1"><h2>1-2 yıldız payı ne demek?</h2>
          <p>Yazılı yorumların yüzde kaçının 1 ya da 2 yıldız olduğunu gösterir. Örneklemden değil, ürünün Trendyol'daki tüm yıldız dağılımından hesaplandı. Kategori ve satıcı tipi için o gruptaki bütün ürünlerin yorumları birlikte sayılır.</p></section>
        <section id="y-segment" tabindex="-1"><h2>KOBİ ve büyük marka</h2>
          <p>Her ürün iki gruptan birine kondu:</p>
          <ul class="ul"><li><b>Büyük marka:</b> herkesin bildiği ulusal ya da uluslararası markalar ve büyük mağaza zincirlerinin kendi ürünleri.</li><li><b>KOBİ:</b> küçük ve orta ölçekli satıcılar. Mağazada da satılsa internetten büyüyen yerli markalar bu grupta sayıldı.</li></ul>
          <p>Ayrım her kategoride ürün seçilirken elle yapıldı. Bazı markalarda tartışmaya açıktır. Bir kategoride tek grup varsa satıcı tipi karşılaştırması gösterilmez.</p></section>
        <section id="y-rakip" tabindex="-1"><h2>Rakibin açık verdiği konular nasıl bulunuyor?</h2>
          <p>Ürün sayfasındaki "Bu rakip nerede açık veriyor?" kutusu, ürünün her konudaki şikâyet oranını kategori ortalamasıyla karşılaştırır. Kategori ortalaması, ürün sayfasındaki çubuklarda ince çizgiyle gösterilen değerdir.</p>
          <ul class="ul"><li>Ürünün en az ${GAP.minN} adet 1-2 yıldızlı yorumu okunmuş olmalı. Daha azsa fark gösterilmez.</li>
            <li><b>Açık verdiği konu:</b> ürünün şikâyet oranı kategori ortalamasından en az ${Math.round(GAP.pts * 100)} yüzde puan yüksek, ortalamanın en az ${String(GAP.ratio).replace('.', ',')} katı ve konu en az ${GAP.minK} yorumda geçiyor.</li>
            <li><b>Az şikâyet aldığı konu:</b> ürünün şikâyet oranı kategori ortalamasından en az ${Math.round(GAP.pts * 100)} yüzde puan düşük ve ortalamanın en fazla yarısı.</li>
            <li>Fark, okunan yorum sayısına göre şansla açıklanamayacak kadar büyük olmalı: fark, ortalamanın bu örneklemdeki olağan oynamasının (standart hata) en az ${GAP.z} katı.</li>
            <li>Her iki listede en büyük farkı olan en fazla ${GAP.max} konu gösterilir.</li></ul>
          <p>Bu karşılaştırma ürünün gerçek kalitesini ölçmez. Yalnızca 1-2 yıldız veren müşterilerin hangi sorunu ne sıklıkla yazdığını gösterir.</p></section>
        <section id="y-kontrol" tabindex="-1"><h2>Giriş kontrol listesi</h2>
          <p>Kategori sayfasının sonundaki liste, kategorinin şikâyet oranı en yüksek 5 konusundan ve o kategori için yazılan önerilerin başlıklarından oluşur. Yeni bir bilgi eklemez. İşaretler yalnızca senin tarayıcında saklanır; siteye gönderilmez.</p></section>
        <section><h2>"Dikkat" ve "ders" notları</h2>
          <p>Ürün sayfalarındaki "Bu ürünün zayıf noktaları" ve "Rakip bir KOBİ için ders" notları, olumsuz yorumlar okunarak yazılmış yorumlardır. Ölçüm değildir.</p></section>
        <section id="giris-puani"><h2>Giriş puanı nasıl hesaplanıyor?</h2>
          <p><a href="#/firsat">Kategori karşılaştırma</a> sayfasındaki giriş puanı 0 ile 100 arasındadır; yüksek puan, küçük bir satıcı için daha çekici bir kategori demektir. Beş ölçütün her biri 0-100 arası puanlanır, sonra seçtiğin ağırlıklarla ortalaması alınır:</p>
          <ul class="ul">${COMPS.map((c) => `<li><b>${esc(c.ad)}:</b> ${esc(c.acik)}</li>`).join('')}</ul>
          <p>"En yüksek" ve "en düşük" bu sitedeki tüm kategorilere göre belirlenir; tablodaki filtreler puanı değiştirmez. Bütün kategoriler bir ölçütte eşitse herkes o ölçütten 50 alır. Puan tam sayıya yuvarlanır; eşitlikte 1-2 yıldız payı düşük olan öne geçer.</p>
          <p>Hazır ağırlıklar (sırasıyla: ${COMPS.map((c) => esc(c.ad.toLocaleLowerCase('tr'))).join(', ')}):</p>
          <ul class="ul">${PRESETS.map((p) => `<li><b>${esc(p.ad)}:</b> <span class="num">${p.w.join(', ')}</span>. ${esc(p.acik)}</li>`).join('')}<li><b>${esc(OZEL.ad)}:</b> her ölçüt 0-5. Hepsini 0 yaparsan eşit ağırlık kullanılır.</li></ul>
          <p>Giriş puanı bir okuma kolaylığıdır, pazar tahmini değildir: kategorileri yalnızca örneklemdeki ürünlere bakarak birbirine göre sıralar.</p></section>
        <section><h2>Sınırlar</h2>
          <ul class="ul"><li>Veri tek bir anın görüntüsü; zamanla değişebilir.</li><li>Tek pazar yeri: yalnızca Trendyol.</li><li>Az yorumu olan üründe örnek küçük; o ürünün oranlarını dikkatle oku.</li></ul></section>
        <p><a class="btn" href="#/">Kategorilere git</a></p>
      </article>`;
  }

  // ---- yönlendirme, kaydırma, yükleme ----
  history.scrollRestoration = 'manual';
  const scrollMap = (() => { try { return JSON.parse(sessionStorage.getItem('rr_scroll')) || {}; } catch { return {}; } })();
  let curKey = null, routing = false, routeTok = 0;
  const newKey = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  addEventListener('scroll', () => { if (!routing && curKey) scrollMap[curKey] = scrollY; }, { passive: true });
  addEventListener('pagehide', () => { try { sessionStorage.setItem('rr_scroll', JSON.stringify(scrollMap)); } catch {} });

  const parseHash = () => {
    const raw = location.hash.replace(/^#\/?/, '');
    try { return raw.split('/').map((s) => decodeURIComponent(s)); } catch { return null; }
  };
  const showLoading = () => {
    app.setAttribute('aria-busy', 'true');
    app.innerHTML = '<div class="loading" role="status"><p class="muted">Yükleniyor…</p><div class="sk sk-h"></div><div class="sk"></div><div class="sk sk-s"></div></div>';
  };
  const showError = () => {
    setTitle('Veri yüklenemedi');
    app.innerHTML = '<div class="empty" role="alert"><h1>Veri yüklenemedi</h1><p class="muted">Bağlantını kontrol edip tekrar dene.</p><button type="button" class="btn" id="retry">Tekrar dene</button></div>';
    app.onclick = (e) => { if (e.target.closest('#retry')) route({ keep: true }); };
  };

  async function route(opts = {}) {
    const tok = ++routeTok;
    const isStale = () => tok !== routeTok;
    routing = true;
    closeDrawer(false);
    if (barMsg && barMsg.type === 'ask' && !opts.keep) barMsg = null;
    app.onclick = app.onchange = app.oninput = null;
    let h = parseHash();
    if (!h || !['', 'kategori', 'urun', 'karsilastir', 'ara', 'yontem', 'firsat'].includes(h[0]) || (h[0] === 'ara' && !h.slice(1).join('/').trim())) {
      history.replaceState(history.state, '', '#/');
      h = [''];
    }
    syncNav();
    let restoreY = 0;
    const keepY = scrollY;
    if (!opts.keep) {
      const st = history.state;
      if (st && st.k) { curKey = st.k; restoreY = scrollMap[st.k] || 0; }
      else { curKey = newKey(); history.replaceState({ k: curKey }, ''); restoreY = 0; }
    }
    const timer = setTimeout(() => { if (!isStale()) showLoading(); }, 150);
    try {
      if (!REG.length) { REG = await getJSON('data/kategoriler.json'); if (isStale()) return; }
      if (h[0] === 'kategori') await category(h[1], isStale, h[2] === 'konu' ? h[3] : null);
      else if (h[0] === 'urun') await product(h[1], h[2], isStale);
      else if (h[0] === 'karsilastir') await compare(isStale);
      else if (h[0] === 'ara') await search(h.slice(1).join('/').trim(), isStale);
      else if (h[0] === 'yontem') await method(isStale);
      else if (h[0] === 'firsat') await firsat(isStale);
      else await home(isStale);
    } catch (e) {
      if (!isStale()) showError();
      console.warn(e);
    } finally {
      clearTimeout(timer);
    }
    if (isStale()) return;
    app.removeAttribute('aria-busy');
    scrollTo(0, opts.keep ? keepY : restoreY);
    // #/yontem/<bölüm>: terim açıklamalarındaki bağlantılar ilgili bölüme açılır
    if (h[0] === 'yontem' && h[1] && !opts.keep && !restoreY) {
      const el = document.getElementById('y-' + h[1]);
      if (el) { el.scrollIntoView(); el.focus({ preventScroll: true }); }
    }
    if (!opts.keep && curKey) scrollMap[curKey] = scrollY;
    routing = false;
    drawBar();
  }
  const syncNav = () => { const a = document.getElementById('nav-firsat'); if (!a) return; if (location.hash.startsWith('#/firsat')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); };

  // ---- tema: Sistem + beş tema; seçim localStorage'da, uygulanan tema html[data-theme] ----
  const THEMES = { sistem: 'Sistem', acik: 'Açık', krem: 'Krem', adacayi: 'Adaçayı', koyu: 'Koyu', gece: 'Gece mavisi' };
  const root = document.documentElement, themeBtn = document.getElementById('theme'), themeMenu = document.getElementById('theme-menu'), themeCur = document.getElementById('theme-cur');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  const themeItems = () => [...themeMenu.querySelectorAll('[role="menuitemradio"]')];
  const applyTheme = (choice, save) => {
    if (!THEMES[choice]) choice = 'sistem';
    root.dataset.themeChoice = choice;
    root.dataset.theme = choice === 'sistem' ? (darkMQ.matches ? 'koyu' : 'acik') : choice;
    if (save) { try { localStorage.setItem('rr_theme', choice); } catch {} }
    themeItems().forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeV === choice)));
    themeCur.textContent = `: ${THEMES[choice]}${choice === 'sistem' ? ` (${THEMES[root.dataset.theme]})` : ''}`;
    const band = getComputedStyle(root).getPropertyValue('--band').trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = band; });
  };
  // Eski "light"/"dark" kaydı Açık/Koyu olarak yeniden yazılır
  try { const old = localStorage.getItem('rr_theme'); if (old === 'light' || old === 'dark') localStorage.setItem('rr_theme', old === 'light' ? 'acik' : 'koyu'); } catch {}
  applyTheme(root.dataset.themeChoice || 'sistem', false);
  darkMQ.addEventListener('change', () => { if (root.dataset.themeChoice === 'sistem') applyTheme('sistem', false); });
  const menuOpen = () => !themeMenu.hidden;
  const openMenu = (focusLast) => {
    themeMenu.hidden = false; themeBtn.setAttribute('aria-expanded', 'true');
    const it = themeItems(), cur = it.find((b) => b.getAttribute('aria-checked') === 'true') || it[0];
    (focusLast ? it[it.length - 1] : cur).focus();
  };
  const closeMenu = (refocus) => { if (!menuOpen()) return; themeMenu.hidden = true; themeBtn.setAttribute('aria-expanded', 'false'); if (refocus) themeBtn.focus(); };
  themeBtn.addEventListener('click', () => (menuOpen() ? closeMenu(false) : openMenu()));
  themeBtn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(e.key === 'ArrowUp'); }
  });
  themeMenu.addEventListener('click', (e) => { const b = e.target.closest('[data-theme-v]'); if (!b) return; applyTheme(b.dataset.themeV, true); closeMenu(true); });
  themeMenu.addEventListener('keydown', (e) => {
    const it = themeItems(), i = it.indexOf(document.activeElement);
    const go = (j) => { e.preventDefault(); it[(j + it.length) % it.length].focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(it.length - 1);
    else if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
    else if (e.key === 'Tab') closeMenu(false);
  });
  document.addEventListener('pointerdown', (e) => { if (menuOpen() && !e.target.closest('.theme-pick')) closeMenu(false); });
  themeMenu.addEventListener('focusout', (e) => { if (menuOpen() && e.relatedTarget && !e.relatedTarget.closest('.theme-pick')) closeMenu(false); });

  // Yapışkan başlığın yüksekliği: bölüm menüsü ve filtre paneli bunun altına yapışır
  const topBar = document.querySelector('.top');
  const setTopH = () => root.style.setProperty('--top-h', topBar.offsetHeight + 'px');
  if (topBar) { setTopH(); if (window.ResizeObserver) new ResizeObserver(setTopH).observe(topBar); }

  // İçeriğe geç bağlantısı: hash yönlendirmesini tetiklemeden ana içeriğe odaklan
  document.querySelector('.skip')?.addEventListener('click', (e) => { e.preventDefault(); app.focus(); });

  window.addEventListener('hashchange', () => route());
  route();
})();
