import { useMemo, useRef, useState } from 'react'
import { MapPanel } from '../MapPanel'
import { campusNodeName, campusRouteNodes } from '../campusWalkways'
import { currentSnapshot } from '../workflow/model'
import type { WorkflowState } from '../workflow/model'
import { SegmentEvidence } from '../workflow/SegmentEvidence'
import { compareRoutes } from './compare'
import { campusWideGraph } from './graph'
import { RouteCards } from './RouteCards'
import { RouteReportForm } from '../workflow/RouteReportForm'
import { manualReportRoute, routePointName } from '../workflow/routeReports'
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
  const [reportPoints,setReportPoints]=useState({from:'',to:''})
  const mapAnchor=useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')
  const [recenter, setRecenter] = useState(0)
  const current = currentSnapshot(state)
  const segment = current.segments.find(s => s.segment_id === selected) ?? current.segments.find(s => s.segment_id === 'DEMO-REF-001') ?? current.segments[0]
  const fromName = campusNodeName(campusRouteNodes.find(n => n.id === fromNode) ?? campusRouteNodes[0])
  const toName = campusNodeName(campusRouteNodes.find(n => n.id === toNode) ?? campusRouteNodes[1])
  const comparison = useMemo(
    () => fromNode && toNode && fromNode !== toNode
      ? compareRoutes(current, campusWideGraph, fromNode, toNode)
      : null,
    [current, fromNode, toNode],
  )
  const chosen = comparison?.[route]?.segment_ids ?? []
  const reportRoute=useMemo(()=>manualReportRoute(current,reportPoints.from,reportPoints.to),[current,reportPoints])
  const chooseNode = (nodeId: string) => {
    if (endpointSelectMode === 'from') {setFromNode(nodeId);setEndpointSelectMode('to');setReportPoints({from:nodeId,to:''})}
    else {setToNode(nodeId);setReportPoints(p=>({...p,to:nodeId}))}
  }
  const chooseReportPoints=()=>{setOpenForm(false);setReportPoints({from:'',to:''});setEndpointSelectMode('from');requestAnimationFrame(()=>{mapAnchor.current?.scrollIntoView({block:'start'});mapAnchor.current?.querySelector<HTMLElement>('.campus-map-viewport')?.focus({preventScroll:true})})}
  const updateFrom = (value: string) => setFromNode(value)
  const updateTo = (value: string) => setToNode(value)
  return <main className="wf-app"><header><button className="link" onClick={back}>← Home</button><div><span className="chip">DEMO ROUTING</span> <span className="chip wf-version">{current.dataset_version}</span></div></header>
    <section className="workspace resident"><div className="topbar"><div><div className="eyebrow">RESIDENT MODE</div><h1>Find a more comfortable walk</h1></div><button onClick={()=>setRecenter(r=>r+1)}>Recenter map</button></div>
      <p className="wf-local">Choose any two campus dots as start and destination. Routes automatically use the latest published map; unpublished Developer drafts are excluded. Grey means unknown shade. Connections, crossings, accessibility and route distances remain illustrative and unsurveyed; this is not a navigation service. Saved state stays in this browser origin/profile only, with no cross-device sync.</p>
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
      <div className="main-grid" ref={mapAnchor}><MapPanel segments={current.segments} selected={selected} onSelect={setSelected} routeIds={chosen} recenter={recenter} fromNode={fromNode} toNode={toNode} endpointSelectMode={endpointSelectMode} onNodeSelect={chooseNode}/><SegmentEvidence segment={segment} version={current.dataset_version} state={state} mode="resident" onAction={()=>setOpenForm(true)}/></div>
      <section className="wf-route-report-action" aria-label="Report map point selection"><button type="button" onClick={chooseReportPoints}>Choose report points on map</button><button type="button" onClick={()=>setOpenForm(true)}>Report selected route</button><p data-testid="report-map-selection">Report points: {reportPoints.from?routePointName(reportPoints.from):'Click a starting point'} → {reportPoints.to?routePointName(reportPoints.to):'Click a destination'}. Only manual map clicks set these points; routing lists and cards are separate.</p></section>
      {comparison
        ? <RouteCards comparison={comparison} selected={route} onSelect={setRoute} fromLabel={fromName} toLabel={toName}/>
        : <section className="route-comparison"><h2>Choose your own campus route</h2><p>The route will be calculated after you choose two different dots. No fixed Main Gate → Klinik UTM journey is preselected.</p><p className="warning">Unknown shade is ranked conservatively. Published DEMO classifications affect routing but do not establish observed shade. Both objectives can choose the same path.</p></section>}
      {openForm&&<RouteReportForm from={reportPoints.from} to={reportPoints.to} route={reportRoute} onChoosePoints={chooseReportPoints} commit={commit} onClose={()=>setOpenForm(false)} onSubmitted={()=>{setOpenForm(false);setMessage('Route report submitted for Developer review. Map shade is unchanged until accepted.')}}/>}
    </section>
  </main>
}
