import { TransactionCache } from './transaction-cache.js';
import { Pagination } from './pagination.js';
export class Transactions {
  constructor({ fetchPage, pageSize=100, cache=new TransactionCache(), key='default', prefetch=2 }={}) {
    if (typeof fetchPage !== 'function') throw new TypeError('fetchPage(page, pageSize, etag) is required');
    this.fetchPage=fetchPage; this.cache=cache; this.key=key; this.pagination=new Pagination({pageSize}); this.prefetch=Math.max(0,prefetch); this.pages=new Map(); this.loading=new Map();
  }
  pageKey(page){return `${this.key}:page:${page}:size:${this.pagination.pageSize}`;}
  async load(page=this.pagination.page){
    page=this.pagination.setPage(page); if(this.pages.has(page)) return this.pages.get(page); if(this.loading.has(page)) return this.loading.get(page);
    const p=(async()=>{const key=this.pageKey(page); const cached=await this.cache.get(key); if(cached?.items){this.pages.set(page,cached); this.#refresh(page,cached); return cached;} const fresh=await this.fetchPage(page,this.pagination.pageSize,cached?.etag); const result={...fresh,fetchedAt:Date.now()}; this.pages.set(page,result); await this.cache.set(key,result); return result;})();
    this.loading.set(page,p); try{return await p;}finally{this.loading.delete(page);}
  }
  async #refresh(page,cached){try{const fresh=await this.fetchPage(page,this.pagination.pageSize,cached?.etag); if(fresh?.notModified)return; const result={...fresh,fetchedAt:Date.now()}; this.pages.set(page,result); await this.cache.set(this.pageKey(page),result);}catch(_){} }
  prefetchNext(page=this.pagination.page){for(let i=1;i<=this.prefetch;i++)this.load(page+i).catch(()=>{});}
  async getPage(page=1){const result=await this.load(page);this.prefetchNext(page);return result;}
  clearMemory(){this.pages.clear();this.loading.clear();}
}
