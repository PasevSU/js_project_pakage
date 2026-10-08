import { clone, invariant } from '../core/utils.js';
const DATE=/^(\d{2})\.(\d{2})\.(\d{4})$/;
const DATE_RANGE=/^(\d{2}\.\d{2}\.\d{4})\s*[-–]\s*(\d{2}\.\d{2}\.\d{4})$/;
const TIME_RANGE=/^(\d{1,2}:\d{2})\s*(?:Uhr\s*)?(?:bis|[-–])\s*(\d{1,2}:\d{2})(?:\s*Uhr)?$/i;
export function parseStructuredValue(type, raw) {
  const text=String(raw??'').trim(); let valid=true, normalized=text, components={};
  if(type==='DATE'){const m=text.match(DATE);valid=!!m;if(m){normalized=`${m[3]}-${m[2]}-${m[1]}`;components={day:m[1],month:m[2],year:m[3]};}}
  else if(type==='DATE_RANGE'){const m=text.match(DATE_RANGE);valid=!!m;components=m?{start:m[1],end:m[2]}:{};}
  else if(type==='TIME_RANGE'){const m=text.match(TIME_RANGE);valid=!!m;components=m?{start:m[1],end:m[2]}:{};}
  else if(type==='EMAIL'){valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);normalized=text.toLowerCase();}
  else if(type==='TELEPHONE'||type==='FAX'){valid=/[+()\d][\d\s()+\-/]{5,}/.test(text);}
  else if(type==='DOCUMENT_REFERENCE'){valid=/[A-Za-z0-9]/.test(text) && text.length>=3;}
  else if(type==='PERSON_NAME'){valid=/\p{L}/u.test(text);}
  return {raw:text,normalized,valid,components};
}
export function addDarkBlueStructuredField(manifest, field) {
  const m=clone(manifest); invariant(field.object_id && field.field_type && field.datatype, 'object_id, field_type, datatype required');
  const parsed=parseStructuredValue(field.datatype,field.value);
  m.objects.push({object_id:field.object_id,machine_type:'semantic.structured',ui_color:'dark-blue',page:field.page,search_zone_id:field.search_zone_id??null,ocr_policy:{run:true,persist_text:true},capture_policy:{persist:true},structured:{field_type:field.field_type,label:field.label??null,datatype:field.datatype,value:parsed,relation:field.relation??null},hash_policy:{include_text:field.include_text!==false}}); return m;
}
