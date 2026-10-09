# READY JavaScript packages

This tree is the sorted package collection from `_js_project_pak/new`. The
original package sources, upstream vendor sources, useful tests, package
metadata, licenses, and integration notes are grouped by responsibility.
`manifest.json` inventories the package files. Dependency caches and `.git`
metadata are intentionally excluded.

## Package layout

| Group | Contents and boundary |
|---|---|
| `01-core` | Core runtime, policy, preload, and capability utilities |
| `02-api` | HTTP/API, blockchain adapters, TSA, WKD, and API entry points |
| `03-data-cache` | Data synchronization and browser cache utilities |
| `04-transactions` | Transaction adapters, pagination, and cache |
| `05-forensics` | NTFS and identity tools plus the email evidence core |
| `06-hash-crypto` | CryptoJS-compatible algorithms, modes, encoders, and padding |
| `07-ots` | Active OpenTimestamps integration and queue |
| `08-pdf-report` | Browser report engine and YAML-configured Node PDF generator |
| `09-ui-app` | UI, forms, and admin application modules |
| `10-pgp` | PGP adapter and CLI proxy to the OpenPGP runtime |
| `11-runtime-vendor` | Browser/vendor bundles; inspected, not executed by its CLI |
| `12-cli-build` | Build and module tooling, with missing inputs explicitly reported |
| `13-tests` | Regression suites and test profiles; not production runtime |
| `14-archive-tools` | Archive creation, checkpoint, Mempool, OTS, and verification helpers |
| `15-openpgpjs` | Preserved upstream OpenPGP.js source and project CLI |
| `16-mempool-js` | Preserved upstream Mempool.js source and project CLI |
| `17-javascript-opentimestamps` | Preserved upstream OpenTimestamps 0.4.9 source |
| `90-legacy-pakages` | Read-only historical CryptoJS, OTS, and PGP archive |

`15-openpgpjs`, `16-mempool-js`, and `17-javascript-opentimestamps` preserve
their upstream implementations separately from the active application
boundaries. The active `07-ots` runtime remains pinned to OpenTimestamps 0.4.6.
This avoids silently replacing a working integration with a different
upstream version.

## Installers and configuration

Every package group has `install-dependencies.ps1` and
`install-dependencies.bat`, plus a `configuration.yaml` with package-specific
settings. Run either installer to check declared dependencies; missing
packages are installed according to that YAML file.

The shared `Install-PackageDependencies.ps1` helper checks nested package
manifests while skipping `node_modules` and `.git`. If a group has no
`package.json`, the installer reports that there is nothing to install. The
`dependencies` configuration supports `enabled`, `packageManager` (`auto`,
`npm`, `pnpm`, or `yarn`), `includeDevDependencies`, and `installMode`
(`install`, `ci`, or `frozen`).

Read a package's parsed configuration as JSON, for example:

```powershell
powershell.exe -NoProfile -File .\READY_JS_PACKAGES\15-openpgpjs\get-configuration.ps1
```

## Package CLIs

Run a package CLI from the repository root with
`node READY_JS_PACKAGES/<group>/cli.js <command>`.

| Package | Commands |
|---|---|
| `01-core` | `info`, `self-test` |
| `02-api` | `request`, `serve` |
| `03-data-cache` | `inspect`, `check` |
| `04-transactions` | `page <url-template>` |
| `05-forensics` | `sha256`, `ntfs-info`, `compare-identity`, `build-email`, `test`, `audit` |
| `06-hash-crypto` | `hash`, `self-test` |
| `07-ots` | `stamp`, `upgrade`, `verify`, `info`, `queue` |
| `08-pdf-report` | `validate`, `hash`, `create` |
| `09-ui-app` | `list`, `check` |
| `10-pgp` | Proxy: `keygen`, `inspect`, `encrypt`, `decrypt`, `sign`, `verify`, `self-test` |
| `11-runtime-vendor` | `list`, `inspect` |
| `12-cli-build` | `modules`, `plan`, `check` |
| `13-tests` | `list`, `run` |
| `14-archive-tools` | `verify`, `check-builder`, `build`, `test` |
| `15-openpgpjs` | `keygen`, `inspect`, `encrypt`, `decrypt`, `sign`, `verify`, `self-test` |
| `16-mempool-js` | `fees`, `address`, `transaction`, `block` |
| `17-javascript-opentimestamps` | Upstream `info`, `stamp`, `verify`, `upgrade` |
| `90-legacy-pakages` | Read-only `list`, `inspect` |

The OpenPGP.js and Mempool.js compiled outputs are included in this snapshot.
Install their dependencies before runtime operations, and rebuild with
`npm run build` (plus `npm run build-types` for OpenPGP.js) after changing
upstream source. Browser packages expose inspection or validation commands
where their actual runtime depends on a browser DOM.
Network-backed OTS, Mempool, and archive commands contact configured external
services; local tests and inspection commands do not.

## Important limits

- OpenPGP.js and Mempool.js are preserved upstream sources with compiled
  outputs; source edits require rebuilding those outputs.
- Archive construction requires a complete configuration and network access.
  The supplied archive inputs are preserved, and the CLI reports missing
  configuration rather than inventing chain settings.
- The forensic audit deliberately reports external renderer, OCR, matcher,
  and irreversible PDF-redaction qualification as blocked until those engines
  are independently supplied and verified.
- Dependency installation reported upstream audit advisories in the pinned
  trees: 15 for `07-ots`, 33 for `15-openpgpjs`, and 43 for `16-mempool-js`.
  Dependencies were not broadly upgraded because that would change the
  preserved upstream package versions; review and remediate these findings
  before production use.
- Browser/vendor and legacy CLIs inspect or catalogue files; they do not
  execute arbitrary bundles or archived scripts.

The package-specific README files describe integration details and runtime
requirements. The JSON inventory is generated from the sorted package tree;
refresh it after adding or removing package files.

Run `node READY_JS_PACKAGES/13-tests/cli.js run` to execute the local
regression suite. It also checks that every package group is inventoried and
has a loadable configuration, dependency installers, and a working CLI help
entry point, and it exercises digest vectors and nested build-module
dependency resolution.
