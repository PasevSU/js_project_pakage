# Forensics package

This group contains the evidence inventory pipeline, NTFS image inspection,
source-identity comparison, and `email-evidence-js-core` with 25 evidence
processing functions. The email CLI reads maximum message size and decoded
body retention from this package's `configuration.yaml`.

From this directory, install declared dependencies and run a command:

```powershell
.\install-dependencies.ps1
node .\cli.js sha256 "C:\path\evidence.bin"
node .\cli.js ntfs-info "C:\path\disk-image.dd"
node .\cli.js compare-identity before.json after.json
node .\cli.js build-email "C:\path\message.eml"
node .\cli.js test
node .\cli.js audit
```

`ntfs-info` reads only the first 512-byte sector; it does not acquire or modify
the source volume. The EML builder refuses to overwrite its output and defaults
to `<input>.evidence.json`. Evidence files may contain sensitive data and
should be stored accordingly.

The audit still marks external PDF/image rendering, OCR, shape matching, and
irreversible PDF redaction as unqualified until those engines are supplied and
independently verified.
