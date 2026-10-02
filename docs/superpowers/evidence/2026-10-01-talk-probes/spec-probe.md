# Spec probe - trim-audit worktree, osm-book-of-business-tracker-1.0.html (28283 lines, 1,787,753 bytes; RAN wc)
L = line in the HTML. RAN = measured now; READ = from reading code.

## 1. Header editing rules (L4-35)
0 Motion budget: one page-scroll-linked element per tab; scroll reflects, clicks select; transform/opacity only, 500ms cap; still layout must be complete.
1 Never rewrite whole file; targeted edits; app must work after each.
2 Font sizes/colours/status via :root tokens only.
3 New advisor signals go in SIGNAL_DEFS, never hand-wired into getRecommendedAction / getCustomerNextSteps / getPortfolioAdvisorInsights.
4 Structural data-shape change => new CURRENT_SCHEMA_VERSION + migration step in migrateData(); do not extend backfillCustomerRecord for new-shape changes.
5 After any edit run window.runSelfChecks(); all checks must pass.
6 Preserve scoring/risk logic (computeRisk, healthScore, gates) unless objectively wrong.

## 2. Import repair (RAN: probe-seed.js run through tools/selfcheck.mjs --fn probeFn --verbose on demo seed)
Path: serializeBook(DATA) -> JSON -> prepareImportedData -> prepareBookData (L27226: normalizeActivityCollections L26837, migrateData, applyDataBackfills, repairAuxiliaryCollections, sanitizeImplementationRecords). Also prepareArchiveData L27249.
- Activity gong:{callId:'x'} and an arbitrary zzUnknownAct: KEPT (normaliser mutates in place, no whitelist). Same via archive path.
- Customer gainsight:{pulledAt:'x'}, gainsightId, zzUnknownCust: KEPT (book and archive paths).
- Unknown top-level key: KEPT.
- gainsightQueue item {status:'sent', externalId:'E1', sentAt, error, extra}: REBUILT at L27078-27085 to only {id,date,customerId,customerName,kind,payload,status:'queued'}. status forced to 'queued'; externalId/sentAt/error/extra STRIPPED. Items without string payload/customerName/real date dropped.
Consequence: unknown keys on activities/customers need no repair change; the queue normaliser must change if sent-state is to survive.

## 3. AI
callAiAPI L2038. Live call sites outside suite: 7 calls in 5 functions (dead generatePortfolioAiBrief L2175/L2202 excluded):
- L2297 generateCopilotRead (L2255): Copilot read
- L2516 generateCustomerAiBrief (L2507): call-prep brief
- L2896, 2897, 2899 generateSessionDebrief (L2859): debrief + score extraction + optional call review (3 calls)
- L19182 generateRiskSummaryAi (L19174): risk item summary
- L20740 generateThreadAnswer (L20727): draft answer to a thread
Single choke point: yes. callAiAPI dispatches to callClaudeAPI L2096 / callOpenAIAPI L2136 / callGeminiAPI L2061; the only AI fetch() calls are inside those (L2065, 2100, 2140). Other fetch: L1912 Workiva KB endpoint.
Keys in localStorage: 'obm-ai-settings-v1' (AI_SETTINGS_KEY L1716; one apiKey + model + answerInstruction; provider picked from model via aiProviderFor L~1954). Also 'obm-gainsight-settings-v1' (L1752, has apiKey) and 'obm-workiva-kb-settings-v1' (L1874, has apiKey).

## 4. Time saved (C6)
trackImpact defined L18599. Call lines outside suite (excluding comments L5329, L21737): 16: 2300 copilot_read; 2523 callprep_generated; 2939 debrief_generated; 18742 progress_report; 20743 question_drafted; 21393 activity_logged; 21736 session_backfilled(n); 23477, 23519 cta_drafted; 24034 card_edit; 24951 script_opened; 25036 activity_logged; 25727 gainsight_copy; 26710 progress_report; 27800 value_imported(n); 27944 partner_note_imported(n).
IMPACT_EVENTS (L18544), 13 keys: activity_logged, debrief_generated, callprep_generated, partner_note_imported, progress_report, script_opened, gainsight_copy, cta_drafted, copilot_read, card_edit, question_drafted, session_backfilled, value_imported.
DATA fields: DATA.impact {events,since} (legacy store, L18574-18583); DATA.impactLog [{date,key,n}] (MAX_IMPACT_LOG; migration L4927-4938; repair L27008-27014); DATA.config.impactMinutes (backfill L5149; editors L23568-23570, 23878-23881, 25976-25979).
UI surfaces: Settings "Time saved - reporting" L26198-26200 (renderImpactSettings L25913, rows L25918-25935, minute inputs L25927); CSV downloadImpactCsv L25943 (button L23899); time-saved text report button L26067 / handler L26237 -> downloadImpactReport L18739, buildImpactReport L18673; Today / day close: L20892 summary, L20913 "wrapped up" line, L20943-20946 "N actions - about X saved"; wrap-up modal figure L26041; manager progress report L26646; settings live refresh L23866/23884/23905.
Suite checks referencing them: 7 by my read (v58 impact L8947-8974; phaseB rows L12042; v67 quick log L13657; v97 digest block L15650-15671; v98 by-period L15676-78; v98 Copilot counted L15698-15700; v98 versioned L15730-32). +-1 on the v97 one.
SURPRISE: demo-seed.js L164 writes impact.events.gainsight_batch, a key not in IMPACT_EVENTS.

## 5. Suite extraction (C1)
_runSelfChecksInner: L8274 `function _runSelfChecksInner(){` to L16814 `}`; RAN: 537,958 bytes, 8,541 lines (30.1% of file). Wrapper runSelfChecks L8270-8273; `window.runSelfChecks = runSelfChecks;` L16815; banner comment L8265-8269. `check` and `results` are defined inside the suite. No suite-only helper found outside it. `_suiteRunning` (L5417 let) is production code (L5360, 5419, 5423, 19898, 26511, 26543) and must stay in the main script. _dayTimelineCache/_dayDispatchChips (L8262-8263) are app state used by the suite.
Scripts: one inline classic script L1695-28281 (+ xlsx CDN L54). Only top-level IIFE is init L28261-28280. No modules. Top-level let/const/function are shared with a second classic script via the global lexical scope; nothing the suite needs was found inside an IIFE/block (not exhaustively proven; running the suite after the move would prove it).
Self-referential checks to watch: absolute L10941 reads document.scripts (non-src textContent joined) - fine for two inline scripts, wrong for a src= file; L15291 and L15779 test documentElement.innerHTML.slice(0,400000 / 0,1); L14491-14494 and L15644, L15746-15755 use String(fn).indexOf(...) on runSelfChecks/saveData etc. (runSelfChecks must keep the text `_suiteRunning = false`).
tools/selfcheck.mjs: spawns headless Chrome on a random debugging port with a temp profile and --allow-file-access-from-files, opens the file:// URL, attaches over CDP websocket, pins viewport 1440x900, polls until document.readyState==='complete' and window.runSelfChecks is a function, evaluates each --seed file inside a Runtime.evaluate IIFE (global scope, so DATA etc. visible) followed by saveData(), then calls window[--fn]() (default runSelfChecks) and reads its results array. It prints "<fn>: N/M passed", lists FAILs and console errors, exits 1 on any failure or total != --expect, 2 on harness failure.

## 6. T2/T1 rough sizes (the 12 dead functions were not listed to me; only named blocks measured)
Gainsight settings: L1747-1775 (~29) + UI L26153-26161 (~9) + handlers L26254, 26317-26320 (~10) + syncGainsightQueue L19236-19243 (~8) ~ 55-60. (L18040 also calls getGainsightSettings.)
Workiva scaffold: L1874-1952 (~79) + UI L26162-26172 (~11) + handlers L26259-26270, 26322-26326 (~20) ~ 110.
Signal calibration: renderSignalCalibration L7956-7994 (~39) + comments ~ 45.
Sum of the three ~ 210-215 lines; dead functions extra.

## 7. Activity save
ACTIVITY_TYPES L2969-2979 (Call, Email, EBR, Milestone Review, Risk / Escalation, Partner Sync, Implementation Note, Other). Full form renderLogActivityTab L23228; type select L23246; save handler L25003+.
G06 trap CONFIRMED, L23263: `${sessionOptions.map(n=>`<option value="${n}" ${n===nextSession?'selected':''}>Session ${n}</option>`).join('')}` with nextSession = nextOpenSessionNumber(c) L23229. Preselected whatever the type; no JS clears it on type change; save reads #act-session at L25009. Quick log (L21352) defaults type Call, has no session field.

## 8. gainsightQueue
queueGainsightItem L19228. Kinds: 'Success Outcome Plan' (L23356), 'At-Risk CTA' (L23413, L23517), 'Pending items batch' (L24474), 'Success Plan objective' (GOAL_GAINSIGHT_KIND L4625, queued L4634). 4 kinds.
Shape pushed L19230 and enforced by normaliser L27078-27085: {id,date,customerId,customerName,kind(default 'item'),payload,status:'queued'}.

## 9. demo-seed.js (183 lines, 10,276 bytes) RAN
17 accounts; 0 with gainsightId; 84 activities, 13 type Call; gainsightQueue empty; impactLog empty; impact.events keys activity_logged + gainsight_batch.

## 10. Baseline RAN
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 437 -> "runSelfChecks: 437/437 passed, 0 failed", exit 0, ~5.4 s wall.
Repo untouched (git status clean). Scratch: probe-seed.js, count-seed.js in this folder.
