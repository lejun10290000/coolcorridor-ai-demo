import { useEffect, useRef, useState } from 'react'
import type { ReportedRoute } from '../types'
import { malaysiaNow } from './model'
import type { WorkflowState } from './model'
import { reportedRouteLabel, routePointName, routeReportCategories, submitRouteReport } from './routeReports'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
export function RouteReportForm({from,to,route,onChoosePoints,commit,onClose,onSubmitted}:{from:string;to:string;route:ReportedRoute|null;onChoosePoints:()=>void;commit:Commit;onClose:()=>void;onSubmitted:()=>void}){
  const [category,setCategory]=useState('broken shade structure'),[description,setDescription]=useState('')
  const dialog=useRef<HTMLFormElement>(null)
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.querySelector<HTMLElement>('button')?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus()}},[])
  return <div className="modal route-report-modal" role="dialog" aria-modal="true" aria-labelledby="report-heading" onKeyDown={e=>{
    if(e.key==='Escape')onClose()
    if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea')),first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
  }}><form ref={dialog} className="dialog route-report-dialog" onSubmit={e=>{e.preventDefault();if(route&&commit(s=>submitRouteReport(s,{route,category,description},malaysiaNow())))onSubmitted()}}>
    <button type="button" className="close" aria-label="Close report form" onClick={onClose}>×</button><h2 id="report-heading">Report a point-to-point route</h2><p>These endpoints come from the two points you clicked on the map. Choose points around the problem, then describe it. Submission leaves map colours unchanged until Developer accepts the report.</p>
    <div className="wf-editor-grid"><label>Report from<input aria-label="Report starting point" readOnly value={from?routePointName(from):''} placeholder="Choose starting point on map"/></label><label>Report to<input aria-label="Report destination" readOnly value={to?routePointName(to):''} placeholder="Choose destination on map"/></label></div>
    <button type="button" onClick={onChoosePoints}>{from||to?'Change report points on map':'Choose report points on map'}</button>
    {route?<div className="wf-report-path" data-testid="report-route-preview" data-report-segments={route.segment_ids.join(',')}><b>{reportedRouteLabel(route)}</b><p>{route.segment_ids.length} connected path links between your map points · {route.dataset_version}</p><details><summary>Exact links included in this report</summary><p>{route.segment_ids.join(' → ')}</p></details></div>:<p className="warning" role="status">Click two different connected points on the map before submitting. Route lists and route cards do not set report points.</p>}
    <label>Problem category<select value={category} onChange={e=>setCategory(e.target.value)}>{routeReportCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
    <label>Describe the problem<textarea required maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="For example: the shade canopy is broken along this path."/></label>
    <p className="muted">Local DEMO report; no personal details needed. Accepting a report marks its saved links yellow/mixed shade in both modes. Repairs require a later manual Developer map update.</p>
    <button type="submit" disabled={!route||!description.trim()}>Submit route report</button>
  </form></div>
}
