import { photoPoints, seedPointPhotos } from './catalog'
import type { PointPhoto } from './catalog'
import { validLocalTime } from '../workflow/model'

export interface PhotoDraft {node_id:string;photo:PointPhoto;base_publication_id:string|null}
export interface PhotoPublication {publication_id:string;node_id:string;photo:PointPhoto|null;previous:PointPhoto|null;operator:string;note:string;timestamp:string;action?:'publish'|'delete'}
export interface PhotoLibrary {schema_version:1;revision:number;published:Record<string,PointPhoto|null>;drafts:Record<string,PhotoDraft>;history:PhotoPublication[]}
export const initialPhotoLibrary=():PhotoLibrary=>({schema_version:1,revision:0,published:{},drafts:{},history:[]})
export const publishedPhotos=(s:PhotoLibrary):Record<string,PointPhoto>=>Object.fromEntries(Object.entries({...seedPointPhotos,...s.published}).filter((entry):entry is [string,PointPhoto]=>entry[1]!==null))
const validNode=(id:string)=>photoPoints.some(n=>n.id===id)
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=1000
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v)
const allowedAssets=new Set(Object.values(seedPointPhotos).map(p=>p.src))
export function validPhoto(v:unknown):v is PointPhoto {
  if(!object(v)||typeof v.src!=='string'||!text(v.caption)||!text(v.source_note)||!text(v.publication_id))return false
  return (allowedAssets.has(v.src)||(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(v.src)&&v.src.length<=300000))&&(v.published_at===null||typeof v.published_at==='string'&&validLocalTime(v.published_at))
}
export function decodePhotoLibrary(v:unknown):PhotoLibrary {
  if(!object(v)||v.schema_version!==1||!Number.isSafeInteger(v.revision)||Number(v.revision)<0||!object(v.published)||!object(v.drafts)||!Array.isArray(v.history)||v.history.length>2000)throw new Error('Saved point photos could not be read. Existing photo storage has not been overwritten.')
  for(const [id,p] of Object.entries(v.published))if(!validNode(id)||(p!==null&&!validPhoto(p)))throw new Error('Invalid published point photo.')
  for(const [id,d] of Object.entries(v.drafts))if(!validNode(id)||!object(d)||d.node_id!==id||!validPhoto(d.photo)||!(d.base_publication_id===null||text(d.base_publication_id)))throw new Error('Invalid point photo draft.')
  for(const h of v.history){
    if(!object(h)||!text(h.publication_id)||!validNode(String(h.node_id))||!(h.previous===null||validPhoto(h.previous))||!text(h.operator)||!text(h.note)||typeof h.timestamp!=='string'||!validLocalTime(h.timestamp))throw new Error('Invalid point photo publication history.')
    if(h.action==='delete'?h.photo!==null||!validPhoto(h.previous):(h.action!==undefined&&h.action!=='publish')||!validPhoto(h.photo)||h.photo.publication_id!==h.publication_id||h.photo.published_at!==h.timestamp)throw new Error('Invalid point photo publication history.')
  }
  return v as unknown as PhotoLibrary
}
export function stagePointPhoto(s:PhotoLibrary,id:string,photo:PointPhoto):PhotoLibrary {
  if(!validNode(id)||!validPhoto(photo))throw new Error('Choose a valid campus point and reference image.')
  const current=publishedPhotos(s)[id]
  return {...s,revision:s.revision+1,drafts:{...s.drafts,[id]:{node_id:id,photo:{...photo,published_at:null},base_publication_id:(s.drafts[id]?s.drafts[id].base_publication_id:current?.publication_id??null)}}}
}
export function discardPointPhoto(s:PhotoLibrary,id:string):PhotoLibrary {const drafts={...s.drafts};delete drafts[id];return {...s,revision:s.revision+1,drafts}}
export function rebasePointPhoto(s:PhotoLibrary,id:string):PhotoLibrary {
  if(!s.drafts[id])throw new Error('No saved photo draft for this point.')
  return {...s,revision:s.revision+1,drafts:{...s.drafts,[id]:{...s.drafts[id],base_publication_id:publishedPhotos(s)[id]?.publication_id??null}}}
}
export function publishPointPhoto(s:PhotoLibrary,id:string,operator:string,note:string,confirmed:boolean,now:string):PhotoLibrary {
  const draft=s.drafts[id],previous=publishedPhotos(s)[id]??null
  if(!draft)throw new Error('Save a photo draft before publishing.')
  if(draft.base_publication_id!==(previous?.publication_id??null))throw new Error('The published photo changed in another tab. Review the latest photo before publishing this draft.')
  if(!text(operator)||!text(note)||!confirmed||!validLocalTime(now))throw new Error('Add an operator label, publication note and explicit photo review before publishing.')
  if(s.history.length>=2000)throw new Error('Photo history is full. Export/archive the local library before publishing more photos.')
  const publication_id=`POINT-PHOTO-${s.revision+1}`,photo={...draft.photo,publication_id,published_at:now}
  const next=discardPointPhoto(s,id)
  return {...next,published:{...s.published,[id]:photo},history:[...s.history,{publication_id,node_id:id,photo,previous,operator:operator.trim(),note:note.trim(),timestamp:now}]}
}

/** A null override suppresses bundled references too; removing the key would restore them. */
export function deletePublishedPointPhoto(s:PhotoLibrary,id:string,expectedPublicationId:string,operator:string,note:string,now:string):PhotoLibrary {
  const previous=publishedPhotos(s)[id]
  if(!validNode(id)||!previous)throw new Error('No published photo to delete for this point.')
  if(previous.publication_id!==expectedPublicationId)throw new Error('The published photo changed in another tab. Review the current picture before deleting it.')
  if(!text(operator)||!text(note)||!validLocalTime(now))throw new Error('Add an operator label and deletion note before deleting the published photo.')
  if(s.history.length>=2000)throw new Error('Photo history is full. Export/archive the local library before deleting more photos.')
  const publication_id=`POINT-PHOTO-${s.revision+1}`
  return {...s,revision:s.revision+1,published:{...s.published,[id]:null},history:[...s.history,{publication_id,node_id:id,photo:null,previous:{...previous},operator:operator.trim(),note:note.trim(),timestamp:now,action:'delete'}]}
}
