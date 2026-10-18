import { useMemo, useState } from 'react'
import { MapPanel } from '../MapPanel'
import type { CampusImageMapProps } from '../CampusImageMap'
import { campusNodeName, campusRouteNodes } from '../campusWalkways'
import { currentSnapshot, malaysiaNow } from './model'
import type { WorkflowState } from './model'
import type { ResidentReport, ShadeLabel } from '../types'
import { reportedRouteLabel } from './routeReports'
import { mapRouteSelection, mapShadeLabels, previewMapShade, publishMapShade, rebaseMapShadeDraft, removeMapShadeDraft, stageMapShade } from './mapShade'

type Commit=(update:(state:WorkflowState)=>WorkflowState)=>boolean
export function DeveloperMapEditor({state,commit,canEdit,reportPreview,onCloseReportPreview,...mapProps}:CampusImageMapProps&{state:WorkflowState;commit:Commit;canEdit:boolean;reportPreview?:ResidentReport|null;onCloseReportPreview?:()=>void}){
  const [from,setFrom]=useState(''),[to,setTo]=useState(''),[pointMode,setPointMode]=useState<'from'|'to'>('from')
  const [selectedIds,setSelectedIds]=useState<string[]>([]),[label,setLabel]=useState<ShadeLabel>('mostly_exposed')
  const [editing,setEditing]=useState(true),[message,setMessage]=useState(''),[by,setBy]=useState('Demo map operator'),[note,setNote]=useState(''),[confirmed,setConfirmed]=useState(false)
  const draft=state.map_shade_draft,current=currentSnapshot(state),reviewPath=reportPreview?.route,active=editing&&canEdit&&!reviewPath
  const stale=!!draft&&draft.base_dataset_version!==state.current_version
  const connection=useMemo(()=>{
    if(!from||!to)return{ids:[],error:''}
    try{return{ids:mapRouteSelection(state,from,to),error:''}}catch(e){return{ids:[],error:(e as Error).message}}
  },[state,from,to])
  const draftKey=JSON.stringify(draft)
  const [reviewedKey,setReviewedKey]=useState('')
  const reviewed=confirmed&&reviewedKey===draftKey
  function choosePoint(id:string){if(pointMode==='from'){setFrom(id);setPointMode('to')}else setTo(id);setMessage('')}
  function toggleSegment(id:string){mapProps.onSelect(id);if(active){setSelectedIds(ids=>ids.includes(id)?ids.filter(v=>v!==id):[...ids,id]);setMessage('')}}
  function addRoute(){setSelectedIds(ids=>[...new Set([...ids,...connection.ids])]);setFrom('');setTo('');setPointMode('from');setMessage('Route added. Choose another pair or tap paths to add/remove links.')}
  function applyShade(){if(commit(s=>stageMapShade(s,selectedIds,label,malaysiaNow()))){setMessage(`${selectedIds.length} selected links saved as ${mapShadeLabels[label]} in the Developer draft. Resident map is unchanged.`);setSelectedIds([]);setConfirmed(false)}}
  function publish(){if(commit(s=>publishMapShade(s,by,note,reviewed,malaysiaNow()))){setMessage('Published to Resident map. Shortest and most shaded practical routes now use the new dataset.');setConfirmed(false);setSelectedIds([]);setNote('')}}
  return <section className="wf-map-editor" aria-label="Developer route shade editor">
    <div className="wf-panel"><h2>Edit map shade</h2><p>Select one or more point-to-point routes, or tap individual path links. Then choose a shade category. Changes first appear in the Developer draft; publish when ready to update Resident routing.</p>
      <p className="warning">Manual DEMO classifications only. “Fully shaded” ranks as the shaded category in this prototype, not a measured 100% shade claim.</p>
      {!canEdit&&<p role="status">Switch to the current baseline to edit shade. Historical and simulated maps cannot be published.</p>}
      {reviewPath&&<p className="warning">Reported path preview uses the current published shade. Close it to resume manual editing. Saved drafts are preserved.</p>}
      <fieldset disabled={!canEdit||!!reviewPath}><legend>Choose paths to edit</legend>
        <label className="wf-check"><input type="checkbox" checked={editing} onChange={e=>setEditing(e.target.checked)}/>Select paths for shade editing</label>
        <div className="wf-editor-grid">
          <label>Route from<select aria-label="Developer route from" value={from} onChange={e=>setFrom(e.target.value)}><option value="">Choose a point</option>{campusRouteNodes.map(n=><option key={n.id} value={n.id}>{campusNodeName(n)}</option>)}</select></label>
          <label>Route to<select aria-label="Developer route to" value={to} onChange={e=>setTo(e.target.value)}><option value="">Choose a point</option>{campusRouteNodes.map(n=><option key={n.id} value={n.id}>{campusNodeName(n)}</option>)}</select></label>
        </div>
        <div className="wf-actions" role="group" aria-label="Developer map point selection"><span>Next map point:</span><button type="button" aria-pressed={pointMode==='from'} onClick={()=>setPointMode('from')}>From</button><button type="button" aria-pressed={pointMode==='to'} onClick={()=>setPointMode('to')}>To</button><button type="button" disabled={!connection.ids.length||!editing} onClick={addRoute}>Add route to selection</button></div>
        {connection.error&&<p role="alert">{connection.error}</p>}{connection.ids.length>0&&<p>Connected route: {connection.ids.length} links along the existing shortest corridor network. Add it to the selection, then choose another pair if needed.</p>}
        <p data-testid="developer-selection" data-selected-segments={selectedIds.join(',')}>{selectedIds.length} links selected for editing. Overlapping routes count each link once.</p>
        <div className="wf-actions"><button type="button" disabled={!selectedIds.length} onClick={()=>{setSelectedIds([]);setMessage('Selection cleared; saved draft remains.')}}>Clear path selection</button><label>Shade for selected paths<select aria-label="Shade for selected paths" value={label} onChange={e=>setLabel(e.target.value as ShadeLabel)}>{Object.entries(mapShadeLabels).map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label><button type="button" disabled={!selectedIds.length||stale||!editing} onClick={applyShade}>Apply shade to Developer draft</button></div>
      </fieldset>
      {message&&<p role="status" className="success">{message}</p>}
      {draft&&<section aria-label="Review Developer shade draft"><h3>Developer draft — {draft.assignments.length} changed links</h3><p>Based on {draft.base_dataset_version}. Saved locally; not yet visible to Residents. Reapplying a category replaces that link’s draft category.</p>
        {stale&&<div className="warning" role="alert"><p>The published map changed since this draft began. Compare the latest values below before continuing. Reviewing keeps your draft assignments.</p><button type="button" disabled={!canEdit} onClick={()=>{if(commit(s=>rebaseMapShadeDraft(s,malaysiaNow()))){setConfirmed(false);setMessage('Draft reviewed against the latest published version. Check changes before publishing.')}}}>Use latest map as draft baseline</button></div>}
        <details open><summary>Review changed links</summary><div className="wf-table-wrap"><table><thead><tr><th>Path link</th><th>Currently published</th><th>Developer draft</th><th>Action</th></tr></thead><tbody>{draft.assignments.map(a=><tr key={a.segment_id}><th scope="row">{a.segment_id}</th><td>{mapShadeLabels[current.segments.find(s=>s.segment_id===a.segment_id)!.shade_label]}</td><td>{mapShadeLabels[a.shade_label]} · DEMO</td><td><button type="button" aria-label={`Remove draft ${a.segment_id}`} onClick={()=>{commit(s=>removeMapShadeDraft(s,[a.segment_id]));setConfirmed(false)}}>Remove</button></td></tr>)}</tbody></table></div></details>
        <div className="wf-editor-grid"><label>Map operator label<input maxLength={2000} value={by} onChange={e=>{setBy(e.target.value);setConfirmed(false)}}/></label><label>Map publication note<textarea maxLength={2000} value={note} onChange={e=>{setNote(e.target.value);setConfirmed(false)}} placeholder="Describe this demo map update"/></label></div>
        <label className="wf-check"><input type="checkbox" checked={reviewed} onChange={e=>{setConfirmed(e.target.checked);setReviewedKey(draftKey)}}/>I reviewed these DEMO shade changes and want to publish them to Resident routing.</label>
        <div className="wf-actions"><button type="button" disabled={!canEdit||!!reviewPath||stale||!reviewed||!by.trim()||!note.trim()} onClick={publish}>Publish to Resident map</button><button type="button" onClick={()=>{commit(s=>removeMapShadeDraft(s));setConfirmed(false);setMessage('Developer draft discarded. Published Resident map is unchanged.')}}>Discard Developer draft</button></div>
      </section>}
    </div>
    {reviewPath&&<div className="wf-report-path" role="status"><b>Report {reportPreview!.report_id}: {reportedRouteLabel(reviewPath)}</b><p>Exact saved links, with current published shade. A later route calculation does not move this report.</p><button type="button" onClick={onCloseReportPreview}>Close reported route preview</button></div>}
    <p className="wf-map-state" data-testid="developer-map-state">{reviewPath?'REPORTED ROUTE — CURRENT PUBLISHED SHADE':canEdit&&draft?'DEVELOPER DRAFT PREVIEW — not published to Residents':canEdit?'CURRENT PUBLISHED MAP':'READ-ONLY COMPARISON'} · {mapProps.scenario?'SIMULATED':current.dataset_version}</p>
    <MapPanel {...mapProps} showReportNumbers segments={reviewPath?current.segments:canEdit&&draft?previewMapShade(state):mapProps.segments} onSelect={toggleSegment} routeIds={reviewPath?.segment_ids??(active?selectedIds:[])} fromNode={reviewPath?.from_node??(active?from:undefined)} toNode={reviewPath?.to_node??(active?to:undefined)} onNodeSelect={active?choosePoint:undefined}/>
  </section>
}
