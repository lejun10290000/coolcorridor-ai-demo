import { useMemo, useRef, useState } from 'react'
import { DeveloperMapEditor } from './DeveloperMapEditor'
import { footfall } from '../fixtures'
import { hourlyEquivalent, priorities } from '../domain'
import { buildScenario, currentSnapshot, currentStudyArea } from './model'
import { calculatePlanning, planningWorkspace } from './planning'
import { PlanningPanels } from './PlanningPanels'
import { FootfallPlanningPanels } from './FootfallPlanningPanels'
import { calculateFootfallPlanning, footfallPlanningWorkspace, setPlanningMode } from './footfallPlanning'
import { ScenarioEvidence } from './ScenarioEvidence'
import type { WorkflowState } from './model'
import type { ResidentReport } from '../types'
import { SegmentEvidence } from './SegmentEvidence'
import { ReportReview } from './ReportReview'
import './workflow.css'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
export function DeveloperWorkspace({state,commit,notice,back}:{state:WorkflowState;commit:Commit;notice:string;back:()=>void}){
  const [selected,setSelected]=useState(''),[recenter,setRecenter]=useState(0),[showReports,setShowReports]=useState(true)
  const [reportFilter,setReportFilter]=useState<string|undefined>(),[reportPreview,setReportPreview]=useState<ResidentReport|null>(null)
  const reportsAnchor=useRef<HTMLDivElement>(null),mapAnchor=useRef<HTMLDivElement>(null)
  const [planningSelection,setPlanningSelection]=useState<string[]>([])
  const [view,setView]=useState<'baseline'|'scenario'>('baseline'),[baselineChoice,setBaselineChoice]=useState('current')
  const current=currentSnapshot(state),baseline=baselineChoice==='current'?current:state.snapshots.find(s=>s.dataset_version===baselineChoice)??current
  const planningMethod=state.planning_mode??'footfall'
  const calculated=useMemo(()=>{
    if(!(planningMethod==='footfall'?footfallPlanningWorkspace(state):planningWorkspace(state)).has_calculated)return {result:null,error:''}
    try{return {result:planningMethod==='footfall'?calculateFootfallPlanning(state):calculatePlanning(state),error:''}}catch(e){return {result:null,error:e instanceof Error?e.message:'Invalid planning inputs.'}}
  },[state,planningMethod])
  const plan=calculated.result?.plan??null
  const scenario=calculated.result?.scenario??buildScenario(current,[],[],{})
  const scenarioActive=view==='scenario'&&plan!==null
  const mapSegments=scenarioActive?scenario.segments:baseline.segments
  const selectedSegment=baseline.segments.find(s=>s.segment_id===selected) ?? baseline.segments.find(s=>s.segment_id==='DEMO-REF-001') ?? baseline.segments[0]
  const ps=priorities(baseline.segments,Object.fromEntries(footfall.map(f=>[f.segment_id,f.passes_per_hour_equivalent])))
  function openReports(id?:string){setReportFilter(id);setShowReports(true);requestAnimationFrame(()=>reportsAnchor.current?.scrollIntoView({block:'start'}))}
  function showReportedRoute(report:ResidentReport){if(!report.route)return;setReportPreview(report);setSelected(report.route.segment_ids[0]);setBaselineChoice('current');setView('baseline');requestAnimationFrame(()=>mapAnchor.current?.querySelector('.campus-map')?.scrollIntoView({block:'start'}))}
  function previewScenario(){setBaselineChoice('current');setReportPreview(null);setView('scenario');requestAnimationFrame(()=>mapAnchor.current?.scrollIntoView({block:'start'}))}
  function locatePath(id:string){setSelected(id);setView('baseline');setBaselineChoice('current');setReportPreview(null);setRecenter(r=>r+1);requestAnimationFrame(()=>mapAnchor.current?.querySelector('.campus-map')?.scrollIntoView({block:'start'}))}
  return <main className="wf-app"><header><button className="link" onClick={back}>← Home</button><div><span className="chip">DEMO PLANNING</span> <span className="chip wf-version">{state.current_version}</span></div></header>
    <section className="workspace developer-workflow"><div className="topbar"><div><div className="eyebrow">DEVELOPER MODE</div><h1>Shade planning and published evidence</h1><p>Update route shade manually, publish changes to Residents, and review reported problems in this local browser prototype.</p></div><div className="wf-actions"><button onClick={()=>openReports()}>Review Resident reports ({state.reports.filter(r=>r.review_status==='submitted'||r.review_status==='under_review').length} pending)</button><button onClick={()=>setRecenter(r=>r+1)}>Recenter</button></div></div>
    <p className="wf-local">Saved only in this browser origin/profile. Changes do not synchronise with another device, browser profile or person. No central database, authentication or institutional approval. Do not enter personal or identifying evidence.</p>{notice&&<p role="alert" className="warning">{notice}</p>}
    <details><summary>Current local study area and snapshot history</summary><p data-testid="current-dataset-metadata">{currentStudyArea(state).study_area_id} · {currentStudyArea(state).dataset_version} · updated {currentStudyArea(state).updated_at}</p><ol>{state.snapshots.map(s=><li key={s.dataset_version}>{s.dataset_version} · {s.change_summary} · {s.created_at}</li>)}</ol></details>
    <section className="wf-panel" aria-label="Planning configuration"><label>Planning method<select aria-label="Planning method" value={planningMethod} onChange={e=>{if(commit(s=>setPlanningMode(s,e.target.value as 'footfall'|'manual')))setView('baseline')}}><option value="footfall">Top 10 demo footfall paths — trees or roof</option><option value="manual">Manual candidate planning (saved proposals)</option></select></label><p>Footfall planning uses current map links and fictional passage counts. Manual planning retains your earlier proposal settings separately.</p></section>
    <section className="wf-map-controls" aria-label="Map comparison view"><div className="wf-actions"><button aria-pressed={!scenarioActive} onClick={()=>setView('baseline')}>Baseline</button><button aria-pressed={scenarioActive} disabled={!plan} onClick={previewScenario}>Simulated scenario</button></div><label>Baseline dataset<select aria-label="Baseline dataset" disabled={scenarioActive} value={scenarioActive?'current':baselineChoice} onChange={e=>{setBaselineChoice(e.target.value);setView('baseline')}}><option value="current">Current published dataset — {current.dataset_version}</option>{state.snapshots.filter(s=>s.dataset_version!==current.dataset_version).map(s=><option key={s.dataset_version} value={s.dataset_version}>Historical — {s.dataset_version}</option>)}</select></label>
    <p data-testid="map-view">{scenarioActive?'SIMULATED / ASSUMPTION':'BASELINE'} · {scenarioActive?scenario.baseline_version:baseline.dataset_version}{baseline.dataset_version!==current.dataset_version?' · historical view; current published dataset is unchanged':''}</p>{scenarioActive&&<p className="warning">Hypothetical shade overlay on the latest published map. Resident routing and published evidence remain unchanged. Explicit projections are listed below.</p>}</section>
    <div className="main-grid"><div ref={mapAnchor}><DeveloperMapEditor state={state} commit={commit} canEdit={!scenarioActive&&baseline.dataset_version===current.dataset_version} segments={mapSegments} selected={selected} onSelect={setSelected} recenter={recenter} onSelectionChange={setPlanningSelection} candidates={scenarioActive?calculated.result?.items.filter(i=>plan?.ids.includes(i.intervention_id)):[]} scenario={scenarioActive} reports={state.reports} reportPreview={!scenarioActive&&baselineChoice==='current'?reportPreview:null} onCloseReportPreview={()=>setReportPreview(null)}/><p className="legend">Campus illustration and pixel paths are unverified. Baseline editing, Resident report review and hypothetical scenarios use separate controls. Fictional DEMO footfall is available in the inspector and priority evidence below.</p></div>{scenarioActive?<ScenarioEvidence segment={current.segments.find(s=>s.segment_id===selected)??current.segments.find(s=>s.segment_id==='DEMO-REF-001')??current.segments[0]} scenario={scenario} baseline={()=>setView('baseline')}/>:<SegmentEvidence segment={selectedSegment} version={baseline.dataset_version} state={state} mode="developer" historical={baseline.dataset_version!==current.dataset_version} onAction={()=>openReports(selectedSegment.segment_id)}/>}</div>
    <div ref={reportsAnchor}>{showReports&&<ReportReview state={state} segmentId={reportFilter} commit={commit} onClose={()=>setShowReports(false)} onShowRoute={showReportedRoute} onAccepted={showReportedRoute}/>}</div>
    {planningMethod==='footfall'?<FootfallPlanningPanels state={state} commit={commit} plan={plan} error={calculated.error} scenario={scenario} preview={previewScenario} baseline={()=>setView('baseline')} locate={locatePath}/>:<PlanningPanels state={state} commit={commit} plan={plan} error={calculated.error} scenario={scenario} selection={planningSelection} preview={previewScenario} baseline={()=>setView('baseline')}/>}
    {planningMethod==='manual'&&<section className="wf-panel"><h2>Explainable priority evidence</h2><p>DEMO proxy: passage-rate equivalent × estimated exposed length. Passage counts and lengths remain illustrative fixtures; unknown demand/shade is not zero. This is not a health/cooling outcome.</p><div className="wf-priorities">{ps.map(p=><button key={p.segment_id} className="priority" onClick={()=>setSelected(p.segment_id)}><b>{p.segment_id}</b><span>{p.score===null?'NEEDS SURVEY':`${p.score.toLocaleString()} DEMO exposure-demand proxy`}</span><small>{p.reason}</small></button>)}</div><p>DEMO hourly-equivalent example: 18 passage events ÷ 15 minutes × 60 = {hourlyEquivalent(18,15)} passage events/hour equivalent. This is not all-day traffic or unique people.</p></section>}
    </section>
  </main>
}
