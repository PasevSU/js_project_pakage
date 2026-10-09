#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const parser = require('./parser.js');
const identity = require('./source_identity.js');

const packageDirectory = path.join(__dirname, 'email-evidence-js-core');
const usage = `05-forensics CLI (read-only except for generated evidence outputs)
  node cli.js sha256 <file>
  node cli.js ntfs-info <disk-image-or-volume>
  node cli.js compare-identity <left.json> <right.json>
  node cli.js build-email <input.eml> [output.json] [evidence-id]
  node cli.js test
  node cli.js audit

NTFS mode reads only the first sector. Raw acquisition is not started by this CLI.`;

function runCore(arguments_) {
  const result = spawnSync(process.execPath, arguments_, {
    cwd: packageDirectory,
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function main(args) {
  const [command, ...rest] = args;
  if (!command || ['help', '--help', '-h'].includes(command)) {
    console.log(usage);
    return;
  }

  if (command === 'sha256') {
    if (rest.length !== 1) throw new Error(usage);
    const file = path.resolve(rest[0]);
    console.log(JSON.stringify({
      file,
      bytes: fs.statSync(file).size,
      sha256: parser.hashFile(file)
    }, null, 2));
    return;
  }

  if (command === 'ntfs-info') {
    if (rest.length !== 1) throw new Error(usage);
    const file = path.resolve(rest[0]);
    const fd = fs.openSync(file, 'r');
    try {
      const sector = Buffer.alloc(512);
      const count = fs.readSync(fd, sector, 0, sector.length, 0);
      if (count !== sector.length) throw new Error('File is shorter than one sector.');
      console.log(JSON.stringify({ file, geometry: parser.bootSector(sector) }, null, 2));
    } finally {
      fs.closeSync(fd);
    }
    return;
  }

  if (command === 'compare-identity') {
    if (rest.length !== 2) throw new Error(usage);
    const left = JSON.parse(fs.readFileSync(path.resolve(rest[0]), 'utf8'));
    const right = JSON.parse(fs.readFileSync(path.resolve(rest[1]), 'utf8'));
    console.log(JSON.stringify({
      same: identity.exactSame(left, right),
      differences: identity.differences(left, right)
    }, null, 2));
    return;
  }

  if (command === 'build-email') {
    if (rest.length < 1 || rest.length > 3) throw new Error(usage);
    const resolved = rest.map((value, index) =>
      index < 2 && !path.isAbsolute(value) ? path.resolve(value) : value
    );
    runCore([path.join(packageDirectory, 'bin', 'build-email-json.mjs'), ...resolved]);
    return;
  }

  if (command === 'test') {
    if (rest.length) throw new Error(usage);
    runCore(['--test']);
    return;
  }

  if (command === 'audit') {
    if (rest.length) throw new Error(usage);
    runCore([path.join(packageDirectory, 'bin', 'audit.mjs')]);
    return;
  }

  throw new Error(`Unknown command: ${command}\n${usage}`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(`forensics: ${error.message}`);
  process.exitCode = 1;
}
