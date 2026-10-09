import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { jsPDF } from 'jspdf';
import { loadConfiguration, packageDirectory } from './config.js';

function writeFileAtomicallyWithoutOverwrite(target, bytes) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 });
    fs.linkSync(temporary, target);
  } finally {
    try {
      fs.unlinkSync(temporary);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

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
  const footerReserve = settings.includeTimestamp ? 10 : 0;
  if (usableWidth <= 0 || page.getHeight() <= margin * 2 + footerReserve) {
    throw new RangeError('Configured margins do not fit on the selected PDF page.');
  }
  pdf.setProperties({ title: title.trim(), subject: 'Evidence report' });
  pdf.setFontSize(settings.fontSizePt);
  const lineHeight = settings.fontSizePt * 25.4 / 72 * 1.2;
  const bottom = page.getHeight() - margin - footerReserve;
  let y = margin + lineHeight;
  const writeLines = lines => {
    for (const line of lines) {
      if (y > bottom) {
        pdf.addPage();
        y = margin + lineHeight;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
  };
  writeLines(pdf.splitTextToSize(title.trim(), usableWidth));
  y += lineHeight * 0.5;
  writeLines(pdf.splitTextToSize(text, usableWidth));
  if (settings.includeTimestamp) {
    const timestamp = new Intl.DateTimeFormat(settings.locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'UTC'
    }).format(now);
    const pageCount = pdf.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      pdf.setPage(pageNumber);
      pdf.setFontSize(8);
      pdf.text(`Generated: ${timestamp} (UTC)`, margin, page.getHeight() - margin / 2);
    }
  }

  const target = path.resolve(
    packageDirectory,
    output || path.join(settings.outputDirectory, 'evidence-report.pdf')
  );
  writeFileAtomicallyWithoutOverwrite(target, Buffer.from(pdf.output('arraybuffer')));
  return { output: target, bytes: fs.statSync(target).size, pages: pdf.getNumberOfPages() };
}
