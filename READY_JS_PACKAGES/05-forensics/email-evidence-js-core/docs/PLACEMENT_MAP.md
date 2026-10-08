# Placement map

Every module writes only to its owned manifest path. This prevents UI colors, OCR output, profiles and hashes from being mixed.

| # | JS module | JSON path owned | Rule |
|---|---|---|---|
| 01 | `01_canonical_source_rendering.js` | `rendering.canonical` | Records real renderer output; does not simulate rendering. |
| 02 | `02_line_geometry_detection.js` | `geometry.lines[]` | Vector/raster line observations. |
| 03 | `03_search_zones.js` | `geometry.search_zones[]` | Wide profile anchor/search zones. |
| 04 | `04_object_boundary_detection.js` | `geometry.object_boundaries[]` | Actual object bounds inside search zones. |
| 05 | `05_screenshot_provenance.js` | `objects[].capture` | Source/page/bbox/pixel and PNG hashes. |
| 06 | `06_blue_recognition_object.js` | `objects[]` | Blue: object persists, OCR text does not. |
| 07 | `07_yellow_shape_recognition.js` | `objects[]` | Yellow: shape/image descriptor; OCR only during profile learning. |
| 08 | `08_green_semantic_ocr.js` | `objects[]` | Green: OCR persists with semantic role. |
| 09 | `09_darkblue_structured_parsing.js` | `objects[].structured` | Dark-blue label/datatype/value/relations. |
| 10 | `10_magenta_identity_resolution.js` | `objects[].identity` | Identity layer can overlap another object type. |
| 11 | `11_red_zero_persistence.js` | no persistent red path | Red is purged before finalization. |
| 12 | `12_ocr_multipass.js` | `ocr.observation_sets[]` | Real 1+2+3 crop plan = six observations. |
| 13 | `13_bbox_remapping.js` | transform helper | Local crop → region/page coordinates. |
| 14 | `14_word_clustering.js` | computation | Clusters OCR words by geometry/text. |
| 15 | `15_disagreement_preservation.js` | `ocr.word_clusters[]`, `ocr.disagreements[]` | Keeps all conflicting OCR candidates. |
| 16 | `16_hash_selection.js` | `hash_selection.selections[]` | Independent hash mask; partial-token intersections exposed. |
| 17 | `17_raw_text_hash.js` | `hashes.raw_text.*` | SHA-256 over exact selected text bytes. |
| 18 | `18_canonical_text_hash.js` | `hashes.canonical_text.*` | Conservative NFC/line-ending normalization only. |
| 19 | `19_structured_hash.js` | `hashes.structured.*` | Deterministic structured-data hash. |
| 20 | `20_exact_visual_hash.js` | `hashes.visual.*` | Domain-separated RGB pixel hash + PNG hash record. |
| 21 | `21_anonymization_preview.js` | `anonymization.preview[]` | Review-first entity occurrence preview. |
| 22 | `22_irreversible_redaction.js` | `anonymization.redaction_plans[]` | Creates/verifies a real-engine redaction contract; never fakes PDF modification. |
| 23 | `23_profile_version_hash.js` | `profiles.document[]` | Versioned deterministic document-profile hash. |
| 24 | `24_identity_profile_version_hash.js` | `profiles.identity[]` | Versioned deterministic identity-profile hash. |
| 25 | `25_provenance_reconstruction.js` | `provenance.nodes[]`, `provenance.edges[]` | Reconstructable source→object→OCR→hash graph. |

## Email-specific superset

`src/email/eml_parser.js` extracts and preserves the RFC 822/RFC 5322/MIME evidence surface: ordered duplicate headers, Message-ID, From/To/Cc/Bcc, Date, Subject, In-Reply-To, References, Received chain, TLS observations present in Received, SPF/DKIM/DMARC/ARC result headers, MIME tree, transfer encoding, body hashes, attachments and quoted-thread metadata.

`src/email/build_email_evidence.js` places this under `email.*`, while file-level hash sets remain under `source.hashes` and provenance under `provenance.*`.
