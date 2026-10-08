import { fullHashSet, hashBytes, isoOrNull, unique } from '../core/utils.js';

function splitHeaderBody(raw) {
  const m = raw.match(/\r?\n\r?\n/);
  if (!m) return {headerText:raw, bodyText:''};
  return {headerText:raw.slice(0,m.index), bodyText:raw.slice(m.index+m[0].length)};
}

export function parseHeaders(headerText) {
  const physical=headerText.replace(/\r\n?/g,'\n').split('\n');
  const logical=[];
  for(const line of physical){
    if(/^[ \t]/.test(line) && logical.length) logical[logical.length-1].raw += '\n'+line;
    else logical.push({raw:line});
  }
  const ordered=[]; const map={};
  for(const h of logical){
    const i=h.raw.indexOf(':'); if(i<1) continue;
    const name=h.raw.slice(0,i); const value=h.raw.slice(i+1).replace(/\n[ \t]+/g,' ').trim();
    const item={index:ordered.length,name,name_lower:name.toLowerCase(),value,raw:h.raw}; ordered.push(item);
    (map[item.name_lower]??=[]).push(value);
  }
  return {ordered,map};
}

function decodeQuotedPrintable(input) {
  const soft=input.replace(/=\r?\n/g,'');
  const bytes=[];
  for(let i=0;i<soft.length;i++){
    if(soft[i]==='=' && /^[0-9A-Fa-f]{2}$/.test(soft.slice(i+1,i+3))){bytes.push(parseInt(soft.slice(i+1,i+3),16));i+=2;}
    else {const b=Buffer.from(soft[i],'utf8'); for(const x of b) bytes.push(x);}
  }
  return Buffer.from(bytes);
}

function decodeTransfer(body, encoding='7bit') {
  const e=encoding.toLowerCase();
  if(e==='base64') return Buffer.from(body.replace(/\s+/g,''),'base64');
  if(e==='quoted-printable') return decodeQuotedPrintable(body);
  return Buffer.from(body,'utf8');
}

function parseParams(value='') {
  const parts=value.split(';'); const main=parts.shift()?.trim().toLowerCase()||''; const params={};
  for(const p of parts){const i=p.indexOf('=');if(i>0){let v=p.slice(i+1).trim();if(v.startsWith('"')&&v.endsWith('"'))v=v.slice(1,-1);params[p.slice(0,i).trim().toLowerCase()]=v;}}
  return {main,params};
}

function decodeEncodedWord(s='') {
  return s.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g,(_,charset,enc,data)=>{
    try { const buf=enc.toLowerCase()==='b'?Buffer.from(data,'base64'):decodeQuotedPrintable(data.replace(/_/g,' ')); return buf.toString(/^utf-?8$/i.test(charset)?'utf8':'latin1'); } catch { return _; }
  });
}

export function parseAddressList(value='') {
  const out=[]; let token='',quoted=false,angle=0;
  const flush=()=>{const s=token.trim();token='';if(!s)return;const m=s.match(/^(.*)<([^>]+)>$/);if(m)out.push({name:decodeEncodedWord(m[1].trim().replace(/^"|"$/g,''))||null,address:m[2].trim()});else out.push({name:null,address:s.replace(/^<|>$/g,'').trim()});};
  for(const ch of value){if(ch==='"')quoted=!quoted;if(!quoted&&ch==='<')angle++;if(!quoted&&ch==='>')angle=Math.max(0,angle-1);if(ch===','&&!quoted&&angle===0)flush();else token+=ch;}flush();return out;
}

function parseMimeEntity(raw, path='1') {
  const {headerText,bodyText}=splitHeaderBody(raw); const headers=parseHeaders(headerText); const get=n=>headers.map[n.toLowerCase()]?.[0]??null;
  const ct=parseParams(get('content-type')||'text/plain'); const cd=parseParams(get('content-disposition')||''); const cte=(get('content-transfer-encoding')||'7bit').toLowerCase();
  const entity={path,headers:headers.ordered,content_type:ct.main,content_type_params:ct.params,content_disposition:cd.main||null,content_disposition_params:cd.params,transfer_encoding:cte,children:[],body:null,body_hashes:null,filename:cd.params.filename||ct.params.name||null};
  if(ct.main.startsWith('multipart/')&&ct.params.boundary){
    const marker='--'+ct.params.boundary; const end=marker+'--'; const lines=bodyText.replace(/\r\n?/g,'\n').split('\n'); let current=null; const chunks=[];
    for(const line of lines){if(line===marker){if(current!==null)chunks.push(current.join('\n'));current=[];}else if(line===end){if(current!==null)chunks.push(current.join('\n'));current=null;break;}else if(current!==null)current.push(line);} entity.children=chunks.map((c,i)=>parseMimeEntity(c,`${path}.${i+1}`));
  } else {
    const bytes=decodeTransfer(bodyText,cte); entity.body_hashes=fullHashSet(bytes);
    const charset=(ct.params.charset||'utf-8').toLowerCase();
    if(ct.main.startsWith('text/')) entity.body=bytes.toString(charset.includes('utf')?'utf8':'latin1');
    else entity.body={base64:bytes.toString('base64'),byte_length:bytes.length};
  }
  return entity;
}

export function parseReceived(value,index) {
  const from=value.match(/\bfrom\s+([^\s(]+)/i)?.[1]??null;
  const by=value.match(/\bby\s+([^\s(]+)/i)?.[1]??null;
  const ips=[...value.matchAll(/\[((?:\d{1,3}\.){3}\d{1,3}|[0-9A-Fa-f:]+)\]/g)].map(m=>m[1]);
  const id=value.match(/\bid\s+([^;\s]+)/i)?.[1]??null;
  const protocol=value.match(/\bwith\s+([A-Z0-9_-]+)/i)?.[1]??null;
  const tls=value.match(/\(version=([^\s]+)\s+cipher=([^\s]+)\s+bits=([^\)]+)\)/i);
  const semi=value.lastIndexOf(';'); const timestamp=semi>=0?value.slice(semi+1).trim():null;
  return {index,raw:value,from,by,ip_addresses:ips,id,protocol,tls:tls?{version:tls[1],cipher:tls[2],bits:tls[3]}:null,timestamp_raw:timestamp,timestamp_iso:isoOrNull(timestamp)};
}

function parseTagList(value='') { const out={}; for(const part of value.split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=part.slice(i+1).trim();}return out; }
function authResults(value='') {
  const results=[]; for(const kind of ['dkim','spf','dmarc','arc']){const re=new RegExp(`(?:^|[;\\s])${kind}=([a-zA-Z0-9_-]+)([^;]*)`,'ig');let m;while((m=re.exec(value)))results.push({mechanism:kind,result:m[1].toLowerCase(),details:m[2].trim()});}return results;
}

export function parseAuthentication(headers) {
  const all=n=>headers.map[n]??[];
  return {
    authentication_results: all('authentication-results').map((raw,index)=>({index,raw,results:authResults(raw)})),
    arc_authentication_results: all('arc-authentication-results').map((raw,index)=>({index,raw,results:authResults(raw)})),
    received_spf: all('received-spf').map((raw,index)=>({index,raw,result:raw.split(/\s+/)[0]?.toLowerCase()??null,client_ip:raw.match(/client-ip=([^;\s]+)/i)?.[1]??null})),
    dkim_signatures: all('dkim-signature').map((raw,index)=>({index,raw,tags:parseTagList(raw)})),
    arc_seals: all('arc-seal').map((raw,index)=>({index,raw,tags:parseTagList(raw)})),
    arc_message_signatures: all('arc-message-signature').map((raw,index)=>({index,raw,tags:parseTagList(raw)}))
  };
}

function flattenMime(entity,out=[]){out.push(entity);for(const c of entity.children??[])flattenMime(c,out);return out;}

export function parseQuotedThread(text='') {
  const rawLines=text.replace(/\r\n?/g,'\n').split('\n');
  const clean=s=>String(s??'').replace(/\u00a0/g,' ').trim();
  const messages=[];
  const parseBlock=(i,labels)=>{
    const msg={source:'quoted-body',from:null,to:null,date:null,subject:null,start_line:i+1};
    for(let j=i;j<Math.min(rawLines.length,i+16);j++){
      const line=clean(rawLines[j]);
      for(const [key,re] of Object.entries(labels)){const m=line.match(re);if(m)msg[key]=m[1].trim();}
    }
    return msg;
  };
  for(let i=0;i<rawLines.length;i++){
    const line=clean(rawLines[i]);
    if(/^Von:\s*/i.test(line)) messages.push(parseBlock(i,{from:/^Von:\s*(.*)$/i,to:/^An:\s*(.*)$/i,date:/^Datum:\s*(.*)$/i,subject:/^Betreff:\s*(.*)$/i}));
    else if(/^От:\s*/iu.test(line)) messages.push(parseBlock(i,{from:/^От:\s*(.*)$/iu,to:/^To:\s*(.*)$/i,date:/^Date:\s*(.*)$/i,subject:/^Subject:\s*(.*)$/i}));
  }
  const forwarded=[]; for(let i=0;i<rawLines.length;i++){const line=clean(rawLines[i]);if(/Forwarded message/i.test(line))forwarded.push({line:i+1,marker:line});}
  return {messages,forwarded_markers:forwarded};
}

export function parseEmlBytes(bytes,{filename=null}={}) {
  const raw=Buffer.from(bytes).toString('utf8'); const {headerText,bodyText}=splitHeaderBody(raw); const headers=parseHeaders(headerText); const first=n=>headers.map[n]?.[0]??null; const all=n=>headers.map[n]??[];
  const mime=parseMimeEntity(raw); const parts=flattenMime(mime); const textParts=parts.filter(p=>p.content_type.startsWith('text/')&&typeof p.body==='string'); const attachments=parts.filter(p=>p.filename||p.content_disposition==='attachment').map(p=>({mime_path:p.path,filename:p.filename,content_type:p.content_type,transfer_encoding:p.transfer_encoding,hashes:p.body_hashes,byte_length:typeof p.body==='object'?p.body.byte_length:Buffer.byteLength(p.body??'','utf8')}));
  const decodedText=textParts.map(p=>p.body).join('\n');
  const refs=(first('references')?.match(/<[^>]+>/g)??[]); const inReply=first('in-reply-to')?.match(/<[^>]+>/g)??[];
  const received=all('received').map((v,i)=>parseReceived(v,i));
  const auth=parseAuthentication(headers);
  const participants=unique([
    ...parseAddressList(first('from')??'').map(x=>x.address),...parseAddressList(first('to')??'').map(x=>x.address),...parseAddressList(first('cc')??'').map(x=>x.address),...parseAddressList(first('bcc')??'').map(x=>x.address)
  ]);
  return {
    source:{filename,byte_length:bytes.length,hashes:fullHashSet(bytes)},
    envelope:{return_path:first('return-path'),delivered_to:first('delivered-to')},
    message:{message_id:first('message-id'),subject:decodeEncodedWord(first('subject')??''),date_raw:first('date'),date_iso:isoOrNull(first('date')),from:parseAddressList(first('from')??''),to:parseAddressList(first('to')??''),cc:parseAddressList(first('cc')??''),bcc:parseAddressList(first('bcc')??''),reply_to:parseAddressList(first('reply-to')??''),participants},
    thread:{in_reply_to:inReply,references:refs,quoted:parseQuotedThread(decodedText)},
    transport:{received,hop_count:received.length},
    authentication:auth,
    headers:{ordered:headers.ordered,by_name:headers.map,raw_sha256:hashBytes('sha256',Buffer.from(headerText,'utf8'))},
    mime:{root:mime,part_count:parts.length,text_part_count:textParts.length,attachment_count:attachments.length},
    content:{decoded_text:decodedText,decoded_text_sha256:hashBytes('sha256',Buffer.from(decodedText,'utf8')),raw_body_sha256:hashBytes('sha256',Buffer.from(bodyText,'utf8'))},
    attachments
  };
}
