// ReviewRadar — Trendyol yorum toplama betiği (tarayıcıda, ürünün /yorumlar sayfasında çalıştırılır)
// Kullanım: ürün linkinin sonuna /yorumlar ekle, sayfayı aç, bu kodu tarayıcı konsolunda ya da Claude'un tarayıcı aracında çalıştır.
// Çıktı: localStorage 'rv_<urunId>' anahtarına {meta, dist, top, neg} yazar.
//   top = "Önerilen" sıralamanın ilk 100 yorumu, neg = Puan filtresinde 1+2 yıldız seçilince gelen ilk 100 yorum.
// Not: Trendyol sayfa yapısını değiştirirse seçiciler (class adları) güncellenmeli. Sayfaları yavaş ve az sayıda aç.
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rows = () => [...document.querySelectorAll('.review-list .review')];
  async function load(max) {
    let last = -1, stable = 0;
    for (let i = 0; i < 40 && rows().length < max; i++) {
      window.scrollTo(0, document.body.scrollHeight); await sleep(1300);
      const n = rows().length; if (n === last) { if (++stable >= 3) break; } else stable = 0; last = n;
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
  await sleep(1500);
  const id = location.href.match(/-p-(\d+)/)[1];
  const sm = document.body.innerText.match(/([\d.,]+)\s*\n?\s*Değerlendirme\s*\n?\s*([\d.,]+)\s*\n?\s*Yorum/) || [];
  const meta = { id, url: location.href, title: document.title.replace(/ Kullanıcı Yorumları.*/, ''), ratings: sm[1], reviews: sm[2] };
  const top = await load(100);
  window.scrollTo(0, 0); await sleep(500);
  const pb = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Puan'); pb && pb.click(); await sleep(1000);
  // Yazılı yorumların yıldız dağılımı (Puan filtresindeki sayılar)
  const dist = {}; [1, 2, 3, 4, 5].forEach((s) => { const l = document.querySelector(`label[for="filter-checkbox-rate-${5 - s}-${s}"] .count`); dist[s] = l ? +l.innerText.replace(/\D/g, '') : 0; });
  let neg = [];
  const c1 = document.getElementById('filter-checkbox-rate-4-1'), c2 = document.getElementById('filter-checkbox-rate-3-2');
  if (c1 || c2) {
    c1 && c1.click(); c2 && c2.click(); await sleep(500);
    [...document.querySelectorAll('.filter-dropdown-rate button')].find((b) => b.innerText.trim() === 'Uygula').click();
    await sleep(3000); neg = await load(100);
  }
  localStorage.setItem('rv_' + id, JSON.stringify({ meta, dist, top, neg }));
  console.log('Tamam:', meta.title, 'önerilen', top.length, '1-2 yıldız', neg.length, dist);
})();
