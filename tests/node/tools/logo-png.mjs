// Tek seferlik: logo/*.svg dosyalarından logo/*.png üretir (aynı piksel boyutlarında).
// Kullanım: node tests/node/tools/logo-png.mjs
// Tek Edge açılır, geçici profil kapanışta silinir. Saydam zeminli SVG'ler saydam kalır.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from '../lib/driver.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCALE = 3; // 260 -> 780, 722x170 -> 2166x510
// Beklenen piksel boyutları (v21'deki dosyalarla aynı); sapma hata sayılır.
const FILES = { reviewradar_ikon: [780, 780], reviewradar_logo_acik: [2166, 510], reviewradar_logo_koyu: [2166, 510], reviewradar_logo_seffaf: [2166, 510] };
const dims = (f) => { const d = readFileSync(f); return { w: d.readUInt32BE(16), h: d.readUInt32BE(20), type: d[25] }; };

const browser = await launch();
let failed = false;
try {
  const pg = await browser.page({ width: 800, height: 600 });
  for (const [name, [ew, eh]] of Object.entries(FILES)) {
    const svgPath = join(root, 'logo', name + '.svg'), pngPath = join(root, 'logo', name + '.png');
    const m = readFileSync(svgPath, 'utf8').match(/viewBox="0 0 (\d+) (\d+)"/);
    const w = +m[1], h = +m[2];
    await pg.s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: SCALE, mobile: false });
    await pg.s('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await pg.goto(pathToFileURL(svgPath).href, 400);
    const r = await pg.s('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(pngPath, Buffer.from(r.data, 'base64'));
    const after = dims(pngPath);
    const ok = after.w === ew && after.h === eh;
    if (!ok) failed = true;
    console.log(`${ok ? 'OK ' : 'HATA'} ${name}.png ${ew}x${eh} -> ${after.w}x${after.h} (tür ${after.type})`);
  }
  await pg.close();
} finally { await browser.close(); }
if (failed) process.exit(1);
