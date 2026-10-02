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
- CORS: the connector answers for origin `null` (a `file://` page) and for `http://localhost:*` and
  `http://127.0.0.1:*`. `OPTIONS` preflights need no token.
- Errors are always `{"error": "<message>"}` (`schemas/error.json`) with status 400 (bad request),
  401 (no or wrong token), 404 (unknown route), 413 (body over 1 MB) or 502 (an adapter failed).
- Requests are JSON; responses are JSON.

## Calls

### `GET /v1/health`

No request body. Response (`schemas/health.json`); each adapter is `"fake"` or a provider name:

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

### `GET /v1/accounts`

Response (`schemas/accounts.json`): `{"accounts": [...]}`, each account:

`gainsightId`, `name`, `tier`, `arr`, `renewalDate`, `csmOwner`, `contacts:[{name,email,role}]`,
`healthScore`, `gates:{readinessAssessment, csatContact, successPlan}` (booleans), `openCtas:[{ctaId, name, severity?}]`.
Fields other than ids and names may be `null`.

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

### `POST /v1/ai`

Request (`schemas/ai-request.json`): `{"task", "prompt", "maxTokens"}`. Response (`schemas/ai-response.json`): `{"text"}`.
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

## Validator subset

`connector/lib/validate.mjs` is a zero-dependency JSON Schema subset validator. It supports `type`
(including arrays of types, `"null"` and `"integer"`), `required`, `properties`, `additionalProperties`
(boolean), `items`, `enum`, `minLength`, `minimum` and `format: "date-time"`. Every other keyword is
ignored, including `$schema`, `title`, `description`, `$ref`, `oneOf`, `pattern` and `maxLength`.
