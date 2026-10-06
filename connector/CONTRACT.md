# Connector contract v1

## Purpose

The tracker talks to one HTTP+JSON contract, never to an adapter. Whatever sits behind the contract
(fake data, a Gong or Gainsight REST adapter, a company-run service) can change without a tracker
change. IT may re-implement this contract, for example in Workato; the JSON Schemas in
`connector/schemas/` are the definition and `connector/test/fixtures.test.mjs` checks the fixtures
against them.

Everything in `connector/fixtures/` and in `demo-seed.js` is FAKE. Names are the demo book's; emails
end in `.invalid`; call URLs are `https://fake.gong.invalid/call/<id>`; ids are `GS-DEMO-001` to
`GS-DEMO-017`. No real customer, person or key appears anywhere in this directory.

## Transport, auth, CORS, bind

- Base URL `http://127.0.0.1:<port>` (default port 8787). The connector binds to 127.0.0.1 only.
- Every request except `OPTIONS` carries `Authorization: Bearer <token>`. Otherwise: 401 `{"error":"unauthorized"}`.
  The one exception is `GET /oauth/callback` while `--setup` is running (see below); it answers once, then 410.
- CORS: the connector answers for origin `null` (a `file://` page) and for `http://localhost:*` and
  `http://127.0.0.1:*`. `OPTIONS` preflights need no token.
- Origin `null` is broader than `file://`: every sandboxed iframe on any website also sends `Origin: null`. So the
  CORS rule is not the guard. **The bearer token is the only guard**, and the token must never be optional,
  empty, or skipped for any route, in this connector or in any re-implementation of this contract.
- The token lives in the tracker's browser storage (`obm-connector-settings-v1`) on the `file://` origin. Chrome gives
  every local HTML file the same origin, so any other local `.html` file opened in that browser can read the token
  (the browser AI key, `obm-ai-settings-v1`, is exposed the same way). It only opens a connector on 127.0.0.1 on this
  computer; treat it as a local credential, rotate it by deleting `token.txt`, and do not open untrusted HTML files in
  the browser profile that holds the tracker.
- Errors are always `{"error": "<message>"}` (`schemas/error.json`) with status 400 (bad request),
  401 (no or wrong token), 404 (unknown route), 413 (body over 1 MB) or 502 (an adapter failed).
  A failed `/v1/push` answers 502 with a fixed generic message, not the adapter's text (a real Gainsight adapter's error can
  carry tenant URLs or credentials); the detail goes to the connector's own console.
- Requests are JSON; responses are JSON.

## Calls

### `GET /v1/health`

No request body. Response (`schemas/health.json`); each adapter is `"fake"`, an AI provider name, or a real adapter name with a state suffix: `gong-rest (unproven)`, `gong-rest`, `gainsight-rest (unproven, dry-run)`, `gainsight-rest (unproven)`, `gainsight-rest (dry-run)`, `gainsight-rest`. `unproven` means no live `--check` has passed against the configured tenant (`connector/proof.json`). A real adapter is unproven until `--check`, whatever its tests say. `dry-run` means Gainsight push builds requests and sends nothing:

```json
{"version": "1", "adapters": {"gong": "fake", "gainsight": "fake", "ai": "fake"}}
```

### `GET /v1/calls?since=<ISO 8601>`

`since` is optional (missing = all calls); a call is included when `startedAt >= since`. Response
(`schemas/calls.json`):

```json
{"calls": [{
  "callId": "c-demo-001",
  "kind": "call",
  "url": "https://fake.gong.invalid/call/c-demo-001",
  "startedAt": "2026-09-08T14:00:00Z",
  "durationSec": 1620,
  "title": "Aldridge Energy: session check-in",
  "participants": [{"name": "Riley Demo", "email": "riley.demo@fake-osm.invalid", "affiliation": "internal"}],
  "accountRef": {"gainsightId": "GS-DEMO-001", "name": "Aldridge Energy"},
  "summary": "FAKE summary", "transcript": "FAKE transcript"
}]}
```

- `kind` is optional: `"call"` (default) or `"email"`. An `"email"` item is an Email-type touch and is
  never turned into a session by the tracker.
- `affiliation` is `internal`, `customer` or `unknown`.
- `accountRef` always exists; `gainsightId` and `name` may each be `null`. The tracker matches by
  `gainsightId`, then exact `name`, then by participant email against stakeholders.
- `gong-rest` (tested on recorded-shape fixtures, unproven until `--check`) lists Ian's
  calls through `POST /v2/calls/extensive`. It filters to calls where `gong.myEmail` is a participant (Gong's
  user filter matches the host only) and sends `accountRef` `{gainsightId:null, name:null}`.

### `GET /v1/accounts`

Response (`schemas/accounts.json`): `{"accounts": [...]}`, each account:

`gainsightId`, `name`, `tier`, `arr`, `renewalDate`, `csmOwner`, `contacts:[{name,email,role}]`,
`healthScore`, `gates:{readinessAssessment, csatContact, successPlan}` (booleans), `openCtas:[{ctaId, name, severity?}]`.
Fields other than ids and names may be `null`.

`gainsight-rest` (tested on recorded-shape fixtures, unproven until `--check`) reads Company through
`POST /v1/data/objects/query/Company`. Field names come from `gainsight.fieldMap`; an unmapped field is `null`. A gate
is `true` only when its `gainsight.gateFieldMap` field is exactly `true`. `contacts` come from `gainsight.contactQuery`
(empty when unset). `openCtas` is `[]`.

### `POST /v1/push`

Request (`schemas/push-request.json`): `{"items": [{"id", "kind", "customerRef":{"gainsightId","name"}, "fields":{...}}]}`.
`kind` is the tracker queue kind string, verbatim, and decides `fields`:

| kind | fields |
|---|---|
| `Pending items batch` | `{gates:[{gateKey, contractKey, gainsightAction}]}` |
| `Success Plan objective` | `{event:"created"\|"changed"\|"verdict", objective, goalType, targetCycle, verdict, changeReason}` |
| `At-Risk CTA` | `{ctaName, reason, severity}` |
| `Success Outcome Plan` | `{outcomes:[string]}` |

`fields` allows unknown keys, so the tracker can add a field without a contract bump. Response
(`schemas/push-response.json`): `{"results": [{"id", "status":"sent"|"failed", "externalId", "error"}]}`,
one result per item, `externalId` and `error` `null` when not applicable.

```json
{"results": [{"id": "q1", "status": "sent", "externalId": "FAKE-q1", "error": null}]}
```

`gainsight-rest` push (tested on recorded-shape fixtures, unproven until `--check`):
- Kinds: `Pending items batch` and `Success Outcome Plan` become a Timeline activity (D1,
  `POST /v1/ant/es/activity`) with `ExternalId` = item id. `At-Risk CTA` becomes `POST /v2/cockpit/cta`.
  `Success Plan objective` is not sent (blocker B1, ruled (a)): it answers `failed` with "not sent: Success Plan
  objectives are not built yet (adding an objective to an existing Success Plan is unconfirmed in Gainsight's docs);
  update it by hand in Gainsight" and stays queued. The optional `fields.subjectPrefix` is prepended to the Timeline
  Subject and the CTA Name. Config: `gainsight.authorEmail`, `gainsight.timeline.typeName`, `gainsight.cta.{type, companyIdField, idPath}`.
- Dry-run is on by default (`gainsight.dryRun`): requests go to `dry-run.jsonl` with credentials redacted, and each
  item answers `failed` with `dry run: not sent; see connector/dry-run.jsonl`.
- Saved send record: `sent-record.json` keeps item id to `{externalId, kind, tenant, at}`. A repeated id for the same
  tenant answers `sent` with no call, and a `failed` id is not stored. A duplicate-ExternalId rejection
  (`GS_TL_10_0107`) counts as already sent, whether it comes as an HTTP error or as an HTTP 200 whose
  `data.failures` entry for the item holds exactly that code (where the code sits is UNCONFIRMED). Any other Timeline
  reply that lists the item in `data.failures`, or has no `activityId` for it in `data.success`, answers `failed`
  and is not stored. Crash window: the record is written after
  the vendor reply, so a crash between the two leaves no record. A Timeline repeat is then recovered by the duplicate
  error code; a CTA repeat may double-send (referenceId duplicate behaviour is UNCONFIRMED, research Q14 and gap 5).
  A CTA sent with no readable id (`gainsight.cta.idPath` unset) is recorded with `externalId: null`.

**Idempotent by `items[].id` (R3, I-5).** The tracker times out a push after 15 s and cannot know whether the
connector sent it, so it tells the user the outcome is unknown and the user may press Send again with the
same ids. An adapter must therefore treat a repeated item id as the same item: answer `sent` with the same
`externalId` and do not create a second record in Gainsight. A `failed` id is not remembered; retrying it is a
real attempt. The fake adapter does this (a repeated id is not logged again).

### `POST /v1/ai`

Request (`schemas/ai-request.json`): `{"task", "prompt", "maxTokens"}`. Response (`schemas/ai-response.json`): `{"text", "truncated"?}`. `truncated` is an optional boolean (additive, v1): `true` when the provider stopped at the length cap (Claude `stop_reason` `max_tokens`, OpenAI `finish_reason` `length`, Gemini `finishReason` `MAX_TOKENS`); the server always sends it, and the fake sends `false`. The tracker shows its length-cap notice from it.
`task` is one of `copilot_read`, `call_prep`, `debrief`, `debrief_scores`, `call_review`, `risk_summary`,
`thread_answer`, `brief_my_day`. Provider keys live only in the connector's git-ignored config, never
in the browser. The route is built (task B3). A request that fails the schema is 400; an adapter error is
502 `{error}` carrying the provider's message with the key scrubbed out. Any `apiKey` field in a request body
is ignored.

Adapters (`ai.adapter` in config): `fake` (default), `claude`, `openai`, `gemini`. Nothing else exists (R1:
only a sanctioned provider); any other name makes the connector refuse to start (`adapter not built: <name>`).
Config: `"ai": {"adapter": "fake", "model": "", "apiKey": ""}`. The key lives only in the git-ignored
`connector/config.json` (or env `CONNECTOR_AI_KEY`); `config.example.json` ships with no key and `fake`.
An empty `model` takes the tracker's defaults: `claude-sonnet-5`, `gpt-5.4-mini`, `gemini-2.5-flash`.
Endpoints are the tracker's own: Anthropic Messages (`x-api-key`), OpenAI Chat Completions (bearer),
Gemini `generateContent` (`x-goog-api-key` header, never in the URL). The browser-only Anthropic header is
dropped. `fake` returns `FAKE AI (<task>): <first 80 chars of prompt>`, except `brief_my_day`, which returns
JSON with one fake account per `[id:<id>]` in the prompt. The real adapters are tested only against a stubbed
fetch; no real call has been made.

### `GET /oauth/callback` (setup only)

It exists only while `--setup` waits for Gainsight's redirect. It takes no bearer token, exchanges the code once,
saves the raw token reply to `gainsight-tokens.json`, and then answers 410. Outside setup the path is 401 like any
other. Redirect URI to register: `http://127.0.0.1:<port>/oauth/callback`. The query name that carries the code, and
the token reply's access and refresh field names, are not in the vendor research, so they are config
(`gainsight.oauth.callbackCodeParam`, `accessTokenField`, `refreshTokenField`, empty by default). While one is unset,
the connector reports only the key names it received, never their values.

## Running it

`node connector/server.mjs` loads `connector/config.json` (else `config.example.json`), loads or creates
`connector/token.txt` (a 32-byte hex token, written once, git-ignored; delete the file to rotate), listens
on `127.0.0.1:<config.port, default 8787>` and prints `connector listening http://127.0.0.1:<port>` and
`token <hex>`. Paste the token into the tracker once. `config.host`, if set to anything but 127.0.0.1, is
ignored with a printed warning. Environment overrides (used by the tests): `CONNECTOR_CONFIG`,
`CONNECTOR_TOKEN_FILE`, `CONNECTOR_LOG`. The fake Gainsight push appends each item to
`connector/fake-gainsight-log.jsonl` (git-ignored) and returns `FAKE-<id>`; an item whose
`fields.forceFail` is `true` returns `status:"failed"`, `error:"fake failure (forceFail)"`.

Behaviour details: auth is checked before routing, so any path without a valid token gets 401; CORS
headers are echoed only for an allowed origin and appear on every response (401 included) so the page can
read it; `since` that is not an ISO 8601 date-time is 400; a non-JSON or schema-invalid push body is 400
with the validator's messages; every response is validated against its schema before sending and a
failure is a 500; an adapter that throws is a 502.

`node connector/server.mjs --unlock-production` (gainsight-rest, `environment: "production"` only) prints the
configured production tenant and whether a sandbox write proof exists, asks for the tenant URL to be typed back, and
on a match records the unlock in `proof.json`. A mismatch, an empty `appUrl` or an unreadable `proof.json` prints a
`FAIL unlock:` line, changes nothing and exits 1. Any other argument starts the server as before.

`node connector/server.mjs --check` is read-only. It prints one line per step: `PASS <step>[: detail]`,
`FAIL <step>: <what to fix>; who fixes it: <who>`, or `SKIP <step>: <why>`, and exits 1 if any step FAILs, else 0. With
no real adapter configured (the example config) every line is `SKIP` and nothing is recorded. For `gong-rest` it
checks config, auth and one 24-hour read. Gong answers an empty window with a 404 "No calls found for the specified
period" (CONFIRMED on its docs page, 2026-10-03); that exact reply (404, JSON body, `errors` naming it) is treated as an
empty page everywhere (tracker pull, `--check`, `--measure-transcripts`), and `--check` then passes with `0 call(s)` and
records the proof with `shapes.noCalls404`. Any other 404 still FAILs. A 2xx reply that is not a call list (`calls` not an
array: HTML, `{}`) is `FAIL gong read: the reply is not a Gong call list` and records no proof. For `gainsight-rest`, config, OAuth token, a `Company` read and a probe of
each mapped `fieldMap` / `gateFieldMap` field and `contactQuery` (unmapped ones are `SKIP`). A passing read records a
read proof in `proof.json` (tied to the tenant), which is what drops `unproven` from `/v1/health`. Secrets are never
printed.

`node connector/server.mjs --check --write` adds a write self-test, **sandbox only** (a production tenant prints
`FAIL gainsight write: --check --write runs only against a sandbox` and writes nothing). It sends through the normal
push path, so the write gate applies. It creates one record per buildable kind (Pending items batch, Success Outcome
Plan, At-Risk CTA), each labelled `[SBX] TEST-<date>` and left in the sandbox (D4). `Success Plan objective` is `SKIP`
(blocker B1). The read-back is `SKIP gainsight write read-back: no read endpoint is confirmed (research Q10, Q12); open
the sandbox and look for the [SBX] TEST records` (blocker B2): the write proof is recorded from each create reply, not
from a read. All of this is tested on recorded-shape fixtures and is unproven against a real tenant until run.

`node connector/server.mjs --measure-transcripts [--book-bytes <n>] [--quota-bytes <n>]` is read-only and prints
labelled transcript-size figures (see "Transcripts (I-2)"). With a `gong` adapter other than `gong-rest` it prints one
`FAIL measure:` line and exits 1.

`node connector/server.mjs --setup` asks one question at a time; Gong and Gainsight can each be skipped (answer `n`).
Secret answers (Gong access key secret, OAuth client secret) are not echoed and never printed. It writes
`CONNECTOR_CONFIG` (default `connector/config.json`, git-ignored; never point it at `config.example.json`); if that path does not exist yet, `--setup` starts from `config.example.json` and creates it (the plain server instead prints one `config file not found` line and exits 1). For
Gainsight it prints the authorize URL, then listens once on `127.0.0.1:<port>/oauth/callback` (up to 10 minutes) and
exchanges the code (if the port is taken it prints one `FAIL gainsight oauth: callback port <n> in use` line and exits 1), saving the token reply to `gainsight-tokens.json`. Then it runs `--check`. If
`gainsight.oauth.callbackCodeParam` is unset it prints only the query names Gainsight sent back and stops; if
`accessTokenField` / `refreshTokenField` are unset it prints only the key names of the token reply, never values, and
stops (the admin or Ian sets the names in config; nothing is guessed). Tested with scripted answers and a stubbed fetch;
unproven against a real tenant until `--check` passes.

## Write gate (gainsight-rest)

A non-dry-run push (`dryRun: false`; dry-run is the default) is allowed only for a sandbox tenant
(`environment: "sandbox"`), or for production after `--unlock-production`. The unlock needs the tenant URL typed back
in both §3.4 paths (with a sandbox write proof, or with no sandbox), is recorded against that tenant
(`gainsight.unlock = {tenant, at, basis: "sandbox-proof" | "no-sandbox", sandboxProofAt, firstSendDone}`), and is void
when the configured tenant changes. The first production push after unlock sends 1 item; the rest answer `failed`
with `first live send is 1 item; check it in Gainsight, then Send again`. The limit lifts once that item is `sent`
(a failed first item keeps it). Every other case answers `failed` with the missing step: no `environment` set names
`--setup`; production with no matching unlock names `--check --write` and `--unlock-production`; a `proof.json` that
cannot be read blocks production writes. Nothing is sent in any of these cases.
## Offline rule

If the connector is unset or unreachable, the tracker behaves exactly as it does today plus one quiet
"connector offline" status line. No core-loop feature depends on the connector.

## Versioning

`version` is `"1"`. Within v1, changes are additive only: new optional response fields, new
`fields` keys, new `task` values only with a version note here. A breaking change means `"2"`.
v1 additions beyond the original design: the optional call `kind` field.
Adapter state suffixes in `/v1/health` (connect-ready, 2026-10-02): string values only, no shape change.

## Local state files (git-ignored)

- `proof.json`: per adapter, `state`, `provenAt`, `tenant` and the observed `shapes`. Gainsight has separate
  `read` and `write` proofs plus `unlock`. A proof is void when the configured tenant differs. A `proof.json` that
  cannot be read counts as no proof in `/v1/health` (the adapter shows `unproven`); production writes stay blocked
  until it is fixed or deleted.
- `CONNECTOR_STATE_DIR` overrides the folder (used by the tests).
- `gainsight-tokens.json`: `{raw, obtainedAt}`. Refresh tokens are single-use. The new one is written before the new
  access token is used, and a failed write stops the request. A refresh holds `gainsight-tokens.json.lock`
  (exclusive create) so two processes never spend the same refresh token; after taking it the file is re-read and a
  token another process already rotated is used without a refresh. A waiter gives up after 65 s with an error naming
  the lock; a lock older than 60 s (twice the 30 s call timeout) is a dead holder's and is taken over. Only one waiter
  at a time may remove a stale lock: it first creates `gainsight-tokens.json.takeover.lock` and checks the age again,
  so a fresh lock is never removed. An `obtainedAt` that is not a date counts as expired.
- `sent-record.json`: `{ "<itemId>": {externalId, kind, tenant, at} }`, written atomically after each real send. A repeated
  id for the same tenant answers `sent` with no call; a `failed` id is not stored.
- `dry-run.jsonl`: one JSON line per item that dry-run would have sent (`at`, `itemId`, `kind`, `method`, `url`, `headers`
  with `Authorization` as `Bearer [redacted]`, `body`). Appended; never holds a credential.

## Transcripts (I-2)

Ruled by Ian 2026-10-02 (I-2, kept by CR4): `gong-rest` sends `transcript: ""` for every call until Ian chooses between
storing link + summary only and capping transcripts. The fake adapter still serves fixture transcripts. Real
transcript sizes are not measured yet. `node connector/server.mjs
--measure-transcripts [--book-bytes <n>] [--quota-bytes <n>]` (read-only, stores nothing, prints no transcript text)
prints Ian's call count for the last 30 days, the median, mean, p90 and max transcript characters, calls per week, and
the months until the book fills. Each figure is labelled measured, derived or assumption. Tested on recorded-shape
fixtures; unproven until `--check` has passed.

## Validator subset

`connector/lib/validate.mjs` is a zero-dependency JSON Schema subset validator. It supports `type`
(including arrays of types, `"null"` and `"integer"`), `required`, `properties`, `additionalProperties`
(boolean), `items`, `enum`, `minLength`, `minimum` and `format: "date-time"`. Every other keyword is
ignored, including `$schema`, `title`, `description`, `$ref`, `oneOf`, `pattern` and `maxLength`.
