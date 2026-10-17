import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { clockShim, CORS, aiBody, callReviewReply, connectorReply, connectorUrl, REVIEW_MARKER, EXTRACT_MARKER } from '../tools/sim/osm-day/lib/fakes.mjs';

const REVIEW = `You are helping ...\n${REVIEW_MARKER}\n- Your ONLY trusted sources`;
const EXTRACT = `${EXTRACT_MARKER} for an OSM's customer account`;
const PROSE = 'Answer in exactly this structure:\n1. Coverage gaps: none';
const hosts = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/x:generateContent',
};
const textOf = (url, body) => url.includes('anthropic') ? body.content[0].text
  : url.includes('openai') ? body.choices[0].message.content : body.candidates[0].content.parts[0].text;

function runShim(iso) {
  const ctx = vm.createContext({});
  vm.runInContext(clockShim(iso), ctx);
  return ctx;
}

test('clockShim moves new Date() to the fake day', () => {
  const ctx = runShim('2026-08-03');
  const d = vm.runInContext('new Date()', ctx);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(ymd, '2026-08-03');
});

test('clockShim keeps Date.now advancing', async () => {
  const ctx = runShim('2026-08-03');
  const a = vm.runInContext('Date.now()', ctx);
  await new Promise(r => setTimeout(r, 30));
  assert.ok(vm.runInContext('Date.now()', ctx) > a);
});

test('CORS allows origin and sets JSON content type', () => {
  const names = CORS.map(h => h.name.toLowerCase());
  assert.ok(names.includes('access-control-allow-origin'));
  assert.ok(names.includes('content-type'));
});

test('aiBody uses the provider wire format per host', () => {
  assert.ok(Array.isArray(aiBody(hosts.anthropic, PROSE).content));
  assert.ok(Array.isArray(aiBody(hosts.openai, PROSE).choices));
  assert.ok(Array.isArray(aiBody(hosts.gemini, PROSE).candidates));
});

test('review prompt yields review JSON with an email; {email:false} drops it', () => {
  for (const url of Object.values(hosts)) {
    const r = JSON.parse(textOf(url, aiBody(url, REVIEW)));
    assert.ok(Array.isArray(r.answers));
    assert.ok(r.email.subject && r.email.body);
    const n = JSON.parse(textOf(url, aiBody(url, REVIEW, { email: false })));
    assert.equal('email' in n, false);
  }
  assert.equal('email' in JSON.parse(callReviewReply({ email: false })), false);
  assert.ok(JSON.parse(callReviewReply({ email: true })).email.subject);
});

test('extraction prompt yields a JSON array; other prompts yield prose', () => {
  assert.ok(Array.isArray(JSON.parse(textOf(hosts.anthropic, aiBody(hosts.anthropic, EXTRACT)))));
  const prose = textOf(hosts.anthropic, aiBody(hosts.anthropic, PROSE));
  assert.throws(() => JSON.parse(prose));
  assert.match(prose, /\S/);
});

test('connectorReply answers sent for every item id', () => {
  const r = connectorReply(JSON.stringify({ items: [{ id: 'a' }, { id: 'b' }] }));
  assert.deepEqual(r.results.map(x => [x.id, x.status]), [['a', 'sent'], ['b', 'sent']]);
  assert.ok(r.results.every(x => x.externalId));
  assert.deepEqual(connectorReply('{}').results, []);
});

test('connectorUrl is loopback http and refuses 8790', () => {
  assert.match(connectorUrl(9901), /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.throws(() => connectorUrl(8790));
});
