#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');
const { applyDateFilter } = require('./date_filter');
const progressWriter = require('./progress');

function mergeRecord(target, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === 'record_key') continue;
    if (value !== undefined) target[key] = value;
  }
  return target;
}

async function loadExtractors(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const modules = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.js') continue;
    const full = path.join(directory, entry.name);
    delete require.cache[require.resolve(full)];
    const mod = require(full);
    if (!mod || typeof mod.extract !== 'function') {
      throw new Error(`Extractor ${entry.name} must export extract(context)`);
    }
    modules.push({
      file: entry.name,
      id: String(mod.id || entry.name),
      version: String(mod.version || '0.0.0'),
      priority: Number.isFinite(Number(mod.priority)) ? Number(mod.priority) : 100,
      extract: mod.extract,
    });
  }
  modules.sort((a, b) => (a.priority - b.priority) || a.id.localeCompare(b.id) || a.file.localeCompare(b.file));
  return modules;
}

async function run(context = {}) {
  const extractorDir = path.join(__dirname, '..', 'extractors');
  const emitProgress = async (patch) => progressWriter.emit(context.progressPath, patch, context.eventLogPath);
  const extractors = await loadExtractors(extractorDir);
  const byKey = new Map();
  const diagnostics = [];
  const artifacts = [];
  const loaded = [];

  for (const extractor of extractors) {
    await emitProgress({phase:'extractor',extractor:extractor.id,status:'RUNNING'});
    const currentRecords = Array.from(byKey.values());
    const result = await extractor.extract({ ...context, records: currentRecords, emitProgress });
    const patches = Array.isArray(result) ? result : (result?.records || []);
    for (const patch of patches) {
      if (!patch || !patch.record_key) {
        throw new Error(`Extractor ${extractor.id} returned a record without record_key`);
      }
      const existing = byKey.get(patch.record_key) || { record_key: patch.record_key };
      byKey.set(patch.record_key, mergeRecord(existing, patch));
    }
    if (result?.diagnostics) diagnostics.push(...result.diagnostics.map((d) => ({ extractor: extractor.id, ...d })));
    if (result?.artifacts) artifacts.push(...result.artifacts.map((a) => ({ extractor: extractor.id, ...a })));
    loaded.push({ id: extractor.id, version: extractor.version, priority: extractor.priority, file: extractor.file });
    await emitProgress({phase:'extractor',extractor:extractor.id,status:'COMPLETED',records:byKey.size});
  }

  const merged = Array.from(byKey.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
  const filtered = applyDateFilter(merged, {
    from: context.dateFrom || null,
    to: context.dateTo || null,
    field: context.filterField || 'event_time',
    includeUndated: Boolean(context.includeUndated),
  });

  return {
    schema_version: '1.1.0',
    loader: 'extraktor.js',
    extractor_directory: extractorDir,
    extractors: loaded,
    date_filter: filtered.range,
    stats: filtered.stats,
    records: filtered.records,
    rejected: filtered.rejected,
    diagnostics,
    artifacts,
  };
}

async function readStdin() {
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) data += chunk;
  return data.trim() ? JSON.parse(data) : {};
}

if (require.main === module) {
  readStdin()
    .then(run)
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => {
      process.stderr.write(`extraktor.js: ${error?.stack || error}\n`);
      process.exitCode = 1;
    });
}

module.exports = { loadExtractors, run };
