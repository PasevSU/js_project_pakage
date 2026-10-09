# API package

The package root is safe to import and does not start either standalone server. ESM consumers use the root, `./api`, `./http`, or `./browser` exports. CommonJS consumers use the root exports; `createAPI()` and `loadHttpClient()` return promises because their implementations are ESM.

The `.js` copies of `api` and `http`, plus `web3.js` and `wkd-utils.js`, are preserved source files and are not package exports. Use the `.mjs` API exports instead. The standalone server scripts are not package exports and must only be started deliberately.

New components should use `HttpClient`/`API` rather than creating their own `fetch()` transport. Existing blockchain adapters are retained here as adapters; they are not the central transport.
