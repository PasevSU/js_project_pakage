'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  createScaffold,
  pushChanges,
  syncRepositories,
  updateFromRemote,
  validateRepositoryName
} = require('../18-repo-manager/lib/repository');

function command(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return (result.stdout || '').trim();
}

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'repo-manager-test-'));
}

test('creates a non-overwriting JavaScript project scaffold', () => {
  const root = temporaryDirectory();
  fs.rmSync(root, { recursive: true, force: true });
  const result = createScaffold(root, 'sample-project');
  assert.equal(result.created, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name, 'sample-project');
  assert.ok(fs.existsSync(path.join(root, 'src', 'index.js')));
  assert.throws(() => createScaffold(root, 'sample-project'), /already exists/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('pulls remote changes with fast-forward only and refuses a dirty tree', () => {
  const root = temporaryDirectory();
  const bare = path.join(root, 'remote.git');
  const seed = path.join(root, 'seed');
  const clone = path.join(root, 'clone');
  fs.mkdirSync(seed);
  command(['init', '--bare', bare], root);
  command(['--git-dir', bare, 'symbolic-ref', 'HEAD', 'refs/heads/main'], root);
  command(['init', '--initial-branch=main'], seed);
  command(['config', 'user.name', 'Test User'], seed);
  command(['config', 'user.email', 'test@example.invalid'], seed);
  fs.writeFileSync(path.join(seed, 'README.md'), 'v1\n');
  command(['add', 'README.md'], seed);
  command(['commit', '-m', 'initial'], seed);
  command(['remote', 'add', 'origin', bare], seed);
  command(['push', '-u', 'origin', 'main'], seed);
  command(['clone', bare, clone], root);
  command(['config', 'user.name', 'Test User'], clone);
  command(['config', 'user.email', 'test@example.invalid'], clone);

  fs.writeFileSync(path.join(seed, 'README.md'), 'v2\n');
  command(['commit', '-am', 'remote update'], seed);
  command(['push'], seed);
  assert.equal(updateFromRemote(clone).applied, false);
  assert.equal(updateFromRemote(clone, true).applied, true);
  assert.equal(fs.readFileSync(path.join(clone, 'README.md'), 'utf8').replace(/\r\n/g, '\n'), 'v2\n');

  fs.writeFileSync(path.join(clone, 'local.txt'), 'uncommitted\n');
  assert.throws(() => updateFromRemote(clone, true), /Working tree is not clean/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('commits and pushes local changes without force', () => {
  const root = temporaryDirectory();
  const bare = path.join(root, 'remote.git');
  const seed = path.join(root, 'seed');
  const clone = path.join(root, 'clone');
  fs.mkdirSync(seed);
  command(['init', '--bare', bare], root);
  command(['--git-dir', bare, 'symbolic-ref', 'HEAD', 'refs/heads/main'], root);
  command(['init', '--initial-branch=main'], seed);
  command(['config', 'user.name', 'Test User'], seed);
  command(['config', 'user.email', 'test@example.invalid'], seed);
  fs.writeFileSync(path.join(seed, 'README.md'), 'initial\n');
  command(['add', 'README.md'], seed);
  command(['commit', '-m', 'initial'], seed);
  command(['remote', 'add', 'origin', bare], seed);
  command(['push', '-u', 'origin', 'main'], seed);
  command(['clone', bare, clone], root);
  command(['config', 'user.name', 'Test User'], clone);
  command(['config', 'user.email', 'test@example.invalid'], clone);
  fs.writeFileSync(path.join(clone, 'change.txt'), 'published\n');
  assert.throws(() => pushChanges(clone, { apply: true }), /--message is required/);
  assert.equal(pushChanges(clone, { apply: true, message: 'publish change' }).pushed, true);
  command(['pull', '--ff-only'], seed);
  assert.equal(fs.readFileSync(path.join(seed, 'change.txt'), 'utf8').replace(/\r\n/g, '\n'), 'published\n');
  fs.rmSync(root, { recursive: true, force: true });
});

test('validates GitHub repository names and resolves sync paths from config', () => {
  assert.equal(validateRepositoryName('PasevSU/example-repo'), 'PasevSU/example-repo');
  assert.throws(() => validateRepositoryName('https://github.com/PasevSU/example'), /OWNER\/REPOSITORY/);

  const root = temporaryDirectory();
  const config = path.join(root, 'repositories.json');
  fs.writeFileSync(config, JSON.stringify({ repositories: ['missing-repo'] }));
  assert.throws(() => syncRepositories(config), /Directory not found/);
  fs.rmSync(root, { recursive: true, force: true });
});
