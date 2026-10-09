#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const usage=`13-tests CLI
  node cli.js list
  node cli.js run [test-file ...]
Without explicit files, runs Node's built-in *.test.js suite in this directory.`;
function main(args){const[command,...files]=args;if(!command||['help','--help','-h'].includes(command)){console.log(usage);return}if(command==='list'){console.log(fs.readdirSync(__dirname).filter(name=>/\.test\.js$/.test(name)).sort().join('\n'));return}if(command!=='run')throw new Error(`Unknown command: ${command}`);const selected=files.length?files:fs.readdirSync(__dirname).filter(name=>/\.test\.js$/.test(name)).sort();if(!selected.length)throw new Error('No Node test files found.');for(const file of selected){if(path.basename(file)!==file||!fs.existsSync(path.join(__dirname,file)))throw new Error(`Invalid test file: ${file}`)}const result=spawnSync(process.execPath,['--test',...selected.map(file=>path.join(__dirname,file))],{stdio:'inherit',cwd:__dirname});if(result.error)throw result.error;process.exitCode=result.status??1}
try{main(process.argv.slice(2))}catch(error){console.error(`tests: ${error.message}`);process.exitCode=1}