import { useEffect, useMemo, useRef, useState } from 'react'
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
import { pointName } from '../pointPhotos/catalog'
import type { PointPhotoController } from '../pointPhotos/usePointPhotos'
import { advanceWalk, beginWalk, previousWalkPoint, walkProgress } from './walk'
import type { WalkSession } from './walk'
import { WalkPanel } from './WalkPanel'
import { formatWalkingTime } from './compare'
import { ReportReceived } from './ReportReceived'
import { ResidentAtmosphere } from './ResidentAtmosphere'
import './routing.css'
import './resident-layout.css'
import './royal-amethyst.css'
import './royal-amethyst-ultimate.css'

// Normal app integration agreed by Builder 1 in PR #6, issuecomment-6234657305.
type Commit = (update: (state: WorkflowState) => WorkflowState) => boolean
export function CalculatedResident({ back, openDeveloper, state, commit, notice, pointPhotos }: { back: () => void; openDeveloper?:()=>void; state: WorkflowState; commit: Commit; notice: string; pointPhotos?: PointPhotoController }) {
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
  const completionHeading=useRef<HTMLHeadingElement>(null)
  const [message, setMessage] = useState('')
  const [recenter, setRecenter] = useState(0)
  const [walk,setWalk]=useState<WalkSession|null>(null)
  const [journeyComplete,setJourneyComplete]=useState(false)
  const [reportReceived,setReportReceived]=useState(false)
  const [reportSelectMode,setReportSelectMode]=useState(false)
  useEffect(()=>{if(journeyComplete)completionHeading.current?.focus({preventScroll:true})},[journeyComplete])
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
    try{setJourneyComplete(false);setWalk(beginWalk(calculated,current));setPhotoPoint(null);setSelected('');setOpenForm(false);setRecenter(r=>r+1);setMessage('');requestAnimationFrame(()=>document.querySelector('.resident-walk-panel')?.scrollIntoView({block:'start'}))}
    catch(e){setMessage(e instanceof Error?e.message:'This route cannot start a walkthrough.')}
  }
  function exitWalk(){setWalk(null);setJourneyComplete(false);setPhotoPoint(null);requestAnimationFrame(()=>document.getElementById('resident-route-controls')?.focus({preventScroll:true}))}
  function completeWalk(){setJourneyComplete(true);setPhotoPoint(null)}
  const reportRoute=useMemo(()=>manualReportRoute(current,reportPoints.from,reportPoints.to),[current,reportPoints])
  const chooseNode = (nodeId: string) => {
    if(walk)return
    if(reportSelectMode){
      if(!reportPoints.from||reportPoints.to){setReportPoints({from:nodeId,to:''})}
      else if(nodeId!==reportPoints.from){setReportPoints(p=>({...p,to:nodeId}));setReportSelectMode(false);setPhotoPoint(null);setOpenForm(true)}
      return
    }
    if (endpointSelectMode === 'from') {setFromNode(nodeId);setEndpointSelectMode('to')}
    else setToNode(nodeId)
  }
  const chooseReportPoints=()=>{setPhotoPoint(null);setOpenForm(false);setReportSelectMode(true);setReportPoints({from:'',to:''});requestAnimationFrame(()=>{mapAnchor.current?.scrollIntoView({block:'start'});mapAnchor.current?.querySelector<HTMLElement>('.campus-map-viewport')?.focus({preventScroll:true})})}
  const updateFrom = (value: string) => setFromNode(value)
  const updateTo = (value: string) => setToNode(value)
  return <main className="wf-app resident-app ultimate-resident" data-resident-phase={reportReceived?'report':journeyComplete?'complete':walk?'walk':'plan'} data-route-active={chosen.length>0}>
    <ResidentAtmosphere/>
    <header className="resident-header">
      <svg className="ultimate-header-stream" viewBox="0 0 1600 86" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path className="ultimate-header-stream-base" d="M-80 80 C 145 -28, 335 -8, 530 76 S 1000 4, 1220 58 S 1490 -25, 1690 29"/><path className="ultimate-header-stream-light" d="M-80 80 C 145 -28, 335 -8, 530 76 S 1000 4, 1220 58 S 1490 -25, 1690 29"/></svg>
      <nav className="resident-nav" aria-label="Main navigation"><button type="button" onClick={back}>⌂ <span>Home</span></button><span className="resident-nav-active" aria-current="page">✧ <span>Resident</span></span>{openDeveloper&&<button type="button" onClick={openDeveloper}>▣ <span>Developer</span></button>}<a href="#resident-about">ⓘ <span>About</span></a></nav>
      <div className="resident-header-meta"><span className="chip">DEMO ROUTING</span><span className="resident-dataset">{current.dataset_version}</span></div>
    </header>
    <section className="workspace resident resident-workspace">
      {notice&&<p className="warning" role="alert">{notice}</p>}
      {pointPhotos?.error&&<p className="warning" role="alert">{pointPhotos.error} Bundled reference photos remain available.</p>}
      <div className="resident-layout">
        <div className="resident-map-pane" id="resident-campus-map" ref={mapAnchor} tabIndex={-1}>
          {!walk&&<section className="resident-route-controls" id="resident-route-controls" tabIndex={-1} aria-labelledby="resident-plan-heading">
            <div className="eyebrow">RESIDENT MODE <span className="eyebrow-line"/></div>
            <h1 id="resident-plan-heading">Find a more <em>comfortable walk</em></h1>
            <p className="resident-hero-description">Plan your route, explore shaded walkways, and help improve campus accessibility.</p>
            {reportSelectMode?<div className="report-map-mode" role="status"><strong>Choose affected path on the map</strong><span>{reportPoints.from?`${routePointName(reportPoints.from)} → choose the second point`:'Choose the first point'}</span><button type="button" onClick={()=>setReportSelectMode(false)}>Cancel report selection</button></div>:<>
              <div className="route-endpoint-pickers">
                <label>From<select value={fromNode} onChange={e=>updateFrom(e.target.value)} aria-label="Starting point"><option value="">Choose a starting point</option>{campusRouteNodes.map(node=><option key={node.id} value={node.id}>{campusNodeName(node)}</option>)}</select></label>
                <button type="button" className="swap-route" title="Swap start and destination" aria-label="Swap start and destination" onClick={()=>{setFromNode(toNode);setToNode(fromNode)}}>⇄</button>
                <label>To<select value={toNode} onChange={e=>updateTo(e.target.value)} aria-label="Destination"><option value="">Choose a destination</option>{campusRouteNodes.map(node=><option key={node.id} value={node.id}>{campusNodeName(node)}</option>)}</select></label>
              </div>
              <button type="button" className="resident-primary find-routes" disabled={!comparison} onClick={()=>document.getElementById('resident-route-options')?.scrollIntoView({block:'nearest',behavior:'smooth'})}>Find routes <span aria-hidden="true">→</span></button>
              <div className="map-point-mode" role="group" aria-label="Choose what the next map dot sets"><span>Map click sets</span><button type="button" className={endpointSelectMode==='from'?'point-mode-active':''} aria-pressed={endpointSelectMode==='from'} onClick={()=>{setPhotoPoint(null);setEndpointSelectMode('from')}}>From</button><button type="button" className={endpointSelectMode==='to'?'point-mode-active':''} aria-pressed={endpointSelectMode==='to'} onClick={()=>{setPhotoPoint(null);setEndpointSelectMode('to')}}>To</button></div>
              {fromNode===toNode&&fromNode&&<p className="warning" role="alert">Choose two different points.</p>}
              {message&&<p className="warning" role="alert">{message}</p>}
            </>}
          </section>}
          {walk&&<div className="resident-map-caption"><span className="chip">WALKTHROUGH MODE</span><strong>{fromName} → {toName}</strong><span>Manual progress · {progress?.confirmed} / {progress?.total} points confirmed</span><ol className="resident-journey-rail" aria-label="Walkthrough checkpoints">{walk.route.node_ids.map((id,index)=><li key={id} className={index===progress!.confirmed+1?'is-next':index<=progress!.confirmed?'is-confirmed':'is-later'} aria-current={index===progress!.confirmed+1?'step':undefined}><span className="journey-rail-count" aria-hidden="true">{index===0?'⌂':index<=progress!.confirmed?'✓':index}</span><span>{pointName(id)}</span></li>)}</ol><small>Confirm each point manually. This is not live GPS tracking.</small></div>}
          <MapPanel presentation="resident" walkPosition={progress?{current:progress.current,next:progress.next,confirmed:progress.confirmed}:undefined} photoPoint={photoPoint} onPhotoPointChange={setPhotoPoint} pointPhotos={reportSelectMode?undefined:publishedPhotos} compactDetails segments={walk?.snapshot.segments??current.segments} selected={walk?'':selected} onSelect={id=>{if(!walk){setSelected(id);setEvidenceOpen(true)}}} routeIds={reportSelectMode?[]:chosen} routeNodeIds={reportSelectMode?[]:walk?.route.node_ids??comparison?.[route]?.node_ids??[]} recenter={recenter} fromNode={reportSelectMode?reportPoints.from:fromNode} toNode={reportSelectMode?reportPoints.to:toNode} endpointSelectMode={endpointSelectMode} onNodeSelect={walk?undefined:chooseNode}/>
        </div>
        <div className="resident-sidebar" role="region" aria-label={walk?'Walkthrough':'Route options'}>
          {journeyComplete&&walk?<section className="journey-complete" aria-live="polite"><div className="journey-ring" aria-hidden="true">✓</div><span className="chip">JOURNEY COMPLETE</span><h2 ref={completionHeading} tabIndex={-1}>Beautifully done.</h2><p>You've completed your route walkthrough.</p><div className="journey-route">{fromName} <span>→</span> {toName}</div><div className="journey-stats"><span><strong>{progress?.confirmed} / {progress?.total}</strong>points confirmed</span><span><strong>{walk.route.distance_m} m</strong>illustrative distance</span><span><strong>{formatWalkingTime(walk.route.duration_seconds)}</strong>estimated time</span></div><p className="muted">All route points were manually confirmed in this demo walkthrough. This is not live GPS navigation.</p><div className="wf-actions"><button type="button" className="resident-primary" onClick={()=>setJourneyComplete(false)}>Review completed walkthrough</button><button type="button" className="journey-secondary" onClick={exitWalk}>Back to route selection</button></div></section>
          :walk?<WalkPanel walk={walk} photos={publishedPhotos} currentVersion={current.dataset_version} next={()=>{setPhotoPoint(null);const advanced=advanceWalk(walk);setWalk(advanced);if(walkProgress(advanced).complete)completeWalk()}} previous={()=>{setPhotoPoint(null);setWalk(w=>w?previousWalkPoint(w):w)}} exit={exitWalk} onComplete={completeWalk}/>
          :<div id="resident-route-options" className="resident-route-options"><div className="resident-options-heading"><div><span className="eyebrow">ROUTE INTELLIGENCE</span><h2>Route options</h2></div><a href="#resident-path-evidence">View details ↗</a></div>
            {comparison?<RouteCards compact comparison={comparison} selected={route} onSelect={setRoute} fromLabel={fromName} toLabel={toName}/>:<section className="route-comparison resident-empty-routes" aria-label="Route comparison"><div className="empty-route-orbit" aria-hidden="true">✧</div><h2>Your next walk starts here</h2><p>Choose a start and destination to compare illustrative routes using the current published map.</p><div className="planning-steps" aria-hidden="true"><span>01 · Choose points</span><span>02 · Compare routes</span><span>03 · Start walk</span></div><div className="route-preview-principles"><p><strong>Shortest</strong><span>Fewest illustrative metres through connected points.</span></p><p><strong>Practical shade</strong><span>Lower exposure-ranking cost, if a better path fits the 25% detour cap.</span></p></div><p>Unknown shade remains unknown; neither option is verified navigation.</p></section>}
            <button type="button" className="resident-primary resident-start-walk" disabled={!comparison?.[route]} onClick={startWalk}>Start selected route <span aria-hidden="true">→</span></button>
            {fromNode&&toNode&&fromNode!==toNode&&<details className="resident-route-metadata"><summary>Selected route data</summary><p className="selected-route-status" data-testid="selected-route" role="status" data-route-version={comparison?.dataset_version}>Selected route: {fromName} → {toName} · {route==='shortest'?'Shortest':'Most shaded practical route'} · {chosen.length?chosen.join(' → '):'Unavailable'} · {current.dataset_version}</p></details>}
          </div>}
        </div>
      </div>
      {!walk&&<div className="resident-support-row"><section className="resident-report-panel" aria-label="Report map point selection"><div className="support-icon" aria-hidden="true">!</div><div><span className="eyebrow">CAMPUS CARE</span><h2>Report a walkway problem</h2><p>Choose an affected path, describe the issue, and send it for Developer review.</p><p className="report-selection" data-testid="report-map-selection">Report points: {reportPoints.from?routePointName(reportPoints.from):'Choose first point'} → {reportPoints.to?routePointName(reportPoints.to):'Choose second point'}.</p></div><div className="support-actions"><button type="button" onClick={chooseReportPoints}>Select path on map</button><button type="button" className="resident-primary" onClick={()=>setOpenForm(true)}>Report issue ↗</button></div></section>
        <details id="resident-path-evidence" className="resident-path-evidence" open={evidenceOpen} onToggle={e=>setEvidenceOpen(e.currentTarget.open)}><summary><span className="eyebrow">MAP EVIDENCE</span><strong>Path information{selected?` · ${segment.segment_id}`:''}</strong><small>Inspect shade, source and history</small></summary><SegmentEvidence segment={segment} version={current.dataset_version} state={state} mode="resident" onAction={()=>setOpenForm(true)}/></details></div>}
      <details id="resident-about" className="resident-about"><summary>About this demo and its data</summary><p>Routes, distances, crossings and accessibility are illustrative and unsurveyed; this is not a navigation service. Active walkthroughs keep their selected map version. Unknown shade needs a field survey. Saved state stays in this browser profile.</p></details>
      {openForm&&<RouteReportForm from={reportPoints.from} to={reportPoints.to} route={reportRoute} onChoosePoints={chooseReportPoints} commit={commit} onClose={()=>setOpenForm(false)} onSubmitted={()=>{setOpenForm(false);setReportReceived(true)}}/>}
      {reportReceived&&<ReportReceived onClose={()=>{setReportReceived(false);requestAnimationFrame(()=>document.querySelector<HTMLElement>('.resident-report-panel .resident-primary')?.focus({preventScroll:true}))}}/>}
    </section>
  </main>
}
