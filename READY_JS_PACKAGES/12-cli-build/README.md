# CLI and build tools

This folder contains legacy build-tool sources, not a runnable package entry point. The old OTS `main.js` imported a missing manager and has been moved to `90-legacy-pakages/ots-cli-main.js`; do not invoke it as a supported CLI.

Use the installed `../07-ots` package for timestamp creation, upgrades, verification, inspection, and queue processing.
