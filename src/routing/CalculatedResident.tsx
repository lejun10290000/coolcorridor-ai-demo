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
import { seedPointPhotos } from '../pointPhotos/catalog'
import type { PointPhotoController } from '../pointPhotos/usePointPhotos'
import { advanceWalk, beginWalk, previousWalkPoint, walkProgress } from './walk'
import type { WalkSession } from './walk'
import { WalkPanel } from './WalkPanel'
import './routing.css'
import './resident-layout.css'

// Normal app integration agreed by Builder 1 in PR #6, issuecomment-6234657305.
type Commit = (update: (state: WorkflowState) => WorkflowState) => boolean
export function CalculatedResident({ back, state, commit, notice, pointPhotos }: { back: () => void; state: WorkflowState; commit: Commit; notice: string; pointPhotos?: PointPhotoController }) {
  const [selected, setSelected] = useState('')
  const [photoPoint,setPhotoPoint]=useState<string|null>(null)
  const [evidenceOpen,setEvidenceOpen]=useState(false)
  const [fromNode, setFromNode] = useState('')
  const [toNode, setToNode] = useState('')
  const [endpointSelectMode, setEndpointSelectMode] = useState<'from'|'to'>('from')
  const [route, setRoute] = useState<'shortest'|'exposure'>('shortest')
  const [openForm, setOpenForm] = useState(false)
  const [reportPoints,setReportPoints]=useState({from:'',to:''})
  const mapAnchor=useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')
  const [recenter, setRecenter] = useState(0)
  const [walk,setWalk]=useState<WalkSession|null>(null)
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
  const chosen = walk?.route.segment_ids??comparison?.[route]?.segment_ids ?? []
  const progress=walk?walkProgress(walk):null
  const publishedPhotos=pointPhotos?.published??seedPointPhotos
  function startWalk(){
    const calculated=comparison?.[route]
    if(!calculated)return
    try{setWalk(beginWalk(calculated,current));setPhotoPoint(null);setSelected('');setOpenForm(false);setRecenter(r=>r+1);setMessage('');requestAnimationFrame(()=>document.querySelector('.resident-walk-panel')?.scrollIntoView({block:'start'}))}
    catch(e){setMessage(e instanceof Error?e.message:'This route cannot start a walkthrough.')}
  }
  function exitWalk(){setWalk(null);setPhotoPoint(null);requestAnimationFrame(()=>document.getElementById('resident-route-controls')?.focus({preventScroll:true}))}
  const reportRoute=useMemo(()=>manualReportRoute(current,reportPoints.from,reportPoints.to),[current,reportPoints])
  const chooseNode = (nodeId: string) => {
    if(walk)return
    if (endpointSelectMode === 'from') {setFromNode(nodeId);setEndpointSelectMode('to');setReportPoints({from:nodeId,to:''})}
    else {setToNode(nodeId);setReportPoints(p=>({...p,to:nodeId}))}
  }
  const chooseReportPoints=()=>{setPhotoPoint(null);setOpenForm(false);setReportPoints({from:'',to:''});setEndpointSelectMode('from');requestAnimationFrame(()=>{mapAnchor.current?.scrollIntoView({block:'start'});mapAnchor.current?.querySelector<HTMLElement>('.campus-map-viewport')?.focus({preventScroll:true})})}
  const updateFrom = (value: string) => setFromNode(value)
  const updateTo = (value: string) => setToNode(value)
  return <main className="wf-app resident-app"><header><button className="link" onClick={back}>← Home</button><div><span className="chip">DEMO ROUTING</span> <span className="chip wf-version">{current.dataset_version}</span></div></header>
    <section className="workspace resident resident-workspace">
      <div className="topbar resident-topbar"><div><div className="eyebrow">RESIDENT MODE</div><h1>Find a more comfortable walk</h1></div><div className="resident-topbar-actions"><a className="resident-jump-link" href={walk?'#resident-walk-progress':'#resident-route-controls'}>{walk?'Walk progress':'Plan a route'}</a><button onClick={()=>setRecenter(r=>r+1)}>Recenter map</button></div></div>
      {notice&&<p className="warning" role="alert">{notice}</p>}
      {pointPhotos?.error&&<p className="warning" role="alert">{pointPhotos.error} Bundled reference photos remain available.</p>}
      <div className="main-grid resident-layout">
        <div className="resident-map-pane" id="resident-campus-map" ref={mapAnchor} tabIndex={-1}>
          <MapPanel walkPosition={progress?{current:progress.current,next:progress.next}:undefined} photoPoint={photoPoint} onPhotoPointChange={setPhotoPoint} pointPhotos={publishedPhotos} compactDetails segments={walk?.snapshot.segments??current.segments} selected={walk?'':selected} onSelect={id=>{if(!walk){setSelected(id);setEvidenceOpen(true)}}} routeIds={chosen} recenter={recenter} fromNode={fromNode} toNode={toNode} endpointSelectMode={endpointSelectMode} onNodeSelect={walk?undefined:chooseNode}/>
        </div>
        <div className="resident-sidebar" role="region" aria-label="Route planning and comparison" tabIndex={0}>
          <section className="resident-route-controls" id="resident-route-controls" tabIndex={-1} aria-labelledby="resident-plan-heading" hidden={!!walk}>
            <div className="resident-panel-heading"><h2 id="resident-plan-heading">Plan your walk</h2><a className="resident-jump-link" href="#resident-campus-map">View map</a></div>
            <p>{walk?'Your route is locked. Finish or exit the walk to choose a different route.':'Choose your start and destination below, then select a route and start the walk. Routes update automatically while planning.'}</p>
            <fieldset disabled={!!walk} aria-label="Route endpoints">
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
                  <button type="button" className={endpointSelectMode==='from'?'point-mode-active':''} aria-pressed={endpointSelectMode==='from'} onClick={()=>{setPhotoPoint(null);setEndpointSelectMode('from')}}>From</button>
                  <button type="button" className={endpointSelectMode==='to'?'point-mode-active':''} aria-pressed={endpointSelectMode==='to'} onClick={()=>{setPhotoPoint(null);setEndpointSelectMode('to')}}>To</button>
                </div>
              </div>
              {message&&<span className="success" role="status">{message}</span>}
            </div>
            </fieldset>
            {!fromNode||!toNode?<p className="resident-route-hint" role="status">Choose two points to compare the shortest and most shaded routes.</p>:fromNode===toNode?<p className="warning" role="alert">Start and destination are the same point. Choose two different dots.</p>:null}
          </section>
          {walk?<WalkPanel walk={walk} photos={publishedPhotos} currentVersion={current.dataset_version} next={()=>{setPhotoPoint(null);setWalk(w=>w?advanceWalk(w):w)}} previous={()=>{setPhotoPoint(null);setWalk(w=>w?previousWalkPoint(w):w)}} exit={exitWalk}/>:<>
          {comparison
            ? <RouteCards compact comparison={comparison} selected={route} onSelect={setRoute} fromLabel={fromName} toLabel={toName}/>
            : <section className="route-comparison resident-empty-routes" aria-label="Route comparison"><h2>Compare walking routes</h2><p>Shortest route and most shaded practical route will appear here after you choose two different points.</p><p>Grey paths have unknown shade. The shaded alternative stays within 25% of the shortest distance.</p></section>}
          {comparison?.[route]&&<section className="resident-start-walk" aria-label="Start chosen walk"><button type="button" onClick={startWalk}>Start selected route</button><p>The chosen route stays locked while you confirm each point with Next. Points without a photo are labelled clearly.</p></section>}
          {fromNode&&toNode&&fromNode!==toNode&&<details className="resident-route-metadata"><summary>Selected route details</summary>
            <p className="selected-route-status" data-testid="selected-route" role="status" data-route-version={comparison?.dataset_version}>Selected route: {fromName} → {toName} · {route==='shortest'?'Shortest':'Most shaded practical route'} · {chosen.length?chosen.join(' → '):'Unavailable'} · {current.dataset_version}</p>
          </details>}
          <section className="wf-route-report-action resident-report-panel" aria-label="Report map point selection"><h2>Report a walkway problem</h2><p>Choose two map points around the problem, then describe what needs attention.</p><div className="wf-actions"><button type="button" onClick={chooseReportPoints}>Choose report points on map</button><button type="button" onClick={()=>setOpenForm(true)}>Report selected route</button></div><p data-testid="report-map-selection">Report points: {reportPoints.from?routePointName(reportPoints.from):'Click a starting point'} → {reportPoints.to?routePointName(reportPoints.to):'Click a destination'}. Only manual map clicks set these points; routing lists and cards are separate.</p></section>
          <details className="resident-path-evidence" open={evidenceOpen} onToggle={e=>setEvidenceOpen(e.currentTarget.open)}><summary>Path information{selected?` · ${segment.segment_id}`:''}</summary><SegmentEvidence segment={segment} version={current.dataset_version} state={state} mode="resident" onAction={()=>setOpenForm(true)}/></details>
          </>}
          <details className="resident-about"><summary>About this demo and its data</summary>
            <p className="wf-local">Choose any two campus dots as start and destination. While planning, routes automatically use the latest published map; active walkthroughs keep their selected map version until exit. Unpublished Developer drafts are excluded. Grey means unknown shade. Connections, crossings, accessibility and route distances remain illustrative and unsurveyed; this is not a navigation service. Saved state stays in this browser origin/profile only, with no cross-device sync.</p>
          </details>
        </div>
      </div>
      {openForm&&<RouteReportForm from={reportPoints.from} to={reportPoints.to} route={reportRoute} onChoosePoints={chooseReportPoints} commit={commit} onClose={()=>setOpenForm(false)} onSubmitted={()=>{setOpenForm(false);setMessage('Route report submitted for Developer review. Map shade is unchanged until accepted.')}}/>}
    </section>
  </main>
}
