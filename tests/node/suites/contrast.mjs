// Beş temada, 1280 ve 375 genişlikte, her sayfa türünde kendi görünür yazısı olan her öğenin yazı/zemin kontrastı en az 4,5:1 (eski contrast21.mjs).
// Tek istisna: süs amaçlı yıldız simgesi (.stars .s) 3:1. Görev 9 yıldız rengine sahip.
// v22: ayrıca her temada renk rollerinin (ROLES) çiftleri doğrudan ölçülür.
//
// KNOWN_V21: v21 kodunda bugün 4,5:1'in altında kalan, siteye dokunmadan kabul edilen öğe/tema çiftleri. Eşik gevşetilmez, site düzeltilmez.
// Her kayıt: { tema, oge: 'sınıf "metin"', oran: ölçülen en düşük oran }. Çalışma `BİLİNEN` satırı basar, bunları PASS'ten ayrı sayar.
// Görev 2 (yeni temalar) bu listeyi BOŞALTMAK zorundadır. Boş liste beklenen sonuçtur.
const KNOWN_V21 = [];

const FN = `(()=>{const parse=s=>{const m=(s.match(/[\\d.]+/g)||[0,0,0,0]).map(Number);return {r:m[0],g:m[1],b:m[2],a:m.length>3?m[3]:1}};
const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
const bgOf=e=>{let stack=[];for(let x=e;x;x=x.parentElement){const c=parse(getComputedStyle(x).backgroundColor);if(c.a>0){stack.push(c);if(c.a>=1)break;}
    if(x.classList&&x.classList.contains('band')){const bb=bandBg(x);if(bb){stack.push(bb);break;}}}
  if(!stack.length||stack[stack.length-1].a<1){stack.push(bandBg(e)||parse(getComputedStyle(document.body).backgroundColor));}
  let base={r:255,g:255,b:255};for(const c of stack.reverse()){base={r:c.r*c.a+base.r*(1-c.a),g:c.g*c.a+base.g*(1-c.a),b:c.b*c.a+base.b*(1-c.a)}}return base};
// full-bleed bands paint their colour with ::before; use it when the element sits in one
const bandBg=e=>{const b=e.closest('.band');if(!b)return null;const c=parse(getComputedStyle(b,'::before').backgroundColor);return c.a>=1?c:null};
const out=new Map(); let n=0;
for(const e of document.querySelectorAll('#app *, .top *')){
  if(!e.getClientRects().length) continue;
  const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  if(!own) continue;
  const cs=getComputedStyle(e); if(cs.visibility==='hidden'||+cs.opacity===0) continue;
  if(e.closest('[hidden],.sr-only,.print-only,.tip-box')) continue;
  const fg=parse(cs.color);
  let bg=bgOf(e); const own2=(()=>{for(let x=e;x;x=x.parentElement){if(parse(getComputedStyle(x).backgroundColor).a>0) return x; if(x.classList&&x.classList.contains('band')) return null;} return null})();
  if(!own2){const bb=bandBg(e); if(bb) bg=bb;}
  const L1=lum(fg),L2=lum(bg),cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
  // Yalnızca süs amaçlı yıldız simgesi (.stars .s, yanında puan yazılı) grafik nesnedir: en az 3:1 (WCAG 1.4.11). Başka her şey, adım numaraları dahil, 4,5:1.
  const need=e.matches('.stars .s')?3:4.5; n++;
  if(cr<need){const k=(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):e.tagName)+' "'+e.textContent.trim().slice(0,30)+'"';out.set(k,cr.toFixed(2));}
}
return {n, low:[...out]}})()`;
// v22 renk rolleri: her temada anlam adlı değişkenlerin çiftleri. Yazı rolleri 4,5:1, varış vurgusu çizgisi (ana renk %80) 3:1.
const ROLES = [
  ['--color-primary', '--color-bg', 4.5], ['--color-primary', '--color-surface', 4.5], ['--color-primary', '--color-surface-muted', 4.5],
  ['--color-on-primary', '--color-primary', 4.5], ['--color-on-accent', '--color-accent', 4.5], ['--color-on-accent', '--color-accent-hover', 4.5],
  ['--color-text', '--color-bg', 4.5], ['--color-text', '--color-surface', 4.5], ['--color-text-muted', '--color-bg', 4.5], ['--color-text-muted', '--color-surface', 4.5],
  ['--color-text-muted', '--color-surface-muted', 4.5], ['--color-text-2', '--color-surface-muted', 4.5],
  ['--color-neg', '--color-bg', 4.5], ['--color-neg', '--color-surface', 4.5], ['--color-neg', '--color-neg-soft', 4.5], ['--color-on-neg', '--color-neg', 4.5],
  ['--color-like', '--color-bg', 4.5], ['--color-like', '--color-surface', 4.5], ['--color-like', '--color-like-soft', 4.5],
  ['--hero-ink', '--hero', 4.5], ['--hero-muted', '--hero', 4.5], ['--hero-accent', '--hero', 4.5], ['--foot-ink', '--foot', 4.5], ['--foot-link', '--foot', 4.5],
  ['--color-star', '--color-bg', 3], ['--color-star', '--color-surface', 3],
];
const ROLE_FN = (names) => `(()=>{const o={};for(const v of ${JSON.stringify(names)}){const p=document.createElement('i');p.style.color='var('+v+')';document.body.appendChild(p);o[v]=getComputedStyle(p).color;p.remove();}return o})()`;
const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const lumOf = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mixc = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a));

const PAGES = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve/konu/skt', '#/kategori/filtre-kahve/sevilen/lezzet', '#/urun/filtre-kahve/52915799', '#/urun/filtre-kahve/52915799/konu/skt', '#/ara/karaca', '#/firsat', '#/yontem', '#/kategori/yok'];

export default async function ({ browser, base: BASE, check }) {
  let known = 0;
  for (const [w, mob] of [[1280, false], [375, true]]) {
    const pg = await browser.page({ width: w, height: 900, mobile: mob });
    for (const th of ['acik', 'krem', 'adacayi', 'koyu', 'gece']) {
      await pg.goto(BASE + '#/', 200); await pg.eval(`localStorage.setItem('rr_theme','${th}'); localStorage.removeItem('kyr_cmp'); true`);
      if (w === 1280) {
        await pg.goto('about:blank', 50); await pg.goto(BASE + '#/', 900);
        const names = [...new Set(ROLES.flatMap(([f, g]) => [f, g]).concat(['--color-band']))];
        const c = await pg.eval(ROLE_FN(names));
        const low = ROLES.map(([f, g, need]) => [f, g, need, ratio(rgb(c[f]), rgb(c[g]))]).filter((r) => r[3] < r[2]).map((r) => `${r[0]} / ${r[1]} ${r[3].toFixed(2)} < ${r[2]}`);
        check(`roller ${th}: anlam çiftleri eşikte (${ROLES.length} çift)`, !low.length, low.join('; '));
        const line = Math.min(...['--color-bg', '--color-surface', '--color-band'].map((g) => ratio(mixc(rgb(c['--color-primary']), 0.8, rgb(c[g])), rgb(c[g]))));
        check(`roller ${th}: varış vurgusu çizgisi en az 3:1`, line >= 3, line.toFixed(2));
      }
      for (const h of PAGES) {
        await pg.goto('about:blank', 50); await pg.goto(BASE + h, 1300);
        await pg.eval('document.getAnimations().forEach(a=>a.finish()); true');
        const r = await pg.eval(FN);
        check(`${w} ${th} ${h}: ölçülen öğe sayısı > 0`, r.n > 0, `n=${r.n}`);
        const isKnown = ([oge]) => KNOWN_V21.some((k) => k.tema === th && k.oge === oge);
        const bad = r.low.filter((x) => !isKnown(x));
        for (const [oge, oran] of r.low.filter(isKnown)) { known++; console.log(`BİLİNEN [contrast] ${w} ${th} ${h}: ${oge} ${oran}:1`); }
        check(`${w} ${th} ${h}: yazı kontrastı en az 4,5:1 (${r.n} öğe)`, !bad.length, JSON.stringify(bad.slice(0, 15)));
      }
    }
    check(`${w} konsol temiz`, !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
    await pg.close();
  }
  console.log(`BİLİNEN toplam: ${known} (KNOWN_V21 girdi sayısı: ${KNOWN_V21.length})`);
}
