# PDF report package

This package keeps the browser report engine separate from the YAML-configured
Node PDF generator. Report preparation and blockchain/API transport remain
outside the renderer.

## Browser report engine

`report-engine.js` renders the application's OpenPGP technical report through
the browser-loaded jsPDF runtime. German and other Latin-1 text use built-in
fonts. For Bulgarian output, select a local TrueType `.ttf` font with Cyrillic
glyphs; it is read in the browser and embedded only in the generated PDF. JSON
export remains independent of font selection and canonical report hashes.

Load `report-engine.js` as a browser script after jsPDF and the report controls
are available. It exposes `window.PasevSUReportEngine`.

## Configured Node renderer

The attached jsPDF archive contained package metadata and documentation but
omitted its `src` and `dist` trees, so the Node renderer uses published jsPDF
4.2.1 rather than shipping an incomplete upstream checkout. Its implementation
is in `configured-pdf-generator.js`; the original browser application renderer
remains in `pdf-generator.js`.

Run `install-dependencies.ps1` or `install-dependencies.bat` from this
directory, then use the CLI:

```powershell
node .\cli.js create --title "Evidence report" --text "Report contents"
node .\cli.js validate report.json
node .\cli.js hash report.json
```

The CLI reads page size, orientation, locale, output directory, title, font
size, margins, and timestamp behavior from `configuration.yaml`. It paginates
long reports, writes atomically, and refuses to overwrite an existing output.
