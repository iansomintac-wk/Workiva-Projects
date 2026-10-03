# Connect Gainsight

The `gainsight-rest` adapter is tested on recorded-shape fixtures and is unproven until `--check` passes against
our tenant. Until then `/v1/health` reports `gainsight-rest (unproven, dry-run)` and the tracker shows
"Connector: UNPROVEN". Dry-run is the default: a Send builds each request and writes it to `dry-run.jsonl`, and
nothing reaches Gainsight. A real send is allowed only to a sandbox tenant, or to production after
`--unlock-production`, and the first production send is 1 item (write gate, spec §3.4).

## Part 1: for the admin

You need to be a Gainsight Super Admin. This is the longer of the two asks; about 30 minutes.

1. Create an OAuth app: Administration > User Management > Authentication > OAuth Applications (an org can have at
   most 3). Scope Read/Write.
2. Register this redirect URI on the app: `http://127.0.0.1:8787/oauth/callback`
3. Read these out to Ian (the secret out loud, never by email or chat): the tenant URL; the API base URL; the tenant
   id; whether this tenant is a sandbox or production; the OAuth client id and client secret; the scopes string
   exactly as the app shows it.
4. Read out the API names of the tenant fields for each `gainsight.fieldMap` key (tier, ARR, renewal date, CSM owner,
   health score) and each `gainsight.gateFieldMap` key (readinessAssessment, csatContact, successPlan). A gate is
   offered only when its field is exactly `true`.
5. Read out the Company Person object name and its fields for company, name, email and role (for `contactQuery`).
6. Read out the Timeline activity type name, the CTA type name and the CTA company id field.
7. Answer the open questions:
   - What field names does the token reply use for the access token and the refresh token, and which query name
     carries the code on the redirect? (Or let `--setup` print the names it received; it never prints values.)
   - B1: what is the endpoint for adding or updating one objective on an existing Success Plan? Only creating a
     new plan together with its objectives is confirmed. Until this is answered, `Success Plan objective` items are
     not sent: they answer `failed` with "not sent: Success Plan objectives are not built yet" and stay in the queue.
   - B2: is there an endpoint that reads one Timeline activity or one CTA back? None is confirmed (B2 read-back).
   - Does a sandbox tenant exist, and what is its URL?
   - Is an OAuth bearer token accepted on every endpoint the connector uses?

## Part 2: for Ian

1. Run `node connector/server.mjs --setup`. Answer `n` for Gong (or do both). It asks one value at a time, writes
   `connector/config.json` (git-ignored), prints an authorize address, waits up to 10 minutes while you sign in to
   Gainsight in the browser, saves the token reply to `gainsight-tokens.json` and then runs `--check`. Two messages
   mean a config key is still empty, and nothing is guessed:
   - "redirected back with these query names": set `gainsight.oauth.callbackCodeParam` to the one that carries the
     code, then run `--setup` again.
   - "answered with these field names": set `gainsight.oauth.accessTokenField` and `refreshTokenField` to the two
     that hold the tokens, then run `--check`.
   Also fill the empty `fieldMap`, `gateFieldMap`, `contactQuery`, `timeline.typeName` and `cta` keys in
   `config.json` with the names from the admin (see `connector/config.example.json`).
2. Run `node connector/server.mjs --check` (read-only). A pass records a read proof in `proof.json`.

| FAIL line | Meaning | Who fixes it |
|---|---|---|
| `gainsight config` | a required config value is missing, or `environment` is not `sandbox` or `production` | Ian: run `--setup` |
| `gainsight auth` | no usable token | Ian: run `--setup` again |
| `gainsight read` | the Company read failed | Gainsight admin if 401/403 (app scope, or bearer not accepted on this API); else Ian |
| `gainsight fieldMap.<key>` | the tenant rejected that field name | Gainsight admin: give the field's API name |
| `gainsight gateFieldMap.<key>` | the tenant rejected that field name | Gainsight admin: give the field's API name |
| `gainsight contactQuery` | the tenant rejected the object or fields | Gainsight admin |
| `gainsight write` (and `gainsight write <kind>`) | `--check --write` was run against production, no sandbox Company exists, or a create failed | Ian, with the Gainsight admin |

3. Sandbox write test: `node connector/server.mjs --check --write` (sandbox tenants only). It creates one record per
   kind, each labelled `[SBX] TEST-<date>`, and leaves them in the sandbox. Two lines are always `SKIP`:
   `Success Plan objective` (B1) and `SKIP gainsight write read-back: no read endpoint is confirmed (research Q10, Q12); open the sandbox and look for the [SBX] TEST records`
   (B2). So the write proof comes from each create reply, and you confirm it by looking in the sandbox for the
   `[SBX] TEST` records.
4. For production: run `node connector/server.mjs --unlock-production` and type the tenant URL back when asked. Then
   set `gainsight.dryRun` to `false` in `config.json`. The first Send is 1 item; check it in Gainsight, then Send
   again. The unlock is void if the configured tenant changes.
5. State files, all in `connector/` and all git-ignored: `dry-run.jsonl` (what dry-run would have sent, with the
   token shown as `Bearer [redacted]`), `sent-record.json` (what has really been sent, so a repeat is never sent
   twice), `gainsight-tokens.json`, `proof.json`.

## Vendor facts

Sources are the vendor's own pages as read in `docs/superpowers/evidence/connect-ready/research-vendor-apis.md`
(Q7-Q14) and `research-write-safety.md` (2026-10-02). "To confirm with admin" means not read on a vendor page.

- OAuth authorize is `<application-url>/v1/authorize` and the code exchange is `POST /v1/users/oauth/access/token`. CONFIRMED: https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs
- Access token lasts 3600 s; the refresh token lasts 365 days, is single-use and rotates on every refresh. CONFIRMED: https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs
  Because of that, a refresh takes `connector/gainsight-tokens.json.lock` first, so the running connector and a
  `--check` in another terminal never both spend one refresh token. If a run stops with "Another connector process is
  refreshing the Gainsight token", retry in a minute; delete the lock file only if no other connector or `--check` is
  running (a lock older than 60 s is taken over on its own).
- The refresh request body (`grantType`, `refreshToken`): to confirm with admin.
- Company query is `POST /v1/data/objects/query/Company`, at most 5,000 records per call. CONFIRMED: https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Company_and_Relationship_API/Company_API_Documentation
- Whether the query reply is `data` or `data.records`: to confirm with admin.
- Timeline activity create is `POST v1/ant/es/activity`, with `ExternalId` as the idempotency key. CONFIRMED: https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs
- A repeated `ExternalId` in a later request is rejected with `GS_TL_10_0107`. CONFIRMED: https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs
  Whether that code comes as an HTTP error or inside a 200's `data.failures`: to confirm with admin. The connector
  treats either as already sent, matching the exact code only.
- CTA create is `POST /v2/cockpit/cta` and update is `PUT /v2/cockpit/cta`. CONFIRMED: https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Cockpit_API/Call_To_Action_(CTA)_API_Documentation
- Success Plan create with objectives is `POST v2/successPlan?withObjectives=true`. CONFIRMED: https://support.gainsight.com/gainsight_nxt/Success_Plans/Success_Plan_API_Documentation/Success_Plan_APIs
- Adding or updating one objective on an existing Success Plan (B1): endpoint to confirm with admin.
- A read endpoint for one Timeline activity or one CTA (B2): to confirm with admin.
- Whether a bearer token is accepted on every endpoint used (v1/data, v1/ant/es, v2/cockpit, v2/successPlan): to confirm with admin.
- Synchronous API limit is 100 calls a minute and 100,000 a day; the connector plans for 100 a minute. CONFIRMED: https://support.gainsight.com/Gainsight_NXT/Administration_and_Permissions/General_Administration/Gainsight_System_Limits
- Whether a sandbox tenant exists, and its URL: to confirm with admin.
