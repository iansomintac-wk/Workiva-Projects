# BoB Tracker Review and OSM Workflow

The tracker contains useful OSM knowledge and several thoughtful safeguards, but its daily workflow does not yet deliver the adaptive enablement and Gainsight administration Ian described. Five reproduced reliability issues also weaken confidence in saving, recovery, and sending. The recommended direction is to preserve the existing curricula, evidence identities, goals, and integration work while improving reliability first and rebuilding the daily flow around the next customer conversation.

## Intended job

Ian described the tracker as a workspace for post-implementation go-live and graduation preparation. Each customer needs a flexible enablement path of roughly twelve sessions or fewer. The first screen should prepare the OSM for today's customer calls: where the customer stands, the next session's talk track and topics, supporting evidence, pending deliverables and questions, and risks. A summary of the whole account and implementation must be distinct from a recap of the previous meeting.

When a meeting does not cover its planned topics, unfinished work should automatically carry into the next agenda. Changes to later sessions should be suggested, with OSM overrides. Session attendance alone should not imply that the customer learned the material. Progress should contribute to customer goals and a continuing handoff document for the long-term CSM.

The tool must reduce administration in Gainsight, including notes, the CSAT contact, success plans, and implementation sentiment. The first audience is Ian, followed by individual OSMs with separate books. The existing module curricula are the editable starting drafts. Shared team accounts are outside this initial brief.

## Verified baseline

Review date: October 6, 2026. Product revision: `3ce0e69`. The product files were not changed during this review.

| Check | Measured result | Limit |
| --- | --- | --- |
| Tracker self-checks with `demo-seed.js` | 475 passed, 0 failed, exit 0 | Existing assertions do not cover the five findings below. |
| Connector tests | 168 passed, 0 failed, exit 0 | Vendor calls use synthetic fixtures or injected responses. |
| Companion guide checks | 18 passed, 0 failed, exit 0 | Passing checks do not establish that its instructions match every current feature. |
| Independent reliability probe | Six cases reproduced across five issues, exit 0 | Uses unchanged extracted app functions with synthetic storage and DOM, and the real adapter with injected fetch. It is not a live tenant test. |
| Today capture | 17 synthetic accounts, 3 calls, 11 displayed account beats, no captured runtime exceptions | Default Story mode; viewport 1440 by 900. |
| Product size | 1,256,628 bytes; 19,917 source lines | The initial split count of 19,918 included the final empty row. |

Browser checks initially failed with `Target crashed` in the restricted sandbox, including a serial rerun. The same unchanged tracker command passed outside the sandbox with a temporary browser profile. This failure was not counted as an app defect.

Tracker SHA-256: `a21ca8c34c9c0859bf6b26e77f53a748e34daa026c21d2dba8f95f980d2fbddb`. The hash was identical before and after captures. Captures are in `.artifacts/review-2026-10-06/`; the PNG dimensions and hashes were read from their bytes without loading the images for aesthetic judgment.

The Today PNG is 1425 by 8483 pixels, about 9.4 times the recorded viewport height. This measures capture extent, not OSM task time. Compact mode already exists and should be compared in a later usability measurement before attributing any time saving to it.

## What deserves preserving

The signal registry provides reasons and destinations for recommendations, and Today merges calls and ranked work into one beat per account. Customer promises and blockers are represented explicitly. Risk suggestions, local inference, and AI suggestions have different sources rather than being silently merged into a single verdict.

Curriculum sessions and deliverables have stable identities. Evidence records include when a criterion was met and whether the customer demonstrated it or the OSM observed it. Goals, graduation verdicts, goal changes, and early exits give the eventual handoff useful history. These are better foundations than a simple completed-session counter.

The connector defaults to dry-run and has a tenant-specific production write gate. Critical modal imports already validate a candidate book and restore memory when persistence fails. These existing patterns can be extended to the unsafe paths below.

## Reliability findings

All five findings are Important. The recovery issue should be addressed before relying on automatic backup for a real book.

### Backup bypasses the rejected load guard

If a saved book cannot be loaded, `_rejectedLoadPayload` makes `saveData()` refuse to replace it. `fsWriteNow()` does not check that guard. It writes the fallback `DATA` to the chosen backup and directly stamps localStorage afterward.

The probe measured normal save `false`, backup result `true`, an empty customer list in the backup, and an empty book replacing the rejected browser payload. A dated quarantine copy may still permit recovery if it was successfully written; the chosen backup is not protected.

Apply the rejected-load protection to every export and backup write and remove the unrestricted storage bypass. Exercise the path after an actual rejected load in a regression check. Sources: `osm-book-of-business-tracker-1.0.html:17773`, `:17777`, `:17786`, and the Backup Now handler at `:17503`.

### A stale tab can overwrite newer work

The storage listener displays a conflict banner, but it does not disable subsequent full-book saves. In the probe, tab A changed ARR from 100 to 200. Tab B received the banner, saved a name change successfully, and restored ARR to 100.

Block persistence and backups from a stale tab until reconciliation, and check the expected stored revision when committing. Include queued saves, not only deliberate button clicks. Sources: HTML `:19884`, `:5629`, and `:5687`.

### Some imports announce success after a failed save

The commercial CSV flow mutates live memory, ignores `saveData()`'s result, closes the modal, and reports imported counts. Gong imports and Gainsight pulls have comparable save handling. The CSV probe measured ARR 999 in memory, ARR 100 in storage, and `saveData()` returning false after a simulated quota error. The caller still contains an unconditional success toast.

Use the existing candidate transaction pattern for these imports. Report success only after persistence succeeds; keep the import open and retain the prior book on failure. Sources: HTML `:19068`, `:19170`, `:19334`, and `:19434`.

### A sent CTA with an unreadable ID remains queued

The real adapter deliberately supports `{status: 'sent', externalId: null}` when `cta.idPath` is unset. The tracker only accepts sent results with a nonempty string ID. The initial send and cached retry therefore both produced tracker counters of zero sent and zero failed, while the queue remained queued. The injected vendor received one request.

Represent an acknowledged send without a readable vendor ID consistently in the connector and tracker. Preserve the previously approved adapter behavior rather than pretending that the request failed. Sources: `connector/adapters/gainsight-rest.mjs:123`, `:208`, and HTML `:10624`.

### Concurrent pushes lose remembered sends

Each push reads its own send-ledger snapshot before awaiting network work, then replaces the whole ledger. Two concurrent sends of different CTAs left only one ID remembered; retrying the forgotten ID caused a third injected vendor request. Two concurrent pushes of the same ID caused two requests.

Serialize the read, deduplication, send, and record operation, including suppression of the same ID while it is in flight. Atomic replacement of the file alone does not protect the transaction. These results demonstrate duplicate requests; actual Gainsight CTA deduplication remains unproven. Sources: `connector/adapters/gainsight-rest.mjs:197`, `:203`, `:208`, and `connector/server.mjs:61`.

## Fit to the OSM brief

| Need | Current behavior | Recommended improvement |
| --- | --- | --- |
| Prepare today's calls | Calls lead Today, but the full run script lives on Session Plan. Story mode occupies substantial vertical space. | A compact call list and a selected-call workspace containing agenda, talk track, evidence, and unresolved work. Preserve deeper views for focused work. |
| Account history and previous meeting recap | The account brief combines activity counts and the latest activity, which can be an email. AI synthesis is optional. | Separate the continuing account story from the latest completed customer meeting. Show source activity and dates for each fact or recap. |
| Adapt after unfinished sessions | `nextOpenSessionNumber()` finds the first number absent from the activity log. `buildSessionRunbook()` selects the template or authored script. Today lists open activity checklist items, but these do not resequence the curriculum. | Track topic coverage and customer demonstration separately from held sessions. Carry unfinished topics into the next agenda and propose changes to dependent later topics. |
| Show readiness and risk coherently | The synthetic Corvus account reads Off Track on Today and On Track on Accounts. Its health score is 78%, with zero of eleven success criteria evidenced. | Give readiness, urgent work, and confirmed customer risks distinct labels and consistent definitions across views. |
| Reduce Gainsight administration | Pending admin batches and Success Outcome Plan items become Timeline activities. Success Plan objective writes are explicitly blocked. | Model each actual Gainsight operation separately. Show whether it is a prepared note, a field update, an objective write, or an unsupported operation. Verify the real record that matters. |
| Maintain the CSM document | Handoff fields, goals, activity history, and evidence exist, with a provisional handoff field set. | Build a continuing account record from the same saved events: implementation decisions, goals, demonstrated capabilities, unresolved items, risks, owners, and next milestones. Export a dated CSM snapshot. |

The current health formula assigns 45% to assessed domains and 55% to Gainsight compliance. It is a weighted progress proxy, not an empirically validated probability of customer success. Closing administration can raise it without demonstrating customer capability. Keep its useful inputs, but present them separately before changing any scoring rules. Sources: HTML `:7444`, `:7455`, `:6526`, `:4375`, `:12276`, `:13800`; `connector/adapters/gainsight-rest.mjs:64` and `:84`.

## Recommended direction

Three reasonable approaches are available. A reliability-only patch is the smallest change but leaves the adaptive enablement gap. Evolving the existing tracker retains its domain knowledge and evidence history while changing how OSMs prepare and close a call; this is the recommendation. A complete replacement would offer a cleaner starting structure but require re-proving migrations, evidence identity, scoring, and integrations that already exist.

The improved daily workspace should have a compact list of today's calls, with a selected customer's work in the main area. For that customer, show the implementation and goal context, the previous meeting recap, and the current agenda. Each topic carries its intended outcome, supporting documentation, evidence, and coverage state. Questions and deliverables carry an owner and a due date when known.

After a call, a short structured close records what happened, what the customer demonstrated, what remains, and who owes the next action. That one saved event should update the next agenda, goal evidence, risk history, handoff record, and Gainsight drafts. A postponed topic should not appear mastered merely because a session number was logged. Dependencies should influence the suggested sequence; the OSM must be able to change it for the customer's situation.

Keep a curriculum library and an individual customer plan. Editing the library should not rewrite historical evidence or silently change a customer's agreed plan. Retain stable session and deliverable identities and add any new data through an explicit schema migration.

Keep deployment appropriate for separate OSM books. Modularize development code by persistence, curriculum, evidence and goals, risk, integrations, and rendering, while preserving an easy distributable app. A framework migration is not a prerequisite for these improvements.

For Gainsight, first reconcile the sending bugs and label existing capabilities accurately. Add real field and objective operations only against confirmed tenant mappings and response shapes. Until access exists, use specific copy-ready drafts for unsupported operations. A Timeline note mentioning a CSAT contact is not confirmation that Gainsight's CSAT contact was updated.

## Validation for an improved version

Preserve existing book imports, customer-specific evidence, goal history, and the current distributable workflow. Add checks for rejected-load backup protection, stale writes, failed persistence during imports, accepted sends without an ID, and concurrent sends.

Use scenarios where session four is held with an unfinished topic, a dependent topic is planned for session five, a customer demonstrates an outcome earlier than expected, and the most recent activity is an email after the last meeting. Verify the next agenda and handoff against the saved evidence, including overrides and curriculum edits.

Measure OSM task time and actual clicks for preparing three different calls and closing one meeting, before and after the change. Capture height is only a navigation proxy; it does not establish minutes saved. Live vendor verification must separately prove notes, CSAT contact updates, sentiment, success plans, and CTAs in the intended records.

## Agreed agenda behavior

Ian selected: "Automatically carry them forward and suggest later changes, with OSM overrides." The next design should therefore make carry-forward the default and keep later resequencing visible and editable. A cancelled or partial meeting must not silently create completion evidence. This behavior is a requirement for the proposed change; it has not been implemented.
