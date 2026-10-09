'use strict';
/**
 * Portable forensic source identity comparison.
 *
 * Path-stat and open-handle stat views are not byte-for-byte identical on all
 * Windows filesystems/providers.  We therefore keep two comparisons:
 *  - exactSame: same-view version binding (inventory->path, handle->handle,
 *    path-before->path-after).  This remains strict and detects replacement.
 *  - crossViewSame: path-stat vs handle-stat compatibility.  On Windows the
 *    content/version invariants (size + mtime) must agree; same-view checks on
 *    both sides still protect the complete operation from replacement races.
 */
const FIELDS=['size','dev','ino','mtime_ns','ctime_ns','birthtime_ns'];
function normalize(x){const o={};for(const k of FIELDS)o[k]=String((x||{})[k]??'');return o}
function exactSame(a,b){a=normalize(a);b=normalize(b);return FIELDS.every(k=>a[k]===b[k])}
function crossViewSame(a,b,platform=process.platform){
  a=normalize(a);b=normalize(b);
  if(platform!=='win32')return exactSame(a,b);
  return a.size===b.size && a.mtime_ns===b.mtime_ns;
}
function differences(a,b){a=normalize(a);b=normalize(b);return FIELDS.filter(k=>a[k]!==b[k]).map(k=>({field:k,left:a[k],right:b[k]}))}
module.exports={FIELDS,normalize,exactSame,crossViewSame,differences};
