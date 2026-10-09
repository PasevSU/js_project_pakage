import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as core from '../src/pipeline.js';
import { parseEmlBytes } from '../src/email/eml_parser.js';

const eml=Buffer.from([
  'From: Evidence Sender <sender@example.invalid>',
  'To: Evidence Receiver <receiver@example.invalid>',
  'Subject: Deterministic test evidence',
  'Message-ID: <fixture-001@example.invalid>',
  'Date: Tue, 08 May 2026 10:00:00 +0000',
  'Received: from mx.example.invalid (mx.example.invalid [192.0.2.10]) by local.example.invalid; Tue, 08 May 2026 10:00:00 +0000',
  'Authentication-Results: local.example.invalid; dkim=pass; spf=pass; dmarc=pass',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Synthetic email evidence fixture.'
].join('\r\n'));

test('EML parses deterministic headers, transport, and authentication metadata',()=>{
  const m=core.buildEmailEvidence(eml,{filename:'fixture.eml',evidenceId:'FIXTURE-001'});
  assert.equal(m.email.message.message_id,'<fixture-001@example.invalid>');
  assert.equal(m.email.headers.ordered.length,8);
  assert.equal(m.email.transport.hop_count,1);
  assert.deepEqual(m.email.transport.received[0].ip_addresses,['192.0.2.10']);
  assert.equal(m.email.thread.references.length,0);
  assert.equal(m.email.mime.attachment_count,0);
  assert.match(m.email.content.decoded_text,/Synthetic email evidence fixture/);
  const ar=m.email.authentication.authentication_results[0].results;
  assert.equal(ar.find(x=>x.mechanism==='dkim').result,'pass');
  assert.equal(ar.find(x=>x.mechanism==='spf').result,'pass');
  assert.equal(ar.find(x=>x.mechanism==='dmarc').result,'pass');
});

test('structured values reject invalid dates, ranges, times, and unknown datatypes',()=>{
  assert.equal(core.parseStructuredValue('DATE','31.02.2026').valid,false);
  assert.equal(core.parseStructuredValue('DATE_RANGE','09.05.2026 - 08.05.2026').valid,false);
  assert.equal(core.parseStructuredValue('TIME_RANGE','23:00 - 24:00').valid,false);
  assert.equal(core.parseStructuredValue('UNKNOWN','anything').valid,false);
});

test('RFC 2047 adjacent words and declared legacy charsets decode without changing source bytes',()=>{
  const raw=Buffer.concat([
    Buffer.from('Subject: =?windows-1252?Q?caf=E9?=  =?UTF-8?B?4piD?=\r\nContent-Type: text/plain; charset=windows-1252\r\n\r\n','ascii'),
    Buffer.from([0x63,0x61,0x66,0xe9])
  ]);
  const parsed=parseEmlBytes(raw);
  assert.equal(parsed.message.subject,'café☃');
  assert.equal(parsed.mime.root.body,'café');
  assert.equal(parsed.mime.root.body_hashes.sha256,createHash('sha256').update(Buffer.from([0x63,0x61,0x66,0xe9])).digest('hex'));
  assert.equal(parsed.source.hashes.sha256,createHash('sha256').update(raw).digest('hex'));
});

test('header map safely handles prototype-like header names',()=>{
  const parsed=parseEmlBytes(Buffer.from('constructor: safe\r\n__proto__: safe\r\n\r\nbody','ascii'));
  assert.deepEqual(parsed.headers.by_name.constructor,['safe']);
  assert.deepEqual(parsed.headers.by_name.__proto__,['safe']);
});

test('text attachments are hashed but excluded from decoded body text',()=>{
  const message=Buffer.from('Content-Type: multipart/mixed; boundary=x\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nvisible\r\n--x\r\nContent-Type: text/plain; name=note.txt\r\nContent-Disposition: attachment; filename=note.txt\r\n\r\nsecret attachment\r\n--x--\r\n');
  const parsed=parseEmlBytes(message);
  assert.equal(parsed.content.decoded_text,'visible');
  assert.equal(parsed.attachments.length,1);
});

test('MIME nesting has a bounded depth',()=>{
  let nested='Content-Type: text/plain\r\n\r\nend';
  for(let i=0;i<42;i++)nested=`Content-Type: multipart/mixed; boundary=b${i}\r\n\r\n--b${i}\r\n${nested}\r\n--b${i}--`;
  assert.throws(()=>parseEmlBytes(Buffer.from(nested)),/nesting exceeds 40/);
});

test('configured size limit rejects an oversized email',()=>{
  assert.throws(()=>core.buildEmailEvidence(eml,{maxEmailSizeMb:0.000001}),/exceeds configured maximum/);
});

test('object creators reject duplicate object ids',()=>{
  let manifest=core.createManifest();
  manifest=core.addBlueRecognitionObject(manifest,{object_id:'same',page:1});
  assert.throws(()=>core.addYellowShapeObject(manifest,{object_id:'same',page:1}),/duplicate object_id/);
  assert.throws(()=>core.addGreenSemanticObject(manifest,{object_id:'same',role:'NAME',page:1}),/duplicate object_id/);
  assert.throws(()=>core.addDarkBlueStructuredField(manifest,{object_id:'same',page:1,field_type:'DATE',datatype:'DATE',value:'08.05.2026'}),/duplicate object_id/);
});

test('decoded email content can be excluded while hashes and metadata remain',()=>{
  const m=core.buildEmailEvidence(eml,{includeDecodedBody:false});
  assert.equal(m.email.content.decoded_text,null);
  assert.equal(m.email.mime.root.body,null);
  assert.equal(m.email.content.decoded_text_sha256.length,64);
  assert.deepEqual(m.email.thread.quoted,{messages:[],forwarded_markers:[]});
  assert.equal(m.audit.events[0].decoded_body_included,false);
});

test('multipass creates exactly A1+B1+B2+C1+C2+C3',()=>{
  const p=core.buildMultipassPlan({width:1000,height:1500,overlapRatio:.04});
  assert.deepEqual(p.map(x=>x.id),['A1','B1','B2','C1','C2','C3']);
  assert.equal(p.length,6); assert.ok(p.every(x=>x.h>0));
});

test('blue persists object but not OCR text policy',()=>{
  let m=core.createManifest();m=core.addBlueRecognitionObject(m,{object_id:'B1',page:1});const o=m.objects[0];assert.equal(o.ocr_policy.run,true);assert.equal(o.ocr_policy.persist_text,false);assert.equal(o.capture_policy.persist,true);
});

test('yellow apply mode disables text OCR',()=>{
  let m=core.createManifest();m=core.addYellowShapeObject(m,{object_id:'Y1',page:1},{profileMode:'apply'});assert.equal(m.objects[0].ocr_policy.run,false);assert.equal(m.objects[0].recognition.mode,'shape');
});

test('green persists semantic OCR',()=>{
  let m=core.createManifest();m=core.addGreenSemanticObject(m,{object_id:'G1',role:'RECIPIENT',page:1});assert.equal(m.objects[0].ocr_policy.persist_text,true);assert.equal(m.objects[0].semantic.role,'RECIPIENT');
});

test('dark-blue DATE parses without changing raw value',()=>{
  const p=core.parseStructuredValue('DATE','08.05.2026');assert.equal(p.raw,'08.05.2026');assert.equal(p.normalized,'2026-05-08');assert.equal(p.valid,true);
  assert.equal(core.parseStructuredValue('DATE','08.05.202G').valid,false);
});

test('magenta identity can overlap structured object',()=>{
  let m=core.createManifest();m=core.addDarkBlueStructuredField(m,{object_id:'N1',page:1,field_type:'HELP_RECIPIENT',datatype:'PERSON_NAME',value:'Petrov, Nikolay Plamenov'});m=core.attachIdentityLayer(m,{object_id:'N1',entity_id:'PERSON-001'});assert.equal(m.objects[0].machine_type,'semantic.structured');assert.equal(m.objects[0].identity.entity_id,'PERSON-001');
});

test('red is purged recursively from transient data and references',()=>{
  let m=core.createManifest();m.objects.push({object_id:'RED-1',machine_type:'operation.discard',ui_color:'red'});m.geometry.search_zones.push({zone_id:'R',machine_type:'operation.discard'});m.ocr.observation_sets.push({object_id:'RED-1',text:'transient'});m.provenance.nodes.push({id:'RED-1'});m.provenance.edges.push({from:'SOURCE',to:'RED-1'});m.anonymization.audit_note={object_id:'RED-2',sensitive:'transient'};m=core.purgeRedTransientState(m);assert.equal(m.objects.length,0);assert.equal(m.geometry.search_zones.length,0);assert.equal(m.ocr.observation_sets.length,0);assert.equal(m.provenance.nodes.length,0);assert.equal(m.provenance.edges.length,0);assert.equal(m.anonymization.audit_note,undefined);assert.equal(core.assertNoRedPersistence(m),true);
});

test('bbox remapping is deterministic',()=>{assert.deepEqual(core.remapBBox({x:2,y:3,w:4,h:5},{x:100,y:200}),{x:102,y:203,w:4,h:5});});

test('word disagreement is preserved',()=>{
  const clusters=core.clusterWords([{id:'A1',words:[{text:'08.05.2026',bbox:{x:10,y:10,w:50,h:10},confidence:95}]},{id:'C2',words:[{text:'08.05.202G',bbox:{x:10,y:10,w:50,h:10},confidence:70}]}],{pageWidth:100,pageHeight:100});
  const r=core.resolveCluster(clusters[0]);assert.equal(r.status,'DISAGREEMENT');assert.equal(r.candidates.length,2);
});

test('hash selection exposes partial token intersections',()=>{
  const [x]=core.selectTokens([{text:'word',bbox:{x:0,y:0,w:100,h:20}}],{x:0,y:0,w:50,h:20});assert.equal(x.hash_selected,false);assert.equal(x.partial_intersection,true);
});

test('raw and canonical text hashes are distinct contracts',()=>{
  const raw=core.rawTextHash('A\r\nB');const c=core.canonicalTextHash('A\r\nB');assert.notEqual(raw,c.sha256);assert.equal(c.canonical,'A\nB');
});

test('structured hash ignores object key insertion order',()=>{assert.equal(core.structuredHash({b:2,a:1}).sha256,core.structuredHash({a:1,b:2}).sha256);});

test('canonical pixel hash encodes its domain and dimensions and validates exact RGB length',()=>{
  const pixels=Buffer.from([0,0,0]);
  const actual=core.canonicalPixelHash({width:1,height:1,rgbBytes:pixels});
  const expected=createHash('sha256').update(Buffer.concat([Buffer.from('EVIDENCE-RGB-v1\0'+'1x1\0','utf8'),pixels])).digest('hex');
  assert.equal(actual,expected);
  assert.notEqual(actual,core.canonicalPixelHash({width:3,height:1,rgbBytes:Buffer.from([0,0,0,0,0,0,0,0,0])}));
  assert.throws(()=>core.canonicalPixelHash({width:1,height:1,rgbBytes:Buffer.from([0,0])}),/RGB byte length/);
});

test('redaction plan cannot be marked verified without checks',()=>{
  let m=core.createManifest();m=core.buildRedactionPlan(m,{derivative_id:'D1',source_sha256:'a'.repeat(64),regions:[{x:0,y:0,w:1,h:1}],mode:'pdf-content-redaction'});assert.equal(m.anonymization.redaction_plans[0].status,'PLANNED');assert.throws(()=>core.markRedactionVerified(m,{derivative_id:'D1',derivative_sha256:'b'.repeat(64),checks:{visual:'PASS',text_extraction:'PASS'}}));
});

test('profile hashes are version-sensitive',()=>{const a=core.finalizeDocumentProfile({profile_id:'P',version:1});const b=core.finalizeDocumentProfile({profile_id:'P',version:2});assert.notEqual(a.profile_sha256,b.profile_sha256);});

test('provenance path reconstructs',()=>{let m=core.createManifest();m=core.addProvenanceEdge(m,{from:'SOURCE',to:'OBJECT',relation:'contains'});m=core.addProvenanceEdge(m,{from:'OBJECT',to:'HASH',relation:'contributes'});assert.deepEqual(core.reconstructPath(m,'SOURCE','HASH'),['SOURCE','OBJECT','HASH']);});

test('sample JSON is deterministic',()=>{
  const actual=core.buildEmailEvidence(eml,{filename:'fixture.eml',evidenceId:'FIXTURE-001'});const repeated=core.buildEmailEvidence(eml,{filename:'fixture.eml',evidenceId:'FIXTURE-001'});assert.deepEqual(actual,repeated);
});

test('forensics CLI resolves relative input and output paths from the caller directory',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'forensics-cli-cwd-'));
  const cli=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..','cli.js');
  try {
    fs.writeFileSync(path.join(directory,'source.eml'),eml);
    const result=spawnSync(process.execPath,[cli,'build-email','source.eml','output.json'],{cwd:directory,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.ok(fs.existsSync(path.join(directory,'output.json')));
  } finally {
    fs.rmSync(directory,{recursive:true,force:true});
  }
});

test('forensics CLI retains file hashing and source identity comparison',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'forensics-cli-source-'));
  const packageDirectory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
  const cli=path.join(packageDirectory,'cli.js');
  try {
    const input=path.join(directory,'source.bin');
    const identity=path.join(directory,'identity.json');
    const bytes=Buffer.from('forensic source');
    fs.writeFileSync(input,bytes);
    fs.writeFileSync(identity,JSON.stringify({size:bytes.length,dev:1,ino:2,mtime_ns:3,ctime_ns:4,birthtime_ns:5}));

    const hash=spawnSync(process.execPath,[cli,'sha256',input],{encoding:'utf8'});
    assert.equal(hash.status,0,hash.stderr);
    assert.equal(JSON.parse(hash.stdout).sha256,createHash('sha256').update(bytes).digest('hex'));

    const comparison=spawnSync(process.execPath,[cli,'compare-identity',identity,identity],{encoding:'utf8'});
    assert.equal(comparison.status,0,comparison.stderr);
    assert.equal(JSON.parse(comparison.stdout).same,true);
  } finally {
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
