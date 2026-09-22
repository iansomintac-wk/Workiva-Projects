# Fix 2 — A customer who has stopped replying looks healthy (DECISIONS NEEDED)

Status: **needs a brainstorm session with Ian before any spec or code.**
Source: the 2026-09-22 field test (https://claude.ai/artifact/WfeYTbKRhE5Tb4qj2qErsd).

## What was measured

Coastal Water Authority: last session 38 days ago, two unanswered follow-up emails
(24 and 14 days ago), and a "budget cut" mention in the 38-day-old session note.
The tool shows **Watch, "14 days since last touchpoint"**:

- `lastActivityDate()` (~4894) takes the newest activity of any type, so the OSM's
  own unanswered email resets the silence clock.
- The "budget cut" keyword aged out: `keywordSignalMaxAgeDays` is 30.
- No re-engagement play is suggested, although `PLAYBOOK_DEFS.reengage` exists
  for exactly this (signals `stalled`, `session_gap`).

Harness metrics (baseline): `fix2_coastalState = "watch"`,
`fix2_coastalReasons = ["Behind target","Watch"]`.

## Questions only Ian can answer

1. **What counts as contact?** Only customer-present types (Session, Call, EBR,
   Milestone Review)? Or also an email *they* sent? What about Partner Sync?
2. **How is "no reply" captured?** Options: (a) a "no reply yet" tick on email
   logs; (b) outbound emails never count as contact; (c) a new "Outreach" type.
   Each is a different amount of extra work per log.
3. **Should the silence threshold differ** from the existing 10 / 21-day watch and
   off-track thresholds?
4. **Should old risk words stay live** while the account is silent? The budget-cut
   mention aged out because nothing new was said. Silence arguably should *extend*
   the keyword window, not end it.
5. **What should the tool do** when it detects this? Offer the existing
   re-engagement play? Route to the AE? Both?

## Probe before spec

After Ian answers, run a read-only probe on the harness book (and, if he's willing,
his real exported book) to count how many accounts each definition would move.
Put those counts in the spec (Ian's "probe before you spec" rule).
