'use strict';
const fs=require('fs/promises');const path=require('path');
async function load(file){const m=new Map();if(!file)return m;try{const text=await fs.readFile(file,'utf8');for(const line of text.split(/\r?\n/)){if(!line.trim())continue;try{const x=JSON.parse(line);if(x.record_key)m.set(x.record_key,x)}catch{}}}catch(e){if(e.code!=='ENOENT')throw e}return m}
async function append(file,row){if(!file)return;await fs.mkdir(path.dirname(path.resolve(file)),{recursive:true});const h=await fs.open(file,'a');try{await h.writeFile(JSON.stringify(row)+'\n','utf8');await h.sync()}finally{await h.close()}}
module.exports={load,append};
