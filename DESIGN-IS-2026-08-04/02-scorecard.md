# Scorecard — Today tab, tracker v71

Integers 0–3, equal weight, max 30. Ties broken downward. Worst instance scored, not the mean.

**1. Innovative — 2/3**
Evidence: E1 — chaptered severity narrative with a pinned working panel; no peer CS tool (Gainsight, Catalyst, Vitally, ChurnZero) ships a ranked day as narrative rather than a task queue.
Justification: a real advance on the queue, but the tab now runs the *same* pattern twice (`.dc-*` and `.story-*`) instead of advancing it — refinement of an existing pattern, not a new one held with restraint.

**2. Useful — 2/3**
Evidence: E1 — 5 of 18 accounts appear in three blocks; 16.4 viewports to reach "Also today". E5 — the focus pane does perform real writes (compliance gates, risk queue, thread resolution).
Justification: the primary task completes in place, but the adjacent surface adds passes — you meet the same account three times before you finish it once.

**3. Aesthetic — 1/3**
Evidence: E2 — 12 computed type sizes including two off-token orphans (`13.3333px` form-control default, `10.375px`); 416 inline `style` attributes; 30 rendered colours.
Justification: three or more systemic inconsistencies. The surface *looks* coherent, so this is a system failure rather than an ugliness failure — but header rule 2 exists precisely to prevent styling that lives in markup instead of tokens.

**4. Understandable — 2/3**
Evidence: E3 — chapter notes state the asserted/inferred boundary in plain words; every pick shows `severity N of 4 · signal <key>`. E5 — two visually identical dot rails address different collections.
Justification: individual controls read correctly; what needs a tooltip is the *relationship between blocks*, which is never stated.

**5. Unobtrusive — 1/3**
Evidence: E1 — 314 interactive elements for 18 accounts; the same account's controls repeat across three blocks; two dot rails.
Justification: chrome competes with content — not through decoration, but through duplicated affordance.

**6. Honest — 3/3**
Evidence: E3 — "counted, never estimated"; the asserted-vs-inferred chapter notes; verbatim citation enforcement that discards ungrounded AI claims mechanically; zero inflations, zero dark patterns, zero label→behaviour mismatches.
Justification: every claim, badge, and label maps 1:1 to actual behaviour, and the design goes further by naming its own uncertainty to the user.

**7. Long-lasting — 2/3**
Evidence: E2 — restrained palette, mono accents, systematic tokens; one dated marker in the oversized tight-tracked display headline.
Justification: one trend marker, otherwise no fad gradients, skeuomorph residue, or trend typography.

**8. Thorough — 2/3**
Evidence: E2 — focus-visible ✅, reduced-motion ✅, empty ✅, error ✅, success ✅, **disabled ❌**.
Justification: exactly one state missing on the audited surface.

**9. Environmentally friendly — 1/3**
Evidence: E4 — 927KB initial payload; 120KB of HTML regenerated per render including 14 invisible panes; 0 network requests; 0 idle animations; motion gated.
Justification: the byte anchor for this band is 500KB–2MB. Zero requests and gated motion are real mitigations, and the single file is the product's whole point — but the score reports what ships.

**10. As little design as possible — 1/3**
Evidence: E1 — 5×3 duplicated accounts; "This week" restates today inside it; two scrolly systems; 15 panes rendered to show 1.
Justification: well over five elements can be removed without breaking the task.

---

**Total: 17/30**
