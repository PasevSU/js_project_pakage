'use strict';
const fs=require('fs/promises');const path=require('path');
function keyFor(p){const r=path.resolve(p);return process.platform==='win32'?r.toLowerCase():r}
function rel(root,p){const x=path.relative(root,p);return x.split(path.sep).join('/')||'.'}
function compile(v){return(v||[]).map(x=>new RegExp(String(x),'i'))}
function safeNum(n,label){const x=Number(n);if(!Number.isSafeInteger(x))throw new Error(`${label} exceeds JavaScript safe integer range`);return x}
function exactIdentity(st){return{size:String(st.size),dev:String(st.dev),ino:String(st.ino),mtime_ns:String(st.mtimeNs),ctime_ns:String(st.ctimeNs),birthtime_ns:String(st.birthtimeNs)}}
function isoNs(ns){return new Date(Number(ns/1000000n)).toISOString()}
async function addOne(p,root,opts,out,diag){
  let st;try{st=await fs.lstat(p,{bigint:true})}catch(e){diag.push({level:'error',code:'LSTAT_FAILED',path:p,error:String(e)});if(opts.failClosedTraversal)throw new Error(`LSTAT_FAILED: ${p}: ${e}`);return}
  if(st.isSymbolicLink()){diag.push({level:'warning',code:'SYMLINK_REJECTED',path:p});return}
  const isDir=st.isDirectory(),isFile=st.isFile();if(!isDir&&!isFile)return;
  if((isDir&&!opts.includeDirectories)||(isFile&&!opts.includeFiles))return;
  const size=isFile?safeNum(st.size,'File size'):0;
  const times={created:isoNs(st.birthtimeNs),modified:isoNs(st.mtimeNs),accessed:isoNs(st.atimeNs),changed:isoNs(st.ctimeNs)};
  const ino=Number(st.ino),dev=Number(st.dev);
  out.push({record_key:keyFor(p),name:rel(root,p),path:path.resolve(p),kind:isDir?'directory':'file',size,size_kb:size/1024,...times,event_time:times[opts.dateField]||times.modified,inode:Number.isSafeInteger(ino)?ino:String(st.ino),device:Number.isSafeInteger(dev)?dev:String(st.dev),mode:safeNum(st.mode,'File mode'),stat_identity:exactIdentity(st)});
}
async function walk(dir,root,opts,out,diag,counters){
  let entries;try{entries=await fs.readdir(dir,{withFileTypes:true})}catch(e){diag.push({level:'error',code:'READDIR_FAILED',path:dir,error:String(e)});if(opts.failClosedTraversal)throw new Error(`READDIR_FAILED: ${dir}: ${e}`);return}
  entries.sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
  for(const entry of entries){
    const p=path.join(dir,entry.name),k=keyFor(p),r=rel(root,p);if(opts.excluded.has(k)||opts.namePatterns.some(x=>x.test(entry.name))||opts.relPatterns.some(x=>x.test(r)))continue;
    counters.discovered++;if(entry.isSymbolicLink()){diag.push({level:'warning',code:'SYMLINK_REJECTED',path:p});continue}
    if(entry.isDirectory()){
      if(opts.includeDirectories)await addOne(p,root,opts,out,diag);
      if(opts.recursive)await walk(p,root,opts,out,diag,counters);
    }else if(entry.isFile()&&opts.includeFiles)await addOne(p,root,opts,out,diag);
    if(opts.emitProgress&&counters.discovered%50===0)await opts.emitProgress({phase:'inventory',status:'RUNNING',discovered:counters.discovered,records:out.length,current_path:p});
  }
}
module.exports={id:'filesystem_inventory',version: '1.1.4',priority:10,exactIdentity,async extract(context){
  const root=path.resolve(String(context.root||process.cwd())),diag=[],out=[],counters={discovered:0};
  const opts={recursive:Boolean(context.recursive),includeFiles:context.includeFiles!==false,includeDirectories:Boolean(context.includeDirectories),dateField:String(context.dateField||'modified').toLowerCase(),excluded:new Set((context.excludePaths||[]).map(keyFor)),namePatterns:compile(context.excludeNamePatterns),relPatterns:compile(context.excludeRelativePatterns),emitProgress:context.emitProgress,failClosedTraversal:context.failClosedTraversal!==false};
  const selected=(context.selectedPaths||[]).map(x=>path.resolve(String(x)));
  if(selected.length){for(const p of selected){counters.discovered++;await addOne(p,root,opts,out,diag);if(opts.recursive){try{if((await fs.lstat(p)).isDirectory())await walk(p,root,opts,out,diag,counters)}catch(e){diag.push({level:'error',code:'SELECTED_RECURSION_STAT_FAILED',path:p,error:String(e)});if(opts.failClosedTraversal)throw e}}}}
  else{const st=await fs.lstat(root);if(!st.isDirectory())throw new Error(`Extractor root is not a directory: ${root}`);await walk(root,root,opts,out,diag,counters)}
  if(opts.emitProgress)await opts.emitProgress({phase:'inventory',status:'COMPLETED',discovered:counters.discovered,records:out.length});return{records:out,diagnostics:diag};
}};
