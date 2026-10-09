'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
class OtsClient {
  constructor(jarPath,logger){if(!jarPath)throw new Error('otsJarPath is not configured.');this.jarPath=path.resolve(jarPath);this.logger=logger;if(!fs.existsSync(this.jarPath)||!fs.statSync(this.jarPath).isFile())throw new Error(`OpenTimestamps CLI jar not found: ${this.jarPath}`)}
  async call(command,file){const result=await run('java',['-jar',this.jarPath,command,file],{timeout:120000,maxBuffer:8*1024*1024,windowsHide:true});return{stdout:result.stdout,stderr:result.stderr}}
  async stamp(file){const input=path.resolve(file);const fileHash=crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex');await this.call('stamp',input);if(!fs.existsSync(`${input}.ots`))throw new Error('OTS CLI completed without creating a proof file.');return{fileHash,proof:`${input}.ots`}}
  info(file){return this.call('info',path.resolve(file))}
}
module.exports={OtsClient};