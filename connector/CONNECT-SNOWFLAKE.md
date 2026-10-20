# Connecting Snowflake (CSAT)

Today the snowflake slot is served by the fake adapter: `listCsat` returns rows from `connector/fixtures/snowflake-csat.json`, over `GET /v1/csat`. Nothing leaves your machine.

## What stage 2 fills in

The real adapter is stage 2 (parked). It plugs into the same `listCsat` slot, so the route, the schema (`schemas/csat.json`) and the tracker side do not change. Its config fields, all empty in `config.example.json`: `account`, `warehouse`, `database`, `schema`, `table`, `tokenFile`. Until it exists, any adapter name other than `fake` is refused with "the real adapter is stage 2 (parked)".

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

The token lives outside the repo, in a file named by `tokenFile`. It is never put in `config.json` or in the repo, and it is never logged.
