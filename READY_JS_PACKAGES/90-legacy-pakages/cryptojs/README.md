# Legacy CryptoJS sources

Historical CryptoJS modules are grouped here by function. These are preserved source files, not a configured package; use `../../06-hash-crypto` for the active hash and cipher modules.

- `core/`: shared core, cipher core, typed arrays, and 64-bit word support
- `algorithms/`: hashes, ciphers, HMAC, and key derivation
- `modes/` and `padding/`: block-cipher modes and padding implementations
- `encoders/`: encoders and format helpers
- `tests/` and `profiles/`: legacy YUI tests and performance profiles
- `docs/`: the original CryptoJS documentation and cipher notes

The source distribution does not include a `mode-cbc.js`, `pad-pkcs7.js`, or standalone DES implementation; corresponding tests/profiles are retained as found.
