# Scope

**Audited:** the Today tab of `osm-book-of-business-tracker-v71.html` (927KB, 14,009 lines, single file, `file://`-capable, localStorage).
Rendered at `http://127.0.0.1:8760/...#/today` against a synthetic 18-account book: 5 calls scheduled today, mixed stages, mixed severities.

**Primary user:** a Workiva Onboarding Success Manager running ~15–20 accounts through TTFV-1/TTFV-2 to graduation, alongside Gainsight. Meetings most of the day; minutes, not hours, between them.

**Primary task:** arrive at the tab, learn what today is, and *do* the work — call prep, Gainsight entries, risk creation/updates, compliance gates — without navigating away.

**Constraints:** no build step, no server, no dependencies. All type/colour via `:root` tokens (header rule 2). New signals via registries, not hand-wiring (rule 3). Shape changes require a schema bump + migration (rule 4). `window.runSelfChecks()` must pass (rule 5). Scoring logic preserved unless objectively wrong (rule 6).

**References supplied by the user:**
- `hadaka.jp` — edge-case parallax (Next.js + Tailwind + **Lenis** smooth scroll + **THREE.js**).
- `osm-runway-onboarding-v3.9.html` — the in-house guide's scroll technique.
- the tracker's own **curriculum engine** (session templates: `title`, `enable[]`, `deliverables[]`, authored runbook, verbatim-citation grounding).

**Known gaps:** scroll-driven activation cannot be verified in this automation context — a control experiment recorded zero IntersectionObserver and zero raw-scroll callbacks while `scrollY` moved 0→4041. All scroll behaviour below is reasoned from source and static measurement, and is marked where it matters.
