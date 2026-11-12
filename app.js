(() => {
  const app = document.getElementById('app');
  const cache = {};
  let REG = [];
  const SITE = 'ReviewRadar';
  const setTitle = (t) => { document.title = t ? `${t} · ${SITE}` : SITE; };
  const pct = (v, d = 0) => '%' + (v * 100).toFixed(d).replace('.', ',');
  const int = (v) => Number(v).toLocaleString('tr-TR');
  const dec = (v) => Number(v).toFixed(2).replace('.', ',');
  // İşaretli fark: +0,15 / −0,15 / 0,00 (eksi için gerçek eksi işareti)
  const sgn = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? '0,00' : (r > 0 ? '+' : '−') + dec(Math.abs(r)); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => s.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
  const isKobi = (p) => p.segment === 'KOBİ';
  const markaAd = (m) => (m === 'Genel Markalar' ? 'Markasız' : m);
  const onerN = (p) => p.onerilen_n ?? 100;
  const ready = () => REG.filter((c) => c.durum === 'hazir');
  const regOf = (id) => REG.find((c) => c.id === id);

  const getJSON1 = (u) => fetch(u, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  const getJSON = (u) => getJSON1(u).catch(() => getJSON1(u.replace(/^data\//, '')));
  // Başarısız yükleme önbellekte kalmaz; "Tekrar dene" yeniden ister.
  const loadCat = (id) => (cache[id] ??= getJSON(`data/${id}.json`).then(enrich).catch((e) => { delete cache[id]; throw e; }));

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
  const match = (s) => {
    const n = norm(s); if (!n) return [];
    return REG.map((c) => {
      const terms = [c.ad, ...(c.esanlam || [])].map(norm);
      const score = terms.some((t) => t === n) ? 3 : terms.some((t) => t.startsWith(n) || n.startsWith(t)) ? 2 : terms.some((t) => t.includes(n) || n.includes(t)) ? 1 : 0;
      return { c, score };
    }).filter((x) => x.score).sort((a, b) => b.score - a.score || (a.c.durum === 'hazir' ? -1 : 1)).map((x) => x.c);
  };
  let sugIdx = -1;
  const sugOpts = () => [...sug.querySelectorAll('li[role="option"]:not([aria-disabled="true"])')];
  const closeSug = () => { sug.hidden = true; sugIdx = -1; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); };
  const markSug = () => {
    const o = sugOpts();
    o.forEach((li, i) => li.setAttribute('aria-selected', String(i === sugIdx)));
    if (o[sugIdx]) { q.setAttribute('aria-activedescendant', o[sugIdx].id); o[sugIdx].scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
  };
  q.addEventListener('input', () => {
    const m = match(q.value).slice(0, 6);
    sug.innerHTML = m.map((c, i) => c.durum === 'hazir'
      ? `<li role="option" id="sg-${i}" aria-selected="false" data-href="#/kategori/${esc(c.id)}"><a href="#/kategori/${esc(c.id)}" tabindex="-1"><span>${esc(c.ad)}</span><small class="muted">${int(c.urun)} ürün</small></a></li>`
      : `<li role="option" id="sg-${i}" aria-disabled="true" class="off"><span>${esc(c.ad)}</span><small class="muted">Yakında</small></li>`).join('');
    sugIdx = -1;
    sug.hidden = !m.length;
    q.setAttribute('aria-expanded', String(!!m.length));
    q.removeAttribute('aria-activedescendant');
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!sug.hidden) { e.preventDefault(); closeSug(); } return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const o = sugOpts(); if (sug.hidden || !o.length) return;
    e.preventDefault();
    sugIdx = e.key === 'ArrowDown' ? (sugIdx + 1) % o.length : (sugIdx <= 0 ? o.length - 1 : sugIdx - 1);
    markSug();
  });
  sug.addEventListener('mousedown', (e) => { if (e.target.closest('li.off')) e.preventDefault(); });
  sug.addEventListener('click', (e) => { if (e.target.closest('li.off')) { e.preventDefault(); return; } if (e.target.closest('a')) { closeSug(); q.blur(); } });
  q.addEventListener('blur', () => setTimeout(closeSug, 150));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const o = sugOpts()[sugIdx];
    if (!sug.hidden && o) { closeSug(); location.hash = o.dataset.href; q.blur(); return; }
    const term = q.value.trim();
    if (!norm(term)) { closeSug(); return; }
    closeSug();
    const m = match(term);
    const one = m.length === 1 ? m[0] : m[0] && norm(m[0].ad) === norm(term) ? m[0] : null;
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
          <a class="cat" href="#/kategori/${esc(c.id)}">
            <div class="cat-img">${c.gorsel ? `<img src="${esc(c.gorsel)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : `<span class="cat-ph">${esc(c.ad)}</span>`}</div>
            <div class="cat-body"><small>${esc(c.ust)}</small><h3>${esc(c.ad)}</h3>
              <span class="muted num" style="font-size:.88rem">${int(c.urun)} ürün · ${int(c.yorum)} yorum incelendi</span>${d && d.tema[0] ? `<span class="cat-top">En sık şikâyet: ${esc(d.tema[0].ad)} <b class="num">${pct(d.tema[0].tum)}</b></span>` : ''}
              <span class="cat-go">Analizi incele <span aria-hidden="true">→</span></span></div>
          </a>`;
  const soonCard = (c) => `<div class="soon-card" aria-label="${esc(c.ad)}, yakında"><small>${esc(c.ust)}</small><b>${esc(c.ad)}</b><span class="tag">Yakında</span></div>`;

  const loadAll = async () => { const r = ready(); return Object.fromEntries((await Promise.all(r.map((c) => loadCat(c.id).catch(() => null)))).map((d, i) => [r[i].id, d])); };
  const totals = (data) => {
    const r = ready(), D = Object.values(data).filter(Boolean);
    const s = (f) => D.reduce((a, d) => a + f(d), 0);
    return { kat: r.length, urun: r.reduce((a, c) => a + (c.urun || 0), 0), yazili: s((d) => d.top.yazili), okunan: r.reduce((a, c) => a + (c.yorum || 0), 0),
      dusukN: s((d) => d.top.dusukN), onerilenN: s((d) => d.top.onerilenN), onerilen: s((d) => d.top.onerilen), ornek: s((d) => d.top.ornek), tam: D.length === r.length };
  };
  const kpiList = (t, cls = 'kpis') => `<dl class="${cls}">
          <div><dt>Analiz edilen kategori</dt><dd class="num">${t.kat}</dd></div>
          <div><dt>İncelenen ürün</dt><dd class="num">${int(t.urun)}</dd></div>
          <div><dt>Yazılı yorum</dt><dd class="num">${int(t.yazili)}</dd></div>
          <div><dt>Tek tek okunan yorum</dt><dd class="num">${int(t.okunan)}</dd></div>
        </dl>`;

  let homeAlan = '';
  async function home(isStale) {
    const data = await loadAll();
    if (isStale()) return;
    setTitle('');
    const r0 = ready();
    const alanlar = [...new Set(r0.map((c) => c.ust))].sort((a, b) => a.localeCompare(b, 'tr'));
    if (homeAlan && !alanlar.includes(homeAlan)) homeAlan = '';
    app.innerHTML = `
      <section class="band hero-band">
        <div class="hero">
          <span class="eyebrow">KOBİ'ler için müşteri yorumu analizi</span>
          <h1>Satmak istediğin üründe müşteri neden memnun değil?</h1>
          <p class="lead">Rakip ürünlerin binlerce yorumunu tek tek okuduk. Bir kategori seç; en sık şikâyetleri, müşterinin neyi sevdiğini ve pazara girerken neye dikkat etmen gerektiğini gör.</p>
          <ol class="steps"><li><b>1</b>Kategori seç</li><li><b>2</b>Şikâyetleri gör</li><li><b>3</b>Ürünleri karşılaştır</li></ol>
        </div>
        ${kpiList(totals(data))}
      </section>
      <div class="alan-f" role="group" aria-label="Alana göre filtrele"><span class="muted">Alan:</span>
        ${['', ...alanlar].map((a) => `<button type="button" class="chip${a === homeAlan ? ' on' : ''}" data-alan="${esc(a)}" aria-pressed="${a === homeAlan}">${a ? esc(a) : 'Tümü'}</button>`).join('')}</div>
      <div id="home-list"></div>`;
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
  }

  async function search(term, isStale) {
    const m = match(term);
    const data = Object.fromEntries(await Promise.all(m.filter((c) => c.durum === 'hazir').map(async (c) => [c.id, await loadCat(c.id).catch(() => null)])));
    if (isStale()) return;
    setTitle(`"${term}" araması`);
    const avail = ready();
    app.innerHTML = `<div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Arama</div>
      <div class="chead"><h1>${m.length ? `"${esc(term)}" için sonuçlar` : `"${esc(term)}" için sonuç bulunamadı`}</h1></div></div>
      ${m.length ? `<div class="cats search-res">${m.map((c) => catCard(c, data[c.id])).join('')}</div>`
      : `<div class="empty"><p>Şu an analiz edilen kategoriler:</p><ul class="cat-links">${avail.map((c) => `<li><a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a></li>`).join('')}</ul></div>`}`;
  }

  let lastCat = (() => { try { return sessionStorage.getItem('rr_last_cat') || ''; } catch { return ''; } })();
  const rememberCat = (id) => { lastCat = id; try { sessionStorage.setItem('rr_last_cat', id); } catch {} };

  function notFound(msg, back) {
    setTitle('Sayfa bulunamadı');
    app.innerHTML = `<div class="crumbs"><a href="#/">Ana sayfa</a> / Bulunamadı</div><div class="empty"><h1>Sayfa bulunamadı</h1><p class="muted">${esc(msg || 'Aradığın sayfa bu sitede yok.')}</p>${back || '<a class="btn" href="#/">Ana sayfaya dön</a>'}</div>`;
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
    const a = document.getElementById('filters');
    if (a && a.classList.contains('open')) { e.preventDefault(); closeDrawer(); }
  });

  async function category(id, isStale) {
    const r = regOf(id);
    if (!r) { notFound('Bu kategori bu sitede yok.'); return; }
    if (r.durum !== 'hazir') {
      setTitle(`${r.ad} (yakında)`);
      app.innerHTML = `<div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(r.ad)}</div><div class="empty"><h1>${esc(r.ad)}</h1><p class="muted">Bu kategorinin yorumları henüz toplanmadı.</p><a class="btn" href="#/">Kategorilere dön</a></div>`;
      return;
    }
    const c = await loadCat(id);
    if (isStale()) return;
    rememberCat(id);
    setTitle(c.ad);
    const top4 = c.tema.slice(0, 4), max = top4[0].tum;
    const seg = c.tema.filter((t) => t.id !== 'gosterge').slice(0, 5);
    const segIki = new Set(c.urunler.map((p) => p.segment)).size > 1;
    const sort = sessionSort[id] || 'yorum';
    const tamYuz = c.top.onerilenN === c.urunler.length * 100;
    app.innerHTML = `
      <div class="band phead">
        <div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(c.ust)} / ${esc(c.ad)}</div>
        <div class="chead"><span class="eyebrow">${esc(c.ust)}</span><h1>${esc(c.ad)}</h1>
          <ul class="meta num"><li><b>${c.urunler.length}</b> ürün</li><li><b>${int(c.top.yazili)}</b> yazılı yorum</li><li><b>${int(c.top.okunan)}</b> yorum okundu</li><li>Kaynak: <b>${esc(c.kaynak)}</b></li></ul></div>
      </div>
      <section class="summary" aria-labelledby="sum-t">
        <div class="sum-main">
          <span class="label" id="sum-t">En sık şikâyetler</span>
          <ol class="issues">${top4.map((t) => `<li><span class="t">${esc(t.unlem.replace(/!$/, ''))}</span><span class="p">${pct(t.tum)}</span><span class="bar"><i style="width:${(t.tum / max) * 100}%"></i></span></li>`).join('')}</ol>
          <p class="note">Yüzde, 1-2 yıldızlı yorumların kaçında bu sorunun geçtiğini gösterir. Bir yorum birden fazla soruna girebilir. <a href="#/yontem">Bu rakamlar nasıl hesaplandı?</a></p>
        </div>
        <div class="sum-side">
          <div class="fact"><b class="neg">${pct(c.top.dusuk, 1)}</b><span>Yazılı yorumlarda 1-2 yıldız payı</span></div>
          <div class="fact"><b>${c.top.onerilen}</b><span>${tamYuz
            ? `Trendyol'un "Önerilen" sıralamasında ${c.urunler.length} ürünün ilk 100 yorumunda (toplam ${int(c.top.onerilenN)}) görünen 1-2 yıldızlı yorum`
            : `Trendyol'un "Önerilen" sıralamasında okunan ${int(c.top.onerilenN)} yorumda görünen 1-2 yıldızlı yorum`}</span></div>
          <div class="fact"><b>${esc(c.tema[0].ad)}</b><span>Kategorinin 1 numaralı sorunu</span></div>
        </div>
      </section>
      <div class="tools"><h2>Ürünler <span class="muted num" style="font-weight:400" id="pcount"></span></h2>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn ghost f-open" id="f-open" aria-controls="filters" aria-expanded="false">Filtrele</button>
          <label class="muted">Sırala <select id="sort">
          <option value="yorum">En çok yorum</option><option value="puan">En yüksek puan</option><option value="dusuk">En az 1-2 yıldız</option><option value="cok">En çok 1-2 yıldız</option></select></label>
        </div></div>
      <div class="plist">
        <aside class="filters" id="filters" aria-label="Filtreler">${filterPanel(c)}</aside>
        <div class="f-backdrop" id="f-backdrop" hidden></div>
        <div><div class="chips" id="chips"></div><div class="pgrid" id="pgrid"></div></div>
      </div>
      <h2 class="sec-h">Kategori içgörüleri</h2>
      <div class="cgrid">
        <section class="card"${segIki ? '' : ' style="grid-column:1/-1"'}><h2>Müşteriler neyi seviyor?</h2><p class="muted">Olumlu yorumlarda en sık geçen konular.</p>${hbar(c.olk.slice(0, 6).map((k) => ({ ad: k.ad, v: k.tum })))}</section>
        ${segIki ? `<section class="card"><h2>Büyük marka mı, KOBİ mi?</h2><p class="muted">Aynı sorunun iki gruptaki oranı.</p><div class="legend"><span><i style="background:var(--muted)"></i>Büyük marka</span><span><i style="background:var(--neg)"></i>KOBİ</span></div>
          <div class="hbars">${seg.map((t) => { const m = Math.max(...seg.map((x) => Math.max(x.buyuk, x.kobi))); return `<div class="hb"><span>${esc(t.ad)}</span><span style="display:grid;gap:3px"><span class="tr"><i style="width:${(t.buyuk / m) * 100}%;background:var(--muted)"></i></span><span class="tr"><i style="width:${(t.kobi / m) * 100}%;background:var(--neg)"></i></span></span><span class="v">${pct(t.buyuk)}<br>${pct(t.kobi)}</span></div>`; }).join('')}</div></section>` : ''}
        <section class="card" style="grid-column:1/-1"><h2>Bu kategoriye girecek KOBİ için öneriler</h2><ol class="recs" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">${c.oneriler.map((o) => `<li><b>${esc(o.baslik)}</b><span>${esc(o.metin)}</span></li>`).join('')}</ol></section>
      </div>`;
    const sel = document.getElementById('sort'); sel.value = sort;
    const st = (filterState[id] ??= { segment: [], marka: [], sikayet: [], puan: '', dusuk: '' });
    const aside = document.getElementById('filters');
    aside.inert = drawerMQ.matches;
    aside.querySelectorAll('input').forEach((i) => {
      const v = st[i.name];
      i.checked = Array.isArray(v) ? v.includes(i.value) : v === i.value;
    });
    const draw = () => {
      const f = { yorum: (a, b) => b.yazili - a.yazili, puan: (a, b) => b.ort - a.ort, dusuk: (a, b) => a.dusuk - b.dusuk, cok: (a, b) => b.dusuk - a.dusuk }[sel.value];
      const list = c.urunler.filter((p) => passes(p, st)).sort(f);
      const cm = getCmp();
      document.getElementById('pgrid').innerHTML = list.length ? list.map((p) => card(c, p, cm)).join('')
        : '<div class="empty" style="grid-column:1/-1"><p>Bu filtrelere uyan ürün yok.</p><button type="button" class="btn ghost" data-clear>Filtreleri temizle</button></div>';
      document.getElementById('pcount').textContent = `(${list.length} / ${c.urunler.length})`;
      const chips = [];
      for (const k of ['segment', 'marka', 'sikayet']) st[k].forEach((v) => chips.push([k, v, k === 'sikayet' ? c.temaMap[v].ad : v]));
      if (st.puan) chips.push(['puan', st.puan, PUAN[st.puan]]);
      if (st.dusuk) chips.push(['dusuk', st.dusuk, 'Şikâyet oranı: ' + DUSUK[st.dusuk][0]]);
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
      if (e.target.closest('[data-clear]')) { clear(); return; }
      const ch = e.target.closest('.chip');
      if (ch) {
        const { k, v } = ch.dataset;
        if (Array.isArray(st[k])) st[k] = st[k].filter((x) => x !== v); else st[k] = '';
        const inp = aside.querySelector(`input[name="${CSS.escape(k)}"][value="${CSS.escape(v)}"]`); if (inp) inp.checked = false;
        draw();
      }
      if (e.target.closest('#f-open')) openDrawer();
      if (e.target.closest('#f-close') || e.target.closest('#f-backdrop')) closeDrawer();
    };
    sel.addEventListener('change', () => { sessionSort[id] = sel.value; draw(); });
    draw();
  }
  const filterState = {};
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
      + (segs.length > 1 ? group('Satıcı tipi', 'segment', segs.map((s) => [s, s, count((p) => p.segment === s)])) : '')
      // Markaların çoğundan tek ürün varken marka filtresi ürün listesini tekrarlar; marka sayısı ürünlerin 3/4'ünü geçmiyorsa göster
      + (markalar.length <= P.length * 0.75 ? group('Marka', 'marka', markalar.map((m) => [m, markaAd(m), count((p) => p.marka === m)])) : '')
      + group('En sık şikâyet', 'sikayet', tops.map((t) => [t, c.temaMap[t].ad, count((p) => p.sik[0]?.id === t)]))
      + group('Ortalama puan', 'puan', PUAN_L.map(([v, l]) => [v, l, count((p) => p.ort >= Number(v))]), 'radio')
      + group('1-2 yıldız oranı', 'dusuk', Object.entries(DUSUK).map(([v, [l, lo, hi]]) => [v, l, count((p) => p.dusuk >= lo && p.dusuk < hi)]), 'radio')
      + '<div class="fg"><button type="button" class="btn ghost" data-clear>Filtreleri temizle</button></div>';
  }
  const sessionSort = {};
  const segBadge = (p) => `<span class="seg ${isKobi(p) ? 'kobi' : 'buyuk'}">${esc(p.segment)}</span>`;
  const card = (c, p, cm) => `
    <article class="pc">
      <a class="pc-img" href="#/urun/${esc(c.id)}/${esc(p.id)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.gorsel)}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>
      <div class="pc-body">
        ${segBadge(p)}
        <a class="pc-name" href="#/urun/${esc(c.id)}/${esc(p.id)}"><b>${esc(markaAd(p.marka))}</b> ${esc(p.ad.replace(p.marka, '').trim())}</a>
        <div class="stars"><span class="s" aria-hidden="true">★</span><b class="num">${dec(p.ort)}</b><span class="muted num">(${int(p.yazili)} yorum)</span></div>
        <dl class="pc-meta">
          <div><dt>1-2 yıldız</dt><dd class="${negCls(p.dusuk)} num">${pct(p.dusuk, 1)}</dd></div>
          <div class="stack"><dt>En sık şikâyet</dt><dd${noLow(p) ? ' class="none"' : ''}>${esc(noLow(p) ? noLowShort(p) : p.sik[0]?.ad || '')}</dd></div>
        </dl>
        <label class="pc-cmp"><input type="checkbox" data-cmp="${esc(p.id)}" data-cat="${esc(c.id)}" ${inCmp(cm, c.id, p.id) ? 'checked' : ''}>Karşılaştır</label>
      </div>
    </article>`;

  async function product(cid, pid, isStale) {
    const r = regOf(cid);
    if (!r || r.durum !== 'hazir') { notFound('Bu ürün ya da kategori bu sitede yok.'); return; }
    const c = await loadCat(cid);
    if (isStale()) return;
    const p = c.urunler.find((u) => u.id === pid);
    if (!p) { notFound('Bu ürün bu kategoride yok.', `<a class="btn" href="#/kategori/${esc(c.id)}">${esc(c.ad)} sayfasına dön</a>`); return; }
    rememberCat(cid);
    setTitle(p.kisa);
    const on = inCmp(getCmp(), c.id, p.id);
    const yt = p.yazili, n = onerN(p), empty = noLow(p);
    app.innerHTML = `
      <div class="band phead">
      <div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a> / ${esc(p.kisa)}</div>
      <div class="prod">
        <div class="prod-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" referrerpolicy="no-referrer"></div>
        <div class="prod-info">
          ${segBadge(p)}
          <h1>${esc(p.ad)}</h1>
          <div class="stars"><span class="s" aria-hidden="true">★</span><b class="num">${dec(p.ort)}</b><span class="muted num">${int(yt)} yazılı yorum</span></div>
          <div class="stats">
            <div class="stat"><small>Ortalama puan</small><b>${dec(p.ort)}</b></div>
            <div class="stat"><small>"Önerilen" ilk ${n}</small><b>${dec(p.onerilen_ort)}</b></div>
            <div class="stat"><small>1-2 yıldız payı</small><b class="${p.dusuk > 0 ? 'alert' : ''}">${pct(p.dusuk, 1)}</b></div>
            ${empty ? '' : `<div class="stat"><small>En sık şikâyet</small><b style="font-size:1.05rem">${esc(p.sik[0]?.ad || '')}</b></div>`}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn out" href="${esc(p.link)}" target="_blank" rel="noopener">Trendyol'da gör</a>
            <label class="btn ghost"><input type="checkbox" data-cmp="${esc(p.id)}" data-cat="${esc(c.id)}" ${on ? 'checked' : ''}>Karşılaştırmaya ekle</label>
          </div>
        </div>
      </div>
      </div>
      <div class="cgrid">
        ${empty ? `<p class="nodata">${esc(noLowText(p))}</p>` : `<section class="card"><h2>En çok neden şikâyet ediyorlar?</h2><p class="muted">1-2 yıldızlı yorumlarda geçme oranı. İnce çizgi kategori ortalaması.</p>${hbar(p.sik.slice(0, 7).map((t) => ({ ad: t.ad, v: t.v, avg: t.tum })), 'neg', 'avg')}</section>`}
        <section class="card"><h2>Neyi seviyorlar?</h2><p class="muted">"Önerilen" sıralamanın ilk ${n} yorumunda geçme oranı.</p>${hbar(p.sev.slice(0, 7).map((k) => ({ ad: k.ad, v: k.v })))}</section>
        <section class="card"><h2>Bu ürünün zayıf noktaları</h2><ul class="ul">${p.dikkat.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Rakip bir KOBİ için ders</h2><ul class="ul">${p.ders.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Yıldız dağılımı</h2>${hbar([5, 4, 3, 2, 1].map((s) => ({ ad: s + ' yıldız', v: p.yildiz[s - 1] / yt })))}</section>
        ${p.alinti.length ? `<section class="card"><h2>Müşterinin kendi sözleriyle</h2><div class="quotes">${p.alinti.map((a) => `<div class="q"><span>"${esc(a.metin)}"</span><small>${a.yildiz} yıldız · ${esc(c.temaMap[a.konu]?.ad || a.konu)}</small></div>`).join('')}</div></section>` : ''}
      </div>`;
  }

  async function compare(isStale) {
    let v = getCmp();
    if (v.length && !(regOf(v[0].cat)?.durum === 'hazir')) { v = []; }
    const c = v.length ? await loadCat(v[0].cat) : null;
    if (isStale()) return;
    setTitle('Karşılaştır');
    const P = c ? v.map((x) => c.urunler.find((u) => u.id === x.id)).filter(Boolean) : [];
    if (P.length < 2) {
      const lc = regOf(lastCat);
      const back = lc && lc.durum === 'hazir' ? `<a class="btn" href="#/kategori/${esc(lc.id)}">${esc(lc.ad)} sayfasına dön</a>` : '<a class="btn" href="#/">Kategorilere git</a>';
      app.innerHTML = `<div class="crumbs"><a href="#/">Ana sayfa</a> / Karşılaştır</div><div class="empty"><h1>Karşılaştır</h1><p class="muted">${P.length === 1 ? 'Şu an 1 ürün seçili. ' : ''}Karşılaştırmak için bir kategori sayfasındaki ürün kartlarından 2 ile 4 arasında ürün seç.</p>${back}</div>`;
      return;
    }
    rememberCat(c.id);
    const bestIdx = (vals, hi) => { const t = hi ? Math.max(...vals) : Math.min(...vals); return vals.map((x) => x === t && new Set(vals).size > 1); };
    const ortB = bestIdx(P.map((p) => p.ort), true), dusB = bestIdx(P.map((p) => p.dusuk), false), gapB = bestIdx(P.map((p) => Math.abs(Math.round((p.onerilen_ort - p.ort) * 100))), false);
    const row = (h, cells, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${h}</th>${cells.join('')}</tr>`;
    app.innerHTML = `
      <div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a> / Karşılaştır</div>
      <div class="chead"><h1>${P.length} ürünü karşılaştır</h1><p class="muted">Kalın yazılan değer gruptaki en iyi sonuç. En fazla ${MAXC} ürün, aynı kategoriden.</p></div></div>
      <p class="scroll-hint muted" id="scroll-hint" hidden>Tabloyu yana kaydır <span aria-hidden="true">→</span></p>
      <div class="ctable-wrap" id="ctable-wrap"><div class="ctable-box" id="ctable-box" tabindex="0" role="region" aria-label="Karşılaştırma tablosu"><table class="ctable">
        <tbody>
        ${row('<span class="sr-only">Ürün görseli</span>', P.map((p) => `<td><div class="ct-top"><a href="#/urun/${esc(c.id)}/${esc(p.id)}" class="ct-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" referrerpolicy="no-referrer"></a><button type="button" class="ct-rm" data-rm-col="${esc(p.id)}" aria-label="${esc(p.kisa)}: karşılaştırmadan çıkar">Çıkar <span aria-hidden="true">×</span></button></div></td>`))}
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
    const box = document.getElementById('ctable-box'), wrap = document.getElementById('ctable-wrap'), hint = document.getElementById('scroll-hint');
    const upd = () => {
      const over = box.scrollWidth > box.clientWidth + 1;
      hint.hidden = !over;
      wrap.classList.toggle('more', over && box.scrollLeft + box.clientWidth < box.scrollWidth - 2);
    };
    box.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  }

  async function method(isStale) {
    const data = await loadAll();
    if (isStale()) return;
    setTitle('Yöntem');
    const t = totals(data);
    const oran = t.onerilenN ? t.onerilen / t.onerilenN : 0, gercek = t.yazili ? t.dusukN / t.yazili : 0;
    app.innerHTML = `
      <div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / Yöntem</div>
        <div class="chead"><h1>Yöntem: Bu rakamlar nasıl hesaplandı?</h1></div></div>
      <article class="doc">
        ${kpiList(t, 'doc-kpis')}
        <section><h2>Veri nereden geliyor?</h2>
          <p>Rakamlar Trendyol'daki ürün yorumlarından geliyor. Yorumlar bir araştırma örneklemi olarak tek seferde toplandı. Yorum yazanların adları toplanmadı.</p></section>
        <section><h2>Her üründe hangi yorumlar okundu?</h2>
          <p>Her ürün için iki ayrı örnek okundu:</p>
          <ul class="ul"><li>Trendyol'un "Önerilen" sıralamasındaki ilk 100 yorum.</li><li>1 ya da 2 yıldız verilmiş en fazla 100 yorum. Üründe bu kadar düşük puanlı yorum yoksa daha azı.</li></ul></section>
        <section><h2>Neden iki ayrı örnek?</h2>
          <p>"Önerilen" sıralamada düşük puanlı yorum neredeyse hiç görünmüyor. Yalnızca ilk sayfayı okursan sorunları göremezsin.</p>
          ${t.tam && t.onerilenN ? `<p>Bu sitedeki ${t.kat} kategoride "Önerilen" sıralamada okunan ${int(t.onerilenN)} yorumun yalnızca ${int(t.onerilen)} tanesi 1-2 yıldızlı (oranı ${pct(oran, 1)}). Oysa tüm yazılı yorumlarda 1-2 yıldız oranı ${pct(gercek, 1)}. Şikâyet oranları bu yüzden ayrıca okunan ${int(t.ornek)} adet 1-2 yıldızlı yorumdan hesaplandı.</p>` : ''}</section>
        <section><h2>Şikâyet oranı ne demek?</h2>
          <p>Bir konunun şikâyet oranı, okunan 1-2 yıldızlı yorumların yüzde kaçında o konudan söz edildiğini gösterir.</p>
          <ul class="ul"><li>Konular her kategori için hazırlanan anahtar kelimelerle bulundu. Bu yüzden oranlar yaklaşıktır.</li><li>Bir yorum birden fazla konuya girebilir. Bu yüzden oranların toplamı 100 etmez.</li><li>Kategori ortalamasında her ürün, okunan 1-2 yıldızlı yorum sayısı kadar ağırlık taşır.</li></ul></section>
        <section><h2>"Yazılı yorumlarda 1-2 yıldız payı"</h2>
          <p>Bu oran örneklemden değil, ürünün Trendyol'daki tüm yıldız dağılımından hesaplandı.</p></section>
        <section><h2>"Dikkat" ve "ders" notları</h2>
          <p>Ürün sayfalarındaki "Bu ürünün zayıf noktaları" ve "Rakip bir KOBİ için ders" notları, olumsuz yorumlar okunarak yazılmış yorumlardır. Ölçüm değildir.</p></section>
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
    app.onclick = null;
    let h = parseHash();
    if (!h || !['', 'kategori', 'urun', 'karsilastir', 'ara', 'yontem'].includes(h[0]) || (h[0] === 'ara' && !h.slice(1).join('/').trim())) {
      history.replaceState(history.state, '', '#/');
      h = [''];
    }
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
      if (h[0] === 'kategori') await category(h[1], isStale);
      else if (h[0] === 'urun') await product(h[1], h[2], isStale);
      else if (h[0] === 'karsilastir') await compare(isStale);
      else if (h[0] === 'ara') await search(h.slice(1).join('/').trim(), isStale);
      else if (h[0] === 'yontem') await method(isStale);
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
    if (!opts.keep && curKey) scrollMap[curKey] = scrollY;
    routing = false;
    drawBar();
  }

  // ---- tema ----
  const themeBtn = document.getElementById('theme');
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  const syncTheme = () => {
    const d = isDark();
    themeBtn.setAttribute('aria-pressed', String(d));
    if (document.documentElement.dataset.theme) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = d ? '#0f171e' : '#ffffff'; });
  };
  themeBtn.addEventListener('click', () => {
    const root = document.documentElement;
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('rr_theme', root.dataset.theme); } catch {}
    syncTheme();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
  syncTheme();

  // İçeriğe geç bağlantısı: hash yönlendirmesini tetiklemeden ana içeriğe odaklan
  document.querySelector('.skip')?.addEventListener('click', (e) => { e.preventDefault(); app.focus(); });

  window.addEventListener('hashchange', () => route());
  route();
})();
