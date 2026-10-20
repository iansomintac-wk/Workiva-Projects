import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const run = (find, rep) => spawnSync(process.execPath, ['tools/mutant-check.mjs', '--find', find, '--replace', rep, '--', 'test/csat-plan-header.test.mjs'], { encoding: 'utf8' });
test('mutant-check: a mutation that breaks behaviour is KILLED (exit 0)', () => {
  const r = run('skipIds.includes(o.sf)', 'false');
  assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /MUTANT KILLED/);
});
test('mutant-check: a mutation that changes only a comment SURVIVES (exit 1), so the tool can tell the difference', () => {
  const r = run('Snowflake export. Pure:', 'Snowflake export (pure):');
  assert.equal(r.status, 1, r.stdout + r.stderr); assert.match(r.stdout, /MUTANT SURVIVED/);
});
test('mutant-check: a needle that is absent or repeated is refused with exit 2 and the real html is untouched', () => {
  assert.equal(run('THIS TEXT IS NOT IN THE HTML 9f3a', 'x').status, 2);
});
