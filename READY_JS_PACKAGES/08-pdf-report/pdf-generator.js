// pdf-generator.js - PDF отчет

async function generatePDFReport(report) {
    if (!report) {
        showToast('⚠️ Няма данни за PDF.', 'warn');
        return;
    }

    if (typeof html2pdf === 'undefined') {
        showToast('❌ PDF-Engine не е зареден.', 'error');
        return;
    }
    const standard = globalThis.PasevSUPdfStandard;
    if (!standard) {
        showToast('❌ PDF стандартът не е зареден.', 'error');
        return;
    }

    const now = new Date();
    let qrDataUrl;
    try {
        qrDataUrl = await createQrSvgDataUrl([
            standard.labels.legalHeading,
            ...standard.legalNotice,
            `Report ID: ${report.reportId || 'N/A'}`,
            `SHA-256: ${report.ots?.sha256 || 'N/A'}`
        ].join('\n'));
    } catch (error) {
        showToast(`❌ QR-Code konnte nicht erstellt werden: ${error.message}`, 'error');
        return;
    }
    const legalNotice = standard.legalNotice
        .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');
    const qrPanel = qrDataUrl
        ? `<div class="pdf-legal-qr"><img src="${qrDataUrl}" alt="QR code with legal references"><small>${escapeHtml(standard.labels.qrCaption)}</small></div>`
        : '';
    let html = `
        <style>
            @page { size: ${standard.page.format} ${standard.page.orientation}; margin: ${standard.page.marginsMm.top}mm ${standard.page.marginsMm.right}mm ${standard.page.marginsMm.bottom}mm ${standard.page.marginsMm.left}mm; }
            .pasevsu-report { background:${standard.colors.paper}!important; color:${standard.colors.ink}!important; font-family:Arial,sans-serif!important; padding:0!important; }
            .pasevsu-report h2 { color:${standard.colors.accent}!important; font-size:${standard.fonts.sizesPt.heading}pt!important; page-break-after:avoid; }
            .pasevsu-report table { border-collapse:collapse!important; }
            .pasevsu-report th { background:${standard.colors.accent}!important; color:#fff!important; font-size:${standard.fonts.sizesPt.tableHeader}pt!important; }
            .pasevsu-report th,.pasevsu-report td { border-color:${standard.colors.grid}!important; }
            .pasevsu-report td { color:${standard.colors.ink}!important; font-size:${standard.fonts.sizesPt.tableText}pt!important; }
            .pasevsu-report td[style*="monospace"] { font-family:Consolas,monospace!important; font-size:${standard.fonts.sizesPt.tableHash}pt!important; }
            .pasevsu-report .pdf-legal { display:grid; grid-template-columns:${qrDataUrl ? '1fr 35mm' : '1fr'}; gap:3mm; background:${standard.colors.legalBackground}; border:0.4pt solid ${standard.colors.grid}; color:${standard.colors.ink}; padding:3mm; font-size:${standard.fonts.sizesPt.legal}pt; line-height:1.25; margin:0 0 6mm; page-break-inside:avoid; }
            .pasevsu-report .pdf-legal p { margin:0 0 1.2mm; }
            .pasevsu-report .pdf-legal p:last-child { margin-bottom:0; }
            .pasevsu-report .pdf-legal-qr { align-self:start; border:0.4pt solid ${standard.colors.accent}; padding:1mm; font-size:${standard.fonts.sizesPt.footer}pt; line-height:1.25; color:${standard.colors.muted}; }
            .pasevsu-report .pdf-legal-qr img { display:block; width:${standard.components.qrSizeMm}mm; height:${standard.components.qrSizeMm}mm; margin:0 auto 1mm; }
            .pasevsu-report .pdf-header { border-color:${standard.colors.accent}!important; }
        </style>
        <div class="pasevsu-report" style="background:${standard.colors.paper};color:${standard.colors.ink};font-family:Arial;padding:0;">
            <div style="border-top:3px solid #1f2937;border-bottom:1px solid #9ca3af;padding:8mm 0 6mm 0;margin-bottom:7mm;">
                <div style="font-size:9pt;font-weight:700;letter-spacing:1.5pt;color:${standard.colors.muted};">${standard.labels.kicker}</div>
                <div style="margin-top:8mm;font-size:${standard.fonts.sizesPt.title}pt;font-weight:700;line-height:1.15;color:${standard.colors.accent};">DIGITALER BEWEIS-PRÜFBERICHT</div>
                <div style="margin-top:2.5mm;font-size:10pt;color:#6b7280;">Ultimate · Blockchair API · ${report.stats.found}/${report.stats.total} TXID-и потвърдени</div>
            </div>
            <div class="pdf-legal"><div class="pdf-legal-copy"><strong>${standard.labels.legalHeading}</strong>${legalNotice}</div>${qrPanel}</div>

            <div style="margin-bottom:6mm;page-break-inside:avoid;">
                <h2 style="font-size:11pt;font-weight:700;color:#111827;border-bottom:1px solid #4b5563;padding-bottom:1.5mm;margin-bottom:2.5mm;">1. IDENTIFIKATION</h2>
                <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Bericht-ID</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;">${report.reportId}</td>
                    </tr>
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Статус</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;">${report.summary.verdict}</td>
                    </tr>
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Скор</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;">${report.stats.score}%</td>
                    </tr>
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Потвърдени TXID</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;">${report.stats.found}/${report.stats.total}</td>
                    </tr>
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Доказателствена стойност</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;font-weight:700;color:#14532d;">${report.evidence.level} (${report.evidence.value})</td>
                    </tr>
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Генериран</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;">${now.toLocaleString('de-DE')}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom:6mm;page-break-inside:avoid;">
                <h2 style="font-size:11pt;font-weight:700;color:#111827;border-bottom:1px solid #4b5563;padding-bottom:1.5mm;margin-bottom:2.5mm;">2. OTS ВЕРИФИКАЦИЯ</h2>
                <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">Статус</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:8.3pt;">${report.ots.status}</td>
                    </tr>
                    <tr>
                        <th style="width:30%;background:#f3f4f6;border:0.4pt solid #9ca3af;padding:2mm 2.5mm;text-align:left;font-size:8.3pt;font-weight:700;">SHA-256</th>
                        <td style="border:0.4pt solid #9ca3af;padding:2mm 2.5mm;font-size:7pt;font-family:monospace;word-break:break-all;">${report.ots.sha256}</td>
                    </tr>
                </table>
            </div>
    `;

    // Блокчейн резултати
    if (report.blockchain && report.blockchain.length > 0) {
        html += `
            <div style="margin-bottom:6mm;page-break-inside:avoid;">
                <h2 style="font-size:11pt;font-weight:700;color:#111827;border-bottom:1px solid #4b5563;padding-bottom:1.5mm;margin-bottom:2.5mm;">3. BLOCKCHAIN ВЕРИФИКАЦИЯ</h2>
                <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:7pt;">
                    <thead>
                        <tr>
                            <th style="background:#f3f4f6;border:0.4pt solid #9ca3af;padding:1.5mm 2mm;text-align:left;font-weight:700;">Блокчейн</th>
                            <th style="background:#f3f4f6;border:0.4pt solid #9ca3af;padding:1.5mm 2mm;text-align:left;font-weight:700;">Статус</th>
                            <th style="background:#f3f4f6;border:0.4pt solid #9ca3af;padding:1.5mm 2mm;text-align:left;font-weight:700;">TXID</th>
                            <th style="background:#f3f4f6;border:0.4pt solid #9ca3af;padding:1.5mm 2mm;text-align:left;font-weight:700;">Блок</th>
                            <th style="background:#f3f4f6;border:0.4pt solid #9ca3af;padding:1.5mm 2mm;text-align:left;font-weight:700;">Потвърждения</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const result of report.blockchain) {
            html += `
                <tr>
                    <td style="border:0.4pt solid #9ca3af;padding:1.5mm 2mm;">${getChainName(result.chain)}</td>
                    <td style="border:0.4pt solid #9ca3af;padding:1.5mm 2mm;${result.found ? 'color:#14532d;font-weight:700;' : 'color:#991b1b;font-weight:700;'}">${result.found ? '✅ НАМЕРЕН' : '❌ НЕ НАМЕРЕН'}</td>
                    <td style="border:0.4pt solid #9ca3af;padding:1.5mm 2mm;font-family:monospace;font-size:6pt;word-break:break-all;">${result.txid || 'N/A'}</td>
                    <td style="border:0.4pt solid #9ca3af;padding:1.5mm 2mm;">${result.blockId || 'N/A'}</td>
                    <td style="border:0.4pt solid #9ca3af;padding:1.5mm 2mm;">${result.confirmations || 'N/A'}</td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    // Доказателствена стойност
    html += `
            <div style="margin-bottom:6mm;padding:3mm;border:0.8pt solid #166534;background:#f0fdf4;color:#14532d;page-break-inside:avoid;">
                <strong>📋 ДОКАЗАТЕЛСТВЕНА СТОЙНОСТ:</strong>
                <div style="margin-top:1mm;font-size:8pt;">${report.evidence.description}</div>
                <div style="margin-top:1mm;font-size:8pt;font-weight:700;">Оценка: ${report.evidence.level} (${report.evidence.value})</div>
            </div>

            <div style="margin-top:6mm;padding-top:2mm;border-top:0.5pt solid #9ca3af;display:flex;justify-content:space-between;font-size:7pt;color:#6b7280;">
                <span>PasevSU · Denislav Dimitrov Pasev</span>
                <span>${now.toISOString()}</span>
            </div>
        </div>
    `;

    courtReport.innerHTML = html;

    try {
        const worker = html2pdf().set({
            margin: [
                standard.page.marginsMm.top,
                standard.page.marginsMm.right,
                standard.page.marginsMm.bottom,
                standard.page.marginsMm.left
            ],
            filename: `PasevSU-Prüfbericht-${report.reportId}.pdf`,
            image: { type: 'jpeg', quality: 0.9 },
            html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' },
            pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-legal'] },
            jsPDF: { unit: standard.page.unit, format: standard.page.format, orientation: standard.page.orientation }
        }).from(courtReport).toPdf();
        const pdf = await worker.get('pdf');
        const pageCount = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
            pdf.setPage(pageNumber);
            pdf.setFontSize(standard.fonts.sizesPt.footer);
            pdf.setTextColor(...hexToRgb(standard.colors.muted));
            pdf.text(standard.labels.footerBrand, standard.page.marginsMm.left, pageHeight - 9);
            pdf.text(`${pageNumber} / ${pageCount}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
            pdf.text(String(report.reportId || ''), pageWidth - standard.page.marginsMm.right, pageHeight - 9, { align: 'right' });
        }
        await worker.save();
        showToast(
            qrDataUrl
                ? '✅ PDF-отчетът е генериран.'
                : '⚠️ PDF-отчетът е генериран без QR код: липсва QR provider.',
            qrDataUrl ? 'success' : 'warn'
        );
    } catch (error) {
        showToast('❌ PDF грешка: ' + error.message, 'error');
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

async function createQrSvgDataUrl(payload) {
    let matrix;
    if (typeof window.qrcode === 'function') {
        const qr = window.qrcode(0, 'M');
        qr.addData(payload);
        qr.make();
        const count = qr.getModuleCount();
        matrix = Array.from({ length: count }, (_, row) =>
            Array.from({ length: count }, (_, column) => qr.isDark(row, column))
        );
    } else if (typeof window.QRCode === 'function') {
        const host = document.createElement('div');
        host.style.position = 'fixed';
        host.style.left = '-10000px';
        document.body.append(host);
        try {
            const instance = new window.QRCode(host, {
                text: payload,
                width: 192,
                height: 192,
                correctLevel: window.QRCode.CorrectLevel?.M
            });
            await new Promise(resolve => setTimeout(resolve, 20));
            const model = instance._oQRCode;
            if (model?.getModuleCount && model?.isDark) {
                const count = model.getModuleCount();
                matrix = Array.from({ length: count }, (_, row) =>
                    Array.from({ length: count }, (_, column) => model.isDark(row, column))
                );
            }
        } finally {
            host.remove();
        }
    }
    if (!matrix?.length) return null;

    const quietZone = 4;
    const size = matrix.length + quietZone * 2;
    const squares = [];
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix[row].length; column++) {
            if (matrix[row][column]) {
                squares.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
            }
        }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="${squares.join('')}"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hexToRgb(hex) {
    return [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16)
    ];
}

function getChainName(chainId) {
    const names = {
        'bitcoin': 'Bitcoin',
        'bitcoin-cash': 'Bitcoin Cash',
        'litecoin': 'Litecoin',
        'bitcoin-sv': 'Bitcoin SV',
        'dogecoin': 'Dogecoin',
        'dash': 'Dash',
        'groestlcoin': 'Groestlcoin',
        'zcash': 'Zcash',
        'ecash': 'eCash',
        'bitcoin/testnet': 'Bitcoin Testnet'
    };
    return names[chainId] || chainId;
}

function getChainIcon(chainId) {
    const icons = {
        'bitcoin': '₿',
        'bitcoin-cash': '₿',
        'litecoin': 'Ł',
        'bitcoin-sv': '₿',
        'dogecoin': 'Ð',
        'dash': 'Ɗ',
        'groestlcoin': 'GRS',
        'zcash': 'ⓩ',
        'ecash': '₿',
        'bitcoin/testnet': '🧪'
    };
    return icons[chainId] || '⛓️';
}