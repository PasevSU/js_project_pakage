'use strict';
const {setTimeout:delay}=require('node:timers/promises');
class MempoolClient {
  constructor(baseUrl,logger,requestDelayMs=250,retryAttempts=3,maxRateLimitBackoffMs=30000){if(typeof fetch!=='function')throw new Error('Node.js with global fetch is required.');this.baseUrl=new URL(baseUrl||'https://mempool.space/api');this.baseUrl.pathname=this.baseUrl.pathname.replace(/\/$/,'');this.logger=logger;this.requestDelayMs=Math.max(0,Number(requestDelayMs)||0);this.retryAttempts=Math.max(0,Number(retryAttempts)||0);this.maxRateLimitBackoffMs=Math.max(1000,Number(maxRateLimitBackoffMs)||30000);this.lastRequest=0;this.cache=new Map();this.stats={requests:0,cached:0,rateLimits:0,errors:0}}
  async get(endpoint){const url=new URL(String(endpoint).replace(/^\//,''),this.baseUrl.toString().replace(/\/$/,'')+'/').toString();if(this.cache.has(url)){this.stats.cached++;return this.cache.get(url)}let attempt=0;for(;;){const wait=this.requestDelayMs-(Date.now()-this.lastRequest);if(wait>0)await delay(wait);this.lastRequest=Date.now();this.stats.requests++;try{const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'PasevSU-ArchiveBuilder/1.0'}});if(response.status===429)this.stats.rateLimits++;if(!response.ok){const err=new Error(`Mempool API HTTP ${response.status} at ${url}`);err.status=response.status;if((response.status===429||response.status>=500)&&attempt<this.retryAttempts){const retry=Math.min(this.maxRateLimitBackoffMs,Math.max(Number(response.headers.get('retry-after'))*1000||0,1000*2**attempt));attempt++;await delay(retry);continue}throw err}const type=response.headers.get('content-type')||'';const value=type.includes('json')?await response.json():await response.text();this.cache.set(url,value);return value}catch(error){if(error.status&&error.status<500&&error.status!==429){this.stats.errors++;throw error}if(attempt>=this.retryAttempts){this.stats.errors++;throw error}await delay(Math.min(this.maxRateLimitBackoffMs,1000*2**attempt));attempt++}}}
  async getBlockHeight(){const value=Number(await this.get('blocks/tip/height'));if(!Number.isSafeInteger(value)||value<0)throw new Error('Mempool API returned an invalid tip height.');return value}
  async findBlockByTimestamp(timestampMs){const value=await this.get(`v1/mining/blocks/timestamp/${Math.floor(timestampMs/1000)}`);const block=Array.isArray(value)?value[0]:value;if(!block||!Number.isSafeInteger(Number(block.height)))throw new Error('Mempool API returned no block for the requested timestamp.');return{...block,height:Number(block.height)}}
  async getBlockHash(height){return this.get(`block-height/${encodeURIComponent(height)}`)}
  async getBlock(hash){return this.get(`block/${encodeURIComponent(hash)}`)}
  async getBlockHeader(hash){return this.get(`block/${encodeURIComponent(hash)}/header`)}
  async getBlockV1(hash){return this.get(`v1/block/${encodeURIComponent(hash)}`)}
  async getBlockAuditSummary(hash){return this.get(`v1/block/${encodeURIComponent(hash)}`)}
  async getBlockTxids(hash){const all=[];for(let offset=0;offset<1000000;offset+=25){const suffix=offset?`/${offset}`:'';const page=await this.get(`block/${encodeURIComponent(hash)}/txids${suffix}`);if(!Array.isArray(page))throw new Error('Mempool API returned a non-array transaction page.');all.push(...page);if(page.length<25)break}return all}
  getHashrate(period){return this.get(`v1/mining/hashrate/${encodeURIComponent(period)}`)}
  getDifficultyAdjustments(period){return this.get(`v1/difficulty-adjustment/${encodeURIComponent(period)}`)}
  getMiningPools(period){return this.get(`v1/mining/pools/${encodeURIComponent(period)}`)}
  getHistoricalPrice(currency,timestamp){const query=new URLSearchParams({currency,timestamp:String(timestamp)});return this.get('v1/historical-price?'+query.toString())}
  getStats(){return{...this.stats}}
}
module.exports={MempoolClient};
