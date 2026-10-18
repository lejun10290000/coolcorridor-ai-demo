import { useMemo, useState } from 'react'
import { MapPanel } from '../MapPanel'
import { campusNodeName, campusRouteNodes } from '../campusWalkways'
import { currentSnapshot, malaysiaNow, submitReport } from '../workflow/model'
import type { WorkflowState } from '../workflow/model'
import { SegmentEvidence } from '../workflow/SegmentEvidence'
import { compareRoutes } from './compare'
import { campusWideGraph } from './graph'
import { RouteCards } from './RouteCards'
import './routing.css'

// Normal app integration agreed by Builder 1 in PR #6, issuecomment-6234657305.
type Commit = (update: (state: WorkflowState) => WorkflowState) => boolean
export function CalculatedResident({ back, state, commit, notice }: { back: () => void; state: WorkflowState; commit: Commit; notice: string }) {
  const [selected, setSelected] = useState('')
  const [fromNode, setFromNode] = useState('')
  const [toNode, setToNode] = useState('')
  const [endpointSelectMode, setEndpointSelectMode] = useState<'from'|'to'>('from')
  const [route, setRoute] = useState<'shortest'|'exposure'>('shortest')
  const [openForm, setOpenForm] = useState(false)
  const [category, setCategory] = useState('no shade')
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [recenter, setRecenter] = useState(0)
  const current = currentSnapshot(state)
  const segment = current.segments.find(s => s.segment_id === selected) ?? current.segments.find(s => s.segment_id === 'DEMO-WALK-01') ?? current.segments[0]
  const fromName = campusNodeName(campusRouteNodes.find(n => n.id === fromNode) ?? campusRouteNodes[0])
  const toName = campusNodeName(campusRouteNodes.find(n => n.id === toNode) ?? campusRouteNodes[1])
  const comparison = useMemo(
    () => fromNode && toNode && fromNode !== toNode
      ? compareRoutes(current, campusWideGraph, fromNode, toNode)
      : null,
    [current, fromNode, toNode],
  )
  const chosen = comparison?.[route]?.segment_ids ?? []
  const chooseNode = (nodeId: string) => {
    if (endpointSelectMode === 'from') setFromNode(nodeId)
    else setToNode(nodeId)
  }
  const updateFrom = (value: string) => setFromNode(value)
  const updateTo = (value: string) => setToNode(value)
  return <main className="wf-app"><header><button className="link" onClick={back}>← Home</button><div><span className="chip">DEMO ROUTING</span> <span className="chip wf-version">{current.dataset_version}</span></div></header>
    <section className="workspace resident"><div className="topbar"><div><div className="eyebrow">RESIDENT MODE</div><h1>Find a more comfortable walk</h1></div><button onClick={()=>setRecenter(r=>r+1)}>Recenter map</button></div>
      <p className="wf-local">Choose any two campus dots as start and destination. All pictured walkways begin GREY / UNSURVEYED. Connections, crossings, shade, accessibility and the distances used for route comparison are illustrative estimates only; this is not a navigation service.</p>
      {notice&&<p className="warning" role="alert">{notice}</p>}
      <div className="endpoint route-endpoint-pickers">
        <label>From
          <select value={fromNode} onChange={e=>updateFrom(e.target.value)} aria-label="Starting point">
            <option value="">Choose any starting point</option>
            {campusRouteNodes.map(node=><option key={node.id} value={node.id}>{campusNodeName(node)}</option>)}
          </select>
        </label>
        <label>To
          <select value={toNode} onChange={e=>updateTo(e.target.value)} aria-label="Destination">
            <option value="">Choose any destination</option>
            {campusRouteNodes.map(node=><option key={node.id} value={node.id}>{campusNodeName(node)}</option>)}
          </select>
        </label>
        <div className="map-point-mode" role="group" aria-label="Choose what the next map dot sets">
          <span>Tap map dots to set</span>
          <div>
            <button type="button" className={endpointSelectMode==='from'?'point-mode-active':''} aria-pressed={endpointSelectMode==='from'} onClick={()=>setEndpointSelectMode('from')}>From</button>
            <button type="button" className={endpointSelectMode==='to'?'point-mode-active':''} aria-pressed={endpointSelectMode==='to'} onClick={()=>setEndpointSelectMode('to')}>To</button>
          </div>
        </div>
        {message&&<span className="success" role="status">{message}</span>}
      </div>
      {!fromNode||!toNode
        ? <p className="selected-route-status" role="status">Choose a start and destination from the lists, or select the map-dot mode above and tap any two dots.</p>
        : fromNode===toNode
          ? <p className="warning" role="alert">Start and destination are the same point. Choose two different dots.</p>
          : <p className="selected-route-status" data-testid="selected-route" role="status" data-route-version={comparison?.dataset_version}>Selected route: {fromName} → {toName} · {route==='shortest'?'Shortest':'Most shaded practical route'} · {chosen.length?chosen.join(' → '):'Unavailable'} · {current.dataset_version}</p>}
      <div className="main-grid"><MapPanel segments={current.segments} selected={selected} onSelect={setSelected} routeIds={chosen} recenter={recenter} reports={state.reports} fromNode={fromNode} toNode={toNode} endpointSelectMode={endpointSelectMode} onNodeSelect={chooseNode}/><SegmentEvidence segment={segment} version={current.dataset_version} state={state} mode="resident" onAction={()=>setOpenForm(true)}/></div>
      {comparison
        ? <RouteCards comparison={comparison} selected={route} onSelect={setRoute} fromLabel={fromName} toLabel={toName}/>
        : <section className="route-comparison"><h2>Choose your own campus route</h2><p>The route will be calculated after you choose two different dots. No fixed Main Gate → Klinik UTM journey is preselected.</p><p className="warning">Every route segment is grey and UNSURVEYED. With no reviewed shade observations, both route objectives may choose the same path.</p></section>}
      {openForm&&<div className="modal" role="dialog" aria-modal="true" aria-labelledby="report-heading" onKeyDown={e=>{
        if(e.key==='Escape')setOpenForm(false)
        if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button,select,textarea'));const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
      }}><form className="dialog" onSubmit={e=>{e.preventDefault();if(commit(s=>submitReport(s,{segment_id:segment.segment_id,category,comment_optional:comment},malaysiaNow()))){setOpenForm(false);setComment('');setMessage('Report submitted with pending review status. Reports are not footfall.')}}}><button type="button" className="close" aria-label="Close report form" autoFocus onClick={()=>setOpenForm(false)}>×</button><h2 id="report-heading">Report walkway issue</h2><p>{segment.segment_id}. Reports start submitted/pending review and are never pedestrian counts.</p><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{['no shade','too hot at a stated time','blocked walkway','unsafe crossing','other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Optional note<textarea maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></label><button type="submit">Submit demo report</button></form></div>}
    </section>
  </main>
}
