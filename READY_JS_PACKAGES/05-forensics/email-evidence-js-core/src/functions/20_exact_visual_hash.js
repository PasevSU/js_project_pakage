import { invariant, sha256Bytes } from '../core/utils.js';
export function canonicalPixelHash({width,height,rgbBytes}){invariant(width>0&&height>0,'dimensions required');const domain=Buffer.from(`EVIDENCE-RGB-v1\0${width}x${height}\0`,'utf8');return sha256Bytes(Buffer.concat([domain,Buffer.from(rgbBytes)]));}
export function recordVisualHash(manifest,{object_id,width,height,pixel_sha256,png_sha256}){const m=structuredClone(manifest);m.hashes.visual??={};m.hashes.visual[object_id]={width,height,canonical_pixel_sha256:pixel_sha256,png_sha256};return m;}
