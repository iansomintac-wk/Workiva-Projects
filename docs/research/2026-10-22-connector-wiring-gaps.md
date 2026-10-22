# Connector wiring gaps (researched 2026-10-21)

Tags: read = page opened (WebFetch, summarised by a small model, not raw HTML); snippet = search result only; assumed = my reasoning. Base: support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/ (abbrev GS/).

## 1. Gainsight bulk push
- Company REST (read, GS/Company_and_Relationship_API/Company_API_Documentation): POST https://companyapi.gainsightcloud.com/v1/data/objects/Company (insert, no keys), 50 records/call. PUT same URL `?keys=f1,f2` (max 3 keys, types String/GSID/Number/Email, AND-combined), 50/call. Page says "identified using keys", does not clearly say unmatched rows are created: UNCONFIRMED whether PUT is a true upsert. Over 50: page points to S3 Connector or Bulk API.
- Person (read, GS/Person_API/People_API_Documentation): sync upsert PUT https://personapi.gainsightcloud.com/v1/peoplemgmt/v1.0/people (1 record). Async PUT .../people/async (50). Bulk: PUT .../external/bulk/ingestion/people (50/call); async POST .../external/bulk/ingestion/async/people (80 MB/request); status GET .../async/status/<statusId>. Upsert key: Email default resolution key (or Gsid). Limits: sync 100/min, 50,000/day; async 10/hour, 100/day.
- Bulk API (read, GS/Bulk_API/Gainsight_Bulk_API): admin-configured CSV Data Ingest Job; endpoint is a generated cURL (not fixed); upsert/update keys chosen in the job; 80 MB max file; 10 job runs/hour, 100/day (an earlier search snippet said 4/hour: conflicting, UNCONFIRMED which is current). The page says Person/User object model is NOT loadable via Bulk API (the separate People bulk endpoints above are the Person route).
- When bulk vs Timeline+CTA (assumed): bulk/upsert is for syncing master data (accounts, people, fields on the Company record, e.g. a nightly score or ARR column). Timeline + CTA are event records on top of an existing company. Use bulk only if the tracker must write fields onto Company/Person; not needed for logging calls and tasks.

## 2. Reads on the same REST connector (same accesskey/domain model; endpoints only)
- Person: GET https://personapi.gainsightcloud.com/v1/peoplemgmt/v1.0/people/{gsid} or GET .../people?Email=... (read). No general Person query/search endpoint found in the page text (UNCONFIRMED; Person may also be reachable via the generic objects query, not checked).
- Company (bonus): POST https://companyapi.gainsightcloud.com/v1/data/objects/query/Company, up to 5000/call (read).
- Timeline activity: POST {domain}/v1/data/objects/query/activity_timeline with select/where/orderBy/limit/offset (read, GS/Timeline_API/Timeline_APIs).
- CTA open per company: POST /v2/cockpit/cta/list, body select, where.conditions (EQ on companyId shown), pageSize/pageNumber, up to 1000/page (read, GS/Cockpit_API/Call_To_Action_(CTA)_API_Documentation). No documented "open" filter; response has IsClosed; filtering on it is UNCONFIRMED (assumed workable, test).
- Host prefix for the CTA path was not shown in the fetch; take it from CONNECT-GAINSIGHT.md.

## 3. Gainsight data in Snowflake
- Read: Gainsight's own docs cover only Snowflake -> Gainsight (Snowflake Connector, support.gainsight.com/gainsight_nxt/Connectors/DB_Based_Connectors/Snowflake_Connector, seen in snippet only; Data Designer page also snippet). Needs read user, default warehouse, create-stage permission, Gainsight IP allow-listing (snippet).
- Gainsight -> Snowflake: no official native export or data share found. Third parties advertise it (Celigo, Stacksync, Coupler.io; snippet/vendor). Native export was a long-standing community request (snippet). So a native share: UNCONFIRMED, likely absent.
- Typical lag: no vendor figure read. Coupler.io claims refresh as often as every 15 min (vendor snippet, Gainsight PX). Assumed: batch ELT gives hourly to daily lag.
- Is reading Gainsight objects from Snowflake normal? Assumed yes where a team already runs an ELT/reverse-ETL (Hightouch, Celigo listings exist); not confirmed that Runway's account has such a pipeline: ask the data team which tables and their refresh time.

## 4. Snowflake SQL API key-pair JWT (read: docs.snowflake.com/en/developer-guide/sql-api/authenticating)
- iss = `<ACCOUNT>.<USER>.SHA256:<pubkey fingerprint>`; sub = `<ACCOUNT>.<USER>`. Account and user uppercase; periods in account identifier become hyphens; for an account locator omit region.
- iat, exp: UTC, seconds or milliseconds. Token valid at most 1 hour after issue even if exp is later.
- Algorithm: prose silent; example uses RS256.
- Header: `Authorization: Bearer <JWT>`; `X-Snowflake-Authorization-Token-Type: KEYPAIR_JWT` (optional, inferred if omitted; other values OAUTH, PROGRAMMATIC_ACCESS_TOKEN).
- Fingerprint = base64(SHA-256 of DER SubjectPublicKeyInfo), prefixed `SHA256:`; or DESCRIBE USER -> RSA_PUBLIC_KEY_FP.
- Node crypto only: yes in principle (assumed, not tested): createPublicKey(privPem).export({type:'spki',format:'der'}) -> sha256 -> base64; JWT = base64url header {alg:RS256,typ:JWT} + payload, signed with crypto.sign('RSA-SHA256', ..., key). Cheapest check: build one token and compare the fingerprint with RSA_PUBLIC_KEY_FP.
- Network policy for key-pair: the key-pair page (docs.snowflake.com/en/user-guide/key-pair-auth, read) and the auth page do not say one is required (only 2048-bit RSA minimum). Ian's own measurement says key-pair needs an admin grant; the PAT network-policy requirement is not shown on pages I opened. Policy for key-pair: not required per docs, UNCONFIRMED for this account.

## 5. snowflake-sdk vs SQL API over fetch (assumed, reasoning only)
For a zero-dependency read-only adapter, the SQL API over fetch fits: one POST /api/v2/statements, a JWT built from node:crypto, and polling of the 202 response by statementHandle (already measured, ~45 s), with no native or transitive packages, and a hand-written, mockable surface. The cost is that you own the JWT, the 202 polling, partition paging (large results come back in partitions), and 429 backoff. snowflake-sdk gives sessions, retries and result streaming, but pulls a large dependency tree (and needs an install, which needs Ian's yes) and holds a session open, so it suits a long-lived service better than a small adapter. Recommendation: SQL API over fetch.

## 6. Read-only role and statement safety
- Grants (snippet of docs.snowflake.com/en/sql-reference/sql/grant-privilege and user-guide/security-access-control-configure): create role; GRANT USAGE on warehouse, database, schema; GRANT SELECT ON ALL TABLES IN SCHEMA (existing only) and SELECT ON FUTURE TABLES IN SCHEMA (schema-level takes precedence over database-level; creating future grants needs MANAGE GRANTS); grant the role to the service user and set it as default role. Same for views. Future grants are a convenience that loosens least privilege.
- Statement safety: no Snowflake setting restricting the SQL API to SELECT found (parameters page opened but truncated: UNCONFIRMED). The real guard is the role holding only SELECT/USAGE, so writes fail at Snowflake. Add client-side guard: send `"parameters":{"MULTI_STATEMENT_COUNT":"1"}` (read, submitting-multiple-statements page: mismatch is rejected; never use "0"), reject any statement not starting with SELECT/WITH, and no semicolons. Also pin role and warehouse in the request body.
