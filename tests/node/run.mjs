// Kullanım: node tests/node/run.mjs [takım ...] [--real-images]
// RR_BASE: yerel sunucu yerine verilen adres (ör. canlı site).
import { mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { launch } from './lib/driver.mjs';
import { startServer } from './lib/server.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const OUT = join(HERE, 'out');
const ORDER = ['smoke', 'chain', 'regress', 'arrive', 'sentences', 'v21', 'contrast', 'print', 'measure'];

const args = process.argv.slice(2);
const realImages = args.includes('--real-images');
const asked = args.filter((a) => !a.startsWith('--'));
const all = readdirSync(join(HERE, 'suites')).filter((f) => f.endsWith('.mjs')).map((f) => f.slice(0, -4));
const names = asked.length ? asked : ORDER.filter((n) => all.includes(n)).concat(all.filter((n) => !ORDER.includes(n)));
for (const n of names) if (!all.includes(n)) { console.error(`Bilinmeyen takım: ${n} (var olanlar: ${all.join(', ')})`); process.exit(2); }

mkdirSync(OUT, { recursive: true });
let passed = 0, failed = 0;
const failures = [];
let current = '';
const check = (name, ok, info = '') => {
  const good = !!ok;
  if (good) passed++; else { failed++; failures.push(`${current}: ${name}`); }
  console.log(`${good ? 'PASS' : 'FAIL'} [${current}] ${name}${good || !info ? '' : ' :: ' + String(info).slice(0, 400)}`);
};

let server, browser;
try {
  let base = process.env.RR_BASE;
  if (!base) { server = await startServer(ROOT); base = server.url; }
  if (!base.endsWith('/')) base += '/';
  browser = await launch({ realImages });
  for (const n of names) {
    current = n;
    console.log(`\n--- ${n} (${base}${realImages ? ', gerçek görseller' : ''})`);
    try {
      const mod = await import(pathToFileURL(join(HERE, 'suites', n + '.mjs')).href);
      await mod.default({ browser, base, check, out: OUT + '/' });
    } catch (e) { check('takım hatasız bitti', false, (e && e.stack) || e); }
  }
} catch (e) {
  console.error('Çalıştırıcı hatası:', (e && e.stack) || e);
  failed++; failures.push('runner');
} finally {
  try { await browser?.close(); } catch {}
  try { await server?.stop(); } catch {}
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) console.log('FAILED:\n  ' + failures.join('\n  '));
process.exit(failed ? 1 : 0);
