(() => {
  const app = document.getElementById('app');
  const cache = {};
  let REG = [];
  const pct = (v, d = 0) => '%' + (v * 100).toFixed(d).replace('.', ',');
  const int = (v) => Number(v).toLocaleString('tr-TR');
  const dec = (v) => Number(v).toFixed(2).replace('.', ',');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => s.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
  const starStr = (v) => { const f = Math.round(v); return '★'.repeat(f) + '☆'.repeat(5 - f); };

  const getJSON1 = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  const getJSON = (u) => getJSON1(u).catch(() => getJSON1(u.replace(/^data\//, '')));
  const loadCat = async (id) => (cache[id] ??= getJSON(`data/${id}.json`).then(enrich));

  function enrich(c) {
    const P = c.urunler;
    const w = (rows, k) => { const n = rows.reduce((a, p) => a + p.ornek_dusuk, 0); return n ? rows.reduce((a, p) => a + (p.sikayet[k] || 0) * p.ornek_dusuk, 0) / n : 0; };
    const big = P.filter((p) => p.segment !== 'KOBİ'), kobi = P.filter((p) => p.segment === 'KOBİ');
    c.tema = c.temalar.map((t) => ({ ...t, tum: w(P, t.id), buyuk: w(big, t.id), kobi: w(kobi, t.id) })).sort((a, b) => b.tum - a.tum);
    c.temaMap = Object.fromEntries(c.tema.map((t) => [t.id, t]));
    c.olk = c.olumlu_konular.map((k) => ({ ...k, tum: P.reduce((a, p) => a + (p.olumlu[k.id] || 0), 0) / P.length })).sort((a, b) => b.tum - a.tum);
    c.olkMap = Object.fromEntries(c.olk.map((k) => [k.id, k]));
    const yaz = P.reduce((a, p) => a + p.yazili, 0), dus = P.reduce((a, p) => a + p.yildiz[0] + p.yildiz[1], 0);
    c.top = { yazili: yaz, dusuk: dus / yaz, okunan: P.reduce((a, p) => a + 100 + p.ornek_dusuk, 0), onerilen: P.reduce((a, p) => a + p.onerilen_dusuk, 0) };
    P.forEach((p) => {
      p.dusuk = (p.yildiz[0] + p.yildiz[1]) / p.yazili;
      p.sik = Object.entries(p.sikayet).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ ...c.temaMap[k], v }));
      p.sev = Object.entries(p.olumlu).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ ...c.olkMap[k], v }));
    });
    return c;
  }

  // compare state
  const CK = 'kyr_cmp';
  const getCmp = () => { try { return JSON.parse(localStorage.getItem(CK)) || []; } catch { return []; } };
  const setCmp = (v) => { try { localStorage.setItem(CK, JSON.stringify(v)); } catch {} drawBar(); };
  const toggleCmp = (cat, id, on) => {
    let v = getCmp().filter((x) => x.cat === cat);
    v = on ? (v.some((x) => x.id === id) ? v : [...v, { cat, id }].slice(-4)) : v.filter((x) => x.id !== id);
    setCmp(v);
  };
  async function drawBar() {
    const bar = document.getElementById('cmpbar'), v = getCmp();
    if (!v.length || location.hash.startsWith('#/karsilastir')) { bar.hidden = true; return; }
    const c = await loadCat(v[0].cat);
    const items = document.getElementById('cmpbar-items');
    items.innerHTML = v.map((x) => { const p = c.urunler.find((u) => u.id === x.id); return p ? `<img src="${esc(p.gorsel)}" alt="${esc(p.kisa)}" title="${esc(p.kisa)}" referrerpolicy="no-referrer">` : ''; }).join('') + `<span class="muted" style="align-self:center">${v.length} ürün seçildi${v.length < 2 ? ', en az 2 seç' : ''}</span>`;
    document.getElementById('cmp-go').toggleAttribute('aria-disabled', v.length < 2);
    document.getElementById('cmp-go').style.opacity = v.length < 2 ? .5 : 1;
    bar.hidden = false;
  }
  document.getElementById('cmp-clear').addEventListener('click', () => { setCmp([]); route(); });
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-cmp]');
    if (t) { toggleCmp(t.dataset.cat, t.dataset.cmp, t.checked); if (location.hash.startsWith('#/karsilastir')) route(); }
  });

  // search
  const form = document.getElementById('search'), q = document.getElementById('q'), sug = document.getElementById('suggest');
  const match = (s) => {
    const n = norm(s); if (!n) return [];
    return REG.map((c) => {
      const terms = [c.ad, ...(c.esanlam || [])].map(norm);
      const score = terms.some((t) => t === n) ? 3 : terms.some((t) => t.startsWith(n) || n.startsWith(t)) ? 2 : terms.some((t) => t.includes(n) || n.includes(t)) ? 1 : 0;
      return { c, score };
    }).filter((x) => x.score).sort((a, b) => b.score - a.score || (a.c.durum === 'hazir' ? -1 : 1)).map((x) => x.c);
  };
  q.addEventListener('input', () => {
    const m = match(q.value).slice(0, 6);
    sug.innerHTML = m.map((c) => `<li><a href="#/kategori/${c.id}"><span>${esc(c.ad)}</span><small class="muted">${c.durum === 'hazir' ? int(c.urun) + ' ürün' : 'yakında'}</small></a></li>`).join('');
    sug.hidden = !m.length;
  });
  q.addEventListener('blur', () => setTimeout(() => { sug.hidden = true; }, 150));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sug.hidden = true;
    const m = match(q.value);
    location.hash = m.length === 1 || (m[0] && norm(m[0].ad) === norm(q.value)) ? `#/kategori/${m[0].id}` : `#/ara/${encodeURIComponent(q.value.trim())}`;
  });

  const hbar = (rows, cls = '', avgKey) => `<div class="hbars">${rows.map((r) => {
    const max = Math.max(...rows.map((x) => Math.max(x.v, avgKey ? x[avgKey] || 0 : 0)), 0.01);
    return `<div class="hb ${cls}"><span>${esc(r.ad)}</span><span class="tr"><i style="width:${(r.v / max) * 100}%"></i>${avgKey && r[avgKey] != null ? `<s style="left:${(r[avgKey] / max) * 100}%" title="Kategori ortalaması ${pct(r[avgKey])}"></s>` : ''}</span><span class="v">${pct(r.v)}</span></div>`;
  }).join('')}</div>`;

  // views
  function home() {
    document.title = 'KOBİ Yorum Radarı';
    app.innerHTML = `
      <section class="hero"><h1>Ne satmak istiyorsun?</h1>
      <p>Bir kategori ara. Rakip ürünlerin binlerce müşteri yorumundan çıkan en büyük şikâyetleri, müşterinin neyi sevdiğini ve bu pazara girerken neye dikkat etmen gerektiğini gör.</p></section>
      <h2>Kategoriler</h2>
      <div class="cats" style="padding-top:14px">${REG.map((c) => `
        <a class="cat ${c.durum === 'hazir' ? '' : 'off'}" href="#/kategori/${c.id}">
          <div class="cat-img">${c.gorsel ? `<img src="${esc(c.gorsel)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : `<span>${esc(c.ad[0])}</span>`}</div>
          <div class="cat-body"><small>${esc(c.ust)}</small><h3>${esc(c.ad)}</h3>
          ${c.durum === 'hazir' ? `<span class="tag">${int(c.urun)} ürün · ${int(c.yorum)} yorum</span>` : '<span class="tag grey">Yakında</span>'}</div>
        </a>`).join('')}</div>`;
  }

  function search(term) {
    const m = match(term);
    app.innerHTML = `<div class="crumbs"><a href="#/">Ana sayfa</a> / Arama</div>
      <div class="chead"><h1>"${esc(term)}" için sonuçlar</h1></div>
      ${m.length ? `<div class="cats">${m.map((c) => `<a class="cat ${c.durum === 'hazir' ? '' : 'off'}" href="#/kategori/${c.id}"><div class="cat-body"><small>${esc(c.ust)}</small><h3>${esc(c.ad)}</h3>${c.durum === 'hazir' ? '<span class="tag">Hazır</span>' : '<span class="tag grey">Yakında</span>'}</div></a>`).join('')}</div>`
      : `<div class="empty"><p>Bu kategori henüz analiz edilmedi. Analiz edilen kategoriler ana sayfada listeleniyor.</p><a class="btn" href="#/">Kategorilere dön</a></div>`}`;
  }

  async function category(id) {
    const r = REG.find((c) => c.id === id);
    if (!r || r.durum !== 'hazir') {
      app.innerHTML = `<div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(r ? r.ad : id)}</div><div class="empty"><h1>${esc(r ? r.ad : 'Kategori bulunamadı')}</h1><p class="muted">Bu kategorinin yorumları henüz toplanmadı.</p><a class="btn" href="#/">Kategorilere dön</a></div>`;
      return;
    }
    const c = await loadCat(id);
    document.title = c.ad + ' · KOBİ Yorum Radarı';
    const top4 = c.tema.slice(0, 4), max = top4[0].tum;
    const seg = c.tema.filter((t) => t.id !== 'gosterge').slice(0, 5);
    const sort = sessionSort[id] || 'yorum';
    app.innerHTML = `
      <div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(c.ust)} / ${esc(c.ad)}</div>
      <div class="chead"><h1>${esc(c.ad)}</h1>
        <p class="muted num">${c.urunler.length} ürün · ${int(c.top.yazili)} yazılı yorum · ${int(c.top.okunan)} yorum okundu · ${esc(c.kaynak)}, ${esc(c.toplama)}</p></div>
      <section class="band" aria-labelledby="band-t">
        <span class="band-title" id="band-t">Bu kategorinin en çok şikâyet edilen sorunları</span>
        <ol class="bang">${top4.map((t) => `<li><span class="t">${esc(t.unlem)}</span><span class="p">${pct(t.tum)}</span><span class="bar"><i style="width:${(t.tum / max) * 100}%"></i></span></li>`).join('')}</ol>
        <p class="band-note">Oran: 1-2 yıldızlı yorumların yüzde kaçında bu sorun geçiyor. Bir yorum birden fazla soruna girebilir.</p>
      </section>
      <div class="cgrid">
        <section class="card"><h2>Görünmeyen şikâyetler</h2>
          <div class="insight"><span class="big num">${pct(c.top.dusuk, 1)}</span><p>Bu kategorideki yazılı yorumların ${pct(c.top.dusuk, 1)} kadarı 1-2 yıldız.</p></div>
          <div class="insight"><span class="big ok num">${c.top.onerilen}</span><p>Ama alışverişçinin ilk gördüğü "Önerilen" sıralamanın ilk 100 yorumunda, ${c.urunler.length} üründe toplam ${c.top.onerilen} adet 1-2 yıldızlı yorum var. Sorunlar sayfanın derinlerinde.</p></div>
        </section>
        <section class="card"><h2>Müşteriler neyi seviyor?</h2><p class="muted">Olumlu yorumlarda en sık geçen konular.</p>${hbar(c.olk.slice(0, 6).map((k) => ({ ad: k.ad, v: k.tum })))}</section>
        <section class="card"><h2>Büyük marka mı, KOBİ mi?</h2><p class="muted">Aynı sorunun iki gruptaki oranı. Üstteki çubuk büyük markalar, alttaki KOBİ'ler.</p>
          <div class="hbars">${seg.map((t) => { const m = Math.max(...seg.map((x) => Math.max(x.buyuk, x.kobi))); return `<div class="hb"><span>${esc(t.ad)}</span><span style="display:grid;gap:3px"><span class="tr"><i style="width:${(t.buyuk / m) * 100}%;background:var(--muted)"></i></span><span class="tr"><i style="width:${(t.kobi / m) * 100}%;background:var(--alert)"></i></span></span><span class="v">${pct(t.buyuk)}<br>${pct(t.kobi)}</span></div>`; }).join('')}</div></section>
        <section class="card" style="grid-column:1/-1"><h2>Bu kategoriye girecek KOBİ için öneriler</h2><ol class="recs" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">${c.oneriler.map((o) => `<li><b>${esc(o.baslik)}</b><span>${esc(o.metin)}</span></li>`).join('')}</ol></section>
      </div>
      <div class="tools"><h2>Ürünler <span class="muted num" style="font-weight:400;font-size:1rem">(${c.urunler.length})</span></h2>
        <label class="muted">Sırala <select id="sort">
          <option value="yorum">En çok yorum</option><option value="puan">En yüksek puan</option><option value="dusuk">En az 1-2 yıldız</option><option value="cok">En çok 1-2 yıldız</option></select></label></div>
      <div class="pgrid" id="pgrid"></div>`;
    const sel = document.getElementById('sort'); sel.value = sort;
    const draw = () => {
      const f = { yorum: (a, b) => b.yazili - a.yazili, puan: (a, b) => b.ort - a.ort, dusuk: (a, b) => a.dusuk - b.dusuk, cok: (a, b) => b.dusuk - a.dusuk }[sel.value];
      const cm = getCmp();
      document.getElementById('pgrid').innerHTML = c.urunler.slice().sort(f).map((p) => card(c, p, cm)).join('');
    };
    sel.addEventListener('change', () => { sessionSort[id] = sel.value; draw(); });
    draw();
  }
  const sessionSort = {};
  const card = (c, p, cm) => `
    <article class="pc">
      <a class="pc-img" href="#/urun/${c.id}/${p.id}"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" loading="lazy" referrerpolicy="no-referrer"></a>
      <span class="pc-seg tag ${p.segment === 'KOBİ' ? '' : 'grey'}">${esc(p.segment)}</span>
      <label class="pc-cmp"><input type="checkbox" data-cmp="${p.id}" data-cat="${c.id}" ${cm.some((x) => x.id === p.id) ? 'checked' : ''}>Karşılaştır</label>
      <div class="pc-body">
        <a class="pc-name" href="#/urun/${c.id}/${p.id}"><b>${esc(p.marka)}</b> ${esc(p.ad.replace(p.marka, '').trim())}</a>
        <div class="stars"><span class="num">${dec(p.ort)}</span><span class="s" aria-hidden="true">${starStr(p.ort)}</span><span class="muted num">(${int(p.yazili)})</span></div>
        <div class="pc-low">1-2 yıldız: <b class="num">${pct(p.dusuk, 1)}</b></div>
        ${p.sik[0] ? `<span class="tag alert">En sık: ${esc(p.sik[0].ad)}</span>` : ''}
      </div>
    </article>`;

  async function product(cid, pid) {
    const c = await loadCat(cid), p = c.urunler.find((u) => u.id === pid);
    if (!p) { app.innerHTML = '<div class="empty"><p>Ürün bulunamadı.</p><a class="btn" href="#/">Ana sayfa</a></div>'; return; }
    document.title = p.kisa + ' · KOBİ Yorum Radarı';
    const on = getCmp().some((x) => x.id === p.id);
    const yt = p.yazili;
    app.innerHTML = `
      <div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${c.id}">${esc(c.ad)}</a> / ${esc(p.kisa)}</div>
      <div class="prod">
        <div class="prod-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" referrerpolicy="no-referrer"></div>
        <div class="prod-info">
          <span class="tag ${p.segment === 'KOBİ' ? '' : 'grey'}">${esc(p.segment)}</span>
          <h1>${esc(p.ad)}</h1>
          <div class="stars"><span class="num">${dec(p.ort)}</span><span class="s" aria-hidden="true">${starStr(p.ort)}</span><span class="muted num">${int(yt)} yazılı yorum</span></div>
          <div class="stats">
            <div class="stat"><small>Ortalama puan</small><b>${dec(p.ort)}</b></div>
            <div class="stat"><small>"Önerilen" ilk 100</small><b>${dec(p.onerilen_ort)}</b></div>
            <div class="stat"><small>1-2 yıldız payı</small><b class="alert">${pct(p.dusuk, 1)}</b></div>
            <div class="stat"><small>En sık şikâyet</small><b style="font-size:1.05rem">${esc(p.sik[0]?.ad || '-')}</b></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn out" href="${esc(p.link)}" target="_blank" rel="noopener">Trendyol'da gör</a>
            <label class="btn ghost" style="gap:8px"><input type="checkbox" data-cmp="${p.id}" data-cat="${c.id}" ${on ? 'checked' : ''}>Karşılaştırmaya ekle</label>
          </div>
        </div>
      </div>
      <div class="cgrid">
        <section class="card"><h2>En çok neden şikâyet ediyorlar?</h2><p class="muted">1-2 yıldızlı yorumlarda geçme oranı. İnce çizgi kategori ortalaması.</p>${hbar(p.sik.slice(0, 7).map((t) => ({ ad: t.ad, v: t.v, avg: t.tum })), 'neg', 'avg')}</section>
        <section class="card"><h2>Neyi seviyorlar?</h2><p class="muted">"Önerilen" sıralamanın ilk 100 yorumunda geçme oranı.</p>${hbar(p.sev.slice(0, 7).map((k) => ({ ad: k.ad, v: k.v })))}</section>
        <section class="card"><h2>Alırken dikkat edilmesi gerekenler</h2><ul class="ul">${p.dikkat.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Rakip bir KOBİ için ders</h2><ul class="ul">${p.ders.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Yıldız dağılımı</h2>${hbar([5, 4, 3, 2, 1].map((s) => ({ ad: s + ' yıldız', v: p.yildiz[s - 1] / yt })))}</section>
        <section class="card"><h2>Müşterinin kendi sözleriyle</h2><div class="quotes">${p.alinti.map((a) => `<div class="q"><span>"${esc(a.metin)}"</span><small>${'★'.repeat(a.yildiz)} · ${esc(a.konu)}</small></div>`).join('')}</div></section>
      </div>`;
  }

  async function compare() {
    const v = getCmp();
    if (v.length < 2) { app.innerHTML = '<div class="empty"><h1>Karşılaştır</h1><p class="muted">Karşılaştırmak için kategori sayfasındaki ürün kartlarından en az 2 ürün seç.</p><a class="btn" href="#/kategori/termos">Termos bardaklara git</a></div>'; return; }
    const c = await loadCat(v[0].cat);
    const P = v.map((x) => c.urunler.find((u) => u.id === x.id)).filter(Boolean);
    const best = (vals, hi) => { const t = hi ? Math.max(...vals) : Math.min(...vals), w = hi ? Math.min(...vals) : Math.max(...vals); return vals.map((x) => (x === t ? 'best' : x === w ? 'worst' : '')); };
    const ortC = best(P.map((p) => p.ort), true), dusC = best(P.map((p) => p.dusuk), false), gapC = best(P.map((p) => p.onerilen_ort - p.ort), false);
    const row = (h, cells) => `<tr><th scope="row">${h}</th>${cells.join('')}</tr>`;
    app.innerHTML = `
      <div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${c.id}">${esc(c.ad)}</a> / Karşılaştır</div>
      <div class="chead"><h1>${P.length} ürünü karşılaştır</h1><p class="muted">Yeşil hücre gruptaki en iyi, kırmızı hücre en kötü değer.</p></div>
      <div class="ctable-box"><table class="ctable">
        <tbody>
        ${row('', P.map((p) => `<td><a href="#/urun/${c.id}/${p.id}"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" referrerpolicy="no-referrer"></a></td>`))}
        ${row('Ürün', P.map((p) => `<td><b>${esc(p.marka)}</b><br>${esc(p.ad.replace(p.marka, '').trim())}</td>`))}
        ${row('Segment', P.map((p) => `<td>${esc(p.segment)}</td>`))}
        ${row('Ortalama puan', P.map((p, i) => `<td class="num ${ortC[i]}">${dec(p.ort)}</td>`))}
        ${row('1-2 yıldız payı', P.map((p, i) => `<td class="num ${dusC[i]}">${pct(p.dusuk, 1)}</td>`))}
        ${row('"Önerilen" ile gerçek arası fark', P.map((p, i) => `<td class="num ${gapC[i]}">+${dec(p.onerilen_ort - p.ort)} puan</td>`))}
        ${row('Yazılı yorum', P.map((p) => `<td class="num">${int(p.yazili)}</td>`))}
        ${row('En büyük 3 şikâyet', P.map((p) => `<td><ol>${p.sik.slice(0, 3).map((t) => `<li>${esc(t.ad)} <span class="muted num">${pct(t.v)}</span></li>`).join('')}</ol></td>`))}
        ${row('En çok sevilen 3 konu', P.map((p) => `<td><ol>${p.sev.slice(0, 3).map((k) => `<li>${esc(k.ad)} <span class="muted num">${pct(k.v)}</span></li>`).join('')}</ol></td>`))}
        ${row('', P.map((p) => `<td><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-cmp="${p.id}" data-cat="${c.id}" checked>Listede</label></td>`))}
        </tbody></table></div>`;
  }

  async function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
    try {
      if (h[0] === 'kategori') await category(h[1]);
      else if (h[0] === 'urun') await product(h[1], h[2]);
      else if (h[0] === 'karsilastir') await compare();
      else if (h[0] === 'ara') search(h.slice(1).join('/'));
      else home();
    } catch (e) {
      app.innerHTML = '<div class="empty"><p>Veri yüklenemedi. Sayfayı yenile.</p></div>';
      console.error(e);
    }
    window.scrollTo(0, 0);
    drawBar();
  }
  window.addEventListener('hashchange', route);
  getJSON('data/kategoriler.json').then((r) => { REG = r; route(); }).catch(() => { app.innerHTML = '<div class="empty"><p>Kategori listesi yüklenemedi.</p></div>'; });
})();
