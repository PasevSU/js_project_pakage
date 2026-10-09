'use strict';
const fs=require('node:fs');
const path=require('node:path');
class Checkpoint {
  constructor(file,logger){this.file=path.resolve(file);this.logger=logger;this.resumeHeight=0;this.processed=0;this.endHeight=null;if(fs.existsSync(this.file)){const data=JSON.parse(fs.readFileSync(this.file,'utf8'));if(!Number.isSafeInteger(data.height)||data.height<0)throw new Error(`Invalid checkpoint height: ${this.file}`);this.resumeHeight=data.height;this.processed=Number.isSafeInteger(data.processed)?data.processed:0;this.endHeight=Number.isSafeInteger(data.endHeight)?data.endHeight:null}}
  save(height,processed,endHeight){if(!Number.isSafeInteger(height)||height<0||!Number.isSafeInteger(processed)||processed<0||!Number.isSafeInteger(endHeight)||endHeight<0)throw new TypeError('Checkpoint values must be non-negative safe integers.');const value={schema:'blockchain-archive-checkpoint/v1',height,processed,endHeight,updatedAt:new Date().toISOString()};fs.mkdirSync(path.dirname(this.file),{recursive:true});const tmp=`${this.file}.${process.pid}.tmp`;try{fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(tmp,this.file);this.resumeHeight=height;this.processed=processed;this.endHeight=endHeight}catch(error){try{fs.unlinkSync(tmp)}catch{}throw error}}
}
module.exports={Checkpoint};