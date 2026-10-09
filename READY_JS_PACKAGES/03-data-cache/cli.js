#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const modules=['all-docs.js','all-projects.js','deletedocs.js','load-docs.js','load-projects.js','sync-data.js'];
function usage(){console.log('03-data-cache CLI\n  node cli.js inspect\n  node cli.js check\nThis package is browser-only (localStorage/DOM); the CLI never reads or modifies browser data.')}
function main(command){if(!command||['help','--help','-h'].includes(command)){usage();return}if(!['inspect','check'].includes(command))throw new Error(`Unknown command: ${command}`);const status=modules.map(file=>({file,exists:fs.existsSync(path.join(__dirname,file))}));const result={package:'03-data-cache',runtime:'browser',storage:'localStorage',modules:status};console.log(JSON.stringify(result,null,2));if(command==='check'&&status.some(item=>!item.exists))process.exitCode=2}
try{main(process.argv[2])}catch(error){console.error(`data-cache: ${error.message}`);process.exitCode=1}