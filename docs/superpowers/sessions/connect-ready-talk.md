# Session prompt: "connect-ready" (the talk)

Start a fresh Claude Code session in this repo with:
`read docs/superpowers/sessions/connect-ready-talk.md and do it`
The instructions are everything below the line.

---

**Objective (Ian, 2026-10-02, verbatim):** "It might take a while before i get any admin to provide anything. I just
want everything already setup so that all they would need to do is just help me connect it."

This is the **talk** half of the global rule "one objective, two sessions": brainstorm and write a spec with Ian.
Do not build. Invoke `superpowers:brainstorming` first.

## Where things stand (read these, don't trust this summary for numbers)

- Merged on `master` at `ae87192`: trim + connector run. Ledger: `docs/superpowers/2026-10-01-trim-and-integration-LEDGER.md`.
  Spec: `docs/superpowers/specs/2026-10-01-trim-and-integration-design.md` (rulings R1-R10; Stage D real adapters out of
  scope, §7). Final review: `docs/superpowers/evidence/trim-and-integration/FINAL-REVIEW.md`.
- The connector (`connector/`) runs fake Gong, Gainsight and AI adapters on 127.0.0.1; `connector/CONTRACT.md` is what the
  tracker depends on. The tracker side ("Check for calls", "Refresh from Gainsight", "Send to Gainsight", "Brief my
  day") is built and tested against the fake.
- The admin ask: `docs/superpowers/drafts/connector-admin-ask.md`, published as a doc for Ian to share. It lists what each
  admin must create and marks eight items "to confirm with admin".
- Open blockers already ruled: **I-2** (full Gong transcripts in localStorage; Ian chose C: block the first real Gong
  adapter until real transcript sizes are measured; note in CONTRACT.md "Before a real Gong adapter"). **C-9** (retire
  browser AI) waits on a sanctioned AI key (R1). **A6** waits on re-saved pre-1.0 exports.

## The tension the talk must settle first

The admin ask says: "No real Gong or Gainsight adapter. Those get built only once credentials exist. An adapter that cannot
run against the real service would pass its tests without proving anything." Ian now wants the work done ahead of the
admin. Decide with Ian what can be built **honestly** before credentials exist, and how each piece is proven later.

Candidate pieces to put in front of Ian (options, not decisions):
- Real adapters written against the vendors' documented request/response shapes, tested on recorded-shape fixtures,
  marked UNPROVEN until a first live run; a one-command live smoke test (`connector --check`) that proves each adapter
  the day credentials arrive.
- A setup path the admin can follow alone: a config template with every field named, a step-by-step "connect" runbook
  per service (where to click, what to paste), and a self-test that says which step is missing.
- Safety for the first live writes: sandbox-first switch, dry-run mode for push, a per-day write cap.
- I-2 prep: a measuring tool that reports real transcript sizes on first connection, so the I-2 choice can be made.
- What stays out until credentials exist, and why.

Ask one question at a time. Research the vendors' public API docs where a fact is needed (targeted, cite what was opened;
mark what couldn't be confirmed). **Probe before you spec:** any count or threshold in the spec comes from a read-only probe.

## Output

A spec at `docs/superpowers/specs/2026-10-02-connect-ready-design.md` with Ian's rulings quoted verbatim, the measured
baseline, tasks small enough for the run (≤ 8 steps each), acceptance checks, and what is out of scope. Then write the
run's session prompt (`docs/superpowers/sessions/connect-ready-run.md`, same shape as `trim-and-integration-run.md`)
and stop. Never push or merge; Ian merges.
