'use strict';

function parseBoundary(value, endOfDay = false) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new Error(`Invalid date boundary: ${value}`);
    return d;
  }
  const s = String(value).trim();
  if (!s) return null;
  // Date-only input is interpreted as UTC here. The Python adapter converts
  // local CLI dates to explicit offset-aware ISO timestamps before invoking us.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? `${s}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : s;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date boundary: ${value}`);
  return d;
}

function applyDateFilter(records, options = {}) {
  const from = parseBoundary(options.from, false);
  const to = parseBoundary(options.to, true);
  const field = options.field || 'event_time';
  const includeUndated = Boolean(options.includeUndated);

  if (from && to && from.getTime() > to.getTime()) {
    throw new Error(`Invalid date range: from (${from.toISOString()}) is after to (${to.toISOString()})`);
  }

  const included = [];
  const rejected = [];

  for (const record of records || []) {
    const raw = record?.[field];
    if (raw === null || raw === undefined || raw === '') {
      if (from || to) {
        if (includeUndated) included.push(record);
        else rejected.push({ record_key: record?.record_key || null, reason: 'missing-date', value: raw ?? null });
      } else {
        included.push(record);
      }
      continue;
    }

    const when = new Date(raw);
    if (Number.isNaN(when.getTime())) {
      rejected.push({ record_key: record?.record_key || null, reason: 'invalid-date', value: raw });
      continue;
    }
    if (from && when.getTime() < from.getTime()) {
      rejected.push({ record_key: record?.record_key || null, reason: 'before-range', value: when.toISOString() });
      continue;
    }
    if (to && when.getTime() > to.getTime()) {
      rejected.push({ record_key: record?.record_key || null, reason: 'after-range', value: when.toISOString() });
      continue;
    }
    included.push(record);
  }

  return {
    records: included,
    rejected,
    range: {
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      field,
      include_undated: includeUndated,
    },
    stats: {
      input: (records || []).length,
      included: included.length,
      rejected: rejected.length,
    },
  };
}

module.exports = { applyDateFilter };
