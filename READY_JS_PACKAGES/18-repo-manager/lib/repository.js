'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${command} ${args.join(' ')} failed${result.status === null ? '' : ` (exit ${result.status})`}${detail ? `: ${detail}` : ''}`);
  }
  return (result.stdout || '').trim();
}

function git(args, cwd) {
  return run('git', args, cwd);
}

function repositoryRoot(directory) {
  const target = path.resolve(directory);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`Directory not found: ${target}`);
  }
  return git(['rev-parse', '--show-toplevel'], target);
}

function currentBranch(root) {
  const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], root);
  if (!branch) throw new Error('Detached HEAD is not supported.');
  return branch;
}

function upstream(root, branch) {
  const remote = git(['config', '--get', `branch.${branch}.remote`], root);
  const mergeRef = git(['config', '--get', `branch.${branch}.merge`], root);
  if (!remote || !mergeRef || remote === '.') {
    throw new Error(`Branch '${branch}' has no remote upstream configured.`);
  }
  if (!mergeRef.startsWith('refs/heads/')) {
    throw new Error(`Unsupported upstream ref: ${mergeRef}`);
  }
  return { remote, branch: mergeRef.slice('refs/heads/'.length) };
}

function workingTreeChanges(root) {
  return git(['status', '--porcelain', '--untracked-files=all'], root);
}

function updateFromRemote(directory, apply = false) {
  const root = repositoryRoot(directory);
  const branch = currentBranch(root);
  const tracking = upstream(root, branch);
  const changes = workingTreeChanges(root);
  if (changes) throw new Error(`Working tree is not clean; commit or stash changes before updating:\n${changes}`);
  const plan = { root, branch, remote: tracking.remote, upstream: `${tracking.remote}/${tracking.branch}`, applied: false };
  if (!apply) return plan;
  git(['fetch', '--prune', tracking.remote], root);
  git(['merge', '--ff-only', plan.upstream], root);
  return { ...plan, applied: true };
}

function pushChanges(directory, options = {}) {
  const root = repositoryRoot(directory);
  const branch = currentBranch(root);
  const changes = workingTreeChanges(root);
  const plan = { root, branch, changes: Boolean(changes), pushed: false };
  if (!options.apply) return plan;

  if (changes) {
    if (!options.message || !options.message.trim()) {
      throw new Error('A non-empty --message is required when committing local changes.');
    }
    git(['add', '--all'], root);
    git(['commit', '-m', options.message.trim()], root);
  }

  const configured = spawnSync('git', ['config', '--get', `branch.${branch}.remote`], {
    cwd: root, encoding: 'utf8', windowsHide: true
  });
  if (configured.error) throw configured.error;
  if (configured.status === 0 && configured.stdout.trim() !== '.') {
    git(['push'], root);
  } else {
    const remotes = git(['remote'], root).split(/\r?\n/).filter(Boolean);
    if (!remotes.includes('origin')) throw new Error('No upstream or origin remote is configured.');
    git(['push', '--set-upstream', 'origin', 'HEAD'], root);
  }
  return { ...plan, pushed: true };
}

function validateRepositoryName(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(name)) {
    throw new Error('Repository name must use OWNER/REPOSITORY format.');
  }
  return name;
}

function publishRepository(directory, options = {}) {
  if (!options.apply) throw new Error('Publishing creates a GitHub repository and pushes files; pass --apply to confirm.');
  const root = path.resolve(directory);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`Directory not found: ${root}`);
  const repositoryName = validateRepositoryName(options.repo);
  const visibility = options.visibility || 'private';
  if (!['private', 'public'].includes(visibility)) throw new Error('Visibility must be private or public.');
  run('gh', ['auth', 'status'], root);
  if (fs.existsSync(path.join(root, '.git'))) {
    if (path.resolve(repositoryRoot(root)) !== root) {
      throw new Error('Publish must target the root of the Git repository.');
    }
    if (git(['remote'], root)) {
      throw new Error('Refusing to publish a Git repository that already has a remote.');
    }
  } else {
    run('git', ['init', '--initial-branch=main'], root);
  }
  if (workingTreeChanges(root)) {
    git(['add', '--all'], root);
    git(['commit', '-m', (options.message || 'Initial project scaffold').trim()], root);
  } else {
    git(['rev-parse', '--verify', 'HEAD'], root);
  }
  const visibilityFlag = visibility === 'private' ? '--private' : '--public';
  run('gh', ['repo', 'create', repositoryName, '--source', root, '--remote', 'origin', '--push', visibilityFlag], root);
  return { root, repository: repositoryName, visibility, published: true };
}

function createScaffold(directory, projectName) {
  const root = path.resolve(directory);
  const name = projectName || path.basename(root);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error('Project name must be a lowercase npm-compatible name.');
  }
  if (fs.existsSync(root)) throw new Error(`Target already exists: ${root}`);
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'README.md'), `# ${name}\n\nA JavaScript project.\n`, { flag: 'wx' });
  fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({
    name,
    version: '1.0.0',
    private: true,
    description: '',
    main: 'src/index.js',
    scripts: { test: 'node --test' }
  }, null, 2)}\n`, { flag: 'wx' });
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n.env\n.DS_Store\n', { flag: 'wx' });
  fs.writeFileSync(path.join(root, 'src', 'index.js'), "'use strict';\n\nmodule.exports = {};\n", { flag: 'wx' });
  fs.writeFileSync(path.join(root, 'test', '.gitkeep'), '', { flag: 'wx' });
  fs.writeFileSync(path.join(root, 'docs', '.gitkeep'), '', { flag: 'wx' });
  return { root, name, created: true };
}

function syncRepositories(configPath, options = {}) {
  const absoluteConfig = path.resolve(configPath);
  const configuration = JSON.parse(fs.readFileSync(absoluteConfig, 'utf8'));
  if (!configuration || !Array.isArray(configuration.repositories) || configuration.repositories.some(item => typeof item !== 'string')) {
    throw new Error('Sync configuration must contain a repositories array of directory paths.');
  }
  const base = path.dirname(absoluteConfig);
  const direction = options.direction || 'pull';
  if (!['pull', 'push'].includes(direction)) throw new Error('Direction must be pull or push.');
  return configuration.repositories.map(item => {
    const directory = path.resolve(base, item);
    return direction === 'pull'
      ? updateFromRemote(directory, Boolean(options.apply))
      : pushChanges(directory, { apply: Boolean(options.apply), message: options.message });
  });
}

module.exports = {
  createScaffold,
  publishRepository,
  pushChanges,
  repositoryRoot,
  syncRepositories,
  updateFromRemote,
  validateRepositoryName
};
