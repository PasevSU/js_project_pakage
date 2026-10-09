#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const usage=`09-ui-app CLI
  node cli.js check
  node cli.js list
This package is browser UI code; check runs syntax validation only and does not start the application.`;
function list(){return fs.readdirSync(__dirname,{withFileTypes:true}).filter(entry=>entry.isFile()&&/\.(?:js|mjs)$/.test(entry.name)).map(entry=>entry.name).sort()}
function main(command){if(!command||['help','--help','-h'].includes(command)){console.log(usage);return}if(command==='list'){console.log(JSON.stringify({browserOnly:true,modules:list()},null,2));return}if(command!=='check')throw new Error(`Unknown command: ${command}`);const failures=[];for(const file of list()){const full=path.join(__dirname,file),source=fs.readFileSync(full,'utf8'),moduleSyntax=/^\s*(?:import\s|export\s|import\()/m.test(source);const result=moduleSyntax?spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'}):spawnSync(process.execPath,['--check',full],{encoding:'utf8'});if(result.status!==0)failures.push({file,error:result.stderr||result.stdout})}console.log(JSON.stringify({checked:list().length,failures},null,2));if(failures.length)process.exitCode=2}
try{main(process.argv[2])}catch(error){console.error(`ui-app: ${error.message}`);process.exitCode=1}