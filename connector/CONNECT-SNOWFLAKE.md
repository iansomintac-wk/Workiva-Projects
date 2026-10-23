# Connecting Snowflake (CSAT)

The live Gainsight and Snowflake connection waits on Ian's internal team (credentials and access); until then the tracker works fully offline and by file import (CSV or JSON), and the fake connector sends nothing anywhere.

The snowflake slot is served by the fake adapter unless `snowflake.adapter` is `snowflake-sql`. The fake's `listCsat` returns rows from `connector/fixtures/snowflake-csat.json`, over `GET /v1/csat`. Nothing leaves your machine.

`snowflake-sql` is built (Snowflake SQL API v2, key-pair JWT, Node built-ins only, no install) and unproven: `/v1/health` shows `snowflake-sql (unproven)` until `node connector/server.mjs --check` reads from your account. `--check` prints the number of rows only, never a row value, and then records the proof. On `config.example.json` every Snowflake step prints SKIP.

## What stage 2 fills in

The first adapter was stage 2 (parked); `snowflake-sql` now fills that slot with no change to the route, the schema (`schemas/csat.json`) or the tracker. Config fields, all empty in `config.example.json`: `account`, `user`, `role`, `privateKeyFile`, `sqlFile`, `warehouse`, `database`, `schema` (`table` and `tokenFile` are older placeholders and unused). `sqlFile` holds one read-only SELECT that returns the five columns below.

## Request for the Snowflake admin

Please:

1. Attach the public key (the `.pub` half of an RSA key pair; the private half stays with Ian) to the Snowflake user named in `snowflake.user` (`ALTER USER ... SET RSA_PUBLIC_KEY=...`).
2. Give that user a read-only role with USAGE on the warehouse, database and schema, and SELECT on the CSAT table or view only. No INSERT, UPDATE, DELETE or DDL.
3. Tell us the account identifier and the warehouse name.

Whether a Snowflake network policy blocks this machine is UNCONFIRMED for this account. If `--check` fails with a 401 or 403, ask the admin to allow this machine's IP in the user's network policy.

## Column mapping

Each row has five fields, the same names as the tracker's CSAT import columns, so the import plan needs no rework:

| Row field | Tracker CSAT import column |
|---|---|
| `SALESFORCE_ACCOUNT_ID` | `SALESFORCE_ACCOUNT_ID` |
| `GAINSIGHT_COMPANY_ID` | `GAINSIGHT_COMPANY_ID` |
| `COMPANY_NAME` | `COMPANY_NAME` |
| `CSAT_SENT_DATE` | `CSAT_SENT_DATE` |
| `CSAT_ANSWERED_DATE` | `CSAT_ANSWERED_DATE` |

`since` keeps rows whose newest CSAT date (answered, else sent) is on or after it.

## Token handling

The private key lives outside the repo, in the file named by `privateKeyFile`. It is never put in `config.json` or in the repo, and neither the key nor the signed token is logged or printed. The signed token lasts at most one hour and is built fresh for each read.
