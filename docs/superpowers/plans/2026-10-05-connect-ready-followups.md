# Connect-ready follow-ups (low findings) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the low findings left from the connect-ready run (review F7-F24 in scope, the three T-14 checker lows),
each with a test that fails first, without reopening any ruling.

**Architecture:** Seven tasks, each covering one file seam of `connector/`: auth/lock, vendor-http, health, gainsight-rest
tests and docs, server, check/setup, and measure. An eighth task (F10, OAuth `state`) is built only if Ian says yes at plan
approval. Every task is TDD, carries its own docs change, and ends with the full connector suite at an exact count.
The tracker HTML is not touched by any task.

**Tech Stack:** Node 26 built-ins only (`node:test`, `node:assert/strict`, `node:fs`, `node:util`); no `package.json`.

**Spec:** `docs/superpowers/evidence/connect-ready/T14-review.md` (findings F1-F23, each with defect, scenario and fix),
the T-14 row of `docs/superpowers/2026-10-02-connect-ready-LEDGER.md` (the three checker lows, F24), the session prompt
`docs/superpowers/sessions/connect-ready-followups-run.md`, and the connect-ready spec
`docs/superpowers/specs/2026-10-02-connect-ready-design.md` (CR1-CR6, D1-D4: not reopened).

## Global Constraints

From the session prompt (`docs/superpowers/sessions/connect-ready-followups-run.md`, "Rules"), verbatim:

- The connector stays Node built-ins only, no `package.json`.
- Unproven means unproven: "tested on recorded-shape fixtures", "unproven until `--check`".
- Docs change in the same commit as the code they describe.
- Never commit `connector/config.json`, `proof.json`, `gainsight-tokens.json`, `sent-record.json`, `dry-run.jsonl`,
  `token.txt`, `*.lock`, any key, or `docs/research/internal/`.
- Send nothing to any external service. Read-only vendor docs pages may be fetched to confirm a fact; cite the URL.
- Gotchas from the last run: `git revert` rejects `-q`; `git merge` reads no message from stdin (use `-F <file>`);
  the studio guard blocks `git checkout -- <path>` (use `git restore <path>`); the worktree guard refuses compound
  shell lines that compute paths or run git inside loops (split them).

From the connect-ready plan (`docs/superpowers/plans/2026-10-02-connect-ready.md`, "Global Constraints"), verbatim:

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

Added for this run:

- Ian's rulings **B1 (a)** and **B2 (a)** stand; F19 and F12 are out of scope; nothing here needs a live tenant.
- No task in this plan edits `osm-book-of-business-tracker-1.0.html` or `tools/selfchecks.js`. If a builder finds it
  must, it stops and reports; the self-checks
  `node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` then run too.
- Commit messages start with the task id (`F-1:` ... `F-8:`) and end with the attribution lines the lead gives.

## Baseline (MEASURED 2026-10-05 by the plan writer at `e9db1a7`, this worktree)

`node --test connector/test/*.test.mjs` → `ℹ tests 140`, `ℹ pass 140`, `ℹ fail 0`, exit 0
(log `C:\Users\teasp\.claude\jobs\5a6b5082\tmp\plan-baseline-tests.txt`). Per file (`grep -c '^test('`): ai 11, check 10,
demo 1, docs 6, e2e-cleanup 3, fixtures 15, gainsight-auth 12, gainsight-push 13, gainsight-read 7, gong-rest 10,
measure 4, proof 6, server 16, setup 10, vendor-fixtures 3, write-gate 13 (sum 140). The self-checks (475), e2e (7/7)
and demo were not re-measured by the plan writer; the lead re-measures them before the build.

## Verification that each finding still exists (read 2026-10-05 at `e9db1a7`)

| Id | Still present? | Evidence |
|---|---|---|
| F7 | yes | `gong-rest.mjs:102` and `gainsight-rest.mjs:235` call `loadProof` (`state.mjs:32`, `JSON.parse` uncaught, via `readJson` `state.mjs:11-14`) inside the `name` getters |
| F8 | yes | `vendor-http.mjs:27-28` scrubs after `JSON.stringify`; `scrubAll` (`:10-12`) matches only the raw secret |
| F9 | yes | `vendor-http.mjs:7` stores `body` enumerable; `:29` passes the raw parsed body |
| F10 | yes | `gainsight-auth.mjs:27-34` (`authorizeUrl`), `:114-137` (`makeCallbackHandler`): no `state` |
| F11 | yes | `server.mjs:112`: only `Content-Type` |
| F13 | yes | `gainsight-read.test.mjs:62-69` covers `"yes"`, not `1` / `"true"`; no test hits `gainsight-rest.mjs:143` |
| F14 | yes | no push test has more than one live item failing in the middle (`gainsight-push.test.mjs` 13 tests read) |
| F15 | yes | `check.test.mjs`: only Gong secrets checked (`:69-76`); no partial `--check --write` |
| F16 | yes | `setup.mjs:45-46, 61-62` accept `''`; no example-untouched assertion |
| F17 | yes | `measure.mjs:34` divides by `st.mean`; `cli.mjs:40` `Number('abc')` → NaN reaches it; `measure.test.mjs` has no 403 / wrong-adapter test (zero calls: covered by the F1 test `measure.test.mjs:62`) |
| F18 | yes | `gong-rest.mjs:109` seeds every id with 0 |
| F20 | yes | `server.mjs:137-154`: a non-command argument falls through to `listen`; `CONTRACT.md:181` documents that |
| F21 | yes | `healthName` (`state.mjs:50-55`) has no locked flag (recommended not to fix, below) |
| F22 | yes | `gainsight-rest.mjs:103, 193` return `it.id`; `CONTRACT.md:116-124` does not say so |
| F23 | yes | `gainsight-auth.mjs:76`: `Date.parse` NaN → comparison false → never expired |
| F24 | yes | `measure.mjs:24` "needs api:calls:read:transcript"; also `CONNECT-GONG.md:49` "Needs the transcript scope on the key" |
| Lock race | yes | `gainsight-auth.mjs:63-65`: stat, then unlink in a separate step; a second waiter can unlink a fresh lock |
| Lock release on failed write | untested | `gainsight-auth.test.mjs` "a failed token-file write ..." does not check the lock file |
| Mixed-code duplicate | yes, undocumented | `hasExactCode` (`gainsight-rest.mjs:58-59`) is true when any value equals the code; `CONTRACT.md:118-119` says "holds exactly that code" |

None was fixed incidentally, so no task is dropped.

## File map

| File | Change | Task |
|---|---|---|
| `connector/adapters/gainsight-auth.mjs` | takeover-guarded stale-lock removal; `lockFs` injection; NaN `obtainedAt` = expired | F-1 |
| `connector/lib/vendor-http.mjs` | scrub JSON-escaped secrets; scrubbed, non-enumerable `VendorError.body` | F-2 |
| `connector/test/vendor-http.test.mjs` (new) | F8, F9 tests | F-2 |
| `connector/lib/state.mjs`, both adapters' `name` getters | `loadProofSafe` | F-3 |
| `connector/adapters/gainsight-rest.mjs` | comment only (mixed-code rule) | F-4 |
| `connector/server.mjs` | `nosniff`; unknown argument → usage, exit 2 | F-5 |
| `connector/lib/setup.mjs` | non-empty key/secret/client id/client secret | F-6 |
| `connector/lib/measure.mjs`, `connector/adapters/gong-rest.mjs` | flag validation, not-computed cases, no-transcript count, 403 wording | F-7 |
| `connector/CONTRACT.md`, `connector/CONNECT-GAINSIGHT.md`, `connector/CONNECT-GONG.md` | same commit as the code | F-1, F-3, F-4, F-5, F-6, F-7 (F-8) |

## Test count after each task

140 → F-1 **144** → F-2 **146** → F-3 **147** → F-4 **152** → F-5 **154** → F-6 **157** → F-7 **164** → (F-8, only if
approved) **167**. If a build subagent's count differs, it says why in its reply.

## Model per task

| Task | Findings | Builder | Why |
|---|---|---|---|
| F-1 | lock race, lock release on failed write, F23 | **top** | concurrency design judgement (the lock race) |
| F-2 | F8, F9 | Sonnet | |
| F-3 | F7 | Sonnet | |
| F-4 | F13, F14, F22, mixed-code duplicate | Sonnet | |
| F-5 | F11, F20 | Sonnet | |
| F-6 | F15, F16 | Sonnet | |
| F-7 | F17, F18, F24 | Sonnet | |
| F-8 | F10 (only if Ian approves) | Sonnet | |

Checkers: a fresh Sonnet checker after every task. Tracker HTML changes: **none** in any task.

---

### Task F-1: Gainsight refresh lock and token expiry (auth/lock)

Closes: T-14 checker low "stale-lock takeover race (crashed holder plus two waiters)", T-14 checker low "lock release
on a failed token write untested", F23. **Builder: top model.**

**Files:**
- Modify: `connector/adapters/gainsight-auth.mjs:5` (imports), `:14-20` (lock comment/constants), `:57-71` (`takeLock`), `:73-92` (`createTokenSource` options, `expired`, `refresh`)
- Modify: `connector/CONTRACT.md:245-249` (gainsight-tokens.json bullet), `connector/CONNECT-GAINSIGHT.md:79-82`
- Test: `connector/test/gainsight-auth.test.mjs` (12 → 16 tests)

**Interfaces:**
- Produces: `createTokenSource({ ..., lockFs })` where `lockFs = { openSync, closeSync, statSync, unlinkSync }`
  (defaults to `node:fs`); exported `takeLock(lockPath, { waitMs, staleMs, pollMs, fs })` → release function.
  Takeover file name: `<tokensPath>.takeover.lock` (ends `.lock`, so `.gitignore`'s `connector/*.lock` covers it).

**Why the race exists (read this first).** `takeLock` (`gainsight-auth.mjs:63-65`) judges a lock stale with
`statSync` and then removes it with `unlinkSync` in a second step. With a crashed holder and two waiters A and B in
two processes: both stat the dead lock as stale; A unlinks it and creates its own fresh lock; B then unlinks **A's
fresh lock** and creates its own. Both refresh with the same single-use refresh token (spec §3.1, CONFIRMED: reuse
trips breach detection). Within one process the three calls are synchronous, so the test injects `lockFs` to
reproduce the interleaving.

- [ ] **Step 1: Write the four failing tests** at the end of `connector/test/gainsight-auth.test.mjs` (after the
  existing "a failed refresh still releases the lock" test, so `EXPIRED` and `slowRefresh` are defined). Add
  `openSync, closeSync, statSync` to the existing `node:fs` import on line 4.

```js
// Follow-ups F-1: lock takeover race, release on a failed write, NaN obtainedAt.
test('oauth lock race: a waiter that saw the crashed holder\'s stale lock never removes the fresh lock another waiter took over', async () => {
  const path = EXPIRED(); const lock = `${path}.lock`;
  writeFileSync(lock, 'crashed');
  const past = new Date(Date.now() - 61e3); utimesSync(lock, past, past);
  let first = true;
  // Waiter A (another process) removes the stale lock and takes a fresh one between waiter B's stat and B's next step.
  const lockFs = { openSync, closeSync, unlinkSync, statSync: (p) => {
    const st = statSync(p);
    if (p === lock && first) { first = false; unlinkSync(lock); writeFileSync(lock, 'waiter-A'); }
    return st;
  } };
  const count = { n: 0 };
  const b = createTokenSource({ cfg: CFG, fetchImpl: slowRefresh(count), tokensPath: path, now: () => T0, lockWaitMs: 150, lockPollMs: 10, lockFs });
  await assert.rejects(b.accessToken(), /another connector process/i);
  assert.equal(count.n, 0);
  assert.equal(readFileSync(lock, 'utf8'), 'waiter-A');
  assert.equal(existsSync(`${path}.takeover.lock`), false);
  unlinkSync(lock); // the test's own fixture
});

test('oauth lock: a takeover file left by a process that died mid-takeover goes stale too, so the dead lock is still taken over', async () => {
  const path = EXPIRED(); const lock = `${path}.lock`; const tk = `${path}.takeover.lock`;
  const past = new Date(Date.now() - 61e3);
  writeFileSync(lock, 'crashed'); utimesSync(lock, past, past);
  writeFileSync(tk, 'crashed-taker'); utimesSync(tk, past, past);
  const count = { n: 0 };
  const src = createTokenSource({ cfg: CFG, fetchImpl: slowRefresh(count), tokensPath: path, now: () => T0, lockWaitMs: 500, lockPollMs: 10 });
  assert.equal(await src.accessToken(), 'FAKE-ACCESS-2');
  assert.equal(count.n, 1);
  assert.equal(existsSync(lock), false);
  assert.equal(existsSync(tk), false);
});

test('oauth lock: a failed token-file write still releases the lock', async () => {
  const path = EXPIRED();
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }), tokensPath: path,
    writeFile: () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); }, now: () => T0 });
  await assert.rejects(src.accessToken(), /spent/);
  assert.equal(existsSync(`${path}.lock`), false);
});

test('oauth F23: an obtainedAt that is not a date counts as expired: one refresh, the new token is used', async () => {
  const path = tokensFile({ raw: { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }, obtainedAt: 'not-a-date' });
  let refreshes = 0;
  const src = createTokenSource({ cfg: CFG, fetchImpl: async () => { refreshes++; return json(200, { FAKE_at: 'FAKE-ACCESS-2', FAKE_rt: 'FAKE-REFRESH-2' }); }, tokensPath: path, now: () => T0 });
  assert.equal(await src.accessToken(), 'FAKE-ACCESS-2');
  assert.equal(refreshes, 1);
});
```

- [ ] **Step 2: Run them; expect 3 to fail.**
  Run: `node --test connector/test/gainsight-auth.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-1-red.txt" 2>&1` and read the summary lines.
  Expected: `tests 16`, `fail 3`: the race test ("Missing expected rejection": `lockFs` is ignored, so B takes the lock and refreshes),
  the takeover-file test (`tk` still exists), F23 (`'FAKE-ACCESS-1'` returned, 0 refreshes). The release test **passes**
  already (the `finally` at `:91` releases): it pins existing behaviour. Prove it is not vacuous: temporarily delete
  `release();` from the `finally` at `:91`, see it fail, then put it back (the file has no other edits yet, so
  `git restore connector/adapters/gainsight-auth.mjs` does it).

- [ ] **Step 3: Implement the takeover-guarded lock** in `connector/adapters/gainsight-auth.mjs`. Replace the
  `takeLock` function (`:57-71`) with the code below, and add `LOCK_FS` next to the lock constants (`:18-20`).

```js
const LOCK_FS = { openSync, closeSync, statSync, unlinkSync };
const ageOf = (fs, p) => { try { return Date.now() - fs.statSync(p).mtimeMs; } catch { return null; } };
function tryCreate(fs, p) {
  try { fs.closeSync(fs.openSync(p, 'wx')); return true; }
  catch (e) { if (e.code === 'EEXIST') return false; throw new Error(`Could not create the Gainsight refresh lock ${p} (${e.code || e.message})`); }
}
// Judging a lock stale and removing it are two steps. Two waiters could both judge a dead holder's lock stale; the first
// removes it and takes a fresh lock, then the second removes that FRESH lock, and both spend one single-use refresh
// token. So only the holder of `<name>.takeover.lock` may remove a stale lock, and it checks the age again after taking
// it. The takeover file is held for two sync calls; one older than staleMs was left by a process that died inside
// them, and is removed. That removal is the one remaining check-then-remove, reachable only after a crash inside a
// takeover while two other waiters are waiting.
function breakStale(fs, lockPath, staleMs) {
  const tk = lockPath.replace(/\.lock$/, '.takeover.lock');
  if (!tryCreate(fs, tk)) {
    const a = ageOf(fs, tk);
    if (a !== null && a > staleMs) { try { fs.unlinkSync(tk); } catch { /* already gone */ } }
    return;
  }
  try {
    const age = ageOf(fs, lockPath);
    if (age !== null && age > staleMs) { try { fs.unlinkSync(lockPath); } catch { /* already gone */ } }
  } finally { try { fs.unlinkSync(tk); } catch { /* already gone */ } }
}

// Takes `<tokensPath>.lock` or throws after waitMs. Returns the release function.
export async function takeLock(lockPath, { waitMs, staleMs, pollMs, fs = LOCK_FS }) {
  const until = Date.now() + waitMs;
  const release = () => { try { fs.unlinkSync(lockPath); } catch { /* already gone */ } };
  for (;;) {
    if (tryCreate(fs, lockPath)) return release;
    const age = ageOf(fs, lockPath);
    if (age === null) continue; // released between the two calls: retry now
    if (age > staleMs) { breakStale(fs, lockPath, staleMs); if (tryCreate(fs, lockPath)) return release; }
    if (Date.now() >= until) {
      throw new Error(`Another connector process is refreshing the Gainsight token: ${lockPath} was held for more than ${Math.round(waitMs / 1000)} s. Retry in a minute; if no other connector or --check is running, delete ${lockPath}.`);
    }
    await delay(pollMs);
  }
}
```

  In `createTokenSource` (`:73-78`): add `lockFs = LOCK_FS` to the options, and pass `fs: lockFs` into the
  `takeLock` call at `:78`. The new `takeLock` uses `delay` (`:55`), so it stays below that line, where the old one was.

- [ ] **Step 4: Fix F23** — replace `:76` with:

```js
  // T-14 F23: an obtainedAt that is not a date (hand-edited or truncated file) counts as expired, never as fresh forever.
  const expired = (s) => { const t = Date.parse(s.obtainedAt); return Number.isNaN(t) || now().getTime() - t > ACCESS_TTL_MS - REFRESH_EARLY_MS; };
```

- [ ] **Step 5: Docs in the same commit.** In `connector/CONTRACT.md`, the `gainsight-tokens.json` bullet (`:245-249`),
  replace the last sentence ("A waiter gives up ... is taken over.") with:
  "A waiter gives up after 65 s with an error naming the lock; a lock older than 60 s (twice the 30 s call timeout) is a
  dead holder's and is taken over. Only one waiter at a time may remove a stale lock: it first creates
  `gainsight-tokens.json.takeover.lock` and checks the age again, so a fresh lock is never removed. An `obtainedAt` that
  is not a date counts as expired." In `connector/CONNECT-GAINSIGHT.md:82`, after "(a lock older than 60 s is taken
  over on its own)" add: "; `gainsight-tokens.json.takeover.lock` may appear for a moment while that happens. Both
  files are git-ignored (`connector/*.lock`)".

- [ ] **Step 6: Run the task check and the suite.**
  Run: `node --test connector/test/gainsight-auth.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-1-auth.txt" 2>&1` → `tests 16`, `pass 16`, `fail 0`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-1-all.txt" 2>&1` → `tests 144`, `pass 144`, `fail 0`, exit 0
  (+4: the race test, the takeover-file test, the release-on-failed-write test, F23).
  Run: `node tools/connector-demo.mjs > "$CLAUDE_JOB_DIR/tmp/F-1-demo.txt" 2>&1` → exit 0.
  Then confirm no lock is left in the repo: `git status --porcelain` shows only the three edited files and the test.

- [ ] **Step 7: Commit.**

```bash
git add connector/adapters/gainsight-auth.mjs connector/test/gainsight-auth.test.mjs connector/CONTRACT.md connector/CONNECT-GAINSIGHT.md
git commit -m "F-1: refresh lock takeover guarded against the two-waiter race; NaN obtainedAt is expired (T-14 checker lows, F23)" -m "<attribution lines from the lead>"
```

---

### Task F-2: vendor-http scrubbing (escaped secrets, kept body)

Closes: F8, F9. **Builder: Sonnet.**

**Files:**
- Modify: `connector/lib/vendor-http.mjs:6-12` (`VendorError`, `scrubAll`), `:26-31` (error path of `requestJson`)
- Create: `connector/test/vendor-http.test.mjs` (2 tests)

**Interfaces:**
- Consumes: nothing new. Callers that read `e.body` keep working: `isNoCalls404` (`gong-rest.mjs:24-27`) reads
  `e.body.errors`; `sendOne` (`gainsight-rest.mjs:193`) reads `JSON.stringify(e.body)`. The body keeps its shape;
  only secrets inside string values become `[redacted]`.
- Produces: `scrubAll(text, secrets)` also removes each secret's JSON-escaped form; `VendorError.body` is scrubbed and
  not enumerable.

- [ ] **Step 1: Write the failing tests** — create `connector/test/vendor-http.test.mjs`:

```js
// Follow-ups F-2 (T-14 F8, F9): vendor-http scrubs JSON-escaped secrets and keeps no raw vendor body. Stubbed fetch only. Node built-ins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { installNetGuard } from '../lib/test-net-guard.mjs';
import { requestJson, VendorError } from '../lib/vendor-http.mjs';

installNetGuard();
const SECRET = 'FAKE"sec\\ret'; // the characters FAKE"sec\ret: a quote and a backslash, escaped inside JSON text
const ESCAPED = JSON.stringify(SECRET).slice(1, -1);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const call = (body, status = 400) => requestJson({ fetchImpl: async () => json(status, body), method: 'POST', url: 'https://fake.invalid/x', body: {}, secrets: [SECRET], host: 'Fake' });

test('vendor-http F8: a secret with a quote and a backslash, echoed in a JSON error body, is absent from the message', async () => {
  await assert.rejects(call({ error: `bad key ${SECRET}` }), (e) => {
    assert.ok(e instanceof VendorError);
    assert.ok(!e.message.includes(SECRET), e.message);
    assert.ok(!e.message.includes(ESCAPED), e.message);
    assert.match(e.message, /\[redacted\]/);
    return true;
  });
});

test('vendor-http F9: the kept body is scrubbed, keeps its shape, and is not an enumerable field (so an uncaught print omits it)', async () => {
  await assert.rejects(call({ errors: [`No calls found ${SECRET}`], errorCode: 'GS_TL_10_0107' }, 404), (e) => {
    assert.equal(e.status, 404);
    assert.ok(Array.isArray(e.body.errors));
    assert.match(e.body.errors[0], /^No calls found \[redacted\]$/);
    assert.equal(e.body.errorCode, 'GS_TL_10_0107');
    assert.ok(!JSON.stringify(e.body).includes(ESCAPED));
    assert.ok(!Object.keys(e).includes('body'));
    assert.ok(!/\bbody:/.test(inspect(e)), inspect(e));
    return true;
  });
});
```

- [ ] **Step 2: Run; expect both to fail.**
  Run: `node --test connector/test/vendor-http.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-2-red.txt" 2>&1`.
  Expected: `tests 2`, `fail 2` (F8: the message still holds `FAKE\"sec\\ret`; F9: `e.body.errors[0]` holds the secret and `body` is enumerable).

- [ ] **Step 3: Implement** in `connector/lib/vendor-http.mjs`. Replace `:6-12` with:

```js
export class VendorError extends Error {
  constructor(message, { status = null, bodyKeys = [], body = null } = {}) {
    super(message); this.status = status; this.bodyKeys = bodyKeys;
    // T-14 F9: the vendor body is kept only for the duplicate and no-calls checks. requestJson scrubs it, and it is not
    // enumerable, so Node's print of an uncaught error (which lists own enumerable fields) never shows it.
    Object.defineProperty(this, 'body', { value: body, enumerable: false, writable: true, configurable: true });
  }
}

// T-14 F8: a secret holding ", \ or a control character appears escaped inside JSON text, so that form is scrubbed too.
const forms = (k) => { const raw = String(k); const esc = JSON.stringify(raw).slice(1, -1); return esc === raw ? [raw] : [raw, esc]; };
export function scrubAll(text, secrets = []) {
  return secrets.filter(Boolean).flatMap(forms).reduce((s, k) => scrub(s, k), String(text == null ? '' : text));
}
const scrubBody = (json, secrets) => { try { return JSON.parse(scrubAll(JSON.stringify(json), secrets)); } catch { return null; } };
```

  and in `requestJson` change `body: json,` (`:29`) to `body: json == null ? null : scrubBody(json, secrets),`.

- [ ] **Step 4: Run the task check and the suite.**
  Run: `node --test connector/test/vendor-http.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-2-vh.txt" 2>&1` → `tests 2`, `pass 2`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-2-all.txt" 2>&1` → `tests 146`, `pass 146`, `fail 0`
  (+2: the two vendor-http tests). The F1 no-calls tests (`gong-rest`, `check`, `measure`) and the duplicate tests
  (`gainsight-push`) must still pass: they read `e.body`.

- [ ] **Step 5: Commit** (no doc names `VendorError.body`; `grep -n "VendorError\|bodyKeys" connector/*.md` returns nothing, so no doc changes).

```bash
git add connector/lib/vendor-http.mjs connector/test/vendor-http.test.mjs
git commit -m "F-2: vendor-http scrubs JSON-escaped secrets and keeps a scrubbed, non-enumerable body (T-14 F8, F9)" -m "<attribution lines from the lead>"
```

---

### Task F-3: health never throws on a corrupt proof.json

Closes: F7. **Builder: Sonnet.**

**Files:**
- Modify: `connector/lib/state.mjs:32` (add `loadProofSafe` after `loadProof`)
- Modify: `connector/adapters/gong-rest.mjs:4, :102`; `connector/adapters/gainsight-rest.mjs:6, :235`
- Modify: `connector/CONTRACT.md:242-243` (proof.json bullet)
- Test: `connector/test/proof.test.mjs` (6 → 7 tests)

**Interfaces:**
- Produces: `loadProofSafe(dir)` → the proof object, or `{}` when the file is missing, unreadable, not JSON or not an
  object. Used only by the health `name` getters. The write gate keeps `loadProof` (it must fail closed with its own
  message, `write-gate.mjs:22-26`).

- [ ] **Step 1: Write the failing test** — add `writeFileSync` to the `node:fs` import on line 4 of
  `connector/test/proof.test.mjs`, and append:

```js
// Follow-ups F-3 (T-14 F7): a corrupt proof.json must show "unproven", not take /v1/health down.
test('health F7: a corrupt proof.json gives 200 with both real adapters unproven, not an error', async () => {
  const dir = tmp();
  writeFileSync(join(dir, 'proof.json'), '{not json');
  const token = 'test-token-0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
  const server = createConnector({ config: {}, adapters: loadAdapters({ gong: GONG, gainsight: GS }, { stateDir: dir }), token });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/v1/health`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.deepEqual(b.adapters, { gong: 'gong-rest (unproven)', gainsight: 'gainsight-rest (unproven, dry-run)', ai: 'fake' });
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});
```

- [ ] **Step 2: Run; expect it to fail.**
  Run: `node --test connector/test/proof.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-3-red.txt" 2>&1` → `tests 7`, `fail 1`
  (status 502: the getter's `JSON.parse` throws inside the route, `server.mjs:118-120`).

- [ ] **Step 3: Implement.** In `connector/lib/state.mjs`, after `loadProof` (`:32`):

```js
// /v1/health must not throw (T-14 F7): an unreadable proof.json reads as "no proof", so the adapter shows unproven.
// The write gate does NOT use this: it blocks on an unreadable file with its own message (write-gate.mjs).
export function loadProofSafe(dir) {
  try { const p = loadProof(dir); return p && typeof p === 'object' && !Array.isArray(p) ? p : {}; } catch { return {}; }
}
```

  In `connector/adapters/gong-rest.mjs`, import `loadProofSafe` instead of `loadProof` (`:4`) and use it at `:102`.
  In `connector/adapters/gainsight-rest.mjs`, add `loadProofSafe` to the `state.mjs` import (`:6`), drop `loadProof`
  from that import if nothing else uses it (`grep -n "loadProof" connector/adapters/gainsight-rest.mjs`), and use it at `:235`.

- [ ] **Step 4: Docs in the same commit.** In `connector/CONTRACT.md`, the `proof.json` bullet (`:242-243`), append:
  "A `proof.json` that cannot be read counts as no proof in `/v1/health` (the adapter shows `unproven`); production
  writes stay blocked until it is fixed or deleted."

- [ ] **Step 5: Run the task check and the suite.**
  Run: `node --test connector/test/proof.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-3-proof.txt" 2>&1` → `tests 7`, `pass 7`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-3-all.txt" 2>&1` → `tests 147`, `pass 147`, `fail 0`
  (+1: health F7). The write-gate test "corrupt proof blocks" must still pass.

- [ ] **Step 6: Commit.**

```bash
git add connector/lib/state.mjs connector/adapters/gong-rest.mjs connector/adapters/gainsight-rest.mjs connector/test/proof.test.mjs connector/CONTRACT.md
git commit -m "F-3: health reads a corrupt proof.json as unproven instead of failing (T-14 F7)" -m "<attribution lines from the lead>"
```

---

### Task F-4: gainsight-rest test gaps and the duplicate rules in CONTRACT.md

Closes: F13, F14, F22, T-14 checker low "a `data.failures` entry carrying the duplicate code alongside other codes
counts as sent (undocumented)". **Builder: Sonnet.**

**Decision taken in this plan (Ian may overrule at approval, question 3):** a failures entry that holds
`GS_TL_10_0107` alongside other codes stays **sent**. The duplicate code means the ExternalId already exists in
Gainsight, so a resend can never succeed; answering `failed` would put the item back in the stuck loop F3 fixed. The
code already does this (`hasExactCode`, `gainsight-rest.mjs:58-59`); this task pins it with a test and documents it.

**Files:**
- Modify: `connector/adapters/gainsight-rest.mjs:55-57` (comment only)
- Modify: `connector/CONTRACT.md:117-124` (saved-send-record bullet)
- Test: `connector/test/gainsight-read.test.mjs` (7 → 9), `connector/test/gainsight-push.test.mjs` (13 → 15), `connector/test/docs.test.mjs` (6 → 7)

**Interfaces:** none new. Uses `create` from `gainsight-rest.mjs` and the files' existing helpers (`adapter`, `json`,
`CFG`, `TL`, `stub`, `NOW`, `read`, `root`).

- [ ] **Step 1: Write the docs test (fails first)** — append to `connector/test/docs.test.mjs`:

```js
// Follow-ups F-4 (T-14 F22 and the mixed-code checker low)
test('docs F22: CONTRACT.md says a duplicate\'s externalId is our item id, and that the duplicate code among other codes still counts as sent', () => {
  const c = read(join(root, 'CONTRACT.md'));
  assert.match(c, /`externalId` is our item id/);
  assert.match(c, /alongside other codes/);
});
```

- [ ] **Step 2: Write the four pinning tests.** Append to `connector/test/gainsight-read.test.mjs`:

```js
// Follow-ups F-4 (T-14 F13)
test('gainsight reads F13: a gate field holding 1 or "true" is not true (fail-safe: the gate is not offered)', async () => {
  const row = (gsid, v) => ({ Gsid: gsid, Name: `FAKE Co ${gsid}`, FAKE_Readiness__gc: v, FAKE_Csat__gc: true, FAKE_SuccessPlan__gc: false });
  const accounts = await adapter(async () => json(200, { result: true, data: [row('1P02FAKE0009', 1), row('1P02FAKE0010', 'true')] })).listAccounts();
  assert.deepEqual(accounts.map((a) => a.gates.readinessAssessment), [false, false]);
  assert.deepEqual(accounts.map((a) => a.gates.csatContact), [true, true]);
});

test('gainsight reads F13: with neither apiBaseUrl nor appUrl, listAccounts throws "not configured" and calls nothing', async () => {
  let calls = 0;
  const a = adapter(async () => { calls++; return json(200, {}); }, { ...CFG, apiBaseUrl: '', appUrl: '' });
  await assert.rejects(a.listAccounts(), /gainsight-rest is not configured \(missing gainsight\.apiBaseUrl\)/);
  assert.equal(calls, 0);
});
```

  Append to `connector/test/gainsight-push.test.mjs`:

```js
// Follow-ups F-4 (T-14 F14 and the mixed-code checker low)
test('push F14: one item failing in the middle of three: the other two are sent and recorded, the failed one is not', async () => {
  const items = ['q-tl-a', 'q-tl-b', 'q-tl-c'].map((id) => ({ ...TL, id }));
  const seen = [];
  const fn = async (url, init) => {
    const id = JSON.parse(init.body).records[0].ExternalId; seen.push(id);
    if (id === 'q-tl-b') return json(500, { errorDesc: 'FAKE boom' });
    return json(200, { result: true, data: { failures: {}, success: { [id]: [{ activityId: `ACT-${id}` }] } } });
  };
  const stateDir = mkdtempSync(join(tmpdir(), 'gs-push-'));
  const a = create(CFG, { fetchImpl: fn, tokenSource: { accessToken: async () => 'FAKE-ACCESS-yy' }, sleep: async () => {}, now: () => NOW, stateDir });
  const res = await a.push(items);
  assert.deepEqual(res.map((r) => [r.id, r.status, r.externalId]), [['q-tl-a', 'sent', 'ACT-q-tl-a'], ['q-tl-b', 'failed', null], ['q-tl-c', 'sent', 'ACT-q-tl-c']]);
  assert.deepEqual(seen, ['q-tl-a', 'q-tl-b', 'q-tl-c']);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))).sort(), ['q-tl-a', 'q-tl-c']);
});

test('push: a data.failures entry with GS_TL_10_0107 alongside other codes counts as sent with our item id (documented in CONTRACT.md)', async () => {
  const s = stub(() => json(200, { result: true, data: { success: {}, failures: { 'q-timeline-1': [{ errorCode: 'GS_TL_10_0107' }, { errorCode: 'GS_TL_10_0001', errorDesc: 'other' }] } } }));
  const { a, stateDir } = adapter(s);
  const [r] = await a.push([TL]);
  assert.deepEqual(r, { id: 'q-timeline-1', status: 'sent', externalId: 'q-timeline-1', error: null });
  assert.ok(JSON.parse(readFileSync(join(stateDir, 'sent-record.json'), 'utf8'))['q-timeline-1']);
});
```

- [ ] **Step 3: Run; expect only the docs test to fail.**
  Run: `node --test connector/test/docs.test.mjs connector/test/gainsight-read.test.mjs connector/test/gainsight-push.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-4-red.txt" 2>&1`.
  Expected: `tests 31`, `fail 1` (docs F22). The four adapter tests pass at once: they pin behaviour the review found
  by reading. Prove each is not vacuous, one at a time, then restore the line:
  F13 gates: change `r[gm[k]] === true` (`gainsight-rest.mjs:43`) to `== true` → the `1` case fails.
  F13 config: delete the `if (!apiBase) throw` line (`:143`) → the test fails.
  F14: in `sendOne` (`:194`) change `else return fail(it, ...)` to `else throw e;` → `push` rejects and the test fails.
  Mixed code: change `hasExactCode(bad)` (`:103`) to `bad.every(hasExactCode)` → the test fails.

- [ ] **Step 4: Docs and comment.** In `connector/CONTRACT.md:117-121`, replace the text from "A duplicate-ExternalId
  rejection" to "and is not stored." with:
  "A duplicate-ExternalId rejection (`GS_TL_10_0107`) counts as already sent, whether it comes as an HTTP error or as an
  HTTP 200 whose `data.failures` entry for the item holds exactly that code as one of its values (where the code sits
  is UNCONFIRMED). It counts as sent even when that entry carries it alongside other codes: the record already exists
  in Gainsight, so a resend could never succeed. In both cases `externalId` is our item id, not a Gainsight
  `activityId`: the duplicate reply does not carry one. Any other Timeline reply that lists the item in
  `data.failures`, or has no `activityId` for it in `data.success`, answers `failed` and is not stored."
  In `connector/adapters/gainsight-rest.mjs:55-57`, extend the `hasExactCode` comment with one line:
  "// An entry holding the code alongside other codes is still sent: the ExternalId exists, so a resend cannot succeed (CONTRACT.md)."

- [ ] **Step 5: Run the task check and the suite.**
  Run: `node --test connector/test/docs.test.mjs connector/test/gainsight-read.test.mjs connector/test/gainsight-push.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-4-files.txt" 2>&1` → `tests 31`, `pass 31`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-4-all.txt" 2>&1` → `tests 152`, `pass 152`, `fail 0`
  (+5: two F13 reads, F14, mixed code, docs F22).

- [ ] **Step 6: Commit.**

```bash
git add connector/adapters/gainsight-rest.mjs connector/test/gainsight-read.test.mjs connector/test/gainsight-push.test.mjs connector/test/docs.test.mjs connector/CONTRACT.md
git commit -m "F-4: pin gate, config, mid-batch and mixed-code duplicate behaviour; CONTRACT says a duplicate's externalId is our id (T-14 F13, F14, F22)" -m "<attribution lines from the lead>"
```

---

### Task F-5: server: nosniff on the callback, unknown argument stops

Closes: F11, F20. **Builder: Sonnet.**

**Files:**
- Modify: `connector/server.mjs:112` (callback headers), `:137-139` (argument check)
- Modify: `connector/CONTRACT.md:181` ("Any other argument starts the server as before.")
- Test: `connector/test/gainsight-auth.test.mjs` (16 → 17 after F-1), `connector/test/server.test.mjs` (16 → 17)

**Interfaces:** consumes `COMMANDS` from `connector/lib/cli.mjs:6` (`['--unlock-production', '--check', '--setup', '--measure-transcripts']`).
`tools/connector-demo.mjs:28` and `tools/connector-e2e.mjs:45` start the server with no arguments, so they are unaffected.

- [ ] **Step 1: Write the failing tests.** Append to `connector/test/gainsight-auth.test.mjs`:

```js
// Follow-ups F-5 (T-14 F11)
test('oauth F11: the callback reply is text/plain with X-Content-Type-Options: nosniff', async () => {
  const server = createConnector({ config: {}, adapters: loadAdapters({}), token: TOKEN, oauthCallback: async () => ({ status: 200, text: 'names: <b>x</b>' }) });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/oauth/callback?code=x`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.match(r.headers.get('content-type'), /^text\/plain/);
  } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
});
```

  In `connector/test/server.test.mjs` change line 6 to `import { spawn, spawnSync } from 'node:child_process';` and append:

```js
// Follow-ups F-5 (T-14 F20)
test('t15 an argument that is not a command prints usage and exits 2; the server does not start', () => {
  const tokenFile = join(tmp, 'f20-token.txt');
  const r = spawnSync(process.execPath, [join(root, 'server.mjs'), '--chek'], { encoding: 'utf8', timeout: 20000,
    env: { ...process.env, CONNECTOR_CONFIG: join(root, 'config.example.json'), CONNECTOR_STATE_DIR: tmp, CONNECTOR_TOKEN_FILE: tokenFile } });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /unknown argument: --chek/);
  assert.match(r.stderr, /usage: node connector\/server\.mjs/);
  assert.ok(!/listening/.test(r.stdout), r.stdout);
  assert.equal(existsSync(tokenFile), false);
});
```

- [ ] **Step 2: Run; expect both to fail.**
  Run: `node --test connector/test/gainsight-auth.test.mjs connector/test/server.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-5-red.txt" 2>&1`.
  Expected: `tests 34`, `fail 2` (nosniff header is null; t15 times out after 20 s or exits non-2 because the server
  starts listening — `r.status` is `null` on timeout).

- [ ] **Step 3: Implement.** `connector/server.mjs:112` becomes:

```js
        res.writeHead(r.status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }); // T-14 F11
```

  After `const isCli = ...` (`:139`) insert:

```js
  // T-14 F20: a mistyped command (`--chek`) must not start the server silently.
  if (args.length && !isCli) {
    console.error(`unknown argument: ${args.join(' ')}`);
    console.error(`usage: node connector/server.mjs [${cli.COMMANDS.join(' | ')}]  (--check takes --write; --measure-transcripts takes --book-bytes <n> --quota-bytes <n>); no argument starts the server`);
    process.exit(2);
  }
```

- [ ] **Step 4: Docs in the same commit.** `connector/CONTRACT.md:181`: replace "Any other argument starts the server as
  before." with "With no argument the server starts; any argument that is not one of these commands prints
  `unknown argument:` and a usage line and exits 2 (nothing starts)." Also grep the runbooks:
  `grep -n "Any other argument\|starts the server" connector/*.md` and fix any other sentence that says otherwise.

- [ ] **Step 5: Run the task check and the suite.**
  Run: `node --test connector/test/gainsight-auth.test.mjs connector/test/server.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-5-files.txt" 2>&1` → `tests 34`, `pass 34`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-5-all.txt" 2>&1` → `tests 154`, `pass 154`, `fail 0`
  (+2: oauth F11, t15).
  Run: `node tools/connector-demo.mjs > "$CLAUDE_JOB_DIR/tmp/F-5-demo.txt" 2>&1` → exit 0 (the demo spawns the server).

- [ ] **Step 6: Commit.**

```bash
git add connector/server.mjs connector/test/gainsight-auth.test.mjs connector/test/server.test.mjs connector/CONTRACT.md
git commit -m "F-5: callback reply carries nosniff; an unknown argument prints usage and exits 2 (T-14 F11, F20)" -m "<attribution lines from the lead>"
```

---

### Task F-6: --check secrets and partial write; --setup refuses empty secrets

Closes: F15, F16 (empty-secret re-ask; config.example untouched as an added assertion). The F16 `0o600` mode test
is not built (see "Findings recommended NOT to fix"). **Builder: Sonnet.**

**Files:**
- Modify: `connector/lib/setup.mjs:18-25` (`askValid` gains `opts`), `:45-46`, `:61-62`
- Modify: `connector/CONTRACT.md:207-208` (`--setup` paragraph)
- Test: `connector/test/check.test.mjs` (10 → 12), `connector/test/setup.test.mjs` (10 → 11; one extra assertion in the existing test at `:113`)

**Interfaces:** `askValid(ask, out, q, ok, hint, opts = {})` → passes `opts` to `ask(q, opts)` so `{ secret: true }`
keeps echo off on the re-ask.

- [ ] **Step 1: Write the F16 failing test.** Append to `connector/test/setup.test.mjs`:

```js
// Follow-ups F-6 (T-14 F16)
test('setup F16: an empty Gong key or secret, or Gainsight client id or secret, is asked again; nothing empty is written', async () => {
  const dir = tmp(); const configPath = join(dir, 'config.json'); const out = [];
  const g = scripted(['y', 'https://fake-tenant.gong.invalid', '', 'FAKE-KEY-123', '', 'FAKE-SECRET-456', 'ian.fake@fake-osm.invalid', 'n']);
  assert.equal(await runSetup({ configPath, config: EXAMPLE, ask: g.ask, out: (l) => out.push(l), stateDir: dir, runCheckFn: async () => 0 }), 0);
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(cfg.gong.accessKey, 'FAKE-KEY-123');
  assert.equal(cfg.gong.accessKeySecret, 'FAKE-SECRET-456');
  assert.equal(g.prompts.filter((p) => /^Gong access key: /.test(p)).length, 2);
  assert.equal(g.prompts.filter((p) => /^Gong access key secret/.test(p)).length, 2);
  const s = scripted(['n', 'y', 'https://fake-sbx.gainsightcloud.invalid', '', 'FAKE-SBX-1', 'sandbox', '', 'FAKE-CLIENT-ID', '', 'FAKE-CLIENT-SECRET-zz', 'FAKE_SCOPE']);
  const code = await runSetup({ configPath, config: EXAMPLE, ask: s.ask, out: (l) => out.push(l), stateDir: dir,
    startCallbackServer: async () => ({ ok: false, reason: 'codeParamUnset', names: [] }), runCheckFn: async () => { throw new Error('must not run'); } });
  assert.equal(code, 1);
  const gs = JSON.parse(readFileSync(configPath, 'utf8')).gainsight;
  assert.equal(gs.oauth.clientId, 'FAKE-CLIENT-ID');
  assert.equal(gs.oauth.clientSecret, 'FAKE-CLIENT-SECRET-zz');
  assert.ok(!out.join('\n').match(/FAKE-SECRET-456|FAKE-CLIENT-SECRET-zz/));
});
```

  And in the existing test `'CONNECTOR_CONFIG pointing at a new file: ...'` (`setup.test.mjs:113-120`) add, before the
  spawn, `const example = fileURLToPath(new URL('../config.example.json', import.meta.url)); const before = readFileSync(example, 'utf8');`
  and after the asserts `assert.equal(readFileSync(example, 'utf8'), before); // F16: the example is a template, never written`.

- [ ] **Step 2: Write the two F15 tests.** Append to `connector/test/check.test.mjs`:

```js
// Follow-ups F-6 (T-14 F15)
test('check F15: Gainsight secrets (client secret, access token) never reach --check output, on a pass or on a vendor error', async () => {
  const cfg = { ...GS, oauth: { clientId: 'FAKE-CLIENT-ID', clientSecret: 'FAKE-CLIENT-SECRET-zz' } };
  const ok = await run({ gainsight: cfg }, gsTenant([]));
  const bad = await run({ gainsight: cfg }, async () => json(400, { errorDesc: 'echo FAKE-ACCESS-yy FAKE-CLIENT-SECRET-zz' }));
  assert.equal(ok.code, 0, ok.lines.join('\n'));
  assert.equal(bad.code, 1);
  assert.ok(bad.lines.some((l) => l.startsWith('FAIL gainsight read:')), bad.lines.join('\n'));
  for (const l of [...ok.lines, ...bad.lines]) assert.ok(!/FAKE-ACCESS-yy|FAKE-CLIENT-SECRET-zz/.test(l), l);
});

test('check F15: --check --write with one kind failing records no write proof and exits 1', async () => {
  const base = gsTenant([]);
  const fetchImpl = async (url, init) => (url.endsWith('/v2/cockpit/cta') ? json(400, { result: false, errorDesc: 'FAKE cta rejected' }) : base(url, init));
  const r = await run({ gainsight: GS }, fetchImpl, { write: true });
  assert.equal(r.code, 1);
  assert.ok(r.lines.some((l) => l.startsWith('PASS gainsight write Pending items batch')), r.lines.join('\n'));
  assert.ok(r.lines.some((l) => l.startsWith('FAIL gainsight write At-Risk CTA')), r.lines.join('\n'));
  assert.ok(!r.lines.some((l) => l.startsWith('PASS gainsight write proof recorded')));
  const p = loadProof(r.stateDir).gainsight;
  assert.ok(p.read);
  assert.equal(p.write, undefined);
});
```

- [ ] **Step 3: Run; expect only the F16 test to fail.**
  Run: `node --test connector/test/setup.test.mjs connector/test/check.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-6-red.txt" 2>&1`.
  Expected: `tests 23`, `fail 1` (F16: `accessKey` is written as `''`, because the empty answer is accepted and every later answer shifts one question).
  The two F15 tests pass at once (they pin `check.mjs:96-106` and the scrub in `gainsight-rest.mjs:149`). Prove
  them: temporarily remove `access` from `secrets` at `gainsight-rest.mjs:149` → the first fails; temporarily change
  `if (ok)` at `check.mjs:103` to `if (true)` → the second fails. Restore both.

- [ ] **Step 4: Implement** in `connector/lib/setup.mjs`. `askValid` (`:18-25`):

```js
async function askValid(ask, out, q, ok, hint, opts = {}) {
  for (let i = 0; i < 3; i++) {
    const v = String(await ask(q, opts)).trim();
    if (ok(v)) return v;
    out(`  Not valid: ${hint}`);
  }
  throw new Error(`setup stopped: no valid answer to "${q.trim()}" after 3 tries`);
}
const filled = (v) => v.length > 0; // T-14 F16: an empty key or secret would only fail one step later, in --check
```

  `:45-46`:

```js
    g.accessKey = await askValid(ask, out, 'Gong access key: ', filled, 'the access key cannot be empty');
    g.accessKeySecret = await askValid(ask, out, 'Gong access key secret (not shown): ', filled, 'the secret cannot be empty', { secret: true });
```

  `:61-62`:

```js
    g.oauth.clientId = await askValid(ask, out, 'OAuth client id: ', filled, 'the client id cannot be empty');
    g.oauth.clientSecret = await askValid(ask, out, 'OAuth client secret (not shown): ', filled, 'the client secret cannot be empty', { secret: true });
```

- [ ] **Step 5: Docs in the same commit.** `connector/CONTRACT.md:207-208` ("Secret answers (Gong access key secret,
  OAuth client secret) are not echoed and never printed."): append "An empty Gong access key, key secret, OAuth client
  id or client secret is asked again, up to 3 tries."

- [ ] **Step 6: Run the task check and the suite.**
  Run: `node --test connector/test/setup.test.mjs connector/test/check.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-6-files.txt" 2>&1` → `tests 23`, `pass 23`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-6-all.txt" 2>&1` → `tests 157`, `pass 157`, `fail 0`
  (+3: setup F16, two check F15).
  Run: `git status --porcelain` → no `connector/config.json` (the tests write only to temp dirs).

- [ ] **Step 7: Commit.**

```bash
git add connector/lib/setup.mjs connector/test/setup.test.mjs connector/test/check.test.mjs connector/CONTRACT.md
git commit -m "F-6: --setup re-asks empty keys and secrets; pin --check secret scrub and partial-write proof (T-14 F15, F16)" -m "<attribution lines from the lead>"
```

---

### Task F-7: --measure-transcripts arithmetic, missing transcripts, honest 403

Closes: F17 (flags, Infinity/negative/NaN, 403 / wrong-adapter tests), F18, F24. The F17 "all callIds in one
request" point is not built (see "Findings recommended NOT to fix"). **Builder: Sonnet.**

**Deviation from the review's wording (stated for the checker):** the review suggests printing "not computed" for a
bad flag. This plan stops earlier: a `--book-bytes` / `--quota-bytes` that is not a number ≥ 0 prints one `FAIL
measure:` line and exits 1 **before any Gong call**, because a mistyped flag is the user's input error, not a property
of the data. The data-driven cases (every transcript empty; book at or over quota) print "not computed (reason)".

**Files:**
- Modify: `connector/adapters/gong-rest.mjs:106-120` (`transcriptLengths`)
- Modify: `connector/lib/measure.mjs:17-37` (`runMeasure`)
- Modify: `connector/CONNECT-GONG.md:49`, `connector/CONTRACT.md:259-263` (Transcripts (I-2) paragraph)
- Test: `connector/test/measure.test.mjs` (4 → 10), `connector/test/docs.test.mjs` (7 → 8 after F-4)

**Interfaces:**
- Produces: `transcriptLengths({ since })` → `{ calls, lengths, noTranscript }`; `lengths` holds only calls Gong returned
  a transcript for; `noTranscript = calls - lengths.length`. Its only caller is `measure.mjs:23`
  (`grep -rn transcriptLengths connector tools` → 2 hits).

- [ ] **Step 1: Write the six measure tests.** In `connector/test/measure.test.mjs` add
  `import { runCli } from '../lib/cli.mjs';` after line 9, and append:

```js
// Follow-ups F-7 (T-14 F17, F18, F24)
const measureWith = async (fetchImpl, opts = {}) => {
  const lines = [];
  const code = await runMeasure({ config: { gong: GONG }, stateDir: mkdtempSync(join(tmpdir(), 'measure-')), now: () => NOW, out: (l) => lines.push(l),
    deps: { fetchImpl, sleep: async () => {}, now: () => NOW }, ...opts });
  return { code, lines };
};
const tenant = (transcripts = TRANSCRIPTS, extensive = EXTENSIVE) => async (url) => json(200, url.endsWith('/v2/calls/transcript') ? transcripts : extensive);

test('measure F17/F24: a 403 on transcripts is one FAIL line naming the Gong admin; the scope is "to confirm", not fact', async () => {
  const r = await measureWith(async (url) => (url.endsWith('/v2/calls/transcript') ? json(403, { errors: ['FAKE forbidden'] }) : json(200, EXTENSIVE)));
  assert.equal(r.code, 1);
  assert.equal(r.lines.length, 1, r.lines.join('\n'));
  assert.match(r.lines[0], /^FAIL measure: .*who fixes it: Gong admin \(.*api:calls:read:transcript.*to confirm\)$/);
  assert.ok(!/FAKE-KEY-123|FAKE-SECRET-456/.test(r.lines[0]));
});

test('measure F17: a gong adapter other than gong-rest is one FAIL line, exit 1, no call', async () => {
  let calls = 0;
  const r = await measureWith(async () => { calls++; return json(200, EXTENSIVE); }, { config: { gong: { adapter: 'fake' } } });
  assert.equal(r.code, 1);
  assert.deepEqual(r.lines, ['FAIL measure: gong.adapter is not "gong-rest"; run node connector/server.mjs --setup; who fixes it: Ian']);
  assert.equal(calls, 0);
});

test('measure F17: when every transcript returned is empty, months is "not computed", never Infinity', async () => {
  const empty = { ...TRANSCRIPTS, callTranscripts: TRANSCRIPTS.callTranscripts.map((t) => ({ ...t, transcript: [] })) };
  const r = await measureWith(tenant(empty), { bookBytes: 1000000 });
  assert.equal(r.code, 0);
  assert.equal(r.lines.at(-1), 'derived: months until the book fills: not computed (every transcript returned is empty)');
  assert.ok(!r.lines.some((l) => /Infinity|NaN/.test(l)), r.lines.join('\n'));
});

test('measure F17: a book at or over the quota gives "not computed", never a negative number', async () => {
  const r = await measureWith(tenant(), { bookBytes: 6000000 });
  assert.equal(r.code, 0);
  assert.equal(r.lines.at(-1), 'derived: months until the book fills: not computed (the book is already at or over the quota)');
});

test('measure F17: --book-bytes abc through the CLI is one FAIL line, exit 1, before any Gong call', async () => {
  const lines = []; let calls = 0;
  const code = await runCli(['--measure-transcripts', '--book-bytes', 'abc'], { config: { gong: GONG }, stateDir: mkdtempSync(join(tmpdir(), 'measure-')),
    out: (l) => lines.push(l), deps: { fetchImpl: async () => { calls++; return json(200, EXTENSIVE); }, sleep: async () => {} } });
  assert.equal(code, 1);
  assert.deepEqual(lines, ['FAIL measure: --book-bytes must be a number of bytes, 0 or more; who fixes it: Ian']);
  assert.equal(calls, 0);
});

test('measure F18: a call Gong returns no transcript for is counted apart and left out of the figures', async () => {
  const extra = { metaData: { id: 'FAKE-NO-TX', url: 'https://fake-tenant.gong.invalid/call?id=FAKE-NO-TX', title: 'FAKE call without transcript', started: '2026-09-25T15:00:00Z', duration: 600 },
    parties: [{ emailAddress: ME, name: 'Ian Fake', affiliation: 'Internal' }], content: {} };
  const r = await measureWith(tenant(TRANSCRIPTS, { ...EXTENSIVE, calls: [...EXTENSIVE.calls, extra] }));
  assert.equal(r.code, 0);
  assert.deepEqual(r.lines.slice(0, 4), [
    'measured: calls in the last 30 days: 11',
    'measured: calls with no transcript returned: 1 (left out of the figures below)',
    'measured: transcript characters per call: median 55, mean 55, 90th percentile 90, max 100',
    'derived: calls per week: 2.3 (calls with a transcript)',
  ]);
});
```

- [ ] **Step 2: Write the F24 docs test.** Append to `connector/test/docs.test.mjs`:

```js
// Follow-ups F-7 (F24): how a Basic key gets the transcript scope is not confirmed (same pattern as F5).
test('docs F24: the transcript scope is never stated as fact for the key (measure.mjs, CONNECT-GONG.md steps)', () => {
  const m = read(join(root, 'lib', 'measure.mjs'));
  for (const l of m.split('\n').filter((x) => /api:calls:read:transcript/.test(x))) assert.ok(/to confirm/.test(l), `measure.mjs states as fact: ${l}`);
  for (const l of read(RUNBOOKS[0]).split('\n')) {
    if (/## Vendor facts/.test(l)) break;
    if (/transcript scope|api:calls:read:transcript/.test(l)) assert.ok(/to confirm/.test(l), `unmarked: ${l}`);
  }
});
```

- [ ] **Step 3: Run; expect 6 to fail.**
  Run: `node --test connector/test/measure.test.mjs connector/test/docs.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-7-red.txt" 2>&1`.
  Expected: `tests 18`, `fail 6`: the 403 test (no "to confirm"), every-empty (`Infinity`), book-over-quota (a negative
  number), `abc` (a NaN line, and Gong is called), F18 (11 calls, no "no transcript" line, median pulled down), and
  docs F24 (`measure.mjs:24`, `CONNECT-GONG.md:49`). The wrong-adapter test passes at once: it pins `measure.mjs:19`.
  Prove it is not vacuous: change `'gong-rest'` at `measure.mjs:19` to `'gong-restx'`, see it fail, change it back.

- [ ] **Step 4: Implement F18** in `connector/adapters/gong-rest.mjs`, replacing `transcriptLengths` (`:106-120`):

```js
    async transcriptLengths({ since } = {}) {
      const ids = (await listCalls({ since })).map((c) => c.callId);
      if (!ids.length) return { calls: 0, lengths: [], noTranscript: 0 };
      const wanted = new Set(ids);
      // T-14 F18: only calls Gong returned a transcript for are measured. An id Gong did not return (not transcribed,
      // or left out) is counted apart, never as 0 characters, so it does not pull the median down.
      const lengths = new Map();
      await eachPage(TRANSCRIPT_PATH, { ...windowFor(since), callIds: ids }, {}, (page) => {
        for (const t of page.callTranscripts || []) {
          const id = String(t.callId);
          if (!wanted.has(id)) continue;
          let n = lengths.get(id) || 0;
          for (const mono of t.transcript || []) for (const s of mono.sentences || []) n += String(s.text || '').length;
          lengths.set(id, n);
        }
      });
      return { calls: ids.length, lengths: [...lengths.values()], noTranscript: ids.length - lengths.size };
    },
```

- [ ] **Step 5: Implement F17 and F24** in `connector/lib/measure.mjs`, replacing `runMeasure` (`:17-37`):

```js
const validBytes = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export async function runMeasure({ config = {}, stateDir, deps = {}, out = console.log, bookBytes = null, quotaBytes = 5000000, now = () => new Date() } = {}) {
  const cfg = config.gong || {};
  if (cfg.adapter !== 'gong-rest') { out('FAIL measure: gong.adapter is not "gong-rest"; run node connector/server.mjs --setup; who fixes it: Ian'); return 1; }
  // T-14 F17: a flag that is not a byte count stops here, before any Gong call (Number('abc') is NaN).
  for (const [flag, v] of [['--book-bytes', bookBytes], ['--quota-bytes', quotaBytes]]) {
    if (v !== null && !validBytes(v)) { out(`FAIL measure: ${flag} must be a number of bytes, 0 or more; who fixes it: Ian`); return 1; }
  }
  const gong = loadAdapters({ gong: cfg }, { ...deps, stateDir }).gong;
  const since = new Date(now().getTime() - DAYS * 86400000).toISOString();
  let r;
  try { r = await gong.transcriptLengths({ since }); }
  // F24: the transcript endpoint's scope is CONFIRMED for OAuth (research Q3); how a Basic key gets scopes is not (F5).
  catch (e) { out(`FAIL measure: ${e.message}; who fixes it: ${e.status === 403 ? 'Gong admin (the key may lack api:calls:read:transcript; how a key gets scopes is to confirm)' : 'Ian'}`); return 1; }
  out(`measured: calls in the last ${DAYS} days: ${r.calls}`);
  if (!r.calls) { out('derived: nothing to project (no calls in the window)'); return 0; }
  if (r.noTranscript) out(`measured: calls with no transcript returned: ${r.noTranscript} (left out of the figures below)`);
  const st = stats(r.lengths);
  if (!st.count) { out('derived: nothing to project (no transcripts returned)'); return 0; }
  out(`measured: transcript characters per call: median ${fmt(st.median)}, mean ${fmt(Math.round(st.mean))}, 90th percentile ${fmt(st.p90)}, max ${fmt(st.max)}`);
  const perWeek = st.count / (DAYS / 7);
  out(`derived: calls per week: ${perWeek.toFixed(1)}${r.noTranscript ? ' (calls with a transcript)' : ''}`);
  out(`assumption: localStorage quota ${fmt(quotaBytes)} bytes (not measured; --quota-bytes to change); 1 character counted as 1 byte`);
  if (bookBytes == null) { out('derived: months until the book fills: not computed (pass --book-bytes <n>)'); return 0; }
  out(`measured: book size given: ${fmt(bookBytes)} bytes (--book-bytes)`);
  const notComputed = (why) => out(`derived: months until the book fills: not computed (${why})`);
  if (!(st.mean > 0)) { notComputed('every transcript returned is empty'); return 0; }
  if (bookBytes >= quotaBytes) { notComputed('the book is already at or over the quota'); return 0; }
  const months = (quotaBytes - bookBytes) / (perWeek * st.mean) / WEEKS_PER_MONTH;
  out(`derived: months until the book fills at this rate: ${months.toFixed(1)}`);
  return 0;
}
```

  With every call transcribed, `perWeek` (`st.count`) equals the old `r.calls` value, so the existing fixture test
  (`measure.test.mjs:39-51`, `2.3` calls per week) is unchanged.

- [ ] **Step 6: Docs in the same commit.** `connector/CONNECT-GONG.md:49`: replace "Needs the transcript scope on the
  key." with "May need the transcript scope on the key (how a key gets scopes: to confirm)." `connector/CONTRACT.md`,
  Transcripts (I-2) paragraph (`:259-263`), after "...the months until the book fills." add: "Calls Gong returns no
  transcript for are counted on their own line and left out of the figures. A `--book-bytes` or `--quota-bytes` that
  is not a number of bytes, 0 or more, is one `FAIL measure:` line (exit 1, nothing called); when every transcript is
  empty, or the book is already at or over the quota, the months line says `not computed` with the reason."

- [ ] **Step 7: Run the task check and the suite.**
  Run: `node --test connector/test/measure.test.mjs connector/test/docs.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-7-files.txt" 2>&1` → `tests 18`, `pass 18`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-7-all.txt" 2>&1` → `tests 164`, `pass 164`, `fail 0`
  (+7: six measure tests, docs F24).
  Run: `node tools/connector-demo.mjs > "$CLAUDE_JOB_DIR/tmp/F-7-demo.txt" 2>&1` → exit 0.

- [ ] **Step 8: Commit.**

```bash
git add connector/adapters/gong-rest.mjs connector/lib/measure.mjs connector/test/measure.test.mjs connector/test/docs.test.mjs connector/CONNECT-GONG.md connector/CONTRACT.md
git commit -m "F-7: measure validates flags, never prints Infinity/negative, counts calls without a transcript apart; 403 scope marked to confirm (T-14 F17, F18, F24)" -m "<attribution lines from the lead>"
```

---

### Task F-8 (build ONLY if Ian approves question 1): optional OAuth `state`, off by default

Closes: F10. **Builder: Sonnet.** Skip this task entirely if Ian answers "list only"; then F10 stays listed with his
decision in the ledger.

Research does not confirm Gainsight echoes `state` (research-vendor-apis.md:99-100 lists only `clientId`,
`redirectUri`, `scopes`; `state` is documented for Gong's OAuth, :62-67). So the parameter's **name** is config
(`gainsight.oauth.stateParam`, empty in `config.example.json`), and when it is empty nothing changes: no parameter is
sent and none is checked.

**Files:**
- Modify: `connector/adapters/gainsight-auth.mjs:27-34` (`authorizeUrl`), `:114-137` (`makeCallbackHandler`)
- Modify: `connector/lib/setup.mjs:70-75` (generate and pass the state)
- Modify: `connector/config.example.json:7` (add `"stateParam": ""` to `oauth`), `connector/CONNECT-GAINSIGHT.md` (config fill-in list), `connector/CONTRACT.md` (`/oauth/callback` paragraph: `grep -n "oauth/callback" connector/CONTRACT.md`)
- Test: `connector/test/gainsight-auth.test.mjs` (17 → 20)

**Interfaces:**
- Produces: `authorizeUrl(cfg, redirectUri, { state } = {})`; `makeCallbackHandler({ ..., expectedState = null })`.

- [ ] **Step 1: Write the tests** (append to `connector/test/gainsight-auth.test.mjs`):

```js
// Follow-ups F-8 (T-14 F10): optional state, off by default (Gainsight echoing state is UNCONFIRMED).
test('oauth F10: with oauth.stateParam empty the authorize URL has no state; when set it carries the given value', () => {
  const off = new URL(authorizeUrl(CFG, redirectUriFor(8787), { state: 'FAKE-STATE-1' }));
  assert.deepEqual([...off.searchParams.keys()], ['clientId', 'redirectUri', 'scopes']);
  const on = new URL(authorizeUrl({ ...CFG, oauth: { ...CFG.oauth, stateParam: 'state' } }, redirectUriFor(8787), { state: 'FAKE-STATE-1' }));
  assert.equal(on.searchParams.get('state'), 'FAKE-STATE-1');
});

test('oauth F10: with stateParam set, a wrong or missing state is 400, makes no token call, and the real redirect still works', async () => {
  let calls = 0;
  const cfg = { ...CFG, oauth: { ...CFG.oauth, stateParam: 'state' } };
  const h = makeCallbackHandler({ cfg, redirectUri: redirectUriFor(8787), expectedState: 'FAKE-STATE-1', tokensPath: tokensFile(), now: () => T0,
    fetchImpl: async () => { calls++; return json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }); } });
  assert.equal((await h(new URLSearchParams('code=FAKE-CODE-1&state=WRONG'))).status, 400);
  assert.equal((await h(new URLSearchParams('code=FAKE-CODE-1'))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await h(new URLSearchParams('code=FAKE-CODE-1&state=FAKE-STATE-1'))).status, 200);
  assert.equal(calls, 1);
});

test('oauth F10: with stateParam empty (the default) the callback ignores state exactly as before', async () => {
  let calls = 0;
  const h = makeCallbackHandler({ cfg: CFG, redirectUri: redirectUriFor(8787), expectedState: 'FAKE-STATE-1', tokensPath: tokensFile(), now: () => T0,
    fetchImpl: async () => { calls++; return json(200, { FAKE_at: 'FAKE-ACCESS-1', FAKE_rt: 'FAKE-REFRESH-1' }); } });
  assert.equal((await h(new URLSearchParams('code=FAKE-CODE-1&state=anything'))).status, 200);
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: Run; expect 2 to fail.**
  Run: `node --test connector/test/gainsight-auth.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-8-red.txt" 2>&1` → `tests 20`, `fail 2`
  (the URL has no `state`; the wrong state answers 200). The "off" test passes at once: it pins today's behaviour.

- [ ] **Step 3: Implement** in `connector/adapters/gainsight-auth.mjs`. `authorizeUrl`:

```js
export function authorizeUrl(cfg, redirectUri, { state } = {}) {
  const o = cfg.oauth || {};
  const u = new URL(trimUrl(cfg.appUrl) + AUTHORIZE_PATH);
  u.searchParams.set('clientId', o.clientId || '');
  u.searchParams.set('redirectUri', redirectUri);
  u.searchParams.set('scopes', o.scopes || '');
  // T-14 F10: UNCONFIRMED that Gainsight echoes a state parameter (research Q7 lists clientId, redirectUri, scopes),
  // so its name is config and empty by default; empty means none is sent or checked.
  if (o.stateParam && state) u.searchParams.set(o.stateParam, state);
  return u.href;
}
```

  `makeCallbackHandler`: add `expectedState = null` to its options, and after `if (!code) return { status: 400, ... }` (`:126`) insert:

```js
    const sp = cfg.oauth && cfg.oauth.stateParam;
    // Checked before `used = true`, so a forged redirect does not spend the one-shot callback.
    if (sp && expectedState && params.get(sp) !== expectedState) return { status: 400, text: 'The sign-in state did not match this setup. Return to the terminal.' };
```

  In `connector/lib/setup.mjs` (`crypto` is already imported at `:4`), before `out(authorizeUrl(...))` (`:72`) add
  `const state = crypto.randomBytes(16).toString('hex');`, change `:72` to `out(authorizeUrl(g, redirectUri, { state }));`
  and add `expectedState: state,` to the `makeCallbackHandler({...})` options at `:74`.

- [ ] **Step 4: Docs and example in the same commit.** `connector/config.example.json:7`: add `"stateParam": ""` to the
  `oauth` object (the `proof.test.mjs` "every other string empty" test then still passes). `connector/CONNECT-GAINSIGHT.md`,
  in the config fill-in list, add: "`gainsight.oauth.stateParam`: leave empty unless the admin confirms Gainsight
  returns a `state`-style parameter on the redirect (UNCONFIRMED); when set, `--setup` sends a random value under that
  name and the callback refuses a redirect without it." `connector/CONTRACT.md`, `/oauth/callback` paragraph: add the
  same rule in one sentence.

- [ ] **Step 5: Run the task check and the suite.**
  Run: `node --test connector/test/gainsight-auth.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-8-auth.txt" 2>&1` → `tests 20`, `pass 20`.
  Run: `node --test connector/test/*.test.mjs > "$CLAUDE_JOB_DIR/tmp/F-8-all.txt" 2>&1` → `tests 167`, `pass 167`, `fail 0`
  (+3: the three F10 tests). The setup tests that pass `state=s` in the callback (`setup.test.mjs:40-56`) must still pass
  (their config leaves `stateParam` unset).

- [ ] **Step 6: Commit.**

```bash
git add connector/adapters/gainsight-auth.mjs connector/lib/setup.mjs connector/config.example.json connector/test/gainsight-auth.test.mjs connector/CONNECT-GAINSIGHT.md connector/CONTRACT.md
git commit -m "F-8: optional gainsight.oauth.stateParam, off by default; unconfirmed that Gainsight echoes it (T-14 F10)" -m "<attribution lines from the lead>"
```

---

## After the last task (lead)

Re-measure the baseline on the branch head, outputs to `$CLAUDE_JOB_DIR/tmp/`, summary lines only:
`node --test connector/test/*.test.mjs` → 164/164 (167/167 with F-8);
`node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 475` → 475/475 (unchanged: no task edits the tracker);
`node tools/connector-e2e.mjs` → 7/7, exit 0; `node tools/connector-demo.mjs` → exit 0.
Then the final whole-branch review on the top model (`superpowers:requesting-code-review`).

## Findings recommended NOT to fix (for Ian)

| Id | Reason |
|---|---|
| F21 (health shows no flag for a locked production tenant) | The health strings are fixed by spec §3.2 (approved under CR6), and the tracker's D2 status line knows only `unproven` and `dry-run` (`osm-book-of-business-tracker-1.0.html:1869-1870`). A new `locked` flag would change §3.2 and need a tracker change to be seen; without that change it shows nothing. Each Send already fails with the unlock message, which names the step. If Ian wants it: connector flag + tracker line + self-check, one task (top model, touches D2). |
| F16 part: test for `config.json` mode `0o600` | Ian's laptop is Windows, where Node ignores POSIX modes. The test would have to be skipped there, and a skipped test proves nothing for this machine. The write already passes `{ mode: 0o600 }` (`state.mjs:19`). |
| F17 part: all callIds in one transcript request | No maximum is documented (review: extensive page has none; transcript page not checked). Chunking needs a batch size, which would be a guessed vendor constant, against the "never guess" rule. One user's 30-day window is small. Revisit if a live `--measure-transcripts` gets a 400 for size. |
| F9 "list only" note | Not a skip: F-2 fixes it, because the fix is three lines and shares F8's helper. Listed so the change of plan is visible. |
| F19, F12 | Out of scope per the session prompt (F19 by design, spec §3.4(1); F12 refuted). |

## Questions for Ian at plan approval

1. **F10 (OAuth `state`).** Research does not confirm Gainsight echoes `state`. Options: (a) build Task F-8:
   config `gainsight.oauth.stateParam`, empty by default, nothing sent or checked when empty, ready for when the admin
   confirms the parameter; +3 tests. (b) Leave F10 listed; no code. Recommendation: (a). It costs nothing when off,
   and the review recommended exactly this shape. It does nothing until someone confirms the name with the admin.
2. **F21.** Agree to leave it unfixed (reason above), or add a `locked` health flag plus a tracker status line?
   Doing that changes spec §3.2 and D2's display, so it is your call.
3. **Mixed-code duplicate (checker low).** This plan keeps "a `data.failures` entry holding `GS_TL_10_0107` alongside
   other codes counts as sent", and documents and pins it (Task F-4). The alternative is "failed". Your call; the
   recommendation is sent, because a resend of an existing ExternalId can never succeed.

## Self-review (plan writer, 2026-10-05)

- **Coverage:** F7 → F-3; F8, F9 → F-2; F10 → F-8 (conditional) + question 1; F11, F20 → F-5; F13, F14, F22 → F-4;
  F15, F16 → F-6 (mode test not built: listed); F17, F18, F24 → F-7 (callId batching: listed); F21 → listed + question 2;
  F23 → F-1; lock race, lock release on failed write → F-1; mixed-code duplicate → F-4 + question 3. F19, F12 out of scope.
- **Counts:** 140 + 4 + 2 + 1 + 5 + 2 + 3 + 7 = 164; + 3 (F-8) = 167. Per-file deltas: gainsight-auth +4 (F-1) +1
  (F-5) +3 (F-8); vendor-http new 2; proof +1; gainsight-read +2; gainsight-push +2; docs +1 (F-4) +1 (F-7); server +1;
  check +2; setup +1; measure +6.
- **Corrections made during self-review:** (1) the first draft gave `gainsight-auth.mjs` and `write-gate.mjs` line
  numbers from a combined listing of several files, so every one was off by 47 and 162 lines. They were re-measured
  with `grep -n` on each file and replaced (for example `takeLock` is `:57-71`, not `:104-118`). `cli.mjs:77` became `:40`
  the same way. (2) F-7 Step 3 first said `fail 5`. The correct red count is `fail 6`, with the wrong-adapter test
  passing at once.
- **Names used across tasks:** `loadProofSafe` (F-3 only); `takeLock`/`LOCK_FS`/`lockFs` (F-1 only);
  `transcriptLengths → { calls, lengths, noTranscript }` (F-7 only); `authorizeUrl(cfg, redirectUri, { state })` and
  `expectedState` (F-8 only). F-5 and F-8 both append to `gainsight-auth.test.mjs`. They do not conflict: F-8 runs after F-5.
- **No placeholders:** every code step has the code; `<attribution lines from the lead>` is filled in by the lead
  at dispatch, as the subagent rules say.
