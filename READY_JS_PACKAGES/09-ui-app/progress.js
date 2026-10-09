'use strict';
const fs=require('fs/promises');const path=require('path');
async function emit(file,patch,eventLog){
  const payload={...patch,pid:process.pid,updated_utc:new Date().toISOString()};
  if(file){const p=path.resolve(String(file));await fs.mkdir(path.dirname(p),{recursive:true});const tmp=p+'.tmp-'+process.pid;await fs.writeFile(tmp,JSON.stringify(payload),'utf8');await fs.rename(tmp,p);}
  if(eventLog){const e=path.resolve(String(eventLog));await fs.mkdir(path.dirname(e),{recursive:true});await fs.appendFile(e,JSON.stringify(payload)+'\n','utf8');}
}
module.exports={emit};
