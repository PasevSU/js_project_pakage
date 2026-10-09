import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createPdfReport } from './configured-pdf-generator.js';
import { loadConfiguration } from './config.js';

test('creates a PDF using the YAML page and timestamp settings', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-report-test-'));
  try {
    const now = new Date('2026-01-02T03:04:05Z');
    const output = path.join(directory, 'report.pdf');
    const result = createPdfReport({
      title: 'Test report',
      text: 'Report body',
      output,
      configuration: loadConfiguration(),
      now
    });
    const bytes = fs.readFileSync(output);
    assert.equal(result.output, output);
    assert.ok(result.bytes > 100);
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    const pdfText = bytes.toString('latin1');
    assert.match(pdfText, /MediaBox \[0 0 595\.\d+ 841\.\d+\]/);
    assert.match(pdfText, /Generated: Jan 2, 2026, 3:04:05 AM/);
    assert.throws(
      () => createPdfReport({ title: 'Test report', text: 'Report body', output }),
      /already exists/
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('paginates body text instead of clipping it at the page bottom', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-report-pages-'));
  try {
    const configuration = structuredClone(loadConfiguration());
    configuration.settings.marginMm = 12;
    configuration.settings.fontSizePt = 12;
    configuration.settings.includeTimestamp = false;
    const result = createPdfReport({
      title: 'Long report',
      text: Array(2000).fill('Evidence detail line.').join('\n'),
      output: path.join(directory, 'long-report.pdf'),
      configuration
    });
    assert.ok(result.pages > 1);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI preserves report validation and hashing alongside YAML PDF creation', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-report-cli-'));
  try {
    const report = path.join(directory, 'report.json');
    const output = path.join(directory, 'report.pdf');
    fs.writeFileSync(report, JSON.stringify({
      schema: 'evidence-report/1',
      generatedAt: '2026-01-02T03:04:05Z',
      application: { name: 'test' }
    }));
    const cli = fileURLToPath(new URL('./cli.js', import.meta.url));
    const validate = spawnSync(process.execPath, [cli, 'validate', report], { encoding: 'utf8' });
    assert.equal(validate.status, 0, validate.stderr);
    assert.equal(JSON.parse(validate.stdout).valid, true);

    const hash = spawnSync(process.execPath, [cli, 'hash', report], { encoding: 'utf8' });
    assert.equal(hash.status, 0, hash.stderr);
    assert.match(JSON.parse(hash.stdout).sha256, /^[0-9a-f]{64}$/);

    const create = spawnSync(process.execPath, [
      cli, 'create', '--text', 'CLI report body', '--output', output
    ], { encoding: 'utf8' });
    assert.equal(create.status, 0, create.stderr);
    assert.ok(fs.existsSync(output));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
