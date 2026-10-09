// lib/logger.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ForensicLogger {
  constructor(logDir) {
    this.logDir = logDir;
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logDir, `session-${this.sessionId}.log`);
    this.chainFile = path.join(logDir, `chain-${this.sessionId}.jsonl`);

    this.prevHash = '0'.repeat(64);
    this.sequence = 0;
    this.entries = 0;
  }

  _hash(entry) {
    return crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
  }

  log(level, message, data = null) {
    const entry = {
      seq: ++this.sequence,
      timestamp: new Date().toISOString(),
      unix: Math.floor(Date.now() / 1000),
      level,
      message,
      data,
      prevHash: this.prevHash,
      pid: process.pid
    };
    entry.selfHash = this._hash(entry);
    this.prevHash = entry.selfHash;
    this.entries++;

    const line = `[${entry.timestamp}] [${level}] [seq=${entry.seq}] [hash=${entry.selfHash.slice(0, 16)}...] ${message}` +
      (data ? ` | ${JSON.stringify(data)}` : '');

    try {
      fs.appendFileSync(this.logFile, line + '\n');
      fs.appendFileSync(this.chainFile, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.error('LOG WRITE FAILED:', e.message);
    }

    const colors = {
      INFO: '\x1b[37m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m',
      WARN: '\x1b[33m', DEBUG: '\x1b[90m', BLOCK: '\x1b[36m',
      OTS: '\x1b[35m', AUDIT: '\x1b[93m'
    };
    console.log(`${colors[level] || ''}${line}\x1b[0m`);
    return entry;
  }

  info(m, d) { return this.log('INFO', m, d); }
  success(m, d) { return this.log('SUCCESS', m, d); }
  error(m, d) { return this.log('ERROR', m, d); }
  warn(m, d) { return this.log('WARN', m, d); }
  debug(m, d) { return this.log('DEBUG', m, d); }
  block(m, d) { return this.log('BLOCK', m, d); }
  ots(m, d) { return this.log('OTS', m, d); }
  audit(m, d) { return this.log('AUDIT', m, d); }

  verifyChain() {
    if (!fs.existsSync(this.chainFile)) return { valid: false, reason: 'no file' };
    const lines = fs.readFileSync(this.chainFile, 'utf8').trim().split('\n').filter(Boolean);
    let prev = '0'.repeat(64);
    for (const line of lines) {
      try {
        const e = JSON.parse(line);
        if (e.prevHash !== prev) return { valid: false, brokenAt: e.seq, reason: 'prevHash mismatch' };
        const copy = { ...e };
        delete copy.selfHash;
        if (this._hash(copy) !== e.selfHash) return { valid: false, brokenAt: e.seq, reason: 'selfHash mismatch' };
        prev = e.selfHash;
      } catch (err) {
        return { valid: false, reason: 'parse error: ' + err.message };
      }
    }
    return { valid: true, entries: lines.length, lastHash: prev };
  }

  getLogFile() { return this.logFile; }
  getChainFile() { return this.chainFile; }
}

module.exports = { ForensicLogger };