# trim-verify (all RAN unless marked READ). File: osm-book-of-business-tracker-1.0.html, suite = L8274-16814.
Method: comments stripped with prior strip.mjs (output nc.html in this dir), per-function grep of stripped file, cross-checked by hand on raw file for all 12; grep for window[ = 0 hits; no onclick/handler-string hits; repo-wide grep shows only the html + an evidence doc mention these names.

## T1 CONFIRMED (12/12 transitively zero non-suite callers)
fn | def line / span | direct non-suite callers (code+handler strings) | suite refs | was for
- generatePortfolioAiBrief | 2175-2214 | 0 | 0 | old AI portfolio-brief summary under the band (button now calls generateCopilotRead)
- renderRiskRow | 17559-17587 | 0 | 0 | row of the old Risk hub list
- renderRiskOwnership | 17606-17623 | 1 (renderRiskRow, itself dead) | 0 | owner/due/trend strip in that row
- renderRiskNextSteps | 17632-17644 | 1 (renderRiskRow) | 2 (String(fn).indexOf introspection only) | next-steps block in that row
- riskTrend | 17598-17605 | 1 (renderRiskOwnership, dead) | 4 (real calls) | worsening/improving chip in risk row
- renderSignalCalibration | 7956-7983 | 0 | 3 (all String(fn).indexOf asserts) | signal-calibration panel (never wired to a tab)
- getSignalCalibration | 7919-7948 | 1 (renderSignalCalibration, dead) | 5 (1 real call L13514; rest introspection) | hit-rate stats from recommendationLog
- partitionRisks | 18965-18974 | 0 | 1 (L12719 real) | split risk hub into review-queue/rest
- removeOutcomeCriterion | 6849-6857 | 0 | 1 (L11001 real) | remove a custom outcome criterion from a plan (no UI)
- graduationDurability | 3363-3370 | 0 | 2 (L14775, 14789 real) | "% of graduations that held" portfolio read
- icsUnfold | 6456 (1 line) | 0 | 2 (L13813, 13840) | test-only inverse of ICS line folding
- openThreadsToText | 3409 (1 line) | 0 | 0 | join open threads to text (no use anywhere, suite included)
Comment L23578-23581 (v94 block): "The old generatePortfolioAiBrief() still exists and is still what fills the summary block under the band; this is the one the button reaches."
 -> Half FALSE: nothing calls generatePortfolioAiBrief (only its def); ui.aiPortfolioBrief is set only by it. "Still exists" true; "still what fills the summary block" untrue.

## T3 recommendationLog
Writers (non-suite): L7803-7805 logRecommendationEntry (init, unshift, cap 20); its callers L7815 resolveRecommendation, L7868 trackRecommendationPersistence (live path via getRecommendedAction).
Readers outside comments: L7922 getSignalCalibration only (itself dead, T1). L7805 reads .length for the cap (writer side).
Suite-only refs: L8437 (length<=20), L12986 (introspection), L13504 (fixture).
=> No reader reachable from non-suite code; log is write-only in the live app. CONFIRMED.

## T2
Gainsight settings: GAINSIGHT_SETTINGS_KEY='obm-gainsight-settings-v1' L1752; get L1753, save L1763 {enabled,domain,apiKey}. Readers: L18040 (Risk view -> renderGainsightQueueBlock(queue, gs); L18073 uses them only to choose note wording), L19238 syncGainsightQueue. UI: Settings modal "Gainsight integration (future use)" L26156-26160; saves L26254, L26317.
syncGainsightQueue L19237-19243 returns {ok:false, reason} only (not_enabled/not_configured/transport_not_built). Sole caller L23563 button #btn-attempt-gainsight-sync -> toast. No fetch near it; header says "nothing syncs today". User loses: Settings fields + a button that only explains it cannot sync + note wording. Gainsight QUEUE (export JSON) is separate and stays.
Workiva KB: key 'obm-workiva-kb-settings-v1' L1874, get/save L1875-1890 {enabled,endpoint,apiKey}. searchWorkivaKnowledge L1904, renderKnowledgeResults L1934. Sole non-suite caller: Settings "Test search" button L26273 (UI L26164-26170). It DOES do a real fetch(s.endpoint, POST, Bearer token) at L1912, but only to a user-configured endpoint, only on that button, and returns not_configured if disabled/invalid URL. No other consumer of results. Suite refs L8340-8341. User loses: Settings block + test box; no workflow.
Other fetch(: L2065 Gemini, L2100 Anthropic, L2140 OpenAI (AI feature), unrelated.

## T4
migrateData L4732. v<11 steps = v0->1 (L4734) through v10->11 (ends L4940/4941): 11 steps, ~208 lines. First 8 are `if(v < N)` (L4734,4740,4764,4785,4802,4816,4839,4861), then `if(v === 8/9/10)` (L4880,4902,4926); v===11 starts L4942.
OLD_GUESSED_OUTCOME_NAMES: def L5163-5170, used L5171-5172; runs every load (not version-gated).
LEGACY_TEMPLATE_KEYS: def L3850; used L3858, L4723, L5187-5189 (also ungated; 'Both' module rename L5178-5183, customer.module L5192). Suite L10687/10697 asserts shared use.
Pre-v38 backfills: L5155-5157 (pauseReturns, todayLastSeenIds, weeklySnapshot), ungated.
Release: `git show accc76e:osm-book-of-business-tracker-1.0.html` -> `const CURRENT_SCHEMA_VERSION = 11;` (L4102). CONFIRMED. HEAD = 15.
Disk search (Documents/Downloads/Desktop/OneDrive; skipped node_modules/.git/AppData; *.json containing "schemaVersion"). Book exports:
- C:\Users\teasp\Documents\Johnny Silverhand\book-of-business-export.json : 8 (PRE-1.0)
- C:\Users\teasp\Documents\Runway Tracker\book-of-business-RESTORE-POINT-2026-08-03.json : 2 (PRE-1.0)
- C:\Users\teasp\Downloads\book-of-business-export (5).json : 2 (PRE-1.0)
- C:\Users\teasp\Downloads\book-of-business-export (1).json : 13 ; ...\book-of-business-export.json : 13
Other hits unrelated (studio-harness evals, yunagi town state, schemaVersion 1). No book JSON in OneDrive.
=> Real pre-1.0 exports exist (3 files), so v<11 migrations are still exercised by real user data unless those files are disposable.

## T5
ADMIN_GAP_DEFS L5838 (rendered by renderAdminGaps in renderToday L21164, card "Records to bring up to date"; excludes graduated/paused/implementation):
 gradDate 'No committed graduation date'; outcome 'No Success Outcome Plan'; csat 'No CSAT contact'; readiness 'No readiness assessment'
 grad test: `missing: c => !c.targetGraduationDate`
GATE_DEFS L7282 (via missingGates/missingGatesText: heatmap card L18240, account snapshot L22237, overview Gaps L22479, AI/copilot text L2026/2392/2412/7738, report categorize L26605; getBatchingOpportunities L19909):
 sentiment 'Readiness Assessment'; outcomePlan 'Success Outcome Plan'; gradDate 'Graduation date SLA' (isPaceOutcome); csat 'CSAT contact'
 grad test: `isMissing:c=>isGradDateWithinTolerance(c)===false`
pendingGainsightItems compliance block L8167-8205 (consumers: todayActionList L20255, renderToday Gainsight section L21077, renderCustomerGainsightTab L21178, panel/overview L21983/L22413, L24471, report L26652):
 sentiment 'Log Sentiment via Readiness Assessment timeline activity'
 outcomePlan 'Create Success Outcome Plan (numbered outcomes 1–18)'
 CSAT 'Add Associated People for CSAT survey (Graduation Handoff call)'
 grad: `Estimated graduation date is ${N} days later than/earlier than target — update in Gainsight`; test `const withinTolerance = isGradDateWithinTolerance(c); if(withinTolerance === false)`
Two different grad-date tests: ADMIN_GAP = date absent; GATE_DEFS and pendingGainsightItems = date present but drifted. A comment at ~L7270 notes complianceScore() has yet a third semantics. Labels differ for every gate across the three lists.

## Baseline (RAN)
node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js --expect 437 (README.txt L136)
=> 437/437 passed, 0 failed; exit code 0.
