import { useEffect, useRef, useState } from 'react'
import type { PointPhotoController } from './usePointPhotos'
import { photoPoints, photoURL, pointName } from './catalog'
import { deletePublishedPointPhoto, discardPointPhoto, publishPointPhoto, rebasePointPhoto, stagePointPhoto } from './model'
import { preparePointPhoto } from './preparePhoto'
import { malaysiaNow } from '../workflow/model'
import './point-photos.css'

export function PointPhotoEditor({controller,nodeId,select,enabled}:{controller:PointPhotoController;nodeId:string|null;select:(id:string)=>void;enabled:boolean}){
  const id=nodeId??'MAIN-GATE',draft=controller.library.drafts[id],photo=controller.published[id]
  const [operator,setOperator]=useState('Demo photo operator'),[note,setNote]=useState(''),[reviewed,setReviewed]=useState(''),[message,setMessage]=useState(''),[fileError,setFileError]=useState(''),[preparing,setPreparing]=useState(false)
  const request=useRef(0)
  const fileInput=useRef<HTMLInputElement>(null)
  const [deleteKey,setDeleteKey]=useState('')
  useEffect(()=>{request.current++;setPreparing(false);setFileError('');setMessage('');setReviewed('');setDeleteKey('')},[id])
  const draftKey=JSON.stringify({id,draft}),confirmed=reviewed===draftKey,stale=!!draft&&draft.base_publication_id!==(photo?.publication_id??null)
  const disabled=!enabled||!controller.ready||controller.busy||preparing
  async function chooseFile(file:File|undefined){
    const sequence=++request.current,target=id
    setFileError('');setMessage('');setReviewed('')
    if(!file)return
    setPreparing(true)
    try{const src=await preparePointPhoto(file);if(sequence!==request.current)return
      if(await controller.commit(s=>stagePointPhoto(s,target,{src,caption:pointName(target),source_note:'Developer-supplied point reference. Capture time, shade and accessibility are not verified.',publication_id:'unpublished-draft',published_at:null})))setMessage('Photo draft saved. Residents still see the published picture.')
    }catch(e){if(sequence===request.current)setFileError(e instanceof Error?e.message:'Could not prepare image.')}
    finally{if(sequence===request.current)setPreparing(false)}
  }
  function choosePoint(value:string){request.current++;setPreparing(false);setFileError('');setMessage('');setReviewed('');setDeleteKey('');select(value)}
  return <section className="wf-panel point-photo-editor" aria-label="Edit point photos"><h2>Point photos / publish references</h2><p>Choose a point below or click its map marker. Update or delete an existing photo, or upload a photo for an empty point.</p>
    <label>Point for reference photo<select aria-label="Point for reference photo" value={id} onChange={e=>choosePoint(e.target.value)}>{photoPoints.map(n=><option value={n.id} key={n.id}>{pointName(n.id)}</option>)}</select></label>
    {!enabled&&<p>Return to the current baseline to update point photos.</p>}
    {controller.error&&<div className="warning" role="alert"><p>{controller.error}</p>{!controller.ready&&<button onClick={()=>void controller.retry()}>Retry photo storage</button>}</div>}
    {preparing&&<p role="status">Preparing reference photo…</p>}{fileError&&<p role="alert" className="warning">{fileError}</p>}{message&&<p role="status">{message}</p>}
    <div className="point-photo-preview-grid"><div><h3>Published photo</h3>{photo?<img src={photoURL(photo)} alt={`Currently published reference: ${pointName(id)}`}/>:<p>No published photo yet.</p>}</div><div><h3>Developer draft</h3>{draft?<img src={photoURL(draft.photo)} alt={`Unpublished reference draft: ${pointName(id)}`}/>:<p>No unpublished changes.</p>}</div></div>
    <input ref={fileInput} key={id} hidden aria-label="Upload reference photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={e=>{void chooseFile(e.target.files?.[0]);e.target.value=''}}/>
    <div className="wf-actions" role="group" aria-label="Photo actions"><button type="button" disabled={disabled} onClick={()=>{setDeleteKey('');fileInput.current?.click()}}>{photo?'Update photo':'Upload photo'}</button>{photo&&<button type="button" disabled={disabled} onClick={()=>setDeleteKey(photo.publication_id)}>Delete published photo</button>}</div>
    <p>{photo?'Update photo selects a replacement directly. The current published photo stays visible to Residents until you publish the replacement.':'Upload photo adds a new reference for this point. Residents see it only after you publish.'}</p>
    <p>JPEG, PNG or WebP, up to 10 MB. A smaller preview is saved without location metadata. Remove identifying faces and number plates before uploading.</p>
    {(draft||photo)&&<>
      <label>Photo publication operator<input aria-label="Photo publication operator" value={operator} maxLength={1000} disabled={disabled} onChange={e=>{setOperator(e.target.value);setReviewed('')}}/></label>
      <label>Photo publication note<textarea aria-label="Photo publication note" value={note} maxLength={1000} disabled={disabled} onChange={e=>{setNote(e.target.value);setReviewed('')}}/></label>
    </>}
    {photo&&<div className="point-photo-delete">
      {deleteKey===photo.publication_id&&<><p>Delete the published photo for <b>{pointName(id)}</b> from the baseline and Resident map? The previous photo stays in history. Any unpublished draft is kept.</p><p>Enter an operator label and deletion note above, then confirm.</p><div className="wf-actions"><button disabled={disabled||!operator.trim()||!note.trim()} onClick={async()=>{if(await controller.commit(s=>deletePublishedPointPhoto(s,id,deleteKey,operator,note,malaysiaNow()))){setDeleteKey('');setReviewed('');setNote('');setMessage('Published point photo deleted. It is no longer shown on the baseline or Resident map.')}}}>Confirm delete published photo</button><button disabled={disabled} onClick={()=>setDeleteKey('')}>Cancel photo deletion</button></div></>}
    </div>}
    {draft&&<>
      {stale&&<div className="warning"><p>The published photo changed after this draft started. Review the current picture before publishing.</p><button disabled={disabled} onClick={()=>{setReviewed('');void controller.commit(s=>rebasePointPhoto(s,id))}}>Review latest published photo</button></div>}
      <label className="wf-check"><input type="checkbox" checked={confirmed} disabled={disabled||stale} onChange={e=>setReviewed(e.target.checked?draftKey:'')}/>I reviewed this point photo and want to publish it to Residents.</label>
      <div className="wf-actions"><button disabled={disabled||stale||!confirmed||!operator.trim()||!note.trim()} onClick={async()=>{if(await controller.commit(s=>publishPointPhoto(s,id,operator,note,confirmed,malaysiaNow()))){setMessage('Point photo published. Residents now see this picture.');setReviewed('');setNote('')}}}>Publish point photo to Residents</button><button disabled={disabled} onClick={async()=>{if(await controller.commit(s=>discardPointPhoto(s,id))){setMessage('Photo draft discarded. The published picture is unchanged.');setReviewed('')}}}>Discard photo draft</button></div>
    </>}
    <details><summary>Photo publication history ({controller.library.history.filter(h=>h.node_id===id).length})</summary>{controller.library.history.filter(h=>h.node_id===id).slice().reverse().map(h=><article key={h.publication_id}><b>{h.publication_id} · {h.action==='delete'?'Deleted published photo':'Published photo'}</b><p>{h.timestamp} · {h.operator}</p><p>{h.note}</p></article>)}</details>
    <p className="point-photo-reference-note">Reference photos and shade publications are separate. Photos never change route shade or routing. Updates are shared only in this browser profile and app address.</p>
  </section>
}
