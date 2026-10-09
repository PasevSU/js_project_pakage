import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash, randomBytes } from 'node:crypto';
import { jsPDF } from 'jspdf';
import './pdf-style-standard.js';
import { loadConfiguration, packageDirectory } from './config.js';

const standard = globalThis.PasevSUPdfStandard;
const pointToMm = 25.4 / 72;

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

function rgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function applyTextColor(pdf, color) {
  pdf.setTextColor(...rgb(color));
}

function applyFillColor(pdf, color) {
  pdf.setFillColor(...rgb(color));
}

function applyDrawColor(pdf, color) {
  pdf.setDrawColor(...rgb(color));
}

function findFont(role) {
  return standard.fonts.candidates[role].find(candidate => fs.existsSync(candidate));
}

function registerFont(pdf, filePath, family, style) {
  const fileName = `${family}-${style}.ttf`;
  pdf.addFileToVFS(fileName, fs.readFileSync(filePath).toString('base64'));
  pdf.addFont(fileName, family, style);
}

function configureFonts(pdf) {
  const regular = findFont('regular');
  if (!regular && standard.fonts.requireEmbeddedUnicode) {
    throw new Error('No supported Unicode font was found. Install a font listed in pdf-style-standard.js before generating a PDF.');
  }
  if (!regular) return { regular: 'helvetica', bold: 'helvetica', mono: 'courier' };

  const families = standard.fonts.families;
  registerFont(pdf, regular, families.regular, 'normal');
  const bold = findFont('bold');
  if (bold) registerFont(pdf, bold, families.bold, 'bold');
  const mono = findFont('mono');
  if (mono) registerFont(pdf, mono, families.mono, 'normal');
  return {
    regular: families.regular,
    bold: bold ? families.bold : families.regular,
    mono: mono ? families.mono : families.regular
  };
}

function makeReportId(title, text, timestamp) {
  const digest = createHash('sha256').update(`${timestamp}\n${title}\n${text}`, 'utf8').digest('hex');
  return `RPT-${timestamp.replace(/\D/g, '').slice(0, 17)}-${digest.slice(0, 8).toUpperCase()}`;
}

function formatTimestamp(date, settings) {
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: settings.timeZone
  }).format(date);
}

class SvgNode {
  constructor(name) {
    this.name = name;
    this.children = [];
    this.attributes = {};
  }

  appendChild(node) {
    this.children.push(node);
    return node;
  }

  hasChildNodes() {
    return this.children.length > 0;
  }

  removeChild(node) {
    this.children.splice(this.children.indexOf(node), 1);
    return node;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  setAttributeNS(_namespace, name, value) {
    this.setAttribute(name, value);
  }
}

function createLegalQrMatrix() {
  const qrPath = path.resolve(packageDirectory, '..', '11-runtime-vendor', 'qrcodejs', 'qrcode.js');
  const document = {
    documentElement: { tagName: 'svg' },
    createElementNS: (_namespace, name) => new SvgNode(name)
  };
  const context = vm.createContext({ document, navigator: { userAgent: '' } });
  const source = fs.readFileSync(qrPath, 'utf8');
  vm.runInContext(source, context, { filename: qrPath });
  const QRCode = context.QRCode;
  if (typeof QRCode !== 'function') {
    throw new Error(`The bundled QR code provider did not load from ${qrPath}.`);
  }
  const payload = [standard.labels.legalHeading, ...standard.legalNotice].join('\n');
  const instance = new QRCode(new SvgNode('svg'), {
    text: payload,
    width: 256,
    height: 256,
    correctLevel: QRCode.CorrectLevel.M
  });
  const model = instance._oQRCode;
  if (!model?.getModuleCount || !model?.isDark) {
    throw new Error('The bundled QR code provider did not produce a matrix.');
  }
  const count = model.getModuleCount();
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => model.isDark(row, column))
  );
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
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('Report timestamp must be a valid Date.');
  }

  const { settings } = configuration;
  const pdf = new jsPDF({
    orientation: settings.orientation,
    unit: standard.page.unit,
    format: settings.pageSize,
    compress: true,
    putOnlyUsedFonts: true
  });
  const fonts = configureFonts(pdf);
  const page = pdf.internal.pageSize;
  const margins = settings.marginMm === standard.page.marginsMm.left
    ? standard.page.marginsMm
    : {
        left: settings.marginMm,
        right: settings.marginMm,
        top: settings.marginMm,
        bottom: settings.marginMm
      };
  const usableWidth = page.getWidth() - margins.left - margins.right;
  const bottom = page.getHeight() - margins.bottom;
  const footerY = page.getHeight() - 8;
  const bodyBottom = Math.min(
    page.getHeight() - margins.bottom,
    footerY - standard.page.footerReserveMm - standard.page.bodyFooterGapMm
  );
  if (usableWidth <= 0 || bodyBottom <= margins.top) {
    throw new RangeError('Configured margins do not fit on the selected PDF page.');
  }

  const normalizedTitle = title.trim();
  const normalizedText = text.trim();
  const timestamp = now.toISOString();
  const reportId = makeReportId(normalizedTitle, normalizedText, timestamp);
  const generated = formatTimestamp(now, settings);
  const lineHeight = settings.fontSizePt * pointToMm * 1.32;
  const pdfText = value => String(value ?? '').replace(/\r\n?/g, '\n');
  let y = margins.top;

  pdf.setProperties({
    title: normalizedTitle,
    subject: 'Technical evidence report',
    author: 'PasevSU',
    creator: 'PasevSU PDF report',
    keywords: 'technical report, evidence, SHA-256'
  });

  const setFont = (role, size) => {
    pdf.setFont(fonts[role], role === 'bold' ? 'bold' : 'normal');
    pdf.setFontSize(size);
  };
  const wrap = (value, width, role, size) => {
    setFont(role, size);
    return pdf.splitTextToSize(pdfText(value), width);
  };
  const writeWrapped = (value, {
    width = usableWidth,
    role = 'regular',
    size = settings.fontSizePt,
    leading = lineHeight,
    x = margins.left,
    color = standard.colors.ink
  } = {}) => {
    const lines = wrap(value, width, role, size);
    for (const line of lines) {
      if (y + leading > bodyBottom) addPage();
      setFont(role, size);
      applyTextColor(pdf, color);
      pdf.text(line, x, y);
      y += leading;
    }
    return lines.length;
  };
  const addPage = () => {
    pdf.addPage();
    drawRunningHeader();
    y = margins.top + 9;
  };
  const drawRunningHeader = () => {
    setFont('bold', standard.fonts.sizesPt.footer);
    applyTextColor(pdf, standard.colors.muted);
    pdf.text(standard.labels.footerBrand, margins.left, 12);
    pdf.text(reportId, page.getWidth() - margins.right, 12, { align: 'right' });
    applyDrawColor(pdf, standard.colors.grid);
    pdf.setLineWidth(0.2);
    pdf.line(margins.left, 16, page.getWidth() - margins.right, 16);
  };
  const drawSectionHeading = label => {
    const height = standard.fonts.leadingPt.heading * pointToMm;
    if (y + height + lineHeight > bodyBottom) addPage();
    setFont('bold', standard.fonts.sizesPt.heading);
    applyTextColor(pdf, standard.colors.accent);
    pdf.text(label, margins.left, y);
    y += height;
    applyDrawColor(pdf, standard.colors.grid);
    pdf.setLineWidth(standard.tables.rowRulePt * pointToMm);
    pdf.line(margins.left, y - 1, page.getWidth() - margins.right, y - 1);
    y += lineHeight * 0.35;
  };
  const drawKeyValue = (label, value, index) => {
    const labelWidth = usableWidth * 0.29;
    const valueWidth = usableWidth - labelWidth - 4;
    const isHash = /hash|sha-?\d|md5|ripemd|digest/i.test(label);
    const valueRole = isHash ? 'mono' : 'regular';
    const valueSize = isHash ? standard.fonts.sizesPt.tableHash : standard.fonts.sizesPt.tableText;
    const valueLeading = (isHash ? standard.fonts.leadingPt.hash : standard.fonts.leadingPt.table) * pointToMm;
    const labelLines = wrap(`${label}:`, labelWidth, 'bold', standard.fonts.sizesPt.tableText);
    const valueLines = wrap(value || '—', valueWidth, valueRole, valueSize);
    const labelLeading = standard.fonts.leadingPt.table * pointToMm;
    let valueOffset = 0;
    while (valueOffset < valueLines.length) {
      const availableLines = Math.floor((bodyBottom - y - 2) / Math.max(valueLeading, labelLeading));
      if (availableLines < 1) {
        addPage();
        continue;
      }
      const labelChunk = valueOffset === 0
        ? labelLines.slice(0, availableLines)
        : wrap(`${label} (continued):`, labelWidth, 'bold', standard.fonts.sizesPt.tableText).slice(0, availableLines);
      const valueChunk = valueLines.slice(valueOffset, valueOffset + availableLines);
      const rowHeight = Math.max(
        4,
        labelChunk.length * labelLeading,
        valueChunk.length * valueLeading
      ) + 1.3;
      if (index % 2 === 1) {
        applyFillColor(pdf, standard.colors.stripe);
        pdf.rect(margins.left, y - 2.4, usableWidth, rowHeight, 'F');
      }
      if (labelChunk.length) {
        setFont('bold', standard.fonts.sizesPt.tableText);
        applyTextColor(pdf, standard.colors.ink);
        pdf.text(labelChunk, margins.left + 1, y);
      }
      if (valueChunk.length) {
        setFont(valueRole, valueSize);
        applyTextColor(pdf, standard.colors.ink);
        pdf.text(valueChunk, margins.left + labelWidth, y);
      }
      y += rowHeight;
      applyDrawColor(pdf, standard.colors.grid);
      pdf.setLineWidth(0.1);
      pdf.line(margins.left, y - 1, page.getWidth() - margins.right, y - 1);
      valueOffset += valueChunk.length;
      if (valueOffset < valueLines.length) addPage();
    }
  };
  const drawLegalNotice = () => {
    const padding = standard.components.legalPaddingPt * pointToMm;
    const qrSize = standard.components.qrSizeMm;
    const qrColumnWidth = qrSize + 5;
    const columnGap = 3;
    const legalWidth = usableWidth - qrColumnWidth - columnGap - padding * 2;
    const legalSize = standard.fonts.sizesPt.legal;
    const leading = standard.fonts.leadingPt.legal * pointToMm;
    const paragraphs = standard.legalNotice.flatMap((paragraph, index) => {
      const lines = wrap(paragraph, legalWidth, 'regular', legalSize);
      return index === 0 ? lines : ['', ...lines];
    });
    const textHeight = paragraphs.length * leading;
    const boxY = y;
    const qrCaption = wrap(
      standard.labels.qrCaption,
      qrColumnWidth - 2,
      'regular',
      standard.fonts.sizesPt.footer
    );
    const qrCaptionLeading = 7.5 * pointToMm;
    const qrHeight = qrSize + qrCaption.length * qrCaptionLeading + 2;
    const boxHeight = Math.max(textHeight + leading * 2, qrHeight) + padding * 2;
    applyFillColor(pdf, standard.colors.legalBackground);
    pdf.rect(margins.left, y, usableWidth, boxHeight, 'F');
    applyDrawColor(pdf, standard.colors.grid);
    pdf.setLineWidth(0.2);
    pdf.rect(margins.left, y, usableWidth, boxHeight, 'S');
    y += padding + leading;
    setFont('bold', legalSize);
    applyTextColor(pdf, standard.colors.ink);
    pdf.text(standard.labels.legalHeading, margins.left + padding, y);
    y += leading;
    for (const line of paragraphs) {
      if (!line) {
        y += leading * 0.25;
        continue;
      }
      setFont('regular', legalSize);
      applyTextColor(pdf, standard.colors.ink);
      pdf.text(line, margins.left + padding, y);
      y += leading;
    }
    const qrX = margins.left + padding + legalWidth + columnGap;
    let qrY = boxY + padding;
    const qrMatrix = createLegalQrMatrix();
    const quietZone = 1;
    const qrInnerSize = qrSize - quietZone * 2;
    const moduleSize = qrInnerSize / qrMatrix.length;
    applyFillColor(pdf, standard.colors.paper);
    pdf.rect(qrX, qrY, qrSize, qrSize, 'F');
    applyDrawColor(pdf, standard.colors.grid);
    pdf.setLineWidth(0.2);
    pdf.rect(qrX, qrY, qrSize, qrSize, 'S');
    applyFillColor(pdf, standard.colors.ink);
    for (let row = 0; row < qrMatrix.length; row++) {
      for (let column = 0; column < qrMatrix[row].length; column++) {
        if (qrMatrix[row][column]) {
          pdf.rect(
            qrX + quietZone + column * moduleSize,
            qrY + quietZone + row * moduleSize,
            moduleSize + 0.015,
            moduleSize + 0.015,
            'F'
          );
        }
      }
    }
    qrY += qrSize + qrCaptionLeading;
    setFont('regular', standard.fonts.sizesPt.footer);
    applyTextColor(pdf, standard.colors.muted);
    pdf.text(qrCaption, qrX + 1, qrY, { lineHeightFactor: 1.05 });
    y = boxY + boxHeight + padding;
  };
  const drawFirstPageHeader = () => {
    setFont('regular', standard.fonts.sizesPt.body);
    applyTextColor(pdf, standard.colors.muted);
    pdf.text(standard.labels.kicker, margins.left, y);
    y += 7;
    for (const line of wrap(normalizedTitle, usableWidth, 'bold', standard.fonts.sizesPt.title)) {
      if (y + 7 > bodyBottom) addPage();
      setFont('bold', standard.fonts.sizesPt.title);
      applyTextColor(pdf, standard.colors.accent);
      pdf.text(line, margins.left, y);
      y += 7;
    }
    setFont('regular', standard.fonts.sizesPt.subtitle);
    applyTextColor(pdf, standard.colors.muted);
    pdf.text(standard.labels.subtitle, margins.left, y);
    y += 3;
    applyDrawColor(pdf, standard.colors.accent);
    pdf.setLineWidth(0.8);
    pdf.line(margins.left, y, page.getWidth() - margins.right, y);
    y += 5;
    drawLegalNotice();
    y += lineHeight;
  };
  const drawFooter = () => {
    const pageCount = pdf.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      pdf.setPage(pageNumber);
      applyDrawColor(pdf, standard.colors.grid);
      pdf.setLineWidth(0.2);
      pdf.line(margins.left, footerY - 3, page.getWidth() - margins.right, footerY - 3);
      setFont('regular', standard.fonts.sizesPt.footer);
      applyTextColor(pdf, standard.colors.muted);
      pdf.text(`${standard.labels.footerLicense} · ${standard.labels.footerDeveloper}`, margins.left, footerY);
      pdf.text(`Seite ${pageNumber} / ${pageCount}`, page.getWidth() / 2, footerY, { align: 'center' });
      pdf.text(reportId, page.getWidth() - margins.right, footerY, { align: 'right' });
      setFont('regular', standard.fonts.sizesPt.footer);
      pdf.text(standard.labels.footerUrl, page.getWidth() - margins.right, footerY + 3.5, { align: 'right' });
    }
  };

  drawFirstPageHeader();
  drawSectionHeading(standard.labels.systemHeading);
  drawKeyValue('Generated', generated, 0);
  drawKeyValue('Report ID', reportId, 1);
  drawKeyValue('Report Type', 'Technical Evidence Report', 2);
  drawKeyValue('Report Title', normalizedTitle, 3);
  y += lineHeight * 0.6;
  drawSectionHeading(standard.labels.contentHeading);

  let rowIndex = 0;
  for (const sourceLine of normalizedText.split('\n')) {
    const line = sourceLine.trim();
    if (!line) {
      y += lineHeight * 0.5;
      continue;
    }
    const separator = line.indexOf(':');
    const label = separator > 0 ? line.slice(0, separator).trim() : '';
    const value = separator > 0 ? line.slice(separator + 1).trim() : '';
    if (label && value && label.length < 48) {
      drawKeyValue(label, value, rowIndex++);
    } else {
      writeWrapped(line);
    }
  }

  drawFooter();
  const target = path.resolve(
    packageDirectory,
    output || path.join(settings.outputDirectory, 'evidence-report.pdf')
  );
  writeFileAtomicallyWithoutOverwrite(target, Buffer.from(pdf.output('arraybuffer')));
  return { output: target, bytes: fs.statSync(target).size, pages: pdf.getNumberOfPages(), reportId };
}
