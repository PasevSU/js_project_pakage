import { clone, invariant } from '../core/utils.js';
export function addBlueRecognitionObject(manifest, object) {
  const m=clone(manifest); invariant(object.object_id, 'object_id required');
  m.objects.push({object_id:object.object_id,machine_type:'recognition.visual',ui_color:'light-blue',role:object.role??null,page:object.page,search_zone_id:object.search_zone_id??null,ocr_policy:{run:true,persist_text:false},capture_policy:{persist:true},recognition:{enabled:true,descriptor:object.descriptor??null},semantic:null,hash_policy:{include_text:false}}); return m;
}
