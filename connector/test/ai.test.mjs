// AI adapter tests (B3). NO NETWORK: real adapters get a stub fetchImpl; nothing here passes the real fetch
// to an adapter, and the keys are obviously fake. Only the loopback connector server is contacted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validate } from '../lib/validate.mjs';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { create as claude } from '../adapters/ai-claude.mjs';
import { create as openai } from '../adapters/ai-openai.mjs';
import { create as gemini } from '../adapters/ai-gemini.mjs';
import { installNetGuard, guardedFetch, blocked } from '../lib/test-net-guard.mjs';

installNetGuard();

const here = dirname(fileURLToPath(import.meta.url));
const schema = (n) => JSON.parse(readFileSync(join(here, '..', 'schemas', `${n}.json`), 'utf8'));
const TOKEN = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
const KEY = 'test-key-not-real';
const tmp = mkdtempSync(join(tmpdir(), 'connector-ai-test-'));
const json = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function start(adapters) {
  const server = createConnector({ config: {}, adapters, token: TOKEN, logPath: join(tmp, 'log.jsonl') });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const close = () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); });
  return { base, close };
}
const post = (base, body) => fetch(`${base}/v1/ai`, { method: 'POST', headers: json, body: JSON.stringify(body) });

function stub(status, body) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: status >= 200 && status < 300, status, statusText: 'stub', json: async () => body };
  };
  return { fetchImpl, calls };
}

test('t11 /v1/ai through the server with the fake: {text} validates; brief_my_day returns JSON for each [id:x]', async () => {
  const s = await start(loadAdapters({}));
  try {
    const r = await post(s.base, { task: 'copilot_read', prompt: 'hello world', maxTokens: 100 });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.deepEqual(validate(schema('ai-response'), b), []);
    assert.equal(b.text, 'FAKE AI (copilot_read): hello world');

    const r2 = await post(s.base, { task: 'brief_my_day', prompt: 'a [id:x1] foo\nb [id:x2] bar', maxTokens: 500 });
    const parsed = JSON.parse((await r2.json()).text);
    assert.equal(parsed.accounts.length, 2);
    assert.deepEqual(parsed.accounts.map((a) => a.id), ['x1', 'x2']);
    assert.equal(parsed.accounts[0].flags[0].kind, 'drift');

    const bad = await post(s.base, { task: 'nope', prompt: 'x', maxTokens: 5 });
    assert.equal(bad.status, 400);
  } finally { await s.close(); }
});

test('t12a claude adapter request shape and parsing (stub fetch)', async () => {
  const { fetchImpl, calls } = stub(200, { content: [{ type: 'text', text: 'hi ' }, { type: 'text', text: 'there' }], stop_reason: 'end_turn' });
  const a = claude({ apiKey: KEY, model: '' }, fetchImpl);
  assert.equal(a.name, 'claude');
  const out = await a.complete({ task: 'debrief', prompt: 'P', maxTokens: 321 });
  assert.deepEqual(out, { text: 'hi \nthere', truncated: false });
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).host, 'api.anthropic.com');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['x-api-key'], KEY);
  assert.equal(calls[0].init.headers['anthropic-version'], '2023-06-01');
  assert.equal(calls[0].init.headers['anthropic-dangerous-direct-browser-access'], undefined);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.max_tokens, 321);
  assert.equal(body.model, 'claude-sonnet-5');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'P' }]);
  assert.ok(!calls[0].url.includes(KEY));
});

test('t12b openai adapter request shape and parsing (stub fetch)', async () => {
  const { fetchImpl, calls } = stub(200, { choices: [{ message: { content: ' answer ' }, finish_reason: 'stop' }] });
  const a = openai({ apiKey: KEY, model: 'gpt-custom' }, fetchImpl);
  assert.equal(a.name, 'openai');
  assert.deepEqual(await a.complete({ task: 'debrief', prompt: 'P', maxTokens: 77 }), { text: 'answer', truncated: false });
  assert.equal(new URL(calls[0].url).host, 'api.openai.com');
  assert.equal(new URL(calls[0].url).pathname, '/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${KEY}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.max_tokens, 77);
  assert.equal(body.model, 'gpt-custom');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'P' }]);
  assert.equal(openai({ apiKey: KEY }, fetchImpl).model, 'gpt-5.4-mini');
});

test('t12c gemini adapter request shape and parsing (stub fetch); key in header, never the URL', async () => {
  const { fetchImpl, calls } = stub(200, { candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] }, finishReason: 'STOP' }] });
  const a = gemini({ apiKey: KEY }, fetchImpl);
  assert.equal(a.name, 'gemini');
  assert.deepEqual(await a.complete({ task: 'debrief', prompt: 'P', maxTokens: 55 }), { text: 'a\nb', truncated: false });
  const u = new URL(calls[0].url);
  assert.equal(u.host, 'generativelanguage.googleapis.com');
  assert.equal(u.pathname, '/v1beta/models/gemini-2.5-flash:generateContent');
  assert.equal(calls[0].init.headers['x-goog-api-key'], KEY);
  assert.ok(!calls[0].url.includes(KEY));
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.generationConfig.maxOutputTokens, 55);
  assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: 'P' }] }]);
});

test('t12d a real adapter with no key refuses without calling fetch', async () => {
  const { fetchImpl, calls } = stub(200, {});
  for (const make of [claude, openai, gemini]) {
    const a = make({ apiKey: '' }, fetchImpl);
    await assert.rejects(a.complete({ task: 'debrief', prompt: 'P', maxTokens: 5 }), /no api key/i);
  }
  assert.equal(calls.length, 0);
});

test('t13 provider 401 (even one that echoes the key): adapter throws without the key; server answers 502 without it', async () => {
  for (const make of [claude, openai, gemini]) {
    const { fetchImpl } = stub(401, { error: { message: `bad key ${KEY} rejected` } });
    const a = make({ apiKey: KEY }, fetchImpl);
    await assert.rejects(a.complete({ task: 'debrief', prompt: 'P', maxTokens: 5 }), (e) => {
      assert.ok(!e.message.includes(KEY), `${a.name}: key leaked: ${e.message}`);
      assert.ok(e.message.length > 0);
      return true;
    });
    const s = await start({ ...loadAdapters({}), ai: a });
    try {
      const r = await post(s.base, { task: 'debrief', prompt: 'P', maxTokens: 5 });
      assert.equal(r.status, 502);
      const text = await r.text();
      assert.ok(!text.includes(KEY), `${a.name}: key in 502 body`);
      assert.ok(JSON.parse(text).error);
    } finally { await s.close(); }
  }
  // a non-401 provider message echoing the key is also scrubbed, and its text is kept
  const { fetchImpl } = stub(500, { error: { message: `overloaded for ${KEY}` } });
  await assert.rejects(openai({ apiKey: KEY }, fetchImpl).complete({ task: 'debrief', prompt: 'P', maxTokens: 5 }), (e) => /overloaded/.test(e.message) && !e.message.includes(KEY));
  // a network failure is mapped to a message that names the host, not the key
  const boom = async () => { throw new Error(`socket hang up ${KEY}`); };
  await assert.rejects(claude({ apiKey: KEY }, boom).complete({ task: 'debrief', prompt: 'P', maxTokens: 5 }), (e) => /api\.anthropic\.com/.test(e.message) && !e.message.includes(KEY));
});

test('t14 loadAdapters: only fake, claude, openai, gemini; anything else throws; key from config or env, never required for fake', async () => {
  assert.throws(() => loadAdapters({ ai: { adapter: 'mistral' } }), /adapter not built: mistral/);
  assert.equal(loadAdapters({}).ai.name, 'fake');
  const { fetchImpl, calls } = stub(200, { content: [{ type: 'text', text: 'ok' }] });
  const viaConfig = loadAdapters({ ai: { adapter: 'claude', apiKey: KEY } }, { fetchImpl, env: {} });
  assert.equal(viaConfig.ai.name, 'claude');
  assert.equal((await viaConfig.ai.complete({ task: 'debrief', prompt: 'P', maxTokens: 5 })).text, 'ok');
  const viaEnv = loadAdapters({ ai: { adapter: 'claude' } }, { fetchImpl, env: { CONNECTOR_AI_KEY: KEY } });
  await viaEnv.ai.complete({ task: 'debrief', prompt: 'P', maxTokens: 5 });
  assert.equal(calls[1].init.headers['x-api-key'], KEY);
});

test('t15 an api key in the request body is ignored, never forwarded', async () => {
  const { fetchImpl, calls } = stub(200, { content: [{ type: 'text', text: 'ok' }] });
  const s = await start({ ...loadAdapters({}), ai: claude({ apiKey: KEY }, fetchImpl) });
  try {
    const r = await post(s.base, { task: 'debrief', prompt: 'P', maxTokens: 5, apiKey: 'attacker-key-not-real' });
    assert.equal(r.status, 200);
    assert.equal(calls[0].init.headers['x-api-key'], KEY);
    assert.ok(!calls[0].init.body.includes('attacker-key-not-real'));
  } finally { await s.close(); }
});

test('t16 truncated: true on each provider cap signal, false otherwise; fake false', async () => {
  const ask = (a) => a.complete({ task: 'debrief', prompt: 'P', maxTokens: 5 });
  const cases = [
    [claude, { content: [{ type: 'text', text: 'x' }], stop_reason: 'max_tokens' }, { content: [{ type: 'text', text: 'x' }], stop_reason: 'end_turn' }],
    [openai, { choices: [{ message: { content: 'x' }, finish_reason: 'length' }] }, { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] }],
    [gemini, { candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'MAX_TOKENS' }] }, { candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'STOP' }] }],
  ];
  for (const [make, cut, whole] of cases) {
    assert.deepEqual(await ask(make({ apiKey: KEY }, stub(200, cut).fetchImpl)), { text: 'x', truncated: true });
    assert.deepEqual(await ask(make({ apiKey: KEY }, stub(200, whole).fetchImpl)), { text: 'x', truncated: false });
  }
  assert.equal((await ask(loadAdapters({}).ai)).truncated, false);
});

test('t17 server passes truncated through; schema accepts with and without it, rejects a non-boolean', async () => {
  const cut = claude({ apiKey: KEY }, stub(200, { content: [{ type: 'text', text: 'cut off' }], stop_reason: 'max_tokens' }).fetchImpl);
  const s = await start({ ...loadAdapters({}), ai: cut });
  try {
    const b = await (await post(s.base, { task: 'debrief', prompt: 'P', maxTokens: 5 })).json();
    assert.deepEqual(b, { text: 'cut off', truncated: true });
  } finally { await s.close(); }
  const s2 = await start(loadAdapters({}));
  try {
    const b = await (await post(s2.base, { task: 'debrief', prompt: 'P', maxTokens: 5 })).json();
    assert.equal(b.truncated, false);
  } finally { await s2.close(); }
  assert.deepEqual(validate(schema('ai-response'), { text: 'a' }), []);
  assert.deepEqual(validate(schema('ai-response'), { text: 'a', truncated: true }), []);
  assert.notDeepEqual(validate(schema('ai-response'), { text: 'a', truncated: 'yes' }), []);
});

test('t18 net guard: non-loopback fetch throws and is recorded; 127.0.0.1 is allowed', async () => {
  assert.equal(globalThis.fetch, guardedFetch);
  await assert.rejects(fetch('https://api.anthropic.com/v1/messages'), /NETWORK GUARD/);
  assert.equal(blocked.length, 1);
  blocked.length = 0; // the expected block; the after-hook asserts nothing else was blocked
  const s = await start(loadAdapters({}));
  try { assert.equal((await post(s.base, { task: 'debrief', prompt: 'P', maxTokens: 5 })).status, 200); } finally { await s.close(); }
});
