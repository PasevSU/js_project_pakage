# OpenPGP integration

`cli.js` delegates to the separate OpenPGP.js 6.3.1 source package in `../15-openpgpjs`. It supports key generation, key inspection, file encryption/decryption, detached signing/verification, and a signed+encrypted round-trip self-test. Passphrases are read without echo from an interactive terminal. No key or message is written unless the destination path is new.

Build `15-openpgpjs` first with `npm ci`, `npm run build`, and `npm run build-types`. `pki-engine.js` is a distinct TSA certificate-validation helper and is not an OpenPGP implementation.