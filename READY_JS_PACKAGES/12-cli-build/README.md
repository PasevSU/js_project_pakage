# CLI and build tools

The expected legacy jsPDF build source tree (`libs/`, `modules/`, and `plugins/`) is not included, so this package cannot emit a new bundle. Its CLI lists modules, resolves dependency order (including nested module IDs), and reports absent source files instead of claiming a successful build. The old OTS `main.js` imported a missing manager and has been moved to `90-legacy-pakages/ots-cli-main.js`; do not invoke it as a supported CLI.

Use the installed `../07-ots` package for timestamp creation, upgrades, verification, inspection, and queue processing.
