# Access request: Gong, Gainsight and an AI key for the OSM tracker connector

DRAFT, 2026-10-01. Nothing here has been sent to anyone. Ian reviews it first.

I keep my book of business in a single-file tracker that runs in my browser. A small Node program, the
connector, would run on my laptop between the tracker and three services: Gong (read calls), Gainsight
(read accounts, write updates) and one approved AI provider. Today the connector runs on fake data
only. To connect it to the real services I need the access below.

"Confirmed" means the research read it on the vendor's own documentation on 2026-10-01. **To confirm
with admin** means the research saw it only in search snippets or third-party pages, or did not find it.

## 1. Gong (needs a Gong Tech admin)

- Credential: an API access key and secret, or an OAuth app. Only a Tech admin can create either
  (confirmed). Keys are created under Admin Center > Settings > API, with an optional expiry and an IP
  allowlist (confirmed).
- Transcripts: scope `api:calls:read:transcript`, for `POST /v2/calls/transcript` (confirmed).
- Gong's AI call briefs: scope `api:calls:read:extensive`, for `POST /v2/calls/extensive`. **To confirm
  with admin:** the research saw this only in search snippets.
- Listing calls (`GET /v2/calls`) and the scope it needs: **to confirm with admin.**
- My calls only: the key covers the whole company, and the research found no documented way to limit it
  to one user. The connector would filter by participant on my laptop. Whether Gong offers a narrower
  option is **to confirm with admin.**
- Rate limit: 3 calls a second and 10,000 a day, shared by the whole company (confirmed). The tracker
  is designed to ask for calls only when I click "Check for calls". That part is not built yet.

## 2. Gainsight CS (needs a Super Admin)

- Credential: an OAuth app with Read/Write scope (Authorization Code flow). Only a Super Admin can
  create one, and an org can have at most 3 (confirmed). The app can do no more than the narrower of its
  own scope and my user permissions (confirmed). The other route is the org's single AccessKey, which
  never expires and is shared by the whole org (confirmed). I am asking for the OAuth app, not the
  AccessKey.
- Reads: Company (confirmed, `POST /v1/data/objects/query/Company`) and Person (the API is listed; its
  endpoint is **to confirm with admin**).
- Writes:
  - Timeline activities (confirmed, `POST v1/ant/es/activity`).
  - Success Plans and their objectives (confirmed, `v2/successPlan` create and update).
  - CTAs. The CTA API page exists, but the research saw the create and update endpoints only in search
    snippets: **to confirm with admin.**
- A sandbox tenant, if we have one (**to confirm with admin**). Every write would run against the
  sandbox before production.

## 3. IT

- Where it runs: on my laptop only. The connector listens on 127.0.0.1, so other machines cannot reach
  it, and it ignores any other bind address in its config. Every request must carry a random
  64-character token that the connector creates on first start and keeps in a local file. It is plain
  Node with no third-party packages.
- Local exposure to be aware of: the tracker keeps the connector token (and the browser AI key, if one is
  saved) in the browser's `file://` local storage. Chrome lets every local HTML file read it, and a sandboxed
  iframe on any website sends `Origin: null`, which the connector accepts, so the token is the only guard.
  The token opens only a connector on 127.0.0.1 of this laptop, and it is rotated by deleting its file.
  The plan to move the AI key into the connector removes the browser-key half of this exposure.
- Where data goes: from Gong and Gainsight to the connector, then to the tracker, which stores it in the
  browser's local storage. The only other destination is the AI provider below. Keys stay on my laptop,
  in the connector's config file (excluded from version control) or an environment variable.
- An AI key: a company-issued key for one sanctioned AI, Claude, Gemini or ChatGPT. The connector
  supports only those three. Today the tracker keeps its AI key in the browser. The plan is to move it
  to the connector and remove it from the browser once a sanctioned key exists.
- Sign-off for sending Gong transcripts to that AI. Transcripts contain customer personal data, so
  sending them to an outside AI adds a processor of that data. This is the research's own inference, not
  something a vendor document said: **to confirm with admin and legal.**

## What the tracker will not do

- Hold a third-party key, once the AI key has moved to the connector.
- Send anything to Gainsight or the AI without showing me a preview and waiting for my click. This is
  the design for the next stage; it is not built yet.

## What exists today

- The contract (`connector/CONTRACT.md`, with JSON Schemas in `connector/schemas/`) and the connector,
  with fake Gong and Gainsight adapters that serve made-up data for the 17 demo accounts.
- AI adapters for Claude, ChatGPT (OpenAI) and Gemini, tested only against stubs. No real AI call has
  been made.
- No real Gong or Gainsight adapter. Those get built only once credentials exist. An adapter that cannot
  run against the real service would pass its tests without proving anything.

## The alternative: IT runs it

The tracker depends only on the contract, not on this connector. IT could implement the same five calls
(health, calls, accounts, push, ai) on a platform it already runs, for example Workato, and the tracker
would not change. Third-party pages list Workato connectors for Gong and for Gainsight; what they cover
is **to confirm with admin.**

## Demo (fake data)

Run `node tools/connector-demo.mjs` from the repo. It starts the connector with fake adapters on
127.0.0.1, makes each call with the token, then stops it and deletes its temp files. Its summary:

```
health: fake/fake/fake
calls: 6 (2 by id, 1 name-only, 1 email-only, 1 unmatchable, 1 email touch)
accounts: 17
push: 2 sent, 1 failed (forceFail)
ai: FAKE AI (copilot_read): Read my book: 17 accounts, which nee…
demo: ok, connector stopped, temp files removed
```
