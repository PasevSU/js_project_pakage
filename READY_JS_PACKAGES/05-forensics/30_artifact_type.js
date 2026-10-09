'use strict';

const path = require('path');

function classify(filename, baseName) {
  const n = String(filename || '').replace(/\\/g, '/');
  const lower = n.toLowerCase();
  const ext = path.extname(lower);
  const base = String(baseName || '').toLowerCase();

  // Attachment context must win before generic extension classification.
  if (lower.includes('/attachments/') || lower.startsWith('attachments/') || lower.includes('.eml.attachments/')) {
    if (['.exe', '.dll', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.scr', '.hta'].includes(ext)) return 'ATTACHMENT (DANGEROUS)';
    if (ext === '.pdf') return 'ATTACHMENT (PDF)';
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'].includes(ext)) return 'ATTACHMENT (IMAGE)';
    if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'].includes(ext)) return 'ATTACHMENT (OFFICE)';
    if (['.txt', '.log', '.csv', '.md', '.json', '.xml', '.ini', '.cfg'].includes(ext)) return 'ATTACHMENT (TEXT)';
    return 'ATTACHMENT';
  }

  if (ext === '.eml' && !lower.startsWith(`${base}.eml.de`)) return 'ORIGINAL EML';
  if (ext === '.sig') return 'SIGNATURE';
  if (ext === '.sha256') return 'SHA256 HASH';
  if (ext === '.pdf') {
    if (lower.includes('combined')) return 'COMBINED REPORT';
    if (lower.includes('individual')) return 'INDIVIDUAL REPORT';
    if (lower.includes('hash_report')) return 'INDIVIDUAL REPORT';
    return 'PDF PROOF';
  }
  if (ext === '.txt') {
    if (lower.includes('raw_eml') || lower.includes('main.txt')) return 'RAW EML TEXT';
    if (lower.includes('extracted')) return 'EXTRACTED TEXT';
    return 'TEXT';
  }
  if (ext === '.html' && !lower.includes('analysis')) return 'HTML EXTRACTED';
  if (ext === '.bin') {
    if (lower.includes('raw_headers')) return 'RAW HEADERS';
    if (lower.includes('decoded')) return 'DECODED PART';
    return 'BINARY';
  }
  if (lower.includes('.part_') && (lower.includes('_raw') || lower.endsWith('_raw'))) return 'RAW PART';
  if (ext === '.json') {
    if (lower.includes('core')) return 'CORE JSON';
    if (lower.includes('routing')) return 'ROUTING';
    if (lower.includes('attachments')) return 'ATTACHMENTS JSON';
    if (lower.includes('deep_forensic')) return 'DEEP FORENSIC';
    if (lower.includes('advanced-forensics') || lower.includes('advanced_forensics')) return 'ADVANCED FORENSICS';
    if (lower.includes('filesystem')) return 'FILESYSTEM';
    if (lower.includes('preservation')) return 'PRESERVATION';
    if (lower.includes('timeline')) return 'TIMELINE';
    if (lower.includes('threat-matrix') || lower.includes('threat_matrix')) return 'THREAT MATRIX';
    if (lower.includes('enterprise-summary') || lower.includes('enterprise_summary')) return 'ENTERPRISE SUMMARY';
    if (lower.includes('manifest')) return 'MANIFEST';
    if (lower.includes('timestamps')) return 'TIMESTAMPS';
    if (lower.includes('chain-of-custody') || lower.includes('chain_of_custody')) return 'CHAIN OF CUSTODY';
    if (lower.includes('anomalies')) return 'ANOMALIES';
    if (lower.includes('dns_analysis') || lower.includes('dns-analysis')) return 'DNS ANALYSIS';
    if (lower.includes('evidence_id')) return 'EVIDENCE ID';
    if (lower.includes('forensic_report')) return 'FORENSIC REPORT';
    if (lower.includes('batch_forensic')) return 'BATCH FORENSIC REPORT';
    if (lower.includes('html_analysis')) return 'HTML ANALYSIS';
    return 'JSON ARTIFACT';
  }
  return 'OTHER';
}

module.exports = {
  id: 'artifact_type',
  version: '1.1.4',
  priority: 30,
  async extract(context) {
    return {
      records: (context.records || []).map((record) => ({
        record_key: record.record_key,
        type: record.kind === 'directory' ? 'DIRECTORY' : classify(record.name, context.baseName),
      })),
    };
  },
};
