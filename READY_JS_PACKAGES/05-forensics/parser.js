'use strict';
// Read-only NTFS FILE record and boot sector parser. Node.js built-ins only.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const ATTR_TYPES = Object.freeze({
  0x10:'STANDARD_INFORMATION',0x20:'ATTRIBUTE_LIST',0x30:'FILE_NAME',
  0x40:'OBJECT_ID',0x50:'SECURITY_DESCRIPTOR',0x60:'VOLUME_NAME',
  0x70:'VOLUME_INFORMATION',0x80:'DATA',0x90:'INDEX_ROOT',
  0xa0:'INDEX_ALLOCATION',0xb0:'BITMAP',0xc0:'REPARSE_POINT',
  0xd0:'EA_INFORMATION',0xe0:'EA',0xf0:'PROPERTY_SET',
  0x100:'LOGGED_UTILITY_STREAM'
});
const FILETIME_EPOCH = 116444736000000000n;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
function numberSafe(n, what='integer') {
  if (n < 0n || n > MAX_SAFE) throw new Error(`${what} exceeds safe file offset`);
  return Number(n);
}
function sha256(b) { return crypto.createHash('sha256').update(b).digest('hex'); }
function hex(n) { return `0x${BigInt(n).toString(16)}`; }
function u64(b, off) { return b.readBigUInt64LE(off); }
function signedLE(b, off, count) {
  let n=0n; for(let i=0;i<count;i++) n |= BigInt(b[off+i]) << BigInt(8*i);
  if (count && (b[off+count-1] & 0x80)) n -= 1n << BigInt(8*count);
  return n;
}
function unsignedLE(b, off, count) {
  let n=0n; for(let i=0;i<count;i++) n |= BigInt(b[off+i]) << BigInt(8*i);
  return n;
}
function filetime(v) {
  if (v===0n || v===0xffffffffffffffffn) return {raw: String(v), utc:null, status:'UNSET'};
  const millis=(v-FILETIME_EPOCH)/10000n;
  if (millis < -8640000000000000n || millis > 8640000000000000n)
    return {raw:String(v),utc:null,status:'OUT_OF_RANGE'};
  return {raw:String(v),utc:new Date(Number(millis)).toISOString(),status:'PARSED'};
}
function ref64(n) { return {raw:hex(n),record_number:String(n & 0xffffffffffffn),sequence:Number(n >> 48n)}; }
function readExact(fd, len, offset) {
  if (!Number.isSafeInteger(offset) || offset<0 || !Number.isSafeInteger(len) || len<0) throw new Error('Invalid read bounds');
  const b=Buffer.alloc(len); let done=0;
  while(done<len) { const n=fs.readSync(fd,b,done,len-done,offset+done); if(!n) throw new Error(`Truncated source at byte ${offset+done}`); done+=n; }
  return b;
}
function bootSector(b) {
  if (b.length<512 || b.toString('ascii',3,11)!=='NTFS    ') throw new Error('Not an NTFS volume boot sector');
  const bps=b.readUInt16LE(11), spc=b.readUInt8(13), total=u64(b,40), mft=u64(b,48);
  if (![512,1024,2048,4096].includes(bps) || !spc || (spc & (spc-1)) || spc>128) throw new Error('Invalid NTFS geometry');
  const cluster=bps*spc, signed=b.readInt8(64);
  const recordSize=signed<0 ? 2**(-signed) : signed*cluster;
  if (recordSize<512 || recordSize>65536 || (recordSize & (recordSize-1))) throw new Error('Invalid MFT record size');
  return {bytes_per_sector:bps,sectors_per_cluster:spc,cluster_size:cluster,
    total_sectors:String(total),mft_lcn:String(mft),mftmirr_lcn:String(u64(b,56)),
    file_record_size:recordSize,volume_serial:hex(u64(b,72)),
    volume_bytes:String(total*BigInt(bps))};
}
function fixup(raw,bps) {
  const b=Buffer.from(raw);
  if(b.length<48) throw new Error('Short FILE record');
  const offset=b.readUInt16LE(4),count=b.readUInt16LE(6),sectors=b.length/bps;
  if (!Number.isInteger(sectors) || count!==sectors+1 || offset<48 || offset+count*2>b.length)
    throw new Error('Invalid update sequence array');
  const marker=b.subarray(offset,offset+2);
  for(let i=1;i<count;i++) {
    const end=i*bps-2;
    if (!b.subarray(end,end+2).equals(marker)) throw new Error(`USA_MISMATCH at sector ${i}`);
    b.copy(b,end,offset+i*2,offset+i*2+2);
  }
  return b;
}
function runlist(b, offset, end) {
  const out=[]; let pos=offset, vcn=0n,lcn=0n;
  for(let count=0;count<100000 && pos<end;count++) {
    const h=b[pos++]; if(h===0) return out;
    const lenBytes=h&15, offBytes=h>>4;
    if(!lenBytes || lenBytes>8 || offBytes>8 || pos+lenBytes+offBytes>end) throw new Error('Invalid NTFS runlist');
    const len=unsignedLE(b,pos,lenBytes); pos+=lenBytes;
    if(len===0n) throw new Error('Zero-length NTFS extent');
    let phys=null;
    if(offBytes) {lcn+=signedLE(b,pos,offBytes); if(lcn<0n) throw new Error('Negative LCN'); phys=lcn;}
    pos+=offBytes;
    out.push({vcn:String(vcn),clusters:String(len),lcn:phys===null?null:String(phys),sparse:phys===null});
    vcn+=len;
  }
  throw new Error('Runlist exceeds bounds or extent limit');
}
function readTimes(b,off) {
  return {created:filetime(u64(b,off)),modified:filetime(u64(b,off+8)),
    mft_changed:filetime(u64(b,off+16)),accessed:filetime(u64(b,off+24))};
}
function parseAttribute(b,start,limit,opts={}) {
  if(start+16>limit) throw new Error('Truncated attribute header');
  const type=b.readUInt32LE(start),len=b.readUInt32LE(start+4),nonresident=b[start+8]!==0;
  if(len<24 || start+len>limit) throw new Error(`Invalid attribute length ${len} at ${start}`);
  const end=start+len,nlen=b[start+9],noff=b.readUInt16LE(start+10);
  if(nlen && (noff<16 || start+noff+nlen*2>end)) throw new Error('Invalid attribute name bounds');
  const name=nlen?b.toString('utf16le',start+noff,start+noff+nlen*2):'';
  const a={type:hex(type),type_name:ATTR_TYPES[type]||'UNKNOWN',name,nonresident,
    flags:hex(b.readUInt16LE(start+12)),attribute_id:b.readUInt16LE(start+14),
    offset:start,length:len,fixed_up_attribute_sha256:sha256(b.subarray(start,end))};
  if(nonresident) {
    if(len<64) throw new Error('Truncated nonresident attribute');
    const runsOff=b.readUInt16LE(start+32);
    if(runsOff<64 || start+runsOff>=end) throw new Error('Invalid mapping pairs offset');
    a.lowest_vcn=String(u64(b,start+16));a.highest_vcn=String(u64(b,start+24));
    a.compression_unit=b.readUInt16LE(start+34);
    a.allocated_size=String(u64(b,start+40));a.real_size=String(u64(b,start+48));
    a.initialized_size=String(u64(b,start+56));
    a.runlist=runlist(b,start+runsOff,end);
    a.mapping_pairs_hex=b.subarray(start+runsOff,end).toString('hex');
  } else {
    const size=b.readUInt32LE(start+16),off=b.readUInt16LE(start+20);
    if(off<24 || start+off+size>end) throw new Error('Invalid resident value bounds');
    const v=b.subarray(start+off,start+off+size);
    a.resident_size=size; a.resident_sha256=sha256(v);
    if(opts.includeResidentHex) a.resident_hex=v.toString('hex');
    if(type===0x10 && size>=36) {
      a.timestamps=readTimes(v,0);a.file_attributes=hex(v.readUInt32LE(32));
      if(size>=72) {a.security_id=v.readUInt32LE(52);a.usn=String(u64(v,64));}
    } else if(type===0x30 && size>=66) {
      const nch=v[64], namespace=v[65];
      if(66+nch*2>size) throw new Error('Invalid FILE_NAME length');
      a.parent=ref64(u64(v,0));a.timestamps=readTimes(v,8);
      a.allocated_size=String(u64(v,40));a.real_size=String(u64(v,48));
      a.file_attributes=hex(v.readUInt32LE(56));
      a.name_namespace=namespace;a.filename=v.toString('utf16le',66,66+nch*2);
    } else if(type===0x40 && size>=16) {
      a.object_id_hex=v.subarray(0,16).toString('hex');
    } else if(type===0xc0 && size>=8) {
      a.reparse_tag=hex(v.readUInt32LE(0));
    } else if(type===0x80) {
      a.stream_content_sha256=sha256(v);
    }
  }
  return a;
}
function parseRecord(raw,index,bps=512,opts={}) {
  const base={record_number:String(index),raw_record_sha256:sha256(raw),raw_record_bytes:raw.length,
    source_mft_byte_offset:String(BigInt(index)*BigInt(raw.length))};
  if(raw.every(x=>x===0)) return {...base,status:'EMPTY',attributes:[]};
  const sig=raw.toString('ascii',0,4);
  if(sig!=='FILE') return {...base,status:'NON_FILE_SIGNATURE',signature_hex:raw.subarray(0,4).toString('hex'),attributes:[]};
  let b; try {b=fixup(raw,bps);} catch(e) {return {...base,status:'CORRUPT',error:String(e.message),attributes:[]};}
  const first=b.readUInt16LE(20),used=b.readUInt32LE(24),allocated=b.readUInt32LE(28),flags=b.readUInt16LE(22);
  const record={...base,status:'PARSED',sequence_number:b.readUInt16LE(16),hardlink_count:b.readUInt16LE(18),
    lsn:String(u64(b,8)),flags:hex(flags),in_use:!!(flags&1),is_directory:!!(flags&2),
    first_attribute_offset:first,bytes_in_use:used,bytes_allocated:allocated,
    base_file_reference:ref64(u64(b,32)),next_attribute_id:b.readUInt16LE(40),attributes:[],
    si_timestamps:[],file_names:[],errors:[]};
  if(used>raw.length || first<48 || first>=used) {
    record.status='CORRUPT';record.errors.push('Invalid first attribute offset or used size');return record;
  }
  let pos=first,foundEnd=false;
  for(let i=0;i<2048 && pos+4<=used;i++) {
    if(b.readUInt32LE(pos)===0xffffffff) {foundEnd=true;break;}
    try {
      const a=parseAttribute(b,pos,used,opts);record.attributes.push(a);
      if(a.type==='0x10' && a.timestamps) record.si_timestamps.push(a.timestamps);
      if(a.type==='0x30') record.file_names.push({filename:a.filename,namespace:a.name_namespace,parent:a.parent,
        timestamps:a.timestamps,attributes:a.file_attributes});
      pos+=a.length;
    } catch(e) {record.status='PARTIAL';record.errors.push(`attribute@${pos}: ${e.message}`);break;}
  }
  if(!foundEnd && record.status==='PARSED') {record.status='PARTIAL';record.errors.push('Missing attribute terminator');}
  record.si_fn_comparison=[];
  for(const [si_index,si] of record.si_timestamps.entries())for(const [fn_index,fn] of record.file_names.entries()) {
    const fields={};for(const key of ['created','modified','mft_changed','accessed']) {
      const a=si[key],b=fn.timestamps[key];
      fields[key]={equal:a.raw===b.raw,delta_100ns:String(BigInt(a.raw)-BigInt(b.raw))};
    }
    record.si_fn_comparison.push({si_index,fn_index,filename:fn.filename,fields});
  }
  if(record.attributes.some(a=>a.type==='0x20')) record.errors.push('ATTRIBUTE_LIST_PRESENT: extension records are not joined by the single-record parser');
  return record;
}
function parseAttributeList(value) {
  const entries=[]; let pos=0;
  while(pos<value.length) {
    if(value.subarray(pos).every(byte=>byte===0)) break;
    if(pos+26>value.length) throw new Error('Truncated ATTRIBUTE_LIST entry');
    const type=value.readUInt32LE(pos),length=value.readUInt16LE(pos+4),nameLength=value[pos+6],nameOffset=value[pos+7];
    if(length<26 || pos+length>value.length) throw new Error('Invalid ATTRIBUTE_LIST entry length');
    if(nameLength && (nameOffset<26 || nameOffset+nameLength*2>length)) throw new Error('Invalid ATTRIBUTE_LIST name bounds');
    entries.push({type:hex(type),name:nameLength?value.toString('utf16le',pos+nameOffset,pos+nameOffset+nameLength*2):'',
      lowest_vcn:String(u64(value,pos+8)),file_reference:ref64(u64(value,pos+16)),attribute_id:value.readUInt16LE(pos+24)});
    pos+=length;
  }
  return entries;
}
function residentValue(raw,attribute,bps) {
  const fixed=fixup(raw,bps),start=attribute.offset;
  if(fixed[start+8]!==0) throw new Error('Nonresident $MFT ATTRIBUTE_LIST is not supported');
  const size=fixed.readUInt32LE(start+16),offset=fixed.readUInt16LE(start+20),end=start+attribute.length;
  if(offset<24 || start+offset+size>end) throw new Error('Invalid resident ATTRIBUTE_LIST bounds');
  return fixed.subarray(start+offset,start+offset+size);
}
function resolveMftData(fd,geometry,baseRaw,baseRecord,partitionOffset) {
  const baseSegments=baseRecord.attributes.filter(a=>a.type==='0x80' && a.name==='' && a.nonresident);
  if(!baseSegments.length) throw new Error('MFT record 0 has no unnamed nonresident DATA attribute');
  const initialSegment=baseSegments.find(a=>a.lowest_vcn==='0');
  if(!initialSegment) throw new Error('$MFT record 0 has no DATA extent starting at VCN 0');
  const segmentInfo=segment=>{
    const lowest=BigInt(segment.lowest_vcn),runClusters=segment.runlist.reduce((sum,run)=>sum+BigInt(run.clusters),0n);
    if(runClusters===0n || BigInt(segment.highest_vcn)!==lowest+runClusters-1n)
      throw new Error(`Invalid $MFT DATA extent ending at VCN ${segment.highest_vcn}`);
    if(segment.runlist.some(run=>run.sparse)) throw new Error('Sparse $MFT DATA mapping is not supported');
    return {lowest,end:lowest+runClusters,runs:segment.runlist.map(run=>({...run,vcn:String(lowest+BigInt(run.vcn))}))};
  };
  const knownSegments=[];
  const addKnownSegment=segment=>{
    const info=segmentInfo(segment);
    for(const known of knownSegments) {
      const other=segmentInfo(known);
      if(info.lowest<other.end && other.lowest<info.end) throw new Error('Overlapping $MFT DATA extents');
    }
    knownSegments.push(segment);
  };
  const knownRuns=()=>knownSegments.flatMap(segment=>segmentInfo(segment).runs);
  for(const segment of baseSegments) addKnownSegment(segment);
  const listAttributes=baseRecord.attributes.filter(a=>a.type==='0x20');
  let segments=[];
  if(listAttributes.length) {
    if(listAttributes.length!==1) throw new Error('Multiple $MFT ATTRIBUTE_LIST attributes are not supported');
    const listed=parseAttributeList(residentValue(baseRaw,listAttributes[0],geometry.bytes_per_sector))
      .filter(entry=>entry.type==='0x80' && entry.name==='');
    const records=new Map([['0', {raw:baseRaw,parsed:baseRecord}]]);
    let pending=listed.slice();
    while(pending.length) {
      let progress=false;
      for(let i=0;i<pending.length;) {
        const entry=pending[i],number=entry.file_reference.record_number;
        let source=records.get(number);
        if(!source) {
          const offset=numberSafe(BigInt(number)*BigInt(geometry.file_record_size),'MFT extension record offset');
          if(offset+geometry.file_record_size>numberSafe(BigInt(initialSegment.real_size),'MFT data size'))
            throw new Error(`$MFT extension record ${number} is outside the MFT stream`);
          let raw;
          try { raw=readStream(fd,geometry,knownRuns(),offset,geometry.file_record_size,partitionOffset); }
          catch(error) {
            if(error.message.startsWith('MFT mapping gap at virtual byte ')) { i++; continue; }
            throw error;
          }
          const parsed=parseRecord(raw,Number(number),geometry.bytes_per_sector);
          if(parsed.status!=='PARSED' && parsed.status!=='PARTIAL') throw new Error(`Cannot parse $MFT extension record ${number}: ${parsed.status}`);
          if(parsed.sequence_number!==entry.file_reference.sequence) throw new Error(`Stale $MFT extension reference for record ${number}`);
          if(parsed.base_file_reference.record_number!=='0' || parsed.base_file_reference.sequence!==baseRecord.sequence_number)
            throw new Error(`$MFT extension record ${number} does not reference record 0`);
          source={raw,parsed}; records.set(number,source);
        } else if(source.parsed.sequence_number!==entry.file_reference.sequence) {
          throw new Error(`Stale $MFT base reference for record ${number}`);
        }
        const attribute=source.parsed.attributes.find(a=>a.type==='0x80' && a.name==='' && a.nonresident &&
          a.attribute_id===entry.attribute_id && a.lowest_vcn===entry.lowest_vcn);
        if(!attribute) throw new Error(`ATTRIBUTE_LIST entry does not match $MFT DATA attribute ${entry.attribute_id}`);
        segments.push(attribute);
        if(!knownSegments.includes(attribute)) addKnownSegment(attribute);
        pending.splice(i,1); progress=true;
      }
      if(!progress) throw new Error('$MFT extension records cannot be located using the discovered DATA extents');
    }
    if(!segments.length) throw new Error('$MFT ATTRIBUTE_LIST contains no unnamed DATA extents');
  } else {
    segments=baseSegments;
  }
  segments.sort((a,b)=>BigInt(a.lowest_vcn)<BigInt(b.lowest_vcn)?-1:BigInt(a.lowest_vcn)>BigInt(b.lowest_vcn)?1:0);
  const extents=[]; let nextVcn=0n;
  for(const segment of segments) {
    const {lowest,end,runs}=segmentInfo(segment);
    if(lowest!==nextVcn) throw new Error(`$MFT DATA extent gap or overlap at VCN ${nextVcn}`);
    extents.push(...runs);
    nextVcn=end;
  }
  const size=numberSafe(BigInt(initialSegment.real_size),'MFT data size');
  if(nextVcn*BigInt(geometry.cluster_size)<BigInt(size)) throw new Error('$MFT DATA extents do not cover the declared stream size');
  return {size,extents};
}
function readStream(fd,geometry,runs,offset,len,partitionOffset) {
  const cluster=BigInt(geometry.cluster_size), start=BigInt(offset),finish=start+BigInt(len), out=Buffer.alloc(len);
  let copied=0;
  for(const run of runs) {
    const rs=BigInt(run.vcn)*cluster,re=rs+BigInt(run.clusters)*cluster;
    const s=start>rs?start:rs,e=finish<re?finish:re;
    if(e<=s)continue;
    const n=numberSafe(e-s,'run size'),dest=numberSafe(s-start,'dest offset');
    if(!run.sparse) {
      const phys=BigInt(partitionOffset)+BigInt(run.lcn)*cluster+(s-rs);
      readExact(fd,n,numberSafe(phys,'physical offset')).copy(out,dest);
    }
    copied+=n;
  }
  if(copied!==len) throw new Error(`MFT mapping gap at virtual byte ${offset}`);
  return out;
}
function imageSource(fd,partitionOffset=0) {
  const geometry=bootSector(readExact(fd,512,partitionOffset));
  const rec0=readExact(fd,geometry.file_record_size,
    numberSafe(BigInt(partitionOffset)+BigInt(geometry.mft_lcn)*BigInt(geometry.cluster_size),'MFT record 0'));
  const parsed=parseRecord(rec0,0,geometry.bytes_per_sector);
  if(parsed.status!=='PARSED' && parsed.status!=='PARTIAL') throw new Error(`Cannot parse MFT record 0: ${parsed.status}`);
  const {size,extents}=resolveMftData(fd,geometry,rec0,parsed,partitionOffset);
  return {geometry,size,recordSize:geometry.file_record_size,read:(offset,len)=>readStream(fd,geometry,extents,offset,len,partitionOffset),
    record0:parsed,extents};
}
function mftDumpSource(fd,recordSize=1024,bps=512) {
  const size=fs.fstatSync(fd).size;
  if(!Number.isInteger(recordSize) || recordSize<512 || recordSize>65536 || recordSize%bps)throw new Error('Invalid MFT record size');
  return {geometry:null,size,recordSize,read:(offset,len)=>readExact(fd,len,offset),extents:null};
}
function hashFile(file) {
  const fd=fs.openSync(file,'r'),hash=crypto.createHash('sha256'),buf=Buffer.allocUnsafe(1024*1024);
  try {let n;while((n=fs.readSync(fd,buf,0,buf.length,null))>0)hash.update(buf.subarray(0,n));}
  finally {fs.closeSync(fd);}
  return hash.digest('hex');
}
function exportRecords(options) {
  const source=path.resolve(options.source),outputDir=path.resolve(options.outputDir);
  if(!fs.statSync(source).isFile())throw new Error('Source must be an existing offline file; live raw devices are not supported');
  if(options.partitionOffset!==undefined && (!Number.isSafeInteger(options.partitionOffset)||options.partitionOffset<0))throw new Error('Invalid partition offset');
  fs.mkdirSync(outputDir,{recursive:true});
  const sourceReal=fs.realpathSync(source), outReal=fs.realpathSync(outputDir);
  if(outReal===sourceReal)throw new Error('Output must differ from source');
  const fd=fs.openSync(source,'r');let writer=null,mftWriter=null;
  const initialStat=fs.fstatSync(fd);
  try {
    const type=options.type;
    if(type!=='image' && type!=='mft')throw new Error('type must be image or mft');
    const reader=type==='image'?imageSource(fd,options.partitionOffset||0):mftDumpSource(fd,options.recordSize||1024,options.sectorSize||512);
    const jsonl=path.join(outputDir,'mft_records.jsonl'),rawOut=path.join(outputDir,'mft_stream.raw');
    if(sourceReal===path.resolve(jsonl) || sourceReal===path.resolve(rawOut))throw new Error('Refusing to overwrite source');
    writer=fs.openSync(jsonl,'wx');
    if(options.copyMftStream)mftWriter=fs.openSync(rawOut,'wx');
    const maxRecords=options.maxRecords===undefined?Math.floor(reader.size/reader.recordSize):Math.min(Math.floor(reader.size/reader.recordSize),Number(options.maxRecords));
    if(!Number.isSafeInteger(maxRecords)||maxRecords<0)throw new Error('Invalid maxRecords');
    const sha=crypto.createHash('sha256');
    const stats={parsed:0,partial:0,corrupt:0,empty:0,other:0,in_use:0,not_in_use:0};
    const started=new Date().toISOString();
    for(let i=0;i<maxRecords;i++) {
      const raw=reader.read(i*reader.recordSize,reader.recordSize);
      sha.update(raw);
      if(mftWriter!==null)fs.writeSync(mftWriter,raw);
      const rec=parseRecord(raw,i,reader.geometry?.bytes_per_sector||options.sectorSize||512,
        {includeResidentHex:!!options.includeResidentHex});
      fs.writeSync(writer,JSON.stringify(rec)+'\n');
      if(rec.status==='PARSED')stats.parsed++;
      else if(rec.status==='PARTIAL')stats.partial++;
      else if(rec.status==='CORRUPT')stats.corrupt++;
      else if(rec.status==='EMPTY')stats.empty++;
      else stats.other++;
      if(rec.in_use===true)stats.in_use++;
      else if(rec.in_use===false)stats.not_in_use++;
    }
    fs.closeSync(writer);writer=null;
    if(mftWriter!==null){fs.closeSync(mftWriter);mftWriter=null;}
    const sourceStat=fs.fstatSync(fd);
    if(sourceStat.size!==initialStat.size || sourceStat.mtimeMs!==initialStat.mtimeMs)
      throw new Error('SOURCE_CHANGED_DURING_ACQUISITION');
    const manifest={schema:'ntfs_raw_acquisition_v0.1',mode:type,source,
      source_size_bytes:String(sourceStat.size),source_mtime_utc:sourceStat.mtime.toISOString(),
      source_sha256:options.hashSource?hashFile(source):null,source_sha256_status:options.hashSource?'COMPUTED':'NOT_COMPUTED',
      partition_offset_bytes:type==='image'?String(options.partitionOffset||0):null,
      geometry:reader.geometry,extents:reader.extents,record_size:reader.recordSize,
      mft_data_size_bytes:String(reader.size),records_processed:maxRecords,
      mft_processed_bytes:String(maxRecords*reader.recordSize),
      mft_processed_sha256:sha.digest('hex'),
      completeness:maxRecords*reader.recordSize===reader.size?'FULL_MFT_STREAM':'PARTIAL_MFT_STREAM',
      stats,started_utc:started,completed_utc:new Date().toISOString(),
      limitations:['Does not recover deleted file content or parse unallocated clusters',
        'Nonresident $MFT ATTRIBUTE_LIST decoding, compressed/encrypted stream decoding and $LogFile replay are not supported',
        'MFT record in-use flag is not a proof of recoverable deleted content'],
      artifacts:[{path:jsonl,kind:'PARSED_MFT_JSONL',sha256:hashFile(jsonl)}]};
    if(options.copyMftStream)manifest.artifacts.push({path:rawOut,kind:'RAW_MFT_STREAM',sha256:hashFile(rawOut)});
    const lastStat=fs.fstatSync(fd);
    if(lastStat.size!==initialStat.size || lastStat.mtimeMs!==initialStat.mtimeMs)
      throw new Error('SOURCE_CHANGED_DURING_ACQUISITION');
    fs.writeFileSync(path.join(outputDir,'acquisition_manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
    return manifest;
  } finally {if(writer!==null)fs.closeSync(writer);if(mftWriter!==null)fs.closeSync(mftWriter);fs.closeSync(fd);}
}
module.exports={hashFile,ATTR_TYPES,bootSector,fixup,runlist,parseAttribute,parseAttributeList,parseRecord,readStream,imageSource,mftDumpSource,exportRecords,filetime,ref64};
