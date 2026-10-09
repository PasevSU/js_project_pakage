# Integration notes

Preserved OpenPGP.js 6.3.1 source, tests, documentation, lockfile, compiled
`dist/` outputs, and LGPL-3.0+ license. This is separate from the existing
`10-pgp` runtime integration and does not replace it.

The checked-in package snapshot includes the upstream Node and browser build
outputs. After installing dependencies, regenerate them with `npm run build`
and `npm run build-types`. The OpenPGP CLI self-test passed using Node.js 24;
the upstream package declares Node.js >=22 and recommends npm >=12 (the tested
environment used npm 11 and emitted a non-blocking engine warning).