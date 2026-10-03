# Research: first live writes, test connections, idempotency (2026-10-02)

Method: vendor doc pages fetched 2026-10-02 (WebFetch summarises pages with a small model, so quotes are the summariser's rendering of the page, not byte-exact). Anything not opened on a vendor page is marked UNCONFIRMED. Not measured against a live Gainsight tenant.

## Stripe (test/sandbox keys, idempotency)
- https://docs.stripe.com/keys : every request runs in sandbox or live mode, "each mode has its own set of API keys, and objects in one mode aren't accessible to the other". Keys carry prefixes (`sk_test_`/`rk_test_` vs `sk_live_`/`rk_live_`). Sandbox writes are real records, but simulated and isolated. Promotion = swap the key plus a go-live checklist (linked, not opened). Live keys can only be revealed once; keys can be bound to access policies (IP/ASN).
- Same page: keys tagged as belonging to an autonomous agent are "automatically subject to approval rules", which require a designated reviewer to approve sensitive actions (payouts, refunds, config changes) before they take effect. Human gate on risky writes.
- https://docs.stripe.com/api/idempotent_requests : `Idempotency-Key` on POST; server saves status code and body of the first request for that key "regardless of whether it succeeds or fails", replays it (including 500s). Keys up to 255 chars, V4 UUID suggested; may be pruned after at least 24 hours; reuse with different parameters errors; results not saved if validation failed or a concurrent request conflicted (so those are retryable). GET/DELETE need no key.

## Terraform plan/apply (dry-run analogue)
- https://developer.hashicorp.com/terraform/cli/commands/plan : plan reads current remote state, diffs, proposes changes, and "does not actually carry out the proposed changes". `-out=FILE` saves the plan; `apply FILE` runs exactly that plan (intended for automation). Saved plan holds sensitive values in cleartext (relevant: our dry-run files must not contain the Accesskey). `-detailed-exitcode`: 0 no changes, 1 error, 2 changes present. `-refresh=false` skips the remote sync and may give an incomplete plan.
- Staleness check on apply of a saved plan: not confirmed from this page. UNCONFIRMED.

## Zapier ("Test step")
- https://help.zapier.com/hc/en-us/articles/8496257774221 : testing an action step is live: "Testing is live and may result in changes made in your app"; Zapier "will perform the action on your behalf". Test writes are real records. No dry-run; no promotion gate beyond the user turning the Zap on. No cap seen.
- (https://docs.zapier.com/platform/build/test-step returned 404.)

## Workato (test mode)
- https://docs.workato.com/en/recipes/testing.html : a test job uses real new trigger data and runs all unskipped steps. Page does not say whether actions write for real; it recommends sandboxes over production accounts. "Skip step" lets you exclude steps.
- https://docs.workato.com/en/recipes/start-and-stop.html : events picked up in test mode are not reprocessed once the recipe starts, "to prevent data duplication". Connection testing and Dev/Test/Prod promotion not found on these pages: UNCONFIRMED.

## Make.com
- https://help.make.com/scenario-settings : "Run once" does a single cycle; page does not say it is a dry run, and no dry-run mode is mentioned. "Store incomplete executions" pauses a failed scenario and lets you fix and resume from where it stopped, manually or automatically.
- https://developers.make.com/api-documentation : nothing on testing/dry-run.

## Gainsight CS (the actual target)
- https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Timeline_API/Timeline_APIs : auth is an `Accesskey` header (page says it does not expire). Singular insert: 200 calls/min; bulk: 12 calls/hour, 80MB per call; `x-ratelimit-limit` response header. `ExternalId` is unique per tenant: duplicates across requests are rejected (error `GS_TL_10_0107`); on update, ExternalId "serves as the idempotency key". So: reusing our item id as ExternalId gives restart-safe pushes for timeline activities.
- https://support.gainsight.com/Gainsight_NXT/Administration_and_Permissions/General_Administration/Gainsight_System_Limits : sync API 100 calls/min and 100,000/day; async (Bulk) 10 calls/hour and 100/day; 120,000 Success Plans/yr (warning at 100,000); 1.5M CTAs/yr. CONFLICT: Timeline page says 200/min singular, this page says 100/min sync. Plan to the lower number, and read `x-ratelimit-limit` at runtime. Whether ExternalId-style dedupe exists for CTAs and success plan objectives is not confirmed: UNCONFIRMED.
- https://support.gainsight.com/Gainsight_NXT/Administration_and_Permissions/General_Administration/Gainsight_Sandbox_Management : sandbox refresh copies all latest production data into the sandbox, stops all jobs on the old sandbox, issues a new Tenant ID; refresh limited to once per 90 days and can take up to 24h. Page does not cover sandbox-to-production migration. Consequence: a sandbox self-test may find production-shaped data, and the tenant/URL changes after refresh, so cache nothing by tenant.
- https://communities.gainsight.com/customer-insights-and-best-practices-349/gainsight-sandbox-best-practices-27865 (community post, not official docs): test in sandbox only, prefix sandbox items `[SBX]`/`TEST-`, peer review before promotion. Promotion via UI or X-Org migration tool is from a search snippet only: UNCONFIRMED.
- Whether the sandbox exposes the same API/Accesskey flow as production: UNCONFIRMED.

## HubSpot (developer test accounts)
- https://developers.hubspot.com/docs/getting-started/account-types : test accounts and sandboxes are isolated "without affecting any real HubSpot data"; test accounts "cannot sync data with other accounts" (no promotion path for data); developer test accounts expire after 90 days without API activity.

## Salesforce sandbox
- Official help page did not render (https://help.salesforce.com/s/articleView?id=sf.deploy_sandboxes_intro.htm). Nothing claimed. UNCONFIRMED.

## Patterns worth adopting for this connector
1. Plan then apply from a saved file: dry-run writes the exact vendor requests to a file; a live send replays that file, not a rebuilt request (Terraform `plan -out` / `apply FILE`). Redact the Accesskey from the file (Terraform warns plan files hold secrets in cleartext). Exit code 2 = "would change" is a handy convention.
2. Our item id is the idempotency key. Send it as Timeline `ExternalId` (Gainsight rejects cross-request duplicates with `GS_TL_10_0107` and treats ExternalId as the idempotency key on update). Persist a local ledger of item id to result so a restart replays the stored outcome, as Stripe does (cache first result, success or failure; do not cache validation failures; a changed payload under a reused key is an error). Stripe prunes after 24h, so do not rely on server memory. For CTAs and success plans dedupe is UNCONFIRMED, so lean on the local ledger. (Gainsight, Stripe)
3. Treat "test" as a real write, always: Zapier's test step is live, and Workato steers you to sandboxes because tests are not clearly side-effect-free. The self-test runs only against a sandbox tenant, writes `[SBX]`/`TEST-` labelled items (Gainsight community guidance), and has a clean-up step. (Zapier, Workato, Gainsight)
4. Gate production by mode: keep sandbox and live as separate credentials/tenant config the connector refuses to mix (Stripe separate key sets and prefixes). Production writes unlock only after a recorded sandbox self-test pass; a sandbox refresh issues a new Tenant ID and stops jobs, so invalidate the "passed" flag when tenant ID or URL changes. (Stripe, Gainsight)
5. Hard local caps from documented limits: stay under the lower of 100 calls/min (system-limits page) vs 200/min (Timeline page), read `x-ratelimit-limit`, and cap the first live run to a small batch behind an explicit user confirm. (Gainsight)
6. Failed pushes pause and resume instead of skipping or re-sending everything: keep failures in an inspectable queue and continue from the failure point (Make incomplete executions); do not replay what test already handled (Workato); add a human approval step for first live writes (Stripe agent-key approval rules as the model).
