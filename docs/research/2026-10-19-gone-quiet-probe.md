# Gone-quiet probe on the sim book (tracker 1.1)

Date 2026-10-19. Read-only. No tracker, tools/ or test/ file touched. Probe script: `C:/Users/teasp/.claude/jobs/3dbea68d/tmp/probe.mjs` (imports the sim's launch/setupA/setupB/PART_A/PART_B by absolute path, wraps `ctx.openOn` so each fake-date move is measured, evaluates the rule in the page with the tracker's own `todayISO`, `lastActivityDate`, `isPaused`, `todayActionList`, `healthScore`, `accountValueWeight`). Raw output: `probe-A.json`, `probe-B.json`, `summaryB.txt` in the same folder.
Labels: measured = run just now against 1.1; read = from code.

## Rule as probed

Fires when: not paused now, a marker exists, 7 or more days since the marker, and no activity dated after the marker (activity on the marker date, i.e. the hand-off call itself, does not stop it). Marker = latest of hand-off date and pause end. Severity 4 is simulated by raising that account's Today row to 4 and re-sorting with the tracker's own comparator (read: 1.1:12034 region).

## 1. Fields (read)

- Hand-off: `customer.implementation.wentLiveOn` (set at Go-Live, 1.1:6241). Go-Live also re-anchors `customer.implementationDate` to the same day (1.1:6244, original kept in `implementation.originalAnchorDate`, 6239). The L5 hand-off call is also an ordinary activity (`type 'Call'`, `sessionNumber null`, steps-b.mjs L5) but nothing marks it as "the hand-off call"; the Go-Live date is the only marker. Measured: Fernhollow `wentLiveOn` 2026-10-05, the only account in the book with one.
- Pause: `customer.pause = {until, reason, setOn}` (1.1:6113, saved 16177). The pause lasts through the end of `until` (`isValidPauseRecord`, `until >= today`). Its end is `pause.until`.
  - After it lapses, `clearExpiredPauses` deletes `c.pause` (6156) and keeps only `DATA.pauseReturns {id,name,date}` for 14 days (6155, 6160). A manual resume deletes `c.pause` and writes nothing (16182). So a rule that needs "when the pause ended" cannot read it from the saved book after 14 days, or ever after a manual resume. It needs a new stored field (for example `pausedUntilWas`), or it must be taken from `pauseReturns` and only work for 14 days.
  - L7: pause set 2026-10-26, `until` 2026-11-30 (steps-b.mjs CAL.L7).

## 2. Activity (read, plus measured)

- `DATA.activities[customerId]` = array of `{id, date, type, summary, checklist, sessionNumber, flagged, transcript?}`. Types (1.1:3391): Call, Email, EBR, Milestone Review, Risk / Escalation, Partner Sync, Implementation Note, Other. `lastActivityDate` (6061) takes the max past-dated `date` of any type.
- There is no direction field (no sent/received, no customer-side flag). Emails out and notes are the same kind of record. I found no separate store for sessions or sent emails (DATA keys do not list one; this is read, not exhaustively enumerated).
- "Customer-side only" therefore has to be a proxy by type. I used the session-capable types (everything except Email, Partner Sync, Implementation Note; `isSessionCapableType`, 3407). This is an assumption.
- Measured: reading (a) any logged activity and reading (b) customer-side by type gave identical firing lists on all 81 measurements (72 distinct days). Outbound-only contact does not change whether the rule fires on any sim day.
- C3 (hand-off 2026-10-05): (a) and (b) both fire 2026-10-12 through 2026-10-26 (15 days; measured). The only activity logged in the window is the hand-off call itself. On 10-27 the account is paused (L7 pause set 10-26), so it stops.
- L7: pause ends after 2026-11-30. 7 days later is 2026-12-07. The L7 step stops at 2026-12-01 (1 day after the pause) and L8 logs an activity on 2026-12-02, so under (a) and (b) the rule never fires for the L7 return in the sim (measured: Fernhollow not in the fired list on 12-01, 12-02 or 12-07). Under the literal rule L7 stays FAIL: `l7Judge` (steps-b.mjs:120) wants a silence row on screen on 12-01, and `SILENCE_SRC` (103) does not list a new source either. If the intent is L7 PASS, the 7-day wait after a pause is too long for that step, or the step window moves. Not settled.

## 3. Flood count (measured)

Part A (2026-10-21, 35 accounts): 0 fired, under both readings. 27 ranked rows, 3 already severity 4. One base account is paused until 2026-10-31 and nothing is Gone-Live.

Part B (72 distinct fake dates, 81 page opens; 34 accounts, 35 after L1):

| | readings (a) and (b) |
|---|---|
| max accounts firing on one day | 2 |
| median per day | 1 |
| days with 0 | 3 (08-03, 08-05, 08-12) |
| days with 1 | 54 |
| days with 2 | 15 (2026-10-12 to 10-26) |
| fired accounts landing in top 15 | all of them (1 or 2 per day) |
| existing rows pushed past 15 | 1 on 16 days (2026-08-24 and 10-12 to 10-26), else 0 |

Who fires:
- Fernhollow, hand-off marker, 10-12 to 10-26. Old rank 30, new rank 1 (health sorts it first among severity 4).
- Tidewater Hospitality Group (a base account), pause marker 2026-08-13, from 08-24 to the end of the run (2027-01-25). It is silent after its pause ended, so it fires on 69 days with no end. Old rank 16 on 08-24 (so it was hidden, now rank 3), 8 to 11 on later days. Note the rule never expires: an account that stays silent stays at severity 4 for months.

Context that matters for the 15 cap: the book already has 25 to 26 severity-4 rows on most Part B days (18 on 09-21). The severity-4 band alone exceeds 15 from about 09-21, so a new severity-4 row only displaces a non-fired row when it outsorts the rows near the cap. Health order decides, not the new source. Rank here is `todayActionList()` position (read: `DAY_BEAT_MAX = 15`, 1.1:12108; day calls merge before the cap, 12224-12254), so calls booked that day can push one more work row out; Part A has 3 calls booked on 10-21 but 0 fires.

Caveats: each date is measured at page open, before that day's steps log activity. The sim moves forward only through dates its steps visit; days between (for example 11-30 to 12-07 apart from L8) were not opened.

## 4. Double row (read)

One row per account. `todayActionList` loops customers, takes `cands = todayAccountCandidates(c)`, returns early if none (1.1:11991) and pushes a single row from `top = cands[0]` (11992). `todayAccountCandidates` sorts candidates by severity descending (11968), a stable sort. So an account with gone quiet (4) and a later stalled (2 or 3) keeps one row, headed by gone quiet. Lower candidates ride on it as `alsoWaiting` chips (de-duplicated by tab). The pitch's assumption holds. Not run as a live test, because it needs the new source to exist.

## Not settled

- L7: the 7-day wait after a pause ends does not reach 2026-12-01 (above).
- Customer-side contact cannot be told from outbound without a direction field; reading (b) is a type proxy.
- Pause end is not durable in saved data (above).
- Tidewater's permanent firing is an unrequested side effect of treating every old pause end as a marker; a rule limited to the first N days after the marker would avoid it. Not probed.

## Rerun with the ruled rule

Measured 2026-10-19 with `tmp/probe2.mjs` (raw: `probe2-B.json`), 1.1 only, same 72 fake dates (the L7 step opens every day 10-27 to 12-01, so `clearExpiredPauses` ran on 12-01). Rule: hand-off marker `implementation.wentLiveOn`, fires from marker+7 while no activity dated after it, no expiry. Pause marker = a `DATA.pauseReturns` entry read from the page (nothing remembered by the probe), fires from the entry's date while no activity dated on or after it, ends when the tracker prunes the entry. Any logged activity; severity 4; re-sorted with the tracker's comparator. The customer-side-by-type reading is identical again.

- Fernhollow on 2026-12-01: pause entry dated 12-01, old rank 28, new rank 1, so within 15. It also fires 12-02 at open (before L8 logs), then stops. It pushes 1 existing row past 15 on both days. "In a day step" is not measured: the new source does not exist in the page, so the L7 on-screen check cannot be rendered. Rank 1 is inside the cap (read: `DAY_BEAT_MAX` 15, 1.1:12108); calls booked that day still merge ahead of it.
- Hand-off path: Fernhollow fires 10-12 to 10-26, as before.
- Per day (72 dates): max 1, median 0. 54 days fire nothing, 18 fire one account (Fernhollow 17 days, Tidewater 1). Every fired account lands in the top 15. One existing row is pushed past 15 on 18 days (08-24, 10-12 to 10-26, 12-01, 12-02), never more than 1.
- Tidewater: fires on 1 day, 2026-08-24 (its pause entry is written when the page opens that day; the next visited date, 09-21, is past the 14-day prune). Old rank 16, new rank 3. The permanent firing is gone.
- Part A (10-21) not rerun: no hand-off marker and no pause entry there, so 0 fires (read from the earlier measured run).
