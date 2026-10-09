# Integration notes

Preserved OpenTimestamps 0.4.9 source, tests, examples, package metadata, and
LGPL-3.0 license. This is intentionally separate from the active `07-ots`
integration, which remains pinned to 0.4.6.

The upstream package manifest points `main` to root `open-timestamps.js`. A
small CommonJS shim now forwards that entry to the supplied `index.js`, without
editing upstream implementation files. The `pasevsu-opentimestamps` CLI is
also registered in the package manifest. Install its dependencies before
running upstream operations; timestamping and verification require network
access to calendars or block explorers.