import { useEffect, useState } from 'react'
import type { ReportReferencePhoto } from '../types'
import './report-photos.css'

export function ReportPhotoPreview({photo,label}:{photo:ReportReferencePhoto;label:string}){
  const [expanded,setExpanded]=useState(false),[failed,setFailed]=useState(false)
  useEffect(()=>{setExpanded(false);setFailed(false)},[photo.data_url])
  return <figure className={`report-reference-photo ${expanded?'report-photo-expanded':''}`}><figcaption>{label}</figcaption>
    {failed?<p role="status">The attached reference photo could not load.</p>:<><img src={photo.data_url} alt={label} onError={()=>setFailed(true)}/><button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Reduce photo':'View larger photo'}</button></>}
    <p>Resident-provided reference · capture time unknown · not verified. Review it alongside the reported path and description.</p>
  </figure>
}
