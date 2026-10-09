# READY JavaScript package architecture

## Runtime boundaries

- `01-core` contains shared application logic and policy utilities.
- `02-api` owns HTTP/API transport and API adapters.
- `03-data-cache` owns document/project data loading and synchronization.
- `04-transactions` contains transaction pagination, cache, and orchestration.
- `05-forensics` contains forensic inventory, NTFS tooling, identity comparison,
  and the email-evidence core.
- `06-hash-crypto` contains the sorted CryptoJS-compatible algorithms and modes.
- `07-ots` is the active OpenTimestamps Node integration, pinned to 0.4.6.
- `08-pdf-report` contains both the browser report engine and the configured
  Node renderer.
- `09-ui-app` contains browser UI modules.
- `10-pgp` is the application-facing PGP/PKI adapter and CLI proxy.
- `11-runtime-vendor` contains browser/vendor assets and is not application
  logic.
- `12-cli-build` contains build and launcher tooling.
- `13-tests` contains regression tests and profiles, not production code.
- `14-archive-tools` contains the standalone archive builder and helpers.
- `15-openpgpjs`, `16-mempool-js`, and `17-javascript-opentimestamps` preserve
  their upstream source trees separately from active integrations.
- `90-legacy-pakages` is a read-only historical archive.

## Dependency direction

`core -> api/data -> domain packages -> ui`

The UI must not own forensic acquisition, cryptographic primitives, OTS server
operations, or Node filesystem access. Browser and Node entry points are kept
separate where their runtime requirements differ.

## Operational status

- The OTS queue, CLI, and manager are implemented and covered by local-calendar
  and local-Esplora tests. Live calendar and block-explorer access is required
  for production timestamp and verification operations.
- OpenPGP.js 6.3.1 and Mempool.js 3.0.0 source and compiled outputs are
  preserved. Their CLIs need dependencies installed; rebuild outputs after
  changing their upstream source.
- `17-javascript-opentimestamps` 0.4.9 has a root `open-timestamps.js` shim to
  its supplied `index.js`; it remains separate from the active 0.4.6 runtime.
- Archive helper tests use local mocks. Real archive creation requires an
  explicitly reviewed bounded date range and network configuration.
- External renderer, OCR, shape matcher, and irreversible PDF-redaction engine
  qualification remains blocked; the forensic audit does not simulate them.

## Production rules

1. HTML must not load tests, profiles, or legacy packages.
2. API calls go through `02-api`; feature packages do not create separate
   application transports.
3. Transaction rendering is paginated and cache-first.
4. Report generation consumes prepared data and does not fetch transactions.
5. Forensic processing remains separate from UI state.
6. Vendor and legacy CLIs inspect or catalogue files; they do not execute
   arbitrary bundles or archived scripts.
