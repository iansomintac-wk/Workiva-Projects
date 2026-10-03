# Connect Gong

The `gong-rest` adapter is tested on recorded-shape fixtures and is unproven until `--check` passes against our
Gong. Until then `/v1/health` reports `gong-rest (unproven)` and the tracker shows "Connector: UNPROVEN". Nothing
here writes to Gong: the adapter only reads calls. Transcripts stay off (CR4): `gong-rest` sends `transcript: ""`
until Ian chooses what to store (see `connector/CONTRACT.md`, "Transcripts (I-2)").

## Part 1: for the admin

You need to be a Gong Tech admin. About 10 minutes.

1. Create an API access key: Admin center > Settings > Ecosystem > API. Give it the scope
   `api:calls:read:extensive`. Add `api:calls:read:transcript` only if Ian will run `--measure-transcripts`.
2. Read these four things out to Ian, in person or on a call. Do not send the secret by email or chat:
   - the API base URL for our company (it is different for each customer),
   - the access key,
   - the access key secret,
   - the scopes the key carries.
3. A key expiry and an IP allowlist are optional. Whether the key page offers them was not re-confirmed on
   2026-10-02. If it does, tell Ian the expiry date, or the connector stops working that day.

The connector reads calls and nothing else. It never writes to Gong.

## Part 2: for Ian

1. Run `node connector/server.mjs --setup`. Answer `y` for Gong and `n` for Gainsight (or do both). It asks for the
   base URL, the key, the secret (not shown) and your Gong email, then writes `connector/config.json` (git-ignored)
   and runs `--check`.
2. Run `node connector/server.mjs --check` any time. A pass records a read proof in `connector/proof.json`, and
   `/v1/health` then drops `unproven` from `gong-rest`. Each line is `PASS`, `SKIP` or
   `FAIL <step>: <what to fix>; who fixes it: <who>`. Secrets are never printed.

| FAIL line | Meaning | Who fixes it |
|---|---|---|
| `gong config` | `gong.baseUrl`, `accessKey`, `accessKeySecret` or `myEmail` is missing | Ian: run `--setup` |
| `gong auth` | Gong answered 401: the key or secret is wrong, or the key was deleted or expired | Gong admin: issue a new key |
| `gong scope` | Gong answered 403: the key cannot read call details | Gong admin: add `api:calls:read:extensive` |
| `gong read` | any other failure (wrong base URL, network, a reply the adapter cannot read) | Ian: check `gong.baseUrl` and the network |

3. Transcript sizes (optional, read-only, stores nothing): `node connector/server.mjs --measure-transcripts
   --book-bytes <n>`. `<n>` is the size of your tracker's saved book in bytes, which you read from the
   tracker or from its exported backup file (if you use the file size, it is a proxy; say so). Needs the transcript scope on the key. Each printed figure is labelled
   measured, derived or assumption. Without `--book-bytes` it skips the months-until-full line.

## Vendor facts

Sources are the vendor's own pages as read in `docs/superpowers/evidence/connect-ready/research-vendor-apis.md`
(2026-10-02). "To confirm with admin" means not read on a vendor page.

- Base URL is per customer, taken from the admin's API page. CONFIRMED: https://help.gong.io/apidocs/introduction-2.md
- The `https://company-NN.api.gong.io` pattern for that base URL is to confirm with admin.
- Auth is `Authorization: Basic base64(accessKey:accessKeySecret)`, key created by a Tech admin. CONFIRMED: https://help.gong.io/apidocs/introduction-2.md
- `POST /v2/calls/extensive` lists and enriches calls, with cursor paging. CONFIRMED: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md
- `GET /v2/calls` needs both `fromDateTime` and `toDateTime`. CONFIRMED: https://help.gong.io/apidocs/retrieve-call-data-by-date-range-v2calls-2.md
- `filter.primaryUserIds` limits to calls the user hosted, so participant filtering happens on the laptop. CONFIRMED: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md
- Party `affiliation` is Internal, External or Unknown (mapped to internal, customer, unknown). CONFIRMED: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md
- The key name and type of Gong's AI brief (`content.brief`) inside a real reply: to confirm with admin (`--check` records the shape it sees).
- Rate limit is 3 calls a second and 10,000 a day, 429 with `Retry-After` above that. CONFIRMED: https://help.gong.io/apidocs/introduction-2.md
- `POST /v2/calls/transcript` and its scope `api:calls:read:transcript`. CONFIRMED: https://help.gong.io/apidocs/retrieve-transcripts-of-calls-by-date-or-callids-v2callstranscript-2.md
- A Gong sandbox exists (free, empty). CONFIRMED: https://help.gong.io/docs/faqs-sandbox
- Whether that sandbox has API access: to confirm with admin.
- How scopes are chosen for a Basic key, and key expiry and IP allowlist: to confirm with admin.
