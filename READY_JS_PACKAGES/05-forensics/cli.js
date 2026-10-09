#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageDirectory = path.join(__dirname, 'email-evidence-js-core');
const usage = `05-forensics CLI
  node cli.js build-email <input.eml> [output.json] [evidence-id]
  node cli.js test
  node cli.js audit`;
const [command, ...args] = process.argv.slice(2);

if (!command || ['--help', '-h', 'help'].includes(command)) {
  console.log(usage);
  process.exit(0);
}
if (!['build-email', 'test', 'audit'].includes(command)) {
  console.error(`Unknown command: ${command}\n${usage}`);
  process.exit(2);
}

const scriptArguments = command === 'build-email'
  ? [path.join(packageDirectory, 'bin', 'build-email-json.mjs'), ...args.map((value, index) => index < 2 && !path.isAbsolute(value) ? path.resolve(value) : value)]
  : command === 'test'
    ? ['--test']
    : [path.join(packageDirectory, 'bin', 'audit.mjs')];
const result = spawnSync(process.execPath, scriptArguments, {
  cwd: packageDirectory,
  stdio: 'inherit'
});

if (result.error) {
  console.error(`forensics: ${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
