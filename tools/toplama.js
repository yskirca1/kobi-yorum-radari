// ReviewRadar — Trendyol yorum toplama betiği (kullanıcının kendi tarayıcısında, ürünün /yorumlar sayfasında çalışır)
// Kullanım: tools/yer_imi.html dosyasını aç, "ReviewRadar Topla" bağlantısını yer imleri çubuğuna sürükle.
//   Ürün sayfasında yer imine tıkla: /yorumlar sayfasında değilsen oraya gider, tekrar tıkla.
// Çıktı: rv_<urunId>.json dosyası İndirilenler klasörüne iner ({meta, dist, top, neg}); yedek olarak localStorage 'rv_<urunId>'.
//   top = "Önerilen" sıralamanın ilk 100 yorumu, neg = Puan filtresinde 1+2 yıldız seçilince gelen ilk 100 yorum.
// Yorumcu adı toplanmaz. Trendyol sayfa yapısını değiştirirse seçiciler (class adları) güncellenmeli. Sayfaları yavaş ve az sayıda aç.
(async () => {
  if (window.__rvCalisiyor) return;
  const m = location.href.match(/-p-(\d+)/);
  if (!/trendyol\.com/.test(location.host) || !m) { alert('ReviewRadar: Bir Trendyol ürün sayfasında çalıştırın.'); return; }
  if (!/\/yorumlar/.test(location.pathname)) {
    alert('ReviewRadar: Yorumlar sayfası açılıyor. Sayfa yüklenince yer imine tekrar tıklayın.');
    location.href = location.origin + location.pathname.replace(/\/$/, '') + '/yorumlar';
    return;
  }
  window.__rvCalisiyor = true;
  const kutu = document.createElement('div');
  kutu.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;background:#0d8a7f;color:#fff;font:600 15px/1.4 sans-serif;padding:12px 16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.3);max-width:320px';
  const durum = (t) => { kutu.textContent = 'ReviewRadar: ' + t; };
  document.body.appendChild(kutu);
  durum('Başladı, sekmeyi kapatmayın…');

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rows = () => [...document.querySelectorAll('.review-list .review')];
  async function load(max, etiket) {
    let last = -1, stable = 0;
    // Liste sonunda 1px'lik bir işaret var; görünür olunca yeni yorumlar yüklenir. Filtreden sonra sayfa yüksekliği
    // eski uzun listeye göre kalabildiği için sayfa dibine değil bu işarete kaydır. 8 tur (~15 sn) yeni yorum gelmezse dur.
    for (let i = 0; i < 120 && rows().length < max; i++) {
      const L = document.querySelector('.review-list'), son = L && (L.lastElementChild || rows().pop());
      if (stable % 2) { window.scrollBy(0, -400); await sleep(300); }
      // Önce listenin sonuna, yeni yorum gelmezse sayfa dibine kaydır (filtresiz listede dip, filtreli listede işaret işe yarıyor)
      son && son.scrollIntoView({ block: 'end' }); await sleep(900);
      if (rows().length === last) { window.scrollTo(0, document.body.scrollHeight); await sleep(900); }
      const n = rows().length; durum(etiket + ': ' + Math.min(n, max) + ' yorum…');
      if (n === last) { if (++stable >= 8) break; } else stable = 0; last = n;
    }
    [...document.querySelectorAll('.review-list button, .review-list span')].filter((b) => b.innerText && b.innerText.trim() === 'Devamını Oku').forEach((b) => { try { b.click(); } catch (e) {} });
    await sleep(600);
    return rows().slice(0, max).map((r) => {
      // Yıldız: .star-rating-full-star elemanının sağ boşluğu (padding-inline-end) dolu olmayan kısmı gösterir
      const c = r.querySelector('.review-stars'), fs = c && c.querySelector('.star-rating-full-star');
      const w = c ? c.getBoundingClientRect().width : 0, p = fs ? parseFloat(fs.style.paddingInlineEnd) || 0 : 0;
      return {
        stars: w ? Math.round(5 * (w - p) / w) : null,
        text: (r.querySelector('.review-comment')?.innerText || '').replace(/\s*Devamını Oku\s*$/, '').trim(),
        date: [...(r.querySelector('.date')?.querySelectorAll('span') || [])].map((s) => s.innerText).join(' '),
        seller: r.querySelector('.seller-name-wrapper strong')?.innerText || '',
      };
    });
  }

  try {
    await sleep(1500);
    const id = m[1];
    // Puan filtresi: kutular <button role="checkbox" aria-checked="true|false">; yalnızca menü açıkken DOM'da.
    // "Tıkla-değiştir" yerine istenen duruma getir (önceki denemeden kalan filtreye karşı).
    const cb = (s) => document.getElementById(`filter-checkbox-rate-${5 - s}-${s}`);
    const isaretli = (s) => cb(s)?.getAttribute('aria-checked') === 'true';
    const tid = (t) => document.querySelector(`[data-testid="${t}"]`);
    const menuAcik = () => !!(cb(1) || cb(5));
    async function puanAc() { if (!menuAcik()) { tid('filter-toggle-rate')?.click(); await sleep(1200); } }
    async function puanKapat() { if (menuAcik()) { tid('filter-toggle-rate')?.click(); await sleep(500); } }
    async function filtrele(istenen) {
      window.scrollTo(0, 0); await sleep(500); await puanAc();
      if (!menuAcik()) return false;
      for (const s of [1, 2, 3, 4, 5]) if (cb(s) && isaretli(s) !== istenen.includes(s)) { cb(s).click(); await sleep(300); }
      await sleep(300);
      const ok = [1, 2, 3, 4, 5].every((s) => !cb(s) || isaretli(s) === istenen.includes(s));
      const uygula = tid('filter-apply-button-rate');
      if (!ok || !uygula) return false;
      uygula.click(); await sleep(3000);
      window.scrollTo(0, 0); await sleep(500);
      return true;
    }
    durum('Filtre sıfırlanıyor…');
    await puanAc();
    const temiz = ![1, 2, 3, 4, 5].some(isaretli);
    if (!temiz) await filtrele([]); else await puanKapat();
    const sm = document.body.innerText.match(/([\d.,]+)\s*\n?\s*Değerlendirme\s*\n?\s*([\d.,]+)\s*\n?\s*Yorum/) || [];
    // Ürün görseli: önce og:image, yoksa sayfadaki ilk ürün görseli (Trendyol CDN, /prod/ yolu)
    const og = document.querySelector('meta[property="og:image"]')?.content || '';
    const img = [...document.images].map((i) => i.currentSrc || i.src).find((s) => /dsmcdn\.com/.test(s) && /\/prod\//.test(s)) || '';
    const gorsel = /\/prod\/|\/product\/media\//.test(og) ? og : (img || og);
    const meta = { id, url: location.href.split('?')[0], title: document.title.replace(/ Kullanıcı Yorumları.*/, ''), ratings: sm[1], reviews: sm[2], gorsel, toplama_tarihi: new Date().toISOString() };
    const top = await load(100, 'Önerilen');
    window.scrollTo(0, 0); await sleep(500); await puanAc();
    // Yazılı yorumların yıldız dağılımı (Puan filtresindeki sayılar)
    const dist = {}; [1, 2, 3, 4, 5].forEach((s) => { const l = document.querySelector(`label[for="filter-checkbox-rate-${5 - s}-${s}"] .count`); dist[s] = l ? +l.innerText.replace(/\D/g, '') : 0; });
    let neg = [];
    if (dist[1] + dist[2] > 0 && await filtrele([1, 2])) neg = await load(100, '1-2 yıldız');
    // Filtreyi temizle ki bir sonraki denemede sayfa filtreli açılmasın
    if (neg.length) await filtrele([]);
    const veri = { meta, dist, top, neg };
    const json = JSON.stringify(veri);
    try { localStorage.setItem('rv_' + id, json); } catch (e) {}
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'rv_' + id + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    // Kontroller: olumsuz listede 3+ yıldız olmamalı, sayılar beklenene yakın olmalı
    const toplam = [1, 2, 3, 4, 5].reduce((t, s) => t + dist[s], 0);
    const bekTop = Math.min(100, toplam), bekNeg = Math.min(100, dist[1] + dist[2]);
    const sorun = [];
    if (top.length === 0) sorun.push('hiç yorum okunamadı, sayfa yapısı değişmiş olabilir');
    if (neg.some((r) => r.stars > 2)) sorun.push('1-2 yıldız listesinde yüksek puanlı yorum var, filtre çalışmamış');
    if (top.length && top.length < bekTop * 0.9) sorun.push('önerilen ' + top.length + '/' + bekTop + ' eksik');
    if (neg.length < bekNeg * 0.9) sorun.push('1-2 yıldız ' + neg.length + '/' + bekNeg + ' eksik');
    durum((sorun.length ? 'Dosya indi ama SORUN VAR: ' + sorun.join('; ') + '. ' : 'Tamam! ') + 'rv_' + id + '.json — önerilen ' + top.length + ', 1-2 yıldız ' + neg.length + '.');
    kutu.style.background = sorun.length ? '#b91c1c' : '#0d8a7f';
  } catch (e) {
    durum('Hata: ' + e.message + ' — sayfayı yenileyip tekrar deneyin.');
    kutu.style.background = '#b91c1c';
  } finally {
    window.__rvCalisiyor = false;
  }
})();
