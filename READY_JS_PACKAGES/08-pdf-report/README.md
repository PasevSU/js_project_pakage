# PDF report package

This package keeps the browser report engines separate from the YAML-configured
Node PDF generator. They share `pdf-style-standard.js`, which defines the A4
page geometry, navy/gray palette, typography, Unicode-font policy, table
treatment, pagination, report labels, and legal notice based on the supplied
PDF style modules and reference report. Report data preparation and
blockchain/API transport remain outside the renderers.

## Browser report engine

Load `pdf-style-standard.js` before `report-engine.js` or `pdf-generator.js`,
after jsPDF and the bundled `11-runtime-vendor/qrcode.js` provider, before the
report controls are used.
`report-engine.js` renders the application's OpenPGP technical report with the
shared page, palette, typography, QR sizing, and footer rules, and exposes
`window.PasevSUReportEngine`. For Bulgarian output, select a local TrueType
`.ttf` font with Cyrillic glyphs; it is read in the browser and embedded only in
the generated PDF. JSON export remains independent of font selection and
canonical report hashes.

## Configured Node renderer

The attached jsPDF archive contained package metadata and documentation but
omitted its `src` and `dist` trees, so the Node renderer uses published jsPDF
4.2.1 rather than shipping an incomplete upstream checkout. Its implementation
is in `configured-pdf-generator.js`; the original browser application renderer
remains in `pdf-generator.js`.

`configured-pdf-generator.js` imports `pdf-style-standard.js` directly and
embeds an available system Unicode font. If none of the documented font
candidates exists, generation fails explicitly rather than silently
substituting characters. It uses the bundled QRCode.js provider to encode the
full legal references into the notice panel. The shared standard uses the A4
portrait layout, separate footer safe area, a legal-notice panel,
wrapped/striped report tables, and page numbering.

Run `install-dependencies.ps1` or `install-dependencies.bat` from this
directory, then use the CLI:

```powershell
node .\cli.js create --title "Evidence report" --text "Report contents"
node .\cli.js validate report.json
node .\cli.js hash report.json
```

The CLI reads page size, orientation, locale, time zone, output directory,
title, font size, margins, and timestamp behavior from `configuration.yaml`.
It paginates long reports, writes atomically, and refuses to overwrite an
existing output.
