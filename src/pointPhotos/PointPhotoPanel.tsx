import { useEffect, useState } from 'react'
import { photoURL, pointName } from './catalog'
import type { PointPhoto } from './catalog'
import './point-photos.css'

export function PointPhotoPanel({nodeId,photo,close,align='left'}:{nodeId:string;photo?:PointPhoto;close:()=>void;align?:'left'|'right'}){
  const [failed,setFailed]=useState(false)
  useEffect(()=>{setFailed(false)},[nodeId,photo?.src])
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close()}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[close])
  return <aside className={`point-photo-panel point-photo-${align}`} aria-label="Point photo reference" data-photo-node={nodeId} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
    <div className="point-photo-heading"><h3>{pointName(nodeId)}</h3><button type="button" aria-label="Close point photo panel" onClick={close}>×</button></div>
    {photo?<><div className="point-photo-image">{failed?<p role="status">Reference image could not load.</p>:<img src={photoURL(photo)} alt={`Reference photo: ${pointName(nodeId)}`} onError={()=>setFailed(true)}/>}</div><p className="point-photo-caption">{photo.caption}</p><p className="point-photo-reference-note">Location reference only. This photo does not establish current route shade or accessibility.</p><details><summary>Photo source</summary><p>{photo.source_note}</p><p>{photo.published_at?`Published: ${photo.published_at}`:'Supplied reference; capture time unknown.'}</p></details></>:<p>No reference photo published for this point.</p>}
  </aside>
}
