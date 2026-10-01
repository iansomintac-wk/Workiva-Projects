# Integration seams audit: Gong / Gainsight (read-only, 2026-10-01)

File = osm-book-of-business-tracker-1.0.html. Line numbers come from grep/sed run during this audit. Everything is read in the file unless marked "read in doc" or "not verified".

## 1. Gainsight touchpoints today (nothing is ever sent)

| Touchpoint | Produces | file:line | Gainsight object |
|---|---|---|---|
| queueGainsightItem(kind, customer, payloadText, opts) | pushes to DATA.gainsightQueue: {id,date,customerId,customerName,kind,payload (free text),status:'queued'} | 19228-19236 | generic carrier; payload is prose, not fields |
| commitGoalEvent -> kind 'Success Plan objective'; events created / changed / verdict | text "Update Success Plan objective: <goal> [- verdict: X]" | 4625-4635; called from confirmGraduation 4641-4643 and createGoal / changePrimaryGoal / setGoalVerdict | Success Plan Objective |
| 'Success Outcome Plan' (draftOutcomeTemplate, numbered outcomes 1-18) | template text | 23351-23357 | Success Plan / outcome |
| 'At-Risk CTA' (buildRiskCtaText; ends "CTA owner: [assign in Gainsight]", "Target resolution date: [set in Gainsight]") | CTA draft text | 23413, 23517 | CTA (risk) |
| 'Pending items batch' (buildGainsightBatchText over pendingGainsightItems) | text of outstanding admin | 24474; items built 8167-8200 | Timeline activity / tasks |
| Copy-to-Gainsight call notes: buildGainsightCopyText(c) (next steps, missing gates, first value, CSAT contact, Gainsight/Salesforce ID, plan URLs, session-gap hygiene line); clipboard only | plain text | 7710-7760; button near 25726 | Timeline entry |
| Per-activity "Gainsight checklist" auto-attached to each logged activity (ACTIVITY_TYPES: "Log call summary in Gainsight timeline", "Update Last Touchpoint field", "Adjust health score if sentiment changed", "Open/close CTA") | checklist[] on activity | 2968-2984; attach at 25018 | Timeline, Last Touchpoint field, health score, CTA |
| Compliance gates c.compliance: sentiment = "Readiness Assessment" {done,date,answerA,answerB}; outcomePlan {done,date,outcomeNumber,planText}; associatedPeopleCSAT {done,date,contactName}; "Graduation date SLA" derived | gate state + data | defaultCompliance 5102-5107; GATE_DEFS 7283-7287; ADMIN_GAP_DEFS 5841-5851; pending items 8183-8200 | Readiness Assessment = Timeline activity carrying sentiment; Outcome Plan = Success Plan; CSAT = Associated People; Grad date = estimated graduation date field |
| 'grad-review' item "Estimated graduation date is N days later/earlier than target - update in Gainsight" | admin item (not queued) | 8196-8200 | graduation date |
| Session-gap nudge "confirm / backfill in Gainsight" | hygiene signal + line in copy text | customerSessionGapSignal ~7514; text 7756 | Timeline backfill |
| Gainsight settings {enabled, domain, apiKey}, own localStorage key obm-gainsight-settings-v1, never in Export JSON | config | 1752-1773; UI 26154-26160 ("Not yet live") | n/a |
| syncGainsightQueue(): returns only not_enabled / not_configured / transport_not_built. The declared seam | status | 19238-19250 (messages 19243-19247) | n/a |
| Queue UI on Risk tab: view / remove / "Export queue (JSON)" `gainsight-queue-<date>.json` {exportedOn, items} / "Check sync status" | outbound file | 18064-18089; downloadGainsightQueue 19257-19265 | n/a |
| Day close records `queued` count in DATA.dayClose | counter | 18850-18857 | README:34 says "pushes to Gainsight in one go": aspirational |
| Identity fields c.gainsightId, primaryContact (CSAT/CSM contact), gradPlanUrl, onboardingPlanUrl ("the fields a future Gainsight sync would key on") | strings | comment 6286-6296; getIntegration ~6306; edit UI 22738, 24605 | Company GSID, contacts, Success Plan links |
| Value import from a Gainsight CSV: tier, ARR, renewalDate matched by account name | field patches | buildValueImportRows 27569; applyValueImport 27617-27632; UI 17490, 26242 | Company attributes (manual pull) |
| Excel account import recognises 'gainsight id', 'gsid', 'solution_id' | account rows | EXCEL_FIELD_PATTERNS 27372-27396 | Company |

R8 (spec line 32, read in doc): OSM keeps current in Gainsight = Success Plan/Objectives, CTAs, Timeline entries, plus risks, estimated graduation date, CSAT contacts, sentiment check.

Coverage against R8:
- Objectives: yes, via goal events.
- CTAs: At-Risk only. Nothing closes or updates a CTA.
- Timeline: only via copy text and the batch. A call has no queue kind of its own.
- Risks: go out as At-Risk CTAs.
- Estimated graduation date: only a review item. No queue payload carries the date.
- CSAT contact and sentiment check: tracked as gates, but no queue kind carries the contact name or the two readiness answers, although the data exists (compliance.sentiment.answerA/B 5104, contactName 5106).

## 2. Call / session model and where Gong attaches

- Activity record: {id,date,type,summary,checklist[],sessionNumber|null,flagged}, plus optional transcript {text,truncated}, openThreads[], and a first-value evidence link. Created in the Save handler 25005-25022 and stored at DATA.activities[customerId][]. Types are in ACTIVITY_TYPES 2968-2984: Call, Email, EBR, Milestone Review, Risk/Escalation, Partner Sync, Implementation Note, Other.
- Session identity is only the integer a.sessionNumber (sessionsCompletedCount 6213; getSessionActivity 6914-6917 returns the first activity with that number). There is no session id on the activity and no external id of any kind. Template identity is tpl.id. Per-session notes live on c.sessionNotes[tpl.id] = {deliverables{}, prep} (6939-6957).
- A transcript is already a first-class field on the activity. It is pasted or attached as .txt/.md/.vtt/.srt (log form ~23280; readTranscriptFile 2701; save 25016-25022). Import clamps it (26872-26882). The cap is DEBRIEF_TRANSCRIPT_CHAR_CAP (120,000 chars). Viewer at 23197-23202 and 24808. The debrief prompts consume it (2545-2570, 2644).
- Debrief (AI): buildSessionDebriefPrompt (~2560), a JSON extraction call (2582), a recap-email call (2688-2764), and an open-questions call (2685). Results are not persisted, except openThreads on the activity (3373-3395). The recap email exists only as an AI feature (G09).
- Prep: sessionNotes.prep text feeds buildCallPrepContext (2404, 2445-2446). There is no offline prep view (G08).
- G06 (evidence doc line 63, read in doc): the log form pre-selects the next open session for every activity type (`n===nextSession ? 'selected'`, 23262-23265). Save reads #act-session at 25009-25011. Gong-matched calls would hit the same trap, so auto-linking must not default non-session types to a session.
- Where Gong attaches (proposal):
  - Add an optional `gong: {callId, url, startedAt, durationSec, participants[], summary, matched}` on the activity.
  - Fill the existing `transcript` field from Gong. Debrief and prompts then work unchanged.
  - Keep gong.summary separate from `summary`, which is the OSM's own note and must not be overwritten.
  - Match key: account (gainsightId or name) + date window + attendee emails against stakeholders (3023).
  - Set sessionNumber only for session types, and only on user confirm.
  - Schema rule: the header (rule 4) says shape changes need a schema bump and a migrateData step. The repo treats optional per-record strings as exempt (6286-6296), so a policy call is needed for `gong`.
  - The import repair block (26872) must be tested to see whether it strips unknown activity keys.

## 3. Account fields: who owns what

Tracker customer fields:
- Identity and dates: name, module, stage, implementationDate, targetGraduationDate, totalSessions, reportsCSRD.
- Commercial: tier, arr, renewalDate (3100, 4903-4921).
- Integration: primaryContact, gainsightId, gradPlanUrl, onboardingPlanUrl (6306).
- Relationship and work: stakeholders[] (roles champion / admin / sponsor / partner / csm / other, 2996-3023), blockers, commitments, goals / exit / graduation (schema 14), compliance gates, pause, firstValue, sessionNotes.

Gainsight should own (pull):
- Company name and GSID (gainsightId).
- Tier, ARR, renewalDate.
- Assigned CSM / OSM owner. The tracker has no CSM field, only a stakeholder role 'csm' (3000).
- Contacts and associated people.
- Gainsight health score and sentiment.
- Existing CTAs and Success Plan status.
- Last touchpoint date from Timeline.

Tracker should own:
- Stage and TTFV progress, session plan and sessionNumber.
- Goal, gates and verdict.
- Blockers, commitments, first-value evidence, pause, notes, transcripts.
- Risk and health scoring (computeRisk 6070, healthScore 7157), which is derived.

Conflict zones:
- Health: the tracker computes its own score and Gainsight has another.
- Stakeholders: both sides hold them.
- Graduation date: tracker target against Gainsight estimated date. The grad-review item at 8196 already compares them.
- Compliance gate booleans: they mirror Gainsight records, so a pull should confirm them.

Today only tier, ARR and renewalDate are pulled, via a manual CSV (27569-27632).

## 4. Architecture constraint

- The tracker can call APIs that allow browser access, and one does today.
  - callClaudeAPI 2096-2120 does a fetch POST to https://api.anthropic.com/v1/messages.
  - Headers: x-api-key (the user's key from localStorage, AI_SETTINGS_KEY 1716), anthropic-version, and `anthropic-dangerous-direct-browser-access: true`.
  - Body: {model, max_tokens, messages:[{role:'user', content: promptText}]}.
  - callAiAPI (~2036) dispatches to Claude, Gemini or OpenAI by model (1709-1714), with a 60 s timeout.
  - What it sends is the full prompt assembled in the browser. That is the account context (buildCallPrepContext 2404+: name, module, stage, health, gates, session plan, prep notes, open threads, stakeholders), the OSM's summary, and up to 120k chars of transcript. The Settings text says this goes to the chosen provider (~26152).
- Gainsight cannot be called directly from the page. The file says so itself (1749-1751, 19243-19247, Settings note 26154). Gong is not verified here. Its public API is server-side with key+secret or OAuth, and I did not test CORS.
- A Gainsight or Gong key in localStorage is plaintext and readable by any script on the page. The page loads xlsx from cdnjs and Google Fonts (header lines 47-49), so it is not an isolated origin. From file:// the origin is opaque, which makes OAuth redirects awkward.
- Existing interface paths a connector could use:
  1. Export JSON: exportData 26558-26569 writes `book-of-business-export.json` = serializeBook(DATA) (26506). It is the whole book, including gainsightQueue, activities and transcripts. It does not include the Gainsight, AI or KB settings.
  2. Import JSON: handleImportFile 27280 and prepareArchiveData 27249 validate and repair (26872-26955). It is a full replace, with confirm, so a connector that edits the file must round-trip the whole book.
  3. Auto-backup to a user-picked file via the File System Access API (fsSupported ~26467). It has the same payload, is written about 4 s after each change, and needs one click per session (README:51-62). It is the closest thing to a live sync file. Nothing reads a file back unprompted.
  4. Gainsight queue export: downloadGainsightQueue 19257 (outbound only).
  5. Excel import (accounts and partner notes: EXCEL_FIELD_PATTERNS 27372, guessPartnerColumnMapping ~27640) and the Gainsight value CSV (27569). Inbound, column-guessing, name-matched.
  6. Manager progress report (HTML download) and the clipboard texts.
- Trap: the import normaliser forces every queue item to status:'queued' and rebuilds a fixed shape (27078-27087). A connector that writes 'sent' into the JSON will be reset on import, and fields like externalId or error are dropped. The queue needs a status enum plus externalId / sentAt / error before any push is trackable.
- Connector shapes, cheapest first:
  - A. Claude with Gong and Gainsight MCP connectors, file in / file out.
    - Claude reads the exported JSON, or the auto-backup file.
    - It pulls Gong calls, summaries and transcripts, and Gainsight company data.
    - It writes an inbox file, for example {activity patches keyed by activity id or {customerId,date}, account patches keyed by gainsightId, queue-status updates}.
    - A new tracker "Import connector file" button applies it through a validated preview-and-confirm path, like buildValueImportRows 27569 and applyValueImport 27617.
    - For output, Claude reads gainsightQueue, performs the Gainsight writes via MCP, and writes status back.
    - No keys in the browser, no server, human in the loop. The cost is one new importer plus the queue schema extension. It runs when the user runs Claude, so it is not a background sync.
  - B. Small local helper (a node script or scheduled job). It holds the keys, watches the backup file and writes the inbox file. The tracker still needs the import button, or a fetch to http://localhost with CORS headers. This is what the existing "middleware" wording anticipates: syncGainsightQueue 19238 and the Workiva KB proxy seam (1777ff, 26162).
  - C. Browser extension or bookmarklet on the Gong and Gainsight pages. No keys and no CORS, but brittle.
  - D. Direct browser calls. Not viable for Gainsight; Gong unverified; keys exposed.
- The contract should be the inbox/outbox JSON, not the transport. That lets A be replaced by B later.

## 5. What becomes redundant or simpler

Once Gong is in:
- Manual transcript paste/attach (log form ~23280, handlers 24990-25000, readTranscriptFile 2701) becomes automatic. The 120k cap and .vtt/.srt parsing stay as fallback.
- G06 gets fixed properly if the session link comes from the Gong match instead of the form pre-select.
- The debrief, recap email (G09) and open-threads extraction can run on arrival without a paste.
- The "session not logged locally" hygiene nudge (~7514) mostly disappears for sessions Gong saw.

Once the Gainsight push exists:
- The clipboard / batch flow goes: buildGainsightCopyText 7710, 'Pending items batch' 24474, copy buttons 23405-23413 and ~25726.
- The per-activity Gainsight checklist (2968-2984, attach at 25018) and pendingGainsightItems (8167) turn from reminders into queue items with a state.
- The Export-queue-JSON UI and the "Check sync status" button go.
- The syncGainsightQueue messages go.
- The Gainsight domain/apiKey settings (1752-1773) go, because keys would live in the connector.
- The "[assign in Gainsight]" placeholders in CTA text can be filled from pulled data.

Once the Gainsight pull exists:
- The manual value-CSV import (27569-27632) is replaced by a pull.
- Typing gainsightId, primaryContact and plan URLs (22738), Excel account import columns, and CSM entry as a stakeholder all get simpler.
- A pull that shows the Readiness Assessment, CSAT contact or Success Plan already in Gainsight can flip the gate to done automatically.

Stays regardless: scoring, the session plan, goals/gates, blockers/commitments, curriculum and the AI prompts. The tracker remains the source of truth for the OSM's own judgement fields.

## Not measured / to verify before design
- Whether the Gong and Gainsight MCP connectors or APIs expose: transcripts and summaries by account, Timeline / CTA / Success Plan writes, and CSAT / associated people. The CORS statements for Gainsight come from the file's own comments, and for Gong from general knowledge. Neither was tested.
- Whether the import repair at 26872 strips unknown activity keys (test before adding `gong`).
- The schema-bump policy for adding `gong` and for extending queue items (header rule 4).
