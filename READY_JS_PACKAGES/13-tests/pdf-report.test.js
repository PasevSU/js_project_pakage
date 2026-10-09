'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');

class FakeElement {
  constructor(tag='div') { this.tagName=tag; this.listeners={}; this.children=[]; this.hidden=false; this.value=''; this.checked=false; }
  addEventListener(name,handler) { (this.listeners[name]??=[]).push(handler); }
  append(child) { this.children.push(child); child.parentNode=this; }
  insertBefore(child) { this.children.unshift(child); child.parentNode=this; }
}

function loadReportEngine(readyState='loading') {
  const controls=new Map(), parent=new FakeElement();
  for(const id of ['reportLanguage','reportGenerateButton','reportJsonButton','reportResetSnapshotButton','reportStatus',
    'reportIncludeRuntime','reportIncludePolicy','reportIncludeAdvanced','reportIncludeInventory']) {
    const element=new FakeElement();
    controls.set(id,element);
    if(id==='reportGenerateButton') element.parentNode=parent;
    if(id==='reportLanguage') element.value='bg';
  }
  let ready;
  const document={
    readyState,
    getElementById:id=>controls.get(id)||null,
    createElement:tag=>new FakeElement(tag),
    addEventListener:(name,handler)=>{ if(name==='DOMContentLoaded') ready=handler; }
  };
  class FakePdf {
    constructor() {
      this.fonts=[]; this.textCalls=[]; this.saved=false;
      this.internal={pageSize:{getWidth:()=>210,getHeight:()=>297}};
      FakePdf.last=this;
    }
    addFileToVFS(...args) { this.fontFile=args; }
    addFont(...args) { this.fonts.push(args); }
    setProperties() {}
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setDrawColor() {}
    text(value) { this.textCalls.push(value); }
    splitTextToSize(value) { return [String(value)]; }
    addPage() {}
    line() {}
    setDrawColor() {}
    getNumberOfPages() { return 1; }
    setPage() {}
    save() { this.saved=true; }
  }
  const window={jspdf:{jsPDF:FakePdf}};
  const context={document,window,crypto:crypto.webcrypto,TextEncoder,Uint8Array,btoa,Blob,URL,Date,Math,Promise,JSON,String,Boolean,Object,Set,Error};
  const style=fs.readFileSync(path.join(__dirname,'../08-pdf-report/pdf-style-standard.js'),'utf8');
  const source=fs.readFileSync(path.join(__dirname,'../08-pdf-report/report-engine.js'),'utf8');
  vm.runInNewContext(style,context);
  vm.runInNewContext(source,context);
  if(ready) ready();
  return {api:window.PasevSUReportEngine,controls,parent,FakePdf};
}

test('requires a local Unicode font before generating a Bulgarian PDF',async()=>{
  const {api,controls}=loadReportEngine();
  await api.generatePdf();
  assert.match(controls.get('reportStatus').textContent,/Select a Unicode TrueType/);
});

test('embeds an uploaded TrueType font and renders Bulgarian report text',async()=>{
  const {api,controls,parent,FakePdf}=loadReportEngine();
  const input=parent.children[0].children[0];
  input.files=[{name:'Cyrillic.ttf',arrayBuffer:async()=>new Uint8Array([0,1,0,0]).buffer}];
  await input.listeners.change[0]();
  assert.equal(api.unicodeFontLoaded,true);
  await api.generatePdf();
  assert.match(controls.get('reportStatus').textContent,/PDF generated/);
  const instance=FakePdf.last;
  assert.ok(instance.fonts.some(([,name,style])=>name==='PasevSUUnicode'&&style==='normal'));
  assert.ok(instance.textCalls.some(value=>String(value).includes('технически отчет')));
  assert.equal(instance.saved,true);
});

test('rejects a file that is not a TrueType font',async()=>{
  const {api,controls,parent}=loadReportEngine();
  const input=parent.children[0].children[0];
  input.files=[{name:'not-a-font.ttf',size:4,arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer}];
  await input.listeners.change[0]();
  assert.equal(api.unicodeFontLoaded,false);
  assert.match(controls.get('reportStatus').textContent,/Choose a TrueType/);
});

test('initializes report controls when loaded after DOMContentLoaded',()=>{
  const {parent}=loadReportEngine('complete');
  assert.equal(parent.children.length,1);
});

test('styles legacy browser reports with the shared legal panel, QR, and page footer',async()=>{
  const reportRoot={innerHTML:''};
  const footerTexts=[];
  const pdf={
    internal:{
      getNumberOfPages:()=>2,
      pageSize:{getWidth:()=>210,getHeight:()=>297}
    },
    setPage(){},
    setFontSize(){},
    setTextColor(){},
    text(value){footerTexts.push(value);}
  };
  let options;
  let qrPayload='';
  const worker={
    set(value){options=value;return this;},
    from(element){assert.equal(element,reportRoot);return this;},
    toPdf(){return this;},
    get(name){assert.equal(name,'pdf');return Promise.resolve(pdf);},
    save(){return Promise.resolve();}
  };
  const window={
    qrcode(){
      return {
        addData(value){qrPayload=value;},
        make(){},
        getModuleCount(){return 3;},
        isDark(row,column){return (row+column)%2===0;}
      };
    }
  };
  const context={
    window,
    courtReport:reportRoot,
    html2pdf:()=>worker,
    showToast(){},
    Date,
    JSON,
    String,
    Number,
    Array,
    Promise,
    setTimeout,
    document:{},
    console
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname,'../08-pdf-report/pdf-style-standard.js'),'utf8'),
    context
  );
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname,'../08-pdf-report/pdf-generator.js'),'utf8'),
    context
  );
  await context.generatePDFReport({
    reportId:'RPT-TEST',
    stats:{found:1,total:1,score:100},
    summary:{verdict:'VERIFIED'},
    ots:{status:'VERIFIED',sha256:'a'.repeat(64)},
    blockchain:[],
    evidence:{description:'Local test only.',level:'TECHNICAL',value:'1/1'}
  });
  assert.match(reportRoot.innerHTML,/pdf-legal-qr/);
  assert.match(reportRoot.innerHTML,/data:image\/svg\+xml/);
  assert.match(qrPayload,/Rechtliche und technische Hinweise/);
  assert.match(qrPayload,/SHA-256: a{64}/);
  assert.deepEqual(Array.from(options.margin),[20,20,35,20]);
  assert.equal(options.jsPDF.format,'a4');
  assert.ok(footerTexts.includes('1 / 2'));
  assert.ok(footerTexts.includes('2 / 2'));
});
