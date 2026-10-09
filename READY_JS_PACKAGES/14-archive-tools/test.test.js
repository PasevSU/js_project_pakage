'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {Checkpoint}=require('./lib/checkpoint');
const {ManifestBuilder,rootHash}=require('./lib/manifest');
const {MempoolClient}=require('./lib/mempool');
function temporaryDirectory(){return fs.mkdtempSync(path.join(os.tmpdir(),'pasevsu-archive-test-'))}

test('checkpoint saves and resumes a validated block height',()=>{const dir=temporaryDirectory();try{const file=path.join(dir,'checkpoint.json');const checkpoint=new Checkpoint(file,null);checkpoint.save(123,7,200);const resumed=new Checkpoint(file,null);assert.equal(resumed.resumeHeight,123);assert.equal(resumed.processed,7);assert.equal(resumed.endHeight,200)}finally{fs.rmSync(dir,{recursive:true,force:true})}});

test('manifest builder stores blocks, transaction indexes and reproducible root hashes',()=>{const dir=temporaryDirectory();try{const file=path.join(dir,'archive.json');const builder=new ManifestBuilder(file,null,{saveEveryNBlocks:0});builder.setDateRange('2026-01-01','2026-01-01',1,1);builder.addBlock({id:'block-hash',height:1,timestamp:1767225600,timestamp_iso:'2026-01-01T00:00:00.000Z',merkle_root:'merkle'},['txid-1']);const result=builder.finalize({valid:true,entries:1,lastHash:'chain-hash'});const archive=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(archive.meta.integrity.rootHash,rootHash(archive.days));assert.equal(archive.days['2026-01-01'].transactions['txid-1'].block_height,1);assert.equal(archive.index.by_txid['txid-1'].height,1);assert.equal(fs.readFileSync(`${file}.sha256`,'utf8').trim().split(/\s+/)[0],result.fileHash);const repeated=builder.finalize({valid:true,entries:1,lastHash:'chain-hash'});assert.equal(fs.readFileSync(`${file}.sha256`,'utf8').trim().split(/\s+/)[0],repeated.fileHash)}finally{fs.rmSync(dir,{recursive:true,force:true})}});

test('Mempool client caches JSON responses and honors the configured API base',async()=>{const original=global.fetch;let requests=0;global.fetch=async url=>{requests++;assert.equal(String(url),'https://example.invalid/api/blocks/tip/height');return new Response('123',{status:200,headers:{'content-type':'text/plain'}})};try{const client=new MempoolClient('https://example.invalid/api',null,0,0,1000);assert.equal(await client.getBlockHeight(),123);assert.equal(await client.getBlockHeight(),123);assert.equal(requests,1);assert.equal(client.getStats().cached,1)}finally{global.fetch=original}});