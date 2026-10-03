# Vendor API research for real Gong and Gainsight adapters (2026-10-02)

Method: WebFetch of the vendor's own pages (help.gong.io, support.gainsight.com). WebFetch passes each page through a
small summarising model, so field names below are what that summary returned from the vendor page, not a raw copy.
Before coding an adapter, diff each shape against the live page or a real response. The page
gong.app.gong.io/settings/api/documentation failed to fetch (socket hang up; it needs a Gong login anyway), so Gong
answers come from help.gong.io/apidocs, Gong's public docs.

CONFIRMED = read on the vendor's own page via fetch. UNCONFIRMED = search snippet, third party, or not found.

## Gong

1. GET /v2/calls. CONFIRMED.
   Source: https://help.gong.io/apidocs/retrieve-call-data-by-date-range-v2calls-2.md
   - Query: `fromDateTime` (required, ISO-8601), `toDateTime` (required), `cursor` (optional), `workspaceId` (optional).
     Both dates are required, so there is no open-ended "since" without a `toDateTime` (use now). This answers the admin
     ask's open item on listing calls.
   - Response: `{requestId, records:{totalRecords, currentPageSize, currentPageNumber, cursor?}, calls:[...]}`.
     Call fields: `id` (Gong's numeric id), `url`, `title`, `started` (ISO), `duration` (seconds), `primaryUserId`,
     `scheduled`, plus direction, system, scope, media, language, workspaceId, customData. No parties here.
   - Scope: `api:calls:read:basic` (the page says it applies to Bearer/OAuth access; the Basic-key scope model is
     UNCONFIRMED, see 4).
   - Mapping to our contract: id->callId, url->url, started->startedAt, duration->durationSec, title->title.

2. POST /v2/calls/extensive. CONFIRMED.
   Source: https://help.gong.io/apidocs/retrieve-detailed-call-data-by-various-filters-v2callsextensive-2.md
   - Body: `{cursor?, filter:{fromDateTime?, toDateTime?, workspaceId?, callIds?[], primaryUserIds?[]}, contentSelector:{...}}`.
     Dates are optional here.
   - contentSelector: `context` (None|Basic|Extended), `contextTiming`, `exposedFields:{parties:bool,
     content:{structure,topics,trackers,trackerOccurrences,brief,outline,highlights,callOutcome,keyPoints},
     interaction:{speakers,video,personInteractionStats,questions}, collaboration:{publicComments}, media:bool}`.
     Parties come back only if `exposedFields.parties` is true. Gong's AI brief is `content.brief`.
   - Response: `{requestId, records:{...cursor}, calls:[{metaData, parties, content, interaction, collaboration, context, media}]}`.
     Party: `id`, `emailAddress`, `name`, `title`, `userId`, `speakerId`, `context[]`, `affiliation`, `phoneNumber`,
     `methods` (Invitee|Attendee).
   - `affiliation` values: `Internal`, `External`, `Unknown`. Our contract is `internal|customer|unknown`, so the adapter
     maps External->customer and lowercases the rest.
   - Scope: `api:calls:read:extensive` (plus `api:calls:read:media-url` only for media URLs).
   - Extensive can both list and enrich (metaData + parties + brief), which saves rate limit against GET /v2/calls.
   - The key name and type of the brief text inside `content` are not in the summary: read one real response.
   - Q2b, 2026-10-03, CONFIRMED (fetched again for T-14 fix A, same URL): the page lists 404 "No calls found for the
     specified period" with the `ErrorResponse` schema `{requestId, errors: [string]}` (also 400, 401, 429 with
     `Retry-After`, 500). So an empty window is a 404, not a 200 with `calls: []`. The adapter treats only a 404 with a
     JSON body whose `errors` array says "no calls found" as an empty page. Whether the live tenant sends exactly that
     text is still unproven until `--check` runs against it.

3. POST /v2/calls/transcript. CONFIRMED.
   Source: https://help.gong.io/apidocs/retrieve-transcripts-of-calls-by-date-or-callids-v2callstranscript-2.md
   - Body: `{filter:{fromDateTime, toDateTime, callIds?[], workspaceId?}, cursor?}`. The summary lists both dates as
     required inside `filter`; callIds narrows within that window.
   - Response: `{requestId, records:{totalRecords,currentPageSize,currentPageNumber,cursor?}, callTranscripts:[{callId,
     transcript:[{speakerId, topic, sentences:[{start(ms), end(ms), text}]}]}]}`.
   - Scope: `api:calls:read:transcript`. A 429 carries `Retry-After`.
   - No length field and no speaker names, only `speakerId`. Compute length as the sum of `sentences[].text.length`
     over all monologues (plus any separators the adapter adds when it joins them into our single `transcript`
     string). Name speakers by joining `speakerId` to `parties[].speakerId` from extensive.
   - Real transcript sizes are still unmeasured (CONTRACT.md I-2 blocker stands).

4. Auth, base URL, rate limit. CONFIRMED (sub-details noted).
   Sources: https://help.gong.io/apidocs/introduction-2.md and https://help.gong.io/docs/create-an-app-for-gong
   - Basic: `Authorization: Basic base64(accessKey:accessKeySecret)`, key created by a Tech admin.
   - Base URL is customer-specific. The introduction page points to
     https://app.gong.io/company/api-authentication?currentTab=MY_API_TAB (needs login). The OAuth page says
     `api_base_url_for_customer` "is different for each customer and should be saved". Config needs a `baseUrl`.
     The pattern `https://company-NN.api.gong.io` came from a search snippet: UNCONFIRMED.
   - OAuth: a Tech admin creates the app (Admin center > Settings > Ecosystem > API). Authorize
     `https://app.gong.io/oauth2/authorize?client_id=&response_type=code&scope=&redirect_uri=&state=`. Token
     `POST https://app.gong.io/oauth2/generate-customer-token`, HTTP Basic client_id:client_secret. Response:
     `access_token`, `refresh_token`, `expires_in` (default 1 day), `api_base_url_for_customer`, `scope`. Refresh with
     `grant_type=refresh_token` at the same endpoint. Then `Authorization: Bearer`.
   - Rate limit: 3 calls/s and 10,000/day by default; over the limit gives 429 with `Retry-After`.
   - How scopes are chosen for a Basic key, and key expiry or IP allowlist (the admin ask says "optional expiry and an IP
     allowlist"): not on any page read, UNCONFIRMED here (may be on the logged-in settings page).

5. Scoping to one user's calls. CONFIRMED (partial).
   - `filter.primaryUserIds` on /v2/calls/extensive limits to calls HOSTED by those users (extensive page above).
     Host only: calls Ian attended but did not host are not returned. Participant filtering stays client-side on
     `parties[].emailAddress`.
   - GET /v2/calls and /v2/calls/transcript have only `workspaceId`, no user filter.
   - https://help.gong.io/docs/what-the-gong-api-provides says nothing about narrowing a key to one user. No per-user key
     found.
   - Ian's Gong user id was not obtained (a users endpoint exists but was not opened).

6. Gong sandbox. CONFIRMED (partial).
   Source: https://help.gong.io/docs/faqs-sandbox
   - A Gong Sandbox exists: free, requested through your Revenue Architect, starts as a clean empty instance, no
     production data copy. The FAQ does not say whether it has API keys or its own base URL: UNCONFIRMED.
   - A developer instance (form, up to 5 working days) is described in search results for
     https://help.gong.io/docs/how-to-use-the-gong-developers-hub (page not opened): UNCONFIRMED.
   - The API introduction page mentions no test environment.

## Gainsight CS

Note for 8 to 14: the reference pages show `Accesskey` header auth. OAuth bearer is documented separately (7). No page
states per endpoint whether a bearer token is accepted.

7. Base URL, auth, OAuth. CONFIRMED.
   Sources: https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs
   and https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Company_and_Relationship_API/Company_API_Documentation
   - Base URL is tenant-specific (example `https://companyapi.gainsightcloud.com` or a custom domain). The Person API
     uses `https://personapi.gainsightcloud.com`. The adapter needs per-API base URLs.
   - Header: `Accesskey: <key>` (one per org, does not expire), or `Authorization: Bearer <access token>`.
   - OAuth: only Super Admins create apps, at most 3 (Administration > User Management > Authentication > OAuth
     Applications); scope Read or Read/Write for the whole app. Authorize
     `<application-url>/v1/authorize?clientId=&redirectUri=&scopes=`. Token
     `POST https://<application-url>/v1/users/oauth/access/token` with `{clientId, clientSecret,
     grantType:"authorization_code", redirectUri, code}`. Access token life 3600 s. Refresh token valid 365 days and
     single-use, rotated on every refresh (30 s overlap; reusing an old one trips breach detection). The connector must
     persist the new refresh token after every refresh or it locks itself out.
   - Refresh request body (`grantType:"refresh_token"`, `refreshToken`) is from a search snippet: UNCONFIRMED.
   - Authorization Code needs a browser redirect to a callback URL, so first setup is an interactive step.

8. Company query. CONFIRMED.
   Source: Company API page above.
   - `POST <base>/v1/data/objects/query/Company`, body `{select:[...], where:{conditions:[{name, value:[...],
     operator}], expression:"A"}, limit, offset, orderBy:{Name:"asc"}}`. Operators on the page: IN, BTW. Max 5000
     records per call, page by offset. Limits: 100 calls/min, 100,000/day synchronous.
   - Response: `{result, errorCode, errorDesc, requestId, data, message}`. The summary showed `data` as an array; some
     Gainsight pages use `data.records`. UNCONFIRMED which.
   - Field names for tier, ARR, renewal date, CSM owner and health score are tenant-configured: UNCONFIRMED, needs the
     tenant.

9. Person / Company Person read. CONFIRMED (path conflict).
   Source: https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Person_API/Person_API_Documentation
   - Base `https://personapi.gainsightcloud.com/v1/peoplemgmt/v1.0`; `GET /people/{gsid}`; by email, the fetched page
     summary said `/people/email/{email}` while a search snippet said `/people?Email=...`: UNCONFIRMED which.
   - One record per call. No list-by-company endpoint seen. Company Person fields: Gsid, Active, Person_ID, Company_ID,
     IsPrimaryCompany, Role, Title, Manager, SfdcAccountId, SfdcContactId. Read response schema is not on the page.
   - A list of a company's contacts probably goes through the generic object query (as in 8) on the Company Person
     object; object name and fields not read: UNCONFIRMED.

10. Timeline activity create. CONFIRMED.
    Source: https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs
    - `POST <base>/v1/ant/es/activity`, body `{records:[{ContextName:"Company", TypeName:"Meeting", ExternalId,
      Subject, Notes, ActivityDate:"yyyy-MM-dd'T'HH:mm:ss.SSSZ", Author:<email>, companyName}], lookups:{AuthorId:{
      objectName:"GsUser", fields:{Author:"Email"}, lookupField:"Gsid", multiMatchOption:"FIRSTMATCH",
      onNoMatch:"ERROR"}, GsCompanyId:{objectName:"Company", fields:{companyName:"Name"}, lookupField:"Gsid", ...}}}`.
    - Required: ExternalId, Author, ContextName (Company|Relationship|CTA|SuccessPlan|GS_Opportunity), TypeName or
      ActivityTypeId, Subject (max 255), Notes (about 131,000 chars), ActivityDate, a context id (here via lookup).
    - Success: `{"data":{"failures":{},"success":{"<externalId>":[{"activityId":"<GSID>"}]}},"result":true}`.
    - Update `PUT v1/ant/es/activity?identifier=externalid`; delete `DELETE v1/ant/es/activity`. Single insert limit
      200 calls/min.

11. Success Plan v2. CONFIRMED.
    Source: https://support.gainsight.com/gainsight_nxt/Success_Plans/Success_Plan_API_Documentation/Success_Plan_APIs
    - Create with objectives: `POST v2/successPlan?withObjectives=true`, body `{requests:[{record:{referenceId, Name,
      SuccessPlanType, status, CompanyId|SFDCID, OwnerId|OwnerEmail, DueDate, Templates?, Objectives:[{Name, DueDate,
      category, status, priority}]}}], lookups:{OwnerId:{...}}}`. Mandatory: referenceId, Name, SuccessPlanType (name),
      status (name), a company identifier, an owner identifier.
    - Update: `PUT v2/successPlan/`, record `{referenceId, Gsid, ...fields}`.
    - An objective is nested inside a Success Plan, not a CTA. Adding or updating one objective on an EXISTING plan:
      the page read showed only creation together with the plan, so that endpoint is UNCONFIRMED.
    - Type, status and priority ids: `GET v2/successPlan/admin/picklist/lite?category=SUCCESS_PLAN_TYPE&et=COMPANY`.

12. CTA create/update. CONFIRMED.
    Source: https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Cockpit_API/Call_To_Action_(CTA)_API_Documentation
    - Create `POST /v2/cockpit/cta`, body `{requests:[{record:{referenceId, Name, type, DueDate:"YYYY-MM-DD",
      OwnerEmail|OwnerId, company id (e.g. SFDCID)}, linkedObjects:[...]}], lookups:{...}}`. Mandatory: referenceId,
      Name, type (name), owner, company.
    - Update `PUT /v2/cockpit/cta`, record `{referenceId, Gsid, ...}`, with `ownerCriteria` and `dueDateCriteria`.
    - Ids: `GET /v2/cockpit/admin/picklist/lite?category=CTA_STATUS,CTA_PRIORITY,CTA_TYPE&et=COMPANY` returns type,
      status, priority (the summary also said reason; its category name is UNCONFIRMED).
    - The admin ask can move the CTA item from "to confirm" to confirmed endpoints (bearer acceptance still open).

13. Gainsight sandbox. UNCONFIRMED.
    - The OAuth, Company, Timeline and CTA pages do not mention sandbox tenants, separate URLs or key differences. One
      targeted search on support.gainsight.com found nothing. Ask the admin.

14. Idempotency / external id on writes. CONFIRMED for Timeline only.
    - Timeline: `ExternalId` is "used as the idempotency key on insert", and update can go by `identifier=externalid`.
      Map our queue `items[].id` to `ExternalId`. What a repeated insert returns (error or the existing id) is not
      stated: UNCONFIRMED. Our contract needs `sent` with the same `externalId`.
    - Success Plan: no ExternalId; `referenceId` only tracks results and "isn't a deduplication mechanism" (per the
      page summary).
    - CTA: no external id or idempotency key shown; `referenceId` tracks errors only.
    - Company API insert/update: no upsert or external id; max 50 records per call.
    - So for Success Plan, CTA and Pending-items writes the connector must keep its own persisted map of item id ->
      Gsid/externalId and check it before each push. A crash between the Gainsight write and the file write still
      leaves a duplicate window; closing it needs a pre-create lookup by name and company, whose query shape is
      UNCONFIRMED.

## Count

Of the 14 questions: 10 CONFIRMED on the vendor's own page (1, 2, 3, 4, 5, 7, 8, 10, 11, 12; several carry flagged
UNCONFIRMED sub-details, and 5 is partial because the filter is host-only). 4 UNCONFIRMED or only partly confirmed:
6 (sandbox exists, API access unknown), 9 (path conflict), 13 (not found), 14 (Timeline only).

## Gaps that block an adapter (unknowable without credentials or a tenant)

1. Gainsight Company field names for tier, ARR, renewal date, CSM owner and health score (tenant-custom fields). Blocks
   the accounts mapping.
2. Real response shapes: Gong `content.brief` key and type; Gainsight Company query `data` vs `data.records`; Person
   read response; Gsid placement in CTA and Success Plan create responses. One real call each.
3. Whether a Gainsight OAuth bearer token is accepted on every endpoint used (v1/data, v1/ant/es, v2/cockpit,
   v2/successPlan, and the Person API on a different host), and what scopes a Gong Basic key carries.
4. Timeline duplicate-ExternalId behaviour on retry; decides how the adapter meets the contract's idempotency rule.
5. Success Plan objective add or update on an existing plan, and the CTA reason picklist category. Success Plan and CTA
   have no dedupe key, so the duplicate-protection design depends on a lookup query shape not yet read.
6. Gainsight sandbox existence, base URL and key handling; Gong sandbox API access. Only the admins can say.
7. Ian's Gong user id and the Gong tenant base URL (shown only inside the logged-in settings page).
