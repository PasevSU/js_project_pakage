# JavaScript package collection

This repository contains the complete sorted JavaScript package tree in
[`READY_JS_PACKAGES`](READY_JS_PACKAGES/README.md), including the package
sources, upstream libraries, tests, package CLIs, configuration files, and
dependency installers.

Start with the [package layout and runtime notes](READY_JS_PACKAGES/README.md).
The checked-in `READY_JS_PACKAGES/manifest.json` inventories package files.

```powershell
node .\READY_JS_PACKAGES\01-core\cli.js self-test
node .\READY_JS_PACKAGES\13-tests\cli.js run
```

OpenPGP.js and Mempool.js are preserved as upstream source packages and need
their documented build steps before their runtime CLIs can be used. Network
and browser requirements are documented per package.