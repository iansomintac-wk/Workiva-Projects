// Tiny static server for tools/selfcheck.mjs --serve. GET only, no listing, only files under <dir>, 127.0.0.1 only.
import http from 'node:http';
import { realpathSync, statSync, createReadStream, existsSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.csv': 'text/csv; charset=utf-8',
};
const NEVER_PORT = 8790;

export async function startStaticServer(dir) {
  const root = realpathSync(resolve(dir));
  const inside = p => p === root || p.startsWith(root + sep);
  const plain = (res, code, extra = {}) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...extra }); res.end(); };
  const handler = (req, res) => {
    if (req.method !== 'GET') return plain(res, 405, { Allow: 'GET' });
    let p;
    try { p = decodeURIComponent(req.url.split('?')[0].split('#')[0]); } catch { return plain(res, 400); }
    if (p.includes('\0') || p.includes('\\')) return plain(res, 400);
    let file = resolve(join(root, p)), size;
    try {
      if (!inside(file)) return plain(res, 404);
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) return plain(res, 404);
      file = realpathSync(file);                       // follows symlinks and junctions: the REAL location must still be inside
      if (!inside(file) || !statSync(file).isFile()) return plain(res, 404);
      size = statSync(file).size;
    } catch { return plain(res, 404); }
    const rs = createReadStream(file);
    rs.on('error', () => { if (!res.headersSent) plain(res, 500); else res.destroy(); });
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    });
    rs.pipe(res);
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    const server = http.createServer(handler);
    await new Promise((ok, bad) => { server.once('error', bad); server.listen(0, '127.0.0.1', ok); });
    const port = server.address().port;
    if (port === NEVER_PORT) { await new Promise(r => server.close(r)); continue; }
    return {
      server, port, url: `http://127.0.0.1:${port}/`,
      close: () => new Promise(r => { server.closeAllConnections?.(); server.close(() => r()); }),
    };
  }
  throw new Error('could not get a free port other than ' + NEVER_PORT);
}
