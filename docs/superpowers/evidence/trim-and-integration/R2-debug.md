# R2-debug: console error "reading 'sentiment'" at 92d93ea

Root cause: the R2 check `gong r2-m1` (tools/selfchecks.js) puts bare `c3Customers()` fixtures (no `compliance`) in DATA.customers and clicks `#cp-add`. The Add handler calls `window.render()`; render -> todayActionRowMap -> todayActionList -> pendingGainsightItems -> `GATE_DEFS[0].isMissing` reads `c.compliance.sentiment` on a fixture with no compliance and throws. The throw is inside a click handler, so the check's try/catch never sees it; the CDP gate reports it as a page error and the runner exits 1 despite 465/465.

Not date-dependent (measured today, 2026-10-01 22:xx PDT): HEAD before fix = error; 94709d6 (R1) = 462/462 clean; 733a195 = 459/459 clean. The R2 builder's "also at R1" claim was false. The R2.md note calling it pre-existing was corrected.

Fix: r2-m1 stubs `window.render` around the click and restores it in `finally`. Product code untouched. Harness gate untouched. Mutation: stub line removed -> exit 1, same console error. Restored -> green.

Runs (measured now): demo seed 465/465 exit 0; demo + used-book 465/465 exit 0; scenarios 6/6; connector-e2e 7/7; c3 probe 12/12; c5 probe 12/12 (via `--fn c3ProbeResults` / `c5ProbeResults`).
Logs: C:\Users\teasp\.claude\jobs\805aa073\tmp\R2-debug\.
