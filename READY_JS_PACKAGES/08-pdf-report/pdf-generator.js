import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';
import { loadConfiguration, packageDirectory } from './config.js';

export function createPdfReport({
  title,
  text,
  output,
  configuration = loadConfiguration(),
  now = new Date()
}) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new TypeError('Report title must be a non-empty string.');
  }
  if (typeof text !== 'string' || !text.trim()) {
    throw new TypeError('Report text must be a non-empty string.');
  }

  const { settings } = configuration;
  const pdf = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: settings.pageSize
  });
  const page = pdf.internal.pageSize;
  const margin = settings.marginMm;
  const usableWidth = page.getWidth() - margin * 2;
  if (usableWidth <= 0 || page.getHeight() <= margin * 2) {
    throw new RangeError('Configured margins do not fit on the selected PDF page.');
  }
  pdf.setProperties({ title: title.trim(), subject: 'Evidence report' });
  pdf.setFontSize(settings.fontSizePt);
  pdf.text(title.trim(), margin, margin + settings.fontSizePt * 0.4);
  const lines = pdf.splitTextToSize(text, usableWidth);
  pdf.text(lines, margin, margin + 14);
  if (settings.includeTimestamp) {
    const timestamp = new Intl.DateTimeFormat(settings.locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'UTC'
    }).format(now);
    pdf.setFontSize(8);
    pdf.text(`Generated: ${timestamp} (UTC)`, margin, page.getHeight() - margin / 2);
  }

  const target = path.resolve(
    packageDirectory,
    output || path.join(settings.outputDirectory, 'evidence-report.pdf')
  );
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(pdf.output('arraybuffer')), {
    flag: 'wx',
    mode: 0o600
  });
  return { output: target, bytes: fs.statSync(target).size };
}
