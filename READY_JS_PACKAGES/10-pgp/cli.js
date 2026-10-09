#!/usr/bin/env node
'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
const executable = process.execPath;
const cli = path.resolve(__dirname, '..', '15-openpgpjs', 'cli.js');
const child = spawn(executable, [cli, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('error', (error) => {
  console.error(`openpgp CLI failed to start: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});