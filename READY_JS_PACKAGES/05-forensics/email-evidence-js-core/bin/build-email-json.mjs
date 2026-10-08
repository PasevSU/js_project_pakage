import fs from 'node:fs';
import path from 'node:path';
import { buildEmailEvidence } from '../src/email/build_email_evidence.js';
import { getEmailEvidenceOptions } from '../src/core/config.js';

const [input, outputArgument, evidenceId] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node bin/build-email-json.mjs <input.eml> [output.json] [evidence-id]');
  process.exit(2);
}
const output = path.resolve(outputArgument || `${input}.evidence.json`);
if (fs.existsSync(output)) {
  throw new Error(`Refusing to overwrite existing evidence output: ${output}`);
}
const bytes=fs.readFileSync(input);
const manifest=buildEmailEvidence(bytes,{filename:path.basename(input),evidenceId:evidenceId||null,...getEmailEvidenceOptions()});
fs.writeFileSync(output,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({output,source_sha256:manifest.source.hashes.sha256,headers:manifest.email.headers.ordered.length,received_hops:manifest.email.transport.hop_count,mime_parts:manifest.email.mime.part_count,attachments:manifest.email.attachments.length},null,2));
