# Connectors: how the slots work

Each external system is a slot with a small set of methods. Today every slot is served by a fake adapter that reads recorded-shape fixtures.

| Slot | Methods |
|---|---|
| gong | `listCalls` |
| gainsight | `listAccounts`, `push` |
| ai | `complete` |
| snowflake | `listCsat` |

## Plugging in a real adapter

1. Add the adapter module under `connector/adapters/` and register it in the `BUILT` entry in `adapters/index.mjs`. Names not in `BUILT` are refused.
2. Add its config block to `config.example.json` with empty placeholders only; real values go in your own config outside the repo.
3. Record the vendor's response shapes as fixtures under `connector/fixtures/vendor` (made-up IDs and names only).
4. Write tests that run under `test-net-guard` (`installNetGuard()`), which blocks non-loopback `fetch` so a test cannot reach the real network.
5. Give each response a schema in `connector/schemas`.

## Gainsight

See `CONNECT-GAINSIGHT.md`. Dry-run is the default: with `dryRun` true (as in `config.example.json`) nothing is sent, each item fails with the dry-run error, and the request is logged.
