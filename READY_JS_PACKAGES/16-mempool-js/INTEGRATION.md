# Integration notes

Preserved `@mempool/mempool.js` 3.0.0 source, examples, package metadata,
compiled `lib/` output, and MIT license. Its active application integration
remains separate.

The checked-in package snapshot includes the TypeScript build output referenced
by `main` and `types`. `npm run build` completed successfully with the declared
toolchain. Install dependencies before invoking network-backed CLI commands;
those commands use the configured Mempool API.