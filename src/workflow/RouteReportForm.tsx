import { useEffect, useRef, useState } from 'react'
import { campusNodeName, campusRouteNodes } from '../campusWalkways'
import type { RouteComparison } from '../routing/compare'
import { malaysiaNow } from './model'
import type { WorkflowState } from './model'
import { reportedRouteLabel, routeReportCategories, submitRouteReport } from './routeReports'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
export function RouteReportForm({from,to,onFrom,onTo,objective,onObjective,comparison,commit,onClose,onSubmitted}:{from:string;to:string;onFrom:(s:string)=>void;onTo:(s:string)=>void;objective:'shortest'|'exposure';onObjective:(s:'shortest'|'exposure')=>void;comparison:RouteComparison|null;commit:Commit;onClose:()=>void;onSubmitted:()=>void}){
  const [category,setCategory]=useState('broken shade structure'),[description,setDescription]=useState('')
  const dialog=useRef<HTMLFormElement>(null)
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.querySelector<HTMLElement>('button')?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus()}},[])
  const path=comparison?.[objective]
  const route=path?{from_node:from,to_node:to,objective,segment_ids:path.segment_ids,node_ids:path.node_ids,dataset_version:path.dataset_version}:null
  return <div className="modal route-report-modal" role="dialog" aria-modal="true" aria-labelledby="report-heading" onKeyDown={e=>{
    if(e.key==='Escape')onClose()
    if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),select,textarea')),first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
  }}><form ref={dialog} className="dialog route-report-dialog" onSubmit={e=>{e.preventDefault();if(route&&commit(s=>submitRouteReport(s,{route,category,description},malaysiaNow())))onSubmitted()}}>
    <button type="button" className="close" aria-label="Close report form" onClick={onClose}>×</button><h2 id="report-heading">Report a point-to-point route</h2><p>Choose the path with the problem and describe what happened, for example a broken shade structure. Submission leaves map colours unchanged until Developer accepts the report.</p>
    <div className="wf-editor-grid"><label>Report from<select aria-label="Report starting point" value={from} onChange={e=>onFrom(e.target.value)} required><option value="">Choose starting point</option>{campusRouteNodes.map(n=><option key={n.id} value={n.id}>{campusNodeName(n)}</option>)}</select></label><label>Report to<select aria-label="Report destination" value={to} onChange={e=>onTo(e.target.value)} required><option value="">Choose destination</option>{campusRouteNodes.map(n=><option key={n.id} value={n.id}>{campusNodeName(n)}</option>)}</select></label></div>
    <label>Reported route option<select value={objective} onChange={e=>onObjective(e.target.value as 'shortest'|'exposure')}><option value="shortest">Shortest route</option><option value="exposure">Most shaded practical route</option></select></label>
    {route?<div className="wf-report-path" data-testid="report-route-preview" data-report-segments={route.segment_ids.join(',')}><b>{reportedRouteLabel(route)}</b><p>{route.segment_ids.length} saved path links · {route.dataset_version}</p><details><summary>Exact links included in this report</summary><p>{route.segment_ids.join(' → ')}</p></details></div>:<p className="warning" role="status">Choose two different connected points. No reportable route is available for this selection.</p>}
    <label>Problem category<select value={category} onChange={e=>setCategory(e.target.value)}>{routeReportCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
    <label>Describe the problem<textarea required maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="For example: the shade canopy is broken along this path."/></label>
    <p className="muted">Local DEMO report; no personal details needed. Accepting a report marks its saved links yellow/mixed shade in both modes. Repairs require a later manual Developer map update.</p>
    <button type="submit" disabled={!route||!description.trim()}>Submit route report</button>
  </form></div>
}
