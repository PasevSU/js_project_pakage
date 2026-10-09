'use strict';
/** Format-level signature/revision extraction bound to the already captured SHA-256.
 *
 * OOXML/ODF packages use a small isolated Python helper so Windows/SMB hosts do
 * not pay the import cost of the complete crypto stack for every package.  All
 * other formats retain the full crypto_forensics.cli backend.  Both paths bind
 * their result to the SHA-256 already captured by extractor 20.
 */
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const exec = promisify(execFile);
const SUPPORTED = new Set(['.pdf','.exe','.dll','.sys','.scr','.ocx','.cpl','.msi','.ps1','.cat','.xml','.xades','.docx','.docm','.xlsx','.xlsm','.pptx','.pptm','.dotx','.dotm','.xltx','.xltm','.potx','.potm','.ppsx','.ppsm','.odt','.ods','.odp','.p7s','.p7m','.p7b','.p7c','.cms','.tsr','.tst','.timestamp','.tsp','.pgp','.gpg','.sig','.asc']);
const PACKAGE = new Set(['.docx','.docm','.xlsx','.xlsm','.pptx','.pptm','.dotx','.dotm','.xltx','.xltm','.potx','.potm','.ppsx','.ppsm','.odt','.ods','.odp']);

async function executeRows(py, args, options, expected) {
  const { stdout } = await exec(py,args,options);
  const rows=JSON.parse(stdout);
  if(rows.length!==expected) throw new Error(`Crypto extractor result count mismatch: expected ${expected}, got ${rows.length}`);
  return rows;
}
function bindRows(rows,chunk,patches,diagnostics) {
  rows.forEach((row,j)=>{
    const source=chunk[j];
    if (row.status==='CAPTURED') {
      if(!/^[0-9a-f]{64}$/.test(String(source.hash||''))) throw new Error(`Missing source SHA-256 before crypto scan: ${source.path}`);
      if(String(row.sha256||'').toLowerCase()!==String(source.hash).toLowerCase()) throw new Error(`CRYPTO_SOURCE_HASH_MISMATCH: ${source.path}`);
      patches.push({record_key:source.record_key,crypto_forensics:row});
    } else {
      if(String(row.error||'').includes('SOURCE_CHANGED_DURING_CRYPTO_SCAN') || String(row.error||'').includes('CRYPTO_REDUNDANT_SHA256_MISMATCH')) throw new Error(row.error);
      diagnostics.push({level:'warning',code:'CRYPTO_EXTRACTION_FAILED',path:source.path,error:row.error,backend:row.backend||null});
    }
  });
}

module.exports = {
  id: 'crypto_forensics', version: '1.1.4', priority: 50,
  async extract(context) {
    if (context.cryptoForensics === false) return { records: [], diagnostics:[{level:'info',code:'CRYPTO_FORENSICS_DISABLED'}] };
    const selected = (context.records || []).filter(r => r?.kind !== 'directory' && r?.path && r?.record_key && SUPPORTED.has(path.extname(r.path).toLowerCase()));
    if (!selected.length) return { records: [], diagnostics:[] };
    const root = path.resolve(__dirname, '..');
    const py = String(context.pythonExecutable || (process.platform === 'win32' ? 'python' : 'python3'));
    const options={cwd:root,windowsHide:true,maxBuffer:32*1024*1024,timeout:Number(context.cryptoTimeoutMs||300000),env:{...process.env,PYTHONPATH:root+path.delimiter+(process.env.PYTHONPATH||'')}};
    const patches=[]; const diagnostics=[];
    for (let i=0;i<selected.length;i+=40) {
      const group=selected.slice(i,i+40);const packageRows=group.filter(x=>PACKAGE.has(path.extname(x.path).toLowerCase()));const fullRows=group.filter(x=>!PACKAGE.has(path.extname(x.path).toLowerCase()));
      if(packageRows.length){
        const helper=path.join(root,'runtime','package_signature_helper.py');
        const rows=await executeRows(py,[helper,...packageRows.map(x=>x.path)],options,packageRows.length);
        bindRows(rows,packageRows,patches,diagnostics);
        diagnostics.push({level:'info',code:'PACKAGE_SIGNATURE_ISOLATED_BACKEND',count:packageRows.length,backend:'runtime/package_signature_helper.py'});
      }
      if(fullRows.length){
        const rows=await executeRows(py,['-m','crypto_forensics.cli',...fullRows.map(x=>x.path)],options,fullRows.length);
        bindRows(rows,fullRows,patches,diagnostics);
      }
    }
    return { records:patches, diagnostics };
  },
};
