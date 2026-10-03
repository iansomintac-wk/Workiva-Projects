# Connect-ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real `gong-rest` and `gainsight-rest` connector adapters from the vendors' public docs, with a proof
model, a write gate and guided setup, so the admin only has to help Ian connect. Nothing is called working until a
live `--check` passes.

**Architecture:** Each real adapter is one file in `connector/adapters/`. It takes an injected `fetch` and keeps its
local state in git-ignored files under a state dir: `proof.json`, `gainsight-tokens.json`, `sent-record.json` and
`dry-run.jsonl`. `/v1/health` reports proof state as a suffix on the existing adapter string, so there is no contract
bump. The new commands (`--check`, `--setup`, `--unlock-production`, `--measure-transcripts`) live in
`connector/lib/*.mjs`, and `server.mjs` dispatches to them. The tracker change is T-3 only: two new status-line
states.

**Tech Stack:** Node built-ins only (Node v26.5.0 measured on this laptop), `node:test`, the global `fetch` and
`Response`. The tracker is a single HTML file with `tools/selfcheck.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-02-connect-ready-design.md` (rulings CR1-CR6, defaults D1-D4). Vendor
facts: `docs/superpowers/evidence/connect-ready/research-vendor-apis.md` (cited below as "Q<n>") and
`research-write-safety.md`. Executors read the spec section a task names.

---

## Blockers for Ian

Two vendor facts that the spec needs are not in the research, and neither can be carried as config. The plan builds
the honest default for each (it fails loudly and sends nothing) unless you rule otherwise when you approve this plan.

- **B1. `Success Plan objective` push (spec §3.3, T-8).** Research Q11 confirms only *creating a new Success Plan
  together with its objectives* (`POST v2/successPlan?withObjectives=true`). Adding or updating one objective on an
  **existing** plan is UNCONFIRMED (Q11; gap 5), and the tracker sends `created`, `changed` and `verdict` events
  against one plan. A config value cannot supply an endpoint plus a body shape that nobody has read.
  **Default built:** a `Success Plan objective` item answers `failed` with "not sent: Success Plan objectives are
  not built yet …" and the item stays in the queue. The runbook and the admin ask add one question for the admin.
  **Your options:** (a) keep the default; (b) send these items to a Timeline activity as D1 does; (c) create a new
  Success Plan for each `created` event and fail the other events. (b) and (c) each change one function in T-8.
- **B2. "reads each back" in `--check --write` (spec §3.5, T-10).** The research has no read endpoint for a
  Timeline activity or a CTA. Q10 lists only update and delete; Q12 lists none. **Default built:** the sandbox
  self-test records the write proof from each create reply. It then prints
  `SKIP gainsight write read-back: no read endpoint is confirmed (research Q10, Q12); open the sandbox and look for the [SBX] TEST records`.
  **Your options:** (a) keep the default; (b) hold the write proof until the admin confirms a read endpoint.

## Spec gaps found (resolved in this plan; the lead may flag any to Ian)

1. **D2 substring.** D2 says UNPROVEN shows when an adapter string "contains `(unproven)`". But the spec's own
   string `"gainsight-rest (unproven, dry-run)"` does not contain `(unproven)`. T-3 therefore parses the trailing
   parenthesised flags (`unproven`, `dry-run`) instead of matching that substring.
2. **Gates are not nullable.** §3.3 says "a field the tenant lacks is `null`", but `schemas/accounts.json` requires
   `gates.*` to be booleans. T-7 maps each gate from a configured tenant field (`gainsight.gateFieldMap`). A gate is
   `true` only when that field is exactly `true`; otherwise it is `false`. The tracker offers a gate only on
   `=== true` (`buildGainsightDiff`), so `false` is the value that changes nothing.
3. **`openCtas`.** The research has no CTA list query, so `gainsight-rest` returns `openCtas: []`. A grep finds no
   `openCtas` reader in the tracker.
4. **Gong `accountRef` "from CRM context".** The research does not give the shape of Gong's context. T-5 always
   sends `{gainsightId:null, name:null}`, and the tracker's name and email matching applies, as the spec allows.
   `--check` records the keys it observes.
5. **Sandbox proof versus "pass tied to tenant".** A sandbox write proof is recorded against the sandbox tenant, so
   it can never match a production config. T-9 ties the **unlock record** to the production tenant: the unlock is
   void when the configured tenant changes. The sandbox proof is the recorded *basis* for that unlock. In both §3.4
   paths, `--unlock-production` requires the tenant URL to be typed back. That is stricter than §3.4 path 2.
6. **Gainsight OAuth reply field names** (the access and refresh token keys) and the callback query name are not in
   the research. They are config: `gainsight.oauth.accessTokenField`, `refreshTokenField` and
   `callbackCodeParam`, all empty. The raw token reply is saved to the git-ignored token file. When a name is unset,
   setup prints the **key names** it received, never the values. Nothing is guessed.
7. **CONTRACT.md "Before a real Gong adapter"** goes stale the moment `gong-rest` exists. The repo rule (docs change
   in the same commit as the code) moves that rewrite from T-13 to T-5. T-13's test verifies it.
8. **Baseline e2e.** The spec recorded "exit 1 in 2 of 2 runs". The lead measured exit 0 and then exit 1 (see
   Baseline). The failure is intermittent, not constant.

## Global Constraints

- The connector is Node built-ins only: no `package.json` and no third-party package.
- Every new connector test file installs `connector/lib/test-net-guard.mjs` (`installNetGuard()` at the top).
- No network calls: tests use a stubbed fetch only, passed in as `deps.fetchImpl`. Paid spend is $0.
- **Unproven means unproven.** No commit message, doc, comment or ledger line says an adapter "works with Gong" or
  "works with Gainsight". Say "tested on recorded-shape fixtures" and "unproven until `--check`".
- Every vendor constant carries its source URL and CONFIRMED or UNCONFIRMED from the research file. Never guess a
  field name: if a fact is missing, make it config (empty in `config.example.json`).
- Docs change in the same commit as the code they describe: `connector/CONTRACT.md`, the runbooks, the admin ask
  (`docs/superpowers/drafts/connector-admin-ask.md`), `connector/config.example.json`, and any count in prose.
- Never commit `connector/config.json`, `proof.json`, `gainsight-tokens.json`, `sent-record.json`,
  `dry-run.jsonl`, `token.txt`, keys, or `docs/research/internal/`.
- T-3 is the only tracker task. No schema bump (`CURRENT_SCHEMA_VERSION` untouched). Grep the tracker; never read
  it whole. Its first ~45 lines hold the editing rules: targeted edits, `:root` tokens only, and run the
  self-checks after any edit.
- Do not reopen rulings CR1-CR6 or D1-D4. If the code makes one impossible, stop and ask.
- Run the connector tests with the **file glob**: `node --test connector/test/*.test.mjs`. The directory form fails
  on Windows.
- Logs go to files under `$CLAUDE_JOB_DIR/tmp/`, never into context. Read only the summary lines.
- Do not name any new file with `secret` in it: `.gitignore` has `*secret*`, which would silently drop the file.
- Each build subagent uses `superpowers:test-driven-development`. A fresh Sonnet checker follows each task, and the
  lead re-runs the task's check command itself.

## Baseline (MEASURED 2026-10-02 by the lead at `51d1490`, worktree `connect-ready`)

| Measure | Value |
|---|---|
| Self-checks | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 473` → **473/473**, exit 0 |
| Connector tests | `node --test connector/test/*.test.mjs` → **43/43** |
| Demo | `node tools/connector-demo.mjs` → **exit 0** |
| e2e | `node tools/connector-e2e.mjs` → scenarios **7/7 in both of two runs**, but **exit 0, then exit 1** (EPERM from `rmSync` on the Chrome temp profile; intermittent). The spec's §2 recorded "exit 1 in 2 of 2 runs", which differs |
| Leftovers | **3** `connector-e2e-chrome-*` dirs in `%LOCALAPPDATA%\Temp` |

## File map

| File | Responsibility | Task |
|---|---|---|
| `tools/e2e-cleanup.mjs` (new) | e2e cleanup helpers that report problems instead of throwing them | T-1 |
| `tools/connector-e2e.mjs` | use those helpers; exit code = the scenarios' result | T-1 |
| `connector/lib/state.mjs` (new) | state dir, atomic JSON writes, tenant identity, proof store, health names | T-2 |
| `connector/adapters/index.mjs` | registry accepts `gong-rest` and `gainsight-rest` | T-2 |
| `connector/adapters/gong-rest.mjs` (new) | real Gong adapter | T-2 skeleton, T-5, T-10, T-12 |
| `connector/adapters/gainsight-rest.mjs` (new) | real Gainsight adapter: reads, push, dry-run, saved send record | T-2 skeleton, T-7, T-8, T-9, T-10 |
| `connector/lib/vendor-http.mjs` (new) | injected-fetch JSON requests, secret scrub, pacing, `pick` | T-5 |
| `connector/adapters/gainsight-auth.mjs` (new) | OAuth authorize URL, code exchange, rotating refresh, callback handler | T-6 |
| `connector/server.mjs` | `/oauth/callback` (setup only); CLI dispatch | T-6, T-9 |
| `connector/lib/write-gate.mjs` (new) | §3.4 gate decision and the first-send limit | T-9 |
| `connector/lib/unlock.mjs` (new) | `--unlock-production` | T-9 |
| `connector/lib/cli.mjs` (new) | `makeAsk` (hidden input), `runCli`, `COMMANDS` | T-9, T-10, T-11, T-12 |
| `connector/lib/check.mjs` (new) | `--check`, `--check --write` | T-10 |
| `connector/lib/setup.mjs` (new) | `--setup` | T-11 |
| `connector/lib/measure.mjs` (new) | `--measure-transcripts` | T-12 |
| `connector/fixtures/vendor/*.json` (new) | recorded-shape fixtures, each with a `_source` header | T-4 |
| `connector/CONNECT-GONG.md`, `connector/CONNECT-GAINSIGHT.md` (new) | runbooks | T-13 |
| `osm-book-of-business-tracker-1.0.html`, `tools/selfchecks.js` | D2 status line, checks c2j and c2k | T-3 |

Test count after each task (A-1): 43 → T-1 46 → T-2 52 → T-3 52 → T-4 55 → T-5 62 → T-6 70 → T-7 77 → T-8 85 →
T-9 93 → T-10 100 → T-11 104 → T-12 107 → T-13 110. If a build subagent's count differs, it says why in its reply.

## Model per task

| Task | Build model | Why |
|---|---|---|
| T-1, T-2, T-3, T-5, T-7, T-8, T-10, T-11, T-12, T-13 | Sonnet | the plan gives the code; implementation, not design |
| T-4 | Haiku | transcription of fixture contents given in full below |
| T-6 | top model | OAuth rotation and single-flight refresh; a mistake locks Ian out for a year (spec allows) |
| T-9 | top model | write gate on production data (spec allows) |
| T-14 | top model | final whole-branch review |
| every checker | Sonnet | review against the plan task and spec section |

## Acceptance map

| Check | Measured by | Command and expected |
|---|---|---|
| A-1 | every task | `node --test connector/test/*.test.mjs` → `# pass <N>`, `# fail 0` with N from the count table above |
| A-2 | T-3, re-run in T-14 | `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` → 475/475, exit 0 (new checks: c2j, c2k) |
| A-3 | T-1, re-run in T-14 | the T-1 check script → `exit 0 0; chrome dirs before B after B` (after equals before) |
| A-4 | T-2 and T-14 | `node tools/connector-demo.mjs` → exit 0; summary still 6 calls, 17 accounts, 2 sent / 1 forceFail, fake AI |
| A-5 | every new test file, verified in T-14 | `git diff --name-only --diff-filter=A 51d1490..HEAD -- connector/test` piped to `xargs grep -L "installNetGuard()"` → empty output; every test file's `after()` asserts `blocked` is empty |
| A-6 | T-14 | secret grep in T-14 step 3 → every hit is a `FAKE-` test string, a config key name or `[redacted]` |
| A-7 | T-4 | `node --test connector/test/vendor-fixtures.test.mjs` → 3 pass |
| A-8 | T-10, re-run in T-14 | `node connector/server.mjs --check` (no `config.json`) → only `SKIP` lines, exit 0; also test `check: A-8 …` |
| A-9 | T-3 (c2h unchanged) and the e2e in T-1/T-14 | selfcheck c2h passes; the e2e scenario `e1` passes |

---

### Task T-1: e2e harness — cleanup reported, not thrown

**Model:** Sonnet. **Spec:** §2 "End-to-end", §4 T-1, A-3.

**Files:**
- Create: `tools/e2e-cleanup.mjs`
- Modify: `tools/connector-e2e.mjs` (imports; `cleanup()`; the last ~5 lines after `main()`)
- Test: `connector/test/e2e-cleanup.test.mjs`

**Interfaces:**
- Produces: `removeDir(path, label, rm = rmSync) -> string|null` (null on success, a one-line problem otherwise);
  `waitForExit(child, ms) -> Promise<void>`.

- [ ] **Step 1: Write the failing test** `connector/test/e2e-cleanup.test.mjs`

```js
// connect-ready T-1: e2e cleanup problems are reported as text, never thrown. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { removeDir, waitForExit } from '../../tools/e2e-cleanup.mjs';

installNetGuard();

test('e2e cleanup: an EPERM from rm is returned as one line, not thrown', () => {
  const rm = () => { throw Object.assign(new Error('operation not permitted'), { code: 'EPERM' }); };
  const msg = removeDir('C:/fake/profile', 'Chrome temp profile', rm);
  assert.equal(msg, 'Chrome temp profile not removed (EPERM): C:/fake/profile');
});

test('e2e cleanup: a removable dir is removed, returns null, and rm is asked to retry 12 times', () => {
  const d = mkdtempSync(join(tmpdir(), 'e2e-cleanup-test-'));
  writeFileSync(join(d, 'f.txt'), 'x');
  let opts = null;
  const msg = removeDir(d, 'temp', (p, o) => { opts = o; rmSync(p, o); });
  assert.equal(msg, null);
  assert.equal(existsSync(d), false);
  assert.deepEqual(opts, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
});

test('e2e cleanup: waitForExit resolves on exit, and after the timeout when no exit comes', async () => {
  const child = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null });
  const p = waitForExit(child, 5000);
  child.emit('exit', 0);
  await p;
  const t0 = Date.now();
  await waitForExit(Object.assign(new EventEmitter(), { exitCode: null, signalCode: null }), 50);
  assert.ok(Date.now() - t0 >= 45);
  await waitForExit(null, 5000); // no child: resolves at once
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/e2e-cleanup.test.mjs`
Expected: FAIL, `Cannot find module …tools/e2e-cleanup.mjs`.

- [ ] **Step 3: Create `tools/e2e-cleanup.mjs`**

```js
// Cleanup helpers for tools/connector-e2e.mjs (connect-ready T-1). A cleanup problem is reported, never thrown,
// so the harness exit code is the scenarios' result. Node built-ins only.
import { rmSync } from 'node:fs';

// Node retries EPERM/EBUSY/ENOTEMPTY with a linear backoff: 12 tries at 250 ms steps waits up to ~19.5 s in all.
export function removeDir(path, label, rm = rmSync) {
  try { rm(path, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 }); return null; }
  catch (e) { return `${label} not removed (${e && (e.code || e.message)}): ${path}`; }
}

export function waitForExit(child, ms) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((r) => { const t = setTimeout(r, ms); child.once('exit', () => { clearTimeout(t); r(); }); });
}
```

- [ ] **Step 4: Use the helpers in `tools/connector-e2e.mjs`**

Add `import { removeDir, waitForExit } from './e2e-cleanup.mjs';` beside the other imports. Remove `rmSync` from
the `node:fs` import only if nothing else uses it (grep first). Replace `async function cleanup() {…}` with:

```js
// Cleanup problems are reported, never thrown (connect-ready T-1): the exit code is the scenarios' result.
async function cleanup() {
  killChrome();
  await stopConnector();
  await waitForExit(chrome, 5000);
  await sleep(500);
  const problems = [];
  if (!keepLogs) { const p = removeDir(tmp, 'temp config'); if (p) problems.push(p); }
  const p = removeDir(profile, 'Chrome temp profile'); if (p) problems.push(p);
  return problems;
}
```

Replace the tail after `try { code = await main(); } catch …` with:

```js
const problems = await cleanup().catch((e) => [`cleanup threw: ${e && e.message || e}`]);
for (const p of problems) console.log(`cleanup warning: ${p}`);
console.log(`cleanup: ${problems.length ? `${problems.length} problem(s), see warnings above` : 'temp config/profile removed'}${keepLogs ? ` (kept: ${tmp})` : ''}`);
process.exit(code);
```

- [ ] **Step 5: Run the unit test and the suite**

Run: `node --test connector/test/e2e-cleanup.test.mjs` → 3 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 46`, `# fail 0`.

- [ ] **Step 6: Run the check (PowerShell): the e2e twice, counting leftover dirs**

```powershell
$t = [System.IO.Path]::GetTempPath(); $before = (Get-ChildItem $t -Directory -Filter 'connector-e2e-chrome-*').Count
node tools/connector-e2e.mjs > "$env:CLAUDE_JOB_DIR\tmp\e2e-1.log"; $c1 = $LASTEXITCODE
node tools/connector-e2e.mjs > "$env:CLAUDE_JOB_DIR\tmp\e2e-2.log"; $c2 = $LASTEXITCODE
$after = (Get-ChildItem $t -Directory -Filter 'connector-e2e-chrome-*').Count
"exit $c1 $c2; chrome dirs before $before after $after"
Select-String -Path "$env:CLAUDE_JOB_DIR\tmp\e2e-*.log" -Pattern 'connector-e2e:|cleanup'
```

Expected: `exit 0 0; chrome dirs before B after B` (B = 3 on the lead's machine). Both logs show
`connector-e2e: 7/7 passed, 0 failed` and `cleanup: temp config/profile removed`. If a `cleanup warning` line
appears, A-3 is not met. Use `superpowers:systematic-debugging`, and do not raise the retries blindly.

- [ ] **Step 7: Commit**

```bash
git add tools/e2e-cleanup.mjs tools/connector-e2e.mjs connector/test/e2e-cleanup.test.mjs
git commit -m "T-1: e2e cleanup problems are reported, not thrown; exit code is the scenarios' result"
```

---

### Task T-2: proof store, health suffixes, registry, config.example, .gitignore

**Model:** Sonnet. **Spec:** §3.2, §3.7 (`config.example.json`, `.gitignore`), §4 T-2.

**Files:**
- Create: `connector/lib/state.mjs`, `connector/adapters/gong-rest.mjs` (skeleton), `connector/adapters/gainsight-rest.mjs` (skeleton)
- Modify: `connector/adapters/index.mjs`, `connector/config.example.json`, `.gitignore`, `connector/CONTRACT.md`
- Test: `connector/test/proof.test.mjs`

**Interfaces:**
- Produces (`connector/lib/state.mjs`):
  - `DEFAULT_STATE_DIR` (the `connector/` dir) and `FILES = {proof:'proof.json', tokens:'gainsight-tokens.json', sent:'sent-record.json', dryRun:'dry-run.jsonl'}`
  - `resolveStateDir(dir?) -> string` (`dir`, else `env.CONNECTOR_STATE_DIR`, else `DEFAULT_STATE_DIR`)
  - `readJson(path, fallback)` and `writeJsonAtomic(path, value, {writeFile}?)` (write `path.tmp`, then rename; throws on failure)
  - `tenantOf('gong'|'gainsight', cfg) -> object` and `sameTenant(a, b) -> boolean`
  - `loadProof(dir?)`, `saveProof(dir?, proof)`, `recordProof(dir?, slot, kind, {tenant, shapes?, environment?, now?})`, `isProven(proof, slot, kind, tenant) -> boolean`
  - `healthName(base, {proven, dryRun}) -> string`
- Produces (registry): `loadAdapters(config, {fetchImpl, env, stateDir, sleep, now, tokenSource, pageLimit, ...rest})`. A real adapter is built as `factory(cfg, {fetchImpl, stateDir, sleep, now, tokenSource, pageLimit})`.
- Real adapter objects expose `name` as a **getter** that re-reads `proof.json` on every `/v1/health`, so a
  `--check` run in another process shows up without a restart.

- [ ] **Step 1: Write the failing test** `connector/test/proof.test.mjs`

```js
// connect-ready T-2: proof store, health suffixes, registry, config.example, .gitignore. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { healthName, recordProof, loadProof, isProven, tenantOf } from '../lib/state.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'proof-test-'));
const GONG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', myEmail: 'ian.fake@fake-osm.invalid' };
const GS = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: 'https://fake-tenant.gainsightcloud.invalid', apiBaseUrl: 'https://fake-tenant.gainsightcloud.invalid', tenantId: 'FAKE-TENANT-1' };

test('proof: healthName gives exactly the spec suffixes', () => {
  assert.equal(healthName('gong-rest', { proven: false }), 'gong-rest (unproven)');
  assert.equal(healthName('gong-rest', { proven: true }), 'gong-rest');
  assert.equal(healthName('gainsight-rest', { proven: false, dryRun: true }), 'gainsight-rest (unproven, dry-run)');
  assert.equal(healthName('gainsight-rest', { proven: true, dryRun: true }), 'gainsight-rest (dry-run)');
  assert.equal(healthName('gainsight-rest', { proven: true, dryRun: false }), 'gainsight-rest');
  assert.equal(healthName('gainsight-rest', { proven: false, dryRun: false }), 'gainsight-rest (unproven)');
});

test('proof: recorded per slot and kind, void when the tenant differs (CR3)', () => {
  const dir = tmp();
  assert.equal(isProven(loadProof(dir), 'gong', 'read', tenantOf('gong', GONG)), false);
  recordProof(dir, 'gong', 'read', { tenant: tenantOf('gong', GONG), shapes: { pageKeys: ['calls'] }, now: new Date('2026-10-02T12:00:00Z') });
  const p = loadProof(dir);
  assert.equal(p.gong.read.state, 'proven');
  assert.equal(p.gong.read.provenAt, '2026-10-02T12:00:00.000Z');
  assert.equal(isProven(p, 'gong', 'read', tenantOf('gong', GONG)), true);
  assert.equal(isProven(p, 'gong', 'read', tenantOf('gong', { ...GONG, baseUrl: 'https://other.gong.invalid' })), false);
  assert.equal(isProven(p, 'gainsight', 'read', tenantOf('gainsight', GS)), false);
});

test('registry: gong-rest and gainsight-rest load and report their state; unknown names still throw', () => {
  const dir = tmp();
  const a = loadAdapters({ gong: GONG, gainsight: GS }, { stateDir: dir });
  assert.equal(a.gong.name, 'gong-rest (unproven)');
  assert.equal(a.gainsight.name, 'gainsight-rest (unproven, dry-run)'); // dryRun absent = true
  recordProof(dir, 'gong', 'read', { tenant: tenantOf('gong', GONG) });
  recordProof(dir, 'gainsight', 'read', { tenant: tenantOf('gainsight', GS) });
  assert.equal(a.gong.name, 'gong-rest');               // getter re-reads proof.json
  assert.equal(a.gainsight.name, 'gainsight-rest (dry-run)');
  const live = loadAdapters({ gainsight: { ...GS, dryRun: false } }, { stateDir: dir });
  assert.equal(live.gainsight.name, 'gainsight-rest');
  assert.throws(() => loadAdapters({ gong: { adapter: 'gong-live' } }), /adapter not built: gong-live/);
});

test('health: /v1/health carries the suffix strings and still validates health.json', async () => {
  const dir = tmp();
  const token = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
  const server = createConnector({ config: {}, adapters: loadAdapters({ gong: GONG, gainsight: GS }, { stateDir: dir }), token });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/v1/health`, { headers: { Authorization: `Bearer ${token}` } });
    const b = await r.json();
    assert.deepEqual(b.adapters, { gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'fake' });
    assert.deepEqual(validate(JSON.parse(readFileSync(join(root, 'schemas', 'health.json'), 'utf8')), b), []);
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});

test('config.example.json: every adapter fake, dryRun true, every other string empty', () => {
  const cfg = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
  for (const slot of ['gong', 'gainsight', 'ai']) assert.equal(cfg[slot].adapter, 'fake', slot);
  assert.equal(cfg.gainsight.dryRun, true);
  const bad = [];
  (function walk(o, path) {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') walk(v, `${path}${k}.`);
      else if (typeof v === 'string' && k !== 'adapter' && v !== '') bad.push(`${path}${k}`);
    }
  })(cfg, '');
  assert.deepEqual(bad, []);
});

test('.gitignore keeps every local state file out of git', () => {
  const lines = readFileSync(join(root, '..', '.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
  for (const f of ['connector/config.json', 'connector/token.txt', 'connector/proof.json', 'connector/gainsight-tokens.json', 'connector/sent-record.json', 'connector/dry-run.jsonl']) {
    assert.ok(lines.includes(f), `${f} missing from .gitignore`);
  }
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/proof.test.mjs`
Expected: FAIL, `Cannot find module …connector/lib/state.mjs`.

- [ ] **Step 3: Create `connector/lib/state.mjs`**

```js
// Local state for the real adapters (connect-ready §3.2). Every file here is git-ignored. Node built-ins only.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const DEFAULT_STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FILES = { proof: 'proof.json', tokens: 'gainsight-tokens.json', sent: 'sent-record.json', dryRun: 'dry-run.jsonl' };

export function resolveStateDir(dir) { return dir || process.env.CONNECTOR_STATE_DIR || DEFAULT_STATE_DIR; }

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Write a temp file, then rename, so a crash never leaves half a file. Throws on failure; the caller decides.
export function writeJsonAtomic(path, value, { writeFile = writeFileSync } = {}) {
  const tmp = `${path}.tmp`;
  writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, path);
}

export function tenantOf(slot, cfg = {}) {
  if (slot === 'gong') return { baseUrl: String(cfg.baseUrl || '').replace(/\/+$/, '') };
  if (slot === 'gainsight') {
    return { appUrl: String(cfg.appUrl || '').replace(/\/+$/, ''), apiBaseUrl: String(cfg.apiBaseUrl || cfg.appUrl || '').replace(/\/+$/, ''), tenantId: String(cfg.tenantId || '') };
  }
  throw new Error(`no tenant for slot ${slot}`);
}
export const sameTenant = (a, b) => !!a && !!b && JSON.stringify(a) === JSON.stringify(b);

export function loadProof(dir) { return readJson(join(resolveStateDir(dir), FILES.proof), {}); }
export function saveProof(dir, proof) { writeJsonAtomic(join(resolveStateDir(dir), FILES.proof), proof); }

// proof.json: {gong:{read}, gainsight:{read, write, unlock}}. A missing entry means "unproven".
export function recordProof(dir, slot, kind, { tenant, shapes = {}, environment = null, now = new Date() } = {}) {
  const proof = loadProof(dir);
  proof[slot] = { ...(proof[slot] || {}), [kind]: { state: 'proven', provenAt: now.toISOString(), tenant, environment, shapes } };
  saveProof(dir, proof);
  return proof;
}

// CR3: a proof recorded against another tenant is void.
export function isProven(proof, slot, kind, tenant) {
  const p = proof && proof[slot] && proof[slot][kind];
  return !!p && p.state === 'proven' && sameTenant(p.tenant, tenant);
}

// /v1/health strings (§3.2): "gong-rest (unproven)", "gainsight-rest (unproven, dry-run)", "gainsight-rest (dry-run)", "gainsight-rest".
export function healthName(base, { proven, dryRun = false }) {
  const flags = [];
  if (!proven) flags.push('unproven');
  if (dryRun) flags.push('dry-run');
  return flags.length ? `${base} (${flags.join(', ')})` : base;
}
```

- [ ] **Step 4: Create the two adapter skeletons and register them**

`connector/adapters/gong-rest.mjs`:

```js
// Real Gong adapter (connect-ready §3.3). T-2 registers the name and its proof state; listCalls arrives in T-5.
import { loadProof, isProven, tenantOf, healthName } from '../lib/state.mjs';

export function create(cfg = {}, deps = {}) {
  return {
    get name() { return healthName('gong-rest', { proven: isProven(loadProof(deps.stateDir), 'gong', 'read', tenantOf('gong', cfg)) }); },
    async listCalls() { throw new Error('gong-rest: listCalls is not built yet (connect-ready T-5)'); },
  };
}
```

`connector/adapters/gainsight-rest.mjs`:

```js
// Real Gainsight CS adapter (connect-ready §3.3). T-2 registers the name and its proof state; reads arrive in T-7, push in T-8.
import { loadProof, isProven, tenantOf, healthName } from '../lib/state.mjs';

export function create(cfg = {}, deps = {}) {
  return {
    get name() { return healthName('gainsight-rest', { proven: isProven(loadProof(deps.stateDir), 'gainsight', 'read', tenantOf('gainsight', cfg)), dryRun: cfg.dryRun !== false }); },
    async listAccounts() { throw new Error('gainsight-rest: listAccounts is not built yet (connect-ready T-7)'); },
    async push() { throw new Error('gainsight-rest: push is not built yet (connect-ready T-8)'); },
  };
}
```

In `connector/adapters/index.mjs`, update the header comment to read "Gong and Gainsight may be fake or the real
gong-rest / gainsight-rest (unproven until `--check`)". Then:

```js
import { create as gongRest } from './gong-rest.mjs';
import { create as gainsightRest } from './gainsight-rest.mjs';

const BUILT = {
  gong: { fake: gong, 'gong-rest': gongRest },
  gainsight: { fake: gainsight, 'gainsight-rest': gainsightRest },
  ai: { fake: aiFake, claude: aiClaude, openai: aiOpenai, gemini: aiGemini },
};
const REAL = new Set(['gong-rest', 'gainsight-rest']);

export function loadAdapters(config = {}, opts = {}) {
  const { fetchImpl, env = process.env, stateDir, sleep, now, tokenSource, pageLimit, ...rest } = opts;
  const out = {};
  for (const slot of Object.keys(BUILT)) {
    const cfg = config[slot] || {};
    const name = cfg.adapter || 'fake';
    const factory = BUILT[slot][name];
    if (!factory) throw new Error(`adapter not built: ${name}`);
    if (slot === 'ai' && name !== 'fake') {
      out[slot] = factory({ model: cfg.model, apiKey: cfg.apiKey || env.CONNECTOR_AI_KEY || '' }, fetchImpl || globalThis.fetch);
    } else if (REAL.has(name)) {
      out[slot] = factory(cfg, { fetchImpl, stateDir, sleep, now, tokenSource, pageLimit });
    } else {
      out[slot] = factory({ ...cfg, ...rest });
    }
  }
  return out;
}
```

- [ ] **Step 5: Update config, .gitignore and CONTRACT.md (same commit)**

`connector/config.example.json`:

```json
{
  "port": 8787,
  "gong": { "adapter": "fake", "baseUrl": "", "myEmail": "" },
  "gainsight": { "adapter": "fake", "environment": "", "appUrl": "", "apiBaseUrl": "", "tenantId": "", "dryRun": true },
  "ai": { "adapter": "fake", "model": "", "apiKey": "" }
}
```

Append these lines under the existing `# Connector local secrets and push log (never commit)` block in `.gitignore`:

```
connector/proof.json
connector/gainsight-tokens.json
connector/sent-record.json
connector/dry-run.jsonl
connector/*.tmp
```

Make these edits in `connector/CONTRACT.md`:
- `GET /v1/health`: replace "each adapter is `"fake"` or a provider name" with: "each adapter is `"fake"`, an AI
  provider name, or a real adapter name with a state suffix: `gong-rest (unproven)`, `gong-rest`,
  `gainsight-rest (unproven, dry-run)`, `gainsight-rest (unproven)`, `gainsight-rest (dry-run)`, `gainsight-rest`.
  `unproven` means no live `--check` has passed against the configured tenant (`connector/proof.json`). A real
  adapter is unproven until `--check`, whatever its tests say. `dry-run` means Gainsight push builds requests and
  sends nothing."
- Versioning: append "Adapter state suffixes in `/v1/health` (connect-ready, 2026-10-02): string values only, no
  shape change."
- Add a section `## Local state files (git-ignored)`:
  - `proof.json`: per adapter, `state`, `provenAt`, `tenant` and the observed `shapes`. Gainsight has separate
    `read` and `write` proofs plus `unlock`. A proof is void when the configured tenant differs.
  - `gainsight-tokens.json`, `sent-record.json` and `dry-run.jsonl`: one line each, "described with the task that
    writes it". Fill each in as its task lands; T-2 lists only `proof.json`.
  - `CONNECTOR_STATE_DIR` overrides the folder (used by the tests).

- [ ] **Step 6: Run the tests, the suite and the demo**

Run: `node --test connector/test/proof.test.mjs` → 6 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 52`, `# fail 0`. Then `node tools/connector-demo.mjs` → exit 0, same summary (A-4).

- [ ] **Step 7: Commit**

```bash
git add connector/lib/state.mjs connector/adapters/gong-rest.mjs connector/adapters/gainsight-rest.mjs connector/adapters/index.mjs connector/config.example.json .gitignore connector/CONTRACT.md connector/test/proof.test.mjs
git commit -m "T-2: proof store, health state suffixes, registry accepts gong-rest/gainsight-rest (unproven until --check)"
```

---

### Task T-3: tracker status line D2 (UNPROVEN / DRY RUN)

**Model:** Sonnet. **Spec:** §2 "Tracker status line", D2, A-2, A-9. **The only tracker task. No schema bump.**

**Files:**
- Modify: `osm-book-of-business-tracker-1.0.html`: the `ui` init (grep `connector: {state: 'unset'`),
  `applyConnectorHealth`, `checkConnectorHealth` (the unset branch) and `renderConnectorStatus`. Grep the symbol
  names; line numbers drift.
- Test: `tools/selfchecks.js`: add c2j and c2k right after the c2h block (grep `// c2h`).

**Interfaces:**
- Consumes: the health strings from T-2.
- Produces: `ui.connector.unproven` and `ui.connector.dryRun` (booleans), and
  `connectorAdapterFlags(name) -> string[]`.

- [ ] **Step 1: Add the failing checks** to `tools/selfchecks.js`, directly after the c2h IIFE

```js
  (function(){                                   // c2j
    let ok = false, detail = '';
    const saved = ui.connector;
    try{
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'claude'}});
      const unp = ui.connector.unproven === true && renderConnectorStatus().indexOf('Connector: UNPROVEN') !== -1
        && renderConnectorStatus().indexOf('--status-watch-text') !== -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest', gainsight: 'gainsight-rest (dry-run)', ai: 'claude'}});
      const dry = ui.connector.unproven === false && ui.connector.dryRun === true
        && renderConnectorStatus().indexOf('Connector: DRY RUN') !== -1 && renderConnectorStatus().indexOf('--status-watch-text') !== -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest', gainsight: 'gainsight-rest', ai: 'claude'}});
      const live = ui.connector.unproven === false && ui.connector.dryRun === false && renderConnectorStatus().indexOf('Connector: connected') !== -1;
      ok = unp && dry && live; detail = JSON.stringify({unp, dry, live});
    }catch(err){ detail = err.message; }
    finally{ ui.connector = saved; }
    check('connector c2j: an adapter flagged "unproven" shows Connector: UNPROVEN, "dry-run" shows Connector: DRY RUN, no flag shows connected (D2)', ok, detail);
  })();
  (function(){                                   // c2k
    let ok = false, detail = '';
    const saved = ui.connector;
    try{
      applyConnectorHealth({version: '1', adapters: {gong: 'fake', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'fake'}});
      const fakeFirst = renderConnectorStatus().indexOf('FAKE DATA') !== -1 && renderConnectorStatus().indexOf('UNPROVEN') === -1;
      applyConnectorHealth({version: '1', adapters: {gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (dry-run)', ai: 'claude'}});
      const unpFirst = renderConnectorStatus().indexOf('UNPROVEN') !== -1 && renderConnectorStatus().indexOf('DRY RUN') === -1;
      applyConnectorHealth(null, 'OFFLINE');
      const reset = ui.connector.unproven === false && ui.connector.dryRun === false;
      ok = fakeFirst && unpFirst && reset; detail = JSON.stringify({fakeFirst, unpFirst, reset});
    }catch(err){ detail = err.message; }
    finally{ ui.connector = saved; }
    check('connector c2k: FAKE DATA outranks UNPROVEN, UNPROVEN outranks DRY RUN, offline clears both flags', ok, detail);
  })();
```

- [ ] **Step 2: Run the self-checks and see them fail**

Run: `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475 > "$CLAUDE_JOB_DIR/tmp/sc.log"; tail -n 5 "$CLAUDE_JOB_DIR/tmp/sc.log"`
Expected: c2j and c2k FAIL (473 of 475 pass), non-zero exit.

- [ ] **Step 3: Implement D2 in the tracker** (targeted edits only; tokens only, no hex)

The `ui` init: change `connector: {state: 'unset', fake: false, adapters: {}, checkedAt: null}` to
`connector: {state: 'unset', fake: false, unproven: false, dryRun: false, adapters: {}, checkedAt: null}`.

Above `function applyConnectorHealth`, add:

```js
// D2 (connect-ready): a real adapter reports its state as trailing flags, e.g. "gainsight-rest (unproven, dry-run)".
function connectorAdapterFlags(name){
  const m = /\(([^()]*)\)\s*$/.exec(String(name || ''));
  return m ? m[1].split(',').map(s => s.trim()).filter(Boolean) : [];
}
```

In `applyConnectorHealth`, the errCode branch: `c.fake = false; c.unproven = false; c.dryRun = false; c.adapters = {};`.
After `c.fake = …`, add:

```js
  const flags = [].concat(...Object.keys(adapters).map(k => connectorAdapterFlags(adapters[k])));
  c.unproven = flags.indexOf('unproven') !== -1;
  c.dryRun = flags.indexOf('dry-run') !== -1;
```

In `checkConnectorHealth`'s unset branch, add `ui.connector.unproven = false; ui.connector.dryRun = false;`.

In `renderConnectorStatus`, after the `if(c.fake) …` line, add:

```js
  if(c.unproven) return '<span style="color:var(--status-watch-text); font-weight:700;" title="A real Gong or Gainsight adapter is set up but has not passed a live check (node connector/server.mjs --check). Treat its data as unverified.">Connector: UNPROVEN</span>';
  if(c.dryRun) return '<span style="color:var(--status-watch-text); font-weight:700;" title="Gainsight is in dry-run: Send writes the requests to connector/dry-run.jsonl and sends nothing; items stay in the queue.">Connector: DRY RUN</span>';
```

- [ ] **Step 4: Run the self-checks and see them pass**

Run: the Step 2 command.
Expected: `475/475`, exit 0. c2g, c2h and c2i are still PASS (A-9).

- [ ] **Step 5: Run the connector suite** (it should be unchanged)

Run: `node --test connector/test/*.test.mjs` → `# pass 52`, `# fail 0`.

- [ ] **Step 6: Check the prose counts**

Run: `git grep -n "473" -- ':!docs/superpowers/*LEDGER*' ':!docs/superpowers/evidence' ':!docs/superpowers/specs' ':!docs/superpowers/plans' ':!docs/superpowers/sessions'`.
Expected: no live prose count to update (at `51d1490` the only hits are historical ledgers and evidence). Update
any hit that is a current claim.

- [ ] **Step 7: Commit**

```bash
git add osm-book-of-business-tracker-1.0.html tools/selfchecks.js
git commit -m "T-3: tracker status line shows Connector: UNPROVEN / DRY RUN from adapter flags (D2); self-checks 475 (c2j, c2k)"
```

---

### Task T-4: recorded-shape vendor fixtures

**Model:** Haiku (transcription; every file's content is below). **Spec:** §4 T-4, A-7.

**Files:**
- Create: `connector/fixtures/vendor/gong-calls-extensive-page1.json`, `gong-calls-extensive-page2.json`,
  `gong-transcripts.json`, `gainsight-company-query-data.json`, `gainsight-company-query-records.json`,
  `gainsight-timeline-create.json`
- Test: `connector/test/vendor-fixtures.test.mjs`

**Interfaces:**
- Produces fixtures that later tasks rely on:
  - The Gong pages hold calls `7001`, `7002` (Ian absent) and `7003`, with cursor `CURSOR-FAKE-2`. Ian is
    `ian.fake@fake-osm.invalid`.
  - The transcripts hold calls `7101`…`7110` with lengths 10, 20, …, 100.
  - The Gainsight Company rows are `1P02FAKE0001..3`, and the tenant fields are named `FAKE_*__gc`.
  - The Timeline success key is `q-timeline-1` → `1I00FAKEACT0001`.

- [ ] **Step 1: Write the failing test** `connector/test/vendor-fixtures.test.mjs`

```js
// connect-ready T-4 / A-7: every vendor fixture says it is a shape from docs, not from a live tenant. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';

installNetGuard();
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'vendor');
const HEADER = 'SHAPE FROM DOCS, NOT FROM A LIVE TENANT';
const load = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));

test('A-7 every vendor fixture is headed with the docs-not-tenant warning and a vendor source URL', () => {
  const files = readdirSync(dir);
  assert.ok(files.length >= 6, `expected at least 6 fixtures, found ${files.length}`);
  for (const f of files) {
    assert.match(f, /\.json$/, `${f}: only .json fixtures belong here`);
    const j = load(f);
    assert.equal(typeof j._source, 'string', `${f}: no _source`);
    assert.ok(j._source.startsWith(HEADER), `${f}: _source must start with "${HEADER}"`);
    assert.match(j._source, /https:\/\/(help\.gong\.io|support\.gainsight\.com)\/\S+/, `${f}: no vendor source URL`);
  }
});

test('vendor fixtures hold fake values only: every email and every URL host ends in .invalid', () => {
  for (const f of readdirSync(dir)) {
    const { _source, ...rest } = load(f);
    const text = JSON.stringify(rest);
    for (const m of text.matchAll(/[\w.+-]+@([\w-]+\.)+[\w-]+/g)) assert.match(m[0], /\.invalid$/, `${f}: ${m[0]}`);
    for (const m of text.matchAll(/https?:\/\/([^/"?]+)/g)) assert.match(m[1], /\.invalid$/, `${f}: ${m[1]}`);
  }
});

test('the transcript fixture holds calls 7101-7110 with 10, 20, ... 100 characters (T-12 relies on this)', () => {
  const t = load('gong-transcripts.json');
  const len = (ct) => ct.transcript.reduce((n, mono) => n + mono.sentences.reduce((k, s) => k + s.text.length, 0), 0);
  assert.deepEqual(t.callTranscripts.map((ct) => ct.callId), ['7101', '7102', '7103', '7104', '7105', '7106', '7107', '7108', '7109', '7110']);
  assert.deepEqual(t.callTranscripts.map(len), [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/vendor-fixtures.test.mjs`
Expected: FAIL, `ENOENT … fixtures/vendor`.

- [ ] **Step 3: Write the two Gong call pages**

`connector/fixtures/vendor/gong-calls-extensive-page1.json`:

```json
{
  "_source": "SHAPE FROM DOCS, NOT FROM A LIVE TENANT. POST /v2/calls/extensive reply, page 1 of 2. Source: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md (research-vendor-apis.md Q2, CONFIRMED). metaData field names from Q1 https://help.gong.io/apidocs/retrieve-call-data-by-date-range-v2calls-2.md (UNCONFIRMED inside metaData). The type of content.brief is UNCONFIRMED. All values are fake.",
  "requestId": "FAKE-REQ-1",
  "records": { "totalRecords": 3, "currentPageSize": 2, "currentPageNumber": 0, "cursor": "CURSOR-FAKE-2" },
  "calls": [
    {
      "metaData": { "id": "7001", "url": "https://fake-tenant.gong.invalid/call?id=7001", "title": "Aldridge Energy: session check-in", "started": "2026-09-20T15:00:00Z", "duration": 1800, "primaryUserId": "FAKE-U1", "scheduled": "2026-09-20T15:00:00Z" },
      "parties": [
        { "id": "p1", "emailAddress": "ian.fake@fake-osm.invalid", "name": "Ian Fake", "affiliation": "Internal", "speakerId": "s1", "methods": ["Attendee"] },
        { "id": "p2", "emailAddress": "pat.fake@fake-customer.invalid", "name": "Pat Fake", "affiliation": "External", "speakerId": "s2", "methods": ["Attendee"] },
        { "id": "p3", "emailAddress": null, "name": "Dial-in caller", "affiliation": "Unknown", "speakerId": "s3", "methods": ["Attendee"] }
      ],
      "content": { "brief": "FAKE brief: reviewed rollout status and agreed next steps." }
    },
    {
      "metaData": { "id": "7002", "url": "https://fake-tenant.gong.invalid/call?id=7002", "title": "Internal sync without Ian", "started": "2026-09-21T10:00:00Z", "duration": 900, "primaryUserId": "FAKE-U2", "scheduled": "2026-09-21T10:00:00Z" },
      "parties": [
        { "id": "p4", "emailAddress": "someone.else@fake-osm.invalid", "name": "Someone Else", "affiliation": "Internal", "speakerId": "s4", "methods": ["Attendee"] }
      ],
      "content": { "brief": "FAKE brief: not Ian's call." }
    }
  ]
}
```

`connector/fixtures/vendor/gong-calls-extensive-page2.json`:

```json
{
  "_source": "SHAPE FROM DOCS, NOT FROM A LIVE TENANT. POST /v2/calls/extensive reply, page 2 of 2 (no cursor = last page). Source: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md (research-vendor-apis.md Q2, CONFIRMED). All values are fake.",
  "requestId": "FAKE-REQ-2",
  "records": { "totalRecords": 3, "currentPageSize": 1, "currentPageNumber": 1 },
  "calls": [
    {
      "metaData": { "id": "7003", "url": "https://fake-tenant.gong.invalid/call?id=7003", "title": "Brightwater Foods: kickoff", "started": "2026-09-25T16:30:00Z", "duration": 2400, "primaryUserId": "FAKE-U1", "scheduled": "2026-09-25T16:30:00Z" },
      "parties": [
        { "id": "p5", "emailAddress": "IAN.FAKE@fake-osm.invalid", "name": "Ian Fake", "affiliation": "Internal", "speakerId": "s5", "methods": ["Invitee"] },
        { "id": "p6", "emailAddress": "sam.fake@fake-customer.invalid", "name": "Sam Fake", "affiliation": "External", "speakerId": "s6", "methods": ["Attendee"] }
      ],
      "content": {}
    }
  ]
}
```

- [ ] **Step 4: Generate the transcript fixture** (a one-off command; the generator is not committed)

```bash
node -e "
const ids = Array.from({length: 10}, (_, i) => String(7101 + i));
const callTranscripts = ids.map((callId, i) => { const n = 10 * (i + 1); const a = Math.floor(n / 2);
  return { callId, transcript: [
    { speakerId: 's1', topic: 'FAKE', sentences: [{ start: 0, end: 1000, text: 'x'.repeat(a) }] },
    { speakerId: 's2', topic: 'FAKE', sentences: [{ start: 1000, end: 2000, text: 'y'.repeat(n - a) }] } ] }; });
const out = { _source: 'SHAPE FROM DOCS, NOT FROM A LIVE TENANT. POST /v2/calls/transcript reply. Source: https://help.gong.io/apidocs/retrieve-transcripts-of-calls-by-date-or-callids-v2callstranscript-2.md (research-vendor-apis.md Q3, CONFIRMED). Lengths are 10..100 characters by design (T-12). All values are fake.',
  requestId: 'FAKE-REQ-T', records: { totalRecords: 10, currentPageSize: 10, currentPageNumber: 0 }, callTranscripts };
require('fs').writeFileSync('connector/fixtures/vendor/gong-transcripts.json', JSON.stringify(out, null, 2) + '\n');"
```

- [ ] **Step 5: Write the three Gainsight fixtures**

`connector/fixtures/vendor/gainsight-company-query-data.json`:

```json
{
  "_source": "SHAPE FROM DOCS, NOT FROM A LIVE TENANT. POST /v1/data/objects/query/Company reply with rows in data[]. Source: https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Company_and_Relationship_API/Company_API_Documentation (research-vendor-apis.md Q8, CONFIRMED envelope; data[] versus data.records is UNCONFIRMED). Gsid and Name per Q10 lookups. Fields named FAKE_* stand in for tenant-configured fields (UNCONFIRMED until the tenant). All values are fake.",
  "result": true, "errorCode": null, "errorDesc": null, "requestId": "FAKE-REQ-GS-1", "message": null,
  "data": [
    { "Gsid": "1P02FAKE0001", "Name": "Aldridge Energy", "FAKE_Tier__gc": "Gold", "FAKE_Arr__gc": 120000, "FAKE_Renewal__gc": "2027-03-31", "FAKE_CsmOwner__gc": "Ian Fake", "FAKE_Health__gc": 72, "FAKE_Readiness__gc": true, "FAKE_Csat__gc": false, "FAKE_SuccessPlan__gc": "yes" },
    { "Gsid": "1P02FAKE0002", "Name": "Brightwater Foods", "FAKE_Tier__gc": null, "FAKE_Arr__gc": -5, "FAKE_Renewal__gc": "", "FAKE_CsmOwner__gc": "Ian Fake", "FAKE_Health__gc": "n/a", "FAKE_Readiness__gc": false, "FAKE_Csat__gc": true, "FAKE_SuccessPlan__gc": true },
    { "Gsid": "1P02FAKE0003", "Name": "Corvus Logistics", "FAKE_Tier__gc": "Silver", "FAKE_Arr__gc": "45000", "FAKE_Renewal__gc": "2026-12-01", "FAKE_CsmOwner__gc": null, "FAKE_Health__gc": 55, "FAKE_Readiness__gc": null, "FAKE_Csat__gc": null, "FAKE_SuccessPlan__gc": null }
  ]
}
```

`connector/fixtures/vendor/gainsight-company-query-records.json` has the same `_source`, except it reads
"…reply with rows in data.records[] (the second form; UNCONFIRMED which one the tenant uses)…". The envelope fields
are the same, and the same three rows sit under `"data": { "records": [ …same three rows… ] }`.

`connector/fixtures/vendor/gainsight-timeline-create.json`:

```json
{
  "_source": "SHAPE FROM DOCS, NOT FROM A LIVE TENANT. POST /v1/ant/es/activity success reply. Source: https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs (research-vendor-apis.md Q10, CONFIRMED). All values are fake.",
  "data": { "failures": {}, "success": { "q-timeline-1": [{ "activityId": "1I00FAKEACT0001" }] } },
  "result": true
}
```

- [ ] **Step 6: Run the tests**

Run: `node --test connector/test/vendor-fixtures.test.mjs` → 3 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 55`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add connector/fixtures/vendor connector/test/vendor-fixtures.test.mjs
git commit -m "T-4: recorded-shape vendor fixtures, each headed SHAPE FROM DOCS, NOT FROM A LIVE TENANT with its source URL"
```

---

### Task T-5: `gong-rest` listCalls

**Model:** Sonnet. **Spec:** §3.1 (Gong), §3.3 `gong-rest`, CR4, §4 T-5.

**Files:**
- Create: `connector/lib/vendor-http.mjs`
- Modify: `connector/adapters/gong-rest.mjs` (full body below), `connector/config.example.json`, `connector/CONTRACT.md`
- Test: `connector/test/gong-rest.test.mjs`

**Interfaces:**
- Consumes: T-2 `state.mjs`, and T-4 fixtures `gong-calls-extensive-page1/2.json`.
- Produces (`vendor-http.mjs`):
  - `class VendorError extends Error {status, bodyKeys, body}`
  - `scrubAll(text, secrets[]) -> string`
  - `requestJson({fetchImpl, method, url, headers, body, secrets, host}) -> Promise<json>`: throws a
    `VendorError` with every secret scrubbed
  - `pacer(minIntervalMs, sleep?) -> async () => void`
  - `pick(obj, dottedPath) -> any`
- Produces (`gong-rest.mjs`): `create(cfg, deps) -> {name, listCalls({since})}`; `mapCall(call, meLower) -> contractCall|null|false`;
  `EXTENSIVE_PATH`, `TRANSCRIPT_PATH`, `CONTENT_SELECTOR`.
- Config: `gong.baseUrl`, `gong.accessKey`, `gong.accessKeySecret`, `gong.myEmail`.

- [ ] **Step 1: Write the failing test** `connector/test/gong-rest.test.mjs`

```js
// connect-ready T-5: gong-rest on recorded-shape fixtures and a stubbed fetch. Unproven until --check. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { create } from '../adapters/gong-rest.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const callsSchema = JSON.parse(readFileSync(join(root, 'schemas', 'calls.json'), 'utf8'));
const CFG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid/', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: 'Ian.Fake@fake-osm.invalid' };
const BASIC = Buffer.from('FAKE-KEY-123:FAKE-SECRET-456').toString('base64');
const NOW = new Date('2026-10-02T12:00:00Z');
const PAGES = { first: fx('gong-calls-extensive-page1.json'), 'CURSOR-FAKE-2': fx('gong-calls-extensive-page2.json') };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function stub(reply = (body) => json(200, body.cursor ? PAGES[body.cursor] : PAGES.first)) {
  const seen = [];
  const fn = async (url, init) => { const body = JSON.parse(init.body); seen.push({ url, init, body }); return reply(body); };
  return { fn, seen };
}
const adapter = (fetchImpl, extra = {}) => create({ ...CFG, ...extra }, { fetchImpl, now: () => NOW, sleep: async () => {}, stateDir: mkdtempSync(join(tmpdir(), 'gong-rest-')) });

test('gong-rest: pages through every cursor with POST /v2/calls/extensive and Basic auth', async () => {
  const s = stub();
  await adapter(s.fn).listCalls();
  assert.equal(s.seen.length, 2);
  for (const r of s.seen) {
    assert.equal(r.url, 'https://fake-tenant.gong.invalid/v2/calls/extensive');
    assert.equal(r.init.method, 'POST');
    assert.equal(r.init.headers.Authorization, `Basic ${BASIC}`);
    assert.equal(r.body.contentSelector.exposedFields.parties, true);
    assert.equal(r.body.contentSelector.exposedFields.content.brief, true);
  }
  assert.equal(s.seen[0].body.cursor, undefined);
  assert.equal(s.seen[1].body.cursor, 'CURSOR-FAKE-2');
});

test('gong-rest: date window is since..now, or 30 days back..now when since is absent (both dates required, Q1)', async () => {
  const s = stub();
  await adapter(s.fn).listCalls({ since: '2026-09-15T00:00:00Z' });
  assert.deepEqual(s.seen[0].body.filter, { fromDateTime: '2026-09-15T00:00:00.000Z', toDateTime: '2026-10-02T12:00:00.000Z' });
  const s2 = stub();
  await adapter(s2.fn).listCalls();
  assert.deepEqual(s2.seen[0].body.filter, { fromDateTime: '2026-09-02T12:00:00.000Z', toDateTime: '2026-10-02T12:00:00.000Z' });
});

test('gong-rest: keeps only calls where gong.myEmail is a participant, case-insensitive', async () => {
  const calls = await adapter(stub().fn).listCalls();
  assert.deepEqual(calls.map((c) => c.callId), ['7001', '7003']);
});

test('gong-rest: maps affiliation Internal/External/Unknown to internal/customer/unknown', async () => {
  const [c] = await adapter(stub().fn).listCalls();
  assert.deepEqual(c.participants, [
    { name: 'Ian Fake', email: 'ian.fake@fake-osm.invalid', affiliation: 'internal' },
    { name: 'Pat Fake', email: 'pat.fake@fake-customer.invalid', affiliation: 'customer' },
    { name: 'Dial-in caller', email: null, affiliation: 'unknown' },
  ]);
});

test('gong-rest: transcript is always "" (CR4), summary is the brief or "", and the result validates calls.json', async () => {
  const calls = await adapter(stub().fn).listCalls();
  assert.ok(calls.every((c) => c.transcript === ''));
  assert.equal(calls[0].summary, 'FAKE brief: reviewed rollout status and agreed next steps.');
  assert.equal(calls[1].summary, '');
  assert.deepEqual(calls[0].accountRef, { gainsightId: null, name: null });
  assert.deepEqual(validate(callsSchema, { calls }), []);
});

test('gong-rest: errors never carry the key, the secret or the Basic string', async () => {
  const s = stub(() => json(401, { errors: [`bad key FAKE-KEY-123 / FAKE-SECRET-456 / ${BASIC}`] }));
  await assert.rejects(adapter(s.fn).listCalls(), (e) => {
    assert.equal(e.status, 401);
    for (const secret of ['FAKE-KEY-123', 'FAKE-SECRET-456', BASIC]) assert.ok(!e.message.includes(secret), e.message);
    return true;
  });
  await assert.rejects(adapter(async () => { throw new TypeError('fetch failed FAKE-SECRET-456'); }).listCalls(), (e) => e.message === 'Network error reaching Gong.');
});

test('gong-rest: not configured refuses without calling fetch and names the missing keys', async () => {
  const s = stub();
  await assert.rejects(adapter(s.fn, { accessKeySecret: '', myEmail: '' }).listCalls(), /missing gong\.accessKeySecret, gong\.myEmail.*--setup/);
  assert.equal(s.seen.length, 0);
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/gong-rest.test.mjs`
Expected: FAIL, `listCalls is not built yet (connect-ready T-5)` (and `vendor-http.mjs` not found).

- [ ] **Step 3: Create `connector/lib/vendor-http.mjs`**

```js
// Shared HTTP for the vendor adapters (connect-ready). Callers inject fetch; errors never carry a secret. Node built-ins only.
import { scrub } from '../adapters/ai-shared.mjs';

const TIMEOUT_MS = 30000;

export class VendorError extends Error {
  constructor(message, { status = null, bodyKeys = [], body = null } = {}) { super(message); this.status = status; this.bodyKeys = bodyKeys; this.body = body; }
}

export function scrubAll(text, secrets = []) {
  return secrets.filter(Boolean).reduce((s, k) => scrub(s, k), String(text == null ? '' : text));
}

export async function requestJson({ fetchImpl, method = 'GET', url, headers = {}, body, secrets = [], host }) {
  if (typeof fetchImpl !== 'function') throw new VendorError('no fetch available');
  let resp;
  try {
    resp = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw new VendorError(`The request to ${host} timed out after 30 seconds.`);
    throw new VendorError(`Network error reaching ${host}.`);
  }
  const text = await resp.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!resp.ok) {
    const detail = json ? JSON.stringify(json).slice(0, 500) : (resp.statusText || '');
    throw new VendorError(scrubAll(`${host} HTTP ${resp.status}: ${detail}`, secrets), {
      status: resp.status, bodyKeys: json && typeof json === 'object' ? Object.keys(json) : [], body: json,
    });
  }
  return json;
}

// One caller at a time keeps at least minIntervalMs between requests (vendor rate limits).
export function pacer(minIntervalMs, sleep = (ms) => new Promise((r) => setTimeout(r, ms))) {
  let last = 0;
  return async () => {
    const wait = last + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
  };
}

export function pick(obj, path) {
  return String(path || '').split('.').filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
```

- [ ] **Step 4: Replace `connector/adapters/gong-rest.mjs`**

```js
// Real Gong adapter (connect-ready §3.3). Tested on recorded-shape fixtures only; unproven until `--check` passes
// against the configured tenant. Node built-ins only; fetch is injected (deps.fetchImpl) or the global one.
import { requestJson, pacer } from '../lib/vendor-http.mjs';
import { loadProof, isProven, tenantOf, healthName } from '../lib/state.mjs';

// CONFIRMED https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md (research Q2)
export const EXTENSIVE_PATH = '/v2/calls/extensive';
// CONFIRMED https://help.gong.io/apidocs/retrieve-transcripts-of-calls-by-date-or-callids-v2callstranscript-2.md (research Q3)
export const TRANSCRIPT_PATH = '/v2/calls/transcript';
// CONFIRMED (Q2): parties come back only with exposedFields.parties; Gong's AI brief is content.brief.
export const CONTENT_SELECTOR = { context: 'None', exposedFields: { parties: true, content: { brief: true } } };
// CONFIRMED (Q2): affiliation is Internal | External | Unknown; the contract says internal | customer | unknown.
const AFFILIATION = { Internal: 'internal', External: 'customer', Unknown: 'unknown' };
// CONFIRMED https://help.gong.io/apidocs/introduction-2.md (research Q4): 3 calls a second.
const MIN_INTERVAL_MS = 334;
const DEFAULT_SINCE_DAYS = 30; // spec §3.3
const DAY_MS = 86400000;
const REQUIRED = ['baseUrl', 'accessKey', 'accessKeySecret', 'myEmail'];

export function mapCall(c, me) {
  const parties = Array.isArray(c && c.parties) ? c.parties : [];
  if (!parties.some((p) => String(p.emailAddress || '').trim().toLowerCase() === me)) return null; // not Ian's call
  // UNCONFIRMED: metaData field names come from the GET /v2/calls page (Q1); the extensive summary did not list them.
  const md = (c && c.metaData) || {};
  if (!md.id || !md.url || !md.started || Number.isNaN(Date.parse(md.started))) return false;
  const brief = c.content && c.content.brief; // key CONFIRMED (Q2); type UNCONFIRMED, so only a string is used
  return {
    callId: String(md.id), kind: 'call', url: String(md.url),
    startedAt: new Date(md.started).toISOString(),
    durationSec: Math.max(0, Math.round(Number(md.duration) || 0)),
    title: String(md.title || ''),
    participants: parties.map((p) => ({
      name: String(p.name || p.emailAddress || 'Unknown'),
      email: p.emailAddress ? String(p.emailAddress).toLowerCase() : null,
      affiliation: AFFILIATION[p.affiliation] || 'unknown',
    })),
    // The shape of Gong's CRM context is not in the research (UNCONFIRMED): the tracker matches by name and participant email.
    accountRef: { gainsightId: null, name: null },
    summary: typeof brief === 'string' ? brief : '',
    transcript: '', // CR4: transcripts stay off until Ian's I-2 choice
  };
}

export function create(cfg = {}, deps = {}) {
  const now = deps.now || (() => new Date());
  const pace = pacer(MIN_INTERVAL_MS, deps.sleep);
  const base = String(cfg.baseUrl || '').replace(/\/+$/, '');
  const basic = cfg.accessKey && cfg.accessKeySecret ? Buffer.from(`${cfg.accessKey}:${cfg.accessKeySecret}`).toString('base64') : '';
  const secrets = [cfg.accessKey, cfg.accessKeySecret, basic];
  const me = String(cfg.myEmail || '').trim().toLowerCase();

  async function post(path, body) {
    const missing = REQUIRED.filter((k) => !String(cfg[k] || '').trim());
    if (missing.length) throw new Error(`gong-rest is not configured (missing gong.${missing.join(', gong.')}); run node connector/server.mjs --setup`);
    await pace();
    // CONFIRMED (Q4): Authorization: Basic base64(accessKey:accessKeySecret).
    return requestJson({ fetchImpl: deps.fetchImpl || globalThis.fetch, method: 'POST', url: base + path,
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' }, body, secrets, host: 'Gong' });
  }
  async function eachPage(path, filter, extra, onPage) {
    let cursor;
    do {
      const page = (await post(path, { ...(cursor ? { cursor } : {}), filter, ...extra })) || {};
      onPage(page);
      cursor = page.records && page.records.cursor; // CONFIRMED (Q1-Q3): records.cursor; absent on the last page
    } while (cursor);
  }
  function windowFor(since) {
    const to = now();
    const from = since ? new Date(since) : new Date(to.getTime() - DEFAULT_SINCE_DAYS * DAY_MS);
    return { fromDateTime: from.toISOString(), toDateTime: to.toISOString() }; // CONFIRMED (Q1): both dates required
  }
  async function listCalls({ since } = {}) {
    const out = [];
    let skipped = 0;
    await eachPage(EXTENSIVE_PATH, windowFor(since), { contentSelector: CONTENT_SELECTOR }, (page) => {
      for (const c of page.calls || []) {
        const r = mapCall(c, me);
        if (r === false) skipped++; else if (r) out.push(r);
      }
    });
    if (skipped) console.warn(`gong-rest: ${skipped} call(s) skipped: no id, url or start time in Gong's reply`);
    return out;
  }

  return {
    get name() { return healthName('gong-rest', { proven: isProven(loadProof(deps.stateDir), 'gong', 'read', tenantOf('gong', cfg)) }); },
    listCalls,
  };
}
```

(T-10 and T-12 add `probe` and `transcriptLengths` inside `create`. Those additions reuse `post`, `eachPage` and
`windowFor`.)

- [ ] **Step 5: Update docs (same commit)**

In `connector/config.example.json`, change `gong` to
`{ "adapter": "fake", "baseUrl": "", "accessKey": "", "accessKeySecret": "", "myEmail": "" }`.

In `connector/CONTRACT.md`:
- Replace the whole `## Before a real Gong adapter` section with `## Transcripts (I-2)`: "Ruled by Ian
  2026-10-02 (I-2, kept by CR4): `gong-rest` sends `transcript: ""` for every call until Ian chooses between
  storing link + summary only and capping transcripts. The fake adapter still serves fixture transcripts. Real
  transcript sizes are not measured yet."
- In `GET /v1/calls`, add: "`gong-rest` (tested on recorded-shape fixtures, unproven until `--check`) lists Ian's
  calls through `POST /v2/calls/extensive`. It filters to calls where `gong.myEmail` is a participant (Gong's
  user filter matches the host only) and sends `accountRef` `{gainsightId:null, name:null}`."

- [ ] **Step 6: Run the tests**

Run: `node --test connector/test/gong-rest.test.mjs` → 7 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 62`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add connector/lib/vendor-http.mjs connector/adapters/gong-rest.mjs connector/config.example.json connector/CONTRACT.md connector/test/gong-rest.test.mjs
git commit -m "T-5: gong-rest listCalls (tested on recorded-shape fixtures; unproven until --check); transcripts off (CR4)"
```

---

### Task T-6: Gainsight OAuth, callback route, rotation persisted before use

**Model:** top model (design judgement: single-use refresh tokens). **Spec:** §3.1 (Gainsight OAuth), §3.3
"Gainsight auth", §4 T-6.

**Files:**
- Create: `connector/adapters/gainsight-auth.mjs`
- Modify: `connector/server.mjs` (an `oauthCallback` option and the route before the bearer check), `connector/config.example.json`, `connector/CONTRACT.md`
- Test: `connector/test/gainsight-auth.test.mjs`

**Interfaces:**
- Consumes: `requestJson`, `pick` and `VendorError` (T-5); `readJson`, `writeJsonAtomic` (T-2).
- Produces:
  - `AUTHORIZE_PATH`, `TOKEN_PATH`, `redirectUriFor(port) -> 'http://127.0.0.1:<port>/oauth/callback'`
  - `authorizeUrl(gsCfg, redirectUri) -> string`
  - `exchangeCode({cfg, code, redirectUri, fetchImpl, tokensPath, writeFile?, now?}) -> raw reply` (persisted first)
  - `createTokenSource({cfg, fetchImpl, tokensPath, writeFile?, now?}) -> {accessToken(): Promise<string>}`
  - `makeCallbackHandler({cfg, redirectUri, fetchImpl, tokensPath, now?, onDone}) -> async (URLSearchParams) => {status, text}`.
    `onDone` receives `{ok:true, keys}`, `{ok:false, reason:'codeParamUnset', names}` or
    `{ok:false, reason:'exchange', error}`.
  - `createConnector({..., oauthCallback})`: `GET /oauth/callback` skips the bearer check **only** when
    `oauthCallback` is set (setup mode).
  - Token file format: `{raw: <the token reply as received>, obtainedAt: ISO}`.
- Config: `gainsight.oauth = {clientId, clientSecret, scopes, callbackCodeParam, accessTokenField, refreshTokenField}`.

- [ ] **Step 1: Write the failing test** `connector/test/gainsight-auth.test.mjs`

```js
// connect-ready T-6: Gainsight OAuth on a stubbed fetch. Single-use refresh tokens are persisted before use. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { createConnector } from '../server.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { authorizeUrl, redirectUriFor, createTokenSource, makeCallbackHandler } from '../adapters/gainsight-auth.mjs';

installNetGuard();
const APP = 'https://fake-tenant.gainsightcloud.invalid';
const CFG = { appUrl: APP, oauth: { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz', scopes: 'FAKE_SCOPE', callbackCodeParam: 'code', accessTokenField: 'FAKE_at', refreshTokenField: 'FAKE_rt' } };
const T0 = new Date('2026-10-02T12:00:00Z');
const TOKEN = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const tokensFile = (stored) => { const p = join(mkdtempSync(join(tmpdir(), 'gs-auth-')), 'gainsight-tokens.json'); if (stored) writeFileSync(p, JSON.stringify(stored)); return p; };
const old = (ms) => new Date(T0.getTime() - ms).toISOString();

test('oauth: authorize URL is <app>/v1/authorize with clientId, redirectUri and scopes, never the secret', () => {
  const u = new URL(authorizeUrl(CFG, redirectUriFor(8787)));
  assert.equal(u.origin + u.pathname, `${APP}/v1/authorize`);
  assert.equal(u.searchParams.get('clientId'), 'FAKE-CLIENT-ID');
  assert.equal(u.searchParams.get('redirectUri'), 'http://127.0.0.1:8787/oauth/callback');
  assert.equal(u.searchParams.get('scopes'), 'FAKE_SCOPE');
  assert.ok(!u.href.includes('FAKE-CLIENT-SECRET-zz'));
});

test('oauth: the callback route takes the code without our token, exchanges it once, saves the raw reply, then answers 410', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => { seen.push({ url, body: JSON.parse(init.body) }); return json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }); };
  const path = tokensFile();
  let done = null;
  const handler = makeCallbackHandler({ cfg: CFG, redirectUri: redirectUriFor(8787), fetchImpl, tokensPath: path, now: () => T0, onDone: (r) => { done = r; } });
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN, oauthCallback: handler });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const r1 = await fetch(`${base}/oauth/callback?code=FAKE-CODE-1`);
    assert.equal(r1.status, 200);
    assert.match(await r1.text(), /Return to the terminal/);
    assert.deepEqual(seen, [{ url: `${APP}/v1/users/oauth/access/token`, body: { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz', grantType: 'authorization_code', redirectUri: 'http://127.0.0.1:8787/oauth/callback', code: 'FAKE-CODE-1' } }]);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: T0.toISOString() });
    assert.deepEqual(done, { ok: true, keys: ['FAKE_at', 'FAKE_rt'] });
    assert.equal((await fetch(`${base}/oauth/callback?code=FAKE-CODE-2`)).status, 410);
    assert.equal(seen.length, 1);
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});

test('oauth: outside setup, /oauth/callback without our token is 401 as before', async () => {
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/oauth/callback?code=x`)).status, 401); }
  finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});

test('oauth: with callbackCodeParam unset the handler reports the query NAMES only and calls no endpoint', async () => {
  let done = null; let calls = 0;
  const h = makeCallbackHandler({ cfg: { ...CFG, oauth: { ...CFG.oauth, callbackCodeParam: '' } }, redirectUri: 'x', fetchImpl: async () => { calls++; }, tokensPath: tokensFile(), onDone: (r) => { done = r; } });
  const r = await h(new URLSearchParams('code=FAKE-CODE-9&state=s'));
  assert.equal(r.status, 200);
  assert.ok(!r.text.includes('FAKE-CODE-9'));
  assert.deepEqual(done, { ok: false, reason: 'codeParamUnset', names: ['code', 'state'] });
  assert.equal(calls, 0);
});

test('oauth: an expired access token is refreshed and the NEW refresh token is on disk before the token is handed out', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  const events = [];
  const fetchImpl = async (url, init) => { events.push(['token', JSON.parse(init.body)]); return json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }); };
  const writeFile = (p, data, o) => { events.push(['write', JSON.parse(data).raw.FAKE_rt]); writeFileSync(p, data, o); };
  const src = createTokenSource({ cfg: CFG, fetchImpl, tokensPath: path, writeFile, now: () => T0 });
  const t = await src.accessToken();
  events.push(['used', t]);
  assert.deepEqual(events, [
    ['token', { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz', grantType: 'refresh_token', refreshToken: 'FAKE-REFRESH-1' }],
    ['write', 'FAKE-REFRESH-2'],
    ['used', 'FAKE-ACCESS-2'],
  ]);
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).raw.FAKE_rt, 'FAKE-REFRESH-2');
  const fresh = createTokenSource({ cfg: CFG, fetchImpl: async () => { throw new Error('must not refresh'); }, tokensPath: path, now: () => T0 });
  assert.equal(await fresh.accessToken(), 'FAKE-ACCESS-2');
});

test('oauth: a failed token-file write stops the request with an error naming the file', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  let dataCalls = 0;
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }), tokensPath: path,
    writeFile: () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); }, now: () => T0 });
  await assert.rejects(src.accessToken().then(() => { dataCalls++; }), (e) => e.message.includes(path) && /EACCES/.test(e.message) && /spent/.test(e.message));
  assert.equal(dataCalls, 0);
});

test('oauth: two requests at once share ONE refresh (the refresh token is single-use)', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  let refreshes = 0;
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => { refreshes++; return json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }); }, tokensPath: path, now: () => T0 });
  assert.deepEqual(await Promise.all([src.accessToken(), src.accessToken()]), ['FAKE-ACCESS-2', 'FAKE-ACCESS-2']);
  assert.equal(refreshes, 1);
});

test('oauth: unset token field names list the saved reply KEYS, never values; token errors are scrubbed', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: T0.toISOString() });
  const unset = createTokenSource({ cfg: { ...CFG, oauth: { ...CFG.oauth, accessTokenField: '', refreshTokenField: '' } }, fetchImpl: async () => {}, tokensPath: path, now: () => T0 });
  await assert.rejects(unset.accessToken(), (e) => /FAKE_at, FAKE_rt/.test(e.message) && !e.message.includes('FAKE-ACCESS-1'));
  const p2 = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: old(2 * 3600e3) });
  const bad = createTokenSource({ cfg: CFG, fetchImpl: async () => json(400, { error: 'bad FAKE-CLIENT-SECRET-zz FAKE-REFRESH-1' }), tokensPath: p2, now: () => T0 });
  await assert.rejects(bad.accessToken(), (e) => !e.message.includes('FAKE-CLIENT-SECRET-zz') && !e.message.includes('FAKE-REFRESH-1'));
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/gainsight-auth.test.mjs`
Expected: FAIL, `Cannot find module …gainsight-auth.mjs`.

- [ ] **Step 3: Create `connector/adapters/gainsight-auth.mjs`**

```js
// Gainsight OAuth authorization code (connect-ready §3.3). Tested on a stubbed fetch only; unproven until `--check`.
// Refresh tokens are single-use and rotate on every refresh, so the new one is written to disk BEFORE the new
// access token is used, and only one refresh runs at a time. Node built-ins only.
import { writeFileSync } from 'node:fs';
import { requestJson, pick } from '../lib/vendor-http.mjs';
import { readJson, writeJsonAtomic } from '../lib/state.mjs';

// CONFIRMED https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs (research Q7)
export const AUTHORIZE_PATH = '/v1/authorize';                 // query clientId, redirectUri, scopes: CONFIRMED (Q7)
export const TOKEN_PATH = '/v1/users/oauth/access/token';      // body {clientId, clientSecret, grantType, redirectUri, code}: CONFIRMED (Q7)
const ACCESS_TTL_MS = 3600 * 1000;                             // access token life 3600 s: CONFIRMED (Q7)
const REFRESH_EARLY_MS = 120 * 1000;
// The token reply's field names and the callback's code parameter are NOT in the research: they are config
// (gainsight.oauth.accessTokenField / refreshTokenField / callbackCodeParam), never guessed.

const trimUrl = (u) => String(u || '').replace(/\/+$/, '');
export const redirectUriFor = (port) => `http://127.0.0.1:${port}/oauth/callback`;

export function authorizeUrl(cfg, redirectUri) {
  const o = cfg.oauth || {};
  const u = new URL(trimUrl(cfg.appUrl) + AUTHORIZE_PATH);
  u.searchParams.set('clientId', o.clientId || '');
  u.searchParams.set('redirectUri', redirectUri);
  u.searchParams.set('scopes', o.scopes || '');
  return u.href;
}

function persist(tokensPath, value, writeFile) {
  try { writeJsonAtomic(tokensPath, value, { writeFile }); }
  catch (e) {
    throw new Error(`Gainsight answered, but ${tokensPath} could not be written (${e.code || e.message}). The old refresh token is now spent: fix the file, then run node connector/server.mjs --setup again.`);
  }
}

async function tokenCall({ cfg, fetchImpl, body, secrets }) {
  return requestJson({ fetchImpl: fetchImpl || globalThis.fetch, method: 'POST', url: trimUrl(cfg.appUrl) + TOKEN_PATH,
    headers: { 'Content-Type': 'application/json' }, body, secrets: [cfg.oauth && cfg.oauth.clientSecret, ...secrets], host: 'Gainsight' });
}

export async function exchangeCode({ cfg, code, redirectUri, fetchImpl, tokensPath, writeFile = writeFileSync, now = () => new Date() }) {
  const o = cfg.oauth || {};
  const raw = await tokenCall({ cfg, fetchImpl, secrets: [code], body: { clientId: o.clientId, clientSecret: o.clientSecret, grantType: 'authorization_code', redirectUri, code } });
  persist(tokensPath, { raw, obtainedAt: now().toISOString() }, writeFile);
  return raw;
}

export function createTokenSource({ cfg, fetchImpl, tokensPath, writeFile = writeFileSync, now = () => new Date() }) {
  let inflight = null;
  async function refresh(stored) {
    const o = cfg.oauth || {};
    const rt = pick(stored.raw, o.refreshTokenField);
    if (!rt) throw new Error(`The saved Gainsight token reply has no "${o.refreshTokenField}"; run node connector/server.mjs --setup again`);
    // UNCONFIRMED (search snippet, research Q7): refresh body {grantType:"refresh_token", refreshToken}.
    const raw = await tokenCall({ cfg, fetchImpl, secrets: [String(rt)], body: { clientId: o.clientId, clientSecret: o.clientSecret, grantType: 'refresh_token', refreshToken: rt } });
    const next = { raw, obtainedAt: now().toISOString() };
    persist(tokensPath, next, writeFile); // before the new access token is used (CONFIRMED rotation, Q7)
    return next;
  }
  return {
    async accessToken() {
      const o = cfg.oauth || {};
      const stored = readJson(tokensPath, null);
      if (!stored || !stored.raw) throw new Error(`No Gainsight tokens in ${tokensPath}: run node connector/server.mjs --setup`);
      if (!o.accessTokenField || !o.refreshTokenField) {
        throw new Error(`Set gainsight.oauth.accessTokenField and refreshTokenField in config.json. The saved Gainsight token reply has these field names: ${Object.keys(stored.raw).join(', ')}`);
      }
      let cur = stored;
      if (now().getTime() - Date.parse(stored.obtainedAt) > ACCESS_TTL_MS - REFRESH_EARLY_MS) {
        // No await before this line, so concurrent callers share one refresh.
        inflight = inflight || refresh(stored).finally(() => { inflight = null; });
        cur = await inflight;
      }
      const t = pick(cur.raw, o.accessTokenField);
      if (!t) throw new Error(`The Gainsight token reply has no "${o.accessTokenField}"; check gainsight.oauth.accessTokenField`);
      return String(t);
    },
  };
}

export function makeCallbackHandler({ cfg, redirectUri, fetchImpl, tokensPath, now = () => new Date(), onDone = () => {} }) {
  let used = false;
  return async (params) => {
    if (used) return { status: 410, text: 'This sign-in was already received. Return to the terminal.' };
    const name = cfg.oauth && cfg.oauth.callbackCodeParam;
    if (!name) {
      used = true;
      const names = [...new Set(params.keys())];
      onDone({ ok: false, reason: 'codeParamUnset', names });
      return { status: 200, text: `Gainsight redirected here with query names: ${names.join(', ') || '(none)'}. Return to the terminal.` };
    }
    const code = params.get(name);
    if (!code) return { status: 400, text: `No "${name}" in the redirect. Return to the terminal.` };
    used = true;
    try {
      const raw = await exchangeCode({ cfg, code, redirectUri, fetchImpl, tokensPath, now });
      onDone({ ok: true, keys: Object.keys(raw || {}) });
      return { status: 200, text: 'Gainsight sign-in received. Return to the terminal.' };
    } catch (e) {
      onDone({ ok: false, reason: 'exchange', error: e.message });
      return { status: 502, text: 'The token exchange failed. Return to the terminal for the reason.' };
    }
  };
}
```

- [ ] **Step 4: Add the setup-only callback route to `connector/server.mjs`**

Change the signature to `export function createConnector({ config = {}, adapters, token, logPath, oauthCallback } = {})`.
In the request handler, between the `OPTIONS` line and the bearer check, add:

```js
      // Setup only (connect-ready §3.3): Gainsight's OAuth redirect lands here without our token. Absent outside --setup.
      if (oauthCallback && req.method === 'GET' && (req.url || '').split('?')[0] === '/oauth/callback') {
        const r = await oauthCallback(new URL(req.url, 'http://127.0.0.1').searchParams);
        res.writeHead(r.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(r.text);
      }
```

- [ ] **Step 5: Update docs (same commit)**

In `connector/config.example.json`, add to `gainsight`:
`"oauth": { "clientId": "", "clientSecret": "", "scopes": "", "callbackCodeParam": "", "accessTokenField": "", "refreshTokenField": "" }`.

In `connector/CONTRACT.md`:
- Add `### GET /oauth/callback (setup only)`: "It exists only while `--setup` waits for Gainsight's redirect. It
  takes no bearer token, exchanges the code once, saves the raw token reply to `gainsight-tokens.json`, and then
  answers 410. Outside setup the path is 401 like any other. Redirect URI to register:
  `http://127.0.0.1:<port>/oauth/callback`."
- Under the state files, add: "`gainsight-tokens.json`: `{raw, obtainedAt}`. Refresh tokens are single-use. The new
  one is written before the new access token is used, and a failed write stops the request."

- [ ] **Step 6: Run the tests**

Run: `node --test connector/test/gainsight-auth.test.mjs` → 8 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 70`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add connector/adapters/gainsight-auth.mjs connector/server.mjs connector/config.example.json connector/CONTRACT.md connector/test/gainsight-auth.test.mjs
git commit -m "T-6: Gainsight OAuth code exchange via setup-only /oauth/callback; rotated refresh token persisted before use (stubbed fetch only)"
```

---

### Task T-7: `gainsight-rest` reads

**Model:** Sonnet. **Spec:** §3.1 (Company query), §3.3 "`gainsight-rest` reads", §4 T-7. See spec gaps 2 and 3.

**Files:**
- Modify: `connector/adapters/gainsight-rest.mjs` (the read half; push stays the T-2 stub), `connector/config.example.json`, `connector/CONTRACT.md`
- Test: `connector/test/gainsight-read.test.mjs`

**Interfaces:**
- Consumes: `createTokenSource` (T-6); `requestJson`, `pacer` and `VendorError` (T-5); the T-4 Company fixtures.
- Produces: `QUERY_PATH`, `PAGE_LIMIT`, `FIELD_KEYS`, `GATE_KEYS`, `rowsOf(resp)`, `rowsShape(resp) -> 'data'|'data.records'`,
  `toAccount(row, fieldMap, gateFieldMap, contactsByGsid)`. Inside `create`: `api(method, path, body)` and
  `queryAll(object, select)` (T-8 and T-10 reuse them), and `listAccounts()`.
- Deps used: `tokenSource` (tests inject it), `pageLimit` (tests use 2), `fetchImpl`, `sleep` and `stateDir`.
- Config: `gainsight.fieldMap {tier, arr, renewalDate, csmOwner, healthScore}`,
  `gainsight.gateFieldMap {readinessAssessment, csatContact, successPlan}`,
  `gainsight.contactQuery {object, companyField, nameField, emailField, roleField}`.

- [ ] **Step 1: Write the failing test** `connector/test/gainsight-read.test.mjs`

```js
// connect-ready T-7: gainsight-rest reads on recorded-shape fixtures and a stubbed fetch. Unproven until --check. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { create } from '../adapters/gainsight-rest.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const accountsSchema = JSON.parse(readFileSync(join(root, 'schemas', 'accounts.json'), 'utf8'));
const API = 'https://fake-tenant.gainsightcloud.invalid';
const FIELD_MAP = { tier: 'FAKE_Tier__gc', arr: 'FAKE_Arr__gc', renewalDate: 'FAKE_Renewal__gc', csmOwner: 'FAKE_CsmOwner__gc', healthScore: 'FAKE_Health__gc' };
const GATE_MAP = { readinessAssessment: 'FAKE_Readiness__gc', csatContact: 'FAKE_Csat__gc', successPlan: 'FAKE_SuccessPlan__gc' };
const CFG = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: API, apiBaseUrl: API, tenantId: 'FAKE-TENANT-1', oauth: { clientSecret: 'FAKE-CLIENT-SECRET-zz' }, fieldMap: FIELD_MAP, gateFieldMap: GATE_MAP };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const tokenSource = { accessToken: async () => 'FAKE-ACCESS-yy' };

// Serves a fixture's rows by offset/limit, in the fixture's own envelope form.
function companyStub(fixture, extra = {}) {
  const f = fx(fixture); const rows = Array.isArray(f.data) ? f.data : f.data.records;
  const seen = [];
  const fn = async (url, init) => {
    const body = JSON.parse(init.body); seen.push({ url, init, body });
    if (extra[url]) return extra[url](body);
    const page = rows.slice(body.offset, body.offset + body.limit);
    return json(200, Array.isArray(f.data) ? { ...f, data: page } : { ...f, data: { records: page } });
  };
  return { fn, seen };
}
const adapter = (fetchImpl, cfg = CFG, pageLimit = 5000) => create(cfg, { fetchImpl, tokenSource, pageLimit, sleep: async () => {}, stateDir: mkdtempSync(join(tmpdir(), 'gs-read-')) });

test('gainsight reads: rows in data[] map through fieldMap and validate accounts.json', async () => {
  const accounts = await adapter(companyStub('gainsight-company-query-data.json').fn).listAccounts();
  assert.deepEqual(accounts[0], { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy', tier: 'Gold', arr: 120000, renewalDate: '2027-03-31', csmOwner: 'Ian Fake', healthScore: 72,
    contacts: [], gates: { readinessAssessment: true, csatContact: false, successPlan: false }, openCtas: [] });
  assert.equal(accounts[1].arr, null);          // negative ARR is not a valid amount
  assert.equal(accounts[1].renewalDate, null);  // empty string
  assert.equal(accounts[1].healthScore, null);  // "n/a"
  assert.equal(accounts[2].arr, 45000);         // numeric string
  assert.deepEqual(validate(accountsSchema, { accounts }), []);
});

test('gainsight reads: rows in data.records[] give the same accounts', async () => {
  const a = await adapter(companyStub('gainsight-company-query-data.json').fn).listAccounts();
  const b = await adapter(companyStub('gainsight-company-query-records.json').fn).listAccounts();
  assert.deepEqual(b, a);
});

test('gainsight reads: missing fieldMap gives null fields and selects only Gsid and Name', async () => {
  const s = companyStub('gainsight-company-query-data.json');
  const accounts = await adapter(s.fn, { ...CFG, fieldMap: {}, gateFieldMap: {} }).listAccounts();
  assert.deepEqual(s.seen[0].body.select, ['Gsid', 'Name']);
  for (const a of accounts) for (const k of ['tier', 'arr', 'renewalDate', 'csmOwner', 'healthScore']) assert.equal(a[k], null, k);
  for (const a of accounts) assert.deepEqual(a.gates, { readinessAssessment: false, csatContact: false, successPlan: false });
});

test('gainsight reads: a gate is true only when its mapped field is exactly true', async () => {
  const accounts = await adapter(companyStub('gainsight-company-query-data.json').fn).listAccounts();
  assert.deepEqual(accounts.map((a) => a.gates), [
    { readinessAssessment: true, csatContact: false, successPlan: false },  // "yes" is not true
    { readinessAssessment: false, csatContact: true, successPlan: true },
    { readinessAssessment: false, csatContact: false, successPlan: false },
  ]);
});

test('gainsight reads: pages by offset until a short page (POST /v1/data/objects/query/Company)', async () => {
  const s = companyStub('gainsight-company-query-data.json');
  const accounts = await adapter(s.fn, CFG, 2).listAccounts();
  assert.equal(accounts.length, 3);
  assert.deepEqual(s.seen.map((r) => [r.url, r.body.offset, r.body.limit]), [[`${API}/v1/data/objects/query/Company`, 0, 2], [`${API}/v1/data/objects/query/Company`, 2, 2]]);
});

test('gainsight reads: contacts come from the configured Company Person query, grouped by company; none when unset', async () => {
  const personUrl = `${API}/v1/data/objects/query/FAKE_CompanyPerson`;
  const s = companyStub('gainsight-company-query-data.json', { [personUrl]: () => json(200, { result: true, data: [
    { FAKE_Company: '1P02FAKE0001', FAKE_Name: 'Pat Fake', FAKE_Email: 'pat.fake@fake-customer.invalid', FAKE_Role: 'Sponsor' },
    { FAKE_Company: '1P02FAKE0001', FAKE_Name: 'Lee Fake', FAKE_Email: null, FAKE_Role: null }] }) });
  const cq = { object: 'FAKE_CompanyPerson', companyField: 'FAKE_Company', nameField: 'FAKE_Name', emailField: 'FAKE_Email', roleField: 'FAKE_Role' };
  const accounts = await adapter(s.fn, { ...CFG, contactQuery: cq }).listAccounts();
  assert.deepEqual(accounts[0].contacts, [{ name: 'Pat Fake', email: 'pat.fake@fake-customer.invalid', role: 'Sponsor' }, { name: 'Lee Fake', email: null, role: null }]);
  assert.deepEqual(accounts[1].contacts, []);
  const s2 = companyStub('gainsight-company-query-data.json');
  await adapter(s2.fn).listAccounts();
  assert.equal(s2.seen.length, 1);
});

test('gainsight reads: Bearer from the token source; a reply with neither form names its keys; errors are scrubbed', async () => {
  const s = companyStub('gainsight-company-query-data.json');
  await adapter(s.fn).listAccounts();
  assert.equal(s.seen[0].init.headers.Authorization, 'Bearer FAKE-ACCESS-yy');
  await assert.rejects(adapter(async () => json(200, { result: true, rows: [] })).listAccounts(), /neither data\[\] nor data\.records\[\].*result, rows/);
  await assert.rejects(adapter(async () => json(401, { message: 'FAKE-ACCESS-yy rejected' })).listAccounts(), (e) => e.status === 401 && !e.message.includes('FAKE-ACCESS-yy'));
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/gainsight-read.test.mjs`
Expected: FAIL, `listAccounts is not built yet (connect-ready T-7)`.

- [ ] **Step 3: Write the read half of `connector/adapters/gainsight-rest.mjs`** (replace the file; `push` stays the T-2 stub)

```js
// Real Gainsight CS adapter (connect-ready §3.3). Tested on recorded-shape fixtures only; unproven until `--check`
// passes against the configured tenant. Node built-ins only; fetch is injected (deps.fetchImpl) or the global one.
import { join } from 'node:path';
import { requestJson, pacer, VendorError } from '../lib/vendor-http.mjs';
import { loadProof, isProven, tenantOf, healthName, resolveStateDir, FILES } from '../lib/state.mjs';
import { createTokenSource } from './gainsight-auth.mjs';

// CONFIRMED https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Company_and_Relationship_API/Company_API_Documentation (research Q8)
export const QUERY_PATH = '/v1/data/objects/query/';
export const PAGE_LIMIT = 5000;   // CONFIRMED (Q8): at most 5000 records per call; page by offset
// CONFIRMED (Q8; https://support.gainsight.com/Gainsight_NXT/Administration_and_Permissions/General_Administration/Gainsight_System_Limits):
// 100 calls/min is the lower of the two published limits; plan to it.
const MIN_INTERVAL_MS = 600;
// CONFIRMED (Q10 lookups): Company records carry Gsid and Name.
const ID_FIELD = 'Gsid';
const NAME_FIELD = 'Name';
export const FIELD_KEYS = ['tier', 'arr', 'renewalDate', 'csmOwner', 'healthScore'];
export const GATE_KEYS = ['readinessAssessment', 'csatContact', 'successPlan'];

// UNCONFIRMED (Q8): rows come back in data[] or in data.records[]; both are read, and --check records which.
export function rowsOf(resp) {
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && resp.data && Array.isArray(resp.data.records)) return resp.data.records;
  throw new VendorError(`Gainsight query reply has neither data[] nor data.records[] (top-level keys: ${resp && typeof resp === 'object' ? Object.keys(resp).join(', ') : typeof resp})`);
}
export const rowsShape = (resp) => (resp && Array.isArray(resp.data) ? 'data' : 'data.records');

const str = (v) => (v === undefined || v === null || v === '' ? null : String(v));
const num = (v) => { if (v === undefined || v === null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };

export function toAccount(r, fm = {}, gm = {}, contacts = new Map()) {
  const val = (k) => (fm[k] ? r[fm[k]] : undefined);
  const arr = num(val('arr'));
  const gsid = String(r[ID_FIELD]);
  return {
    gainsightId: gsid, name: String(r[NAME_FIELD]),
    tier: str(val('tier')), arr: arr !== null && arr >= 0 ? arr : null, renewalDate: str(val('renewalDate')),
    csmOwner: str(val('csmOwner')), healthScore: num(val('healthScore')),
    contacts: contacts.get(gsid) || [],
    // accounts.json requires booleans. A gate is true only when a mapped tenant field is exactly true; the tracker offers a gate only on true.
    gates: Object.fromEntries(GATE_KEYS.map((k) => [k, !!gm[k] && r[gm[k]] === true])),
    openCtas: [], // no CTA list query is in the research (UNCONFIRMED); the tracker does not read openCtas today
  };
}

export function create(cfg = {}, deps = {}) {
  const dir = resolveStateDir(deps.stateDir);
  const pace = pacer(MIN_INTERVAL_MS, deps.sleep);
  const pageLimit = deps.pageLimit || PAGE_LIMIT;
  const apiBase = String(cfg.apiBaseUrl || cfg.appUrl || '').replace(/\/+$/, '');
  const tokens = deps.tokenSource || createTokenSource({ cfg, fetchImpl: deps.fetchImpl, tokensPath: join(dir, FILES.tokens), now: deps.now });

  async function api(method, path, body) {
    if (!apiBase) throw new Error('gainsight-rest is not configured (missing gainsight.apiBaseUrl); run node connector/server.mjs --setup');
    const access = await tokens.accessToken(); // a rotated refresh token is already on disk here (T-6)
    await pace();
    // CONFIRMED header form (Q7). Whether every endpoint accepts a bearer token is UNCONFIRMED (Q7 note); --check finds out.
    return requestJson({ fetchImpl: deps.fetchImpl || globalThis.fetch, method, url: apiBase + path,
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body,
      secrets: [access, cfg.oauth && cfg.oauth.clientSecret], host: 'Gainsight' });
  }
  async function queryAll(object, select) {
    const out = [];
    for (let offset = 0; ; offset += pageLimit) {
      // UNCONFIRMED: whether `where` may be left out (Q8 shows it in the example); --check finds out.
      const rows = rowsOf(await api('POST', QUERY_PATH + encodeURIComponent(object), { select, limit: pageLimit, offset }));
      out.push(...rows);
      if (rows.length < pageLimit) return out;
    }
  }
  async function listContacts() {
    const q = cfg.contactQuery || {};
    const byCompany = new Map();
    if (!q.object || !q.companyField || !q.nameField) return byCompany; // UNCONFIRMED object (Q9): off until configured
    const select = [...new Set([q.companyField, q.nameField, q.emailField, q.roleField].filter(Boolean))];
    for (const r of await queryAll(q.object, select)) {
      const k = r[q.companyField];
      if (!k) continue;
      const list = byCompany.get(String(k)) || [];
      list.push({ name: String(r[q.nameField] ?? ''), email: q.emailField && r[q.emailField] ? String(r[q.emailField]) : null, role: q.roleField && r[q.roleField] ? String(r[q.roleField]) : null });
      byCompany.set(String(k), list);
    }
    return byCompany;
  }
  async function listAccounts() {
    const fm = cfg.fieldMap || {};
    const gm = cfg.gateFieldMap || {};
    const mapped = (m, keys) => keys.map((k) => String(m[k] || '').trim()).filter(Boolean);
    const select = [...new Set([ID_FIELD, NAME_FIELD, ...mapped(fm, FIELD_KEYS), ...mapped(gm, GATE_KEYS)])];
    const rows = await queryAll('Company', select);
    const contacts = await listContacts();
    return rows.filter((r) => r && r[ID_FIELD] && r[NAME_FIELD]).map((r) => toAccount(r, fm, gm, contacts));
  }

  return {
    get name() { return healthName('gainsight-rest', { proven: isProven(loadProof(dir), 'gainsight', 'read', tenantOf('gainsight', cfg)), dryRun: cfg.dryRun !== false }); },
    listAccounts,
    async push() { throw new Error('gainsight-rest: push is not built yet (connect-ready T-8)'); },
  };
}
```

- [ ] **Step 4: Update docs (same commit)**

In `connector/config.example.json`, add to `gainsight`:
`"fieldMap": { "tier": "", "arr": "", "renewalDate": "", "csmOwner": "", "healthScore": "" }`,
`"gateFieldMap": { "readinessAssessment": "", "csatContact": "", "successPlan": "" }` and
`"contactQuery": { "object": "", "companyField": "", "nameField": "", "emailField": "", "roleField": "" }`.

In `connector/CONTRACT.md`, under `GET /v1/accounts`, add: "`gainsight-rest` (tested on recorded-shape fixtures,
unproven until `--check`) reads Company through `POST /v1/data/objects/query/Company`. Field names come from
`gainsight.fieldMap`; an unmapped field is `null`. A gate is `true` only when its `gainsight.gateFieldMap` field
is exactly `true`. `contacts` come from `gainsight.contactQuery` (empty when unset). `openCtas` is `[]`."

- [ ] **Step 5: Run the tests**

Run: `node --test connector/test/gainsight-read.test.mjs` → 7 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 77`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add connector/adapters/gainsight-rest.mjs connector/config.example.json connector/CONTRACT.md connector/test/gainsight-read.test.mjs
git commit -m "T-7: gainsight-rest reads Company via configured fieldMap (data[] or data.records); tested on recorded-shape fixtures"
```

---

### Task T-8: `gainsight-rest` push, saved send record, dry-run

**Model:** Sonnet. **Spec:** §3.3 "push", D1, CR2, CR3 (saved send record), §4 T-8. **Blocker B1** applies:
`Success Plan objective` uses the default built below unless Ian rules otherwise.

**Files:**
- Modify: `connector/adapters/gainsight-rest.mjs` (add the push half), `connector/config.example.json`, `connector/CONTRACT.md`
- Test: `connector/test/gainsight-push.test.mjs`

**Interfaces:**
- Consumes: `api` (T-7, inside `create`); `readJson`, `writeJsonAtomic`, `tenantOf`, `sameTenant` and `FILES` (T-2); the `gainsight-timeline-create.json` fixture.
- Produces:
  - `TIMELINE_PATH`, `CTA_PATH`, `DRY_RUN_ERROR` (exactly `dry run: not sent; see connector/dry-run.jsonl`),
    `SUCCESS_PLAN_BLOCKED`, `TIMELINE_KINDS`
  - `buildRequest(item, cfg, now) -> {kind:'timeline'|'cta', method, path, body, idFrom(resp)}` (throws on missing config)
  - `push(items) -> results[]` (contract `push-response` items)
  - The optional item field `fields.subjectPrefix` (used by `--check --write` in T-10) is prepended to the
    Timeline Subject and the CTA Name.
  - T-9 inserts the write gate at the line marked `// T-9: write gate`.
- Config: `gainsight.authorEmail`, `gainsight.timeline.typeName`, `gainsight.cta.{type, companyIdField, idPath}`.
- `sent-record.json`: `{ "<itemId>": {externalId, kind, tenant, at} }`.

- [ ] **Step 1: Write the failing test** `connector/test/gainsight-push.test.mjs`

```js
// connect-ready T-8: gainsight-rest push, saved send record, dry-run. Stubbed fetch only. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { validate } from '../lib/validate.mjs';
import { create, DRY_RUN_ERROR, SUCCESS_PLAN_BLOCKED } from '../adapters/gainsight-rest.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pushSchema = JSON.parse(readFileSync(join(root, 'schemas', 'push-response.json'), 'utf8'));
const TIMELINE_OK = JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', 'gainsight-timeline-create.json'), 'utf8'));
const API = 'https://fake-tenant.gainsightcloud.invalid';
const CFG = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: API, apiBaseUrl: API, tenantId: 'FAKE-TENANT-1', dryRun: false,
  oauth: { clientSecret: 'FAKE-CLIENT-SECRET-zz' }, authorEmail: 'ian.fake@fake-osm.invalid',
  timeline: { typeName: 'FAKE_Meeting' }, cta: { type: 'FAKE_Risk', companyIdField: 'FAKE_CompanyId', idPath: '' } };
const NOW = new Date('2026-10-02T12:00:00Z');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const TL = { id: 'q-timeline-1', kind: 'Pending items batch', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { gates: [{ gateKey: 'readiness', contractKey: 'readinessAssessment', gainsightAction: 'Mark readiness assessment done' }] } };
const CTA = { id: 'q-cta-1', kind: 'At-Risk CTA', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { ctaName: 'Usage dropped', reason: 'Usage', severity: 'High' } };
const SP = { id: 'q-sp-1', kind: 'Success Plan objective', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { event: 'created', objective: 'Go live' } };

function stub(reply = () => json(200, TIMELINE_OK)) {
  const seen = []; let tokenCalls = 0;
  const fn = async (url, init) => { seen.push({ url, init, body: JSON.parse(init.body) }); return reply(url); };
  const tokenSource = { accessToken: async () => { tokenCalls++; return 'FAKE-ACCESS-yy'; } };
  return { fn, seen, tokenSource, tokenCalls: () => tokenCalls };
}
const adapter = (s, cfg = CFG, stateDir = mkdtempSync(join(tmpdir(), 'gs-push-'))) =>
  ({ stateDir, a: create(cfg, { fetchImpl: s.fn, tokenSource: s.tokenSource, sleep: async () => {}, now: () => NOW, stateDir }) });

test('push dry-run (the default): nothing is sent, each item fails with the dry-run error, the request is logged', async () => {
  const s = stub();
  const { a, stateDir } = adapter(s, { ...CFG, dryRun: undefined });
  const res = await a.push([TL, CTA]);
  assert.deepEqual(res.map((r) => [r.status, r.error]), [['failed', DRY_RUN_ERROR], ['failed', DRY_RUN_ERROR]]);
  assert.equal(DRY_RUN_ERROR, 'dry run: not sent; see connector/dry-run.jsonl');
  assert.equal(s.seen.length, 0);
  assert.equal(s.tokenCalls(), 0);
  const lines = readFileSync(join(stateDir, 'dry-run.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].url, `${API}/v1/ant/es/activity`);
  assert.equal(lines[0].body.records[0].ExternalId, 'q-timeline-1');
  assert.equal(lines[1].url, `${API}/v2/cockpit/cta`);
});

test('push dry-run file holds no credential', async () => {
  const s = stub();
  const { a, stateDir } = adapter(s, { ...CFG, dryRun: true });
  await a.push([TL, CTA]);
  const text = readFileSync(join(stateDir, 'dry-run.jsonl'), 'utf8');
  for (const secret of ['FAKE-CLIENT-SECRET-zz', 'FAKE-ACCESS-yy']) assert.ok(!text.includes(secret), secret);
  assert.ok(text.includes('Bearer [redacted]'));
});

test('push live (sandbox): a Timeline item is POSTed with ExternalId = item id and answers sent with the activityId', async () => {
  const s = stub();
  const { a } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: '1I00FAKEACT0001', error: null });
  assert.equal(s.seen[0].url, `${API}/v1/ant/es/activity`);
  assert.equal(s.seen[0].init.headers.Authorization, 'Bearer FAKE-ACCESS-yy');
  const rec = s.seen[0].body.records[0];
  assert.deepEqual([rec.ContextName, rec.TypeName, rec.ExternalId, rec.Author, rec.companyName], ['Company', 'FAKE_Meeting', 'q-timeline-1', 'ian.fake@fake-osm.invalid', 'Aldridge Energy']);
  assert.equal(rec.ActivityDate, '2026-10-02T12:00:00.000+0000');
  assert.match(rec.Notes, /Mark readiness assessment done/);
});

test('push: a repeated id after a restart answers sent with the stored id and makes no call (saved send record)', async () => {
  const s = stub();
  const { a, stateDir } = adapter(s);
  await a.push([TL]);
  const rec = JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'));
  assert.deepEqual(Object.keys(rec['q-timeline-1']).sort(), ['at', 'externalId', 'kind', 'tenant']);
  const again = adapter(s, CFG, stateDir).a;  // a new instance = a restart
  const [r] = await again.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: '1I00FAKEACT0001', error: null });
  assert.equal(s.seen.length, 1);
});

test('push: a failed item is not stored, so a retry is a real attempt; the error is scrubbed', async () => {
  const s = stub(() => json(500, { errorDesc: 'boom FAKE-ACCESS-yy' }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.equal(r.status, 'failed');
  assert.ok(!r.error.includes('FAKE-ACCESS-yy'));
  assert.equal(existsSync(join(stateDir, 'sent-record.json')), false);
  await a.push([TL]);
  assert.equal(s.seen.length, 2);
});

test('push: a duplicate-ExternalId rejection (GS_TL_10_0107) means already in Gainsight: sent, recorded', async () => {
  const s = stub(() => json(400, { result: false, errorCode: 'GS_TL_10_0107', errorDesc: 'duplicate' }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: 'q-timeline-1', error: null });
  assert.ok(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))['q-timeline-1']);
});

test('push: At-Risk CTA is POST /v2/cockpit/cta with referenceId, Name, type, OwnerEmail and the configured company field', async () => {
  const s = stub(() => json(200, { result: true }));
  const { a } = adapter(s);
  const [r] = await a.push([CTA]);
  assert.equal(r.status, 'sent');
  assert.equal(r.externalId, null); // cta.idPath unset: the Gsid's place in the reply is UNCONFIRMED
  assert.equal(s.seen[0].url, `${API}/v2/cockpit/cta`);
  assert.deepEqual(s.seen[0].body.requests[0].record, { referenceId: 'q-cta-1', Name: 'Usage dropped', type: 'FAKE_Risk', OwnerEmail: 'ian.fake@fake-osm.invalid', FAKE_CompanyId: '1P02FAKE0001' });
  const s2 = stub();
  const [m] = await adapter(s2, { ...CFG, cta: { type: 'FAKE_Risk', companyIdField: '' } }).a.push([{ ...CTA, id: 'q-cta-2' }]);
  assert.match(m.error, /gainsight\.cta\.companyIdField is empty/);
  const [n] = await adapter(s2).a.push([{ ...CTA, id: 'q-cta-3', customerRef: { gainsightId: null, name: 'Aldridge Energy' } }]);
  assert.match(n.error, /no Gainsight id/);
  assert.equal(s2.seen.length, 0);
});

test('push: Success Plan objective is not sent (blocker B1); the whole response validates push-response.json', async () => {
  const s = stub();
  const res = await adapter(s).a.push([SP, TL]);
  assert.deepEqual(res[0], { id: 'q-sp-1', status: 'failed', externalId: null, error: SUCCESS_PLAN_BLOCKED });
  assert.equal(s.seen.length, 1); // only the Timeline item
  assert.deepEqual(validate(pushSchema, { results: res }), []);
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/gainsight-push.test.mjs`
Expected: FAIL, `does not provide an export named 'DRY_RUN_ERROR'`.

- [ ] **Step 3: Add the request builders** to `connector/adapters/gainsight-rest.mjs` (above `create`). Add `appendFileSync` to an `import … from 'node:fs'` line, and import `readJson`, `writeJsonAtomic` and `sameTenant` from state.

```js
// CONFIRMED https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs (research Q10)
export const TIMELINE_PATH = '/v1/ant/es/activity';
// CONFIRMED https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Cockpit_API/Call_To_Action_(CTA)_API_Documentation (research Q12)
export const CTA_PATH = '/v2/cockpit/cta';
// CONFIRMED (research-write-safety.md, Timeline page): a repeated ExternalId is rejected with GS_TL_10_0107.
// Where the code sits in the reply is UNCONFIRMED, so the whole reply body is searched.
const DUPLICATE_EXTERNAL_ID = 'GS_TL_10_0107';
export const DRY_RUN_ERROR = 'dry run: not sent; see connector/dry-run.jsonl';
export const SUCCESS_PLAN_BLOCKED = 'not sent: Success Plan objectives are not built yet (adding an objective to an existing Success Plan is unconfirmed in Gainsight\'s docs); update it by hand in Gainsight';
export const TIMELINE_KINDS = new Set(['Pending items batch', 'Success Outcome Plan']); // D1

function need(cfg, paths) {
  for (const p of paths) {
    const v = p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), cfg);
    if (!String(v || '').trim()) throw new Error(`config gainsight.${p} is empty; see connector/CONNECT-GAINSIGHT.md`);
  }
}
// CONFIRMED pattern "yyyy-MM-dd'T'HH:mm:ss.SSSZ" (Q10). Rendering Java's Z as +0000 is UNCONFIRMED.
const gsDate = (d) => d.toISOString().replace('Z', '+0000');
function notesFor(it) {
  const f = it.fields || {};
  if (it.kind === 'Pending items batch') return ['Pending items from the OSM tracker:', ...(f.gates || []).map((g) => `- ${g.gainsightAction || g.gateKey}`)].join('\n');
  if (it.kind === 'Success Outcome Plan') return ['Success outcomes from the OSM tracker:', ...(f.outcomes || []).map((o) => `- ${o}`)].join('\n');
  return '';
}

export function buildRequest(it, cfg, now) {
  const ref = it.customerRef || {};
  const f = it.fields || {};
  const prefix = f.subjectPrefix ? `${f.subjectPrefix} ` : '';
  if (TIMELINE_KINDS.has(it.kind)) {
    need(cfg, ['timeline.typeName', 'authorEmail']);
    return {
      kind: 'timeline', method: 'POST', path: TIMELINE_PATH,
      body: {
        // Required: ExternalId, Author, ContextName, TypeName, Subject (max 255), Notes (~131,000), ActivityDate, context id via lookup. CONFIRMED (Q10).
        records: [{ ContextName: 'Company', TypeName: cfg.timeline.typeName, ExternalId: it.id,
          Subject: `${prefix}${it.kind}: ${ref.name}`.slice(0, 255), Notes: notesFor(it).slice(0, 131000),
          ActivityDate: gsDate(now), Author: cfg.authorEmail, companyName: ref.name }],
        lookups: {
          AuthorId: { objectName: 'GsUser', fields: { Author: 'Email' }, lookupField: 'Gsid', multiMatchOption: 'FIRSTMATCH', onNoMatch: 'ERROR' }, // CONFIRMED (Q10)
          // objectName/fields/lookupField CONFIRMED (Q10); the two match options are UNCONFIRMED here (copied from AuthorId).
          GsCompanyId: { objectName: 'Company', fields: { companyName: 'Name' }, lookupField: 'Gsid', multiMatchOption: 'FIRSTMATCH', onNoMatch: 'ERROR' },
        },
      },
      // CONFIRMED (Q10): {"data":{"success":{"<externalId>":[{"activityId":"<GSID>"}]}}}
      idFrom: (resp) => { const s = resp && resp.data && resp.data.success && resp.data.success[it.id]; return s && s[0] && s[0].activityId ? String(s[0].activityId) : it.id; },
    };
  }
  if (it.kind === 'At-Risk CTA') {
    need(cfg, ['cta.type', 'cta.companyIdField', 'authorEmail']);
    if (!ref.gainsightId) throw new Error('this customer has no Gainsight id in the tracker; link it before sending a CTA');
    return {
      kind: 'cta', method: 'POST', path: CTA_PATH,
      // Mandatory: referenceId, Name, type (name), owner, company. CONFIRMED (Q12). The company field's name is
      // config (cta.companyIdField). reason and severity need picklist ids (UNCONFIRMED), so they are not sent.
      body: { requests: [{ record: { referenceId: it.id, Name: `${prefix}${f.ctaName || `At-risk: ${ref.name}`}`.slice(0, 255), type: cfg.cta.type,
        OwnerEmail: cfg.authorEmail, [cfg.cta.companyIdField]: ref.gainsightId } }] },
      // UNCONFIRMED (gap 2): where the Gsid sits in the reply; cta.idPath names it once --check --write has seen one.
      idFrom: (resp) => { const v = cfg.cta.idPath ? pick(resp, cfg.cta.idPath) : null; return v == null ? null : String(v); },
    };
  }
  if (it.kind === 'Success Plan objective') throw new Error(SUCCESS_PLAN_BLOCKED); // blocker B1
  throw new Error(`unknown queue kind: ${it.kind}`);
}
```

(Import `pick` from `../lib/vendor-http.mjs` too.)

- [ ] **Step 4: Add `push` inside `create`** (replace the stub; add `now` and `tenant` at the top of `create`)

```js
  const now = deps.now || (() => new Date());
  const tenant = tenantOf('gainsight', cfg);
  const fail = (it, error) => ({ id: it.id, status: 'failed', externalId: null, error });
  const sentOk = (it, externalId) => ({ id: it.id, status: 'sent', externalId, error: null });

  function appendDryRun(it, req) {
    const line = { at: now().toISOString(), itemId: it.id, kind: it.kind, method: req.method, url: apiBase + req.path,
      headers: { Authorization: 'Bearer [redacted]', 'Content-Type': 'application/json' }, body: req.body };
    appendFileSync(join(dir, FILES.dryRun), `${JSON.stringify(line)}\n`);
  }
  async function sendOne(it, req, record) {
    let externalId;
    try { externalId = req.idFrom(await api(req.method, req.path, req.body)); }
    catch (e) {
      if (req.kind === 'timeline' && JSON.stringify((e && e.body) || '').includes(DUPLICATE_EXTERNAL_ID)) externalId = it.id;
      else return fail(it, e.message);
    }
    record[it.id] = { externalId, kind: it.kind, tenant, at: now().toISOString() };
    try { writeJsonAtomic(join(dir, FILES.sent), record); }
    catch (e) { console.error(`gainsight-rest: item ${it.id} was sent but ${join(dir, FILES.sent)} could not be written (${e.code || e.message}); a repeat Send could duplicate it`); }
    return sentOk(it, externalId);
  }
  async function push(items) {
    const record = readJson(join(dir, FILES.sent), {});
    const dry = cfg.dryRun !== false; // CR2: dry-run is the default
    const results = [];
    for (const it of items) {
      const prior = record[it.id];
      if (prior && sameTenant(prior.tenant, tenant)) { results.push(sentOk(it, prior.externalId)); continue; } // CR3
      let req;
      try { req = buildRequest(it, cfg, now()); } catch (e) { results.push(fail(it, e.message)); continue; }
      if (dry) { appendDryRun(it, req); results.push(fail(it, DRY_RUN_ERROR)); continue; }
      // T-9: write gate
      results.push(await sendOne(it, req, record));
    }
    return results;
  }
```

Return `push` from `create` (it replaces the stub).

- [ ] **Step 5: Update docs (same commit)**

In `connector/config.example.json`, add to `gainsight`: `"authorEmail": ""`, `"timeline": { "typeName": "" }` and
`"cta": { "type": "", "companyIdField": "", "idPath": "" }`.

In `connector/CONTRACT.md`, under `POST /v1/push`, add a `gainsight-rest` paragraph:
- Kinds: `Pending items batch` and `Success Outcome Plan` become a Timeline activity (D1) with
  `ExternalId` = item id. `At-Risk CTA` becomes `POST /v2/cockpit/cta`. `Success Plan objective` is not sent
  (blocker B1, error text quoted).
- Dry-run is on by default (`gainsight.dryRun`): requests go to `dry-run.jsonl` with credentials redacted, and
  each item answers `failed` with `dry run: not sent; see connector/dry-run.jsonl`.
- Saved send record: `sent-record.json` keeps item id → `{externalId, kind, tenant, at}`. A repeated id for the
  same tenant answers `sent` with no call, and a `failed` id is not stored.

Fill in the state-file lines for `sent-record.json` and `dry-run.jsonl`.

- [ ] **Step 6: Run the tests**

Run: `node --test connector/test/gainsight-push.test.mjs` → 8 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 85`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add connector/adapters/gainsight-rest.mjs connector/config.example.json connector/CONTRACT.md connector/test/gainsight-push.test.mjs
git commit -m "T-8: gainsight-rest push with saved send record and default dry-run (stubbed fetch only; unproven until --check)"
```

---

### Task T-9: write gate and `--unlock-production`

**Model:** top model (production write safety). **Spec:** §3.4, D3, CR2, CR3, §4 T-9. Read spec gap 5 first.

**Files:**
- Create: `connector/lib/write-gate.mjs`, `connector/lib/unlock.mjs`, `connector/lib/cli.mjs`
- Modify: `connector/adapters/gainsight-rest.mjs` (the `// T-9: write gate` line), `connector/server.mjs` (CLI dispatch in the main block), `connector/CONTRACT.md`
- Test: `connector/test/write-gate.test.mjs`

**Interfaces:**
- Consumes: `loadProof`, `saveProof`, `tenantOf` and `sameTenant` (T-2); `push` (T-8).
- Produces:
  - `FIRST_SEND_ERROR` (exactly `first live send is 1 item; check it in Gainsight, then Send again`)
  - `gateFor({cfg, proof}) -> {allow:true, firstSendOnly:boolean} | {allow:false, error:string}`
  - `markFirstSendDone(stateDir, now)`
  - `runUnlock({cfg, stateDir, ask, out, now?}) -> exit code`
  - `makeAsk(input?, output?) -> ask(question, {secret}) -> Promise<string>`, with `ask.close()`
  - `runCli(argv, {config, configPath, stateDir, ask, out, deps}) -> exit code`; `COMMANDS` (array)
  - proof.json `gainsight.unlock = {tenant, at, basis:'sandbox-proof'|'no-sandbox', sandboxProofAt, firstSendDone}`

- [ ] **Step 1: Write the failing test** `connector/test/write-gate.test.mjs`

```js
// connect-ready T-9: the §3.4 write gate and --unlock-production. Stubbed fetch only. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { create } from '../adapters/gainsight-rest.mjs';
import { gateFor, FIRST_SEND_ERROR } from '../lib/write-gate.mjs';
import { runUnlock } from '../lib/unlock.mjs';
import { loadProof, saveProof, recordProof, tenantOf } from '../lib/state.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIMELINE_OK = JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', 'gainsight-timeline-create.json'), 'utf8'));
const PROD = 'https://fake-prod.gainsightcloud.invalid';
const SBX = 'https://fake-sbx.gainsightcloud.invalid';
const base = { adapter: 'gainsight-rest', dryRun: false, authorEmail: 'ian.fake@fake-osm.invalid', timeline: { typeName: 'FAKE_Meeting' }, oauth: {} };
const PROD_CFG = { ...base, environment: 'production', appUrl: PROD, apiBaseUrl: PROD, tenantId: 'FAKE-PROD-1' };
const SBX_CFG = { ...base, environment: 'sandbox', appUrl: SBX, apiBaseUrl: SBX, tenantId: 'FAKE-SBX-1' };
const NOW = new Date('2026-10-02T12:00:00Z');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const item = (n) => ({ id: `q-${n}`, kind: 'Pending items batch', customerRef: { gainsightId: '1P02FAKE0001', name: 'Aldridge Energy' }, fields: { gates: [] } });
const tmp = () => mkdtempSync(join(tmpdir(), 'gate-'));
function adapter(cfg, stateDir, reply = () => json(200, TIMELINE_OK)) {
  const seen = [];
  const a = create(cfg, { stateDir, now: () => NOW, sleep: async () => {}, tokenSource: { accessToken: async () => 'FAKE-ACCESS-yy' },
    fetchImpl: async (url, init) => { seen.push(JSON.parse(init.body).records[0].ExternalId); return reply(); } });
  return { a, seen };
}
const unlock = (dir, cfg = PROD_CFG, basis = 'no-sandbox') => { const p = loadProof(dir); p.gainsight = { ...(p.gainsight || {}), unlock: { tenant: tenantOf('gainsight', cfg), at: NOW.toISOString(), basis, sandboxProofAt: null, firstSendDone: false } }; saveProof(dir, p); };

test('gate: a sandbox tenant may write, with no first-send limit', () => {
  assert.deepEqual(gateFor({ cfg: SBX_CFG, proof: {} }), { allow: true, firstSendOnly: false });
});

test('gate: no environment set blocks every item with an error naming --setup, and nothing is sent', async () => {
  const { a, seen } = adapter({ ...PROD_CFG, environment: '' }, tmp());
  const res = await a.push([item(1), item(2)]);
  assert.ok(res.every((r) => r.status === 'failed' && /--setup/.test(r.error)));
  assert.equal(seen.length, 0);
});

test('gate: production without an unlock names both ways forward', async () => {
  const { a, seen } = adapter(PROD_CFG, tmp());
  const [r] = await a.push([item(1)]);
  assert.match(r.error, /--check --write/);
  assert.match(r.error, /--unlock-production/);
  assert.equal(seen.length, 0);
});

test('gate: an unlock recorded for another tenant is void (CR3)', async () => {
  const dir = tmp();
  unlock(dir, { ...PROD_CFG, appUrl: 'https://other.gainsightcloud.invalid' });
  const { a, seen } = adapter(PROD_CFG, dir);
  const [r] = await a.push([item(1)]);
  assert.equal(r.status, 'failed');
  assert.equal(seen.length, 0);
});

test('gate: after unlock the first production push sends only its first item; the limit lifts once it is sent', async () => {
  const dir = tmp();
  unlock(dir);
  const { a, seen } = adapter(PROD_CFG, dir);
  const res = await a.push([item(1), item(2), item(3)]);
  assert.deepEqual(res.map((r) => r.status), ['sent', 'failed', 'failed']);
  assert.equal(res[1].error, FIRST_SEND_ERROR);
  assert.equal(FIRST_SEND_ERROR, 'first live send is 1 item; check it in Gainsight, then Send again');
  assert.deepEqual(seen, ['q-1']);
  assert.equal(loadProof(dir).gainsight.unlock.firstSendDone, true);
  const res2 = await a.push([item(2), item(3)]);
  assert.deepEqual(res2.map((r) => r.status), ['sent', 'sent']);
});

test('gate: if the first live item fails, the 1-item limit stays', async () => {
  const dir = tmp();
  unlock(dir);
  const { a, seen } = adapter(PROD_CFG, dir, () => json(500, { errorDesc: 'boom' }));
  const res = await a.push([item(1), item(2)]);
  assert.deepEqual(res.map((r) => r.status), ['failed', 'failed']);
  assert.equal(res[1].error, FIRST_SEND_ERROR);
  assert.equal(loadProof(dir).gainsight.unlock.firstSendDone, false);
  await a.push([item(1), item(2)]);
  assert.deepEqual(seen, ['q-1', 'q-1']);
});

test('unlock: the tenant URL must be typed back; basis records whether a sandbox write proof existed', async () => {
  const out = [];
  const dir = tmp();
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir, ask: async () => 'https://wrong.invalid', out: (l) => out.push(l), now: () => NOW }), 1);
  assert.equal(loadProof(dir).gainsight, undefined);
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir, ask: async () => `${PROD}/`, out: (l) => out.push(l), now: () => NOW }), 0);
  assert.equal(loadProof(dir).gainsight.unlock.basis, 'no-sandbox');
  assert.ok(out.some((l) => l.includes(PROD)) && out.some((l) => /1 item/.test(l)));
  const dir2 = tmp();
  recordProof(dir2, 'gainsight', 'write', { tenant: tenantOf('gainsight', SBX_CFG), environment: 'sandbox', now: NOW });
  assert.equal(await runUnlock({ cfg: PROD_CFG, stateDir: dir2, ask: async () => PROD, out: () => {}, now: () => NOW }), 0);
  assert.equal(loadProof(dir2).gainsight.unlock.basis, 'sandbox-proof');
  assert.equal(loadProof(dir2).gainsight.unlock.sandboxProofAt, NOW.toISOString());
});

test('unlock refuses a sandbox tenant or a non-gainsight-rest config; dry-run still sends nothing after unlock', async () => {
  const out = [];
  assert.equal(await runUnlock({ cfg: SBX_CFG, stateDir: tmp(), ask: async () => SBX, out: (l) => out.push(l) }), 1);
  assert.equal(await runUnlock({ cfg: { adapter: 'fake' }, stateDir: tmp(), ask: async () => '', out: (l) => out.push(l) }), 1);
  assert.ok(out.every((l) => l.startsWith('FAIL unlock:')));
  const dir = tmp();
  unlock(dir);
  const { a, seen } = adapter({ ...PROD_CFG, dryRun: true }, dir);
  const [r] = await a.push([item(1)]);
  assert.equal(r.status, 'failed');
  assert.equal(seen.length, 0);
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/write-gate.test.mjs`
Expected: FAIL, `Cannot find module …write-gate.mjs`.

- [ ] **Step 3: Create `connector/lib/write-gate.mjs` and `connector/lib/unlock.mjs`**

```js
// Write gate (connect-ready §3.4, CR2, CR3, D3). A non-dry-run push is allowed only for a sandbox tenant, or for a
// production tenant that Ian unlocked with --unlock-production. The unlock is tied to that tenant, and after
// unlock the first push sends one item. Node built-ins only.
import { loadProof, saveProof, tenantOf, sameTenant } from './state.mjs';

export const FIRST_SEND_ERROR = 'first live send is 1 item; check it in Gainsight, then Send again';

export function gateFor({ cfg = {}, proof = {} }) {
  if (cfg.environment === 'sandbox') return { allow: true, firstSendOnly: false };
  if (cfg.environment !== 'production') return { allow: false, error: 'writes blocked: gainsight.environment is not set to "sandbox" or "production"; run node connector/server.mjs --setup' };
  const u = proof.gainsight && proof.gainsight.unlock;
  if (!u || !sameTenant(u.tenant, tenantOf('gainsight', cfg))) {
    return { allow: false, error: 'writes blocked on production: run node connector/server.mjs --check --write against the sandbox, then --unlock-production (or, with no sandbox, --unlock-production alone)' };
  }
  return { allow: true, firstSendOnly: !u.firstSendDone };
}

export function markFirstSendDone(stateDir, now = new Date()) {
  const proof = loadProof(stateDir);
  if (!proof.gainsight || !proof.gainsight.unlock) return;
  proof.gainsight.unlock = { ...proof.gainsight.unlock, firstSendDone: true, firstSentAt: now.toISOString() };
  saveProof(stateDir, proof);
}
```

```js
// --unlock-production (connect-ready §3.4, D3). Prints the tenant, requires its URL typed back, records the unlock
// against that tenant, and arms the 1-item first send. Node built-ins only.
import { loadProof, saveProof, tenantOf } from './state.mjs';

const norm = (u) => String(u || '').trim().replace(/\/+$/, '');

export async function runUnlock({ cfg = {}, stateDir, ask, out = console.log, now = () => new Date() }) {
  if (cfg.adapter !== 'gainsight-rest') { out('FAIL unlock: gainsight.adapter is not "gainsight-rest"; run node connector/server.mjs --setup first'); return 1; }
  if (cfg.environment !== 'production') { out(`FAIL unlock: gainsight.environment is "${cfg.environment || ''}"; unlock is for production only (sandbox writes need no unlock)`); return 1; }
  const proof = loadProof(stateDir);
  const sbx = proof.gainsight && proof.gainsight.write && proof.gainsight.write.environment === 'sandbox' ? proof.gainsight.write : null;
  out(`Production tenant: ${norm(cfg.appUrl)} (tenant id ${cfg.tenantId || 'not set'})`);
  out(sbx ? `Sandbox write proof: passed ${sbx.provenAt} against ${sbx.tenant && sbx.tenant.appUrl}` : 'No sandbox write proof. Unlocking without a sandbox (default D3).');
  out('After unlock, the first Send sends 1 item only. Check it in Gainsight, then Send again.');
  const typed = await ask('Type the production tenant URL to unlock: ');
  if (norm(typed) !== norm(cfg.appUrl)) { out('FAIL unlock: the URL typed does not match the configured tenant; nothing changed'); return 1; }
  proof.gainsight = { ...(proof.gainsight || {}), unlock: { tenant: tenantOf('gainsight', cfg), at: now().toISOString(),
    basis: sbx ? 'sandbox-proof' : 'no-sandbox', sandboxProofAt: sbx ? sbx.provenAt : null, firstSendDone: false } };
  saveProof(stateDir, proof);
  out('PASS unlock: production writes allowed for this tenant; the first Send sends 1 item');
  return 0;
}
```

- [ ] **Step 4: Put the gate into `push`**. In `gainsight-rest.mjs`, import `gateFor`, `markFirstSendDone` and `FIRST_SEND_ERROR`. Replace the `// T-9: write gate` line and the `results.push(await sendOne(...))` after it with:

```js
      if (!gate) gate = gateFor({ cfg, proof: loadProof(dir) });
      if (!gate.allow) { results.push(fail(it, gate.error)); continue; }
      if (gate.firstSendOnly && firstUsed) { results.push(fail(it, FIRST_SEND_ERROR)); continue; }
      const r = await sendOne(it, req, record);
      if (gate.firstSendOnly) { firstUsed = true; if (r.status === 'sent') markFirstSendDone(dir, now()); }
      results.push(r);
```

Declare `let gate = null; let firstUsed = false;` at the top of `push`.

- [ ] **Step 5: Create `connector/lib/cli.mjs` and the dispatch in `server.mjs`**

```js
// Command-line commands for connector/server.mjs (connect-ready §3.5). Node built-ins only.
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { runUnlock } from './unlock.mjs';

export const COMMANDS = ['--unlock-production'];

// ask(question, {secret}) -> answer. A secret answer is never echoed: in a terminal readline echoes into `sink`, which drops it.
export function makeAsk(input = process.stdin, output = process.stdout) {
  let muted = false;
  const sink = new Writable({ write(chunk, enc, cb) { if (!muted) output.write(chunk, enc); cb(); } });
  const rl = readline.createInterface({ input, output: sink, terminal: !!input.isTTY });
  const ask = (q, { secret = false } = {}) => new Promise((res) => {
    output.write(q);
    muted = secret;
    rl.question('', (a) => { muted = false; if (secret) output.write('\n'); res(a); });
  });
  ask.close = () => rl.close();
  return ask;
}

export async function runCli(argv, { config = {}, configPath, stateDir, ask, out = console.log, deps = {} } = {}) {
  if (argv.includes('--unlock-production')) return runUnlock({ cfg: config.gainsight || {}, stateDir, ask, out });
  out(`unknown command: ${argv.join(' ')}`);
  return 2;
}
```

In `connector/server.mjs`'s main block, directly after `const config = JSON.parse(...)`, add:

```js
  const args = process.argv.slice(2);
  if (args.length) {
    const cli = await import('./lib/cli.mjs');
    if (args.some((a) => cli.COMMANDS.includes(a))) {
      const ask = cli.makeAsk();
      const code = await cli.runCli(args, { config, configPath: env.CONNECTOR_CONFIG || join(here, 'config.json'), stateDir: env.CONNECTOR_STATE_DIR, ask });
      ask.close();
      process.exit(code);
    }
  }
```

(Top-level `await` is valid in this ESM main block. Arguments that are not commands start the server as before.)

- [ ] **Step 6: Update docs, then run the tests**

In `connector/CONTRACT.md`, add `## Write gate (gainsight-rest)`. It says three things. A non-dry-run push is
allowed for a sandbox tenant, or for production after `--unlock-production`, which needs the tenant URL typed back
and is tied to that tenant. The first production push sends 1 item and the rest answer `failed` with the
`FIRST_SEND_ERROR` text. Every other case answers `failed` with the missing step.

Under `## Running it`, add the `--unlock-production` command.

Run: `node --test connector/test/write-gate.test.mjs` → 8 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 93`, `# fail 0`. T-8's tests still pass because their config is `environment: 'sandbox'`.

- [ ] **Step 7: Commit**

```bash
git add connector/lib/write-gate.mjs connector/lib/unlock.mjs connector/lib/cli.mjs connector/adapters/gainsight-rest.mjs connector/server.mjs connector/CONTRACT.md connector/test/write-gate.test.mjs
git commit -m "T-9: write gate (sandbox, or production after --unlock-production tied to tenant) and 1-item first live send"
```

---

### Task T-10: `--check` and `--check --write`

**Model:** Sonnet. **Spec:** §3.5 `--check`, `--check --write`, D4, A-8, §4 T-10. **Blocker B2** applies (the
read-back is SKIP).

**Files:**
- Create: `connector/lib/check.mjs`
- Modify: `connector/adapters/gong-rest.mjs` (add `probe`), `connector/adapters/gainsight-rest.mjs` (add `authProbe` and `probeRead`), `connector/lib/cli.mjs` (`--check`), `connector/CONTRACT.md`
- Test: `connector/test/check.test.mjs`

**Interfaces:**
- Consumes: `loadAdapters` (T-2), `recordProof` and `tenantOf` (T-2), `FIELD_KEYS` and `GATE_KEYS` (T-7), `push` and `subjectPrefix` (T-8), the gate (T-9).
- Produces:
  - `gong.probe() -> page` (one page, last 24 h)
  - `gainsight.authProbe() -> Promise<void>`
  - `gainsight.probeRead(select, object = 'Company') -> {shape, rows}` (limit 1)
  - `runCheck({config, stateDir, deps, out, write, now}) -> exit code`
  - Line format: `PASS <step>[: detail]`, `FAIL <step>: <what to fix>; who fixes it: <who>`, `SKIP <step>: <why>`

- [ ] **Step 1: Write the failing test** `connector/test/check.test.mjs`

```js
// connect-ready T-10: --check and --check --write against stubbed tenants. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { runCheck } from '../lib/check.mjs';
import { loadProof } from '../lib/state.mjs';
import { loadAdapters } from '../adapters/index.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (f) => JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', f), 'utf8'));
const EXAMPLE = JSON.parse(readFileSync(join(root, 'config.example.json'), 'utf8'));
const NOW = new Date('2026-10-02T12:00:00Z');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const GONG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: 'ian.fake@fake-osm.invalid' };
const API = 'https://fake-sbx.gainsightcloud.invalid';
const GS = { adapter: 'gainsight-rest', environment: 'sandbox', appUrl: API, apiBaseUrl: API, tenantId: 'FAKE-SBX-1', dryRun: true, oauth: { clientId: 'FAKE-CLIENT-ID' },
  authorEmail: 'ian.fake@fake-osm.invalid', timeline: { typeName: 'FAKE_Meeting' }, cta: { type: 'FAKE_Risk', companyIdField: 'FAKE_CompanyId', idPath: '' },
  fieldMap: { tier: 'FAKE_Tier__gc' }, gateFieldMap: {} };
const tmp = () => mkdtempSync(join(tmpdir(), 'check-'));
const run = async (config, fetchImpl, { write = false, stateDir = tmp() } = {}) => {
  const lines = [];
  const code = await runCheck({ config, stateDir, write, now: () => NOW, out: (l) => lines.push(l),
    deps: { fetchImpl, sleep: async () => {}, now: () => NOW, tokenSource: { accessToken: async () => 'FAKE-ACCESS-yy' } } });
  return { code, lines, stateDir };
};
const gsTenant = (seen, { badField = null } = {}) => async (url, init) => {
  const body = JSON.parse(init.body); seen.push({ url, body });
  if (url.endsWith('/v1/data/objects/query/Company')) {
    if (badField && body.select.includes(badField)) return json(400, { result: false, errorCode: 'FAKE_BAD_FIELD', errorDesc: `unknown field ${badField}` });
    return json(200, { ...fx('gainsight-company-query-data.json'), data: fx('gainsight-company-query-data.json').data.slice(0, 1) });
  }
  if (url.endsWith('/v1/ant/es/activity')) { const id = body.records[0].ExternalId; return json(200, { data: { failures: {}, success: { [id]: [{ activityId: `ACT-${id}` }] } }, result: true }); }
  if (url.endsWith('/v2/cockpit/cta')) return json(200, { result: true });
  return json(404, {});
};

test('check A-8: with config.example.json every line is SKIP, exit 0, nothing recorded', async () => {
  const r = await run(EXAMPLE, async () => { throw new Error('no fetch expected'); });
  assert.equal(r.code, 0);
  assert.ok(r.lines.length >= 2 && r.lines.every((l) => l.startsWith('SKIP ')), r.lines.join('\n'));
  assert.equal(existsSync(join(r.stateDir, 'proof.json')), false);
});

test('check A-8 through the CLI: node connector/server.mjs --check prints only SKIP lines and exits 0', () => {
  const r = spawnSync(process.execPath, [join(root, 'server.mjs'), '--check'], { encoding: 'utf8',
    env: { ...process.env, CONNECTOR_CONFIG: join(root, 'config.example.json'), CONNECTOR_STATE_DIR: tmp() } });
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.trim().split(/\r?\n/);
  assert.ok(lines.length >= 2 && lines.every((l) => l.startsWith('SKIP ')), r.stdout);
});

test('check: a stubbed Gong tenant passes config, auth and read, records the proof, and health drops "unproven"', async () => {
  const r = await run({ gong: GONG }, async () => json(200, fx('gong-calls-extensive-page2.json')));
  assert.equal(r.code, 0);
  for (const step of ['PASS gong config', 'PASS gong auth', 'PASS gong read']) assert.ok(r.lines.some((l) => l.startsWith(step)), step);
  const p = loadProof(r.stateDir).gong.read;
  assert.equal(p.state, 'proven');
  assert.deepEqual(p.tenant, { baseUrl: 'https://fake-tenant.gong.invalid' });
  assert.ok(p.shapes.metaDataKeys.includes('started'));
  assert.equal(loadAdapters({ gong: GONG }, { stateDir: r.stateDir }).gong.name, 'gong-rest');
});

test('check: Gong 401 is FAIL gong auth naming the admin; exit 1; no proof; no key or secret printed', async () => {
  const r = await run({ gong: GONG }, async () => json(401, { errors: ['FAKE-KEY-123 FAKE-SECRET-456'] }));
  assert.equal(r.code, 1);
  assert.ok(r.lines.some((l) => /^FAIL gong auth: .*who fixes it: Gong admin/.test(l)), r.lines.join('\n'));
  assert.equal(existsSync(join(r.stateDir, 'proof.json')), false);
  assert.ok(!r.lines.join('\n').match(/FAKE-KEY-123|FAKE-SECRET-456/));
});

test('check: the fieldMap probe names a rejected field; unmapped fields are SKIP; no read proof; exit 1', async () => {
  const seen = [];
  const r = await run({ gainsight: { ...GS, fieldMap: { tier: 'FAKE_Bad__gc' } } }, gsTenant(seen, { badField: 'FAKE_Bad__gc' }));
  assert.equal(r.code, 1);
  assert.ok(r.lines.includes('PASS gainsight auth'));
  assert.ok(r.lines.some((l) => l.startsWith('FAIL gainsight fieldMap.tier: the tenant rejected field "FAKE_Bad__gc"')), r.lines.join('\n'));
  assert.ok(r.lines.some((l) => l.startsWith('SKIP gainsight fieldMap.arr:')));
  assert.equal((loadProof(r.stateDir).gainsight || {}).read, undefined);
});

test('check --write refuses on a production tenant and writes nothing', async () => {
  const seen = [];
  const r = await run({ gainsight: { ...GS, environment: 'production' } }, gsTenant(seen), { write: true });
  assert.equal(r.code, 1);
  assert.ok(r.lines.some((l) => l.startsWith('FAIL gainsight write: --check --write runs only against a sandbox')));
  assert.ok(seen.every((s) => s.url.endsWith('/query/Company')));
});

test('check --write on a sandbox creates one [SBX] TEST record per buildable kind, SKIPs B1/B2, and records the write proof', async () => {
  const seen = [];
  const r = await run({ gainsight: GS }, gsTenant(seen), { write: true });
  assert.equal(r.code, 0, r.lines.join('\n'));
  for (const kind of ['Pending items batch', 'Success Outcome Plan', 'At-Risk CTA']) assert.ok(r.lines.some((l) => l.startsWith(`PASS gainsight write ${kind}`)), kind);
  assert.ok(r.lines.some((l) => l.startsWith('SKIP gainsight write Success Plan objective:')));
  assert.ok(r.lines.some((l) => l.startsWith('SKIP gainsight write read-back:')));
  const writes = seen.filter((s) => !s.url.endsWith('/query/Company'));
  assert.equal(writes.length, 3);
  assert.ok(writes.every((s) => JSON.stringify(s.body).includes('[SBX] TEST-2026-10-02')));
  const w = loadProof(r.stateDir).gainsight.write;
  assert.equal(w.environment, 'sandbox');
  assert.equal(w.tenant.appUrl, API);
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/check.test.mjs`
Expected: FAIL, `Cannot find module …check.mjs`.

- [ ] **Step 3: Add the probes to the adapters**

In `gong-rest.mjs`, inside `create`, add to the returned object:

```js
    // --check: the smallest read, one page of the last 24 hours, returned as Gong sent it.
    async probe() { return (await post(EXTENSIVE_PATH, { filter: windowFor(new Date(now().getTime() - DAY_MS).toISOString()), contentSelector: CONTENT_SELECTOR })) || {}; },
```

In `gainsight-rest.mjs`, inside `create`, add to the returned object:

```js
    async authProbe() { await tokens.accessToken(); },
    // --check: one row with the given fields; throws if the tenant rejects a field.
    async probeRead(select, object = 'Company') {
      const resp = await api('POST', QUERY_PATH + encodeURIComponent(object), { select, limit: 1, offset: 0 });
      return { shape: rowsShape(resp), rows: rowsOf(resp) };
    },
```

- [ ] **Step 4: Create `connector/lib/check.mjs`**

```js
// --check / --check --write (connect-ready §3.5). Read-only unless --write against a sandbox. One line per step:
// PASS, FAIL <step>: <what to fix>; who fixes it: <who>, or SKIP. Exit 0 when nothing FAILs. Node built-ins only.
import { loadAdapters } from '../adapters/index.mjs';
import { FIELD_KEYS, GATE_KEYS } from '../adapters/gainsight-rest.mjs';
import { recordProof, tenantOf } from './state.mjs';

const blank = (v) => !String(v == null ? '' : v).trim();

export async function runCheck({ config = {}, stateDir, deps = {}, out = console.log, write = false, now = () => new Date() } = {}) {
  let fails = 0;
  const o = {
    pass: (step, d) => out(`PASS ${step}${d ? `: ${d}` : ''}`),
    fail: (step, what, who) => { fails++; out(`FAIL ${step}: ${what}; who fixes it: ${who}`); },
    skip: (step, why) => out(`SKIP ${step}: ${why}`),
  };
  const ad = loadAdapters(config, { ...deps, stateDir });
  await checkGong(config.gong || {}, ad.gong, o, stateDir, now);
  await checkGainsight(config.gainsight || {}, ad.gainsight, o, stateDir, now, write, config, deps);
  return fails ? 1 : 0;
}

async function checkGong(cfg, gong, o, stateDir, now) {
  if (cfg.adapter !== 'gong-rest') return o.skip('gong', `not configured (adapter is "${cfg.adapter || 'fake'}")`);
  const missing = ['baseUrl', 'accessKey', 'accessKeySecret', 'myEmail'].filter((k) => blank(cfg[k]));
  if (missing.length) return o.fail('gong config', `missing gong.${missing.join(', gong.')}; run node connector/server.mjs --setup`, 'Ian');
  o.pass('gong config');
  let page;
  try { page = await gong.probe(); } catch (e) {
    if (e.status === 401) return o.fail('gong auth', 'Gong rejected the access key or secret; issue a new key (Admin center > Settings > Ecosystem > API)', 'Gong admin');
    if (e.status === 403) return o.fail('gong scope', 'the key cannot read call details (needs api:calls:read:extensive)', 'Gong admin');
    return o.fail('gong read', e.message, 'Ian (check gong.baseUrl and the network)');
  }
  o.pass('gong auth');
  const c = (page.calls || [])[0] || {};
  o.pass('gong read', `${(page.calls || []).length} call(s) in the last 24 hours`);
  recordProof(stateDir, 'gong', 'read', { tenant: tenantOf('gong', cfg), now: now(), shapes: {
    pageKeys: Object.keys(page), callKeys: Object.keys(c), metaDataKeys: Object.keys(c.metaData || {}),
    contentKeys: Object.keys(c.content || {}), briefType: typeof (c.content || {}).brief } });
  o.pass('gong proof recorded', 'health now reports gong-rest');
}

async function checkGainsight(cfg, gs, o, stateDir, now, write, config, deps) {
  if (cfg.adapter !== 'gainsight-rest') return o.skip('gainsight', `not configured (adapter is "${cfg.adapter || 'fake'}")`);
  const missing = ['appUrl', 'environment'].filter((k) => blank(cfg[k])).map((k) => `gainsight.${k}`);
  if (blank(cfg.oauth && cfg.oauth.clientId)) missing.push('gainsight.oauth.clientId');
  if (missing.length) return o.fail('gainsight config', `missing ${missing.join(', ')}; run node connector/server.mjs --setup`, 'Ian');
  if (!['sandbox', 'production'].includes(cfg.environment)) return o.fail('gainsight config', 'gainsight.environment must be "sandbox" or "production"', 'Ian');
  o.pass('gainsight config', `${cfg.environment} tenant ${cfg.appUrl}`);
  try { await gs.authProbe(); } catch (e) { return o.fail('gainsight auth', e.message, 'Ian (run --setup again)'); }
  o.pass('gainsight auth');
  let first;
  try { first = await gs.probeRead(['Gsid', 'Name']); } catch (e) {
    return o.fail('gainsight read', e.message, e.status === 401 || e.status === 403 ? 'Gainsight admin (OAuth app scope, or bearer tokens not accepted on this API)' : 'Ian');
  }
  o.pass('gainsight read', `rows arrive in ${first.shape}`);
  let fieldFails = 0;
  for (const [group, keys, unmapped] of [['fieldMap', FIELD_KEYS, 'not mapped; /v1/accounts sends null'], ['gateFieldMap', GATE_KEYS, 'not mapped; /v1/accounts sends false']]) {
    for (const k of keys) {
      const f = String((cfg[group] || {})[k] || '').trim();
      if (!f) { o.skip(`gainsight ${group}.${k}`, unmapped); continue; }
      try { await gs.probeRead(['Gsid', f]); o.pass(`gainsight ${group}.${k}`, f); }
      catch (e) { fieldFails++; o.fail(`gainsight ${group}.${k}`, `the tenant rejected field "${f}"`, 'Gainsight admin (give the field\'s API name)'); }
    }
  }
  const q = cfg.contactQuery || {};
  if (q.object && q.companyField && q.nameField) {
    try { await gs.probeRead([q.companyField, q.nameField], q.object); o.pass('gainsight contactQuery', q.object); }
    catch (e) { fieldFails++; o.fail('gainsight contactQuery', `the tenant rejected object or fields (${e.message})`, 'Gainsight admin'); }
  } else o.skip('gainsight contactQuery', 'not configured; contacts are empty');
  if (!fieldFails) {
    recordProof(stateDir, 'gainsight', 'read', { tenant: tenantOf('gainsight', cfg), environment: cfg.environment, now: now(), shapes: { rows: first.shape } });
    o.pass('gainsight read proof recorded');
  }
  if (write) await checkWrite(cfg, o, stateDir, now, first.rows[0], config, deps);
}

async function checkWrite(cfg, o, stateDir, now, company, config, deps) {
  if (cfg.environment !== 'sandbox') return o.fail('gainsight write', `--check --write runs only against a sandbox; this tenant is "${cfg.environment}". Nothing was written`, 'Ian (point the config at the sandbox, or use --unlock-production)');
  if (!company) return o.fail('gainsight write', 'the sandbox returned no Company to write against', 'Gainsight admin');
  const tag = `[SBX] TEST-${now().toISOString().slice(0, 10)}`; // D4: labelled and left in the sandbox
  const stamp = now().toISOString().replace(/[^0-9]/g, '');
  const ref = { gainsightId: String(company.Gsid), name: String(company.Name) };
  const items = [
    { id: `sbx-test-${stamp}-pending`, kind: 'Pending items batch', customerRef: ref, fields: { subjectPrefix: tag, gates: [{ gateKey: 'test', contractKey: 'test', gainsightAction: `${tag} connector self-test` }] } },
    { id: `sbx-test-${stamp}-outcome`, kind: 'Success Outcome Plan', customerRef: ref, fields: { subjectPrefix: tag, outcomes: [`${tag} connector self-test`] } },
    { id: `sbx-test-${stamp}-cta`, kind: 'At-Risk CTA', customerRef: ref, fields: { subjectPrefix: tag, ctaName: 'connector self-test' } },
  ];
  const live = loadAdapters({ gainsight: { ...cfg, dryRun: false } }, { ...deps, stateDir }).gainsight;
  const results = await live.push(items);
  let ok = true;
  results.forEach((r, i) => {
    if (r.status === 'sent') o.pass(`gainsight write ${items[i].kind}`, r.externalId ? `id ${r.externalId}` : 'sent (id not read: gainsight.cta.idPath unset)');
    else { ok = false; o.fail(`gainsight write ${items[i].kind}`, r.error, 'Ian with the Gainsight admin (see CONNECT-GAINSIGHT.md)'); }
  });
  o.skip('gainsight write Success Plan objective', 'not built (blocker B1)');
  o.skip('gainsight write read-back', 'no read endpoint is confirmed (research Q10, Q12); open the sandbox and look for the [SBX] TEST records');
  if (ok) {
    recordProof(stateDir, 'gainsight', 'write', { tenant: tenantOf('gainsight', cfg), environment: 'sandbox', now: now(), shapes: { kinds: items.map((i) => i.kind) } });
    o.pass('gainsight write proof recorded', 'production can now be unlocked with --unlock-production');
  }
}
```

- [ ] **Step 5: Wire `--check` into `cli.mjs`**: `COMMANDS = ['--unlock-production', '--check']`, and in `runCli` before the unknown line:

```js
  if (argv.includes('--check')) {
    const { runCheck } = await import('./check.mjs');
    return runCheck({ config, stateDir, out, deps, write: argv.includes('--write') });
  }
```

- [ ] **Step 6: Update docs, then run the tests**

In `connector/CONTRACT.md` under `## Running it`, add `--check` (read-only; the line format; exit code; read
proofs) and `--check --write` (sandbox only; `[SBX] TEST-<date>` records left in the sandbox, D4; read-back
skipped, B2; write proof).

Run: `node --test connector/test/check.test.mjs` → 7 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 100`, `# fail 0`. Then A-8 directly (this worktree has no `config.json`, so the example config loads, and
the state dir is a temp dir so nothing lands in `connector/`):
`CONNECTOR_STATE_DIR=$(mktemp -d) node connector/server.mjs --check; echo "exit $?"` → only `SKIP gong: …` and
`SKIP gainsight: …`, then `exit 0`.

- [ ] **Step 7: Commit**

```bash
git add connector/lib/check.mjs connector/lib/cli.mjs connector/adapters/gong-rest.mjs connector/adapters/gainsight-rest.mjs connector/CONTRACT.md connector/test/check.test.mjs
git commit -m "T-10: --check (read proofs, fieldMap probe) and sandbox-only --check --write; no config prints only SKIP"
```

---

### Task T-11: `--setup`

**Model:** Sonnet. **Spec:** §3.5 `--setup`, CR5, §4 T-11. Read spec gap 6.

**Files:**
- Create: `connector/lib/setup.mjs`
- Modify: `connector/lib/cli.mjs` (`--setup`), `connector/server.mjs` (pass `createConnector` to `runCli`), `connector/CONTRACT.md`
- Test: `connector/test/setup.test.mjs`

**Interfaces:**
- Consumes: `authorizeUrl`, `redirectUriFor` and `makeCallbackHandler` (T-6); `createConnector` (T-6); `writeJsonAtomic`, `resolveStateDir` and `FILES` (T-2); `runCheck` (T-10); `makeAsk` (T-9).
- Produces:
  - `runSetup({configPath, config, ask, out, deps, stateDir, createConnector, startCallbackServer, runCheckFn}) -> exit code`
  - `defaultCallbackServer({port, handlerFor, createConnector, timeoutMs}) -> Promise<onDone result | {ok:false, reason:'timeout'}>`
  - `setup.mjs` never imports `server.mjs` (an ESM top-level-await cycle would deadlock); `createConnector` is passed in.

- [ ] **Step 1: Write the failing test** `connector/test/setup.test.mjs`

```js
// connect-ready T-11: --setup with scripted answers and a stubbed fetch. Secrets never reach stdout. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { runSetup } from '../lib/setup.mjs';
import { makeAsk } from '../lib/cli.mjs';

installNetGuard();
const EXAMPLE = { port: 8787, gong: { adapter: 'fake' }, gainsight: { adapter: 'fake', dryRun: true }, ai: { adapter: 'fake' } };
const SECRETS = ['FAKE-SECRET-456', 'FAKE-CLIENT-SECRET-zz'];
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function scripted(answers) {
  const prompts = [];
  const ask = async (q) => { prompts.push(q); if (!answers.length) throw new Error(`no scripted answer for: ${q}`); return answers.shift(); };
  return { ask, prompts };
}
const tmp = () => mkdtempSync(join(tmpdir(), 'setup-'));

test('setup Gong only: re-asks a bad URL, writes config.json with gong-rest, leaves Gainsight fake, then runs --check', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json');
  const { ask, prompts } = scripted(['y', 'http://not-https.invalid', 'https://fake-tenant.gong.invalid', 'FAKE-KEY-123', 'FAKE-SECRET-456', 'ian.fake@fake-osm.invalid', 'n']);
  let checked = null; const out = [];
  const code = await runSetup({ configPath, config: EXAMPLE, ask, out: (l) => out.push(l), stateDir: dir, runCheckFn: async (a) => { checked = a.config; return 0; } });
  assert.equal(code, 0);
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.deepEqual(cfg.gong, { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: 'ian.fake@fake-osm.invalid' });
  assert.equal(cfg.gainsight.adapter, 'fake');
  assert.equal(prompts.filter((p) => /Gong API base URL/.test(p)).length, 2);
  assert.deepEqual(checked, cfg);
});

test('setup Gainsight: prints the authorize URL (no secret), and with callbackCodeParam unset prints the query names and stops', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const { ask } = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', '', 'FAKE-SBX-1', 'sandbox', 'FAKE-CLIENT-ID', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const startCallbackServer = async ({ handlerFor }) => new Promise((resolve) => { handlerFor(resolve)(new URLSearchParams('code=FAKE-CODE-1&state=s')); });
  const code = await runSetup({ configPath, config: EXAMPLE, ask, out: (l) => out.push(l), stateDir: dir, startCallbackServer, runCheckFn: async () => { throw new Error('must not run'); } });
  assert.equal(code, 1);
  const text = out.join('\n');
  assert.match(text, /https:\/\/fake-sbx\.gainsightcloud\.invalid\/v1\/authorize\?clientId=FAKE-CLIENT-ID/);
  assert.match(text, /callbackCodeParam.*code, state|code, state.*callbackCodeParam/s);
  assert.ok(!text.includes('FAKE-CODE-1'));
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(cfg.gainsight.adapter, 'gainsight-rest');
  assert.equal(cfg.gainsight.apiBaseUrl, 'https://fake-sbx.gainsightcloud.invalid');
  assert.equal(cfg.gainsight.dryRun, true);
  assert.equal(cfg.gainsight.oauth.callbackCodeParam, '');
});

test('setup Gainsight with code param and token fields set: exchanges the code, saves tokens, runs --check; no secret on stdout', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const pre = { ...EXAMPLE, gainsight: { adapter: 'fake', dryRun: true, oauth: { callbackCodeParam: 'code', accessTokenField: 'FAKE_at', refreshTokenField: 'FAKE_rt' } } };
  const { ask, prompts } = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', 'https://fake-sbx-api.gainsightcloud.invalid', 'FAKE-SBX-1', 'sandbox', 'FAKE-CLIENT-ID', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const fetchImpl = async (url) => { assert.equal(url, 'https://fake-sbx.gainsightcloud.invalid/v1/users/oauth/access/token'); return json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }); };
  const startCallbackServer = async ({ handlerFor }) => new Promise((resolve) => { handlerFor(resolve)(new URLSearchParams('code=FAKE-CODE-1')); });
  let ran = false;
  const code = await runSetup({ configPath, config: pre, ask, out: (l) => out.push(l), stateDir: dir, deps: { fetchImpl }, startCallbackServer, runCheckFn: async () => { ran = true; return 0; } });
  assert.equal(code, 0);
  assert.ok(ran);
  assert.ok(existsSync(join(dir, 'gainsight-tokens.json')));
  const everything = [...out, ...prompts].join('\n');
  for (const s of [...SECRETS, 'FAKE-ACCESS-1', 'FAKE-REFRESH-1', 'FAKE-CODE-1']) assert.ok(!everything.includes(s), s);
});

test('makeAsk: a secret answer is not echoed to the output stream', async () => {
  const input = new PassThrough(); const output = new PassThrough(); let written = '';
  output.on('data', (d) => { written += d; });
  const ask = makeAsk(input, output);
  const p = ask('Secret: ', { secret: true });
  input.write('FAKE-SECRET-456\n');
  assert.equal(await p, 'FAKE-SECRET-456');
  ask.close();
  assert.ok(written.includes('Secret: '));
  assert.ok(!written.includes('FAKE-SECRET-456'));
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/setup.test.mjs`
Expected: FAIL, `Cannot find module …setup.mjs`.

- [ ] **Step 3: Create `connector/lib/setup.mjs`**

```js
// --setup (connect-ready §3.5, CR5): one question at a time per vendor, either one skippable. It writes the
// git-ignored config.json, runs the Gainsight sign-in through the setup-only /oauth/callback, then runs --check.
// Secrets are asked with echo off and never printed. Node built-ins only.
import crypto from 'node:crypto';
import { join } from 'node:path';
import { writeJsonAtomic, resolveStateDir, FILES } from './state.mjs';
import { authorizeUrl, redirectUriFor, makeCallbackHandler } from '../adapters/gainsight-auth.mjs';
import { loadAdapters } from '../adapters/index.mjs';
import { runCheck } from './check.mjs';
// Do NOT import ../server.mjs here: when run as `node connector/server.mjs --setup`, server.mjs is still evaluating
// (it awaits this import), so a static or dynamic import of it would deadlock. server.mjs passes createConnector in.

const isHttpsBase = (v) => /^https:\/\/[a-z0-9.-]+(:\d+)?\/?$/i.test(v);
const isEmail = (v) => /^[^@\s]+@[^@\s]+$/.test(v);
const yes = (v) => /^y(es)?$/i.test(String(v).trim());
const trimUrl = (u) => String(u).trim().replace(/\/+$/, '');

async function askValid(ask, out, q, ok, hint) {
  for (let i = 0; i < 3; i++) {
    const v = String(await ask(q)).trim();
    if (ok(v)) return v;
    out(`  Not valid: ${hint}`);
  }
  throw new Error(`setup stopped: no valid answer to "${q.trim()}" after 3 tries`);
}

export function defaultCallbackServer({ port, handlerFor, createConnector, timeoutMs = 10 * 60 * 1000 }) {
  return new Promise((resolve) => {
    let server = null;
    const finish = (r) => { clearTimeout(timer); setTimeout(() => server && server.close(), 200); resolve(r); };
    const timer = setTimeout(() => finish({ ok: false, reason: 'timeout' }), timeoutMs);
    server = createConnector({ config: {}, adapters: loadAdapters({}), token: crypto.randomBytes(32).toString('hex'), oauthCallback: handlerFor(finish) });
    server.listen(port, '127.0.0.1');
  });
}

export async function runSetup({ configPath, config = {}, ask, out = console.log, deps = {}, stateDir, createConnector, startCallbackServer = defaultCallbackServer, runCheckFn = runCheck }) {
  const next = JSON.parse(JSON.stringify(config));
  if (yes(await ask('Set up Gong now? (y/n) '))) {
    out('Gong: the values come from the Gong Tech admin (see connector/CONNECT-GONG.md).');
    const g = (next.gong = { ...(next.gong || {}), adapter: 'gong-rest' });
    g.baseUrl = trimUrl(await askValid(ask, out, 'Gong API base URL (starts https://): ', isHttpsBase, 'an https:// address with no path'));
    g.accessKey = String(await ask('Gong access key: ')).trim();
    g.accessKeySecret = String(await ask('Gong access key secret (not shown): ', { secret: true })).trim();
    g.myEmail = await askValid(ask, out, 'Your Gong email: ', isEmail, 'an email address');
  }
  let gainsight = false;
  if (yes(await ask('Set up Gainsight now? (y/n) '))) {
    gainsight = true;
    out('Gainsight: the values come from the Gainsight Super Admin (see connector/CONNECT-GAINSIGHT.md).');
    const g = (next.gainsight = { dryRun: true, ...(next.gainsight || {}), adapter: 'gainsight-rest' });
    g.appUrl = trimUrl(await askValid(ask, out, 'Gainsight tenant URL (starts https://): ', isHttpsBase, 'an https:// address with no path'));
    const api = String(await ask('Gainsight API base URL (Enter = same as the tenant URL): ')).trim();
    if (api && !isHttpsBase(api)) throw new Error('setup stopped: the API base URL must be an https:// address with no path');
    g.apiBaseUrl = api ? trimUrl(api) : g.appUrl;
    g.tenantId = String(await ask('Gainsight tenant id (from the admin): ')).trim();
    g.environment = await askValid(ask, out, 'Is this tenant a sandbox or production? (sandbox/production): ', (v) => v === 'sandbox' || v === 'production', 'type sandbox or production');
    g.oauth = { callbackCodeParam: '', accessTokenField: '', refreshTokenField: '', ...(g.oauth || {}) };
    g.oauth.clientId = String(await ask('OAuth client id: ')).trim();
    g.oauth.clientSecret = String(await ask('OAuth client secret (not shown): ', { secret: true })).trim();
    g.oauth.scopes = String(await ask('OAuth scopes, exactly as the admin gave them: ')).trim();
  }
  writeJsonAtomic(configPath, next);
  out(`Wrote ${configPath} (git-ignored).`);
  if (gainsight) {
    const g = next.gainsight;
    const port = next.port ?? 8787;
    const redirectUri = redirectUriFor(port);
    out(`Open this address in your browser and sign in to Gainsight (redirect URI registered by the admin: ${redirectUri}):`);
    out(authorizeUrl(g, redirectUri));
    out('Waiting for the sign-in (10 minutes)...');
    const r = await startCallbackServer({ port, createConnector, handlerFor: (onDone) => makeCallbackHandler({ cfg: g, redirectUri, fetchImpl: deps.fetchImpl,
      tokensPath: join(resolveStateDir(stateDir), FILES.tokens), onDone }) });
    if (r.reason === 'codeParamUnset') {
      out(`Gainsight redirected back with these query names: ${r.names.join(', ') || '(none)'}. Set gainsight.oauth.callbackCodeParam in ${configPath} to the one that carries the code (CONNECT-GAINSIGHT.md), then run --setup again and skip Gong.`);
      return 1;
    }
    if (!r.ok) { out(`FAIL gainsight sign-in: ${r.reason === 'timeout' ? 'no redirect arrived in 10 minutes' : r.error}; who fixes it: Ian (run --setup again)`); return 1; }
    if (!g.oauth.accessTokenField || !g.oauth.refreshTokenField) {
      out(`Gainsight answered with these field names: ${r.keys.join(', ')}. Set gainsight.oauth.accessTokenField and refreshTokenField in ${configPath} to the two that hold the access and refresh tokens, then run node connector/server.mjs --check.`);
      return 1;
    }
    out('Gainsight sign-in saved.');
  }
  out('Running --check:');
  return runCheckFn({ config: next, stateDir, deps, out });
}
```

- [ ] **Step 4: Wire `--setup` into `cli.mjs` and pass `createConnector` from `server.mjs`**. Add `'--setup'` to
  `COMMANDS`, add `createConnector` to `runCli`'s options object (`{ config, configPath, stateDir, ask, out, deps, createConnector }`), and in `runCli`:

```js
  if (argv.includes('--setup')) {
    const { runSetup } = await import('./setup.mjs');
    return runSetup({ configPath, config, ask, out, deps, stateDir, createConnector });
  }
```

In `connector/server.mjs`'s dispatch (from T-9), pass the local function: `cli.runCli(args, { config, configPath: …, stateDir: env.CONNECTOR_STATE_DIR, ask, createConnector })`.
Smoke test by hand, with no network (answer `n` twice):
`T=$(mktemp -d); cp connector/config.example.json "$T/config.json"; printf 'n\nn\n' | CONNECTOR_CONFIG="$T/config.json" CONNECTOR_STATE_DIR="$T" node connector/server.mjs --setup; echo "exit $?"; git status --short connector`.
**Never point `CONNECTOR_CONFIG` at `config.example.json` for `--setup`.** Setup writes back to `CONNECTOR_CONFIG`,
so that would overwrite the example. Expected: the command exits within a second or two and prints
`Wrote …/config.json (git-ignored).`, `Running --check:`, two `SKIP` lines and `exit 0`. `git status` shows
nothing new under `connector/`. A hang means the import cycle is back.

- [ ] **Step 5: Update docs, then run the tests**

In `connector/CONTRACT.md` under `## Running it`, add `--setup`. It asks one question at a time and either vendor
can be skipped. Secrets are not echoed. It writes `config.json`, starts the sign-in on `/oauth/callback`, and runs
`--check`. It also explains what it prints when `callbackCodeParam` or the token field names are unset.

Run: `node --test connector/test/setup.test.mjs` → 4 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 104`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add connector/lib/setup.mjs connector/lib/cli.mjs connector/CONTRACT.md connector/test/setup.test.mjs
git commit -m "T-11: --setup asks one value at a time, writes git-ignored config.json, runs Gainsight sign-in and --check"
```

---

### Task T-12: `--measure-transcripts`

**Model:** Sonnet. **Spec:** §3.5 `--measure-transcripts`, CR4, I-2, §4 T-12.

**Files:**
- Create: `connector/lib/measure.mjs`
- Modify: `connector/adapters/gong-rest.mjs` (add `transcriptLengths`), `connector/lib/cli.mjs`, `connector/CONTRACT.md`
- Test: `connector/test/measure.test.mjs`

**Interfaces:**
- Consumes: `gong-rest` `post`, `eachPage`, `windowFor`, `listCalls` and `TRANSCRIPT_PATH` (T-5); the `gong-transcripts.json` fixture (T-4).
- Produces:
  - `gong.transcriptLengths({since}) -> {calls:number, lengths:number[]}`
  - `stats(lengths) -> {count, median, mean, p90, max}`. The median of an even count is the mean of the two
    middle values. p90 is nearest-rank: `sorted[ceil(0.9n)-1]`. Every field is `null` when the list is empty.
  - `runMeasure({config, stateDir, deps, out, bookBytes, quotaBytes = 5_000_000, now}) -> exit code`
  - `WEEKS_PER_MONTH = 52 / 12`

- [ ] **Step 1: Write the failing test** `connector/test/measure.test.mjs`

```js
// connect-ready T-12: --measure-transcripts on fixtures and a stubbed fetch. Read-only; stores nothing. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { stats, runMeasure, WEEKS_PER_MONTH } from '../lib/measure.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRANSCRIPTS = JSON.parse(readFileSync(join(root, 'fixtures', 'vendor', 'gong-transcripts.json'), 'utf8'));
const ME = 'ian.fake@fake-osm.invalid';
const GONG = { adapter: 'gong-rest', baseUrl: 'https://fake-tenant.gong.invalid', accessKey: 'FAKE-KEY-123', accessKeySecret: 'FAKE-SECRET-456', myEmail: ME };
const NOW = new Date('2026-10-02T12:00:00Z');
const IDS = TRANSCRIPTS.callTranscripts.map((t) => t.callId);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const EXTENSIVE = { records: { totalRecords: 10 }, calls: IDS.map((id, i) => ({
  metaData: { id, url: `https://fake-tenant.gong.invalid/call?id=${id}`, title: `FAKE call ${id}`, started: `2026-09-${String(10 + i).padStart(2, '0')}T15:00:00Z`, duration: 600 },
  parties: [{ emailAddress: ME, name: 'Ian Fake', affiliation: 'Internal' }], content: {} })) };
function stub() {
  const seen = [];
  const fn = async (url, init) => { const body = JSON.parse(init.body); seen.push({ url, body }); return json(200, url.endsWith('/v2/calls/transcript') ? TRANSCRIPTS : EXTENSIVE); };
  return { fn, seen };
}
const measure = async (opts = {}) => {
  const lines = []; const stateDir = mkdtempSync(join(tmpdir(), 'measure-')); const s = stub();
  const code = await runMeasure({ config: { gong: GONG }, stateDir, now: () => NOW, out: (l) => lines.push(l), deps: { fetchImpl: s.fn, sleep: async () => {}, now: () => NOW }, ...opts });
  return { code, lines, stateDir, seen: s.seen };
};

test('measure: stats are median (mean of the middle two), nearest-rank p90, max and mean; empty gives nulls', () => {
  assert.deepEqual(stats([100, 10, 20, 30, 40, 50, 60, 70, 80, 90]), { count: 10, median: 55, mean: 55, p90: 90, max: 100 });
  assert.deepEqual(stats([3, 1, 2]), { count: 3, median: 2, mean: 2, p90: 3, max: 3 });
  assert.deepEqual(stats([]), { count: 0, median: null, mean: null, p90: null, max: null });
});

test('measure: known fixture lengths give the expected lines, each labelled measured, derived or assumption', async () => {
  const r = await measure({ bookBytes: 1000000 });
  assert.equal(r.code, 0);
  const months = (4000000 / ((10 / (30 / 7)) * 55) / WEEKS_PER_MONTH).toFixed(1);
  assert.deepEqual(r.lines, [
    'measured: calls in the last 30 days: 10',
    'measured: transcript characters per call: median 55, mean 55, 90th percentile 90, max 100',
    'derived: calls per week: 2.3',
    'assumption: localStorage quota 5,000,000 bytes (not measured; --quota-bytes to change); 1 character counted as 1 byte',
    'measured: book size given: 1,000,000 bytes (--book-bytes)',
    `derived: months until the book fills at this rate: ${months}`,
  ]);
});

test('measure: asks for transcripts of exactly my calls in the window, stores nothing, and needs --book-bytes for the projection', async () => {
  const r = await measure();
  const t = r.seen.find((s) => s.url.endsWith('/v2/calls/transcript'));
  assert.deepEqual(t.body.filter, { fromDateTime: '2026-09-02T12:00:00.000Z', toDateTime: '2026-10-02T12:00:00.000Z', callIds: IDS });
  assert.deepEqual(readdirSync(r.stateDir), []);
  assert.equal(r.lines.at(-1), 'derived: months until the book fills: not computed (pass --book-bytes <n>)');
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/measure.test.mjs`
Expected: FAIL, `Cannot find module …measure.mjs`.

- [ ] **Step 3: Add `transcriptLengths` to `gong-rest.mjs`** (inside `create`, added to the returned object)

```js
    // --measure-transcripts: characters per call for my calls in the window. Stores nothing.
    // CONFIRMED (Q3): no length field; length = sum of sentences[].text lengths over every monologue.
    async transcriptLengths({ since } = {}) {
      const ids = (await listCalls({ since })).map((c) => c.callId);
      if (!ids.length) return { calls: 0, lengths: [] };
      const lengths = new Map(ids.map((id) => [id, 0]));
      await eachPage(TRANSCRIPT_PATH, { ...windowFor(since), callIds: ids }, {}, (page) => {
        for (const t of page.callTranscripts || []) {
          const id = String(t.callId);
          if (!lengths.has(id)) continue;
          let n = lengths.get(id);
          for (const mono of t.transcript || []) for (const s of mono.sentences || []) n += String(s.text || '').length;
          lengths.set(id, n);
        }
      });
      return { calls: ids.length, lengths: [...lengths.values()] };
    },
```

- [ ] **Step 4: Create `connector/lib/measure.mjs`**

```js
// --measure-transcripts (connect-ready §3.5, CR4): read-only; stores nothing. Supplies the numbers for Ian's I-2
// choice. Every line is labelled measured, derived or assumption. Node built-ins only.
import { loadAdapters } from '../adapters/index.mjs';

export const WEEKS_PER_MONTH = 52 / 12;
const DAYS = 30;
const fmt = (n) => Number(n).toLocaleString('en-US');

export function stats(lengths) {
  const s = [...lengths].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return { count: 0, median: null, mean: null, p90: null, max: null };
  const median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return { count: n, median, mean: s.reduce((a, b) => a + b, 0) / n, p90: s[Math.ceil(0.9 * n) - 1], max: s[n - 1] };
}

export async function runMeasure({ config = {}, stateDir, deps = {}, out = console.log, bookBytes = null, quotaBytes = 5000000, now = () => new Date() } = {}) {
  const cfg = config.gong || {};
  if (cfg.adapter !== 'gong-rest') { out('FAIL measure: gong.adapter is not "gong-rest"; run node connector/server.mjs --setup; who fixes it: Ian'); return 1; }
  const gong = loadAdapters({ gong: cfg }, { ...deps, stateDir }).gong;
  const since = new Date(now().getTime() - DAYS * 86400000).toISOString();
  let r;
  try { r = await gong.transcriptLengths({ since }); }
  catch (e) { out(`FAIL measure: ${e.message}; who fixes it: ${e.status === 403 ? 'Gong admin (needs api:calls:read:transcript)' : 'Ian'}`); return 1; }
  const st = stats(r.lengths);
  out(`measured: calls in the last ${DAYS} days: ${r.calls}`);
  if (!st.count) { out('derived: nothing to project (no calls in the window)'); return 0; }
  out(`measured: transcript characters per call: median ${fmt(st.median)}, mean ${fmt(Math.round(st.mean))}, 90th percentile ${fmt(st.p90)}, max ${fmt(st.max)}`);
  const perWeek = r.calls / (DAYS / 7);
  out(`derived: calls per week: ${perWeek.toFixed(1)}`);
  out(`assumption: localStorage quota ${fmt(quotaBytes)} bytes (not measured; --quota-bytes to change); 1 character counted as 1 byte`);
  if (bookBytes == null) { out('derived: months until the book fills: not computed (pass --book-bytes <n>)'); return 0; }
  out(`measured: book size given: ${fmt(bookBytes)} bytes (--book-bytes)`);
  const months = (quotaBytes - bookBytes) / (perWeek * st.mean) / WEEKS_PER_MONTH;
  out(`derived: months until the book fills at this rate: ${months.toFixed(1)}`);
  return 0;
}
```

Hand-check: in the second test the first line is `measured: calls in the last 30 days: 10`, and that matches.

- [ ] **Step 5: Wire it into `cli.mjs` and update the docs**

Add `'--measure-transcripts'` to `COMMANDS`, and in `runCli`:

```js
  if (argv.includes('--measure-transcripts')) {
    const num = (flag) => { const i = argv.indexOf(flag); return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : undefined; };
    const { runMeasure } = await import('./measure.mjs');
    return runMeasure({ config, stateDir, deps, out, bookBytes: num('--book-bytes') ?? null, quotaBytes: num('--quota-bytes') ?? 5000000 });
  }
```

In `connector/CONTRACT.md`, under `## Transcripts (I-2)`, append: "`node connector/server.mjs
--measure-transcripts [--book-bytes <n>] [--quota-bytes <n>]` (read-only, stores nothing) prints Ian's call count
for the last 30 days, the median, mean, p90 and max transcript characters, calls per week, and the months until
the book fills. Each figure is labelled measured, derived or assumption." Under `## Running it`, list the command.

- [ ] **Step 6: Run the tests**

Run: `node --test connector/test/measure.test.mjs` → 3 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 107`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add connector/lib/measure.mjs connector/lib/cli.mjs connector/adapters/gong-rest.mjs connector/CONTRACT.md connector/test/measure.test.mjs
git commit -m "T-12: --measure-transcripts (read-only, stores nothing): measured/derived transcript sizes for the I-2 choice"
```

---

### Task T-13: runbooks, CONTRACT.md, admin ask

**Model:** Sonnet. **Spec:** §3.7, §4 T-13, the "unproven means unproven" rule.

**Files:**
- Create: `connector/CONNECT-GONG.md`, `connector/CONNECT-GAINSIGHT.md`
- Modify: `docs/superpowers/drafts/connector-admin-ask.md` (it is 109 lines; read it in full), `connector/CONTRACT.md` (only if the test finds a gap)
- Test: `connector/test/docs.test.mjs`

**Interfaces:**
- Consumes: the facts and source URLs in `research-vendor-apis.md`; the commands from T-9 to T-12; the config key
  names from `config.example.json`; the `FAIL` lines from `check.mjs`.
- Produces: the runbooks, each with a `## Vendor facts` section. Every bullet in that section carries either
  `CONFIRMED` plus an https URL, or `to confirm with admin`.

- [ ] **Step 1: Write the failing test** `connector/test/docs.test.mjs`

```js
// connect-ready T-13: runbooks and admin ask keep the honesty rules. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installNetGuard } from '../lib/test-net-guard.mjs';

installNetGuard();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..');
const read = (p) => readFileSync(p, 'utf8');
const RUNBOOKS = ['CONNECT-GONG.md', 'CONNECT-GAINSIGHT.md'].map((f) => join(root, f));
const ASK = join(repo, 'docs', 'superpowers', 'drafts', 'connector-admin-ask.md');

test('docs: admin ask describes what is built, unproven until --check, with the redirect URI and confirmed CTA endpoints', () => {
  const t = read(ASK);
  assert.ok(!/built only once credentials exist/.test(t));
  assert.ok(t.includes('unproven until `--check`'));
  assert.ok(t.includes('http://127.0.0.1:8787/oauth/callback'));
  const cta = t.split('\n').filter((l) => l.includes('/v2/cockpit/cta'));
  assert.ok(cta.length && cta.every((l) => !/to confirm with admin/i.test(l)), 'CTA endpoints are CONFIRMED (Q12)');
  assert.match(t, /IP allowlist[^\n]*not re-confirmed on 2026-10-02/);
});

test('docs: each runbook has an admin part, an Ian part, and Vendor facts that are each CONFIRMED with a URL or "to confirm with admin"', () => {
  for (const f of RUNBOOKS) {
    assert.ok(existsSync(f), f);
    const t = read(f);
    assert.match(t, /^## Part 1: for the admin/m, f);
    assert.match(t, /^## Part 2: for Ian/m, f);
    assert.ok(t.includes('--setup') && t.includes('--check'), f);
    const facts = (t.split(/^## Vendor facts\s*$/m)[1] || '').split(/^## /m)[0];
    const bullets = facts.split('\n').filter((l) => /^\s*- /.test(l));
    assert.ok(bullets.length >= 4, `${f}: too few vendor facts`);
    // \bCONFIRMED\b does not match inside "UNCONFIRMED", so an UNCONFIRMED bullet must say "to confirm with admin".
    for (const b of bullets) assert.ok(/\bCONFIRMED\b.*https:\/\//.test(b) || /to confirm with admin/.test(b), `${f}: ${b}`);
  }
});

test('docs: no doc claims an adapter works with Gong or Gainsight; CONTRACT says unproven until --check and has no stale I-2 heading', () => {
  const files = [...RUNBOOKS, ASK, join(root, 'CONTRACT.md')];
  for (const f of files) assert.ok(!/works with (Gong|Gainsight)|(Gong|Gainsight)[- ]rest works|is working with (Gong|Gainsight)/i.test(read(f)), f);
  const c = read(join(root, 'CONTRACT.md'));
  assert.ok(c.includes('unproven until `--check`'));
  assert.ok(!/^## Before a real Gong adapter/m.test(c));
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `node --test connector/test/docs.test.mjs`
Expected: 3 FAIL (the runbooks are missing, and the admin ask still has "built only once credentials exist").

- [ ] **Step 3: Write `connector/CONNECT-GONG.md`**, with these sections in this order:
  - `# Connect Gong`. One paragraph: the `gong-rest` adapter is tested on recorded-shape fixtures and unproven
    until `--check`. Transcripts stay off (CR4).
  - `## Part 1: for the admin`. Create an API access key as a Tech admin (Admin center > Settings > Ecosystem >
    API). Read out four things to Ian: the API base URL, the access key, the secret (read out loud, never sent by
    email), and the scopes the key carries. The scopes needed are `api:calls:read:extensive`, and
    `api:calls:read:transcript` only for `--measure-transcripts`. Optional key expiry and IP allowlist: not
    re-confirmed on 2026-10-02. Name the read-only nature: nothing writes to Gong.
  - `## Part 2: for Ian`:
    - `node connector/server.mjs --setup` (answer n to Gainsight), then `--check`.
    - A table of every `FAIL` line from `check.mjs` (`gong config`, `gong auth`, `gong scope`, `gong read`) with
      what it means and who fixes it.
    - `--measure-transcripts --book-bytes <n>` and where to read the book size.
  - `## Vendor facts`. Each bullet takes its status and URL from research Q1-Q6:
    - base URL per customer (CONFIRMED, introduction-2.md); the `company-NN.api.gong.io` pattern is "to confirm
      with admin"
    - Basic auth (CONFIRMED)
    - `/v2/calls/extensive` and its cursor paging (CONFIRMED)
    - both dates required (CONFIRMED)
    - `primaryUserIds` host-only, so filtering happens on the laptop (CONFIRMED)
    - affiliation values (CONFIRMED)
    - the `content.brief` type: to confirm with admin
    - rate limit 3/s and 10,000/day (CONFIRMED)
    - sandbox API access: to confirm with admin
    - Basic-key scope model, expiry and IP allowlist: to confirm with admin

- [ ] **Step 4: Write `connector/CONNECT-GAINSIGHT.md`**, with the same section order:
  - Intro: tested on recorded-shape fixtures, unproven until `--check`. Dry-run is the default. The write gate
    (§3.4) and the 1-item first send.
  - `## Part 1: for the admin`:
    - Create an OAuth app as a Super Admin (Administration > User Management > Authentication > OAuth
      Applications; max 3 per org), with Read/Write scope.
    - Register the redirect URI `http://127.0.0.1:8787/oauth/callback`.
    - Read out to Ian: the tenant URL; the API base URL; the tenant id; sandbox or production; the client id and
      secret; the scopes string.
    - Also read out the API names of the tenant fields for each `fieldMap` key (tier, ARR, renewal date, CSM
      owner, health score) and each `gateFieldMap` key.
    - Read out the Company Person object and its fields (for `contactQuery`).
    - Read out the Timeline activity type name, the CTA type name and the CTA company id field.
    - Answer the open questions: the token reply's field names (or let `--setup` print the key names); B1
      (adding an objective to an existing Success Plan); a read endpoint for Timeline and CTA (B2); and whether a
      sandbox exists.
  - `## Part 2: for Ian`:
    - `--setup`; what the "query names" and "field names" messages mean, and which config key to set.
    - `--check`; the table of `FAIL` lines (`gainsight config`, `auth`, `read`, `fieldMap.<key>`,
      `gateFieldMap.<key>`, `contactQuery`, `write`) with who fixes each.
    - The sandbox path `--check --write` (`[SBX] TEST-<date>` records are left in the sandbox, D4).
    - Then `--unlock-production` (type the URL back) and set `dryRun` to false. The first Send is 1 item; check it
      in Gainsight.
    - Where `dry-run.jsonl` and `sent-record.json` live.
  - `## Vendor facts`. Bullets from research Q7-Q14 and `research-write-safety.md`:
    - OAuth authorize and token paths (CONFIRMED)
    - access token 3600 s, refresh token 365 days, single-use and rotated (CONFIRMED)
    - the refresh body: to confirm with admin
    - the Company query and 5,000 per call (CONFIRMED)
    - `data` vs `data.records`: to confirm with admin
    - Timeline create and `ExternalId` (CONFIRMED)
    - the duplicate `GS_TL_10_0107` code (CONFIRMED, Timeline page)
    - CTA `POST`/`PUT /v2/cockpit/cta` (CONFIRMED)
    - Success Plan v2 create (CONFIRMED); adding an objective to an existing plan: to confirm with admin
    - bearer accepted on every endpoint: to confirm with admin
    - rate limit 100/min planned (CONFIRMED, system limits page)
    - sandbox: to confirm with admin

- [ ] **Step 5: Edit the admin ask** `docs/superpowers/drafts/connector-admin-ask.md`:
  - Replace the bullet "No real Gong or Gainsight adapter. Those get built only once credentials exist. An adapter
    that cannot …" with this text: "Real Gong (`gong-rest`) and Gainsight (`gainsight-rest`) adapters are built
    from the vendors' public docs and tested on recorded-shape fixtures. Each is unproven until `--check` passes
    against our tenant, and the tracker shows 'Connector: UNPROVEN' until then. Gainsight writes are dry-run by
    default and gated to the sandbox first (or an explicit production unlock with a 1-item first send). Setup is
    `node connector/server.mjs --setup`; see `connector/CONNECT-GONG.md` and `connector/CONNECT-GAINSIGHT.md`."
  - CTAs: replace the "to confirm with admin" CTA bullet with "CTAs (confirmed, `POST /v2/cockpit/cta` create and
    `PUT /v2/cockpit/cta` update)". Put the open point in a **separate bullet** that does not repeat the path:
    "Whether an OAuth bearer token is accepted on the CTA API is **to confirm with admin.**" (The test requires that
    no line containing `/v2/cockpit/cta` says "to confirm with admin".)
  - Gainsight credential: add "Redirect URI to register on the OAuth app: `http://127.0.0.1:8787/oauth/callback`."
  - Gong: where the ask says "optional expiry and an IP allowlist", append "(not re-confirmed on 2026-10-02)" **on
    the same line** as "IP allowlist" (re-wrap the line if needed; the test matches within one line).
  - Success Plans: add the B1 question ("adding or updating one objective on an existing Success Plan: endpoint
    **to confirm with admin**").

- [ ] **Step 6: Run the tests and the wording grep**

Run: `node --test connector/test/docs.test.mjs` → 3 pass. Then `node --test connector/test/*.test.mjs` →
`# pass 110`, `# fail 0`. Then:
`git grep -nE "built only once credentials exist|works with (Gong|Gainsight)" -- connector docs/superpowers/drafts`
Expected: no output (exit 1).

- [ ] **Step 7: Commit**

```bash
git add connector/CONNECT-GONG.md connector/CONNECT-GAINSIGHT.md docs/superpowers/drafts/connector-admin-ask.md connector/CONTRACT.md connector/test/docs.test.mjs
git commit -m "T-13: Gong and Gainsight runbooks (admin part, Ian part, sourced vendor facts); admin ask says built, unproven until --check"
```

---

### Task T-14: final whole-branch review

**Model:** top model (review). Fixes go through the build → checker loop, one at a time. **Spec:** §4 T-14, §5
A-1 to A-9.

**Files:** none planned. A fix touches only the files its finding names.

- [ ] **Step 1: Re-measure every acceptance check into log files** (read only the summary lines)

```bash
J="$CLAUDE_JOB_DIR/tmp"
node --test connector/test/*.test.mjs > "$J/a1.log" 2>&1; echo "A-1 exit $?"; grep -E "^# (tests|pass|fail)" "$J/a1.log"
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475 > "$J/a2.log" 2>&1; echo "A-2 exit $?"; tail -n 3 "$J/a2.log"
node tools/connector-demo.mjs > "$J/a4.log" 2>&1; echo "A-4 exit $?"; tail -n 8 "$J/a4.log"
CONNECTOR_STATE_DIR="$(mktemp -d)" node connector/server.mjs --check > "$J/a8.log" 2>&1; echo "A-8 exit $?"; grep -vc "^SKIP " "$J/a8.log"
```

Expected:
- A-1: `# pass 110`, `# fail 0`, exit 0.
- A-2: `475/475`, exit 0.
- A-4: exit 0, with the same summary as the baseline (6 calls, 17 accounts, 2 sent / 1 forceFail, fake AI).
- A-8: exit 0, and `0` lines that are not SKIP.

Then run A-3 and A-9 with the T-1 Step 6 PowerShell block: expect `exit 0 0; chrome dirs before B after B`, and
`e1` PASS in both logs.

- [ ] **Step 2: A-5, net guard on every new test file**

`git diff --name-only --diff-filter=A 51d1490..HEAD -- connector/test | xargs grep -L "installNetGuard()"`
Expected: no output. Every new file is listed by `--diff-filter=A` and contains the call.

- [ ] **Step 3: A-6, no secret in tracked files**

```bash
git diff 51d1490..HEAD | grep -nE "^\+.*(accessKey|accessKeySecret|clientSecret|refreshToken|access_token|Bearer [A-Za-z0-9]|Basic [A-Za-z0-9]|Accesskey)" | grep -vE "FAKE|fake|\[redacted\]|\$\{|: \"\"|''|cfg\.|config|\.oauth|o\.client|README|CONTRACT|CONNECT-" > "$CLAUDE_JOB_DIR/tmp/a6.log"; wc -l < "$CLAUDE_JOB_DIR/tmp/a6.log"
git ls-files connector | grep -E "config\.json$|proof\.json|gainsight-tokens|sent-record|dry-run\.jsonl|token\.txt" ; echo "tracked-state exit $?"
```

Expected: the reviewer reads every line in `a6.log` and finds only code identifiers or `FAKE-` test strings. The
second command prints nothing, with `tracked-state exit 1`.

- [ ] **Step 4: Dispatch the review** with `superpowers:requesting-code-review` on the top model, over
  `git diff 51d1490..HEAD`, against the spec and this plan. The reviewer must check these risk points:
  - refresh-token single-flight and persist-before-use (T-6)
  - the callback route is unreachable outside setup (T-6)
  - the gate cannot be bypassed by a crafted push: dry-run first, the gate per push, and the tenant tie (T-9)
  - no secret in any error, log or `dry-run.jsonl` line
  - every vendor constant has a URL and a CONFIRMED/UNCONFIRMED tag:
    `grep -nE "^(export )?const [A-Z_]+ = " connector/adapters/gong-rest.mjs connector/adapters/gainsight-*.mjs`,
    and each hit's comment must carry the tag
  - the "unproven means unproven" wording in commits: `git log --format=%B 51d1490..HEAD | grep -iE "works with (Gong|Gainsight)"` gives no output

- [ ] **Step 5: Triage the findings with `superpowers:receiving-code-review`.** Each accepted finding becomes a
  build → checker pair: a fresh Sonnet build subagent writes a failing test, then the fix, and commits; a fresh
  Sonnet checker reviews it. The lead re-runs that task's check after each one. If the same fix fails twice, stop
  for Ian.

- [ ] **Step 6: Re-run Step 1.** Record every A-1..A-9 value in `docs/superpowers/2026-10-02-connect-ready-LEDGER.md`,
  each with its measured number and the commit it was measured at. The test count goes up by one for each fix
  test, and each new test is named.

- [ ] **Step 7: Stop for merge.** Send a push notification, then report to Ian in the session: A-1..A-9 measured,
  findings fixed or listed, and blockers B1/B2 as built.
