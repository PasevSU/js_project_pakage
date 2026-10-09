'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.resolve(__dirname, '..', '12-cli-build', 'cli.js');

function runCli(...args) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    timeout: 15000
  });
}

test('CLI build resolves nested module IDs and dependency aliases', () => {
  const result = runCli('plan', 'arabic');
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const { buildOrder } = JSON.parse(result.stdout);
  assert.ok(buildOrder.includes('modules/utf8'));
  assert.equal(buildOrder.at(-1), 'arabic');
  assert.equal(new Set(buildOrder).size, buildOrder.length);
});

test('CLI build reports omitted legacy sources rather than claiming readiness', () => {
  const result = runCli('check', 'modules/utf8');
  assert.ifError(result.error);
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ready, false);
  assert.ok(report.missing.some(item => item.module === 'modules/utf8'));
});
