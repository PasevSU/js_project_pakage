#!/usr/bin/env node
'use strict';
const usage=`16-mempool-js CLI (Bitcoin / Liquid)
  node cli.js fees [--hostname HOST] [--network NAME]
  node cli.js address <address> [--hostname HOST] [--network NAME]
  node cli.js transaction <txid> [--hostname HOST] [--network NAME]
  node cli.js block <hash> [--hostname HOST] [--network NAME]
Commands require the compiled lib/ output and query the configured Mempool API.
Run npm ci and npm run build if dependencies or compiled files are missing.`;
function parse(args){const positional=[],config={hostname:'mempool.space',network:'main'};for(let i=0;i<args.length;i++){if(args[i]==='--hostname'||args[i]==='--network'){const key=args[i++].slice(2),value=args[i];if(!value)throw new Error(`Missing value for --${key}`);config[key]=value}else positional.push(args[i])}return{positional,config}}
async function main(args){const{positional,config}=parse(args);const[command,value,...extra]=positional;if(!command||['help','--help','-h'].includes(command)){console.log(usage);return}if(extra.length||(!['fees'].includes(command)&&!value))throw new Error(usage);let mempoolJS;try{mempoolJS=require('./lib/index.js')}catch(error){if(error.code==='MODULE_NOT_FOUND'){const missing=error.message.match(/Cannot find module '([^']+)'/);if(missing?.[1]==='./lib/index.js')throw new Error('Compiled lib/ is missing. Run npm ci and npm run build in 16-mempool-js.',{cause:error});if(missing)throw new Error(`Runtime dependency '${missing[1]}' is missing. Run npm ci in 16-mempool-js.`,{cause:error})}throw error}const {bitcoin,liquid}=mempoolJS(config);let result;switch(command){case'fees':result=await bitcoin.fees.getFeesRecommended();break;case'address':result=await bitcoin.addresses.getAddress({address:value});break;case'transaction':result=await bitcoin.transactions.getTx({txid:value});break;case'block':result=await bitcoin.blocks.getBlock({hash:value});break;default:throw new Error(`Unknown command: ${command}`)}if(!result)throw new Error(`No result returned for ${command}.`);console.log(JSON.stringify(result,null,2));void liquid}
main(process.argv.slice(2)).catch(error=>{console.error(`mempool: ${error.message}`);process.exitCode=1});