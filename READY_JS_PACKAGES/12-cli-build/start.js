'use strict';

/**
 * PasevSU PGP Toolbox - self-starting Node launcher
 *
 * Goals:
 *   - Node.js starts and supervises server/server.js directly.
 *   - Browser-vendor bootstrap is NOT allowed to prevent the HTTP server from starting.
 *   - A verified local OpenPGP.js runtime is discovered when present and exposed to
 *     server.js through environment variables.
 *   - No npm install, no network download, no cmd.exe current-directory dependency.
 *   - Safe fail-closed handling for port/instance conflicts.
 *
 * Node.js >= 18.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const ROOT = __dirname;
const SERVER_DIR = path.join(ROOT, 'server');
const SERVER_ENTRY = path.join(SERVER_DIR, 'server.js');
const LOG_DIR = path.join(ROOT, 'logs');
const STDOUT_LOG = path.join(LOG_DIR, 'server.stdout.log');
const STDERR_LOG = path.join(LOG_DIR, 'server.stderr.log');
const LAUNCHER_LOG = path.join(LOG_DIR, 'launcher.log');
const PID_FILE = path.join(LOG_DIR, 'server.pid');
const INSTANCE_FILE = path.join(LOG_DIR, 'instance.id');
const APP_URL = process.env.PASEVSU_APP_URL || 'http://127.0.0.1:3000/';
const HEALTH_URL = process.env.PASEVSU_HEALTH_URL || 'http://127.0.0.1:3000/api/health';
const REQUIRED_SERVER_VERSION = process.env.PASEVSU_SERVER_VERSION || '2.1.1';
const REQUIRED_OPENPGP_VERSION = process.env.PASEVSU_OPENPGP_VERSION || '6.3.1';

fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() {
  return new Date().toISOString();
}

function log(message) {
  const line = `[${timestamp()}] ${message}`;
  fs.appendFileSync(LAUNCHER_LOG, line + '\n', 'utf8');
  process.stdout.write(line + '\n');
}

function warn(message) {
  log(`WARN: ${message}`);
}

function fail(message, exitCode = 1) {
  log(`ERROR: ${message}`);
  process.stderr.write(`\n[ERROR] ${message}\n`);
  process.exit(exitCode);
}

function sha256File(filePath) {
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    for (;;) {
      const n = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!n) break;
      h.update(buffer.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return h.digest('hex');
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function realDirectory(candidate) {
  if (!candidate) return null;
  try {
    const st = fs.statSync(candidate);
    if (!st.isDirectory()) return null;
    return fs.realpathSync(candidate);
  } catch {
    return null;
  }
}

function resolveCryptoHome() {
  const candidates = [];
  if (process.env.PASEVSU_CRYPTO_HOME) {
    candidates.push({ kind: 'environment', value: process.env.PASEVSU_CRYPTO_HOME });
  }
  // Typical layout: A:\\PROJECT\\_WEB_pgp and A:\\PROJECT\\_crypto
  candidates.push({ kind: 'project-sibling', value: path.join(path.dirname(ROOT), '_crypto') });
  candidates.push({ kind: 'project-local', value: path.join(ROOT, '_crypto') });

  for (const candidate of candidates) {
    const resolved = realDirectory(candidate.value);
    if (resolved) return { found: true, kind: candidate.kind, path: resolved };
  }
  return { found: false, kind: null, path: null };
}

function inspectOpenPgpRuntime(cryptoHome) {
  const candidates = [];

  // First prefer an explicitly embedded, immutable project runtime.
  for (const rel of [
    ['vendor', 'openpgpjs', REQUIRED_OPENPGP_VERSION, 'openpgp.min.mjs'],
    ['vendor', 'openpgpjs', 'openpgp.min.mjs'],
    ['vendor', 'openpgp.min.mjs'],
    ['runtime', 'vendor', 'openpgpjs', REQUIRED_OPENPGP_VERSION, 'openpgp.min.mjs'],
    ['public', 'vendor', 'openpgp.min.mjs'],
  ]) {
    candidates.push({ kind: 'embedded-project', path: path.join(ROOT, ...rel), packageJson: null });
  }

  if (cryptoHome) {
    const sourceRoot = path.join(cryptoHome, 'openpgpjs');
    const packageJson = path.join(sourceRoot, 'package.json');
    for (const rel of [
      ['dist', 'openpgp.min.mjs'],
      ['dist', 'openpgp.mjs'],
      ['dist', 'openpgp.min.js'],
      ['dist', 'openpgp.js'],
    ]) {
      candidates.push({ kind: 'central-_crypto', path: path.join(sourceRoot, ...rel), packageJson });
    }
  }

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.path)) continue;
    let sourceVersion = null;
    if (candidate.packageJson && fs.existsSync(candidate.packageJson)) {
      sourceVersion = readJson(candidate.packageJson)?.version || null;
      if (sourceVersion && sourceVersion !== REQUIRED_OPENPGP_VERSION) {
        warn(`Ignoring OpenPGP.js runtime with source version ${sourceVersion}; required ${REQUIRED_OPENPGP_VERSION}: ${candidate.path}`);
        continue;
      }
    }
    const st = fs.statSync(candidate.path);
    if (!st.isFile() || st.size < 1024) {
      warn(`Ignoring implausibly small OpenPGP.js runtime: ${candidate.path}`);
      continue;
    }
    return {
      found: true,
      kind: candidate.kind,
      path: fs.realpathSync(candidate.path),
      sourceVersion: sourceVersion || REQUIRED_OPENPGP_VERSION,
      sizeBytes: st.size,
      sha256: sha256File(candidate.path),
    };
  }

  return { found: false };
}

function exposeRuntime(env, runtime) {
  if (!runtime.found) return;
  // Multiple names are intentionally exported for compatibility with older
  // server revisions. Unknown variables are harmless to Node.
  env.PASEVSU_OPENPGP_RUNTIME = runtime.path;
  env.PASEVSU_OPENPGPJS_RUNTIME = runtime.path;
  env.PASEVSU_OPENPGPJS_VERSION = REQUIRED_OPENPGP_VERSION;
  env.PASEVSU_OPENPGPJS_SHA256 = runtime.sha256;
}

function getInstanceId() {
  try {
    const existing = fs.readFileSync(INSTANCE_FILE, 'ascii').trim();
    if (/^[a-f0-9]{32}$/i.test(existing)) return existing.toLowerCase();
  } catch {}
  const id = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(INSTANCE_FILE, id + '\n', 'ascii');
  return id;
}

async function health() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      // PowerShell Start-Process handles &, spaces and non-default browsers safely.
      const escaped = url.replace(/'/g, "''");
      const p = spawn('powershell.exe', [
        '-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
        `Start-Process '${escaped}'`
      ], { detached: true, windowsHide: true, stdio: 'ignore' });
      p.unref();
      return;
    }
    const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
    const p = spawn(command, [url], { detached: true, stdio: 'ignore' });
    p.unref();
  } catch (error) {
    warn(`Server is ready but browser could not be opened automatically: ${error.message}`);
  }
}

function optionalVendorSetup(env) {
  // Deliberately opt-in. The old launcher made setup_vendor.ps1 fatal before
  // server start. Set PASEVSU_RUN_VENDOR_SETUP=1 only when that migration is wanted.
  if (process.env.PASEVSU_RUN_VENDOR_SETUP !== '1') return;
  const script = path.join(ROOT, 'setup_vendor.ps1');
  if (!fs.existsSync(script)) {
    warn('PASEVSU_RUN_VENDOR_SETUP=1 but setup_vendor.ps1 is absent; continuing.');
    return;
  }
  log('Running optional setup_vendor.ps1 before server start.');
  const r = spawnSync('powershell.exe', [
    '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script
  ], { cwd: ROOT, env, encoding: 'utf8', windowsHide: true });
  if (r.stdout) fs.appendFileSync(LAUNCHER_LOG, r.stdout, 'utf8');
  if (r.stderr) fs.appendFileSync(LAUNCHER_LOG, r.stderr, 'utf8');
  if (r.status !== 0) {
    warn(`Optional setup_vendor.ps1 returned ${r.status}; server start will still be attempted.`);
  }
}

async function main() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(nodeMajor) || nodeMajor < 18) {
    fail(`Node.js 18+ is required. Detected ${process.version}`);
  }
  if (!fs.existsSync(SERVER_ENTRY)) {
    fail(`Server entry file not found: ${SERVER_ENTRY}`);
  }

  const instanceId = getInstanceId();
  const env = { ...process.env, PASEVSU_INSTANCE_ID: instanceId };
  log(`Self-start launcher started. Root=${ROOT}`);
  log(`Node.js ${process.version}; instance=${instanceId}`);

  const cryptoHome = resolveCryptoHome();
  if (cryptoHome.found) {
    env.PASEVSU_CRYPTO_HOME = cryptoHome.path;
    log(`_crypto resolved (${cryptoHome.kind}): ${cryptoHome.path}`);
  } else {
    warn('_crypto not found. Optional crypto backends may be unavailable.');
  }

  const runtime = inspectOpenPgpRuntime(cryptoHome.path);
  if (runtime.found) {
    exposeRuntime(env, runtime);
    log(`OpenPGP.js ${runtime.sourceVersion} runtime found (${runtime.kind}): ${runtime.path}`);
    log(`OpenPGP.js runtime SHA-256=${runtime.sha256}; bytes=${runtime.sizeBytes}`);
  } else {
    warn(`OpenPGP.js ${REQUIRED_OPENPGP_VERSION} browser runtime was not found locally. This no longer blocks the HTTP server start.`);
  }

  optionalVendorSetup(env);

  const existing = await health();
  if (existing) {
    if (existing.app !== 'PasevSU PGP Toolbox') {
      fail('Port 3000 is occupied by another HTTP service. Refusing to reuse or terminate it.');
    }
    if (existing.instanceId && existing.instanceId !== instanceId) {
      fail(`Port 3000 is occupied by another PasevSU instance (${existing.instanceId}). Refusing unsafe reuse.`);
    }
    if (existing.version !== REQUIRED_SERVER_VERSION) {
      fail(`A PasevSU server is already running, but version is ${existing.version}; required ${REQUIRED_SERVER_VERSION}. Stop the old instance first.`);
    }
    log(`Existing server accepted. vendorReady=${String(existing.vendorReady)}`);
    openBrowser(APP_URL);
    return;
  }

  const outFd = fs.openSync(STDOUT_LOG, 'a');
  const errFd = fs.openSync(STDERR_LOG, 'a');
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: ROOT,
    env,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', outFd, errFd],
  });
  fs.closeSync(outFd);
  fs.closeSync(errFd);

  if (!child.pid) fail('Unable to start server/server.js.');
  fs.writeFileSync(PID_FILE, String(child.pid) + '\n', 'ascii');
  log(`Server process started. PID=${child.pid}`);
  child.unref();

  let ready = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    ready = await health();
    if (ready) break;
  }

  if (!ready) {
    fail('Server did not answer /api/health within 10 seconds. See logs/server.stderr.log.');
  }
  if (ready.app !== 'PasevSU PGP Toolbox') {
    fail(`Unexpected service answered health endpoint: ${JSON.stringify(ready)}`);
  }
  if (ready.version !== REQUIRED_SERVER_VERSION) {
    fail(`Server started but reports version ${ready.version}; required ${REQUIRED_SERVER_VERSION}.`);
  }
  if (ready.instanceId && ready.instanceId !== instanceId) {
    fail('Health endpoint instance ID does not match this launcher instance.');
  }

  if (ready.vendorReady === false) {
    warn('HTTP server is READY, but health reports vendorReady=false. UI can open; OpenPGP browser operations may remain unavailable until a local runtime is supplied.');
  } else {
    log(`Server ready. vendorReady=${String(ready.vendorReady)}`);
  }

  openBrowser(APP_URL);
}

main().catch(error => fail(error?.stack || error?.message || String(error)));
