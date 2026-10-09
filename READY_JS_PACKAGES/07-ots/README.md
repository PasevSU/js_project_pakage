# OpenTimestamps

The Node package entry exports the manager helpers and queue from `index.js`. Install its pinned OpenTimestamps runtime with `npm ci` in this directory. The package uses ESM consistently.

`npx pasevsu-ots stamp <file>` creates a proof using public OpenTimestamps calendars. `upgrade <file.ots>` advances a proof and preserves each changed prior proof in a uniquely named `.bak-*` file. `verify <file.ots>` verifies it against its neighboring original file (or `--file` / `--digest`); `info <file.ots>` inspects it without network access. Stamping and upgrades require calendar access. Verification requires a block explorer or local Bitcoin node when the proof contains a Bitcoin attestation; use `--explorer-url` to select an Esplora-compatible endpoint. Upgrading alone is not cryptographic verification, so run `verify` separately.

The browser adapter loads the local `opentimestamps.min.js` bundle first and uses the matching pinned CDN version only as a fallback. The placeholder file that contained a URL instead of JavaScript has been removed.

The old CLI sources are archived under `../90-legacy-pakages/`; they are not supported entry points. The production CLI is `cli.js`.
