#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const configuration=require('./modules.conf.js');
const usage=`12-cli-build CLI
  node cli.js modules
  node cli.js plan <module...>
  node cli.js check <module...>
Dependency planning uses modules.conf.js. Build execution is unavailable here because the legacy source tree (libs/, modules/, plugins/) is not included.`;
function normalize(name){return String(name).replace(/^.*\//,'').replace(/\.js$/,'')}
function plan(names){const result=[],visiting=new Set(),visited=new Set();function visit(raw){const name=normalize(raw);if(!configuration[name])throw new Error(`Unknown module: ${raw}`);if(visiting.has(name))throw new Error(`Dependency cycle at ${name}`);if(visited.has(name))return;visiting.add(name);for(const dep of configuration[name].deps||[])visit(dep);visiting.delete(name);visited.add(name);result.push(name)}for(const name of names)visit(name);return result}
function main(args){const[command,...names]=args;if(!command||['help','--help','-h'].includes(command)){console.log(usage);return}if(command==='modules'){console.log(JSON.stringify(Object.entries(configuration).map(([id,item])=>({id,name:item.name,folder:item.folder,dependencies:item.deps||[]})),null,2));return}if(!['plan','check'].includes(command)||!names.length)throw new Error(usage);const ordered=plan(names);if(command==='plan'){console.log(JSON.stringify({requested:names,buildOrder:ordered},null,2));return}const missing=[];for(const name of ordered){const item=configuration[name];const candidates=[path.join(__dirname,item.folder||'',`${name}.js`),path.join(__dirname,item.folder||'',name)];if(!candidates.some(file=>fs.existsSync(file)))missing.push({module:name,expected:candidates.map(file=>path.relative(__dirname,file))})}console.log(JSON.stringify({ready:missing.length===0,buildOrder:ordered,missing},null,2));if(missing.length)process.exitCode=2}
try{main(process.argv.slice(2))}catch(error){console.error(`cli-build: ${error.message}`);process.exitCode=1}