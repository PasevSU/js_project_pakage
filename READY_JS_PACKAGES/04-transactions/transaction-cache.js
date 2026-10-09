const DB_NAME='pasevsu-transactions', DB_VERSION=1, STORE='transactions';
export class TransactionCache {
 constructor({dbName=DB_NAME}={}){this.dbName=dbName;this.db=null;}
 async open(){if(this.db)return this.db;this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open(this.dbName,DB_VERSION);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return this.db;}
 async get(key){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(key);r.onsuccess=()=>res(r.result?.value??null);r.onerror=()=>rej(r.error);});}
 async set(key,value){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put({key,value,storedAt:Date.now()});r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
}
