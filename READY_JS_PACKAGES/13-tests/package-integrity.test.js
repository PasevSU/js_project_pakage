'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'manifest.json'), 'utf8'));
const packageGroups = fs.readdirSync(packageRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^(?:\d{2}|90)-/.test(entry.name))
  .map(entry => entry.name)
  .sort();

test('package manifest lists every maintained package group', () => {
  assert.deepEqual(Object.keys(manifest.groups).sort(), packageGroups);
  const listedFiles = Object.values(manifest.groups).flat();
  assert.equal(listedFiles.length, manifest.file_count);
  for (const [group, files] of Object.entries(manifest.groups)) {
    for (const file of files) {
      assert.ok(
        fs.existsSync(path.join(packageRoot, group, file)),
        `manifest entry is missing: ${group}/${file}`
      );
    }
  }
});

test('every package exposes its documented integration surfaces', () => {
  for (const group of packageGroups) {
    const directory = path.join(packageRoot, group);
    for (const file of ['cli.js', 'configuration.yaml', 'get-configuration.ps1', 'install-dependencies.ps1', 'install-dependencies.bat']) {
      assert.ok(fs.existsSync(path.join(directory, file)), `${group} is missing ${file}`);
      assert.ok(manifest.groups[group].includes(file), `${group}/${file} is not in the package manifest`);
    }

    const configuration = fs.readFileSync(path.join(directory, 'configuration.yaml'), 'utf8');
    assert.match(configuration, new RegExp(`^  id:\\s*${group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'));

    const result = spawnSync(process.execPath, [path.join(directory, 'cli.js'), '--help'], {
      cwd: packageRoot,
      encoding: 'utf8',
      timeout: 15000
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${group} CLI help failed: ${result.stderr}`);
    assert.match(`${result.stdout}${result.stderr}`, /\S/, `${group} CLI help returned no usage output`);
  }
});
