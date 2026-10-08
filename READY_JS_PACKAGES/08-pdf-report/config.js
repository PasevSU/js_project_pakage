import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));

export function loadConfiguration(file = path.join(packageDirectory, 'configuration.yaml')) {
  const configuration = YAML.parse(fs.readFileSync(file, 'utf8'));
  if (configuration?.package?.id !== '08-pdf-report') {
    throw new Error(`Expected an 08-pdf-report configuration in ${file}.`);
  }
  const settings = configuration.settings;
  if (!['A4', 'Letter', 'Legal'].includes(settings?.pageSize)) {
    throw new TypeError('settings.pageSize must be A4, Letter, or Legal.');
  }
  if (!['portrait', 'landscape'].includes(settings?.orientation)) {
    throw new TypeError('settings.orientation must be portrait or landscape.');
  }
  if (typeof settings.locale !== 'string' || !settings.locale) {
    throw new TypeError('settings.locale must be a locale identifier.');
  }
  if (!Number.isFinite(settings.marginMm) || settings.marginMm < 0) {
    throw new TypeError('settings.marginMm must be a non-negative number.');
  }
  if (!Number.isFinite(settings.fontSizePt) || settings.fontSizePt <= 0) {
    throw new TypeError('settings.fontSizePt must be a positive number.');
  }
  if (typeof settings.includeTimestamp !== 'boolean') {
    throw new TypeError('settings.includeTimestamp must be a boolean.');
  }
  if (typeof settings.outputDirectory !== 'string' || !settings.outputDirectory) {
    throw new TypeError('settings.outputDirectory must be a non-empty path.');
  }
  return configuration;
}

export { packageDirectory };
