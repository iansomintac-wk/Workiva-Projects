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
  (`GS_TL_10_0107`) counts as already sent.

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
  `read` and `write` proofs plus `unlock`. A proof is void when the configured tenant differs.
- `CONNECTOR_STATE_DIR` overrides the folder (used by the tests).
- `gainsight-tokens.json`: `{raw, obtainedAt}`. Refresh tokens are single-use. The new one is written before the new
  access token is used, and a failed write stops the request.
- `sent-record.json`: `{ "<itemId>": {externalId, kind, tenant, at} }`, written atomically after each real send. A repeated
  id for the same tenant answers `sent` with no call; a `failed` id is not stored.
- `dry-run.jsonl`: one JSON line per item that dry-run would have sent (`at`, `itemId`, `kind`, `method`, `url`, `headers`
  with `Authorization` as `Bearer [redacted]`, `body`). Appended; never holds a credential.

## Transcripts (I-2)

Ruled by Ian 2026-10-02 (I-2, kept by CR4): `gong-rest` sends `transcript: ""` for every call until Ian chooses between
storing link + summary only and capping transcripts. The fake adapter still serves fixture transcripts. Real
transcript sizes are not measured yet.

## Validator subset

`connector/lib/validate.mjs` is a zero-dependency JSON Schema subset validator. It supports `type`
(including arrays of types, `"null"` and `"integer"`), `required`, `properties`, `additionalProperties`
(boolean), `items`, `enum`, `minLength`, `minimum` and `format: "date-time"`. Every other keyword is
ignored, including `$schema`, `title`, `description`, `$ref`, `oneOf`, `pattern` and `maxLength`.
