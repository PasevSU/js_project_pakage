'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('hash-crypto self-test covers every exposed digest algorithm', () => {
  const cli = path.resolve(__dirname, '..', '06-hash-crypto', 'cli.js');
  const result = spawnSync(process.execPath, [cli, 'self-test'], {
    encoding: 'utf8',
    timeout: 15000
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    ok: true,
    algorithms: ['MD5', 'SHA1', 'SHA224', 'SHA256', 'SHA384', 'SHA512', 'SHA3', 'RIPEMD160']
  });
});
