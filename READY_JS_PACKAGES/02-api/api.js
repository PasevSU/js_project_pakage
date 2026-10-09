import { HttpClient } from './http.js';
export class API { constructor(options={}){this.http=options.http||new HttpClient(options);this.endpoints={...(options.endpoints||{})};} endpoint(name,fallback=name){return this.endpoints[name]??fallback;} async get(name,path,o={}){return(await this.http.get(path,o)).data;} async post(name,path,body,o={}){return(await this.http.post(path,body,o)).data;} }
export function createAPI(options={}){return new API(options);}
