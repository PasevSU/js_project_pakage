#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const usage=`11-runtime-vendor CLI
  node cli.js list
  node cli.js inspect <bundle-file>
Reports files and hashes without executing third-party bundles.`;
function main(args){const[command,target]=args;if(!command||['help','--help','-h'].includes(command)){console.log(usage);return}if(command==='list'){const entries=fs.readdirSync(__dirname,{withFileTypes:true}).filter(e=>e.isFile()).map(e=>({file:e.name,bytes:fs.statSync(path.join(__dirname,e.name)).size})).sort((a,b)=>a.file.localeCompare(b.file));console.log(JSON.stringify(entries,null,2));return}if(command==='inspect'){if(!target||args.length!==2)throw new Error(usage);const file=path.resolve(__dirname,target);if(!file.startsWith(path.resolve(__dirname)+path.sep)||!fs.statSync(file).isFile())throw new Error('Choose a file inside 11-runtime-vendor.');const bytes=fs.readFileSync(file);console.log(JSON.stringify({file:path.basename(file),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),executable:false},null,2));return}throw new Error(`Unknown command: ${command}`)}
try{main(process.argv.slice(2))}catch(error){console.error(`runtime-vendor: ${error.message}`);process.exitCode=1}