# Logical JS package architecture

## Runtime flow

`01-core` -> `02-api` -> `03-data-cache` -> feature packages (`04-transactions`, `05-forensics`, `06-hash-crypto`, `07-ots`, `08-pdf-report`, `10-pgp`) -> `09-ui-app` -> `11-runtime-vendor`.

`12-cli-build` is a separate Node/build path and is not loaded by browser HTML. `13-tests` is test-only. `14-archive-tools` contains standalone Node archive utilities. `15-openpgpjs`, `16-mempool-js`, and `17-javascript-opentimestamps` preserve upstream source packages separately from active integrations; they are not automatically loaded. `90-legacy-pakages` is preserved source material and is not production-loaded.

## Package responsibilities

| Package | Responsibility |
|---|---|
| 01-core | shared runtime, policy, context, capabilities |
| 02-api | one HTTP/API transport and API facade |
| 03-data-cache | document/project loading and synchronization |
| 04-transactions | transaction pagination, IndexedDB cache, background refresh/prefetch |
| 05-forensics | evidence inventory and forensic enrichment stages |
| 06-hash-crypto | cryptographic primitives |
| 07-ots | OpenTimestamps operations |
| 08-pdf-report | PDF and report generation |
| 09-ui-app | application/UI/event/language layer |
| 10-pgp | OpenPGP and PKI runtime |
| 11-runtime-vendor | browser/vendor bundles |
| 12-cli-build | server launcher, CLI and build tooling |
| 13-tests | tests and profiling scripts |
| 14-archive-tools | standalone archive verification and date-bounded manifest builder |
| 15-openpgpjs | upstream OpenPGP.js 6.3.1 source, compiled runtime, and CLI |
| 16-mempool-js | upstream Mempool.js 3.0.0 source, TypeScript output, and CLI |
| 17-javascript-opentimestamps | upstream OpenTimestamps 0.4.9 source; separate from active 0.4.6 |
| 90-legacy-pakages | original package tree retained for reference |

## Production rules

1. HTML must not load tests, profiles or legacy packages.
2. Feature packages must not create their own HTTP transport.
3. API calls go through `02-api`.
4. Transactions render at most 100 records per page.
5. Transaction data is cache-first and refreshed in the background.
6. PDF/report generation consumes prepared data; it does not fetch transactions itself.
7. Forensic stages remain deterministic processing modules and do not own UI state.
8. OTS browser runtime and OTS Node CLI are treated as separate execution targets.
