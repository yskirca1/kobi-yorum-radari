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
  // Adresler. Konu görünümü: #/kategori/<id>/konu/<temaId> (şikâyet) ve /sevilen/<konuId> (olumlu);
  // ürün sayfası bir konuda: #/urun/<kategori>/<urunId>/konu/<temaId> ya da /sevilen/<konuId>
  const H = {
    cat: (cid, qs) => `#/kategori/${cid}${qs ? '?' + qs : ''}`,
    konu: (cid, kind, kid) => `#/kategori/${cid}/${kind}/${kid}`,
    urun: (cid, pid, kind, kid) => `#/urun/${cid}/${pid}${kind ? `/${kind}/${kid}` : ''}`,
  };
  // Tıklanabilir rakam: tek tip görünüm (noktalı alt çizgi ve ok, stil .go)
  const go = (href, inner, cls = '', label) => `<a class="go${cls ? ' ' + cls : ''}" href="${esc(href)}"${label ? ` aria-label="${esc(label)}"` : ''}>${inner}</a>`;
  // Yaklaşık yorum adedi = oran × okunan yorum. Tam sayıya yakınsa tam sayı, değilse tek ondalık (oranlar yuvarlandığı için)
  const approx = (x) => (Math.abs(x - Math.round(x)) < 0.05 ? int(Math.round(x)) : x.toFixed(1).replace('.', ','));
  const ready = () => REG.filter((c) => c.durum === 'hazir');
  const regOf = (id) => REG.find((c) => c.id === id);

  // ---- v21: düz Türkçe cevap cümleleri ve resimli oranlar için yardımcılar ----
  // Türkçe ek uyumu: sayıların ve kategori adlarının ekleri ("4'ünde", "2'si", "Filtre kahvede", "Telefon kılıfında")
  const VOW = 'aıoueiöü', HARD = 'çfhkpsşt';
  const lastVowel = (w) => { for (let i = w.length - 1; i >= 0; i--) if (VOW.includes(w[i])) return w[i]; return 'e'; };
  const harmI = (v) => ({ a: 'ı', 'ı': 'ı', o: 'u', u: 'u', e: 'i', i: 'i', 'ö': 'ü', 'ü': 'ü' }[v] || 'i');
  const isBack = (v) => 'aıou'.includes(v);
  // Sayının okunuşunun son kelimesi: 4 → dört, 10 → on, 25 → beş, 100 → yüz; ondalıklıda virgülden sonrası ("9,6" → altı)
  const UNITS = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'], TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  const numWord = (s) => {
    const m = /,(\d+)\s*$/.exec(String(s)), n = parseInt(m ? m[1] : String(s).replace(/\D/g, ''), 10) || 0;
    if (!n) return 'sıfır';
    if (n % 10) return UNITS[n % 10];
    if (n % 100) return TENS[Math.floor(n / 10) % 10];
    return n % 1000 ? 'yüz' : 'bin';
  };
  // 3. tekil iyelik ("4'ü", "2'si", "%59'u") ve iyelik + bulunma ("4'ünde", "%59'unda")
  const sfx = (s) => { const w = numWord(s); return "'" + (VOW.includes(w[w.length - 1]) ? 's' : '') + harmI(lastVowel(w)); };
  const sfxLoc = (s) => { const p = sfx(s); return p + (isBack(p[p.length - 1]) ? 'nda' : 'nde'); };
  // Kategori adının bulunma hâli: "Filtre kahve" → "Filtre kahvede", "Telefon kılıfı" → "Telefon kılıfında", "Termos bardak" → "Termos bardakta"
  const locName = (ad) => {
    const w = String(ad).trim(), words = w.split(/\s+/), last = words[words.length - 1].toLocaleLowerCase('tr'), e = last[last.length - 1], v = lastVowel(last);
    if (words.length > 1 && 'ıiuü'.includes(e)) return w + 'n' + (isBack(v) ? 'da' : 'de');
    if (VOW.includes(e)) return w + (isBack(v) ? 'da' : 'de');
    return w + (HARD.includes(e) ? 't' : 'd') + (isBack(v) ? 'a' : 'e');
  };
  // Bir oranın "N yorumdan yaklaşık M" karşılığı. Ekranda yazan yuvarlanmış yüzdeden hesaplanır (d: yüzdenin ondalık basamağı),
  // böylece cümle, resim ve rakam birbirini tutar. %9,5 ve üstü 10 üzerinden, altı 100 üzerinden.
  // Oran bir onluktan çok basit bir kesre yakınsa (%25 → 4'te 1, %33 → 3'te 1, %50 → yarısı, %67 → 3'te 2, %75 → 4'te 3) kesir söylenir;
  // yuvarlama yukarı abartmasın diye (%25 "10'da 3" olmaz). Resim her zaman tam payı gösterir (yarım balon dahil).
  const FRACS = [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
  const share = (x, d = 0) => {
    const P = Math.round(x * 100 * 10 ** d) / 10 ** d;
    if (P < 9.5) return { base: 100, n: Math.round(P), P };
    const n = Math.round(P / 10), dT = Math.abs(P - n * 10);
    const f = FRACS.map(([a, b]) => ({ a, b, dd: Math.abs(P - (100 * a) / b) })).sort((u, v) => u.dd - v.dd)[0];
    return { base: 10, n, P, frac: f.dd < dT ? f : null };
  };
  // "her 10 yorumdan yaklaşık 3'ünde" / "yaklaşık her 4 yorumdan 1'inde" / "yorumların yaklaşık yarısında" (loc); "…1'i" / "…yarısı" (nom)
  const perText = (s, loc, noun = 'yorum') => {
    if (s.frac) {
      const { a, b } = s.frac;
      if (a === 1 && b === 2) return `${noun}ların yaklaşık yarısı${loc ? 'nda' : ''}`;
      return `yaklaşık her ${b} ${noun}dan ${a}${loc ? sfxLoc(a) : sfx(a)}`;
    }
    if (s.n >= s.base) return loc ? 'neredeyse hepsinde' : 'neredeyse hepsi';
    if (!s.n) return loc ? `${noun}ların %1'inden azında` : `${noun}ların %1'inden azı`;
    return `her ${s.base} ${noun}dan yaklaşık ${s.n}${loc ? sfxLoc(s.n) : sfx(s.n)}`;
  };
  const shortName = (p) => { const k = String(p.kisa || p.ad); return fold(k).includes(fold(p.marka)) ? k.replace('Genel Markalar', 'Markasız') : `${markaAd(p.marka)} ${k}`; };
  // Resimli oran: 10 küçük yorum balonu (ya da 100 nokta), N tanesi dolu. Kırmızı şikâyet, yeşil müşterinin sevdiği. Metin karşılığı aria-label'da.
  const BUB = (x) => `M${x + 2.5} 0h6a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5h-3l-3 3v-3a2.5 2.5 0 0 1-2.5-2.5v-4a2.5 2.5 0 0 1 2.5-2.5z`;
  const DOT = (cx, cy) => `M${cx - 2.6} ${cy}a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0z`;
  // 10 balonda tam pay gösterilir: %25 → 2 dolu + 1 yarım balon (kısmi dolgu bir kırpma dikdörtgeniyle). 100 noktada nokta sayısı = yuvarlanmış yüzde.
  let pictoN = 0;
  const picto = (s, kind = 'neg', cls = '') => {
    const on = [], off = [], pTxt = String(s.P).replace('.', ',');
    let part = '';
    if (s.base === 10) {
      const t = Math.max(0, Math.min(100, s.P)) / 10, full = Math.floor(t + 1e-9), fr = Math.round((t - full) * 10) / 10;
      for (let i = 0; i < 10; i++) off.push(BUB(i * 15));
      for (let i = 0; i < full; i++) on.push(BUB(i * 15));
      if (fr > 0 && full < 10) { const id = 'pc' + (++pictoN); part = `<clipPath id="${id}"><rect x="${full * 15 - 1}" y="-1" width="${(11 * fr + 1).toFixed(2)}" height="15"/></clipPath><path class="on" clip-path="url(#${id})" d="${BUB(full * 15)}"/>`; }
    } else {
      const n = Math.max(0, Math.min(100, s.n));
      for (let i = 0; i < 100; i++) (i < n ? on : off).push(DOT((i % 10) * 7 + 3.5, Math.floor(i / 10) * 7 + 3.5));
    }
    const lab = `${perText(s, false).replace(/^./, (ch) => ch.toLocaleUpperCase('tr'))} (%${pTxt})`;
    const vb = s.base === 10 ? '-0.75 -0.75 147.5 13.5' : '0 0 70 70';
    return `<svg class="picto p${s.base} ${kind}${cls ? ' ' + cls : ''}" viewBox="${vb}" role="img" aria-label="${esc(lab)}"><path class="off" d="${off.join('')}"/><path class="on" d="${on.join('')}"/>${part}</svg>`;
  };
  // İki ya da daha çok oranı yan yana kıyaslayan düz çubuklar (0-100 ölçeği, abartma yok). Resimler farklı tabanda olabileceği için kıyasta bunlar kullanılır.
  const cmpBars = (rows, kind = 'neg') => `<div class="cbars">${rows.map((r) => `<div class="cbar"><span class="cb-l">${r.label}</span><span class="cb-tr" aria-hidden="true"><i class="${kind}" style="width:${Math.min(100, r.v * 100)}%"></i></span>${r.href ? go(r.href, pct(r.v, r.d || 0), 'cb-v ' + kind, `${r.label}: ${pct(r.v, r.d || 0)}`) : `<b class="cb-v num ${kind}">${pct(r.v, r.d || 0)}</b>`}</div>`).join('')}</div>`;
  // Tekrarlanan fikirler için çizgi simgeler (24 px, currentColor): şikâyet, sevilen, öneri, ürün, kanıt (müşterinin sözü), kimde, kontrol
  const ICONS = {
    sikayet: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M12 7.5v4"/><path d="M12 14.4v.1"/>',
    sevilen: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    oneri: '<path d="M9.5 18h5"/><path d="M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.1v.1h5v-.1c0-.8.4-1.5 1.1-2.1A6 6 0 0 0 12 3z"/>',
    urun: '<path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="m4 7 8 4 8-4"/><path d="M12 11v10"/>',
    kanit: '<path d="M6 7h4v4c0 3-1.4 5-4 6"/><path d="M14 7h4v4c0 3-1.4 5-4 6"/>',
    kimde: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.1a3.2 3.2 0 0 1 0 5.8"/><path d="M17.2 13.9a5.5 5.5 0 0 1 3.3 5.6"/>',
    kontrol: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    ok: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  };
  const icon = (k, cls = '') => `<svg class="ic ic-${k}${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[k]}</svg>`;

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
      // Alıntının konusu: yeni kategorilerde konu kimliği, 5 eski kategoride konu adı ya da "Olumlu: …" etiketi.
      // Olumlu etiket yalnızca bir olumlu konunun kimliği ya da adıyla birebir aynıysa (aksansız) o konuya bağlanır; değilse hiçbir konuya bağlanmaz.
      p.alinti.forEach((a) => {
        const k = String(a.konu || ''), m = /^Olumlu:\s*(.+)$/.exec(k);
        if (m) {
          const f = fold(m[1]), o = c.olumlu_konular.find((x) => fold(x.id) === f || fold(x.ad) === f);
          Object.assign(a, { pos: true, kid: o ? o.id : null, lab: o ? 'Olumlu: ' + o.ad : k });
        } else {
          const t = c.temaMap[k] || c.temalar.find((x) => x.ad === k);
          Object.assign(a, { pos: false, kid: t ? t.id : null, lab: t ? t.ad : k });
        }
      });
    });
    return c;
  }
  // Bir konuya bağlı alıntılar (kind: 'konu' şikâyet, 'sevilen' olumlu); başka konuya etiketli alıntı asla gösterilmez
  const quotesOf = (p, kind, kid) => p.alinti.filter((a) => a.kid === kid && a.pos === (kind === 'sevilen'));
  const topicOf = (c, kind, kid) => (kind === 'konu' ? c.temaMap[kid] : kind === 'sevilen' ? c.olkMap[kid] : null) || null;

  // ---- v21: sayfanın başındaki cevap cümleleri. Yalnızca sayfada zaten gösterilen rakamlardan, sabit kalıplarla kurulur.
  // form: hangi kalıbın (ya da yedek kalıbın) kullanıldığı; öğede data-form olarak durur, kontrol betikleri bunu okur.
  // Paydalar: şikâyet oranı okunan 1-2 yıldızlı yorumların payıdır ("1-2 yıldızlı her 10 yorumdan"), 1-2 yıldız payı bütün yazılı yorumların payıdır.
  const MIN_N = 30; // grup grup ya da ürün ürün kıyas için en az okunan 1-2 yıldızlı yorum (rakip kartındaki eşikle aynı)
  const lowN = (R) => R.reduce((a, p) => a + p.ornek_dusuk, 0);
  const segInfo = (c) => {
    const P = c.urunler, big = P.filter((p) => !isKobi(p)), kobi = P.filter(isKobi);
    return { iki: big.length > 0 && kobi.length > 0, nBig: lowN(big), nKobi: lowN(kobi), only: kobi.length ? 'KOBİ' : 'büyük marka' };
  };
  // Bir konunun en sık geçtiği ürünler: yalnızca en az MIN_N yorumu okunan ürünler (az yorumlu üründe tek tük yorum oranı şişirir)
  const topProducts = (c, kind, kid, k = 3) => c.urunler
    .map((p) => ({ p, v: (kind === 'konu' ? p.sikayet[kid] : p.olumlu[kid]) || 0, n: kind === 'konu' ? p.ornek_dusuk : onerN(p) }))
    .filter((x) => x.v > 0 && x.n >= MIN_N).sort((a, b) => b.v - a.v || b.n - a.n).slice(0, k);
  const tNeg = (s) => `<span class="t-neg">${esc(s)}</span>`;
  function catAnswer(c) {
    const t = c.tema[0], L = esc(locName(c.ad));
    if (!c.top.ornek) return { form: 'okunmadi', html: `${L} 1-2 yıldızlı yorum okunmadı; şikâyetler hesaplanamadı.` };
    if (!t || !(t.tum > 0)) return { form: 'sikayet-yok', html: `${L} okunan 1-2 yıldızlı yorumlarda sözlükteki şikâyetlerin hiçbiri geçmiyor.` };
    const s = share(t.tum);
    return { form: 'standart', s, t, html: `${L} 1-2 yıldızlı ${perText(s, true)} aynı şikâyet var: ${tNeg(t.unlem.replace(/!$/, ''))}.` };
  }
  // "Kimde var?" adımı: satıcı tipine göre 1-2 yıldız payı ve iki grup arasında en büyük farkın olduğu şikâyet
  function segAnswer(c) {
    const S = segInfo(c);
    if (!S.iki) {
      const t = c.tema[0], top = t && t.tum > 0 ? topProducts(c, 'konu', t.id, 1)[0] : null;
      return { form: 'tek-grup', top, html: `Örneklemdeki ${c.urunler.length} ürünün hepsi ${S.only} ürünü.${top ? ` 1 numaralı şikâyet en çok ${esc(shortName(top.p))} ürününde: 1-2 yıldızlı yorumlarının ${pct(top.v)}${sfxLoc(pct(top.v))}.` : ''}` };
    }
    const sl = segLow(c), b1 = pct(sl.buyuk, 1), k1 = pct(sl.kobi, 1), dd = Math.round(sl.buyuk * 1000) - Math.round(sl.kobi * 1000);
    const yildiz = Math.abs(dd) < 10 ? `1-2 yıldız payı iki grupta yakın: büyük markada ${b1}, KOBİ'de ${k1}.`
      : `${dd > 0 ? 'KOBİ' : 'Büyük marka'} ürünleri daha az 1-2 yıldız alıyor: büyük markada ${b1}, KOBİ'de ${k1}.`;
    if (S.nBig < MIN_N || S.nKobi < MIN_N) {
      return { form: 'iki-grup-az-yorum', html: `${yildiz} ${S.nBig < MIN_N ? 'Büyük marka' : 'KOBİ'} ürünlerinde yalnızca ${int(Math.min(S.nBig, S.nKobi))} adet 1-2 yıldızlı yorum okundu; şikâyetler grup grup karşılaştırılmadı.` };
    }
    const g = c.tema.filter((t) => t.tum > 0).map((t) => ({ t, d: Math.round(t.buyuk * 100) - Math.round(t.kobi * 100) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
    if (!g || Math.abs(g.d) < 5) return { form: 'iki-grup-fark-yok', html: `${yildiz} Şikâyetlerin hiçbirinde iki grup arasında 5 puandan büyük fark yok.` };
    return { form: 'iki-grup', gap: g.t, html: `${yildiz} En büyük fark ${tNeg(g.t.ad)} şikâyetinde: büyük markada ${pct(g.t.buyuk)}, KOBİ'de ${pct(g.t.kobi)}.` };
  }
  function topicAnswer(c, kind, t) {
    const neg = kind === 'konu', S = segInfo(c);
    if (!(t.tum > 0)) return { form: 'gecmiyor', html: neg ? 'Bu şikâyet okunan 1-2 yıldızlı yorumlarda geçmiyor.' : 'Bu konu okunan yorumlarda geçmiyor.' };
    const top = topProducts(c, kind, t.id, 1)[0];
    const most = top ? ` En sık ${esc(shortName(top.p))} ürününde (${pct(top.v)}).` : '';
    if (!neg) return { form: top ? 'sevilen' : 'sevilen-urun-yok', html: `Trendyol'un ilk gösterdiği yorumlarda ürün başına ortalama ${perText(share(t.tum), true)} geçiyor.${most}` };
    const nOn = c.urunler.filter((p) => (p.sikayet[t.id] || 0) > 0 && p.ornek_dusuk > 0).length;
    if (S.iki && S.nBig >= MIN_N && S.nKobi >= MIN_N) {
      const b = Math.round(t.buyuk * 100), k = Math.round(t.kobi * 100), d = b - k, hi = Math.max(b, k), lo = Math.min(b, k);
      const nums = `büyük markada ${pct(t.buyuk)}, KOBİ'de ${pct(t.kobi)}`;
      const head = Math.abs(d) < 5 ? `Büyük marka ve KOBİ ürünlerinde benzer sıklıkta: ${nums}.`
        : `Bu şikâyet ${d > 0 ? 'büyük marka' : 'KOBİ'} ürünlerinde ${hi >= 3 * lo && Math.abs(d) >= 10 ? 'çok daha' : 'daha'} sık: ${nums}.`;
      return { form: Math.abs(d) < 5 ? 'iki-grup-benzer' : 'iki-grup', segOk: true, html: head + most };
    }
    const spread = `${c.urunler.length} ürünün ${nOn}${sfxLoc(nOn)} geçiyor.`;
    if (S.iki) return { form: 'iki-grup-az-yorum', html: `${spread}${most} ${S.nBig < MIN_N ? 'Büyük marka' : 'KOBİ'} ürünlerinde yalnızca ${int(Math.min(S.nBig, S.nKobi))} adet 1-2 yıldızlı yorum okundu; gruplar karşılaştırılmadı.` };
    return { form: 'tek-grup', html: spread + most };
  }
  // Ürün sayfasının hükmü: en belirgin zayıf noktası (rakip kartındaki "açık verdiği konu"nun ilki), kategori oranıyla; satıcı tipi; 1-2 yıldız payı sözle
  function prodVerdict(c, p) {
    const seg = isKobi(p) ? 'KOBİ ürünü' : 'Büyük marka ürünü', yP = pct(p.dusuk, 1);
    const yTxt = p.yildiz[0] + p.yildiz[1] === 0 ? 'Yazılı yorumlarında 1-2 yıldız yok.'
      : `Yazılı yorumlarının ${yP}${sfx(yP)} 1-2 yıldız (${perText(share(p.dusuk, 1), false)}); kategoride ${pct(c.top.dusuk, 1)}.`;
    const tail = ` ${seg}. ${yTxt}`;
    if (noLow(p)) return { form: 'ornek-yok', big: esc(noLowText(p)), sub: tail.trim() };
    const g = gaps(c, p), f = p.sik[0];
    if (g && g.worse.length) {
      const x = g.worse[0];
      return { form: 'zayif-nokta', t: x.t, v: x.v, a: x.a, big: `Zayıf noktası: ${tNeg(x.t.ad)}.`, sub: `1-2 yıldızlı yorumlarının ${pct(x.v)}${sfxLoc(pct(x.v))} geçiyor; kategoride ${pct(x.a)}.${tail}` };
    }
    if (!f) return { form: 'sikayet-yok', big: 'Okunan 1-2 yıldızlı yorumlarında sözlükteki şikâyetlerin hiçbiri geçmiyor.', sub: tail.trim() };
    if (g) return { form: 'belirgin-fark-yok', t: f, v: f.v, a: f.tum, big: `En sık şikâyeti: ${tNeg(f.ad)}.`, sub: `1-2 yıldızlı yorumlarının ${pct(f.v)}${sfxLoc(pct(f.v))} geçiyor; kategoride ${pct(f.tum)}. Hiçbir konuda kategoriden belirgin farkı yok.${tail}` };
    return { form: 'az-yorum', t: f, v: f.v, a: f.tum, big: `En sık şikâyeti: ${tNeg(f.ad)}.`, sub: `Okunan ${int(p.ornek_dusuk)} adet 1-2 yıldızlı yorumunun ${pct(f.v)}${sfxLoc(pct(f.v))} geçiyor; kategoride ${pct(f.tum)}. Yorum az olduğu için konu konu kategoriyle karşılaştırılmadı.${tail}` };
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
    yaklasik: ['yaklaşık yorum', 'Ürünün oranı çarpı okunan yorum sayısı. Bu konunun kaç yorumda geçtiğini yaklaşık gösterir. Oranlar yuvarlandığı için küsuratlı çıkabilir.', 'oran'],
    sevilen: ['olumlu konu oranı', 'Trendyol\'un "Önerilen" sıralamasında okunan yorumların yüzde kaçında bu konunun geçtiği. Kategori oranı, ürünlerin oranlarının basit ortalamasıdır.', 'oran'],
    alinti: ['örnek yorum', 'Her ürün için okunan yorumlardan 3-4 tanesi kelimesi kelimesine saklandı. Tarihleri yok. Yorumların tamamı ürünün Trendyol sayfasında.', 'alinti'],
  };
  let tipN = 0;
  const tip = (k, inline) => {
    const [term, text, a] = TIPS[k], id = 'tip-' + (++tipN);
    return `<span class="tipw${inline ? ' inl' : ''}"><button type="button" class="tip" aria-expanded="false" aria-controls="${id}" aria-label="Ne demek: ${esc(term)}"><span aria-hidden="true">?</span></button>`
      + `<span class="tip-box" id="${id}" hidden>${esc(text)} <a href="#/yontem/${a}">Yöntem sayfasında ayrıntı</a></span></span>`;
  };
  // Sitenin renk dili tek yerde anlatılır (ana sayfa ve Yöntem): kırmızı şikâyet, yeşil müşterinin sevdiği, lacivert tıklanır / sonraki adım
  const grammar = () => `<p class="grammar"><span class="sr-only">Renklerin anlamı: </span><span class="gm gm-neg">${icon('sikayet')}<span><b>Kırmızı</b> şikâyet</span></span><span class="gm gm-like">${icon('sevilen')}<span><b>Yeşil</b> müşterinin sevdiği</span></span><span class="gm gm-act">${icon('ok')}<span><b>Lacivert</b> tıklanır: rakamın hangi yorumlardan geldiğini gösterir</span></span></p>`;
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

  // Görsel yüklenemezse (tek ortak yol): tarayıcının kırık simgesi yerine aynı kutuda nötr ürün simgesi; kutunun ölçüsü CSS'te sabit, sayfa oynamaz.
  // Süs görseli (alt="") yer tutucusu da gizli kalır; adı olan görselde (ürün sayfası) ad ekran okuyucuya söylenir.
  document.addEventListener('error', (e) => {
    const i = e.target;
    if (!(i instanceof HTMLImageElement) || i.dataset.failed) return;
    i.dataset.failed = '1';
    const ph = document.createElement('span');
    ph.className = 'img-ph';
    if (i.alt) { ph.setAttribute('role', 'img'); ph.setAttribute('aria-label', i.alt + ' (görsel yüklenemedi)'); } else ph.setAttribute('aria-hidden', 'true');
    ph.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS.urun}</svg>`;
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
  const konuHref = (c, t) => H.konu(c.id, 'konu', t.id);
  // Ürün ve şikâyet dizini kategori dosyalarına bağlı: kutuya odaklanınca hepsi istenir, geldikçe öneriler yenilenir.
  // v21: arama kutusu iki yerde (üst çubuk ve ana sayfanın kahraman alanı); aynı davranış makeSearch ile her kutuya bağlanır.
  let warm = null;
  const searchBoxes = new Set();
  const refreshSug = () => searchBoxes.forEach((b) => b.refresh());
  const warmIndex = () => { if (warm || !REG.length) return; warm = Promise.all(ready().map((c) => loadCat(c.id).then(refreshSug).catch(() => null))).then(() => { warm = null; refreshSug(); }); };
  // Arama terimi nereye gider: kategori adı ya da eş anlamlısıyla birebir aynıysa kategoriye; tek kategori eşleşip ürün/şikâyet sonucu yoksa yine kategoriye; yoksa sonuç sayfası
  const searchTarget = (term) => {
    const R = searchAll(term), m = R.cats, f = fold(term);
    const exact = m.find((c) => [c.ad, ...(c.esanlam || [])].some((t) => fold(t) === f));
    const one = exact || (m.length === 1 && !R.nProd && !R.nTopic ? m[0] : null);
    return one && one.durum === 'hazir' ? `#/kategori/${one.id}` : `#/ara/${encodeURIComponent(term)}`;
  };
  function makeSearch(form, q, sug, pre) {
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
    const opt = (href, main, sub) => `<li role="option" id="${pre}sg-${n++}" aria-selected="false" data-href="${esc(href)}"><a href="${esc(href)}" tabindex="-1"><span>${main}</span><small class="muted">${sub}</small></a></li>`;
    const grp = (key, title, items) => (items.length ? `<li role="group" aria-labelledby="${pre}sgh-${key}" class="sg-grp"><div class="sg-h" id="${pre}sgh-${key}">${title}</div><ul role="presentation">${items.join('')}</ul></li>` : '');
    const cats = R.cats.slice(0, SG_MAX).map((c) => (c.durum === 'hazir' ? opt(`#/kategori/${c.id}`, esc(c.ad), `${int(c.urun)} ürün`)
      : `<li role="option" id="${pre}sg-${n++}" aria-disabled="true" class="off"><span>${esc(c.ad)}</span><small class="muted">Yakında</small></li>`));
    const prods = R.prods.slice(0, SG_MAX).map(({ c, p }) => opt(`#/urun/${c.id}/${p.id}`, esc(prodName(p)), esc(c.ad)));
    const topics = R.topics.slice(0, SG_MAX).map(({ c, t }) => opt(konuHref(c, t), esc(t.ad), `${esc(c.ad)} · şikâyet oranı ${pct(t.tum)}`));
    const more = R.cats.length > SG_MAX || R.nProd > SG_MAX || R.nTopic > SG_MAX || (R.nProd + R.nTopic && R.cats.length + R.nProd + R.nTopic > 1);
    const any = cats.length + prods.length + topics.length;
    sug.innerHTML = grp('k', 'Kategoriler', cats) + grp('u', 'Ürünler ve markalar', prods) + grp('s', 'Şikâyet konuları', topics)
      + (any && more ? `<li role="option" id="${pre}sg-${n++}" aria-selected="false" class="sg-all" data-href="#/ara/${esc(encodeURIComponent(term))}"><a href="#/ara/${esc(encodeURIComponent(term))}" tabindex="-1"><span>"${esc(term)}" için tüm sonuçlar</span><span aria-hidden="true">→</span></a></li>` : '')
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
    location.hash = searchTarget(term);
    q.blur();
  });
  const box = { q, refresh: () => { if (!q.isConnected) { searchBoxes.delete(box); return; } if (document.activeElement === q && q.value.trim()) drawSug(true); } };
  searchBoxes.add(box);
  }
  makeSearch(document.getElementById('search'), document.getElementById('q'), document.getElementById('suggest'), '');

  // Yatay çubuklar. Satırda href varsa satırın tamamı bağlantıdır (ad noktalı alt çizgili, değerin yanında ok); cur: vurgulanan satır
  // fold (telefonda uzun liste): ilk fold.n satır görünür, kalanı hidden="until-found" kutuda ve altında "… (N)" düğmesi
  const hbar = (rows, cls = '', avgKey, fold) => {
    const max = Math.max(...rows.map((x) => Math.max(x.v, avgKey ? x[avgKey] || 0 : 0)), 0.01);
    const all = rows.map((r) => {
    const inner = `<span class="hb-t">${esc(r.ad)}</span><span class="tr"><i style="width:${(r.v / max) * 100}%"></i>${avgKey && r[avgKey] != null ? `<s style="left:${(r[avgKey] / max) * 100}%" title="Kategori ortalaması ${pct(r[avgKey])}"></s>` : ''}</span><span class="v">${pct(r.v)}</span>`;
    return r.href ? `<a class="hb go-row ${cls}${r.cur ? ' cur' : ''}" href="${esc(r.href)}"${r.cur ? ' aria-current="true"' : ''}>${inner}</a>` : `<div class="hb ${cls}">${inner}</div>`;
    });
    if (!fold || rows.length <= fold.n) return `<div class="hbars">${all.join('')}</div>`;
    return `<div class="hbars">${all.slice(0, fold.n).join('')}<div class="more-rest" id="${fold.id}" hidden="until-found">${all.slice(fold.n).join('')}</div></div>${moreBtn(fold.id, fold.btn, fold.label, rows.length)}`;
  };

  // ---- görünümler ----
  // Kategori kartı (ana sayfa ve arama ortak). Hazır olmayan kategori tıklanamaz, soluk kart olarak görünür.
  // v19: kart bir <article>; kategori bağlantısı başlıkta ve kartın tamamını kaplar, "En sık şikâyet" kutusu ayrı bağlantı (konu görünümü)
  // v21: kart kategorinin 1 numaralı şikâyetiyle açılır (başlık gibi büyük), yanında 10 balonluk resim ve şikâyet oranı.
  // Kartın tamamı kategoriye gider; şikâyet oranı rakamı ayrı bağlantı (konu görünümü, kanıt).
  const catCard = (c, d) => c.durum !== 'hazir' ? soonCard(c) : `
          <article class="cat" data-cat="${esc(c.id)}">
            <div class="cat-head"><div class="cat-img">${c.gorsel ? `<img src="${esc(c.gorsel)}" alt="" width="96" height="128" referrerpolicy="no-referrer" loading="lazy" decoding="async">` : ''}</div>
              <div class="cat-name"><small>${esc(c.ust)}</small><h3><a class="cat-a" href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a></h3></div></div>
            ${catTop(d)}
          </article>`;
  // Kategori verisi gelmeden yeri ayrılmış boş blok; veri gelince doldurulur (yükseklik CSS'te sabit, sayfa zıplamaz)
  const catTop = (d) => {
    if (d === undefined) return '<div class="cat-top-w wait" aria-hidden="true"><span class="cat-k">&nbsp;</span><span class="cat-h">&nbsp;</span><span class="cat-fig">&nbsp;</span></div>';
    const t = d && d.tema[0];
    if (!t || !(t.tum > 0)) return '<div class="cat-top-w"></div>';
    const s = share(t.tum);
    return `<div class="cat-top-w"><span class="cat-k">${icon('sikayet')}En sık şikâyet</span><p class="cat-h">${esc(t.unlem.replace(/!$/, ''))}</p>
      <span class="cat-fig">${picto(s, 'neg', 'sm')}<span class="cat-fig-t">${go(H.konu(d.id, 'konu', t.id), pct(t.tum), 'cat-top neg', `${t.ad}: şikâyet oranı ${pct(t.tum)}. Hangi ürünlerden geldiğini gör`)} <span class="muted">1-2 yıldızlı yorumlarda</span></span></span></div>`;
  };
  const soonCard = (c) => `<div class="soon-card" aria-label="${esc(c.ad)}, yakında"><small>${esc(c.ust)}</small><b>${esc(c.ad)}</b><span class="tag">Yakında</span></div>`;

  const loadAll = async () => { const r = ready(); return Object.fromEntries((await Promise.all(r.map((c) => loadCat(c.id).catch(() => null)))).map((d, i) => [r[i].id, d])); };
  const totals = (data) => {
    const r = ready(), D = Object.values(data).filter(Boolean);
    const s = (f) => D.reduce((a, d) => a + f(d), 0);
    return { kat: r.length, urun: r.reduce((a, c) => a + (c.urun || 0), 0), yazili: s((d) => d.top.yazili), okunan: r.reduce((a, c) => a + (c.yorum || 0), 0),
      dusukN: s((d) => d.top.dusukN), onerilenN: s((d) => d.top.onerilenN), onerilen: s((d) => d.top.onerilen), ornek: s((d) => d.top.ornek), tam: D.length === r.length };
  };
  // yazili null ise (kategori dosyaları henüz gelmedi) yeri ayrılmış "…" gösterilir, sonra doldurulur
  // links: ana sayfada rakamlar Yöntem'deki ilgili bölüme gider (Yöntem sayfasının kendisinde bağlantı yok)
  const kpiList = (t, cls = 'kpis', links) => {
    const f = (v, sec, id) => (links ? `<a class="go" href="#/yontem${sec ? '/' + sec : ''}"${id ? ` id="${id}"` : ''}>${v}</a>` : `<span${id ? ` id="${id}"` : ''}>${v}</span>`);
    return `<dl class="${cls}">
          <div><dt>Analiz edilen kategori</dt><dd class="num">${f(t.kat, 'veri')}</dd></div>
          <div><dt>İncelenen ürün</dt><dd class="num">${f(int(t.urun), 'veri')}</dd></div>
          <div><dt>Yazılı yorum</dt><dd class="num">${f(t.yazili == null ? '<span aria-hidden="true">…</span><span class="sr-only">yükleniyor</span>' : int(t.yazili), 'yildiz', 'kpi-yazili')}</dd></div>
          <div><dt>Tek tek okunan yorum</dt><dd class="num">${f(int(t.okunan), 'iki-ornek')}</dd></div>
        </dl>`;
  };
  // Jüri ve ilk ziyaret için örnek kategori: alıntıları en çok şikâyeti kapsayan kategori (DEMO.md)
  const DEMO_CAT = 'filtre-kahve';

  let homeAlan = '';
  // Ana sayfa yalnızca kategoriler.json ile hemen çizilir; kategori dosyalarına bağlı rakamlar geldikçe yerine yazılır.
  async function home(isStale) {
    setTitle('');
    const r0 = ready();
    const data = {};
    const alanlar = [...new Set(r0.map((c) => c.ust))].sort((a, b) => a.localeCompare(b, 'tr'));
    if (homeAlan && !alanlar.includes(homeAlan)) homeAlan = '';
    const t0 = { kat: r0.length, urun: r0.reduce((a, c) => a + (c.urun || 0), 0), okunan: r0.reduce((a, c) => a + (c.yorum || 0), 0), yazili: null };
    const demo = regOf(DEMO_CAT)?.durum === 'hazir' ? regOf(DEMO_CAT) : r0[0];
    // Örnek aramalar: bir kategori, bir marka, bir şikâyet. Bağlantı, Enter'ın götüreceği yerle aynı (searchTarget).
    const EX = ['termos', 'Karaca', 'sızdırıyor', 'tüylenme'];
    const exHref = (t) => { const f = fold(t), c = REG.find((x) => x.durum === 'hazir' && [x.ad, ...(x.esanlam || [])].some((y) => fold(y) === f)); return c ? `#/kategori/${c.id}` : `#/ara/${encodeURIComponent(t)}`; };
    app.innerHTML = `
      <section class="band hero-band">
        <div class="hero">
          <h1>Satmak istediğin üründe müşteri neden memnun değil?</h1>
          <p class="lead">Rakip ürünlerin binlerce yorumunu tek tek okuduk. Ürününü ara: en sık şikâyeti, müşterinin neyi sevdiğini ve ne yapman gerektiğini ilk ekranda gör.</p>
          <form class="search hsearch" id="hsearch" role="search" autocomplete="off">
            <input id="hq" type="search" placeholder="Ne satmak istiyorsun? Örneğin termos" aria-label="Kategori, ürün, marka ya da şikâyet ara" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hsuggest">
            <button type="submit">Ara</button>
            <ul class="suggest" id="hsuggest" role="listbox" aria-label="Arama önerileri" hidden></ul>
          </form>
          <p class="ex"><span>Örnek aramalar:</span> ${EX.map((t) => `<a class="ex-chip" href="${esc(exHref(t))}">${esc(t)}</a>`).join('')}</p>
          ${demo ? `<p class="hero-cta"><a class="hero-demo" href="#/kategori/${esc(demo.id)}">Örnekle başla: ${esc(demo.ad)} ${icon('ok')}</a></p>` : ''}
        </div>
        ${kpiList(t0, 'kpis', true)}
      </section>
      ${grammar()}
      <div class="alan-f" role="group" aria-label="Alana göre filtrele"><span class="muted">Alan:</span>
        ${['', ...alanlar].map((a) => `<button type="button" class="chip${a === homeAlan ? ' on' : ''}" data-alan="${esc(a)}" aria-pressed="${a === homeAlan}">${a ? esc(a) : 'Tümü'}</button>`).join('')}</div>
      <div id="home-list"></div>
      <section class="reads" id="reads" aria-labelledby="reads-t"></section>`;
    makeSearch(document.getElementById('hsearch'), document.getElementById('hq'), document.getElementById('hsuggest'), 'h');
    const draw = () => {
      const sec = (c) => !homeAlan || c.ust === homeAlan;
      const r = r0.filter(sec), soon = REG.filter((c) => c.durum !== 'hazir' && sec(c));
      document.getElementById('home-list').innerHTML = `
        <section class="sec"><div class="sec-top"><h2>Kategoriler: en sık şikâyet</h2><span class="muted num">${r.length} kategori</span></div>
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
      const card = app.querySelector(`.cat[data-cat="${CSS.escape(c.id)}"] .cat-top-w.wait`);
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
      <ul class="reads-list">${reads.map((x) => `<li><a href="#/firsat" data-to="read:${esc(x.k)}"><span class="label">${esc(x.k)}</span><span>${x.t}</span></a></li>`).join('')}</ul>
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
    app.innerHTML = `<div class="band phead phead-a"><div class="crumbs"><a href="#/">Ana sayfa</a> / Arama</div>
      <div class="chead"><h1 class="page-name">${nHit ? `"${esc(term)}" için sonuçlar` : `"${esc(term)}" için sonuç bulunamadı`}</h1>${nHit ? `<div class="answer-block" data-form="sonuc"><p class="answer answer-m num">${cnt.replace(/ · /g, ', ').replace(/, ([^,]*)$/, ' ve $1')} bulundu.</p></div>` : `<div class="answer-block" data-form="sonuc-yok"><p class="answer answer-m">Bu aramayla eşleşen kategori, ürün ya da şikâyet yok.</p></div>`}</div></div>
      ${nHit ? `${failNote}
        ${m.length ? `<section class="sres" aria-labelledby="sr-k"><h2 id="sr-k">Kategoriler</h2><div class="cats search-res">${m.map((c) => catCard(c, data[c.id])).join('')}</div></section>` : ''}
        ${R.nProd ? `<section class="sres" aria-labelledby="sr-u"><h2 id="sr-u">${icon('urun', 'h-ic')}Ürünler ve markalar</h2><ul class="sr-list">${R.prods.map(prodRow).join('')}</ul>${more(R.nProd, R.prods.length)}</section>` : ''}
        ${R.nTopic ? `<section class="sres" aria-labelledby="sr-s"><h2 id="sr-s">${icon('sikayet', 'h-ic')}Şikâyet konuları ${tip('sikayet')}</h2><p class="muted">Konuya tıklayınca oranın hangi ürünlerden geldiğini ve müşterinin ne yazdığını görürsün.</p><ul class="sr-list">${R.topics.map(topicRow).join('')}</ul>${more(R.nTopic, R.topics.length)}</section>` : ''}`
      : `<div class="empty"><p>Kategori, ürün, marka ya da şikâyet adıyla arayabilirsin. Örneğin "Karaca", "tüylenme", "sızdırıyor".</p>${failNote}<p>Şu an analiz edilen kategoriler:</p><ul class="cat-links">${avail.map((c) => `<li><a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a></li>`).join('')}</ul></div>`}`;
  }

  let lastCat = (() => { try { return sessionStorage.getItem('rr_last_cat') || ''; } catch { return ''; } })();
  const rememberCat = (id) => { lastCat = id; try { sessionStorage.setItem('rr_last_cat', id); } catch {} };

  function notFound(msg, back) {
    setTitle('Sayfa bulunamadı');
    app.innerHTML = `<div class="band phead phead-a"><div class="crumbs"><a href="#/">Ana sayfa</a> / Bulunamadı</div><div class="chead"><h1 class="page-name">Sayfa bulunamadı</h1><div class="answer-block" data-form="bulunamadi"><p class="answer answer-m">${esc(msg || 'Aradığın sayfa bu sitede yok.')}</p></div></div></div><div class="empty"><p class="muted">Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir. Aramayı kullanabilir ya da geri dönebilirsin.</p>${back || '<a class="btn" href="#/">Ana sayfaya dön</a>'}</div>`;
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

  // ---- v22: telefonda kısalan sayfalar. Uzun listenin ilk satırları görünür, kalanı hidden="until-found" kutuda (sayfa içi arama bulur ve açar);
  // bölümler <details> ile katlanır. Yazdırmada hepsi açık basılır (CSS'te ve beforeprint ile).
  const phoneMQ = matchMedia('(max-width: 640px)');
  const moreBtn = (box, btnId, label, n, open = false, cat = '') => `<button type="button" class="more-btn" id="${btnId}"${cat ? ` data-cat="${esc(cat)}"` : ''} aria-controls="${box}" aria-expanded="${open}" data-l="${esc(`${label} (${n})`)}">${open ? 'Daha az göster' : esc(`${label} (${n})`)}</button>`;
  const setMore = (btn, open) => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    if (open) box.removeAttribute('hidden'); else box.setAttribute('hidden', 'until-found');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Daha az göster' : btn.dataset.l;
    // Ürün listesinin açıklığı kategori başına hatırlanır: ürüne gidip geri gelince kaydırma yeri aynı listeye döner
    if (btn.id === 'p-more' && btn.dataset.cat) pOpen[btn.dataset.cat] = open;
  };
  const pOpen = {};
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.more-btn');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    setMore(b, open);
    // Kapatınca düğme ekranda kalsın (liste uzunken kullanıcı yerini kaybetmesin)
    if (!open) b.scrollIntoView({ block: 'nearest' });
  });
  // Sayfa içi arama kapalı kutuda bir şey bulunca tarayıcı kutuyu açar; düğme de "açık" olur
  document.addEventListener('beforematch', (e) => {
    const t = e.target;
    if (!(t instanceof Element) || !t.id) return;
    const b = document.querySelector(`.more-btn[aria-controls="${CSS.escape(t.id)}"]`);
    if (b) setMore(b, true); else t.removeAttribute('hidden');
  }, true);
  // Bir öğeyi gösterecek her şeyi açar: kendisi ya da üstündeki kapalı <details> ve hidden="until-found" kutular (varış vurgusu, bölüme gitme)
  function openFoldFor(el) {
    for (let x = el; x && x !== document.body; x = x.parentElement) {
      if (x.tagName === 'DETAILS' && !x.open) x.open = true;
      if (x.getAttribute('hidden') === 'until-found') x.dispatchEvent(new Event('beforematch'));
    }
  }
  let printFold = null;
  addEventListener('beforeprint', () => {
    printFold = { d: [...document.querySelectorAll('details:not([open])')], h: [...document.querySelectorAll('[hidden="until-found"]')] };
    printFold.d.forEach((d) => { d.open = true; });
    printFold.h.forEach((x) => x.removeAttribute('hidden'));
  });
  addEventListener('afterprint', () => {
    if (!printFold) return;
    printFold.d.forEach((d) => { if (d.isConnected) d.open = false; });
    printFold.h.forEach((x) => { if (x.isConnected) x.setAttribute('hidden', 'until-found'); });
    printFold = null;
  });
  // Telefon ile geniş ekran arasında geçişte sayfanın kendi katlama kuralı yeniden uygulanır (ör. kategori ürün listesi)
  let foldSync = null;
  phoneMQ.addEventListener('change', () => { if (foldSync) foldSync(); });
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
  // Önerinin dayandığı konular (veride isteğe bağlı `konular` ve `sevilenler` alanları). Oranlar veriden canlı hesaplanır; alan yoksa "Genel öneri".
  const recTopics = (c, o) => ({ ks: (Array.isArray(o.konular) ? o.konular : []).map((id) => c.temaMap[id]).filter(Boolean),
    ss: (Array.isArray(o.sevilenler) ? o.sevilenler : []).map((id) => c.olkMap[id]).filter(Boolean) });
  const recEv = (c, o, cls = 'rec-ev') => {
    const { ks, ss } = recTopics(c, o);
    if (!ks.length && !ss.length) return `<span class="${cls} rec-gen">Genel öneri</span>`;
    const lk = (kind, t) => go(H.konu(c.id, kind, t.id), `${esc(t.ad)} <b class="num${kind === 'konu' ? ' neg' : ''}">${pct(t.tum)}</b>`);
    return `<span class="${cls}">${ks.length ? `<span class="rec-l">Dayandığı şikâyet:</span> ${ks.map((t) => lk('konu', t)).join('<span class="rec-sep" aria-hidden="true"> · </span>')}` : ''}`
      + `${ks.length && ss.length ? '<br>' : ''}${ss.length ? `<span class="rec-l">Müşterinin sevdiği:</span> ${ss.map((t) => lk('sevilen', t)).join('<span class="rec-sep" aria-hidden="true"> · </span>')}` : ''}</span>`;
  };
  const ckItems = (c) => [
    ...c.tema.filter((t) => t.tum > 0).slice(0, 5).map((t) => ({ k: 't:' + t.id, g: 's', t: t.unlem.replace(/!$/, ''), ev: `<span class="ck-ev">${go(H.konu(c.id, 'konu', t.id), `şikâyet oranı <b class="num neg">${pct(t.tum)}</b>`)}</span>` })),
    ...c.oneriler.map((o) => ({ k: 'o:' + fold(o.baslik).slice(0, 48), g: 'o', t: o.baslik, ev: recEv(c, o, 'ck-ev') })),
  ];
  function checklist(c) {
    const items = ckItems(c), on = ckGet(c.id);
    const li = (it) => `<li${on.has(it.k) ? ' data-on=""' : ''}><label><input type="checkbox" data-ck="${esc(it.k)}"${on.has(it.k) ? ' checked' : ''}><span class="ck-prt" aria-hidden="true"></span><span class="ck-t">${esc(it.t)}</span></label>${it.ev || ''}</li>`;
    const g = (k, title, hint) => `<fieldset class="ck-g"><legend>${title}</legend><p class="muted ck-hint">${hint}</p><ul>${items.filter((it) => it.g === k).map(li).join('')}</ul></fieldset>`;
    // v22: telefonda kapalı gelir (başlıkta ilerleme sayısı); geniş ekranda ve işaret varsa açık
    return `<section class="step ck-card jump" id="sec-kontrol" tabindex="-1" aria-labelledby="ck-t">
        <details class="ck-fold" id="ck-fold"${!phoneMQ.matches || on.size ? ' open' : ''}>
        <summary class="ck-sum step-h"><span class="step-n" aria-hidden="true">5</span><h2 id="ck-t"><span class="sr-only">Adım 5: </span>Giriş kontrol listesi</h2>
          <span class="ck-prog"><b class="num" id="ck-n"></b> <span id="ck-of"></span></span><span class="fold-ic" aria-hidden="true"></span></summary>
        <div class="ck-body">
        <p class="step-lead">Bu kategorinin en sık şikâyetlerinden ve önerilerinden çıkarıldı. Ürününde ve ilanında hallettiklerini işaretle.</p>
        <div class="ck-bar" aria-hidden="true"><i id="ck-bar"></i></div>
        <div class="ck-groups">${g('s', 'En sık şikâyetler', 'Ürününde ve ilanında bu sorunu önlediysen işaretle.')}${g('o', 'Öneriler', 'Uyguladığında işaretle.')}</div>
        <p class="ck-foot"><button type="button" class="linkbtn" id="ck-reset">İşaretleri temizle</button><span class="muted" id="ck-store"></span></p>
        </div></details>
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

  // ---- konu görünümü (#/kategori/<id>/konu/<temaId> ve /sevilen/<konuId>): kategori oranı hangi ürünlerden oluşuyor + eldeki alıntılar ----
  // Şikâyet: kategori oranı = Σ(ürün oranı × okunan 1-2 yıldızlı yorum) ÷ Σ okunan (enrich ile aynı ağırlık). Olumlu: ürün oranlarının basit ortalaması (enrich ile aynı).
  const qFig = (c, p, a) => `<figure class="q${a.pos ? ' pos' : ''}"><blockquote>"${esc(a.metin)}"</blockquote><figcaption>${a.yildiz} yıldız · <a href="${esc(H.urun(c.id, p.id, a.pos ? 'sevilen' : 'konu', a.kid))}">${esc(prodName(p))}</a></figcaption></figure>`;
  const trLink = (p, txt = "Yorumların tamamı Trendyol'da") => `<a class="ext" href="${esc(p.link)}" target="_blank" rel="noopener">${txt}<span class="sr-only"> (yeni sekmede açılır)</span><span aria-hidden="true"> ↗</span></a>`;
  function topicPage(c, kind, t) {
    const neg = kind === 'konu', P = c.urunler, kid = t.id;
    const segIki = new Set(P.map((p) => p.segment)).size > 1;
    const val = (p) => (neg ? p.sikayet[kid] : p.olumlu[kid]) || 0, base = (p) => (neg ? p.ornek_dusuk : onerN(p)), part = (p) => val(p) * base(p);
    const has = (p) => val(p) > 0 && base(p) > 0;
    const byPart = (a, b) => part(b) - part(a) || val(b) - val(a) || b.yazili - a.yazili;
    const rank = (neg ? c.tema : c.olk).indexOf(t) + 1, nT = (neg ? c.tema : c.olk).length;
    const nq = (p) => quotesOf(p, kind, kid).length;
    setTitle(`${t.ad}: ${c.ad}`, `${c.ad} kategorisinde "${t.ad}": ${neg ? 'şikâyet oranı' : 'olumlu yorumlarda geçme oranı'} ${pct(t.tum)}, hangi ürünlerden geldiği ve müşterinin kendi sözleri.`);
    const sum = (R, f) => R.reduce((a, p) => a + f(p), 0);
    const row = (p) => `<tr><th scope="row">${go(H.urun(c.id, p.id, kind, kid), esc(prodName(p)))}<small class="tp-sub">${segIki && !neg ? `${esc(p.segment)} · ` : ''}${nq(p) ? `${nq(p)} örnek yorum` : 'örnek yorum yok'}</small></th>`
      + `<td class="num" data-l="${neg ? 'Şikâyet oranı' : 'Oran'}"><span class="${neg ? 'neg' : 'pos-v'}">${pct(val(p))}</span></td><td class="num" data-l="Okunan">${int(base(p))}</td><td class="num" data-l="Yaklaşık yorum">≈ ${approx(part(p))}</td></tr>`;
    const offRow = (R) => (R.length ? `<tr class="tp-off"><th scope="row">Bu konunun geçmediği ${R.length} ürün<small class="tp-sub">${R.map((p) => `<a href="${esc(H.urun(c.id, p.id))}">${esc(prodName(p))}</a>${base(p) ? '' : ' (1-2 yıldızlı yorum okunmadı)'}`).join(', ')}</small></th>`
      + `<td class="num" data-l="${neg ? 'Şikâyet oranı' : 'Oran'}">%0</td><td class="num" data-l="Okunan">${int(sum(R, base))}</td><td class="num" data-l="Yaklaşık yorum">0</td></tr>` : '');
    let body;
    if (neg && segIki) {
      body = [['Büyük marka', (p) => !isKobi(p), t.buyuk], ['KOBİ', isKobi, t.kobi]].map(([name, f, rate]) => {
        const R = P.filter(f), on = R.filter(has).sort(byPart);
        return `<tbody><tr class="tp-g"><th scope="rowgroup" colspan="4">${name}</th></tr>${on.map(row).join('')}${offRow(R.filter((p) => !has(p)))}`
          + `<tr class="tp-tot"><th scope="row">${name} toplamı</th><td class="num" data-l="Şikâyet oranı"><b class="neg">${pct(rate)}</b></td><td class="num" data-l="Okunan">${int(sum(R, base))}</td><td class="num" data-l="Yaklaşık yorum">≈ ${approx(sum(R, part))}</td></tr></tbody>`;
      }).join('');
    } else {
      const on = P.filter(has).sort(byPart);
      body = `<tbody>${on.map(row).join('')}${offRow(P.filter((p) => !has(p)))}</tbody>`;
    }
    const N = sum(P, base), K = sum(P, part), S = Math.round(sum(P, val) * 100);
    const foot = neg
      ? `<tr class="tp-tot tp-all"><th scope="row">Kategori</th><td class="num" data-l="Şikâyet oranı"><b class="neg">${pct(t.tum)}</b></td><td class="num" data-l="Okunan">${int(N)}</td><td class="num" data-l="Yaklaşık yorum">≈ ${approx(K)}</td></tr>`
      : `<tr class="tp-tot tp-all"><th scope="row">Kategori ortalaması</th><td class="num" data-l="Oran"><b>${pct(t.tum)}</b></td><td class="num" data-l="Okunan">${int(N)}</td><td class="num" data-l="Yaklaşık yorum">≈ ${approx(K)}</td></tr>`;
    const how = neg
      ? `Kategori oranı, ürünlerin şikâyet oranlarının okunan <span class="nowrap">1-2 yıldızlı</span> yorum sayısıyla ağırlıklı ortalamasıdır: yaklaşık <b class="num">${approx(K)}</b> ÷ <b class="num">${int(N)}</b> okunan yorum = <b class="num neg">${pct(t.tum)}</b>.`
      : `Kategori oranı, ${P.length} ürünün oranlarının basit ortalamasıdır: oranların toplamı <b class="num">${int(S)}</b> puan ÷ <b class="num">${P.length}</b> ürün = <b class="num">${pct(t.tum)}</b>. Yorumu az olan ürün de bir ürün sayılır.`;
    // Alıntılar: önce tablodaki sırayla konunun geçtiği ürünler
    const order = [...P.filter(has).sort(byPart), ...P.filter((p) => !has(p))];
    const withQ = order.filter((p) => nq(p)), noQ = order.filter((p) => has(p) && !nq(p));
    const recs = c.oneriler.filter((o) => recTopics(c, o)[neg ? 'ks' : 'ss'].includes(t));
    const others = (neg ? c.tema : c.olk).filter((x) => x !== t && x.tum > 0);
    const segLine = neg && segIki ? ` Büyük marka ürünlerinde <b class="neg num">${pct(t.buyuk)}</b>, KOBİ ürünlerinde <b class="neg num">${pct(t.kobi)}</b>.` : '';
    const lead = neg
      ? `Şikâyet oranı <b class="neg num">${pct(t.tum)}</b>: okunan ${int(N)} adet <span class="nowrap">1-2 yıldızlı</span> yorumun yaklaşık ${int(Math.round(K))} tanesinde geçiyor. Bu kategorinin en sık ${rank}. şikâyeti (${nT} konu içinde).${segLine}`
      : `Ürünlerin "Önerilen" sıralamada okunan yorumlarında ortalama <b class="num">${pct(t.tum)}</b> oranında geçiyor. Müşterinin en sık andığı ${rank}. olumlu konu (${nT} konu içinde).`;
    const A = topicAnswer(c, kind, t);
    const fig = (s, v, label, href, cls = '') => `<div class="afig${cls}">${picto(s, neg ? 'neg' : 'like')}<p class="afig-t">${href ? go(href, pct(v), 'big ' + (neg ? 'neg' : 'like'), `${label}: ${pct(v)}`) : `<b class="big num ${neg ? 'neg' : 'like'}">${pct(v)}</b>`}<span>${label}</span></p></div>`;
    const figs = neg && segIki && A.segOk
      ? `<div class="afigs">${fig(share(t.tum), t.tum, 'şikâyet oranı, kategoride', null)}${cmpBars([{ label: 'Büyük marka', v: t.buyuk }, { label: 'KOBİ', v: t.kobi }])}</div>`
      : `<div class="afigs">${fig(share(t.tum), t.tum, neg ? 'şikâyet oranı, kategoride' : 'kategori ortalaması', null)}</div>`;
    app.innerHTML = `
      <div class="band phead phead-a">
        <div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="${esc(H.cat(c.id))}">${esc(c.ad)}</a> / ${neg ? 'Şikâyet konusu' : 'Müşterinin sevdiği konu'}</div>
        <div class="chead"><p class="kicker ${neg ? 'k-neg' : 'k-like'}">${icon(neg ? 'sikayet' : 'sevilen')}${neg ? 'Şikâyet' : 'Müşterinin sevdiği'} · ${esc(c.ad)}</p><h1 class="page-name">${esc(t.ad)}</h1>
          <div class="tp-lead answer-block" data-form="${A.form}">
            <p class="answer">${A.html}</p>
            ${figs}
          </div>
          <p class="tp-detail">${lead} ${tip(neg ? 'sikayet' : 'sevilen')}</p>
          <p class="tp-back"><a href="${esc(H.cat(c.id))}"><span aria-hidden="true">←</span> ${esc(c.ad)}: kategori özeti</a></p></div>
      </div>
      <section class="card tp-card" aria-labelledby="tp-how-t">
        <h2 id="tp-how-t">${icon('urun', 'h-ic')}Bu oran hangi ürünlerden oluşuyor?</h2>
        <p class="muted">Bir ürüne tıkla: o ürünün bu konudaki oranını ve yorumlarını gör.</p>
        <div class="tp-wrap"><table class="tp-table"><caption class="sr-only">${esc(t.ad)}: ürün ürün ${neg ? 'şikâyet oranı' : 'oran'}, okunan yorum ve yaklaşık yorum sayısı</caption>
          <thead><tr><th scope="col">Ürün</th><th scope="col" class="num">${neg ? 'Şikâyet oranı' : 'Oran'}</th><th scope="col" class="num">${neg ? 'Okunan <span class="nowrap">1-2 yıldızlı</span> yorum' : 'Okunan "Önerilen" yorum'}</th><th scope="col" class="num">Yaklaşık yorum ${tip('yaklasik')}</th></tr></thead>
          ${body}<tfoot>${foot}</tfoot></table></div>
        <p class="tp-how">${how} <a href="#/yontem/oran">Bir oran nasıl oluşuyor?</a></p>
      </section>
      <section class="card tp-card" id="tp-q" aria-labelledby="tp-q-t">
        <h2 id="tp-q-t">${icon('kanit', 'h-ic')}Müşterinin kendi sözleriyle ${tip('alinti')}</h2>
        <p class="muted">${neg ? 'Bu konuya etiketli saklanan örnek yorumlar.' : 'Bu olumlu konuya etiketli saklanan örnek yorumlar.'} Her üründe yalnızca 3-4 yorum saklandı; tarihleri yok.</p>
        ${withQ.length ? `<div class="quotes">${withQ.flatMap((p) => quotesOf(p, kind, kid).map((a) => qFig(c, p, a))).join('')}</div>`
          : `<p class="tp-none">${neg ? 'Bu şikâyete etiketli saklanan örnek yorum yok.' : 'Bu olumlu konuya etiketli saklanan örnek yorum yok. Saklanan yorumların çoğu 1-2 yıldızlı yorumlardan.'}</p>`}
        ${noQ.length ? `<div class="tp-noq"><h3>${withQ.length ? 'Örnek yorumu saklanmayan ürünler' : 'Yorumları Trendyol\'da oku'}</h3><p class="muted">Bu ürünlerde konu geçiyor ama saklanan örnek yorum yok. Yorumların tamamı ürünün Trendyol sayfasında.</p>
          <ul>${noQ.map((p) => `<li><a href="${esc(H.urun(c.id, p.id, kind, kid))}">${esc(prodName(p))}</a> <span class="num ${neg ? 'neg' : ''}">${pct(val(p))}</span> ${trLink(p, "Trendyol'da yorumlar")}</li>`).join('')}</ul></div>` : ''}
        <p class="note"><a href="#/yontem/alinti">Örnek yorumlar nasıl seçildi, neden az?</a></p>
      </section>
      ${recs.length ? `<section class="card tp-card" aria-labelledby="tp-r-t"><h2 id="tp-r-t">${icon('oneri', 'h-ic')}Bu ${neg ? 'şikâyete' : 'konuya'} dayanan öneriler</h2><ol class="recs tp-recs">${recs.map((o) => `<li><b>${esc(o.baslik)}</b><span>${esc(o.metin)}</span>${recEv(c, o)}</li>`).join('')}</ol></section>` : ''}
      ${others.length ? `<section class="tp-others" aria-labelledby="tp-o-t"><h2 id="tp-o-t" class="label">${neg ? 'Bu kategorideki diğer şikâyetler' : 'Müşterinin sevdiği diğer konular'}</h2>
        <ul>${others.map((x) => `<li>${go(H.konu(c.id, kind, x.id), `${esc(x.ad)} <b class="num${neg ? ' neg' : ''}">${pct(x.tum)}</b>`)}</li>`).join('')}</ul></section>` : ''}`;
  }

  // ---- kategori sayfasının süzgeç ve sıralaması adreste: #/kategori/<id>?sirala=cok&tip=kobi ----
  // sirala: yorum|puan|dusuk|cok; tip: kobi,buyuk; marka: marka adının aksansız kısaltması; sikayet: ürünün en sık şikâyetinin konu kimliği;
  // puan: 4.5|4.0|3.5; dusuk: 10-alti|10-20|20-ustu. Geçersiz ya da bu kategoride olmayan değer "Sayfa bulunamadı" gösterir.
  const SORTS = ['yorum', 'puan', 'dusuk', 'cok'];
  const DUSUK_Q = { a: '10-alti', b: '10-20', c: '20-ustu' };
  const SEG_Q = { 'KOBİ': 'kobi', 'Büyük marka': 'buyuk' };
  const slug = (s) => fold(s).replace(/ /g, '-');
  const ST0 = () => ({ segment: [], marka: [], sikayet: [], puan: '', dusuk: '' });
  function readCatQ(c, q) {
    const st = ST0(), keys = [...q.keys()];
    let sort = 'yorum';
    if (new Set(keys).size !== keys.length) return null;
    const P = c.urunler, segs = [...new Set(P.map((p) => p.segment))], marks = [...new Set(P.map((p) => p.marka))], tops = new Set(P.map((p) => p.sik[0]?.id).filter(Boolean));
    const list = (v, find) => { const a = v.split(','); if (a.some((x) => !x) || new Set(a).size !== a.length) return null; const out = a.map(find); return out.every((x) => x != null) ? out : null; };
    for (const [k, v] of q) {
      let ok = true;
      if (k === 'sirala') { ok = SORTS.includes(v); sort = v; }
      else if (k === 'tip') { const a = list(v, (x) => segs.find((s) => SEG_Q[s] === x)); ok = !!a; st.segment = a || []; }
      else if (k === 'marka') { const a = list(v, (x) => marks.find((m) => slug(m) === x)); ok = !!a; st.marka = a || []; }
      else if (k === 'sikayet') { const a = list(v, (x) => (tops.has(x) ? x : null)); ok = !!a; st.sikayet = a || []; }
      else if (k === 'puan') { ok = Object.hasOwn(PUAN, v); st.puan = v; }
      else if (k === 'dusuk') { const d = Object.keys(DUSUK_Q).find((x) => DUSUK_Q[x] === v); ok = !!d; st.dusuk = d || ''; }
      else ok = false;
      if (!ok) return null;
    }
    return { sort, st };
  }
  const catQ = (sort, st) => [sort !== 'yorum' && 'sirala=' + sort, st.segment.length && 'tip=' + st.segment.map((s) => SEG_Q[s]).join(','),
    st.marka.length && 'marka=' + st.marka.map(slug).join(','), st.sikayet.length && 'sikayet=' + st.sikayet.join(','),
    st.puan && 'puan=' + st.puan, st.dusuk && 'dusuk=' + DUSUK_Q[st.dusuk]].filter(Boolean).join('&');
  const catQS = {}; // kategori başına son görülen süzgeç adresi (ürün sayfasından "tüm ürünler"e dönüşte korunur)

  const yakinda = (r) => {
    setTitle(`${r.ad} (yakında)`);
    app.innerHTML = `<div class="band phead"><div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(r.ad)}</div><div class="chead"><h1>${esc(r.ad)}</h1></div></div><div class="empty"><p class="muted">Bu kategorinin yorumları henüz toplanmadı.</p><a class="btn" href="#/">Kategorilere dön</a></div>`;
  };
  // Konu görünümü yönlendirmesi: bilinmeyen kategori ya da konu "Sayfa bulunamadı"
  async function topicRoute(id, kind, kid, isStale) {
    const r = regOf(id);
    if (!r) { notFound('Bu kategori bu sitede yok.'); return; }
    if (r.durum !== 'hazir') { yakinda(r); return; }
    const c = await loadCat(id);
    if (isStale()) return;
    const t = topicOf(c, kind, kid);
    if (!t) { notFound(kind === 'konu' ? 'Bu şikâyet konusu bu kategoride yok.' : 'Bu olumlu konu bu kategoride yok.', `<a class="btn" href="${esc(H.cat(c.id))}">${esc(c.ad)} sayfasına dön</a>`); return; }
    rememberCat(id);
    topicPage(c, kind, t);
  }

  async function category(id, isStale, q) {
    const r = regOf(id);
    if (!r) { notFound('Bu kategori bu sitede yok.'); return; }
    if (r.durum !== 'hazir') { yakinda(r); return; }
    const c = await loadCat(id);
    if (isStale()) return;
    const cq = readCatQ(c, q);
    if (!cq) { notFound('Bu adresteki süzgeç ya da sıralama bu kategoride yok.', `<a class="btn" href="${esc(H.cat(c.id))}">${esc(c.ad)} sayfasına dön</a>`); return; }
    rememberCat(id);
    setTitle(c.ad, `${c.ad}: ${c.urunler.length} ürünün ${int(c.top.yazili)} yazılı yorumundan en sık şikâyetler, satıcı için öneriler ve giriş kontrol listesi.`);
    const top4 = c.tema.slice(0, 4), max = top4[0].tum;
    const seg = c.tema.filter((t) => t.id !== 'gosterge').slice(0, 5);
    const segIki = new Set(c.urunler.map((p) => p.segment)).size > 1;
    const sort = cq.sort;
    sessionSort[id] = sort; filterState[id] = cq.st; catQS[id] = catQ(sort, cq.st);
    if ([...q.keys()].length) pendingFocus = 'sec-urun';
    const tamYuz = c.top.onerilenN === c.urunler.length * 100;
    const sl = segLow(c), on = c.top.onerilen;
    const A = catAnswer(c), SA = segAnswer(c);
    // Bölüm menüsü sayfanın numaralı adımlarıyla aynı: 1 Sorun · 2 Kimde · 3 Ne yapmalı · 4 Ürünler · 5 Kontrol listesi
    const SECS = [['sec-ozet', 'Sorun'], ['sec-icgoru', 'Kimde'], ['sec-oneri', 'Ne yapmalı'], ['sec-urun', 'Ürünler'], ['sec-kontrol', 'Kontrol<span class="sn-long"> listesi</span>']];
    const stepH = (n, id, title, ic, extra = '') => `<div class="step-h"><span class="step-n" aria-hidden="true">${n}</span><h2 id="${id}"><span class="sr-only">Adım ${n}: </span>${title}${extra}</h2>${ic ? icon(ic, 'step-ic') : ''}</div>`;
    const ys = share(c.top.dusuk, 1);
    const tops1 = !segIki && c.tema[0] && c.tema[0].tum > 0 ? topProducts(c, 'konu', c.tema[0].id, 3) : [];
    app.innerHTML = `
      <div class="band phead phead-a">
        <div class="crumbs"><a href="#/">Ana sayfa</a> / ${esc(c.ust)} / ${esc(c.ad)}</div>
        <div class="chead"><p class="print-only prt-brand">${SITE} · Kategori raporu</p>
          <h1 class="page-name"><span class="pn-ust">${esc(c.ust)}</span>${esc(c.ad)}</h1>
          <div class="answer-block" data-form="${A.form}">
            <p class="answer">${A.html}</p>
            ${A.s ? `<div class="afigs"><div class="afig">${picto(A.s, 'neg')}<p class="afig-t">${go(H.konu(c.id, 'konu', A.t.id), pct(A.t.tum), 'big neg', `${A.t.ad}: şikâyet oranı ${pct(A.t.tum)}. Hangi ürünlerden geldiğini gör`)}<span>şikâyet oranı ${tip('sikayet')}</span></p></div></div>` : ''}
          </div>
          <div class="chead-foot"><ul class="meta num"><li><b>${c.urunler.length}</b> ürün</li><li><b>${int(c.top.yazili)}</b> yazılı yorum</li><li><b>${int(c.top.okunan)}</b> yorum okundu</li><li>Kaynak: <b>${esc(c.kaynak)}</b></li></ul>
            <button type="button" class="btn ghost sm chead-act" id="print-btn">Raporu yazdır / PDF</button></div></div>
      </div>
      <nav class="band secnav" id="secnav" aria-label="Sayfanın adımları"><div class="secnav-in">${SECS.map(([id, t], i) => `<button type="button" data-jump="${id}"><span class="sn-n" aria-hidden="true">${i + 1}</span><span>${t}</span></button>`).join('')}</div></nav>
      <section class="step jump" id="sec-ozet" tabindex="-1" aria-labelledby="sum-t">
        ${stepH(1, 'sum-t', 'Sorun ne?', 'sikayet')}
        <p class="step-lead">Müşterinin en sık yazdığı ${top4.length} şikâyet. Birine tıkla: hangi ürünlerden geldiğini ve müşterinin kendi sözlerini gör.</p>
        <ol class="issues">${top4.map((t) => `<li><a class="go-row" href="${esc(H.konu(c.id, 'konu', t.id))}"><span class="t go-t">${esc(t.unlem.replace(/!$/, ''))}</span><span class="p go-v">${pct(t.tum)}</span><span class="bar"><i style="width:${(t.tum / max) * 100}%"></i></span></a></li>`).join('')}</ol>
        <p class="note">Yüzde, şikâyet oranıdır ${tip('sikayet', false)}: okunan 1-2 yıldızlı yorumların kaçında bu sorunun geçtiği. Bir yorum birden fazla soruna girebilir. <a href="#/yontem">Bu rakamlar nasıl hesaplandı?</a></p>
        <div class="facts">
          <div class="fact" data-fig="dusuk"><span class="fact-h">Tüm yazılı yorumlar ${tip('yildiz')}</span>
            <div class="fact-row">${picto(ys, 'neg', 'grid')}<div>${go(H.cat(c.id, 'sirala=cok'), pct(c.top.dusuk, 1), 'fig neg', `${pct(c.top.dusuk, 1)}: ürünleri 1-2 yıldız payına göre sırala`)}
            <span class="fact-t">1-2 yıldız payı: ${int(c.top.yazili)} yorumdan ${int(c.top.dusukN)} tanesi 1 ya da 2 yıldız (${perText(ys, false)}).</span></div></div></div>
          <div class="fact"><span class="fact-h">Müşterinin ilk gördüğü yorumlar ${tip('onerilen')}</span>${go('#/yontem/iki-ornek', `${int(on)} / ${int(c.top.onerilenN)}`, 'fig', `${int(on)} / ${int(c.top.onerilenN)}: Yöntem, iki ayrı örnek`)}
            <span class="fact-t">${tamYuz ? `Trendyol'un "Önerilen" sıralamasında her ürünün ilk 100 yorumu.` : `Trendyol'un "Önerilen" sıralamasında okunan yorumlar (yorumu az olan üründe 100'den az).`} ${on ? `${int(on)} tanesi 1-2 yıldızlı: müşteri sorunları ilk sayfada görmüyor.` : 'Hiçbiri 1-2 yıldızlı değil: müşteri sorunları ilk sayfada görmüyor.'}</span></div>
        </div>
      </section>
      <section class="step jump" id="sec-icgoru" tabindex="-1" aria-labelledby="icgoru-t" data-form="${SA.form}">
        ${stepH(2, 'icgoru-t', 'Kimde var?', 'kimde')}
        <p class="step-answer">${SA.html}</p>
        ${segIki ? `<dl class="fact-seg"><div data-fig="dusuk-buyuk"><dt>Büyük marka ürünleri <span class="muted">1-2 yıldız payı</span></dt><dd class="neg num">${go(H.cat(c.id, 'sirala=cok&tip=buyuk'), pct(sl.buyuk, 1), '', `Büyük marka ${pct(sl.buyuk, 1)}: büyük marka ürünlerini 1-2 yıldız payına göre göster`)}</dd></div><div data-fig="dusuk-kobi"><dt>KOBİ ürünleri <span class="muted">1-2 yıldız payı</span></dt><dd class="neg num">${go(H.cat(c.id, 'sirala=cok&tip=kobi'), pct(sl.kobi, 1), '', `KOBİ ${pct(sl.kobi, 1)}: KOBİ ürünlerini 1-2 yıldız payına göre göster`)}</dd></div><div class="fs-tip">${tip('segment')}</div></dl>
          <div class="seg-chart"><h3>Aynı şikâyet, iki grupta ${tip('sikayet')}</h3><div class="legend"><span><i class="lg-big"></i>Büyük marka</span><span><i class="lg-kobi"></i>KOBİ</span></div>
          <div class="hbars">${seg.map((t) => { const m = Math.max(...seg.map((x) => Math.max(x.buyuk, x.kobi))); return `<a class="hb go-row seg2" href="${esc(H.konu(c.id, 'konu', t.id))}" aria-label="${esc(t.ad)}: büyük marka ${pct(t.buyuk)}, KOBİ ${pct(t.kobi)}"><span class="hb-t">${esc(t.ad)}</span><span class="tr2"><span class="tr"><i class="b-big" style="width:${(t.buyuk / m) * 100}%"></i></span><span class="tr"><i class="b-kobi" style="width:${(t.kobi / m) * 100}%"></i></span></span><span class="v">${pct(t.buyuk)}<br>${pct(t.kobi)}</span></a>`; }).join('')}</div></div>`
          : tops1.length ? `<div class="seg-chart"><h3>${esc(c.tema[0].ad)}: en çok hangi üründe? ${tip('sikayet')}</h3>${hbar(tops1.map((x) => ({ ad: shortName(x.p), v: x.v, href: H.urun(c.id, x.p.id, 'konu', c.tema[0].id) })), 'neg')}<p class="note">En az ${MIN_N} adet 1-2 yıldızlı yorumu okunan ürünler arasından.</p></div>` : ''}
      </section>
      <section class="step jump" id="sec-oneri" tabindex="-1" aria-labelledby="oneri-t">
        ${stepH(3, 'oneri-t', 'Ne yapmalı?', 'oneri')}
        <p class="step-lead">Bu kategoriye girecek bir KOBİ için ${c.oneriler.length} öneri. Altında dayandığı şikâyet ya da müşterinin sevdiği konu yazar.</p>
        <ol class="recs">${c.oneriler.map((o) => `<li><b>${esc(o.baslik)}</b><span>${esc(o.metin)}</span>${recEv(c, o)}</li>`).join('')}</ol>
        <p class="note">Öneriler yorumlar okunarak yazıldı; altındaki oranlar dayandıkları konuların bu sayfadaki oranlarıdır. <a href="#/yontem/oneri">Öneriler hangi şikâyete dayanıyor?</a></p>
        <div class="liked prt-hide"><h3>${icon('sevilen')}Müşteriler neyi seviyor? ${tip('sevilen')}</h3><p class="muted">Trendyol'un ilk gösterdiği yorumlarda en sık geçen olumlu konular. İlanında bunları öne çıkar.</p>${likedBars(c)}</div>
      </section>
      <section class="step jump" id="sec-urun" tabindex="-1" aria-labelledby="urun-t">
      ${stepH(4, 'urun-t', 'Ürünler', 'urun', ' <span class="muted num" id="pcount"></span>')}
      <div class="tools">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn ghost f-open" id="f-open" aria-controls="filters" aria-expanded="false">Filtrele</button>
          <label class="muted">Sırala <select id="sort">
          <option value="yorum">En çok yorum</option><option value="puan">En yüksek puan</option><option value="dusuk">En az 1-2 yıldız</option><option value="cok">En çok 1-2 yıldız</option></select></label>
        </div></div>
      <div class="plist">
        <aside class="filters" id="filters" aria-label="Filtreler">${filterPanel(c)}</aside>
        <div class="f-backdrop" id="f-backdrop" hidden></div>
        <div><div class="chips" id="chips"></div><div class="pgrid" id="pgrid"></div><div class="pmore-w" id="pmore-w"></div></div>
      </div></section>
      ${printProducts(c)}
      ${checklist(c)}
      ${printFoot(c)}`;
    secSpy();
    ckSync(c);
    const sel = document.getElementById('sort'); sel.value = sort;
    const st = cq.st;
    // Süzgeç ya da sıralama değişince adres güncellenir (yeni geçmiş kaydı: geri tuşu önceki görünüme döner, sayfa yeniden çizilmez)
    const syncURL = () => {
      const qs = catQ(sel.value, st), url = H.cat(id, qs);
      sessionSort[id] = sel.value; catQS[id] = qs;
      if (location.hash !== url) pushHist(url);
    };
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
      // v22: telefonda süzgeç ve sıralama yoksa ilk 4 ürün; kalanı "Tüm ürünleri göster (N)" ile (açık bırakıldıysa yeniden çizimde açık kalır)
      const fold = phoneMQ.matches && !catQ(sel.value, st) && list.length > 4;
      const wasOpen = !!pOpen[id];
      const cards = list.map((p) => card(c, p, cm));
      document.getElementById('pgrid').innerHTML = !list.length ? '<div class="empty" style="grid-column:1/-1"><p>Bu filtrelere uyan ürün yok.</p><button type="button" class="btn ghost" data-clear>Filtreleri temizle</button></div>'
        : fold ? `${cards.slice(0, 4).join('')}<div class="more-rest p-rest" id="p-rest"${wasOpen ? '' : ' hidden="until-found"'}>${cards.slice(4).join('')}</div>` : cards.join('');
      document.getElementById('pmore-w').innerHTML = fold ? moreBtn('p-rest', 'p-more', 'Tüm ürünleri göster', list.length, wasOpen, id) : '';
      document.getElementById('pcount').textContent = `(${list.length} / ${c.urunler.length})`;
      const chips = [];
      for (const k of ['segment', 'marka', 'sikayet']) st[k].forEach((v) => chips.push([k, v, k === 'sikayet' ? c.temaMap[v].ad : v]));
      if (st.puan) chips.push(['puan', st.puan, PUAN[st.puan]]);
      if (st.dusuk) chips.push(['dusuk', st.dusuk, '1-2 yıldız payı: ' + DUSUK[st.dusuk][0]]);
      document.getElementById('chips').innerHTML = chips.map(([k, v, t]) => `<button type="button" class="chip" data-k="${k}" data-v="${esc(v)}" aria-label="${esc(t)} filtresini kaldır">${esc(t)} ×</button>`).join('')
        + (chips.length ? '<button type="button" class="linkbtn" data-clear>Tümünü temizle</button>' : '');
    };
    const clear = () => { Object.assign(st, ST0()); aside.querySelectorAll('input').forEach((i) => { i.checked = false; }); draw(); syncURL(); };
    aside.addEventListener('change', (e) => {
      const i = e.target;
      if (i.type === 'checkbox') st[i.name] = [...aside.querySelectorAll(`input[name="${CSS.escape(i.name)}"]:checked`)].map((x) => x.value);
      else st[i.name] = i.value;
      draw(); syncURL();
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
        draw(); syncURL();
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
    sel.addEventListener('change', () => { draw(); syncURL(); });
    app.onchange = (e) => {
      const i = e.target.closest('[data-ck]');
      if (!i) return;
      const s = ckGet(id);
      if (i.checked) s.add(i.dataset.ck); else s.delete(i.dataset.ck);
      ckSet(id, s);
      ckSync(c);
    };
    draw();
    // Telefon ile geniş ekran arasında geçişte ürün listesi yeniden çizilir; geniş ekranda kapalı kalan bölüm açılır
    foldSync = () => {
      if (!document.getElementById('pgrid')) return;
      draw();
      if (phoneMQ.matches) return;
      app.querySelectorAll('details.ck-fold:not([open])').forEach((d) => { d.open = true; });
      app.querySelectorAll('.more-btn[aria-expanded="false"]').forEach((b) => setMore(b, true));
    };
  }
  // "Müşteriler neyi seviyor?": telefonda ilk 4 satır, kalanı "Tümünü göster" ile (aynı çubuk ölçeği: en uzun çubuk ilk satır)
  const likedBars = (c) => hbar(c.olk.slice(0, 6).map((k) => ({ ad: k.ad, v: k.tum, href: H.konu(c.id, 'sevilen', k.id) })), 'like', null,
    phoneMQ.matches ? { n: 4, id: 'like-rest', btn: 'like-more', label: 'Tümünü göster' } : null);
  // Yazdırma raporu: ekranda gizli (display:none, ekran okuyucu da okumaz), yalnızca baskıda görünür
  const SITE_URL = document.querySelector('meta[property="og:url"]')?.content || '';
  const printProducts = (c) => `
      <section class="print-only prt-products"><h2>Ürünler</h2>
        <table class="ptable"><thead><tr><th>Ürün</th><th>Satıcı tipi</th><th class="num">Ort. puan</th><th class="num">1-2 yıldız payı</th><th>En sık şikâyet</th></tr></thead><tbody>
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
    // Bölümün başlığı, kaydırma bitince bir an vurgulanır
    arrive([document.getElementById(t.getAttribute('aria-labelledby'))], false);
  }

  // ---- varış vurgusu (v20): site içi bir bağlantı sayfanın belirli bir parçasını gösteriyorsa o parça görünür alana getirilir,
  // bir an ana renkte (lacivert) hafif zemin ve ince çizgiyle işaretlenir, sonra iz bırakmadan söner. Yalnızca görsel; odak değişmez.
  // Hedef adresten ve (tıklanan bağlantı varsa) geldiği sayfadan ya da bağlantının data-to ipucundan bulunur: arrivalFor.
  // Yerleşimi değiştirmez (yalnızca box-shadow ve outline, Web Animations ile; bitince sınıf ya da stil kalmaz). Azaltılmış hareket: aynı süre sabit, sonra animasyonsuz kalkar.
  const ARR_MS = 1800;
  let arrAnims = [], arrTok = 0;
  const arriveStop = () => { arrTok++; arrAnims.forEach((a) => a.cancel()); arrAnims = []; };
  addEventListener('beforeprint', arriveStop);
  // Kaydırma durunca (art arda 3 karede yer değişmezse) çalıştır; yumuşak kaydırmada vurgu hedef yerine oturunca başlar
  const settle = (cb) => { let y = scrollY, still = 0, n = 0; const f = () => { if (scrollY === y) still++; else { still = 0; y = scrollY; } if (still >= 3 || ++n > 120) cb(); else requestAnimationFrame(f); }; requestAnimationFrame(f); };
  // Hedef yapışkan başlığın (kategori sayfasında bölüm menüsünün de) altında ve karşılaştırma çubuğunun üstünde görünmüyorsa oraya kaydır
  function ensureVisible(el) {
    const r = el.getBoundingClientRect(), top = document.querySelector('.top'), nav = document.getElementById('secnav'), bar = document.getElementById('cmpbar');
    const topH = top ? top.offsetHeight : 0, navH = nav ? nav.offsetHeight : 0;
    const lim = Math.max(top ? top.getBoundingClientRect().bottom : 0, nav ? nav.getBoundingClientRect().bottom : 0);
    const bot = innerHeight - (bar && !bar.hidden ? bar.offsetHeight : 0), avail = bot - lim;
    const ok = r.top >= lim - 1 && (r.bottom <= bot + 1 || (r.height > avail && r.top <= lim + avail * 0.25));
    if (!ok) scrollTo(scrollX, Math.max(0, scrollY + r.top - topH - navH - 14));
  }
  const hexRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h.trim()); if (!m) return '29 114 104'; const n = parseInt(m[1], 16); return `${n >> 16} ${(n >> 8) & 255} ${n & 255}`; };
  function flashArrive(els) {
    const cs = getComputedStyle(document.documentElement), rgb = hexRgb(cs.getPropertyValue('--brand')), dark = cs.colorScheme === 'dark';
    const tint = dark ? 0.2 : 0.13;
    els.forEach((el) => {
      const s = getComputedStyle(el), base = s.boxShadow && s.boxShadow !== 'none' ? ', ' + s.boxShadow : '';
      const row = el.matches('tr'), pad = row ? 0 : el.matches('.chip') ? 3 : el.matches('.fact-seg > div') ? 4 : 6;
      const k = (a) => ({ boxShadow: `inset 0 0 0 2000px rgb(${rgb} / ${a * tint}), 0 0 0 ${pad}px rgb(${rgb} / ${a * tint})${base}`,
        outline: `2px solid rgb(${rgb} / ${a * 0.8})`, outlineOffset: `${row ? -2 : pad}px` });
      const kf = reduceMotion.matches ? [k(1), k(1)] : [{ ...k(0), offset: 0 }, { ...k(1), offset: 0.08 }, { ...k(1), offset: 0.35, easing: 'ease-in-out' }, { ...k(0), offset: 1 }];
      el.setAttribute('data-arriving', '');
      const an = el.animate(kf, { duration: ARR_MS, easing: 'linear', id: 'rr-arrive' });
      const done = () => { el.removeAttribute('data-arriving'); arrAnims = arrAnims.filter((x) => x !== an); };
      an.onfinish = done; an.oncancel = done;
      arrAnims.push(an);
    });
  }
  // sync: hedefi hemen (yönlendirme sırasında, kaydırma kaydından önce) görünür alana getir. Bölüm menüsünde yumuşak kaydırma kendi işini yapar.
  function arrive(els, sync = true) {
    arriveStop();
    els.forEach((el) => { if (el && el.isConnected) openFoldFor(el); });
    els = els.filter((el) => el && el.isConnected && el.getClientRects().length);
    if (!els.length) return;
    const tok = arrTok;
    if (sync) ensureVisible(els[0]);
    settle(() => { if (tok !== arrTok || !els[0].isConnected) return; ensureVisible(els[0]); flashArrive(els); });
  }
  // Tıklanan iç bağlantı: hedef adresi, tıklandığı sayfanın adresi ve isteğe bağlı ipucu (data-to). Değiştirici tuşla açılan yeni sekme sayılmaz.
  let navFrom = null;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (!a || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    navFrom = { hash: a.hash, from: location.hash, to: a.dataset.to || '', t: Date.now() };
  }, true);
  // Bir yeni açılışta vurgulanacak parça(lar). focus: yönlendirmenin odaklayacağı bölümü değiştirir (fırsat hücresinden gelen rakam özet kutusunda).
  function arrivalFor(h, nav) {
    const $ = (s) => app.querySelector(s), one = (el) => (el ? { els: [el] } : null);
    const from = nav ? parseHash(nav.from) : null, to = nav ? nav.to : '';
    if (h[0] === 'kategori' && h.length === 2 && [...h.q.keys()].length) {
      if (!$('#sec-urun')) return null;
      // #/firsat hücresi: kategori sayfasında aynı rakam varsa (1-2 yıldız payı, KOBİ / büyük marka payı) o rakam
      if (from && from[0] === 'firsat') {
        const n = [...h.q.keys()].length, t = h.q.get('tip');
        const key = h.q.get('sirala') === 'cok' ? (n === 1 ? 'dusuk' : n === 2 && (t === 'kobi' || t === 'buyuk') ? 'dusuk-' + t : '') : '';
        const f = key && $(`[data-fig="${key}"]`);
        // v21: tüm yorumların 1-2 yıldız payı "1 Sorun ne?" adımında, satıcı tipine göre paylar "2 Kimde var?" adımında; odak rakamın bulunduğu adıma gider
        if (f) return { els: [f], focus: f.closest('.jump')?.id || 'sec-ozet' };
      }
      // Süzgeçli ya da sıralı liste: ürün listesi başlığı, sıralama (varsayılan değilse) ve etkin süzgeç etiketleri
      const sort = $('#sort');
      return { els: [$('#urun-t'), sort && sort.value !== 'yorum' ? sort.closest('label') : null, ...app.querySelectorAll('#chips .chip')] };
    }
    if (h[0] === 'kategori' && h.length === 4) {
      if (!$('.tp-table')) return null;
      if (to === 'dokum') return one($('[aria-labelledby="tp-how-t"]'));
      // Ürün sayfasından gelindiyse o ürünün tablodaki satırı (konunun geçmediği ürünse "geçmediği" satırı)
      if (from && from[0] === 'urun' && from[1] === h[1]) {
        const a = [...app.querySelectorAll('.tp-table tbody th a')].find((x) => { const p = parseHash(x.getAttribute('href')); return p && p[2] === from[2]; });
        if (a) return one(a.closest('tr'));
      }
      return one($('.tp-lead'));
    }
    if (h[0] === 'urun' && h.length === 5) return one($('#p-konu'));
    if (h[0] === 'urun' && h.length === 3 && to === 'alinti') return one($('#p-alinti'));
    if (h[0] === 'yontem' && h[1]) return one(mSec(h[1]));
    if (h[0] === 'firsat' && to.startsWith('read:')) return one([...app.querySelectorAll('.fp-reads li[data-read]')].find((li) => li.dataset.read === to.slice(5)));
    return null;
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
          <div class="stack"><dt><span class="pc-l">En sık şikâyet</span>${icon('sikayet', 'pc-ic')}</dt><dd${noLow(p) ? ' class="none"' : ''}>${noLow(p) ? esc(noLowShort(p)) : p.sik[0] ? go(H.urun(c.id, p.id, 'konu', p.sik[0].id), esc(p.sik[0].ad), '', `En sık şikâyet: ${p.sik[0].ad}, ${pct(p.sik[0].v)}. Bu üründeki yorumları gör`) : ''}</dd></div>
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
    const row = (x, bad) => `<li><span class="gp-t">${go(H.urun(c.id, p.id, 'konu', x.t.id), esc(x.t.ad))}</span><span class="gp-v num"><b${bad ? ' class="neg"' : ''}>${pct(x.v)}</b> <span class="muted">kategoride ${pct(x.a)}</span></span><span class="gp-d num">${dPts(x.v, x.a)}</span></li>`;
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
        <p class="note">Küçük farklar sayılmaz: en az ${Math.round(GAP.pts * 100)} puan ve ortalamanın belirgin üstü ya da altı gerekir. <a href="#/yontem/rakip">Bu karşılaştırma nasıl yapılıyor?</a></p></section>`;
  }

  // Ürün sayfasında konu kartı (#/urun/<k>/<id>/konu/<tema> ya da /sevilen/<konu>): ürünün o konudaki oranı ve yalnızca o konuya etiketli alıntılar
  function focusCard(c, p, kind, t) {
    const neg = kind === 'konu', n = neg ? p.ornek_dusuk : onerN(p), v = (neg ? p.sikayet[t.id] : p.olumlu[t.id]) || 0, Q = quotesOf(p, kind, t.id);
    const all = H.urun(c.id, p.id);
    const fig = neg
      ? (noLow(p) ? esc(noLowText(p)) : `Bu üründe şikâyet oranı <b class="num ${negCls(v)}">${pct(v)}</b>: okunan ${int(n)} adet <span class="nowrap">1-2 yıldızlı</span> yorumun yaklaşık ${int(Math.round(v * n))} tanesinde geçiyor. Kategoride ${go(H.konu(c.id, kind, t.id), `<b class="num neg">${pct(t.tum)}</b>`, '', `Kategoride ${pct(t.tum)}: bu oran hangi ürünlerden oluşuyor`)}.`)
      : `"Önerilen" sıralamada okunan ${int(n)} yorumun <b class="num">${pct(v)}${sfxLoc(pct(v))}</b> geçiyor (yaklaşık ${int(Math.round(v * n))} yorum). Kategori ortalaması ${go(H.konu(c.id, kind, t.id), `<b class="num">${pct(t.tum)}</b>`, '', `Kategori ortalaması ${pct(t.tum)}: bu oran hangi ürünlerden oluşuyor`)}.`;
    return `<section class="card pk-card${neg ? '' : ' pos'}" id="p-konu" tabindex="-1" aria-labelledby="pk-t">
        <div class="pk-top"><span class="kicker ${neg ? 'k-neg' : 'k-like'}">${icon(neg ? 'sikayet' : 'sevilen')}${neg ? 'Şikâyet konusu' : 'Müşterinin sevdiği konu'}</span><a class="linkbtn" href="${esc(all)}" data-to="alinti">Bütün örnek yorumları göster (${p.alinti.length})</a></div>
        <h2 id="pk-t">${esc(t.ad)}</h2>
        ${v > 0 && !(neg && noLow(p)) ? `<div class="pk-row">${picto(share(v), neg ? 'neg' : 'like')}<p class="pk-fig">${fig}</p></div>` : `<p class="pk-fig">${fig}</p>`}
        <h3>${icon('kanit', 'h-ic')}Müşterinin kendi sözleriyle ${tip('alinti')}</h3>
        ${Q.length ? `<div class="quotes">${Q.map((a) => `<figure class="q${a.pos ? ' pos' : ''}"><blockquote>"${esc(a.metin)}"</blockquote><figcaption>${a.yildiz} yıldız · ${esc(a.lab)}</figcaption></figure>`).join('')}</div>`
          : `<p class="tp-none">Bu üründe bu konuya etiketli saklanan örnek yorum yok.</p>`}
        <p class="pk-more">${trLink(p, Q.length ? "Bu ürünün bütün yorumları Trendyol'da" : "Yorumların tamamı Trendyol'da")}</p>
      </section>`;
  }

  // v22: yıldız dağılımı hükmün içinde tek yığılmış çubuk (5'ten 1 yıldıza) ve altında yüzdeler. 1-2 yıldız kırmızı tonda, 3-5 nötr.
  const starsBar = (p) => {
    const S = [5, 4, 3, 2, 1].map((s) => ({ s, v: p.yazili ? p.yildiz[s - 1] / p.yazili : 0 }));
    return `<div class="stars-w"><p class="stars-cap">Yazılı yorumların yıldızları</p>
      <div class="stars-bar" role="img" aria-label="Yıldız dağılımı: ${S.map((x) => `${x.s} yıldız ${pct(x.v)}`).join(', ')}">${S.map((x) => `<i class="sb sb-${x.s}" style="width:${x.v * 100}%"></i>`).join('')}</div>
      <p class="stars-leg num" aria-hidden="true">${S.map((x) => `<span><i class="sb sb-${x.s}"></i>${x.s} yıldız <b>${pct(x.v)}</b></span>`).join('')}</p></div>`;
  };
  async function product(cid, pid, isStale, kind, kid) {
    const r = regOf(cid);
    if (!r || r.durum !== 'hazir') { notFound('Bu ürün ya da kategori bu sitede yok.'); return; }
    const c = await loadCat(cid);
    if (isStale()) return;
    const p = c.urunler.find((u) => u.id === pid);
    if (!p) { notFound('Bu ürün bu kategoride yok.', `<a class="btn" href="#/kategori/${esc(c.id)}">${esc(c.ad)} sayfasına dön</a>`); return; }
    const ft = kind ? topicOf(c, kind, kid) : null;
    if (kind && !ft) { notFound(kind === 'konu' ? 'Bu şikâyet konusu bu kategoride yok.' : 'Bu olumlu konu bu kategoride yok.', `<a class="btn" href="${esc(H.urun(c.id, p.id))}">Ürün sayfasına dön</a>`); return; }
    rememberCat(cid);
    if (ft) pendingFocus = 'p-konu';
    setTitle(ft ? `${p.kisa}: ${ft.ad}` : p.kisa, `${p.ad} (${c.ad}): 1-2 yıldız payı ${pct(p.dusuk, 1)}${noLow(p) || !p.sik[0] ? '' : `, en sık şikâyet "${p.sik[0].ad}"`}. Rakibin açık verdiği konular ve müşteri yorumları.`);
    const on = inCmp(getCmp(), c.id, p.id);
    const yt = p.yazili, n = onerN(p), empty = noLow(p);
    // Önceki / sonraki ürün: kategori sayfasındaki sıralama ve (bu ürün içindeyse) filtreler
    let list = [...c.urunler];
    const fst = filterState[c.id], fl = fst ? list.filter((x) => passes(x, fst)) : list;
    const filt = fl.length > 1 && fl.length < list.length && fl.includes(p);
    if (filt) list = fl;
    list.sort(PSORT[sessionSort[c.id] || 'yorum']);
    const i = list.indexOf(p), L = list.length, prev = list[(i - 1 + L) % L], next = list[(i + 1) % L];
    // Konu açıkken önceki/sonraki ürün de aynı konuda açılır; "tüm ürünler" kategori sayfasındaki son süzgeçle döner
    const back = H.cat(c.id, catQS[c.id] || '');
    const pnav = (where) => `<nav class="pnav pnav-${where}" aria-label="${where === 'top' ? 'Aynı kategorideki ürünler' : 'Aynı kategorideki ürünler (sayfa sonu)'}">
        <a class="pnav-back" href="${esc(back)}"><span aria-hidden="true">←</span> ${esc(c.ad)}: tüm ürünler</a>
        ${L > 1 ? `<span class="pnav-step"><a href="${esc(H.urun(c.id, prev.id, kind, kid))}" aria-label="Önceki ürün: ${esc(prev.kisa)}"><span aria-hidden="true">‹</span> Önceki</a>
        <span class="muted num">${i + 1} / ${L}${filt ? ' (filtreli)' : ''}</span>
        <a href="${esc(H.urun(c.id, next.id, kind, kid))}" aria-label="Sonraki ürün: ${esc(next.kisa)}">Sonraki <span aria-hidden="true">›</span></a></span>` : ''}</nav>`;
    const sikRows = p.sik.slice(0, 7);
    if (ft && kind === 'konu' && !sikRows.some((x) => x.id === ft.id) && (p.sikayet[ft.id] || 0) > 0) sikRows.push(p.sik.find((x) => x.id === ft.id));
    const sevRows = p.sev.slice(0, 7);
    if (ft && kind === 'sevilen' && !sevRows.some((x) => x.id === ft.id) && (p.olumlu[ft.id] || 0) > 0) sevRows.push(p.sev.find((x) => x.id === ft.id));
    // Hüküm ve yanındaki resim: konu varsa bu ürün ile kategori aynı konuda; yoksa 1-2 yıldız payı (ürün ve kategori)
    const V = prodVerdict(c, p);
    const vfig = (s, v, d, lab, href, kindC = 'neg') => `<div class="afig">${picto(s, kindC)}<p class="afig-t">${href ? go(href, pct(v, d), 'big ' + kindC, `${lab}: ${pct(v, d)}`) : `<b class="big num ${kindC}">${pct(v, d)}</b>`}<span>${lab}</span></p></div>`;
    // İki oran da %9,5 ve üstündeyse iki 10 balonluk resim; biri küçükse (farklı taban olurdu) düz çubuklar
    const selfT = V.t && kind === 'konu' && ft && ft.id === V.t.id;
    const vsFigs = V.t
      ? (share(V.v).base === 10 && share(V.a).base === 10
        ? `<div class="afigs vs">${vfig(share(V.v), V.v, 0, 'bu üründe', selfT ? null : H.urun(c.id, p.id, 'konu', V.t.id))}${vfig(share(V.a), V.a, 0, 'kategoride', H.konu(c.id, 'konu', V.t.id))}</div>`
        : `<div class="afigs vs">${cmpBars([{ label: 'Bu üründe', v: V.v, href: selfT ? null : H.urun(c.id, p.id, 'konu', V.t.id) }, { label: 'Kategoride', v: V.a, href: H.konu(c.id, 'konu', V.t.id) }])}</div>`)
      : `<div class="afigs vs">${cmpBars([{ label: '1-2 yıldız payı, bu üründe', v: p.dusuk, d: 1 }, { label: '1-2 yıldız payı, kategoride', v: c.top.dusuk, d: 1 }])}</div>`;
    app.innerHTML = `
      <div class="band phead">
      <div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="${esc(H.cat(c.id))}">${esc(c.ad)}</a> / ${ft ? `<a href="${esc(H.konu(c.id, kind, ft.id))}">${esc(ft.ad)}</a> / ` : ''}${esc(p.kisa)}</div>
      ${pnav('top')}
      <div class="prod">
        <div class="prod-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" width="400" height="600" decoding="async" fetchpriority="high" referrerpolicy="no-referrer"></div>
        <div class="prod-info">
          <div class="prod-head">
          <p class="kicker">${icon('urun')}<span class="prod-seg">${segBadge(p)}${tip('segment')}</span><span class="muted">${esc(c.ad)}</span></p>
          <h1 class="page-name">${esc(p.ad)}</h1>
          <div class="stars"><span class="s" aria-hidden="true">★</span><b class="num">${dec(p.ort)}</b><span class="muted num">${int(yt)} yazılı yorum</span></div>
          </div>
          <div class="verdict answer-block" data-form="${V.form}">
            <p class="answer">${V.big}</p>
            <p class="answer-sub">${V.sub}</p>
            ${vsFigs}
            ${starsBar(p)}
          </div>
          <dl class="pstats">
            <div><dt>"Önerilen" ilk ${n} ortalaması ${tip('onerilen')}</dt><dd class="num">${dec(p.onerilen_ort)}</dd></div>
            <div><dt>1-2 yıldız payı ${tip('yildiz')}</dt><dd class="num${p.dusuk > 0 ? ' neg' : ''}">${pct(p.dusuk, 1)}</dd></div>
            ${empty || !p.sik[0] ? '' : `<div class="ps-w"><dt>En sık şikâyet</dt><dd>${go(H.urun(c.id, p.id, 'konu', p.sik[0].id), `${esc(p.sik[0].ad)} <span class="neg num">${pct(p.sik[0].v)}</span>`, '', `En sık şikâyet: ${p.sik[0].ad}, ${pct(p.sik[0].v)}. Yorumları gör`)}</dd></div>`}
          </dl>
          <div class="pact">
            <a class="btn out" href="${esc(p.link)}" target="_blank" rel="noopener">Trendyol'da gör<span class="sr-only"> (yeni sekmede açılır)</span></a>
            <label class="btn ghost"><input type="checkbox" data-cmp="${esc(p.id)}" data-cat="${esc(c.id)}" ${on ? 'checked' : ''}>Karşılaştırmaya ekle</label>
          </div>
        </div>
      </div>
      </div>
      <div class="cgrid">
        ${ft ? focusCard(c, p, kind, ft) : ''}
        ${empty ? `<p class="nodata">${esc(noLowText(p))}</p>` : gapCard(c, p)}
        ${empty ? '' : `<section class="card"><h2>${icon('sikayet', 'h-ic')}En çok neden şikâyet ediyorlar? ${tip('sikayet')}</h2><p class="muted">Şikâyet oranı: 1-2 yıldızlı yorumların yüzde kaçında geçtiği. İnce çizgi kategori ortalaması. Bir konuya tıkla: yorumları gör.</p>${hbar(sikRows.map((t) => ({ ad: t.ad, v: t.v, avg: t.tum, href: H.urun(c.id, p.id, 'konu', t.id), cur: ft && kind === 'konu' && t.id === ft.id })), 'neg', 'avg')}</section>`}
        <section class="card"><h2>${icon('sevilen', 'h-ic')}Neyi seviyorlar? ${tip('sevilen')}</h2><p class="muted">"Önerilen" sıralamanın ilk ${n} yorumunda geçme oranı.</p>${hbar(sevRows.map((k) => ({ ad: k.ad, v: k.v, href: H.urun(c.id, p.id, 'sevilen', k.id), cur: ft && kind === 'sevilen' && k.id === ft.id })), 'like')}</section>
        <section class="card"><h2>${icon('sikayet', 'h-ic')}Bu ürünün zayıf noktaları</h2><ul class="ul">${p.dikkat.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>${icon('oneri', 'h-ic')}Rakip bir KOBİ için ders</h2><ul class="ul">${p.ders.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
        ${ft ? '' : `<section class="card" id="p-alinti"><h2>${icon('kanit', 'h-ic')}Müşterinin kendi sözleriyle ${tip('alinti')}</h2>
          ${p.alinti.length ? `<p class="muted">Okunan yorumlardan saklanan ${p.alinti.length} örnek. Konuya tıklarsan o konunun oranını da görürsün.</p><div class="quotes">${p.alinti.map((a) => `<figure class="q${a.pos ? ' pos' : ''}"><blockquote>"${esc(a.metin)}"</blockquote><figcaption>${a.yildiz} yıldız · ${a.kid ? `<a href="${esc(H.urun(c.id, p.id, a.pos ? 'sevilen' : 'konu', a.kid))}">${esc(a.lab)}</a>` : esc(a.lab)}</figcaption></figure>`).join('')}</div>`
            : '<p class="tp-none">Bu ürün için saklanan örnek yorum yok.</p>'}
          <p class="pk-more">${trLink(p, "Bu ürünün bütün yorumları Trendyol'da")}</p></section>`}
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
    // Cevap: 1-2 yıldız payı en düşük ve en yüksek ürün (ekrandaki yuvarlanmış değerle; eşitse eşit denir)
    const byD = [...P].sort((a, b) => a.dusuk - b.dusuk), lo = byD[0], hi = byD[byD.length - 1];
    const cmpForm = pct(lo.dusuk, 1) === pct(hi.dusuk, 1) ? 'esit' : 'standart';
    const cmpAns = cmpForm === 'esit' ? `Seçtiğin ${P.length} ürünün 1-2 yıldız payı aynı: ${pct(lo.dusuk, 1)}.`
      : `Seçtiğin ${P.length} ürün içinde 1-2 yıldız payı en düşük olan ${esc(shortName(lo))} (${pct(lo.dusuk, 1)}), en yüksek olan ${esc(shortName(hi))} (${pct(hi.dusuk, 1)}).`;
    app.innerHTML = `
      <div class="band phead phead-a"><div class="crumbs"><a href="#/">Ana sayfa</a> / <a href="#/kategori/${esc(c.id)}">${esc(c.ad)}</a> / Karşılaştır</div>
      <div class="chead"><p class="kicker">${icon('urun')}${esc(c.ad)}</p><h1 class="page-name">${P.length} ürünü karşılaştır</h1>
        <div class="answer-block" data-form="${cmpForm}"><p class="answer answer-m">${cmpAns}</p></div>
        <p class="muted">Kalın yazılan değer gruptaki en iyi sonuç. En fazla ${MAXC} ürün, aynı kategoriden.</p>${gloss(['yildiz', 'onerilen', 'segment'])}</div></div>
      <p class="scroll-hint muted" id="scroll-hint" hidden>Tabloyu yana kaydır <span aria-hidden="true">→</span></p>
      <div class="ctable-wrap" id="ctable-wrap"><div class="ctable-box" id="ctable-box" tabindex="0" role="region" aria-label="Karşılaştırma tablosu"><table class="ctable">
        <tbody>
        ${row('<span class="sr-only">Ürün görseli</span>', P.map((p) => `<td><div class="ct-top"><a href="#/urun/${esc(c.id)}/${esc(p.id)}" class="ct-img"><img src="${esc(p.gorsel)}" alt="${esc(p.ad)}" width="400" height="600" decoding="async" referrerpolicy="no-referrer"></a><button type="button" class="ct-rm" data-rm-col="${esc(p.id)}" aria-label="${esc(p.kisa)}: karşılaştırmadan çıkar">Çıkar <span aria-hidden="true">×</span></button></div></td>`))}
        ${row('Ürün', P.map((p) => `<td><b>${esc(markaAd(p.marka))}</b><br>${esc(p.ad.replace(p.marka, '').trim())}</td>`))}
        ${row('Satıcı tipi', P.map((p) => `<td>${esc(p.segment)}</td>`))}
        ${row('Ortalama puan', P.map((p, i) => `<td class="num${ortB[i] ? ' best' : ''}">${dec(p.ort)}</td>`))}
        ${row('1-2 yıldız payı', P.map((p, i) => `<td class="num ${negCls(p.dusuk)}${dusB[i] ? ' best' : ''}">${pct(p.dusuk, 1)}</td>`))}
        ${row('"Önerilen" ortalaması ile genel puan farkı', P.map((p, i) => `<td class="num${gapB[i] ? ' best' : ''}">${sgn(p.onerilen_ort - p.ort)} puan</td>`))}
        ${row('Yazılı yorum', P.map((p) => `<td class="num">${int(p.yazili)}</td>`))}
        ${row('En sık 3 şikâyet', P.map((p) => noLow(p) ? `<td class="muted">${esc(noLowShort(p))}</td>` : `<td><ol>${p.sik.slice(0, 3).map((t) => `<li>${go(H.urun(c.id, p.id, 'konu', t.id), `${esc(t.ad)} <span class="neg num">${pct(t.v)}</span>`)}</li>`).join('')}</ol></td>`))}
        ${row('En çok sevilen 3 konu', P.map((p) => `<td><ol>${p.sev.slice(0, 3).map((k) => `<li>${go(H.urun(c.id, p.id, 'sevilen', k.id), `${esc(k.ad)} <span class="muted num">${pct(k.v)}</span>`)}</li>`).join('')}</ol></td>`))}
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
    const dash = '<span class="muted" title="Bu satıcı tipinde ürün yok">–</span>';
    // Hücreler kanıta gider: 1-2 yıldız payı → ürünler 1-2 yıldız payına göre; satıcı tipi → o tipin ürünleri; 1 numaralı şikâyet → konu görünümü
    const cell = {
      puan: (r) => `<b class="ft-score">${r.puan}</b>${r.eksik ? `<small class="ft-eksik" title="KOBİ ile büyük marka karşılaştırılamadı; puan ${5 - r.eksik} ölçütle hesaplandı">${5 - r.eksik} ölçüt</small>` : ''}<span class="mbar" aria-hidden="true"><i style="width:${r.puanTam}%"></i></span>`,
      dusuk: (r) => `${go(H.cat(r.id, 'sirala=cok'), `<span class="neg">${pct(r.dusuk, 1)}</span>`, '', `${r.ad}, 1-2 yıldız payı ${pct(r.dusuk, 1)}: ürünleri gör`)}<span class="mbar neg" aria-hidden="true"><i style="width:${(r.dusuk / maxD) * 100}%"></i></span>`,
      buyukPay: (r) => (r.buyukPay == null ? '<span class="muted">Büyük marka yok</span>' : `${go(H.cat(r.id, 'tip=buyuk'), pct(r.buyukPay, 1), '', `${r.ad}, büyük markaların yorum payı ${pct(r.buyukPay, 1)}: büyük marka ürünlerini gör`)}<span class="mbar" aria-hidden="true"><i style="width:${r.buyukPay * 100}%"></i></span>`),
      kobi: (r) => (r.kobi == null ? dash : go(H.cat(r.id, 'sirala=cok&tip=kobi'), `<span class="neg">${pct(r.kobi, 1)}</span>`, '', `${r.ad}, KOBİ 1-2 yıldız payı ${pct(r.kobi, 1)}: KOBİ ürünlerini gör`)),
      buyuk: (r) => (r.buyuk == null ? dash : go(H.cat(r.id, 'sirala=cok&tip=buyuk'), `<span class="neg">${pct(r.buyuk, 1)}</span>`, '', `${r.ad}, büyük marka 1-2 yıldız payı ${pct(r.buyuk, 1)}: büyük marka ürünlerini gör`)),
      sik: (r) => (r.sik ? go(H.konu(r.id, 'konu', r.sik.id), `${esc(r.sik.ad)} <span class="neg num">${pct(r.sik.tum)}</span>`) : dash),
      urun: (r) => int(r.urun),
      okunan: (r) => int(r.okunan),
    };
    const rawTxt = {
      rekabet: (r) => (r.buyukPay == null ? 'Büyük marka yok' : `Büyük markaların yorum payı ${pct(r.buyukPay, 1)}`),
      risk: (r) => `1-2 yıldız payı ${pct(r.dusuk, 1)}`,
      sorun: (r) => (r.sik ? `${esc(r.sik.ad)}: şikâyet oranı ${pct(r.sik.tum)}` : '–'),
      kobi: (r) => (r.raw.kobi == null ? (r.buyuk == null ? 'Büyük marka yok, ölçüt atlandı' : 'KOBİ ürünü yok, ölçüt atlandı') : `KOBİ ${pct(r.kobi, 1)}, büyük marka ${pct(r.buyuk, 1)} (fark ${r.raw.kobi > 0 ? '+' : r.raw.kobi < 0 ? '−' : ''}${pts(Math.abs(r.raw.kobi))})`),
      talep: (r) => `Ürün başına ${int(Math.round(r.raw.talep))} yazılı yorum`,
    };
    const reads = readings(rows);
    const NC = FCOLS.length;
    // v21: ilk üç kategori ve tek cümlelik gerekçe. Gerekçe puanın kendi ölçütlerinden: ağırlığı 0'dan büyük ölçütler içinde ölçüt puanı en yüksek olan.
    // Ölçüt puanı 60'ın altındaysa "öne çıkan ölçüt yok" denir (iddia, puandan büyük olmasın).
    const why = {
      rekabet: (r) => (r.buyukPay == null ? 'örneklemde büyük marka yok' : `büyük markaların yorum payı ${pct(r.buyukPay, 1)}`),
      risk: (r) => `yazılı yorumların 1-2 yıldız payı ${pct(r.dusuk, 1)}`,
      sorun: (r) => `1 numaralı şikâyet ${tNeg(r.sik.ad)}, şikâyet oranı ${pct(r.sik.tum)}`,
      kobi: (r) => `1-2 yıldız payı KOBİ'de ${pct(r.kobi, 1)}, büyük markada ${pct(r.buyuk, 1)}`,
      talep: (r) => `ürün başına ${int(Math.round(r.raw.talep))} yazılı yorum`,
    };
    const reason = (r, w) => {
      let best = -1;
      COMPS.forEach((c, i) => { if (w[i] > 0 && r.comp[c.k] != null && (best < 0 || r.comp[c.k] > r.comp[COMPS[best].k] || (r.comp[c.k] === r.comp[COMPS[best].k] && w[i] > w[best]))) best = i; });
      if (best < 0 || r.comp[COMPS[best].k] < 60) return { k: '', html: 'tek bir ölçütte öne çıkmıyor; puanı ölçütlere dengeli dağılıyor' };
      const c = COMPS[best];
      return { k: c.k, html: `${esc(c.ad.charAt(0).toLocaleLowerCase('tr') + c.ad.slice(1))}: ${why[c.k](r)}` };
    };
    app.innerHTML = `
      <div class="band phead phead-a"><div class="crumbs"><a href="#/">Ana sayfa</a> / Kategorileri karşılaştır</div>
        <div class="chead"><h1 class="page-name">Hangi kategoriye girmeli?</h1>
          <div class="answer-block" id="fs-answer" data-form=""><p class="answer answer-m" id="fs-ans" aria-live="polite"></p></div>
          <section class="fs-ctrl" aria-labelledby="fs-t">
            <div class="fs-row"><h2 class="label" id="fs-t">Neye göre?</h2>
              <fieldset class="segctl"><legend class="sr-only">Giriş puanı ağırlığı</legend>${[...PRESETS, OZEL].map((p) => `<label><input type="radio" name="fs-preset" value="${p.k}"><span>${esc(p.ad)}</span></label>`).join('')}</fieldset></div>
            <p class="fs-desc" id="fs-desc" aria-live="polite"></p>
            <div class="fs-sliders" id="fs-sliders" hidden>${COMPS.map((c, i) => `<label class="fs-sl"><span>${esc(c.ad)}</span><input type="range" min="0" max="5" step="1" data-wi="${i}" aria-valuetext=""><output class="num" data-wo="${i}"></output></label>`).join('')}
              <p class="fs-zero muted" id="fs-zero" hidden>Tüm ağırlıklar 0; puan eşit ağırlıklarla hesaplandı.</p></div>
          </section>
          <ol class="t3" id="t3" aria-label="Giriş puanı en yüksek üç kategori"></ol>
          <p class="note fs-note">Giriş puanı bir okuma kolaylığıdır: bu sitedeki kategorileri, örneklemdeki ürünlere bakarak birbirine göre sıralar. Pazar tahmini değildir; ağırlığı değiştirirsen sıra da değişir. <a href="#/yontem">Giriş puanı nasıl hesaplanıyor?</a></p>
          ${gloss(['yildiz', 'sikayet', 'segment'])}</div></div>
      ${reads.length ? `<ul class="reads-list fp-reads">${reads.map((x) => `<li data-read="${esc(x.k)}"><span class="label">${esc(x.k)}</span><span>${x.t}</span></li>`).join('')}</ul>` : ''}
      <h2 class="sec-h fp-all">Bütün kategoriler <span class="muted fp-all-s">Giriş puanına göre sıralı; "Puan ayrıntısı" puanın nereden geldiğini gösterir.</span></h2>
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
      <div class="fz-head" id="fz-head" aria-hidden="true" hidden><span>Kategori</span><span>Giriş puanı</span><span>1-2 yıldız payı</span></div>
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
    const detail = (r, w) => `<tr class="ft-detail"><td colspan="${NC}">${dbox(r, w, 'ftd-')}</td></tr>`;
    const dbox = (r, w, pre) => {
      let ws2 = COMPS.map((c, i) => (r.comp[c.k] == null ? 0 : w[i]));
      if (!ws2.some(Boolean)) ws2 = COMPS.map((c) => (r.comp[c.k] == null ? 0 : 1));
      const t = ws2.reduce((a, x) => a + x, 0);
      return `<div class="ft-dbox" id="${pre}${esc(r.id)}">
        <table class="ft-comp"><caption class="sr-only">${esc(r.ad)}: giriş puanının ölçütleri</caption><thead><tr><th scope="col">Ölçüt</th><th scope="col">Ham değer</th><th scope="col" class="num">Ölçüt puanı</th><th scope="col" class="num">Ağırlık</th></tr></thead><tbody>
        ${COMPS.map((c, i) => `<tr${r.comp[c.k] == null ? ' class="muted"' : ''}><th scope="row">${esc(c.ad)}</th><td>${rawTxt[c.k](r)}</td><td class="num" data-l="Ölçüt puanı " data-comp="${c.k}">${r.comp[c.k] == null ? '–' : Math.round(r.comp[c.k])}</td><td class="num" data-l="Ağırlık ">${r.comp[c.k] == null ? '–' : `${w[i]}${t ? ` <span class="muted">(%${Math.round((ws2[i] / t) * 100)})</span>` : ''}`}</td></tr>`).join('')}
        </tbody></table><p class="muted">Giriş puanı = ölçüt puanlarının ağırlıklı ortalaması = <b class="num">${fNum(r.puanTam)}</b>, yuvarlanınca <b class="num">${r.puan}</b>.</p></div>`;
    };
    // Telefonda tablo yerine kategori başına bir kart (aynı sıralama, filtre ve "Puan ayrıntısı")
    // v22: telefonda kısa satır (sıra, ad, giriş puanı, 1-2 yıldız payı); dokununca kartın ayrıntısı açılır
    const fcard = (r, rank, w, open) => `<li class="fc" data-row="${esc(r.id)}"><details class="fz-row"${open ? ' open' : ''}>
        <summary class="fz-sum"><span class="ft-rank num"${rank ? ` aria-label="${r.sira}. sıra">${r.sira}` : '>'}</span><span class="fz-ad">${esc(r.ad)}</span>
          <span class="fz-v"><span class="sr-only">Giriş puanı</span><b class="fz-score num">${r.puan}</b></span><span class="fz-v"><span class="sr-only">1-2 yıldız payı</span><span class="fz-d num neg">${pct(r.dusuk, 1)}</span></span><span class="fold-ic" aria-hidden="true"></span></summary>
        <div class="fz-body">
        <div class="fc-top"><div class="fc-name"><span><a href="#/kategori/${esc(r.id)}">${esc(r.ad)} sayfasına git</a><small class="muted num">${esc(r.ust)} · ${int(r.urun)} ürün · ${int(r.okunan)} okunan yorum${r.eksik ? ` · puan ${5 - r.eksik} ölçütle` : ''}</small></span></div></div>
        <dl class="fc-m">
          <div><dt>1-2 yıldız payı</dt><dd class="num">${go(H.cat(r.id, 'sirala=cok'), `<span class="neg">${pct(r.dusuk, 1)}</span>`, '', `${r.ad}, 1-2 yıldız payı ${pct(r.dusuk, 1)}: ürünleri gör`)}</dd></div>
          <div><dt>KOBİ'de</dt><dd class="num">${cell.kobi(r)}</dd></div>
          <div><dt>Büyük markada</dt><dd class="num">${cell.buyuk(r)}</dd></div>
          <div class="fc-w2"><dt>1 numaralı şikâyet</dt><dd>${cell.sik(r)}</dd></div>
          <div><dt>Büyük markaların yorum payı</dt><dd class="num">${r.buyukPay == null ? '<span class="muted">Yok</span>' : go(H.cat(r.id, 'tip=buyuk'), pct(r.buyukPay, 1), '', `${r.ad}, büyük markaların yorum payı ${pct(r.buyukPay, 1)}: büyük marka ürünlerini gör`)}</dd></div>
        </dl>
        <button type="button" class="ft-exp" data-exp="${esc(r.id)}" aria-expanded="${fOpen.has(r.id)}" aria-controls="ftc-${esc(r.id)}">Puan ayrıntısı<span class="sr-only">: ${esc(r.ad)}</span></button>
        ${fOpen.has(r.id) ? dbox(r, w, 'ftc-') : ''}</div></details></li>`;
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
      // Tablo ve telefon kartları ikisi de çizilir; hangisinin görüneceğini CSS seçer (telefonda kartlar, yazdırırken her zaman tablo)
      const rank = col.k === 'puan';
      const openRows = new Set([...$('fcards').querySelectorAll('details[open]')].map((d) => d.closest('[data-row]').dataset.row));
      $('fcards').innerHTML = vis.map((r) => fcard(r, rank, wEff, openRows.has(r.id))).join('');
      $('fcards').hidden = $('fz-head').hidden = !vis.length; $('fsort-m').hidden = false;
      $('fm-sort').value = fSort.k;
      $('fm-dir').textContent = col.txt ? (fSort.dir === 'asc' ? "A'dan Z'ye" : "Z'den A'ya") : (fSort.dir === 'asc' ? 'Küçükten büyüğe' : 'Büyükten küçüğe');
      $('fm-dir').setAttribute('aria-label', `Sıralama yönü: ${$('fm-dir').textContent}. Tersine çevir`);
      body.innerHTML = vis.map((r) => `<tr data-row="${esc(r.id)}"><th scope="row"><div class="ft-name">${rank ? `<span class="ft-rank num" aria-label="${r.sira}. sıra">${r.sira}</span>` : ''}<a href="#/kategori/${esc(r.id)}">${esc(r.ad)}</a></div>`
        + `<button type="button" class="ft-exp" data-exp="${esc(r.id)}" aria-expanded="${fOpen.has(r.id)}" aria-controls="ftd-${esc(r.id)}">Puan ayrıntısı<span class="sr-only">: ${esc(r.ad)}</span></button></th>`
        + `${FCOLS.slice(1).map((c) => `<td class="${c.k === 'sik' ? 'txt' : 'num'} ${c.cls || ''}">${cell[c.k](r)}</td>`).join('')}</tr>${fOpen.has(r.id) ? detail(r, wEff) : ''}`).join('');
      $('ctable-wrap').hidden = !vis.length; $('ff-empty').hidden = !!vis.length; $('scroll-hint').hidden = true;
      $('ff-n').textContent = `${vis.length} / ${rows.length} kategori`;
      $('ff-clear').hidden = !(fl.ust || fl.buyuk20 || fl.kobiOk || fl.maxD);
      // İlk üç (seçili ağırlık ve filtrelerle) ve cevap cümlesi
      const t3 = rows.filter(passes).sort((a, b) => a.sira - b.sira).slice(0, 3), pr0 = ws.p === 'ozel' ? OZEL : PRESETS.find((p) => p.k === ws.p);
      const fOn = !!(fl.ust || fl.buyuk20 || fl.kobiOk || fl.maxD);
      $('t3').innerHTML = t3.map((r, i) => { const re = reason(r, wEff); return `<li class="t3c" data-row="${esc(r.id)}"><span class="t3-n num" aria-hidden="true">${i + 1}</span>
        <div class="t3-b"><a class="t3-a" href="#/kategori/${esc(r.id)}">${esc(r.ad)}</a><p class="t3-s"><b class="num">${r.puan}</b><span class="muted"> / 100 giriş puanı</span></p><span class="mbar" aria-hidden="true"><i style="width:${r.puanTam}%"></i></span>
        <p class="t3-r" data-why="${re.k}">${re.html.charAt(0).toLocaleUpperCase('tr') + re.html.slice(1)}.</p></div></li>`; }).join('');
      $('t3').hidden = !t3.length;
      const ansEl = $('fs-ans');
      if (t3.length) {
        const r = t3[0], re = reason(r, wEff);
        const wTxt = pr0.k === 'ozel' ? 'kendi ağırlıklarınla' : `"${esc(pr0.ad)}" ağırlıkla`;
        ansEl.innerHTML = `${fOn ? `Seçili filtrelerle ve ${wTxt}` : wTxt.charAt(0).toLocaleUpperCase('tr') + wTxt.slice(1)} en yüksek giriş puanını <b>${esc(r.ad)}</b> alıyor (${r.puan}&nbsp;/&nbsp;100)${re.k ? ', çünkü ' : ': '}${re.html}.`;
        $('fs-answer').dataset.form = re.k ? 'standart' : 'dengeli';
      } else { ansEl.textContent = 'Bu filtrelere uyan kategori yok.'; $('fs-answer').dataset.form = 'bos'; }
      const ek = vis.filter((r) => r.eksik);
      $('ft-foot').textContent = ek.length ? `"${5 - ek[0].eksik} ölçüt" işaretli satırda KOBİ ile büyük marka karşılaştırılamadığı için puan kalan ölçütlerle hesaplandı. ` : '';
      app.querySelectorAll('th[data-col]').forEach((th) => {
        const on = th.dataset.col === fSort.k;
        if (on) th.setAttribute('aria-sort', fSort.dir === 'asc' ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort');
        th.querySelector('.ft-ar').textContent = on ? (fSort.dir === 'asc' ? '↑' : '↓') : '↕';
      });
      syncCtl();
      if (vis.length) scrollTable();
    };
    fMQ.onchange = () => { if ($('fcards')) scrollTable(); };
    // Odak, aynı seçiciye uyan öğelerden görünür olana (tablo ya da telefon kartı) geri verilir
    const keepFocus = (sel) => { const y = scrollY; draw(); const el = sel && [...app.querySelectorAll(sel)].find((x) => x.getClientRects().length); if (el && document.activeElement !== el) el.focus({ preventScroll: true }); scrollTo(scrollX, y); };
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

  // Yöntem bölümleri: #/yontem/<bölüm> adresi, içindekilerdeki kısa ad. Eski kimlikler (y-…, giris-puani) varış vurgusu ve bağlantılar için korunur.
  const M_TOC = { cumle: 'Baştaki cümle', veri: 'Veri', 'iki-ornek': 'Okunan yorumlar', 'neden-iki': 'Neden iki örnek', sikayet: 'Şikâyet oranı', oran: 'Oranın parçaları',
    yildiz: '1-2 yıldız payı', segment: 'KOBİ ve büyük marka', rakip: 'Rakibin açığı', alinti: 'Örnek yorumlar', oneri: 'Öneriler', kontrol: 'Kontrol listesi',
    notlar: 'Dikkat ve ders', 'giris-puani': 'Giriş puanı', sinirlar: 'Sınırlar' };
  const mKey = (id) => id.replace(/^[ym]-/, '');
  const mSec = (key) => { const el = key && (document.getElementById('y-' + key) || document.getElementById('m-' + key) || document.getElementById(key)); return el && el.matches('.m-sec') ? el : null; };
  async function method(isStale, sec) {
    const data = await loadAll();
    if (isStale()) return;
    setTitle('Yöntem', 'ReviewRadar rakamları nasıl hesaplanıyor: hangi yorumlar okundu, şikâyet oranı, 1-2 yıldız payı, rakip karşılaştırması ve giriş puanı.');
    const t = totals(data);
    const oran = t.onerilenN ? t.onerilen / t.onerilenN : 0, gercek = t.yazili ? t.dusukN / t.yazili : 0;
    // Canlı örnek: örnek kategorinin 1 numaralı şikâyeti, ürün ürün toplanınca başlıktaki oran
    const ex = data[DEMO_CAT] || Object.values(data).find(Boolean), exT = ex && ex.tema[0];
    const exK = exT ? ex.urunler.reduce((a, p) => a + (p.sikayet[exT.id] || 0) * p.ornek_dusuk, 0) : 0;
    const D = Object.values(data).filter(Boolean), Q = D.flatMap((d) => d.urunler.flatMap((p) => p.alinti));
    const qLow = Q.filter((a) => a.yildiz <= 2).length, qProd = D.reduce((a, d) => a + d.urunler.length, 0);
    // v22: her bölüm katlanır (<details>); geniş ekranda hepsi açık, telefonda yalnızca adresteki bölüm açık. Başta içindekiler.
    const keys = [];
    const S = (id, title) => { const k = mKey(id); keys.push(k); return `<details class="m-sec" id="${id}" tabindex="-1"${!phoneMQ.matches || k === sec ? ' open' : ''}><summary class="m-sum"><h2>${title}</h2><span class="fold-ic" aria-hidden="true"></span></summary><div class="m-body">`; };
    const E = '</div></details>';
    const html = `
      <div class="band phead phead-a"><div class="crumbs"><a href="#/">Ana sayfa</a> / Yöntem</div>
        <div class="chead"><h1 class="page-name">Yöntem: Bu rakamlar nasıl hesaplandı?</h1>
          <div class="answer-block" data-form="yontem"><p class="answer answer-m">Her rakam Trendyol'daki gerçek yorumlardan geliyor: ${t.yazili ? `${int(t.yazili)} yazılı yorumun yıldız dağılımına baktık, ` : ''}${int(t.okunan)} yorumu tek tek okuduk.</p></div></div></div>
      <article class="doc">
        ${kpiList(t, 'doc-kpis')}
        <!--toc-->
        ${S('y-cumle', `Sayfanın başındaki cümle ve resim`)}
          <p>Her sayfa, o sayfanın rakamlarından sabit bir kalıpla kurulan tek bir cümleyle açılır. Cümle yeni bir rakam eklemez; altındaki yüzdeyi düz Türkçeyle söyler.</p>
          <ul class="ul"><li>"1-2 yıldızlı her 10 yorumdan yaklaşık 4'ünde" gibi ifadeler, ekrandaki yüzdenin en yakın onluğa yuvarlanmış hâlidir (%40 → 4). Yüzde bir onluktan çok basit bir kesre yakınsa kesir söylenir: %25 "yaklaşık her 4 yorumdan 1'inde", %33 "her 3 yorumdan 1'inde", %50 "yaklaşık yarısında". %10'dan küçük oranlarda "her 100 yorumdan" denir. Resimdeki 10 balon tam payı gösterir (%25 → 2 dolu ve 1 yarım balon), 100 nokta yuvarlanmış yüzdeyi; tam yüzde her zaman yanında yazar.</li>
            <li>Şikâyet cümleleri okunan 1-2 yıldızlı yorumlar içindir, bütün müşteriler için değil. "1-2 yıldız payı" ise bütün yazılı yorumların payıdır.</li>
            <li>Grupları ya da ürünleri kıyaslayan cümleler, en az ${MIN_N} adet 1-2 yıldızlı yorumu okunan grup ve ürünlerle kurulur; daha az yorumda bunu açıkça yazar.</li></ul>
          ${grammar()}${E}
        ${S('y-veri', `Veri nereden geliyor?`)}
          <p>Rakamlar Trendyol'daki ürün yorumlarından geliyor. Yorumlar bir araştırma örneklemi olarak tek seferde toplandı. Yorum yazanların adları toplanmadı.</p>${E}
        ${S('y-iki-ornek', `Her üründe hangi yorumlar okundu?`)}
          <p>Her ürün için iki ayrı örnek okundu:</p>
          <ul class="ul"><li>Trendyol'un "Önerilen" sıralamasındaki ilk 100 yorum. Ürün sayfası yorumları önce bu sırayla gösterdiği için müşterinin ilk okuduğu yorumlar bunlar. Yorumu az olan üründe bu sırada 100'den az yorum var; o üründe hepsi okundu.</li><li>1 ya da 2 yıldız verilmiş en fazla 100 yorum. Üründe bu kadar düşük puanlı yorum yoksa daha azı.</li></ul>${E}
        ${S('m-neden-iki', `Neden iki ayrı örnek?`)}
          <p>"Önerilen" sıralamada düşük puanlı yorum neredeyse hiç görünmüyor. Yalnızca ilk sayfayı okursan sorunları göremezsin.</p>
          ${t.tam && t.onerilenN ? `<p>Bu sitedeki ${t.kat} kategoride "Önerilen" sıralamada okunan ${int(t.onerilenN)} yorumun yalnızca ${int(t.onerilen)} tanesi 1-2 yıldızlı (payı ${pct(oran, 1)}). Oysa tüm yazılı yorumlarda 1-2 yıldız payı ${pct(gercek, 1)}. Şikâyet oranları bu yüzden ayrıca okunan ${int(t.ornek)} adet 1-2 yıldızlı yorumdan hesaplandı.</p>` : ''}${E}
        ${S('y-sikayet', `Şikâyet oranı ne demek?`)}
          <p>Bir konunun şikâyet oranı, okunan 1-2 yıldızlı yorumların yüzde kaçında o konudan söz edildiğini gösterir.</p>
          <ul class="ul"><li>Konular her kategori için hazırlanan anahtar kelimelerle bulundu. Bu yüzden oranlar yaklaşıktır.</li><li>Bir yorum birden fazla konuya girebilir. Bu yüzden oranların toplamı 100 etmez.</li><li>Kategori ortalamasında her ürün, okunan 1-2 yıldızlı yorum sayısı kadar ağırlık taşır.</li></ul>${E}
        ${S('y-oran', `Bir oran hangi ürünlerden oluşuyor?`)}
          <p>Kategorinin şikâyet oranı, ürünlerin şikâyet oranlarından hesaplanır. Her ürün için oran, okunan <span class="nowrap">1-2 yıldızlı</span> yorum sayısıyla çarpılır. Çıkan sayı, o konunun üründe yaklaşık kaç yorumda geçtiğidir. Bu sayılar toplanır ve bütün ürünlerde okunan <span class="nowrap">1-2 yıldızlı</span> yorumların toplamına bölünür.</p>
          ${exT ? `<p>Örnek: ${esc(ex.ad)} kategorisinde "${esc(exT.ad)}" ürünlerde yaklaşık ${approx(exK)} yorumda geçiyor. Okunan <span class="nowrap">1-2 yıldızlı</span> yorum ${int(ex.top.ornek)}. ${approx(exK)} ÷ ${int(ex.top.ornek)} = ${pct(exT.tum)}. <a href="${esc(H.konu(ex.id, 'konu', exT.id))}" data-to="dokum">Bu hesabı ürün ürün gör</a>.</p>` : ''}
          <ul class="ul"><li>Büyük marka ve KOBİ oranları aynı hesapla, yalnızca o gruptaki ürünlerden çıkar.</li>
            <li>Ürün oranları yuvarlanmış tutulduğu için yaklaşık yorum sayısı küsuratlı olabilir.</li>
            <li>Müşterinin sevdiği konularda oran, Trendyol'un "Önerilen" sıralamasında okunan yorumlardan hesaplanır. Kategori oranı ürün oranlarının basit ortalamasıdır: her ürün eşit ağırlık taşır.</li>
            <li>Her konunun sayfasında bu hesap ürün ürün gösterilir; parçalar toplanınca sayfanın başındaki oran çıkar.</li></ul>${E}
        ${S('y-yildiz', `1-2 yıldız payı ne demek?`)}
          <p>Yazılı yorumların yüzde kaçının 1 ya da 2 yıldız olduğunu gösterir. Örneklemden değil, ürünün Trendyol'daki tüm yıldız dağılımından hesaplandı. Kategori ve satıcı tipi için o gruptaki bütün ürünlerin yorumları birlikte sayılır.</p>${E}
        ${S('y-segment', `KOBİ ve büyük marka`)}
          <p>Her ürün iki gruptan birine kondu:</p>
          <ul class="ul"><li><b>Büyük marka:</b> herkesin bildiği ulusal ya da uluslararası markalar ve büyük mağaza zincirlerinin kendi ürünleri.</li><li><b>KOBİ:</b> küçük ve orta ölçekli satıcılar. Mağazada da satılsa internetten büyüyen yerli markalar bu grupta sayıldı.</li></ul>
          <p>Ayrım her kategoride ürün seçilirken elle yapıldı. Bazı markalarda tartışmaya açıktır. Bir kategoride tek grup varsa satıcı tipi karşılaştırması gösterilmez.</p>${E}
        ${S('y-rakip', `Rakibin açık verdiği konular nasıl bulunuyor?`)}
          <p>Ürün sayfasındaki "Bu rakip nerede açık veriyor?" kutusu, ürünün her konudaki şikâyet oranını kategori ortalamasıyla karşılaştırır. Kategori ortalaması, ürün sayfasındaki çubuklarda ince çizgiyle gösterilen değerdir.</p>
          <ul class="ul"><li>Ürünün en az ${GAP.minN} adet 1-2 yıldızlı yorumu okunmuş olmalı. Daha azsa fark gösterilmez.</li>
            <li><b>Açık verdiği konu:</b> ürünün şikâyet oranı kategori ortalamasından en az ${Math.round(GAP.pts * 100)} yüzde puan yüksek, ortalamanın en az ${String(GAP.ratio).replace('.', ',')} katı ve konu en az ${GAP.minK} yorumda geçiyor.</li>
            <li><b>Az şikâyet aldığı konu:</b> ürünün şikâyet oranı kategori ortalamasından en az ${Math.round(GAP.pts * 100)} yüzde puan düşük ve ortalamanın en fazla yarısı.</li>
            <li>Fark, okunan yorum sayısına göre şansla açıklanamayacak kadar büyük olmalı: fark, ortalamanın bu örneklemdeki olağan oynamasının (standart hata) en az ${GAP.z} katı.</li>
            <li>Her iki listede en büyük farkı olan en fazla ${GAP.max} konu gösterilir.</li></ul>
          <p>Bu karşılaştırma ürünün gerçek kalitesini ölçmez. Yalnızca 1-2 yıldız veren müşterilerin hangi sorunu ne sıklıkla yazdığını gösterir.</p>${E}
        ${S('y-alinti', `Örnek yorumlar nasıl seçildi, neden az?`)}
          <p>Yorumların tamamı bu sitede tutulmuyor. Her ürün için okunan yorumlardan yalnızca 3-4 tanesi kelimesi kelimesine saklandı ve her biri bir konuya etiketlendi.${t.tam && Q.length ? ` Bu sitede ${int(qProd)} ürün için ${int(Q.length)} örnek yorum var; ${int(qLow)} tanesi <span class="nowrap">1-2 yıldızlı</span>.` : ''}</p>
          <ul class="ul"><li>Bir örnek yorum yalnızca etiketlendiği konuda gösterilir.</li>
            <li>Bir konunun geçtiği her üründe örnek yorum yok. O zaman site bunu yazar ve ürünün Trendyol sayfasına bağlantı verir; yorumların tamamı orada okunabilir.</li>
            <li>Yorumların tarihi saklanmadı. Örnekler tarihsiz gösterilir.</li>
            <li>Yorum yazanların adları toplanmadı.</li></ul>${E}
        ${S('y-oneri', `Öneriler hangi şikâyete dayanıyor?`)}
          <p>"Ne yapmalı?" önerileri yorumlar okunarak yazıldı; ölçüm değildir. Her önerinin altında dayandığı şikâyet ya da müşterinin sevdiği konu yazar. Eşleme önerinin metnine göre elle yapıldı.</p>
          <ul class="ul"><li>Önerinin yanındaki oranlar öneri metninin parçası değildir. O konuların bu sitedeki oranlarıdır ve veriden hesaplanır.</li>
            <li>Bir konuya tıklayınca oranın hangi ürünlerden geldiğini ve örnek yorumları görürsün.</li>
            <li>Belirli bir konuya dayanmayan öneri "Genel öneri" olarak görünür; yanında rakam yoktur.</li></ul>${E}
        ${S('y-kontrol', `Giriş kontrol listesi`)}
          <p>Kategori sayfasının sonundaki liste, kategorinin şikâyet oranı en yüksek 5 konusundan ve o kategori için yazılan önerilerin başlıklarından oluşur. Yeni bir bilgi eklemez. Her maddenin altında dayandığı konu ve oranı bağlantı olarak durur. İşaretler yalnızca senin tarayıcında saklanır; siteye gönderilmez.</p>${E}
        ${S('m-notlar', `"Dikkat" ve "ders" notları`)}
          <p>Ürün sayfalarındaki "Bu ürünün zayıf noktaları" ve "Rakip bir KOBİ için ders" notları, olumsuz yorumlar okunarak yazılmış yorumlardır. Ölçüm değildir.</p>${E}
        ${S('giris-puani', `Giriş puanı nasıl hesaplanıyor?`)}
          <p><a href="#/firsat">Kategori karşılaştırma</a> sayfasındaki giriş puanı 0 ile 100 arasındadır; yüksek puan, küçük bir satıcı için daha çekici bir kategori demektir. Beş ölçütün her biri 0-100 arası puanlanır, sonra seçtiğin ağırlıklarla ortalaması alınır:</p>
          <ul class="ul">${COMPS.map((c) => `<li><b>${esc(c.ad)}:</b> ${esc(c.acik)}</li>`).join('')}</ul>
          <p>"En yüksek" ve "en düşük" bu sitedeki tüm kategorilere göre belirlenir; tablodaki filtreler puanı değiştirmez. Bütün kategoriler bir ölçütte eşitse herkes o ölçütten 50 alır. Puan tam sayıya yuvarlanır; eşitlikte 1-2 yıldız payı düşük olan öne geçer.</p>
          <p>Hazır ağırlıklar (sırasıyla: ${COMPS.map((c) => esc(c.ad.toLocaleLowerCase('tr'))).join(', ')}):</p>
          <ul class="ul">${PRESETS.map((p) => `<li><b>${esc(p.ad)}:</b> <span class="num">${p.w.join(', ')}</span>. ${esc(p.acik)}</li>`).join('')}<li><b>${esc(OZEL.ad)}:</b> her ölçüt 0-5. Hepsini 0 yaparsan eşit ağırlık kullanılır.</li></ul>
          <p>Giriş puanı bir okuma kolaylığıdır, pazar tahmini değildir: kategorileri yalnızca örneklemdeki ürünlere bakarak birbirine göre sıralar.</p>${E}
        ${S('m-sinirlar', `Sınırlar`)}
          <ul class="ul"><li>Veri tek bir anın görüntüsü; zamanla değişebilir.</li><li>Tek pazar yeri: yalnızca Trendyol.</li><li>Az yorumu olan üründe örnek küçük; o ürünün oranlarını dikkatle oku.</li></ul>${E}
        <p><a class="btn" href="#/">Kategorilere git</a></p>
      </article>`;
    app.innerHTML = html.replace('<!--toc-->', `<nav class="m-toc" id="m-toc" aria-label="Bu sayfada"><h2 class="label">Bu sayfada</h2><ul>${keys.map((k) => `<li><a href="#/yontem/${k}">${esc(M_TOC[k] || k)}</a></li>`).join('')}</ul></nav>`);
    foldSync = () => app.querySelectorAll('.m-sec').forEach((d) => { d.open = !phoneMQ.matches || mKey(d.id) === sec; });
  }

  // ---- yönlendirme, kaydırma, yükleme ----
  history.scrollRestoration = 'manual';
  const scrollMap = (() => { try { return JSON.parse(sessionStorage.getItem('rr_scroll')) || {}; } catch { return {}; } })();
  let curKey = null, routing = false, routeTok = 0;
  const newKey = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  addEventListener('scroll', () => { if (!routing && curKey) scrollMap[curKey] = scrollY; }, { passive: true });
  addEventListener('pagehide', () => { try { sessionStorage.setItem('rr_scroll', JSON.stringify(scrollMap)); } catch {} });

  // Süzgeç/sıralama değişince yeni geçmiş kaydı (hashchange tetiklenmez, sayfa yeniden çizilmez); kaydırma yeri iki kayıtta da tutulur
  const pushHist = (url) => { if (curKey) scrollMap[curKey] = scrollY; curKey = newKey(); history.pushState({ k: curKey }, '', url); scrollMap[curKey] = scrollY; };
  // Sayfa çizilirken açılışta gidilecek bölüm (yalnızca yeni açılışta; geri/ileri tuşunda kayıtlı kaydırma yeri kullanılır)
  let pendingFocus = null;
  // "#/kategori/termos?sirala=cok" → ['kategori', 'termos'] + q (URLSearchParams); sondaki boş parça atılır
  const parseHash = (hs = location.hash) => {
    const raw = String(hs).replace(/^#\/?/, ''), qi = raw.indexOf('?');
    const path = (qi < 0 ? raw : raw.slice(0, qi)).replace(/\/+$/, ''), qs = qi < 0 ? '' : raw.slice(qi + 1);
    try { const h = path.split('/').map((s) => decodeURIComponent(s)); h.q = new URLSearchParams(qs); return h; } catch { return null; }
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
    foldSync = null;
    if (barMsg && barMsg.type === 'ask' && !opts.keep) barMsg = null;
    app.onclick = app.onchange = app.oninput = null;
    arriveStop();
    // Bu yönlendirmeyi az önce tıklanan iç bağlantı mı başlattı? (adres aynıysa ve tıklama yeniyse)
    const nav = navFrom && navFrom.hash === location.hash && Date.now() - navFrom.t < 4000 ? navFrom : null;
    navFrom = null;
    let h = parseHash();
    if (!h || !['', 'kategori', 'urun', 'karsilastir', 'ara', 'yontem', 'firsat'].includes(h[0]) || (h[0] === 'ara' && !h.slice(1).join('/').trim())) {
      history.replaceState(history.state, '', '#/');
      h = Object.assign([''], { q: new URLSearchParams() });
    }
    syncNav();
    // Sayfa türü <html data-page>: ana sayfada üst çubuktaki arama gizlenir (arama kahraman alanında). İlk değer index.html'de boyamadan önce yazılır.
    root.dataset.page = h[0] || 'home';
    let restoreY = 0, fresh = false;
    const keepY = scrollY;
    if (!opts.keep) {
      const st = history.state;
      if (st && st.k && st.k in scrollMap) { curKey = st.k; restoreY = scrollMap[st.k] || 0; }
      else { curKey = st && st.k ? st.k : newKey(); if (!(st && st.k)) history.replaceState({ k: curKey }, ''); restoreY = 0; fresh = true; }
    }
    pendingFocus = null;
    const timer = setTimeout(() => { if (!isStale()) showLoading(); }, 150);
    // Adres biçimi: konu ve ürün-konu adresleri tam uzunlukta olmalı; süzgeç (?…) yalnızca kategori sayfasında
    const n = h.length, hasQ = [...h.q.keys()].length > 0, kinds = ['konu', 'sevilen'];
    try {
      if (!REG.length) { REG = await getJSON('data/kategoriler.json'); if (isStale()) return; }
      if (hasQ && !(h[0] === 'kategori' && n === 2)) notFound('Bu adres bu sitede yok.');
      else if (h[0] === 'kategori' && n === 2) await category(h[1], isStale, h.q);
      else if (h[0] === 'kategori' && n === 4 && kinds.includes(h[2])) await topicRoute(h[1], h[2], h[3], isStale);
      else if (h[0] === 'kategori') notFound('Bu adres bu sitede yok.');
      else if (h[0] === 'urun' && n === 3) await product(h[1], h[2], isStale);
      else if (h[0] === 'urun' && n === 5 && kinds.includes(h[3])) await product(h[1], h[2], isStale, h[3], h[4]);
      else if (h[0] === 'urun') notFound('Bu adres bu sitede yok.');
      else if (h[0] === 'karsilastir') await compare(isStale);
      else if (h[0] === 'ara') await search(h.slice(1).join('/').trim(), isStale);
      else if (h[0] === 'yontem') await method(isStale, h[1]);
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
    // Yeni açılışta ilgili bölüme git: #/yontem/<bölüm>, süzgeçli kategori adresinde ürün listesi, ürün sayfasında açılan konu
    if (h[0] === 'yontem' && h[1]) pendingFocus = mSec(h[1])?.id || null;
    // Varış vurgusu yalnızca yeni açılışta (bağlantı, yapıştırılan ya da doğrudan açılan adres); geri/ileri ve yenilemede kayıtlı kaydırma yeri bozulmasın diye yok
    const arr = fresh && !opts.keep ? arrivalFor(h, nav) : null;
    if (arr && arr.focus) pendingFocus = arr.focus;
    if (pendingFocus && fresh && !opts.keep) {
      const el = document.getElementById(pendingFocus);
      if (el) { openFoldFor(el); el.scrollIntoView(); el.focus({ preventScroll: true }); }
    }
    pendingFocus = null;
    if (arr) arrive(arr.els);
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
