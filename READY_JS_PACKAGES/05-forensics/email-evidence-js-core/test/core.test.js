import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/pipeline.js';

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

test('configured size limit rejects an oversized email',()=>{
  assert.throws(()=>core.buildEmailEvidence(eml,{maxEmailSizeMb:0.000001}),/exceeds configured maximum/);
});

test('decoded email content can be excluded while hashes and metadata remain',()=>{
  const m=core.buildEmailEvidence(eml,{includeDecodedBody:false});
  assert.equal(m.email.content.decoded_text,null);
  assert.equal(m.email.mime.root.body,null);
  assert.equal(m.email.content.decoded_text_sha256.length,64);
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

test('red is purged and cannot persist',()=>{
  let m=core.createManifest();m.objects.push({object_id:'RED-1',machine_type:'operation.discard',ui_color:'red'});m.geometry.search_zones.push({zone_id:'R',machine_type:'operation.discard'});m=core.purgeRedTransientState(m);assert.equal(m.objects.length,0);assert.equal(m.geometry.search_zones.length,0);assert.equal(core.assertNoRedPersistence(m),true);
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

test('canonical pixel hash is domain separated',()=>{const h=core.canonicalPixelHash({width:1,height:1,rgbBytes:Buffer.from([0,0,0])});assert.match(h,/^[0-9a-f]{64}$/);});

test('redaction plan cannot be marked verified without checks',()=>{
  let m=core.createManifest();m=core.buildRedactionPlan(m,{derivative_id:'D1',source_sha256:'a'.repeat(64),regions:[{x:0,y:0,w:1,h:1}],mode:'pdf-content-redaction'});assert.equal(m.anonymization.redaction_plans[0].status,'PLANNED');assert.throws(()=>core.markRedactionVerified(m,{derivative_id:'D1',derivative_sha256:'b'.repeat(64),checks:{visual:'PASS',text_extraction:'PASS'}}));
});

test('profile hashes are version-sensitive',()=>{const a=core.finalizeDocumentProfile({profile_id:'P',version:1});const b=core.finalizeDocumentProfile({profile_id:'P',version:2});assert.notEqual(a.profile_sha256,b.profile_sha256);});

test('provenance path reconstructs',()=>{let m=core.createManifest();m=core.addProvenanceEdge(m,{from:'SOURCE',to:'OBJECT',relation:'contains'});m=core.addProvenanceEdge(m,{from:'OBJECT',to:'HASH',relation:'contributes'});assert.deepEqual(core.reconstructPath(m,'SOURCE','HASH'),['SOURCE','OBJECT','HASH']);});

test('sample JSON is deterministic',()=>{
  const actual=core.buildEmailEvidence(eml,{filename:'fixture.eml',evidenceId:'FIXTURE-001'});const repeated=core.buildEmailEvidence(eml,{filename:'fixture.eml',evidenceId:'FIXTURE-001'});assert.deepEqual(actual,repeated);
});
