#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfiguration } from './config.js';
import { createPdfReport } from './configured-pdf-generator.js';

const usage = `08-pdf-report CLI
  node cli.js validate <report.json>
  node cli.js hash <report.json>
  node cli.js create --text TEXT [--title TITLE] [--output FILE]

The browser report engines load pdf-style-standard.js before rendering. The
create command uses the YAML-driven Node renderer and never overwrites an
existing output file.`;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${canonical(value[key])}`
    ).join(',')}}`;
  }
  return JSON.stringify(value);
}

function readReport(file) {
  const resolved = path.resolve(file);
  const value = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Report root must be a JSON object.');
  }
  return { resolved, value };
}

function parseCreateOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!['--title', '--text', '--output'].includes(key)) {
      throw new Error(`Unknown option: ${key}\n${usage}`);
    }
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    const name = key.slice(2);
    if (options[name] !== undefined) throw new Error(`Option repeated: ${key}`);
    options[name] = value;
  }
  return options;
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (!command || ['help', '--help', '-h'].includes(command)) {
    console.log(usage);
  } else if (command === 'validate' || command === 'hash') {
    if (args.length !== 1) throw new Error(usage);
    const { resolved, value } = readReport(args[0]);
    if (command === 'validate') {
      const missing = ['schema', 'generatedAt', 'application']
        .filter(key => value[key] === undefined);
      const result = {
        valid: missing.length === 0,
        schema: value.schema ?? null,
        generatedAt: value.generatedAt ?? null,
        missing
      };
      console.log(JSON.stringify(result, null, 2));
      if (!result.valid) process.exitCode = 2;
    } else {
      const digest = crypto.createHash('sha256').update(canonical(value)).digest('hex');
      console.log(JSON.stringify({
        file: resolved,
        schema: value.schema ?? null,
        sha256: digest
      }, null, 2));
    }
  } else if (command === 'create') {
    const options = parseCreateOptions(args);
    if (!options.text) throw new Error(`--text is required.\n${usage}`);
    const configuration = loadConfiguration();
    console.log(JSON.stringify(createPdfReport({
      ...options,
      title: options.title || configuration.settings.title,
      configuration
    }), null, 2));
  } else {
    throw new Error(`Unknown command: ${command}\n${usage}`);
  }
} catch (error) {
  console.error(`pdf-report: ${error.message}`);
  process.exitCode = 1;
}
