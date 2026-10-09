// manifest-builder.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ForensicLogger } = require('./lib/logger');
const { MempoolClient } = require('./lib/mempool');
const { OtsClient } = require('./lib/ots');
const { ManifestBuilder } = require('./lib/manifest');
const { Checkpoint } = require('./lib/checkpoint');

const CONFIG_PATH = path.resolve(process.env.ARCHIVE_CONFIG || path.join(__dirname, 'config.json'));
if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Archive config not found: ${CONFIG_PATH}. Copy config.example.json to config.json and set a bounded date range.`);
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
for (const key of ['mempoolApi', 'outputDir', 'logDir', 'archiveFile', 'checkpointFile', 'startDate', 'endDate']) {
  if (!config[key]) throw new Error(`Missing required config field: ${key}`);
}
for (const key of ['startDate', 'endDate']) {
  if (!Number.isFinite(resolveDate(config[key]).getTime())) throw new Error(`Invalid ${key}: ${config[key]}`);
}
if (resolveDate(config.startDate) > resolveDate(config.endDate)) throw new Error('startDate must not be after endDate.');
if (resolveDate(config.startDate) > resolveDate(config.endDate)) throw new Error('startDate must not be after endDate.');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = (args[i + 1] && !args[i + 1].startsWith('--')) ? args[++i] : true;
      opts[k] = v;
    }
  }
  return opts;
}

function resolveDate(s) {
  if (!s || s === 'today') return new Date();
  return new Date(s + 'T00:00:00Z');
}

async function main() {
  const opts = parseArgs();
  const outDir = opts.out || config.outputDir;
  const logDir = opts.logdir || config.logDir;
  const archivePath = path.resolve(outDir, config.archiveFile);
  const checkpointPath = path.resolve(outDir, config.checkpointFile);
  const dryRun = !!opts['dry-run'];

  // Fix #16: --dry-run
  if (dryRun) {
    console.log('*** DRY RUN — няма да пишем файлове ***');
  }

  if (opts.reset && !dryRun) {
    console.log('Reset: изтриване на checkpoint и архив');
    if (fs.existsSync(checkpointPath)) fs.unlinkSync(checkpointPath);
    if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
    if (fs.existsSync(archivePath + '.ots')) fs.unlinkSync(archivePath + '.ots');
    if (fs.existsSync(archivePath + '.sha256')) fs.unlinkSync(archivePath + '.sha256');
  }

  if (!dryRun) fs.mkdirSync(outDir, { recursive: true });

  const logger = new ForensicLogger(logDir);
  logger.info('=== Manifest Builder started ===', {
    pid: process.pid,
    dryRun,
    archivePath,
    otsJar: config.otsJarPath,
    nodeVersion: process.version
  });

  const mempool = new MempoolClient(
    config.mempoolApi, logger,
    config.requestDelayMs, config.retryAttempts, config.maxRateLimitBackoffMs
  );

  // Fix #12: requireOts
  let ots = null;
  try {
    ots = new OtsClient(config.otsJarPath, logger);
    logger.success('OtsClient initialized', { jar: config.otsJarPath });
  } catch (e) {
    if (config.requireOts) {
      logger.error('FATAL: OtsClient unavailable и requireOts=true');
      logger.error('Причина: ' + e.message);
      process.exit(1);
    }
    logger.warn('OtsClient unavailable — продължаваме без OTS', { error: e.message });
  }

  // Fix #3: resume
  const builder = new ManifestBuilder(archivePath, logger, {
    saveEveryNBlocks: config.saveEveryNBlocks,
    maxArchiveSizeMB: config.maxArchiveSizeMB,
    resume: !opts.reset
  });

  const checkpoint = new Checkpoint(checkpointPath, logger);

  // Fix #2: graceful shutdown
  let shutdownRequested = false;
  const shutdown = (signal) => {
    if (shutdownRequested) return;
    shutdownRequested = true;
    logger.warn(`Caught ${signal} — graceful shutdown...`);
    try {
      if (!dryRun) builder.save();
      const chainInfo = logger.verifyChain();
      logger.info('Chain on shutdown', chainInfo);
      logger.success('Graceful shutdown complete');
    } catch (e) { console.error('Shutdown error:', e); }
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const startDate = resolveDate(opts.start || config.startDate);
  const endDate = resolveDate(opts.end || config.endDate);

  logger.info('Time range', {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  });

  // ============ GLOBAL METRICS ============
  if (!dryRun) {
    logger.info('Collecting global metrics...');

    if (config.fetchHashrate) {
      try {
        const hr = await mempool.getHashrate('1m');
        const hash = crypto.createHash('sha256').update(JSON.stringify(hr)).digest('hex');
        builder.setGlobal('hashrate_1m', hr, hash);
        logger.success('Hashrate fetched');
      } catch (e) { logger.warn('hashrate failed', { error: e.message }); }
    }

    if (config.fetchDifficultyAdjustments) {
      try {
        const da = await mempool.getDifficultyAdjustments('1m');
        const hash = crypto.createHash('sha256').update(JSON.stringify(da)).digest('hex');
        builder.setGlobal('difficulty_adjustments_1m', da, hash);
        logger.success('Difficulty adjustments fetched');
      } catch (e) { logger.warn('difficulty failed', { error: e.message }); }
    }

    if (config.fetchMiningPools) {
      try {
        const pools = await mempool.getMiningPools('1m');
        const hash = crypto.createHash('sha256').update(JSON.stringify(pools)).digest('hex');
        builder.setGlobal('mining_pools_1m', pools, hash);
        logger.success('Mining pools fetched');
      } catch (e) { logger.warn('pools failed', { error: e.message }); }
    }

    if (config.fetchHistoricalPrice) {
      try {
        const ts = Math.floor(startDate.getTime() / 1000);
        const price = await mempool.getHistoricalPrice('USD', ts);
        const hash = crypto.createHash('sha256').update(JSON.stringify(price)).digest('hex');
        builder.setGlobal('price_at_start', price, hash);
        logger.success('Historical price fetched');
      } catch (e) { logger.warn('price failed', { error: e.message }); }
    }
  }

  // ============ LOCATE START/END BLOCKS ============
  logger.info('Locating start block...');
  const startBlock = await mempool.findBlockByTimestamp(startDate.getTime());
  logger.success('Start block', startBlock);

  const tipHeight = await mempool.getBlockHeight();
  logger.success('Tip height', { height: tipHeight });

  // Fix #8: запази ОРИГИНАЛНИЯ start height
  const originalStartHeight = startBlock.height;
  let startHeight = originalStartHeight;
  const endBlock = await mempool.findBlockByTimestamp(endDate.getTime());
  const endHeight = Math.min(tipHeight, endBlock.height);

  // Fix #13: resume + extend
  if (checkpoint.resumeHeight && !opts.reset) {
    const resumeFrom = checkpoint.resumeHeight + 1;
    startHeight = Math.max(startHeight, resumeFrom);
    logger.info(`Resuming from block ${startHeight}`);
  }

  if (!dryRun) {
    builder.setDateRange(
      startDate.toISOString(),
      endDate.toISOString(),
      originalStartHeight,   // Fix #8
      endHeight
    );
  }

  const total = endHeight - startHeight + 1;

  if (total <= 0) {
    logger.success('Няма нови блокове за обработка');
    if (!dryRun) {
      const chainInfo = logger.verifyChain();
      builder.finalize(chainInfo);
    }
    return;
  }

  logger.info(`Блокове за обработка: ${total} (от ${startHeight} до ${endHeight})`);
  const estMin = (total * config.requestDelayMs * 5) / 60000;
  logger.info(`Очаквано време: ~${estMin.toFixed(1)} минути`);

  let processed = 0;
  let skipped = 0;
  const t0 = Date.now();
  let prevBlockHash = null;

  // ============ MAIN LOOP ============
  for (let h = startHeight; h <= endHeight; h++) {
    if (shutdownRequested) {
      logger.warn('Shutdown requested — прекъсвам loop-а');
      break;
    }

    try {
      const hash = await mempool.getBlockHash(h);
      if (!hash) {
        logger.warn(`No hash for height ${h}`);
        skipped++;
        continue;
      }

      const rawBlock = await mempool.getBlock(hash);
      if (!rawBlock) {
        logger.warn(`No block data for ${h}`);
        skipped++;
        continue;
      }

      // Fix #17: height mismatch check
      if (rawBlock.height !== h) {
        logger.error(`MISMATCH: requested ${h}, got ${rawBlock.height}`);
        skipped++;
        continue;
      }

      const timestamp = rawBlock.timestamp;
      const timestamp_iso = new Date(timestamp * 1000).toISOString();

      // Пропусни след крайната дата
      if (timestamp * 1000 > endDate.getTime() + 86400000) {
        logger.info(`Спираме — блок ${h} е след крайната дата`);
        break;
      }

      // Fix #7: chain integrity check
      if (prevBlockHash && rawBlock.previousblockhash !== prevBlockHash) {
        logger.error(`CHAIN BREAK at ${h}: expected prev=${prevBlockHash.slice(0,16)}..., got=${rawBlock.previousblockhash.slice(0,16)}...`);
        if (!dryRun) {
          builder.data.meta.chainBreaks = builder.data.meta.chainBreaks || [];
          builder.data.meta.chainBreaks.push({
            height: h,
            expected: prevBlockHash,
            actual: rawBlock.previousblockhash,
            detectedAt: new Date().toISOString()
          });
          builder._dirty = true;
        }
      }

      const block = {
        id: rawBlock.id,
        height: rawBlock.height,
        version: rawBlock.version,
        timestamp,
        timestamp_iso,
        bits: rawBlock.bits,
        nonce: rawBlock.nonce,
        difficulty: rawBlock.difficulty,
        merkle_root: rawBlock.merkle_root,
        previousblockhash: rawBlock.previousblockhash,
        size: rawBlock.size,
        weight: rawBlock.weight,
        tx_count: rawBlock.tx_count,
        mediantime: rawBlock.mediantime,
        mediantime_iso: new Date(rawBlock.mediantime * 1000).toISOString()
      };

      // Header hex
      let headerHex = null;
      if (config.fetchHeaderHex) {
        try { headerHex = await mempool.getBlockHeader(hash); } catch {}
      }

      // Extras (v1)
      let extras = null;
      if (config.fetchBlockExtras) {
        try {
          const v1 = await mempool.getBlockV1(hash);
          if (v1?.extras) extras = v1.extras;
        } catch {}
      }

      // Audit
      let audit = null;
      if (config.fetchBlockAudit) {
        try { audit = await mempool.getBlockAuditSummary(hash); } catch {}
      }

      // Txids
      let txids = [];
      if (config.fetchTxidsOnly) {
        try { txids = await mempool.getBlockTxids(hash) || []; } catch {}
      }

      logger.block(`Block #${h}`, {
        hash: hash.slice(0, 20) + '...',
        txs: block.tx_count,
        time: timestamp_iso,
        pool: extras?.pool?.name || 'unknown',
        fees: extras?.totalFees || null,
        matchRate: audit?.matchRate ?? null
      });

      // OTS stamp за блока
      let otsInfo = null;
      if (ots && config.stampEveryBlock && !dryRun) {
        try {
          const otsDir = path.resolve(outDir, 'ots');
          fs.mkdirSync(otsDir, { recursive: true });
          const label = `block-${h}-${hash.slice(0, 12)}`;
          const tmpFile = path.join(otsDir, `${label}.json`);
          fs.writeFileSync(tmpFile, JSON.stringify({ hash, height: h, timestamp }, null, 2));
          const stampRes = await ots.stamp(tmpFile);
          const infoRes = await ots.info(`${tmpFile}.ots`);
          otsInfo = {
            fileHash: 'sha256:' + stampRes.fileHash,
            otsFile: path.relative(outDir, `${tmpFile}.ots`),
            info: infoRes.stdout.trim(),
            stampedAt: new Date().toISOString(),
            verifyStatus: 'pending'
          };
          logger.ots(`  OTS stamp OK за блок ${h}`);
        } catch (e) {
          logger.warn(`  OTS stamp failed за ${h}`, { error: e.message });
        }
      }

      if (!dryRun) {
        builder.addBlock(block, txids, audit, extras, headerHex, otsInfo);
      }

      prevBlockHash = rawBlock.id;
      processed++;
      if (!dryRun) checkpoint.save(h, processed, endHeight);

      // Fix #11: periodic chain verification
      if (processed % config.verifyChainEveryNBlocks === 0) {
        const v = logger.verifyChain();
        if (!v.valid) {
          logger.error('CHAIN BROKEN', v);
          throw new Error(`Log chain broken at seq ${v.brokenAt}: ${v.reason}`);
        }
        logger.audit(`Chain OK (${v.entries} entries, last=${v.lastHash.slice(0, 16)}...)`);
      }

      const elapsed = (Date.now() - t0) / 1000;
      const rate = processed / elapsed;
      const eta = (total - processed) / rate;

      if (processed % 10 === 0) {
        logger.info(
          `Прогрес: ${processed}/${total} (${(processed / total * 100).toFixed(1)}%) | ` +
          `rate=${rate.toFixed(2)} blk/s | ETA=${(eta / 60).toFixed(1)} min | ` +
          `API: ${mempool.stats.requests} req, cache: ${mempool.stats.cached}, ` +
          `429s: ${mempool.stats.rateLimits}, err: ${mempool.stats.errors}`
        );
      }
    } catch (e) {
      logger.error(`Грешка при блок ${h}`, { error: e.message, stack: e.stack });
    }
  }

  // ============ FINALIZE ============
  if (dryRun) {
    logger.info('DRY RUN complete — няма записани файлове');
    return;
  }

  // 1. Финален save ПРЕДИ OTS
  builder.save();
  const chainInfo = logger.verifyChain();
  logger.info('Final chain verification', chainInfo);

  if (!chainInfo.valid) {
    logger.error('CHAIN INVALID — прекъсвам finalize!');
    process.exit(1);
  }

  // 2. OTS stamp на архива (Fix #9: БЕЗ finalize още)
  if (ots && config.stampArchive) {
    try {
      logger.ots('Stamping archive...');
      const stampRes = await ots.stamp(archivePath);
      const infoRes = await ots.info(`${archivePath}.ots`);

      builder.data.global.archive_ots = {
        archiveHash: 'sha256:' + stampRes.fileHash,
        archiveSize: fs.statSync(archivePath).size,
        otsFile: path.basename(archivePath) + '.ots',
        otsInfo: infoRes.stdout.trim(),
        stampedAt: new Date().toISOString(),
        verifyStatus: 'pending'
      };
      builder._dirty = true;
      builder.save();
      logger.ots('Archive stamped', { fileHash: stampRes.fileHash });
    } catch (e) {
      logger.warn('Archive stamp failed', { error: e.message });
    }
  }

  // 3. Събери OTS файлове (Fix #10)
  const otsFiles = [];
  const otsDir = path.resolve(outDir, 'ots');
  if (fs.existsSync(otsDir)) {
    for (const f of fs.readdirSync(otsDir)) {
      if (f.endsWith('.ots')) otsFiles.push(path.join('ots', f));
    }
  }
  if (fs.existsSync(archivePath + '.ots')) {
    otsFiles.push(path.basename(archivePath) + '.ots');
  }

  // 4. Накрая finalize → manifest
  const { rootHash, fileHash, manifestHash } = builder.finalize(chainInfo, {
    logFiles: {
      session: logger.getLogFile(),
      chain: logger.getChainFile()
    },
    otsFiles
  });

  logger.success('Manifest finalized', { rootHash, fileHash, manifestHash });

  const stats = mempool.getStats();
  logger.success('=== ГОТОВО ===', {
    processedBlocks: processed,
    skippedBlocks: skipped,
    totalDays: Object.keys(builder.data.days).length,
    archive: archivePath,
    rootHash,
    fileHash,
    durationMin: ((Date.now() - t0) / 60000).toFixed(1),
    apiStats: stats
  });
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
