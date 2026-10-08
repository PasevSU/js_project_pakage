# Forensics package

`email-evidence-js-core` contains the attached deterministic EML/evidence
pipeline and 25 evidence-processing functions. The EML CLI reads limits and
decoded-body retention from this package's `configuration.yaml`.

From this directory, install the package dependency and run:

```powershell
.\install-dependencies.ps1
node .\cli.js build-email "C:\path\message.eml"
node .\cli.js test
node .\cli.js audit
```

Outputs contain email evidence and may be sensitive. The builder refuses to
overwrite its output and defaults to `<input>.evidence.json`.
