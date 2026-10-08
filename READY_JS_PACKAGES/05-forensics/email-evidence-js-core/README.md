# Evidence Object + EML Metadata Core (development build)

This package implements the deterministic **data core** discussed for the document/OCR/profile/anonymization system. It intentionally does **not** pretend that an external PDF renderer, OCR engine, shape matcher or PDF redaction engine ran when it did not. Those modules accept real engine results, validate them and place them at the correct manifest path.

The EML path is fully executable with Node.js only. `src/email/eml_parser.js` parses the supplied example EML, preserves ordered/duplicate headers, decodes its body, maps the Received chain, authentication headers, MIME structure, thread references and file/body hashes, and produces `examples/sample_email_evidence.json`.

## Run

```powershell
npm test
node .\bin\build-email-json.mjs "C:\path\message.eml" ".\message.json" "CASE-001"
node .\bin\audit.mjs
```

The package reads `05-forensics/configuration.yaml` for the maximum EML size
and whether decoded body text is retained in the output. The default output
path is `<input>.evidence.json`; existing evidence files are never overwritten.
Install this package's declared dependencies before running the configuration-
aware CLI.

## Color contract

- light-blue → `recognition.visual`: OCR may run, OCR text is not persisted, recognition object is persisted.
- yellow → `recognition.shape`: visual/shape object; after profile learning, text OCR is not used for that confirmed object.
- green → `semantic.text`: OCR text and semantic role persist.
- dark-blue → `semantic.structured`: field label/type/value/relationship persist.
- magenta → `identity.person`: identity layer; can overlap structured/semantic/shape objects.
- red → transient discard only; `11_red_zero_persistence.js` enforces zero persistence.
- hash selection is an independent mask, not a color/object class.

## Important release status

This is a **development core**, not a qualified forensic release. The included audit marks external-engine functions as `NOT_VERIFIED` until they are exercised end-to-end with the actual renderer/OCR/shape/redaction engines and independent output verification. No placeholder success is emitted.
