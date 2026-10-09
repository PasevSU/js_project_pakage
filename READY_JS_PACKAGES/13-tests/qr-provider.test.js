'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {TextEncoder}=require('node:util');
const vm=require('node:vm');
const test=require('node:test');

function appWithQrLoader({loaded=true}={}) {
  const attempts=[],window={};
  const document={
    currentScript:{src:'https://example.test/packages/09-ui-app/app.js'},
    baseURI:'https://example.test/index.html',
    documentElement:{},
    getElementById(){return null;},
    addEventListener(){},
    createElement(){return {remove(){}};},
    head:{appendChild(script){
      attempts.push(script.src);
      if(loaded) { window.QRCode=function QRCode(){}; script.onload(); }
      else script.onerror();
    }}
  };
  const source=fs.readFileSync(path.join(__dirname,'../09-ui-app/app.js'),'utf8')+
    '\nwindow.ensureQrProviderForTest=ensureQrProvider;';
  vm.runInNewContext(source,{window,document,URL,Promise,Set,TextEncoder,console});
  return {load:window.ensureQrProviderForTest,attempts};
}

test('loads the bundled QRCode provider relative to the app script',async()=>{
  const {load,attempts}=appWithQrLoader();
  assert.equal(await load(),true);
  assert.deepEqual(attempts,['https://example.test/packages/11-runtime-vendor/qrcode.js']);
});

test('reports failure after all local QR provider paths fail',async()=>{
  const {load,attempts}=appWithQrLoader({loaded:false});
  assert.equal(await load(),false);
  assert.deepEqual(attempts,[
    'https://example.test/packages/11-runtime-vendor/qrcode.js',
    'https://example.test/11-runtime-vendor/qrcode.js'
  ]);
});
