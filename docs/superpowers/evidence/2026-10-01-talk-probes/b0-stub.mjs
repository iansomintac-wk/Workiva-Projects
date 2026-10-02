import http from 'node:http';
const mode = process.argv[2]; // 'cors' or 'nocors'
http.createServer((q, r) => {
  const h = { 'Content-Type': 'application/json' };
  if (mode === 'cors') {
    h['Access-Control-Allow-Origin'] = 'null';
    h['Access-Control-Allow-Headers'] = 'authorization,content-type';
    h['Access-Control-Allow-Private-Network'] = 'true';
    h['Access-Control-Allow-Methods'] = 'GET,POST';
  }
  console.log(q.method, q.url, 'origin=', q.headers.origin, 'pna=', q.headers['access-control-request-private-network']);
  if (q.method === 'OPTIONS') { r.writeHead(204, h); return r.end(); }
  r.writeHead(200, h); r.end(JSON.stringify({ ok: true }));
}).listen(Number(process.argv[3]), '127.0.0.1');
setTimeout(() => process.exit(0), 60000); // self-exit guard
