import { clone } from '../core/utils.js';
export function purgeRedTransientState(manifest) {
  const m=clone(manifest);
  m.objects=m.objects.filter(o=>o.ui_color!=='red' && o.machine_type!=='operation.discard');
  m.geometry.search_zones=m.geometry.search_zones.filter(z=>z.machine_type!=='operation.discard');
  m.geometry.object_boundaries=m.geometry.object_boundaries.filter(b=>!String(b.object_id).startsWith('RED-'));
  m.ocr.observation_sets=m.ocr.observation_sets.filter(x=>x.machine_type!=='operation.discard' && !String(x.object_id??'').startsWith('RED-'));
  return m;
}
export function assertNoRedPersistence(manifest) {
  const text=JSON.stringify(manifest); if(/"ui_color":"red"|operation\.discard|RED-/.test(text)) throw new Error('red transient data persisted'); return true;
}
