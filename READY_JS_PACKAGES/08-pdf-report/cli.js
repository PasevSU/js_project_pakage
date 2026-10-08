#!/usr/bin/env node
import { loadConfiguration } from './config.js';
import { createPdfReport } from './pdf-generator.js';

const usage = `PDF report CLI
  node cli.js create --text TEXT [--title TITLE] [--output FILE]
  node cli.js --help

Page format, orientation, locale, margins, timestamp, and default output path
are read from configuration.yaml. Existing output files are not overwritten.`;

function parse(args) {
  const [command, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index++) {
    const key = rest[index];
    if (!['--title', '--text', '--output'].includes(key)) {
      throw new Error(`Unknown option: ${key}\n${usage}`);
    }
    const value = rest[++index];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }
    if (options[key.slice(2)] !== undefined) {
      throw new Error(`Option repeated: ${key}`);
    }
    options[key.slice(2)] = value;
  }
  return { command, options };
}

try {
  const { command, options } = parse(process.argv.slice(2));
  if (!command || ['--help', '-h', 'help'].includes(command)) {
    console.log(usage);
  } else if (command === 'create') {
    if (!options.text) {
      throw new Error(`--text is required.\n${usage}`);
    }
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
