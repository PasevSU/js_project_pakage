import { scanPendingOts, upgradeTimestamp, verifyTimestamp, createSha256File, logEvent } from './ots-manager.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECK_INTERVAL = 60000;
let activeRun;

async function runQueue({ directory = resolve('data/pending'), options = {} } = {}) {
  const files = scanPendingOts(directory);
  const results = [];
  for (const otsPath of files) {
    try {
      const upgraded = await upgradeTimestamp(otsPath, options);
      if (upgraded.status !== 'complete') {
        results.push({ path: otsPath, status: upgraded.status });
        continue;
      }
      const verification = await verifyTimestamp(otsPath, options);
      if (!verification.verified) {
        results.push({ path: otsPath, status: 'unverified', verification });
        continue;
      }
      const sidecar = createSha256File(otsPath);
      results.push({ path: otsPath, status: 'verified', sidecar });
      logEvent(`Timestamp ${otsPath} is complete and verified`, 'success');
    } catch (error) {
      results.push({ path: otsPath, status: 'error', error: error.message });
      logEvent(`Timestamp queue failed for ${otsPath}: ${error.message}`, 'error');
    }
  }
  return { directory, count: files.length, results };
}

function processQueue(options) {
  if (activeRun) return activeRun;
  activeRun = runQueue(options).finally(() => { activeRun = null; });
  return activeRun;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(`Watching ${resolve('data/pending')} every ${CHECK_INTERVAL / 1000}s; press Ctrl+C to stop.`);
  await processQueue();
  setInterval(() => processQueue().catch(error => {
    console.error(`OTS queue failed: ${error.message}`);
    logEvent(`OTS queue failed: ${error.message}`, 'error');
  }), CHECK_INTERVAL);
}

export { processQueue };