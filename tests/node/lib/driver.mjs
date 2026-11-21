// Edge'i CDP ile süren küçük sürücü (Playwright yok). Çalıştırma başına TEK tarayıcı açılır;
// her sayfa kendi tarayıcı bağlamında (ayrı depolama) açılır; close() süreci öldürür, geçici profili siler.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/></svg>';
const EDGES = [
  process.env.RR_EDGE,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(pid, 'SIGKILL'); } catch {} }
}

export async function launch({ realImages = false } = {}) {
  const exe = EDGES.find((p) => existsSync(p));
  if (!exe) throw new Error('Edge bulunamadı (RR_EDGE ile yol verilebilir)');
  const dir = mkdtempSync(join(tmpdir(), 'rr-edge-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let closed = false;
  const cleanup = () => {
    if (closed) return; closed = true;
    killTree(proc.pid);
    for (let i = 0; i < 20; i++) {
      try { rmSync(dir, { recursive: true, force: true }); } catch {}
      if (!existsSync(dir)) break;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    }
  };
  process.once('exit', cleanup);
  try {
    let ver;
    for (let i = 0; i < 60; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(200); } }
    if (!ver) throw new Error('Edge uzaktan hata ayıklama kapısı açılmadı');
    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('WebSocket açılamadı')), { once: true }); });
    let id = 0; const pend = new Map(), listeners = [];
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
      else listeners.forEach((f) => f(m));
    });
    // Yanıt vermeyen çağrı takımı sonsuza dek bekletmesin: 90 sn sonra hata fırlatır.
    const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
      const i = ++id;
      const timer = setTimeout(() => { pend.delete(i); rej(new Error(`CDP zaman aşımı: ${method}`)); }, 90000);
      pend.set(i, { res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); } });
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });
    const browser = {
      // block: bu parçaları içeren istekler başarısız sayılır (ör. ['dsmcdn.com'] fotoğraf gelmiyor, ['fonts.gstatic.com'] yazı tipi gelmiyor)
      async page({ width = 1280, height = 900, mobile = false, scheme = null, block = [] } = {}) {
        const { browserContextId } = await send('Target.createBrowserContext');
        const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
        const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
        const s = (m, p) => send(m, p, sessionId);
        const errors = [], logs = [];
        listeners.push((m) => {
          if (m.sessionId !== sessionId) return;
          if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
          if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'warn'].includes(m.params.type)) logs.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
          if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/dsmcdn|fonts\.g/.test(m.params.entry.url || '')) logs.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
          if (m.method === 'Fetch.requestPaused') {
            const u = m.params.request.url;
            if (block.some((b) => u.includes(b))) { s('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'Failed' }).catch(() => {}); return; }
            if (realImages) { s('Fetch.continueRequest', { requestId: m.params.requestId }).catch(() => {}); return; }
            s('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/svg+xml' }], body: Buffer.from(SVG).toString('base64') }).catch(() => {});
          }
        });
        await s('Runtime.enable'); await s('Page.enable'); await s('Log.enable');
        const pats = [...(realImages ? [] : ['*dsmcdn.com*', '*trendyol.com*']), ...block.map((b) => `*${b}*`)];
        if (pats.length) await s('Fetch.enable', { patterns: pats.map((urlPattern) => ({ urlPattern })) });
        const pg = {
          s, errors, logs,
          async size(w, h, mob = false) {
            await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: mob });
            await s('Emulation.setTouchEmulationEnabled', mob ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
          },
          async eval(expr) {
            const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
            if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + '\n' + expr.slice(0, 200));
            return r.result.value;
          },
          async goto(url, wait = 700) { await s('Page.navigate', { url }); await sleep(wait); },
          // Chromium çok hızlı art arda adres değişikliklerini yok sayabilir (gezinti kısıtlaması); atama tutmadıysa biraz bekleyip yeniden dener.
          async hash(h, wait = 500) {
            const want = `new URL(${JSON.stringify(h)}, location.href).hash`;
            for (let i = 0; i < 6; i++) {
              await pg.eval(`location.hash=${JSON.stringify(h)}`); await sleep(wait);
              if (await pg.eval(`location.hash === ${want}`)) return;
              await sleep(1500);
            }
          },
          async click(sel, wait = 500) { const ok = await pg.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.scrollIntoView({block:'center'}); e.click(); return true;})()`); await sleep(wait); return ok; },
          // gerçek fare tıklaması, öğenin ortasına
          async mclick(sel, wait = 500) {
            const r = await pg.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); const b=e.getClientRects()[0]||e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2};})()`);
            if (!r) return false;
            for (const type of ['mousePressed', 'mouseReleased']) await s('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
            await sleep(wait); return true;
          },
          async key(key, code, keyCode, wait = 200) {
            // Enter bir karakter üretir (gerçek klavyede olduğu gibi); bu olmadan form örtük gönderimi çalışmaz.
            await s('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...(key === 'Enter' ? { text: '\r' } : {}) });
            await s('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
            await sleep(wait);
          },
          async back(wait = 600) { await pg.eval('history.back()'); await sleep(wait); },
          async fwd(wait = 600) { await pg.eval('history.forward()'); await sleep(wait); },
          async shot(path, full = false) {
            let clip;
            if (full) { const h = await pg.eval('document.documentElement.scrollHeight'), w = await pg.eval('document.documentElement.clientWidth'); clip = { x: 0, y: 0, width: w, height: Math.min(h, 12000), scale: 1 }; }
            const r = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full, ...(clip ? { clip } : {}) });
            writeFileSync(path, Buffer.from(r.data, 'base64'));
          },
          async media(m) { await s('Emulation.setEmulatedMedia', { media: m || '' }); },
          async scheme(v) { await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: v }] }); },
          async pdf(path) { const r = await s('Page.printToPDF', { printBackground: true, preferCSSPageSize: true }); writeFileSync(path, Buffer.from(r.data, 'base64')); return r.data.length; },
          async close() { try { await send('Target.closeTarget', { targetId }); await send('Target.disposeBrowserContext', { browserContextId }); } catch {} },
        };
        await pg.size(width, height, mobile);
        if (scheme) await pg.scheme(scheme);
        return pg;
      },
      async close() { try { ws.close(); } catch {} cleanup(); },
    };
    return browser;
  } catch (e) { cleanup(); throw e; }
}
