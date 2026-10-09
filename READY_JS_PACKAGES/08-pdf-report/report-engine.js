/* =====================================================================
 * PasevSU PGP Toolbox v2.1.1 — Technical PDF Report Engine
 * jsPDF renders verified/collected data; it is not itself a trust source.
 * ===================================================================== */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STANDARD = globalThis.PasevSUPdfStandard;
  if (!STANDARD) throw new Error('Load pdf-style-standard.js before report-engine.js.');
  let lastCanonical = null;
  let unicodeFont = null;

  const MARGINS = Object.freeze({
    left: STANDARD.page.marginsMm.left,
    right: STANDARD.page.marginsMm.right,
    top: STANDARD.page.marginsMm.top + 5,
    bottom: STANDARD.page.marginsMm.bottom - 11,
    header: STANDARD.page.marginsMm.top - 4,
    footer: 11
  });
  const enc = new TextEncoder();
  const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
  async function digest(algorithm, text) { return hex(await crypto.subtle.digest(algorithm, enc.encode(text))); }
  function canonicalize(value) {
    if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
  function language() { return $('reportLanguage')?.value || 'de'; }
  function labels(lang) {
    return lang === 'bg' ? {
      title:'PasevSU OpenPGP технически отчет', overview:'Обща информация', providers:'Криптографски providers', policy:'Policy / negotiation', advanced:'Advanced OpenPGP резултати', integrity:'Цялост на отчета', generated:'Създаден', reportId:'Report ID', sha256:'Canonical SHA-256', sha512:'Canonical SHA-512', page:'Страница', pageId:'Derived Page-ID', note:'Този PDF представя данни от PasevSU. Криптографската валидност произтича от описаните проверки, не от самия PDF генератор.'
    } : {
      title:'PasevSU OpenPGP Technischer Bericht', overview:'Übersicht', providers:'Kryptografische Provider', policy:'Policy / Negotiation', advanced:'Advanced-OpenPGP-Ergebnisse', integrity:'Berichtsintegrität', generated:'Erstellt', reportId:'Report-ID', sha256:'Canonical SHA-256', sha512:'Canonical SHA-512', page:'Seite', pageId:'Derived Page-ID', note:'Dieses PDF stellt von PasevSU erfasste Daten dar. Die kryptografische Gültigkeit ergibt sich aus den beschriebenen Prüfungen, nicht aus dem PDF-Generator selbst.'
    };
  }

  function collect() {
    const runtime = $('reportIncludeRuntime')?.checked ? (window.PasevSURuntimeCapabilities?.report || null) : null;
    const policy = $('reportIncludePolicy')?.checked ? (window.PasevSUPolicy?.report || null) : null;
    const advanced = {};
    if ($('reportIncludeAdvanced')?.checked) {
      for (const [name,id] of [['keyHealth','advValidationOutput'],['sessionInspector','advSessionOutput'],['armorInspector','advArmorOutput']]) {
        const parsed = safeJson($(id)?.value?.trim() || ''); if (parsed) advanced[name] = parsed;
      }
    }
    const inventory = $('reportIncludeInventory')?.checked ? (window.PasevSUApp?.getPublicKeyRecords?.() || []).map(k => ({
      fingerprint:k.fingerprint, email:k.email || null, label:k.userLabel || k.comment || null, revoked:Boolean(k.revoked)
    })) : null;
    return {
      schema:'pasevsu-openpgp-report/2.1', generatedAt:new Date().toISOString(),
      application:{ name:'PasevSU PGP Toolbox', version:'2.1.1' },
      reportLanguage:language(), runtime, policy, advanced:Object.keys(advanced).length ? advanced : null, publicKeyInventory:inventory
    };
  }

  async function buildCanonical() {
    const payload = collect();
    const canonicalPayload = canonicalize(payload);
    const sha256 = await digest('SHA-256', canonicalPayload);
    const sha512 = await digest('SHA-512', canonicalPayload);
    const reportId = `PSU-PGP-${payload.generatedAt.slice(0,10).replaceAll('-','')}-${sha256.slice(0,24).toUpperCase()}`;
    lastCanonical = { payload, canonicalPayload, sha256, sha512, reportId };
    return lastCanonical;
  }

  async function currentSnapshot() {
    if (lastCanonical) {
      const probe = collect();
      probe.generatedAt = lastCanonical.payload.generatedAt;
      if (canonicalize(probe) === lastCanonical.canonicalPayload) return lastCanonical;
    }
    return buildCanonical();
  }
  function resetSnapshot() {
    lastCanonical = null;
    const status=$('reportStatus');
    if (status) status.textContent='Report snapshot reset. The next PDF/JSON export will receive a new Report-ID.';
  }

  function jsPdfCtor() { return window.jspdf?.jsPDF || window.jsPDF || null; }
  async function qrMatrix(text) {
    if (typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
      const n=qr.getModuleCount(); return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>qr.isDark(r,c)));
    }
    if (typeof window.QRCode === 'function') {
      const host=document.createElement('div'); host.style.position='fixed'; host.style.left='-10000px'; document.body.append(host);
      try {
        const instance=new window.QRCode(host,{text,width:192,height:192,correctLevel:window.QRCode.CorrectLevel?.M});
        await new Promise(r=>setTimeout(r,20)); const model=instance?._oQRCode;
        if (model?.getModuleCount && model?.isDark) { const n=model.getModuleCount(); return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>model.isDark(r,c))); }
      } finally { host.remove(); }
    }
    return null;
  }

  function drawQr(doc,matrix,x,y,size){
    if(!matrix?.length) return; const n=matrix.length, cell=size/n;
    doc.setFillColor(0,0,0);
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(matrix[r][c]) doc.rect(x+c*cell,y+r*cell,cell+.02,cell+.02,'F');
  }

  function pdfSafe(text) { return Array.from(String(text ?? '')).map(ch => ch.codePointAt(0) <= 255 ? ch : `\\u{${ch.codePointAt(0).toString(16).toUpperCase()}}`).join(''); }
  function fontBase64(bytes) {
    let binary=''; const chunkSize=0x8000;
    for(let offset=0;offset<bytes.length;offset+=chunkSize)
      binary+=String.fromCharCode(...bytes.subarray(offset,Math.min(offset+chunkSize,bytes.length)));
    return btoa(binary);
  }
  function setupUnicodeFontControl() {
    const button=$('reportGenerateButton');
    if(!button?.parentNode || $('reportUnicodeFontControl')) return;
    const label=document.createElement('label'), input=document.createElement('input');
    label.id='reportUnicodeFontControl';
    label.textContent='Bulgarian PDF font (.ttf): ';
    label.hidden=language()!=='bg';
    input.type='file'; input.accept='.ttf,font/ttf,application/x-font-ttf';
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];
      if(!file) return;
      try {
        if(file.size>20*1024*1024) throw new Error('Font files must be 20 MiB or smaller.');
        const bytes=new Uint8Array(await file.arrayBuffer());
        const signature=String.fromCharCode(...bytes.subarray(0,4));
        if(bytes.length<4 || !(['\u0000\u0001\u0000\u0000','true'].includes(signature)))
          throw new Error('Choose a TrueType (.ttf) font.');
        unicodeFont=fontBase64(bytes);
        const status=$('reportStatus');
        if(status) status.textContent=`Unicode font loaded: ${file.name}`;
      } catch(error) {
        unicodeFont=null;
        input.value='';
        const status=$('reportStatus');
        if(status) status.textContent=`Unicode font could not be loaded: ${error.message}`;
      }
    });
    label.append(input);
    button.parentNode.insertBefore(label,button);
    $('reportLanguage')?.addEventListener('change',()=>{label.hidden=language()!=='bg';});
  }
  function stringifyCompact(value) {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }

  async function generatePdf() {
    const status = $('reportStatus'); const button = $('reportGenerateButton'); if (button) button.disabled=true;
    try {
      const Ctor = jsPdfCtor(); if (!Ctor) throw new Error('jsPDF runtime is not loaded. Run vendor setup first.');
      const canonical = await currentSnapshot(); const lang = language();
      if (lang==='bg' && !unicodeFont) throw new Error('Select a Unicode TrueType (.ttf) font before generating a Bulgarian PDF.');
      const L = labels(lang); const doc = new Ctor({
        orientation:STANDARD.page.orientation,
        unit:STANDARD.page.unit,
        format:STANDARD.page.format,
        compress:true,
        putOnlyUsedFonts:true
      });
      const fontName=unicodeFont?'PasevSUUnicode':'helvetica';
      if(unicodeFont) {
        doc.addFileToVFS('PasevSUUnicode.ttf',unicodeFont);
        doc.addFont('PasevSUUnicode.ttf',fontName,'normal');
        doc.addFont('PasevSUUnicode.ttf',fontName,'bold');
      }
      doc.setProperties({ title:L.title, subject:'OpenPGP technical report', author:'PasevSU PGP Toolbox', creator:'PasevSU PGP Toolbox 2.1.1', keywords:'OpenPGP, PGP, cryptography, report, SHA-256, SHA-512' });
      const pageW = doc.internal.pageSize.getWidth(), pageH = doc.internal.pageSize.getHeight();
      const contentW = pageW - MARGINS.left - MARGINS.right; let y = MARGINS.top + 3;
      const pageIds = [];
      const text = s => fontName==='PasevSUUnicode'?String(s??''):pdfSafe(s);
      const ensure = h => { if (y + h > pageH - MARGINS.bottom - MARGINS.footer) { doc.addPage(); y = MARGINS.top + 3; } };
      const heading = title => {
        ensure(12);
        doc.setFont(fontName,'bold');
        doc.setFontSize(STANDARD.fonts.sizesPt.heading);
        doc.setTextColor(...rgb(STANDARD.colors.accent));
        doc.text(text(title), MARGINS.left, y);
        y += 7;
        doc.setFont(fontName,'normal');
      };
      const line = (label, value) => {
        const raw = `${label}: ${stringifyCompact(value)}`; const lines = doc.splitTextToSize(text(raw), contentW); ensure(lines.length*4.4+2);         doc.setFontSize(STANDARD.fonts.sizesPt.body);
        doc.setTextColor(...rgb(STANDARD.colors.ink));
        doc.text(lines, MARGINS.left, y);
        y += lines.length*STANDARD.fonts.leadingPt.body*25.4/72 + 1.2;
      };
      const jsonBlock = (title, value) => {
        if (!value) return; heading(title); const raw = JSON.stringify(value, null, 2).split('\n');
        doc.setFont(unicodeFont?fontName:'courier','normal'); doc.setFontSize(STANDARD.fonts.sizesPt.tableHash);
        for (const sourceLine of raw) { const lines = doc.splitTextToSize(text(sourceLine), contentW); ensure(lines.length*3.2+1); doc.text(lines, MARGINS.left, y); y += lines.length*3.2; }
        doc.setFont(fontName,'normal'); y += 2;
      };

      doc.setFont(fontName,'bold'); doc.setFontSize(STANDARD.fonts.sizesPt.title); doc.setTextColor(...rgb(STANDARD.colors.accent)); doc.text(text(L.title), MARGINS.left, y); y += 10;
      doc.setFont(fontName,'normal'); doc.setFontSize(STANDARD.fonts.sizesPt.legal); doc.setTextColor(...rgb(STANDARD.colors.ink));
      const qrSize = STANDARD.components.qrSizeMm;
      const noteLines=doc.splitTextToSize(text(L.note), contentW-qrSize-4); doc.text(noteLines,MARGINS.left,y);
      const qrPayload = [
        canonical.reportId,
        `SHA256:${canonical.sha256}`,
        STANDARD.labels.legalHeading,
        ...STANDARD.legalNotice
      ].join('\n');
      const qr = await qrMatrix(qrPayload);
      if (qr) drawQr(doc,qr,pageW-MARGINS.right-qrSize,y-5,qrSize);
      y += Math.max(17, noteLines.length*4.2+3);
      heading(L.overview); line(L.generated, canonical.payload.generatedAt); line(L.reportId, canonical.reportId); line('Schema', canonical.payload.schema);
      jsonBlock(L.providers, canonical.payload.runtime);
      jsonBlock(L.policy, canonical.payload.policy);
      jsonBlock(L.advanced, canonical.payload.advanced);
      if (canonical.payload.publicKeyInventory) jsonBlock('Public-key inventory', canonical.payload.publicKeyInventory);
      heading(L.integrity); line(L.sha256, canonical.sha256); line(L.sha512, canonical.sha512); line('Canonicalization', 'PasevSU canonical JSON: recursively sorted object keys, UTF-8, no insignificant whitespace.');

      const pages = doc.getNumberOfPages();
      for (let p=1;p<=pages;p++) pageIds[p-1] = await digest('SHA-512', `${canonical.sha512}|page:${p}|pages:${pages}|${canonical.reportId}`);
      for (let p=1;p<=pages;p++) {
        doc.setPage(p);
        doc.setDrawColor(...rgb(STANDARD.colors.grid));
        doc.line(MARGINS.left, MARGINS.header, pageW-MARGINS.right, MARGINS.header);
        doc.setFont(fontName,'normal');
        doc.setFontSize(STANDARD.fonts.sizesPt.footer);
        doc.setTextColor(...rgb(STANDARD.colors.muted));
        doc.text(text(`PasevSU PGP Toolbox 2.1.1 · ${canonical.reportId}`),MARGINS.left,10);
        doc.line(MARGINS.left,pageH-MARGINS.footer,pageW-MARGINS.right,pageH-MARGINS.footer);
        doc.setFontSize(STANDARD.fonts.sizesPt.footer);
        doc.text(text(`${L.page} ${p}/${pages}`),MARGINS.left,pageH-6);
        const pid = `${L.pageId}: ${pageIds[p-1]}`; doc.setFontSize(5.2); const pidLines=doc.splitTextToSize(text(pid),contentW-25).slice(0,2); doc.text(pidLines,MARGINS.left+25,pageH-9,{align:'left'});
      }
      doc.save(`PasevSU_OpenPGP_Report_${canonical.reportId}.pdf`);
      if (status) {
        status.textContent = `PDF generated · ${canonical.reportId} · SHA-256 ${canonical.sha256}${qr ? '' : ' · QR provider unavailable'}`;
      }
    } catch (error) { if (status) status.textContent = `Report generation failed: ${error.message}`; }
    finally { if (button) button.disabled=false; }
  }

  async function downloadJson() {
    const c = await currentSnapshot(); const full = { ...c.payload, integrity:{ reportId:c.reportId, canonicalSha256:c.sha256, canonicalSha512:c.sha512 } };
    const blob = new Blob([JSON.stringify(full,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`PasevSU_OpenPGP_Report_${c.reportId}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function init(){ setupUnicodeFontControl(); $('reportGenerateButton')?.addEventListener('click',generatePdf); $('reportJsonButton')?.addEventListener('click',downloadJson); $('reportResetSnapshotButton')?.addEventListener('click',resetSnapshot); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.PasevSUReportEngine={ collect, buildCanonical, currentSnapshot, resetSnapshot, generatePdf, get last(){return lastCanonical;}, get unicodeFontLoaded(){return Boolean(unicodeFont);}, margins:MARGINS };
  function rgb(hexColor) {
    return [
      Number.parseInt(hexColor.slice(1,3),16),
      Number.parseInt(hexColor.slice(3,5),16),
      Number.parseInt(hexColor.slice(5,7),16)
    ];
  }
})();
