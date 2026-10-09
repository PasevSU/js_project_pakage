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

    const now = new Date();
    let html = `
        <div style="background:#ffffff;color:#111827;font-family:Arial;padding:10mm;">
            <div style="border-top:3px solid #1f2937;border-bottom:1px solid #9ca3af;padding:8mm 0 6mm 0;margin-bottom:7mm;">
                <div style="font-size:9pt;font-weight:700;letter-spacing:1.5pt;color:#374151;">PASEVSU · Denislav Dimitrov Pasev</div>
                <div style="margin-top:8mm;font-size:20pt;font-weight:700;line-height:1.15;color:#111827;">DIGITALER BEWEIS-PRÜFBERICHT</div>
                <div style="margin-top:2.5mm;font-size:10pt;color:#6b7280;">Ultimate · Blockchair API · ${report.stats.found}/${report.stats.total} TXID-и потвърдени</div>
            </div>

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
        await html2pdf().set({
            margin: [10, 10, 12, 10],
            filename: `PasevSU-Prüfbericht-${report.reportId}.pdf`,
            image: { type: 'jpeg', quality: 0.9 },
            html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(courtReport).save();
        showToast('✅ PDF-отчетът е генериран.', 'success');
    } catch (error) {
        showToast('❌ PDF грешка: ' + error.message, 'error');
    }
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