// Küçük statik sunucu: depo kökünü doğru MIME türleriyle sunar (Node http, bağımlılık yok).
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

export function startServer(rootDir) {
  const root = resolve(rootDir);
  const server = createServer((req, res) => {
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
    let file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try { if (statSync(file).isDirectory()) file = join(file, 'index.html'); statSync(file); } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolveP, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveP({
        url: `http://127.0.0.1:${port}/`,
        stop: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }),
      });
    });
  });
}
