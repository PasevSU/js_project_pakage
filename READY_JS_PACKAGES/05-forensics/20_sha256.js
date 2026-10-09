'use strict';
const fs=require('fs');const fsp=require('fs/promises');const crypto=require('crypto');const checkpoint=require('../runtime/hash_checkpoint');
const sid=require('../runtime/source_identity');
function identity(st){return{size:String(st.size),dev:String(st.dev),ino:String(st.ino),mtime_ns:String(st.mtimeNs),ctime_ns:String(st.ctimeNs),birthtime_ns:String(st.birthtimeNs)}}
function same(a,b){return sid.exactSame(a,b)}
async function pathIdentity(p){const st=await fsp.lstat(p,{bigint:true});if(st.isSymbolicLink())throw new Error(`SYMLINK_REJECTED_DURING_HASH: ${p}`);if(!st.isFile())throw new Error(`NOT_REGULAR_FILE_DURING_HASH: ${p}`);return identity(st)}
async function sha256FileStable(p,onBytes,expectedIdentity){
  const before=await pathIdentity(p);if(expectedIdentity&&!same(expectedIdentity,before))throw new Error(`SOURCE_CHANGED_AFTER_INVENTORY: ${p}`);
  const flags=fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0);const fh=await fsp.open(p,flags);let total=0;
  try{
    const opened=identity(await fh.stat({bigint:true}));if(!sid.crossViewSame(before,opened))throw new Error(`SOURCE_IDENTITY_CHANGED_BEFORE_HASH: ${p}`);
    const h=crypto.createHash('sha256');const buf=Buffer.allocUnsafe(1024*1024);
    while(true){const {bytesRead}=await fh.read(buf,0,buf.length,null);if(!bytesRead)break;h.update(buf.subarray(0,bytesRead));total+=bytesRead;if(onBytes)onBytes(total)}
    const afterHandle=identity(await fh.stat({bigint:true}));if(!same(opened,afterHandle))throw new Error(`SOURCE_CHANGED_DURING_HASH: ${p}`);
    const afterPath=await pathIdentity(p);if(!same(before,afterPath))throw new Error(`SOURCE_PATH_REPLACED_DURING_HASH: ${p}`);
    const digest=h.digest('hex');const diffs=sid.differences(before,opened);let redundantPathRehash=false;
    if(process.platform==='win32'&&diffs.length){
      const verifyBefore=await pathIdentity(p);const vh=crypto.createHash('sha256');const vf=await fsp.open(p,flags);
      try{const vbuf=Buffer.allocUnsafe(1024*1024);while(true){const {bytesRead}=await vf.read(vbuf,0,vbuf.length,null);if(!bytesRead)break;vh.update(vbuf.subarray(0,bytesRead))}}finally{await vf.close()}
      const verifyAfter=await pathIdentity(p);redundantPathRehash=true;if(!same(verifyBefore,verifyAfter))throw new Error(`SOURCE_CHANGED_DURING_REDUNDANT_REHASH: ${p}`);if(vh.digest('hex')!==digest)throw new Error(`REDUNDANT_PATH_SHA256_MISMATCH: ${p}`);
    }
    return{digest,identity:afterPath,handle_identity:opened,cross_view_differences:diffs,redundant_path_rehash:redundantPathRehash};
  }finally{await fh.close()}
}
module.exports={id:'sha256',version:'1.1.4',priority:20,identity,pathIdentity,sha256FileStable,same,async extract(context){
  const records=[];const diagnostics=[];const src=(context.records||[]).filter(r=>r?.kind!=='directory'&&r?.path&&r?.record_key);const cache=await checkpoint.load(context.hashCheckpointPath);let done=0,bytes=0,reused=0;const allowReuse=Boolean(context.allowHashCheckpointReuse);let normalized=0;
  for(const r of src){const current=await pathIdentity(r.path);if(r.stat_identity&&!same(r.stat_identity,current))throw new Error(`SOURCE_CHANGED_AFTER_INVENTORY: ${r.path}`);const old=cache.get(r.record_key);let digest,id;
    if(allowReuse&&old&&/^[0-9a-f]{64}$/.test(old.hash||'')){if(same(old.identity,current)){digest=old.hash;id=current;reused++;}}
    if(!digest){let last=0;const x=await sha256FileStable(r.path,n=>{bytes+=n-last;last=n},r.stat_identity||current);digest=x.digest;id=x.identity;if(x.cross_view_differences?.length){normalized++;diagnostics.push({level:'info',code:'WINDOWS_PATH_HANDLE_IDENTITY_NORMALIZED',path:r.path,differences:x.cross_view_differences,note:'Path and handle metadata views differed, while strict same-view before/after checks and size/mtime cross-view binding remained stable.'})}await checkpoint.append(context.hashCheckpointPath,{record_key:r.record_key,hash:digest,identity:id});}
    done++;records.push({record_key:r.record_key,hash:digest,hash_source_identity:id});if(context.emitProgress)await context.emitProgress({phase:'hashing',status:'RUNNING',processed_files:done,total_files:src.length,processed_bytes:bytes,reused_hashes:reused,current_path:r.path});
  }
  if(reused)diagnostics.push({level:'warning',code:'HASH_CHECKPOINT_REUSED_WITH_METADATA_IDENTITY',count:reused,note:'Reuse is opt-in; live-source metadata identity is not equivalent to immutable-media proof.'});
  if(!allowReuse&&cache.size)diagnostics.push({level:'info',code:'HASH_CHECKPOINT_REUSE_DISABLED_FORENSIC_DEFAULT',cached_entries:cache.size});
  if(normalized)diagnostics.push({level:'info',code:'WINDOWS_IDENTITY_NORMALIZATION_SUMMARY',count:normalized});
  if(context.emitProgress)await context.emitProgress({phase:'hashing',status:'COMPLETED',processed_files:done,total_files:src.length,processed_bytes:bytes,reused_hashes:reused});return{records,diagnostics};
}};
