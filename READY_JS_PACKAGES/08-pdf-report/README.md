# PDF report package

This package wraps jsPDF 4.2.1 to create simple text evidence reports. The
attached jsPDF archive contains package metadata and documentation but omits
the library's `src` and `dist` trees, so the package installs the published
jsPDF release rather than shipping an incomplete upstream checkout.

Run `install-dependencies.ps1` or `install-dependencies.bat` from this
directory to install jsPDF and the YAML parser, then create a report:

```powershell
node .\cli.js create --title "Evidence report" --text "Report contents"
```

The CLI reads page size, orientation, locale, output directory, title, font
size, margins, and timestamp behavior from `configuration.yaml`. It refuses
to overwrite an existing output file.
