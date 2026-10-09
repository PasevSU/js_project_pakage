# Legacy package archive

This tree preserves historical sources; it is not an installable or supported runtime package. Use the active implementations in `../06-hash-crypto`, `../07-ots`, and `../10-pgp` instead.

## Layout

- `cryptojs/` groups the legacy CryptoJS sources into core, algorithms, modes, padding, encoders, tests, profiles, and documentation.
- `ots/` contains the preserved OpenTimestamps source tree and archived CLI scripts. The old CLIs reference obsolete paths and are retained for reference only.
- `pgp/` contains a partial preserved OpenPGP source tree; its referenced implementation files are not all present.
- `CRC/` is retained from the original tree; no CRC implementation was present in it.
- `metadata/legacy-pakage.yaml` is the original package descriptor. Its paths describe the former layout and it is not used by the active packages.

Files are organized by role without changing their implementation. Legacy tests and performance profiles remain separate from the active test suite.
