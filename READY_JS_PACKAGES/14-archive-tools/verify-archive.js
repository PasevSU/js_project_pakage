// verify-archive.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ForensicLogger } = require('./lib/logger');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = (args[i + 1] && !args[i + 1].startsWith('-')) ? args[++i] : true;
      opts[k] = v;
    }
  }
  return opts;
}

function verifyArchive(archivePath) {
  console.log(`\n=== VERIFY ARCHIVE: ${archivePath} ===\n`);

  if (!fs.existsSync(archivePath)) {
    console.error('❌ File not found');
    return { ok: false };
  }

  const buf = fs.readFileSync(archivePath);
  const fileHash = crypto.createHash('sha256').update(buf).digest('hex');
  console.log(`File size: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`File SHA256: ${fileHash}`);

  // Провери .sha256 file
  const shaFile = archivePath + '.sha256';
  if (fs.existsSync(shaFile)) {
    const expected = fs.readFileSync(shaFile, 'utf8').trim().split(/\s+/)[0];
    if (expected === fileHash) {
      console.log(`✅ .sha256 file matches`);
    } else {
      console.log(`❌ .sha256 MISMATCH`);
      console.log(`   expected: ${expected}`);
      console.log(`   actual:   ${fileHash}`);
    }
  } else {
    console.log(`⚠️  No .sha256 file`);
  }

  // Парсни JSON
  let data;
  try {
    data = JSON.parse(buf.toString());
  } catch (e) {
    console.error('❌ JSON parse error:', e.message);
    return { ok: false };
  }

  console.log(`\n--- META ---`);
  console.log(`Format: ${data.meta?.format}`);
  console.log(`Created: ${data.meta?.created}`);
  console.log(`Updated: ${data.meta?.updated}`);
  console.log(`Days: ${data.meta?.dateRange?.totalDays}`);
  console.log(`Blocks: ${data.meta?.dateRange?.totalBlocks}`);
  console.log(`Start height: ${data.meta?.dateRange?.startBlockHeight}`);
  console.log(`End height: ${data.meta?.dateRange?.endBlockHeight}`);

  // Recompute root hash
  console.log(`\n--- ROOT HASH ---`);
  const hash = crypto.createHash('sha256');
  hash.update('blockchain-archive/v1');
  const sortedDays = Object.keys(data.days).sort();
  for (const d of sortedDays) {
    hash.update(d);
    hash.update(JSON.stringify(data.days[d].summary));
    const sortedBlocks = Object.keys(data.days[d].blocks).sort((a, b) => a - b);
    for (const b of sortedBlocks) {
      const blk = data.days[d].blocks[b];
      hash.update(b);
      hash.update(blk.id);
      hash.update(String(blk.timestamp));
      hash.update(blk.merkle_root || '');
    }
  }
  const computedRoot = hash.digest('hex');
  const storedRoot = data.meta?.integrity?.rootHash;

  console.log(`Computed: ${computedRoot}`);
  console.log(`Stored:   ${storedRoot}`);
  if (computedRoot === storedRoot) {
    console.log(`✅ Root hash matches`);
  } else {
    console.log(`❌ Root hash MISMATCH`);
  }

  // Провери index consistency
  console.log(`\n--- INDEX ---`);
  const indexTxids = Object.keys(data.index?.by_txid || {}).length;
  const actualTxids = Object.values(data.days).reduce((s, d) => s + Object.keys(d.transactions || {}).length, 0);
  console.log(`index.by_txid: ${indexTxids}`);
  console.log(`actual:        ${actualTxids}`);
  if (indexTxids === actualTxids) {
    console.log(`✅ Index consistent`);
  } else {
    console.log(`⚠️  Index mismatch (може да е OK ако index не е rebuild)`);
  }

  // Провери chain log
  if (data.meta?.integrity?.chainFile) {
    console.log(`\n--- CHAIN LOG ---`);
    console.log(`File: ${data.meta.integrity.chainFile}`);
    console.log(`Entries: ${data.meta.integrity.chainEntries}`);
    console.log(`Valid: ${data.meta.integrity.chainValid}`);
    console.log(`Last hash: ${data.meta.integrity.chainLastHash}`);

    if (fs.existsSync(data.meta.integrity.chainFile)) {
      const logDir = path.dirname(data.meta.integrity.chainFile);
      const logger = new ForensicLogger(logDir);
      logger.chainFile = data.meta.integrity.chainFile;
      const v = logger.verifyChain();
      if (v.valid) {
        console.log(`✅ Chain log valid (${v.entries} entries)`);
      } else {
        console.log(`❌ Chain log INVALID: ${v.reason} at seq ${v.brokenAt}`);
      }
    } else {
      console.log(`⚠️  Chain log file not found`);
    }
  }

  // Провери reorgs / chainBreaks
  if (data.meta?.reorgs?.length > 0) {
    console.log(`\n⚠️  REORGS: ${data.meta.reorgs.length}`);
    data.meta.reorgs.forEach(r => console.log(`  height ${r.height}: ${r.fromDay} → ${r.toDay}`));
  }
  if (data.meta?.chainBreaks?.length > 0) {
    console.log(`\n❌ CHAIN BREAKS: ${data.meta.chainBreaks.length}`);
    data.meta.chainBreaks.forEach(b => console.log(`  height ${b.height}: expected ${b.expected?.slice(0,16)}..., got ${b.actual?.slice(0,16)}...`));
  }

  // Провери manifest
  if (data.manifest) {
    console.log(`\n--- MANIFEST ---`);
    console.log(`File: ${data.manifest.file}`);
    console.log(`Size: ${data.manifest.sizeMB} MB`);
    console.log(`SHA256: ${data.manifest.sha256}`);
    console.log(`Generated: ${data.manifest.generatedAt}`);
    console.log(`Generator: ${data.manifest.generatedBy}`);
  }

  // Провери OTS
  const otsFile = archivePath + '.ots';
  if (fs.existsSync(otsFile)) {
    console.log(`\n--- OTS ---`);
    console.log(`✅ OTS file exists: ${otsFile}`);
    console.log(`   Size: ${fs.statSync(otsFile).size} bytes`);
    console.log(`   Run: java -jar <OtsCli.jar> verify ${otsFile} ${archivePath}`);
  } else {
    console.log(`\n⚠️  No OTS file found`);
  }

  const ok = (computedRoot === storedRoot);
  console.log(`\n=== RESULT: ${ok ? '✅ VALID' : '❌ INVALID'} ===\n`);
  return { ok, rootHash: computedRoot, fileHash };
}

const opts = parseArgs();
const archivePath = opts.file || path.resolve('./output/blockchain-archive.json');
const result = verifyArchive(archivePath);
process.exit(result.ok ? 0 : 1);