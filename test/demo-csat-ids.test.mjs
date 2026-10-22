import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const seed = readFileSync('demo-seed.js', 'utf8');
const demo = JSON.parse(readFileSync('connector/fixtures/snowflake-csat-demo.json', 'utf8')).rows;

test('demo seed gives every customer a unique 20-character salesforceId', () => {
  assert.match(seed, /salesforceId: SF_IDS\[i\]/);
  assert.match(seed, /salesforceId: SF_IDS\[12\]/);
  assert.match(seed, /salesforceId: SF_IDS\[13 \+ i\]/);
  // the generator builds SF_IDS from GS_IDS (17 entries): evaluate its expression
  const m = seed.match(/const SF_IDS = GS_IDS\.map\(([\s\S]*?)\);\r?\n/);
  assert.ok(m, 'SF_IDS generator missing');
  const gs = Array.from({ length: 17 }, (_, i) => i);
  const sf = gs.map(eval(`(${m[1]})`));
  assert.equal(new Set(sf).size, 17);
  for (const id of sf) assert.match(id, /^001DEMO\d{10}AAA$/);
  assert.equal(sf[0], '001DEMO0000000001AAA');
});

test('demo CSAT fixture has 4+ rows, matched ids are in the seed, at least one is not', () => {
  assert.ok(demo.length >= 4);
  const sf = Array.from({ length: 17 }, (_, i) => '001DEMO00000000' + String(i + 1).padStart(2, '0') + 'AAA');
  const inSeed = demo.filter((r) => sf.includes(r.SALESFORCE_ACCOUNT_ID));
  assert.ok(inSeed.length >= 3);
  assert.ok(demo.length > inSeed.length, 'need an unmatched row');
  for (const r of demo) assert.ok(r.SALESFORCE_ACCOUNT_ID.length >= 15);
});

test('existing snowflake-csat.json is unchanged', () => {
  const h = createHash('sha256').update(readFileSync('connector/fixtures/snowflake-csat.json')).digest('hex');
  assert.equal(h, '829f0bd1faf9ef86d90607c85f7691596123c4d9d0cd054753a9f31d5f1c0b77');
});

test('snowflake-fake serves the demo file when fixture is demo', async () => {
  const { create } = await import('../connector/adapters/snowflake-fake.mjs');
  const rows = await create({ fixture: 'demo' }).listCsat();
  assert.deepEqual(rows, demo);
});
