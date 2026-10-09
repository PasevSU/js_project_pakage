'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');
const {imageSource,parseAttributeList}=require('../05-forensics/parser.js');

function attributeListEntry({lowestVcn,record,sequence,attributeId}) {
  const entry=Buffer.alloc(26);
  entry.writeUInt32LE(0x80,0); entry.writeUInt16LE(entry.length,4);
  entry.writeBigUInt64LE(BigInt(lowestVcn),8);
  entry.writeBigUInt64LE((BigInt(sequence)<<48n)|BigInt(record),16);
  entry.writeUInt16LE(attributeId,24);
  return entry;
}

function residentAttribute(type,id,value) {
  const length=(24+value.length+7)&~7,attribute=Buffer.alloc(length);
  attribute.writeUInt32LE(type,0); attribute.writeUInt32LE(length,4);
  attribute.writeUInt16LE(id,14); attribute.writeUInt32LE(value.length,16);
  attribute.writeUInt16LE(24,20); value.copy(attribute,24);
  return attribute;
}

function dataAttribute({id,lowest,highest,clusters,lcn,realSize}) {
  const runs=Buffer.from([0x11,clusters,lcn,0]);
  const attribute=Buffer.alloc(64+runs.length);
  attribute.writeUInt32LE(0x80,0); attribute.writeUInt32LE(attribute.length,4);
  attribute[8]=1; attribute.writeUInt16LE(id,14);
  attribute.writeBigUInt64LE(BigInt(lowest),16); attribute.writeBigUInt64LE(BigInt(highest),24);
  attribute.writeUInt16LE(64,32); attribute.writeBigUInt64LE(BigInt(clusters*512),40);
  attribute.writeBigUInt64LE(BigInt(realSize),48); attribute.writeBigUInt64LE(BigInt(realSize),56);
  runs.copy(attribute,64);
  return attribute;
}

function fileRecord({sequence,baseReference=0,attributes}) {
  const record=Buffer.alloc(1024),usaOffset=48,firstAttribute=56;
  record.write('FILE',0,'ascii'); record.writeUInt16LE(sequence,16);
  record.writeUInt16LE(1,22); record.writeBigUInt64LE(BigInt(baseReference),32);
  record.writeUInt16LE(firstAttribute,20); record.writeUInt32LE(record.length,28);
  record.writeUInt16LE(usaOffset,4); record.writeUInt16LE(3,6);
  record.writeUInt16LE(0xa55a,usaOffset); record.writeUInt16LE(0x1111,usaOffset+2); record.writeUInt16LE(0x2222,usaOffset+4);
  let offset=firstAttribute;
  for(const attribute of attributes){attribute.copy(record,offset); offset+=attribute.length;}
  record.writeUInt32LE(0xffffffff,offset); offset+=4; record.writeUInt32LE(offset,24);
  record.writeUInt16LE(0xa55a,510); record.writeUInt16LE(0xa55a,1022);
  return record;
}

function ntfsImage() {
  const image=Buffer.alloc(32*512),boot=image.subarray(0,512);
  boot.write('NTFS    ',3,'ascii'); boot.writeUInt16LE(512,11); boot[13]=1;
  boot.writeBigUInt64LE(32n,40); boot.writeBigUInt64LE(4n,48); boot.writeBigUInt64LE(20n,56);
  boot.writeInt8(-10,64); boot.writeBigUInt64LE(1n,72);
  const list=Buffer.concat([
    attributeListEntry({lowestVcn:0,record:0,sequence:1,attributeId:2}),
    attributeListEntry({lowestVcn:8,record:1,sequence:7,attributeId:3})
  ]);
  const first=fileRecord({sequence:1,attributes:[
    residentAttribute(0x20,1,list),
    dataAttribute({id:2,lowest:0,highest:7,clusters:8,lcn:4,realSize:10240})
  ]});
  const extension=fileRecord({sequence:7,baseReference:(1n<<48n),attributes:[
    dataAttribute({id:3,lowest:8,highest:19,clusters:12,lcn:20,realSize:10240})
  ]});
  first.copy(image,4*512); extension.copy(image,6*512);
  image.write('EXTENT-2',20*512,'ascii');
  return image;
}

function chainedNtfsImage() {
  const image=Buffer.alloc(40*512),boot=image.subarray(0,512);
  boot.write('NTFS    ',3,'ascii'); boot.writeUInt16LE(512,11); boot[13]=1;
  boot.writeBigUInt64LE(40n,40); boot.writeBigUInt64LE(4n,48); boot.writeBigUInt64LE(30n,56);
  boot.writeInt8(-10,64); boot.writeBigUInt64LE(2n,72);
  const list=Buffer.concat([
    attributeListEntry({lowestVcn:0,record:0,sequence:1,attributeId:2}),
    attributeListEntry({lowestVcn:8,record:2,sequence:7,attributeId:3}),
    attributeListEntry({lowestVcn:16,record:6,sequence:8,attributeId:4})
  ]);
  const first=fileRecord({sequence:1,attributes:[
    residentAttribute(0x20,1,list),
    dataAttribute({id:2,lowest:0,highest:7,clusters:8,lcn:4,realSize:12288})
  ]});
  const second=fileRecord({sequence:7,baseReference:(1n<<48n),attributes:[
    dataAttribute({id:3,lowest:8,highest:15,clusters:8,lcn:20,realSize:12288})
  ]});
  const third=fileRecord({sequence:8,baseReference:(1n<<48n),attributes:[
    dataAttribute({id:4,lowest:16,highest:23,clusters:8,lcn:28,realSize:12288})
  ]});
  first.copy(image,4*512); second.copy(image,8*512); third.copy(image,24*512);
  image.write('LATE-EXT',28*512,'ascii');
  return image;
}

test('parses validated ATTRIBUTE_LIST entries',()=>{
  const entry=attributeListEntry({lowestVcn:8,record:4,sequence:3,attributeId:12});
  assert.deepEqual(parseAttributeList(entry),[{
    type:'0x80',name:'',lowest_vcn:'8',
    file_reference:{raw:'0x3000000000004',record_number:'4',sequence:3},attribute_id:12
  }]);
  assert.throws(()=>parseAttributeList(Buffer.from([0x80])),/Truncated ATTRIBUTE_LIST entry/);
});

test('reconstructs fragmented $MFT DATA extents through a verified extension record',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mft-image-'));
  const file=path.join(dir,'synthetic.ntfs');
  try {
    fs.writeFileSync(file,ntfsImage());
    const fd=fs.openSync(file,'r');
    try {
      const source=imageSource(fd);
      assert.equal(source.size,10240);
      assert.deepEqual(source.extents.map(run=>run.vcn),['0','8']);
      const record=source.read(8*512,512);
      assert.equal(record.toString('ascii',0,8),'EXTENT-2');
    } finally { fs.closeSync(fd); }
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

test('resolves extension records made reachable by an earlier DATA extent',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mft-image-chain-'));
  const file=path.join(dir,'synthetic.ntfs');
  try {
    fs.writeFileSync(file,chainedNtfsImage());
    const fd=fs.openSync(file,'r');
    try {
      const source=imageSource(fd);
      assert.deepEqual(source.extents.map(run=>run.vcn),['0','8','16']);
      assert.equal(source.read(16*512,8).toString('ascii'),'LATE-EXT');
    } finally { fs.closeSync(fd); }
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

test('rejects a stale extension reference instead of mapping an unrelated record',()=>{
  const image=ntfsImage();
  image.writeUInt16LE(8,6*512+16);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mft-image-stale-'));
  const file=path.join(dir,'synthetic.ntfs');
  try {
    fs.writeFileSync(file,image);
    const fd=fs.openSync(file,'r');
    try { assert.throws(()=>imageSource(fd),/Stale \$MFT extension reference/); }
    finally { fs.closeSync(fd); }
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
