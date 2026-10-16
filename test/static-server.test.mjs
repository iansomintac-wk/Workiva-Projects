import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from '../tools/static-server.mjs';

let base, dir, srv;
const get = (path, method = 'GET') => new Promise((res, rej) => {
  const r = http.request({ host: '127.0.0.1', port: srv.port, path, method }, resp => {
    const chunks = []; resp.on('data', c => chunks.push(c));
    resp.on('end', () => res({ status: resp.statusCode, headers: resp.headers, body: Buffer.concat(chunks).toString('utf8') }));
  });
  r.on('error', rej); r.end();
});
before(async () => {
  base = mkdtempSync(join(tmpdir(), 'static-server-test-'));
  dir = join(base, 'site'); mkdirSync(dir); mkdirSync(join(dir, 'sub')); mkdirSync(join(dir, 'withindex'));
  mkdirSync(join(base, 'outside'));
  writeFileSync(join(dir, 'index.html'), '<html>home</html>');
  writeFileSync(join(dir, 'app.js'), 'var a=1;');
  writeFileSync(join(dir, 'data.json'), '{}');
  writeFileSync(join(dir, 'withindex/index.html'), '<html>inner</html>');
  writeFileSync(join(base, 'secret.txt'), 'outside the served folder');
  writeFileSync(join(base, 'outside/secret2.txt'), 'outside two');
  srv = await startStaticServer(dir);
});
after(async () => { await srv.close(); rmSync(base, { recursive: true, force: true }); });

test('binds to 127.0.0.1 on a free port that is not 8790', () => {
  assert.equal(srv.server.address().address, '127.0.0.1');
  assert.ok(srv.port > 0 && srv.port !== 8790);
  assert.equal(srv.url, `http://127.0.0.1:${srv.port}/`);
});
test('GET / serves index.html as text/html', async () => {
  const r = await get('/');
  assert.equal(r.status, 200); assert.match(r.headers['content-type'], /^text\/html/); assert.equal(r.body, '<html>home</html>');
});
test('content types: .js, .json', async () => {
  assert.match((await get('/app.js')).headers['content-type'], /^text\/javascript/);
  assert.match((await get('/data.json')).headers['content-type'], /^application\/json/);
});
test('a folder with no index.html is 404, never a listing', async () => {
  const r = await get('/sub/'); assert.equal(r.status, 404); assert.doesNotMatch(r.body, /index of|app\.js/i);
});
test('a folder with an index.html serves it', async () => {
  assert.equal((await get('/withindex/')).body, '<html>inner</html>');
});
test('paths that climb out of the folder are 404 (raw and percent-encoded)', async () => {
  for (const p of ['/../secret.txt', '/%2e%2e/secret.txt', '/sub/../../secret.txt', '/..%2fsecret.txt']) {
    const r = await get(p); assert.ok(r.status === 404 || r.status === 400, p + ' -> ' + r.status); assert.doesNotMatch(r.body, /outside the served folder/);
  }
});
test('a symlinked FILE inside the folder that points outside is 404 (skipped with the reason if links cannot be made here)', async t => {
  try { symlinkSync(join(base, 'secret.txt'), join(dir, 'link.txt'), 'file'); }
  catch (e) { return t.skip('could not create a file symlink on this machine: ' + (e.code || e.message)); }
  const r = await get('/link.txt'); assert.equal(r.status, 404); assert.doesNotMatch(r.body, /outside the served folder/);
});
test('a directory junction/symlink inside the folder that points outside is 404 (skipped with the reason if it cannot be made)', async t => {
  try { symlinkSync(join(base, 'outside'), join(dir, 'linkdir'), 'junction'); }
  catch (e) { return t.skip('could not create a directory junction on this machine: ' + (e.code || e.message)); }
  const r = await get('/linkdir/secret2.txt'); assert.equal(r.status, 404); assert.doesNotMatch(r.body, /outside two/);
});
test('anything but GET is 405 with Allow: GET (POST, PUT, DELETE, HEAD)', async () => {
  for (const m of ['POST', 'PUT', 'DELETE', 'HEAD']) { const r = await get('/', m); assert.equal(r.status, 405, m); assert.equal(r.headers.allow, 'GET'); }
});
test('close() stops the server: a new connection is refused', async () => {
  const s2 = await startStaticServer(dir); const p = s2.port; await s2.close();
  await assert.rejects(() => new Promise((res, rej) => { const c = net.connect(p, '127.0.0.1'); c.on('connect', () => { c.destroy(); res(); }); c.on('error', rej); }));
});
