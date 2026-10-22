# C1 rules gap and 30-item bar stats (2026-10-22)

Source status: NO page was fetched or searched this session. Everything below is recalled background (tag: assumed) or hand arithmetic (tag: computed by hand). Confirm before relying on it.

## Q1 rules for coverage gaps
- Snorkel LF analysis reports per-LF coverage, overlaps, conflicts, and (with gold labels) empirical accuracy; LFs may abstain. Fix for uncovered rows = write new LFs/rules for them. (assumed; Ratner et al. 2017 "Snorkel", VLDB; Snorkel docs LFAnalysis)
- Rows where no rule fires have zero active features/votes; reweighting cannot change them: a linear model with all-zero features outputs only its bias/prior. (reasoned from logistic regression form, p = sigmoid(b + w.x), x=0; assumed, true by math if the rule features are the only features; not true if the LR also has other features such as n-grams.)
- Overfitting rules: develop on a dev split, look at errors there, keep a test split untouched and score once at the end; a rule written to fix a specific dev phrasing generalises only if it states the pattern (e.g. "feeds our X", "next month we go into", "For <audience>:") not the literal row. (standard practice, assumed)

## Q2 intervals (computed by hand, 95%, z=1.96, z^2=3.8416, n=30)
Wilson: centre=(p+z^2/2n)/(1+z^2/n); half=z*sqrt(p(1-p)/n+z^2/4n^2)/(1+z^2/n).
- 17/30 (p=.5667): 0.39 to 0.73 (centre .559, half .167).
- 27/30 (p=.9): 0.74 to 0.97 (centre .855, half .111).
- Clopper-Pearson (recalled, not computed; assumed): 17/30 about 0.37 to 0.74; 27/30 about 0.74 to 0.98.
- Reading: 17/30 is consistent with true rates 39% to 73%, so clearly below 90% but the true rate is unpinned. 27/30 is consistent with 74% to 97%, so passing the bar does not show a true rate of 90%.
- Bar power (binomial, rough, assumed): true rate 90% passes 27/30 about 65% of runs; true 80% passes about 10%; true 95% about 94%.
- Guidance (assumed): n=30 can only reject gross failure; a bar like 27/30 is a smoke test. To show a true rate >=90% at 95% confidence with zero or few failures you need larger n (zero failures needs n~29 for lower bound 90%, rule of three: 3/n). Use larger set (100+), or sequential testing (SPRT) to stop early.

## Could not confirm
Snorkel doc wording, exact Clopper-Pearson endpoints, power figures: not checked against a tool or source.
