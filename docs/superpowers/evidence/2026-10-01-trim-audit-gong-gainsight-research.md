# Gong + Gainsight CS connection options (researched 2026-10-01)
CONFIRMED = read on an official doc page via fetch this session. UNCONFIRMED = search snippet / third party.

## GONG
### REST API
- CONFIRMED: v2 API; Basic auth (access key + secret) OR OAuth bearer. Key creation = Tech admin only (Admin Center > Settings > API; optional TTL, IP allowlist). OAuth app creation = Tech admin. [receive-access-to-the-api, create-an-app-for-gong, apidocs/introduction-2]
- CONFIRMED: rate limit default 3 calls/sec, 10,000/day (company-wide), 429 + Retry-After. [what-the-gong-api-provides]
- CONFIRMED: POST /v2/calls/transcript (filter fromDateTime/toDateTime/callIds; scope api:calls:read:transcript; returns monologues/sentences per speaker). [apidocs retrieve-transcripts]
- CONFIRMED (overview only): API gives calls, users, stats, "AI-generated content (briefs, highlights, outlines)". [apidocs/introduction-2]
- UNCONFIRMED (search snippets, Gong community/third-party): POST /v2/calls/extensive with contentSelector.exposedFields {brief, outline, highlights, keyPoints, callOutcome, parties}; scope api:calls:read:extensive. GET /v2/calls (list) exists.
- AI summaries via API: YES per the official overview (brief/highlights/outline/keyPoints); field-level detail UNCONFIRMED. The in-app brief help page does not mention API.
- Single-user problem: key is company-wide and admin-issued; a non-admin cannot self-serve. How to scope to "only my calls" is not documented in what I read (filter by user client-side) - UNCONFIRMED.

### MCP
- CONFIRMED: official Gong MCP SERVER at https://mcp.gong.io/mcp. 3 read-only tools: ask_account, ask_deal, generate_brief. Synthesized answers only: "Raw data such as call transcripts, message bodies, and activity lists is not returned." Private calls excluded. Tech admin enables it; personal access (own data) or shared token. [about-gong-mcp-server]
- CONFIRMED: Gong Collective page says Claude connects to mcp.gong.io using credentials from an admin-created Gong MCP integration. [collective.gong.io/integrations/claude-mcp-client]
- UNCONFIRMED: beta status (scalekit says behind Beta flags; Gong docs say neither); uses Gong credits, needs paid seat and CRM sync (tldv/usecarly/scalekit). Not a one-click item in Claude directory (usecarly).
- Gong also has an MCP CLIENT (Gong AI calls external servers) - irrelevant here. [about-gong-mcp]
- Implication: MCP = summaries, NOT transcripts. Transcripts need REST.

### Third party
- Zapier (Gong app, Gong MCP, Gong-Gainsight page), Workato (OAuth2), Airbyte, community MCPs (cedricziel/gong-mcp, scandolo/gong-mcp wrapping REST with your key). UNCONFIRMED beyond listing; all still need an admin-issued key/OAuth.

### Governance
- CONFIRMED: consent via consent page / audio prompt / pre-call email; consent profiles per region; "Enforce" blocks recording; stricter law applies for mixed jurisdictions. [understanding-recording-consent]
- Gong has "Download call data" and transcript pages (existence only, not read).
- Sending transcripts to an outside LLM adds a processor of customer personal data: needs admin/legal sign-off (my inference, not from docs).

## GAINSIGHT CS
### REST API
- CONFIRMED: AccessKey header (does not expire; ONE key per org; Super Admin generates; Administration > Connectors 2.0 > Gainsight API [that last path from search snippet]). OAuth: Authorization Code flow, Read or Read/Write scope, SuperAdmin creates app (max 3), effective rights = more restrictive of app scope and authorizing user permissions; works on Company/Person, Bulk, Events, Success Plan, Data Mgmt APIs. M2M OAuth keys (max 15) appear only in a snippet = UNCONFIRMED.
- CONFIRMED limits: sync 100/min and 100,000/day (overview) - Success Plan page says 50,000/day (pages disagree); async/bulk 10/hr, 100/day. Timeline: singular insert 200/min, bulk 12/hr, 80MB.
- Timeline (CONFIRMED): POST v1/ant/es/activity (required ExternalId, Author email, ContextName in Company|Relationship|CTA|SuccessPlan|GS_Opportunity, TypeName, Subject<=255, Notes ~131k chars, ActivityDate ISO 8601); PUT same with ?identifier=; /bulk variants; read via POST .../v1/data/objects/query/activity_timeline. Base https://timeline.gainsightcloud.com (from search result).
- Success Plan (CONFIRMED): POST v2/successPlan/list (fetch, up to 1000), POST v2/successPlan/ (create), POST v2/successPlan?withObjectives=true (create with objectives), PUT v2/successPlan/ (update), GET v2/successPlan/admin/picklist/lite. Needs ReferenceId, company GSID, owner, plan type, name. A separate Customer Goals API page exists (not read).
- CTA: official page "Call To Action (CTA) API Documentation" exists, base https://cta.gainsightcloud.com. Endpoints POST/PUT /v2/cockpit/cta and query call_to_action are snippet-only = UNCONFIRMED. Task and Playbook API listed (CONFIRMED listing).
- Company read (CONFIRMED): POST https://companyapi.gainsightcloud.com/v1/data/objects/query/Company, 5,000 rows/call, offset paging. Person API listed.
- A normal user cannot self-issue an access key or OAuth app: Super Admin required.

### MCP
- CONFIRMED: official Gainsight CS MCP server; Claude, ChatGPT, Microsoft 365 Copilot supported. Admin creates an OAuth app with PKCE (client id/secret, tenant base URL), then a custom connector is added in Claude (two callback URLs); each end user authenticates with their own Gainsight login. [Set_Up_Gainsight_CS_MCP_Server_Integration]
- CONFIRMED read: companies, relationships, CTAs, success plans, timeline activities, tasks, scorecards, reports, contacts, custom objects. Write: create/update CTAs, success plans, timeline activities; create CTA tasks. NOT supported: delete, company field updates, admin config, scorecard edits. [setup page + MCP FAQ]
- CONFIRMED permissions: Full, Viewer+ or Viewer licenses can authenticate; Viewer cannot create/modify CTAs; Viewer+ can create Timeline activities (editing needs ownership/admin); a read-only OAuth app blocks writes for everyone except Super Admins; field-level security enforced; MCP calls count toward tenant API limit; customer-facing audit log is "planned"; OAuth changes can take 30-60 min. [MCP FAQ]
- Status: community/press snippets say Gainsight CS and Staircase MCP are live, other Gainsight MCPs beta (UNCONFIRMED); no GA label read on the support pages.
- "Gainsight (Staircase AI)" connector is reportedly in Claude's directory (UNCONFIRMED, third party); Gainsight CS is not, add as custom connector.
- Objective-level writes via MCP (vs whole plan) not stated on pages read - UNCONFIRMED.

### Third party
- Zapier (Gong-Gainsight page), Workato, Paragon, Frontegg, Estuary connectors. UNCONFIRMED. Gainsight's own Gong integration not researched.

## Bottom line
1. Gong transcripts: REST only (/v2/calls/transcript), needs a Tech admin to issue key or OAuth app. Gong MCP cannot return transcripts. Summaries: REST (brief/highlights, detail unconfirmed) or MCP (synthesized, read-only, credits).
2. Gainsight: MCP is the lowest-friction, per-user, write-capable route; one-time Super Admin OAuth+PKCE setup. REST needs a Super Admin key or OAuth app.
3. Both need an admin ask; nothing a non-admin can do alone.

## Sources
https://help.gong.io/docs/about-gong-mcp-server
https://help.gong.io/docs/about-gong-mcp.md
https://help.gong.io/docs/set-up-an-mcp-connection
https://collective.gong.io/integrations/claude-mcp-client
https://help.gong.io/docs/receive-access-to-the-api
https://help.gong.io/docs/create-an-app-for-gong.md
https://help.gong.io/docs/what-the-gong-api-provides
https://help.gong.io/apidocs/introduction-2.md
https://help.gong.io/apidocs/retrieve-transcripts-of-calls-by-date-or-callids-v2callstranscript-2.md
https://help.gong.io/docs/use-transcripts-outline-and-call-details.md
https://help.gong.io/docs/understanding-recording-consent.md
https://help.gong.io/llms.txt
https://www.scalekit.com/blog/gong-mcp-vs-api (third party)
https://www.usecarly.com/blog/claude-gong-integration/ (third party)
https://zapier.com/apps/gong/integrations/gainsight
https://docs.workato.com/connectors/gong.html
https://support.gainsight.com/gainsight_nxt/AI_Assistants/MCP_Integration/Admin_Guide/Set_Up_Gainsight_CS_MCP_Server_Integration
https://support.gainsight.com/gainsight_nxt/AI_Assistants/MCP_Integration/FAQ/Gainsight_CS_MCP_FAQ
https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/About/API_Documentation_Overview
https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Timeline_API/Timeline_APIs
https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Success_Plan_APIs/Success_Plan_APIs
https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Company_and_Relationship_API/Company_API_Documentation
https://support.gainsight.com/gainsight_nxt/01Onboarding_and_Implementation/Onboarding_for_Gainsight_NXT/Login_and_Permissions/OAuth_for_Gainsight_APIs
https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Cockpit_API/Call_To_Action_(CTA)_API_Documentation (search result only)
https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs/Generate_REST_API/Generate_REST_API_Key (snippet only)
https://communities.gainsight.com/product-updates/gainsight-connects-its-platform-with-mcp-30696 (snippet)
