'use strict';
/** Optional raw NTFS acquisition. All executable logic lives in raw_ntfs/.
 * The generic extraktor.js does not know this module's name or source types.
 * Produces sidecar artifacts, never fake 'file' rows with made-up SHA-256.
 */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const exec = promisify(execFile);

module.exports = {
  id: 'raw_ntfs', version: '1.1.4', priority: 40,
  async extract(context) {
    const cfg = context.rawNtfs;
    if (!cfg) return { records: [], diagnostics: [
      { level: 'info', code: 'RAW_NTFS_NOT_CONFIGURED' }
    ] };
    if (!cfg.output) throw new Error('rawNtfs.output is required');
    const output = path.resolve(String(cfg.output));
    const root = path.resolve(String(context.root));
    if (output === root || output.startsWith(root + path.sep)) {
      throw new Error('Raw NTFS output must be outside the source directory');
    }
    const scriptRoot = path.resolve(__dirname, '..');
    const py = String(context.pythonExecutable || (process.platform === 'win32' ? 'python' : 'python3'));
    const args = ['-m','raw_ntfs.cli','collect','--output',output];
    if (cfg.mft) args.push('--mft',String(cfg.mft));
    if (cfg.usn) args.push('--usn',String(cfg.usn));
    if (cfg.image) args.push('--image',String(cfg.image));
    if (cfg.ewf) args.push('--ewf',String(cfg.ewf));
    if (cfg.partitionOffset != null) args.push('--partition-offset',String(cfg.partitionOffset));
    if (cfg.recordSize != null) args.push('--record-size',String(cfg.recordSize));
    if (cfg.sectorSize != null) args.push('--sector-size',String(cfg.sectorSize));
    if (cfg.timeField) args.push('--time-field',String(cfg.timeField));
    if (cfg.vssList) args.push('--vss-list');
    if (cfg.systemStreams) args.push('--system-streams');
    if (cfg.maxSystemStreamBytes != null) args.push('--max-system-stream-bytes',String(cfg.maxSystemStreamBytes));
    if (cfg.skipImageHash) args.push('--skip-image-hash');
    if (cfg.rootFrn) args.push('--root-frn',String(cfg.rootFrn));
    if (cfg.rootSequence != null) args.push('--root-sequence',String(cfg.rootSequence));
    if (cfg.noPreserveRaw) args.push('--no-preserve-raw');
    if (cfg.allDataStreams) args.push('--all-data-streams');
    if (cfg.i30AllocationSlack) args.push('--i30-allocation-slack');
    if (cfg.deletedRecovery) args.push('--deleted-recovery');
    if (cfg.fileSlack) args.push('--file-slack');
    if (cfg.unallocatedCarving) args.push('--unallocated-carving');
    if (cfg.historicalTimeline) args.push('--historical-timeline');
    if (cfg.offlineVssHistorical) args.push('--offline-vss-historical');
    if (cfg.clfsTxfInventory) args.push('--clfs-txf-inventory');
    if (context.dateFrom) args.push('--from',String(context.dateFrom));
    if (context.dateTo) args.push('--to',String(context.dateTo));
    const { stdout } = await exec(py,args,{
      cwd:scriptRoot, windowsHide:true, maxBuffer:16*1024*1024,
      timeout:Number(cfg.timeoutMs || 14400000),
      env:{...process.env, PYTHONPATH:scriptRoot + path.delimiter + (process.env.PYTHONPATH || '')},
    });
    const result = JSON.parse(stdout);
    if (result.status !== 'COMPLETED' || !fs.existsSync(result.manifest_path)) {
      throw new Error('Raw NTFS collector returned no verified manifest');
    }
    return { records: [], artifacts: [
      { type:'RAW_NTFS_MANIFEST', path:result.manifest_path, status:'COLLECTED' },
      ...result.artifacts.map(a => ({type:a.kind, path:a.path, sha256:a.sha256,
                                    bytes:a.bytes, stats:a.stats, status:'COLLECTED'}))
    ], diagnostics:[{level:'info',code:'RAW_NTFS_ACQUIRED',manifest_path:result.manifest_path}] };
  },
};
