#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const usage=`90-legacy-pakages CLI (read-only archive)
  node cli.js list
  node cli.js inspect <cryptojs|ots|pgp|metadata|CRC>
Legacy source is archived for reference; this CLI never executes it.`;
function main(args){const[command,target]=args;if(!command||['help','--help','-h'].includes(command)){console.log(usage);return}if(command==='list'){console.log(JSON.stringify(fs.readdirSync(__dirname,{withFileTypes:true}).map(e=>({name:e.name,type:e.isDirectory()?'directory':'file'})),null,2));return}if(command==='inspect'){if(!target||args.length!==2)throw new Error(usage);const full=path.resolve(__dirname,target);if(!full.startsWith(path.resolve(__dirname)+path.sep)||!fs.existsSync(full))throw new Error(`Unknown legacy area: ${target}`);const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else files.push(path.relative(full,p))}}if(fs.statSync(full).isDirectory())walk(full);else files.push(path.basename(full));console.log(JSON.stringify({area:target,readOnly:true,files:files.sort()},null,2));return}throw new Error(`Unknown command: ${command}`)}
try{main(process.argv.slice(2))}catch(error){console.error(`legacy-archive: ${error.message}`);process.exitCode=1}