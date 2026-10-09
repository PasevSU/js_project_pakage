'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');

function oneZeroPadding() {
  function WordArray(words=[],sigBytes=0) { this.words=words; this.sigBytes=sigBytes; }
  WordArray.prototype.clamp=function() {};
  const C={
    lib:{Base:{extend:()=>({extend:()=>({})})},WordArray:{init:WordArray}},
    algo:{AES:{}},pad:{},enc:{Utf8:{}}
  };
  const context={CryptoJS:C,YUI:{add(){}},console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'cipher-test.js'),'utf8'),context);
  context.extendWithCMAC(C);
  return C.pad.OneZeroPadding.unpad;
}

test('ISO/IEC 9797-1 Method 2 unpad removes the marker and trailing zeroes',()=>{
  const unpad=oneZeroPadding();
  const data={words:[0x12348000],sigBytes:4,clamped:false,clamp(){this.clamped=true;}};
  unpad(data);
  assert.equal(data.sigBytes,2);
  assert.equal(data.clamped,true);
});

test('ISO/IEC 9797-1 Method 2 unpad rejects data without its marker',()=>{
  const unpad=oneZeroPadding();
  assert.throws(()=>unpad({words:[0x12348100],sigBytes:4,clamp(){}}),/Invalid ISO\/IEC 9797-1 Method 2 padding/);
  assert.throws(()=>unpad({words:[0],sigBytes:4,clamp(){}}),/Invalid ISO\/IEC 9797-1 Method 2 padding/);
});
