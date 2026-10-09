(() => {
  const standard = {
    page: {
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
      marginsMm: { left: 20, right: 20, top: 20, bottom: 35 },
      footerReserveMm: 15,
      bodyFooterGapMm: 5
    },
    colors: {
      ink: '#1a2733',
      accent: '#293e50',
      muted: '#526579',
      grid: '#d4dce4',
      stripe: '#f3f6f9',
      paper: '#ffffff',
      legalBackground: '#f1f2f4',
      warning: '#8b0000',
      success: '#15803d'
    },
    fonts: {
      families: { regular: 'PasevUnicode', bold: 'PasevUnicode', mono: 'PasevMono' },
      sizesPt: {
        title: 20,
        heading: 12,
        subtitle: 10,
        body: 9,
        legal: 8,
        tableHeader: 8,
        tableText: 7,
        tableHash: 6.5,
        footer: 6
      },
      leadingPt: { body: 12, heading: 16, legal: 10, table: 9, hash: 8 },
      candidates: {
        regular: [
          'C:/Windows/Fonts/arial.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
        ],
        bold: [
          'C:/Windows/Fonts/arialbd.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
        ],
        mono: [
          'C:/Windows/Fonts/consola.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
        ]
      },
      requireEmbeddedUnicode: true
    },
    tables: {
      cellPaddingPt: 2.5,
      rowRulePt: 0.35,
      repeatHeader: true,
      splitBetweenRows: true,
      alternateRows: true,
      preserveHashes: true,
      hashChunkCharacters: 48
    },
    components: { qrSizeMm: 26, legalPaddingPt: 7 },
    pagination: {
      keepHeadingsWithContent: true,
      minimumWidowLines: 3,
      minimumOrphanLines: 3,
      repeatHeader: true,
      neverOverflowFooter: true
    },
    labels: {
      kicker: 'CRYPTO REPORT ENTERPRISE / TECHNISCHER PRÜFBERICHT',
      subtitle: 'Kryptographischer Existenznachweis',
      legalHeading: 'Rechtliche und technische Hinweise für Deutschland',
      systemHeading: 'SYSTEM INFORMATION (BEWEISSICHERUNG):',
      contentHeading: 'REPORT CONTENT:',
      qrCaption: 'QR-Code – Vollständige Rechtsgrundlagen und technische Referenzen',
      footerBrand: 'CRYPTO REPORT ENTERPRISE',
      footerLicense: 'Bereitgestellt und lizenziert durch PasevSU',
      footerDeveloper: 'Entwickler: D.D.PASEV',
      footerUrl: 'https://pasevsu.github.io'
    },
    legalNotice: [
      'Beweisrecht (§§ 286, 371, 371a, 130a ZPO): Elektronische Dateien können als Beweismittel vorgelegt werden; die Würdigung erfolgt im Einzelfall. Besondere Beweis- und Einreichungsvorschriften gelten nur bei erfüllten Voraussetzungen.',
      'eIDAS (Art. 25, 41, 42; EU 2025/1929): Ein RFC-3161-Zeitstempel ist weder automatisch qualifiziert noch eine qualifizierte elektronische Signatur. Eine besondere Vermutungswirkung setzt nachgewiesene Qualifikation voraus.',
      'Technische Referenzen: RFC 3161/5816; ETSI EN 319 421/422, 319 102-1, 319 122-1, 319 142-1; BSI TR-03125 und, soweit einschlägig, TR-03138. Die Nennung begründet keine Zertifizierung oder Konformität.',
      'Prüfbarkeit und Grenzen: Datei-Hashes, Aggregationsmethode, TSA-Token, ByteRange, CMS, Zertifikatskette, EKU, CRL/OCSP und DSS sind unabhängig zu prüfen. VERIFIED / FAILED / NOT VERIFIED bezeichnen den tatsächlichen Prüfstatus. Herkunft, Urheberschaft und inhaltliche Wahrheit werden nicht allein durch Hashwerte belegt. Dieser technische Bericht ist keine eidesstattliche Versicherung.'
    ]
  };

  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };

  globalThis.PasevSUPdfStandard = freeze(standard);
})();
