# C1 threshold transfer (2026-10-22)

Tags: fetched = I read the page (abstract only here); knowledge = from memory, NOT checked this session (treat as unconfirmed).

1. Neyman-Pearson umbrella (Tong, Feng, Li, Sci. Adv. 2018, arXiv 1608.03109) [fetched, abstract]: capping empirical type I error at alpha is insufficient; classifiers can exceed alpha. Method (knowledge, unconfirmed): pick threshold as an order statistic of held-out class-0 scores so P(FPR>alpha) <= delta; needs min class-0 n (about log(delta)/log(1-alpha); ~59 for alpha 5%, delta 5%).
2. Conformal risk control (Angelopoulos et al., arXiv 2208.02814) [fetched, abstract]: controls expected value of any monotone loss, tight to O(1/n). Exchangeability assumption not shown in abstract; (knowledge) it is the usual assumption, so it fails under shift unless calibration set is deployment-like.
3. Clopper-Pearson upper bound on FPR [knowledge, unconfirmed]: with k FP of n negatives, use the one-sided exact binomial upper bound; with small n it is wide. Choose threshold so the UPPER bound <=5%, not the point estimate.
4. sklearn TunedThresholdClassifierCV [knowledge, unconfirmed]: tunes cutoff by CV; same-distribution only.
5. Ties / no evidence [knowledge]: a constant score cannot be split by any threshold; treat the tie group as one atom, either all "show" or all "abstain" (randomised rule only gives exact alpha). Practical: never show "no changes" for rows with zero rule hits; abstain.

Not confirmed: PDFs not read; no source found on tie handling specifically; 111-row set size and negative count unknown.
