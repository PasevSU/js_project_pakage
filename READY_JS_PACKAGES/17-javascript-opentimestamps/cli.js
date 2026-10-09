#!/usr/bin/env node
'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
const usage = `JavaScript OpenTimestamps 0.4.9 CLI
  node cli.js info <proof.ots>
  node cli.js stamp <file...>
  node cli.js verify <proof.ots> [--file FILE | --digest HEX]
  node cli.js upgrade <proof.ots>
  node cli.js --help`;
const args = process.argv.slice(2);
if (!args.length || args.includes('--help') || args.includes('-h')) {
  console.log(usage);
  process.exit(0);
}
const child = spawn(process.execPath, [path.join(__dirname, 'ots-cli.js'), ...args], { stdio: 'inherit' });
child.on('error', error => {
  console.error(`opentimestamps CLI failed to start: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});