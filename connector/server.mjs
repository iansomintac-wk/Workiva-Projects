// Connector v1 server. Node built-ins only. Binds 127.0.0.1 only. See CONTRACT.md.
import http from 'node:http';
import crypto from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { validate } from './lib/validate.mjs';
import { loadAdapters } from './adapters/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const schemas = {};
const schema = (n) => (schemas[n] ||= JSON.parse(readFileSync(join(here, 'schemas', `${n}.json`), 'utf8')));
const MAX_BODY = 1024 * 1024;

function allowedOrigin(o) {
  return o === 'null' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || '');
}

function safeEqual(a, b) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function readBody(req) {
  return new Promise((res, rej) => {
    let size = 0; let over = false; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { over = true; chunks.length = 0; } else if (!over) chunks.push(c);
    });
    req.on('end', () => (over ? rej(Object.assign(new Error('request body over 1 MB'), { status: 413 })) : res(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', rej);
  });
}

export function createConnector({ config = {}, adapters, token, logPath, oauthCallback } = {}) {
  const ad = adapters || loadAdapters(config);

  async function route(req, url, send) {
    const m = req.method;
    const p = url.pathname;
    // Every response is validated against its schema before it is sent; a bad one is a 500.
    const ok = (name, body) => {
      const errs = validate(schema(name), body);
      if (errs.length) return send(500, { error: `internal: response failed ${name} schema: ${errs[0]}` });
      return send(200, body);
    };
    if (m === 'GET' && p === '/v1/health') {
      return ok('health', { version: '1', adapters: { gong: ad.gong.name, gainsight: ad.gainsight.name, ai: ad.ai.name } });
    }
    if (m === 'GET' && p === '/v1/calls') {
      const since = url.searchParams.get('since');
      if (since !== null && validate({ type: 'string', format: 'date-time' }, since).length) {
        return send(400, { error: 'since must be an ISO 8601 date-time' });
      }
      return ok('calls', { calls: await ad.gong.listCalls({ since: since || undefined }) });
    }
    if (m === 'GET' && p === '/v1/accounts') {
      return ok('accounts', { accounts: await ad.gainsight.listAccounts() });
    }
    if (m === 'POST' && p === '/v1/push') {
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) {
        if (e.status) throw e;
        return send(400, { error: 'invalid JSON' });
      }
      const errs = validate(schema('push-request'), body);
      if (errs.length) return send(400, { error: errs.join('; ') });
      let results;
      try { results = await ad.gainsight.push(body.items, { logPath }); } catch (e) {
        // A real Gainsight adapter's error text can carry tenant URLs or credentials: log it here, tell the browser only the generic fact.
        console.error(`push failed: ${String(e && e.message || e)}`);
        return send(502, { error: 'The push to Gainsight failed inside the connector. Nothing was confirmed; check the connector console.' });
      }
      return ok('push-response', { results });
    }
    if (m === 'POST' && p === '/v1/ai') {
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) {
        if (e.status) throw e;
        return send(400, { error: 'invalid JSON' });
      }
      const errs = validate(schema('ai-request'), body);
      if (errs.length) return send(400, { error: errs.join('; ') });
      // Only task, prompt and maxTokens reach the adapter; the key is never taken from the request.
      const r = await ad.ai.complete({ task: body.task, prompt: body.prompt, maxTokens: body.maxTokens });
      return ok('ai-response', { text: r.text, truncated: r.truncated === true });
    }
    return send(404, { error: 'not found' });
  }

  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const send = (status, body) => {
      const h = { Vary: 'Origin' };
      if (allowedOrigin(origin)) {
        h['Access-Control-Allow-Origin'] = origin;
        h['Access-Control-Allow-Headers'] = 'authorization, content-type';
        h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        h['Access-Control-Allow-Private-Network'] = 'true';
      }
      if (status === 204) { res.writeHead(204, h); return res.end(); }
      h['Content-Type'] = 'application/json';
      res.writeHead(status, h);
      return res.end(JSON.stringify(body));
    };
    try {
      if (req.method === 'OPTIONS') return send(204);
      // Setup only (connect-ready §3.3): Gainsight's OAuth redirect lands here without our token. Absent outside --setup.
      if (oauthCallback && req.method === 'GET' && (req.url || '').split('?')[0] === '/oauth/callback') {
        const r = await oauthCallback(new URL(req.url, 'http://127.0.0.1').searchParams);
        res.writeHead(r.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(r.text);
      }
      const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
      if (!m || !safeEqual(m[1], token)) { req.resume(); return send(401, { error: 'unauthorized' }); }
      return await route(req, new URL(req.url, 'http://127.0.0.1'), send);
    } catch (e) {
      if (e.status === 413) return send(413, { error: e.message });
      return send(502, { error: String(e.message || e) }); // anything thrown in a route is an adapter failure
    }
  });
}

function loadToken(file) {
  if (existsSync(file)) {
    const t = readFileSync(file, 'utf8').trim();
    if (t) return t;
  }
  const t = crypto.randomBytes(32).toString('hex');
  writeFileSync(file, `${t}\n`, { mode: 0o600 });
  return t;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const env = process.env;
  const cfgFile = env.CONNECTOR_CONFIG || (existsSync(join(here, 'config.json')) ? join(here, 'config.json') : join(here, 'config.example.json'));
  const config = JSON.parse(readFileSync(cfgFile, 'utf8'));
  const args = process.argv.slice(2);
  if (args.length) {
    const cli = await import('./lib/cli.mjs');
    if (args.some((a) => cli.COMMANDS.includes(a))) {
      const ask = cli.makeAsk();
      const code = await cli.runCli(args, { config, configPath: env.CONNECTOR_CONFIG || join(here, 'config.json'), stateDir: env.CONNECTOR_STATE_DIR, ask, createConnector });
      ask.close();
      process.exit(code);
    }
  }
  if (config.host && config.host !== '127.0.0.1') {
    console.warn(`warning: config.host "${config.host}" ignored; the connector binds 127.0.0.1 only`);
  }
  const token = loadToken(env.CONNECTOR_TOKEN_FILE || join(here, 'token.txt'));
  const server = createConnector({ config, adapters: loadAdapters(config), token, logPath: env.CONNECTOR_LOG || join(here, 'fake-gainsight-log.jsonl') });
  server.listen(config.port ?? 8787, '127.0.0.1', () => {
    console.log(`connector listening http://127.0.0.1:${server.address().port}`);
    console.log(`token ${token}`);
  });
}
