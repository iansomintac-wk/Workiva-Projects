# Final-review fix F3 (doc-side Minors M6-M10)

Docs only; `osm-book-of-business-tracker-1.0.html` untouched. Numbering is the review's "Minor (13)" list.

- M6: README.txt Graduation plan section now says the log form's "Session # (of N planned)" deliberately shows the raw curriculum total.
- M7: README exit reasons replaced with the labels copied from `EXIT_REASONS` (tracker :4358): Goal met early, No more enablement needed, Paused or at risk, Other.
- M8: README says the Excel import bypasses the graduation confirm (P1). Checked the code first: import calls `changeStage` (existing) or assigns `stage` (new), never the confirm. Packet line at tracker :21170 gives "Graduated before goal tracking." when stage is graduated, no goals, and no graduation marker. An imported account that already has a goal would instead show that goal with no verdict; the README line is scoped to "with no goal".
- M9: VALIDATION.txt SHA block re-measured at head 6bb0a54, tree clean (`git status --short` empty).
  - Tracker: blob (`git cat-file -p HEAD:file | sha256sum`) and working tree (`sha256sum`) are identical: `3dab70bb...c713`, 1,751,637 bytes, 0 CR bytes. The old text claiming a CRLF working tree is now wrong for the tracker, so I corrected that paragraph.
  - Onboarding guide unchanged: blob 598bbb86..., 185,641; working tree 96cb2787..., 186,500 (859 CR lines).
  - Old figure 87151c04..., 1,642,357 was stale (the review's "dba4cefa / 1,739,634" for HEAD is also not the current value; measured now).
- M10: dated correction note added after spec §5 line and below the §8 table in `docs/superpowers/specs/2026-10-01-graduation-plan-design.md`; the §8 row points to it. The note says the "same counts" claim held for counts, not packet lengths. (No "same counts" phrase exists in the repo to edit; the note states it.)
- Extra: README Early exit now states the exit applies only while graduated (re-open keeps the stored exit but reads 5/8), matching F1 check `f1a`. CHANGELOG checked: nothing contradicts F1/F2, no change.

Runs (output under C:\Users\teasp\.claude\jobs\c810ab0e\tmp\):
- Suite: `runSelfChecks: 436/436 passed, 0 failed`
- Scenarios: `runGraduationScenarios: 6/6 passed, 0 failed`
