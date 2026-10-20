# Snowflake PAT + SQL API + browser CORS (research, 2026-10-19)

Brain hits: none supplied in packet. Tags: fetched = page read via fetch tool (summarised by a small model, so quotes are second-hand); snippet = search result only; assumed = reasoning only. No credentials in this file.

## Q1 PATs (source: https://docs.snowflake.com/en/user-guide/programmatic-access-tokens, fetched)
- Person users (TYPE=PERSON) create tokens for themselves, no special privilege. For another user or a service user: OWNERSHIP or MODIFY PROGRAMMATIC AUTHENTICATION METHODS on that user. Confirmed.
- ROLE_RESTRICTION: required for service users (SERVICE, SERVICE_AGENT, LEGACY_SERVICE) unless auth policy sets REQUIRE_ROLE_RESTRICTION_FOR_SERVICE_USERS=FALSE. Optional for person users (policy can require it via REQUIRE_ROLE_RESTRICTION_FOR_PERSON_USERS). Role must be granted to user; secondary roles not used; BLOCKED_ROLES_LIST can bar e.g. ACCOUNTADMIN. Confirmed.
- Expiry: default 15 days (DEFAULT_EXPIRY_IN_DAYS), max 365 days (MAX_EXPIRY_IN_DAYS), set in an authentication policy PAT_POLICY. Lowering max makes existing longer tokens fail. Confirmed.
- Network policy: service users must be under one to generate OR use a token. Service-agent users need none. Person users can generate without one but must be under a network policy to AUTHENTICATE with it. Person users can bypass the generation requirement temporarily (Snowsight, or MINS_TO_BYPASS_NETWORK_POLICY_REQUIREMENT; docs advise against). Auth policy NETWORK_POLICY_EVALUATION: ENFORCED_REQUIRED (default) / ENFORCED_NOT_REQUIRED / NOT_ENFORCED. Bypass never bypasses the policy itself. Confirmed.
- Grace period: none documented (only EXPIRE_ROTATED_TOKEN_AFTER_HOURS for rotated tokens). Error text without a network policy: NOT documented on that page; page lists PAT_INVALID for failed auth. UNCONFIRMED exact error message.

## Q2 SQL API with PAT
- Headers (https://docs.snowflake.com/en/developer-guide/sql-api/authenticating and the PAT page, fetched): `Authorization: Bearer <pat_secret>`; `X-Snowflake-Authorization-Token-Type: PROGRAMMATIC_ACCESS_TOKEN` is optional (Snowflake sniffs the type if omitted). PAT page shows a curl to /api/v2/databases with Bearer only. Also send `Content-Type: application/json` (API returns 422 for other media types; Accept json assumed fine). Confirmed.
- Body (https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests, fetched): `statement` (required), optional `timeout`, `warehouse`, `database`, `schema`, `role`, `bindings`. Omitted context falls back to the user's DEFAULT_WAREHOUSE / DEFAULT_NAMESPACE / DEFAULT_ROLE. Names are case-sensitive, must match SHOW output case. Note: with a role-restricted PAT, the role is fixed by the token (assumed; not stated on the pages fetched).
- Timeout (https://docs.snowflake.com/en/developer-guide/sql-api/reference, fetched): seconds; omitted = STATEMENT_TIMEOUT_IN_SECONDS; `0` = max 604800 s (7 days).
- Sync/async (https://docs.snowflake.com/en/developer-guide/sql-api/handling-responses, fetched): `?async=true` forces async; otherwise a POST returns 200 with ResultSet, or 202 with QueryStatus (statementHandle, statementStatusUrl) if it runs past about 45 s. Poll GET /api/v2/statements/{handle}: 200 done, 202 or 429 still running/retry, 422 failed (QueryFailureStatus body).
- Paging: resultSetMetaData.partitionInfo lists partitions (rowCount, uncompressedSize, sometimes compressedSize). Partition 0 is in the first response; later ones via GET .../{handle}?partition=n, gzip, data only (metadata only in first). No explicit size limits stated.
- Rate limits: no numbers published; 429 = rate or concurrency limit, retry with jittered exponential backoff; safe retry = same requestId + `retry=true`. Confirmed (no figures).
- Privileges: SQL API pages do not list any. Typical read-only grant: USAGE on warehouse, USAGE on database and schema, SELECT on tables. Only snippet/third-party support (search results, not Snowflake's SQL API pages); standard Snowflake RBAC = assumed-correct, UNCONFIRMED on a Snowflake page.
- API protected by account network policies (snippet, intro page).

## Q3 CORS
- Chrome LNA (https://developer.chrome.com/blog/local-network-access, fetched): permission prompt ships in Chrome 142 (opt-in testing from 138 via chrome://flags#local-network-access-check). Loopback (127.0.0.0/8, ::1) counts as local network from a public-network page. Permission only requestable in secure contexts. LNA replaces Private Network Access (which needed preflights). Page says NOTHING about file:// origins, Access-Control-* headers, or whether CORS is still needed. UNCONFIRMED: how file:// (origin null, likely classed non-public/unknown address space) is treated; one Atlassian report (snippet) shows "Permission was denied ... unknown address space" with no prompt in an iframe; fix there was allow="local-network-access" on the iframe (snippet, https://jira.atlassian.com/browse/ECO-1174).
- Retool thread (snippet, https://community.retool.com/t/chrome-access-control-allow-private-network/62988): file:// page to 127.0.0.1 blocked; advice is serve the page from a local web server, or have backend allow null origin (less safe).
- Assumed from the CORS spec (not fetched): an Authorization header makes the request non-simple, so a preflight OPTIONS is sent; server must answer with Access-Control-Allow-Origin (the literal `null` for file:// pages), Access-Control-Allow-Headers: authorization, and Access-Control-Allow-Methods. Chrome and Edge are both Chromium, so same behaviour assumed. Cheapest check: open a file:// page in Chrome/Edge and fetch the local server, watch DevTools Network.
- Safer design (assumed): have the Node process serve the page itself at http://127.0.0.1:<port> so it is same-origin: no preflight, no `null` allow, and (likely) no LNA prompt since the page is already local.
- Snowflake CORS: NOT confirmed. SQL API reference page does not mention CORS; searches found nothing. Assume a browser cannot be relied on to call it directly (UNCONFIRMED; test with curl -X OPTIONS from a scratch account, or just proxy via Node). Putting a PAT in a browser page would also expose the secret.

## Step 0 result (measured by Ian on his work Mac, 2026-10-20, ~04:00 UTC)

- Creating a PAT: WORKED. Snowsight -> user menu -> Settings -> Authentication -> Programmatic access tokens -> Generate; Single role = PUBLIC (his current role).
- Using it: one read-only `select current_user(), current_role()` POSTed to /api/v2/statements with `Authorization: Bearer <pat>` returned
  `"message" : "Fail : Network policy is required."` (measured). This confirms the Q1 claim above: a person user can generate a PAT
  without a network policy but cannot authenticate with one. The PAT route is blocked unless an admin puts a network policy on his user.
- The token was typed into a hidden `read -s` prompt only; it is not in this repo, any log or any transcript.

## Key-pair test (measured by Ian, 2026-10-20, ~04:20 UTC)

- `alter user <self> set rsa_public_key='...'` as PUBLIC returned: "SQL access control error: Insufficient privileges to operate on user
  '<self>'. Your primary role PUBLIC or one of your secondary roles must have MODIFY PROGRAMMATIC AUTHENTICATION METHODS granted on USER <self>."
  (measured). Key-pair is blocked without an admin grant. Every self-serve route a script could use is closed: PAT (network policy) and key-pair (grant).
- Side fact from Ian's screenshot (schema names only, no rows): his CSAT query reads silver_prod.gainsight.survey_participant,
  gold_prod.staging_survey_data_product.fct_survey_cs_complete_csat and silver_prod.gainsight.company, on warehouse PROD_WH (Small) as PUBLIC;
  the counts query ran over 1 minute in the worksheet, so a SQL API call would return 202 and need polling (over the ~45 s sync window).

## Status: PARKED (2026-10-20 04:32 UTC)

Ian: "we can park this for now". Option D (watch Downloads; Snowflake Run -> Download; 1.2 picks it up) needs no code and was offered as
a test; not yet tried. Restart condition: an admin attaches Ian's public key (preferred: no IP dependency; whether key-pair also needs a
network policy is UNCONFIRMED) or adds a network policy for his user. The unusable PAT can be deleted in Snowsight.
