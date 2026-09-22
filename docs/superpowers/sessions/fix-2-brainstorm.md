# Session prompt — Fix 2 (brainstorm + spec)

Paste everything below this line as the first message of a fresh Claude Code session in this repo.

---

Brainstorm **Fix 2** with me and turn it into a spec. **No code in this session.**

Load only:
1. `docs/superpowers/2026-09-22-fixes-LEDGER.md`
2. `docs/superpowers/specs/2026-09-22-fix-2-silent-customer-DECISIONS.md`: what was measured, plus the questions only I can answer

Use `superpowers:brainstorming`. Take the questions in that file one at a time, and give
your recommendation with each. Once I've answered, run a read-only probe (the
`node tools/sim/run-field-test.mjs` book, plus my real exported book if I provide one)
to count how many accounts or figures each chosen rule would move, and put those counts in
the spec (probe before spec).

Write the spec to `docs/superpowers/specs/2026-09-22-fix-2-<name>.md` in the same format as
the fix-1/3/4 specs: target metrics, required behaviour, code pointers. Add a metric for
it to `tools/sim/steps/99-measure.js` if one is missing. Then write
`docs/superpowers/sessions/fix-2.md` by copying `fix-1.md` and pointing it at the new spec.
Update the ledger row to "ready", then stop.
