// Beş temada, 1280 ve 375 genişlikte, her sayfa türünde kendi görünür yazısı olan her öğenin yazı/zemin kontrastı en az 4,5:1 (eski contrast21.mjs).
const FN = `(()=>{const parse=s=>{const m=(s.match(/[\\d.]+/g)||[0,0,0,0]).map(Number);return {r:m[0],g:m[1],b:m[2],a:m.length>3?m[3]:1}};
const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
const bgOf=e=>{let stack=[];for(let x=e;x;x=x.parentElement){const c=parse(getComputedStyle(x).backgroundColor);if(c.a>0){stack.push(c);if(c.a>=1)break;}
    if(x.classList&&x.classList.contains('band')){const bb=bandBg(x);if(bb){stack.push(bb);break;}}}
  if(!stack.length||stack[stack.length-1].a<1){stack.push(bandBg(e)||parse(getComputedStyle(document.body).backgroundColor));}
  let base={r:255,g:255,b:255};for(const c of stack.reverse()){base={r:c.r*c.a+base.r*(1-c.a),g:c.g*c.a+base.g*(1-c.a),b:c.b*c.a+base.b*(1-c.a)}}return base};
// full-bleed bands paint their colour with ::before; use it when the element sits in one
const bandBg=e=>{const b=e.closest('.band');if(!b)return null;const c=parse(getComputedStyle(b,'::before').backgroundColor);return c.a>=1?c:null};
const out=new Map();
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
  // aria-hidden simgeler (ör. ★, yanında sayı yazılı) yazı değil, grafik nesnedir: en az 3:1 (WCAG 1.4.11); gerçek yazı en az 4,5:1
  const need=e.closest('[aria-hidden="true"]')?3:4.5;
  if(cr<need){const k=(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):e.tagName)+' "'+e.textContent.trim().slice(0,30)+'"';out.set(k,cr.toFixed(2));}
}
return [...out].slice(0,15)})()`;
const PAGES = ['#/', '#/kategori/filtre-kahve', '#/kategori/filtre-kahve/konu/skt', '#/kategori/filtre-kahve/sevilen/lezzet', '#/urun/filtre-kahve/52915799', '#/urun/filtre-kahve/52915799/konu/skt', '#/ara/karaca', '#/firsat', '#/yontem', '#/kategori/yok'];

export default async function ({ browser, base: BASE, check }) {
  for (const [w, mob] of [[1280, false], [375, true]]) {
    const pg = await browser.page({ width: w, height: 900, mobile: mob });
    for (const th of ['acik', 'krem', 'adacayi', 'koyu', 'gece']) {
      await pg.goto(BASE + '#/', 200); await pg.eval(`localStorage.setItem('rr_theme','${th}'); localStorage.removeItem('kyr_cmp'); true`);
      for (const h of PAGES) {
        await pg.goto('about:blank', 50); await pg.goto(BASE + h, 1300);
        await pg.eval('document.getAnimations().forEach(a=>a.finish()); true');
        const r = await pg.eval(FN);
        check(`${w} ${th} ${h}: yazı kontrastı en az 4,5:1`, !r.length, JSON.stringify(r));
      }
    }
    check(`${w} konsol temiz`, !pg.errors.length && !pg.logs.length, JSON.stringify([pg.errors, pg.logs]));
    await pg.close();
  }
}
