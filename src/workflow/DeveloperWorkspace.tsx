import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { DeveloperMapEditor } from './DeveloperMapEditor'
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
import { seedPointPhotos } from '../pointPhotos/catalog'
import { PointPhotoEditor } from '../pointPhotos/PointPhotoEditor'
import { ResidentAtmosphere } from '../routing/ResidentAtmosphere'
import type { PointPhotoController } from '../pointPhotos/usePointPhotos'
import './workflow.css'
import './developer-layout.css'
import './developer-ultimate.css'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
const tools = [
  {id:'edit',label:'Edit shade / publish'},
  {id:'reports',label:'Resident reports'},
  {id:'budget',label:'Budget optimiser'},
  {id:'scenario',label:'Simulated scenario'},
  {id:'footfall',label:'Footfall'},
] as const
type Tool = typeof tools[number]['id']
const toolGuidance:Record<Tool,{title:string;description:string}>={
  edit:{title:'Select → Apply to draft → Review & publish',description:'Draft edits stay private until you publish. The Resident map keeps the last published version.'},
  reports:{title:'Find a report, then review its exact path',description:'Use status filters to focus on pending issues. Acceptance changes shade; it does not confirm a repair.'},
  budget:{title:'Set a budget and compare eligible proposals',description:'Optimise once to see a plan. Later price and budget edits recalculate it automatically.'},
  scenario:{title:'Preview your plan without publishing',description:'Explore hypothetical shade. Return to Edit shade to make an actual map publication.'},
  footfall:{title:'Inspect demand before choosing an intervention',description:'These passage counts are fictional demo records. Use the map links to inspect each candidate path.'},
}

export function DeveloperWorkspace({state,commit,notice,back,openResident,pointPhotos}:{state:WorkflowState;commit:Commit;notice:string;back:()=>void;openResident?:()=>void;pointPhotos?:PointPhotoController}){
  const [photoPoint,setPhotoPoint]=useState<string|null>(null)
  const [selected,setSelected]=useState(''),[recenter,setRecenter]=useState(0),[tool,setTool]=useState<Tool>('edit')
  const [reportFilter,setReportFilter]=useState<string|undefined>(),[reportPreview,setReportPreview]=useState<ResidentReport|null>(null)
  const [controlsTarget,setControlsTarget]=useState<HTMLDivElement|null>(null)
  const scrollPane=useRef<HTMLDivElement>(null)
  const [planningSelection,setPlanningSelection]=useState<string[]>([]),[baselineChoice,setBaselineChoice]=useState('current')
  const current=currentSnapshot(state),baseline=tool==='edit'&&baselineChoice!=='current'?state.snapshots.find(s=>s.dataset_version===baselineChoice)??current:current
  const planningMethod=state.planning_mode??'footfall'
  const calculated=useMemo(()=>{
    if(!(planningMethod==='footfall'?footfallPlanningWorkspace(state):planningWorkspace(state)).has_calculated)return {result:null,error:''}
    try{return {result:planningMethod==='footfall'?calculateFootfallPlanning(state):calculatePlanning(state),error:''}}catch(e){return {result:null,error:e instanceof Error?e.message:'Invalid planning inputs.'}}
  },[state,planningMethod])
  const plan=calculated.result?.plan??null
  const scenario=calculated.result?.scenario??buildScenario(current,[],[],{})
  const scenarioActive=tool==='scenario'&&plan!==null
  const mapSegments=scenarioActive?scenario.segments:baseline.segments
  const selectedSegment=baseline.segments.find(s=>s.segment_id===selected)
  const pending=state.reports.filter(r=>r.review_status==='submitted'||r.review_status==='under_review').length
  function chooseTool(next:Tool){setTool(next);if(next!=='reports')setReportPreview(null);if(next!=='edit')setBaselineChoice('current');if(next==='reports')setReportFilter(undefined);if(scrollPane.current)scrollPane.current.scrollTop=0}
  function tabKeys(e:KeyboardEvent<HTMLButtonElement>,index:number){
    const next=e.key==='ArrowRight'?(index+1)%tools.length:e.key==='ArrowLeft'?(index+tools.length-1)%tools.length:e.key==='Home'?0:e.key==='End'?tools.length-1:null
    if(next===null)return;e.preventDefault();chooseTool(tools[next].id);document.getElementById(`developer-tool-${tools[next].id}`)?.focus()
  }
  function openReports(id?:string){chooseTool('reports');setReportFilter(id);showArea('developer-controls')}
  function showArea(id:string){requestAnimationFrame(()=>{const target=document.getElementById(id);target?.scrollIntoView({block:'start'});target?.focus({preventScroll:true})})}
  function showReportedRoute(report:ResidentReport){if(!report.route)return;setReportPreview(report);setSelected(report.route.segment_ids[0]);setBaselineChoice('current');setRecenter(r=>r+1);showArea('developer-campus-map')}
  function previewScenario(){chooseTool('scenario');showArea('developer-campus-map')}
  function returnBaseline(){chooseTool('edit');showArea('developer-campus-map')}
  function locatePath(id:string){setSelected(id);setReportPreview(null);setRecenter(r=>r+1);showArea('developer-campus-map')}
  function inspectPath(id:string){setSelected(id)}
  const planningProps={state,commit,plan,error:calculated.error,scenario,preview:previewScenario,baseline:returnBaseline}
  return <main className="wf-app developer-app developer-ultimate"><ResidentAtmosphere/>
    <header className="developer-header"><span className="developer-header-space" aria-hidden="true"/><nav className="developer-nav" aria-label="Main navigation"><button type="button" onClick={back}>⌂ <span>Home</span></button>{openResident&&<button type="button" onClick={openResident}>✧ <span>Resident</span></button>}<span className="developer-nav-active" aria-current="page">▣ <span>Developer</span></span></nav><div className="developer-header-meta"><span className="chip">DEMO PLANNING</span><span className="developer-dataset">{state.current_version}</span></div></header>
    <section className="workspace developer-workflow">
    {notice&&<p role="alert" className="warning">{notice}</p>}
    <nav className="workspace-jumps" aria-label="Developer workspace shortcuts"><span>Jump to</span><a href="#developer-campus-map">Campus map</a><a href="#developer-controls">Planning tools</a><a href="#developer-map-evidence">Path evidence</a></nav>
    <div className="developer-layout">
      <div className="topbar developer-topbar">
        <div className="developer-intro-content"><div className="eyebrow">DEVELOPER MODE <span className="developer-eyebrow-line"/></div><h1>Plan, test and <em>optimise cooler routes</em></h1><p>Review reports, refine map shade and test planning scenarios.</p></div>
        <section id="developer-map-evidence" className={`developer-path-evidence ${selectedSegment?'developer-evidence-selected':'developer-evidence-empty'}`} aria-label="Map evidence" tabIndex={0}>
          <div className="developer-evidence-heading"><span className="eyebrow">MAP EVIDENCE</span><div className="developer-evidence-controls"><span className="developer-evidence-status" title={selectedSegment?'Updates with the selected segment; not live field measurements.':undefined}>{selectedSegment?'Selected path':'Ready to inspect'}</span>{selectedSegment&&<button type="button" className="developer-evidence-reset" aria-label="Reset Map Evidence inspection" onClick={()=>setSelected('')}><span aria-hidden="true">↶</span> Reset</button>}</div></div>
          <div className="developer-evidence-state" key={selectedSegment?.segment_id??'empty'}>
            {selectedSegment?(scenarioActive?<ScenarioEvidence segment={current.segments.find(s=>s.segment_id===selected)??selectedSegment} scenario={scenario} baseline={returnBaseline}/>:<SegmentEvidence segment={selectedSegment} version={baseline.dataset_version} state={state} mode="developer" historical={baseline.dataset_version!==current.dataset_version} onAction={()=>openReports(selectedSegment.segment_id)}/>):<DeveloperEvidenceEmpty/>}
          </div>
        </section>
      </div>
      <div className="developer-map-pane" id="developer-campus-map" tabIndex={-1}>
        <DeveloperMapEditor pointPhotos={pointPhotos?.published??seedPointPhotos} photoPoint={photoPoint} onPhotoPointChange={setPhotoPoint} state={state} commit={commit} controlsTarget={controlsTarget} viewLabel={`${scenarioActive?'SIMULATED / ASSUMPTION':tool==='scenario'?'BASELINE — calculate a plan to preview a scenario':tool==='reports'&&reportPreview?'REPORTED ROUTE — CURRENT PUBLISHED SHADE':tool==='edit'&&baseline.dataset_version===current.dataset_version&&state.map_shade_draft?'DEVELOPER DRAFT PREVIEW — not published to Residents':'BASELINE — PUBLISHED MAP'} · ${scenarioActive?scenario.baseline_version:baseline.dataset_version}${baseline.dataset_version!==current.dataset_version?' · historical; read only':''}`} canEdit={tool==='edit'&&baseline.dataset_version===current.dataset_version} compactDetails segments={mapSegments} selected={selected} onSelect={inspectPath} recenter={recenter} onSelectionChange={setPlanningSelection} candidates={scenarioActive?calculated.result?.items.filter(i=>plan?.ids.includes(i.intervention_id)):[]} scenario={scenarioActive} reports={tool==='scenario'?[]:state.reports} reportPreview={tool==='reports'?reportPreview:null} onCloseReportPreview={()=>setReportPreview(null)}/>
      </div>
      <aside className="developer-right-pane" id="developer-controls" aria-label="Developer controls" tabIndex={-1}>
        <div className="developer-tool-tabs" role="tablist" aria-label="Developer tools">{tools.map((t,i)=><button key={t.id} id={`developer-tool-${t.id}`} role="tab" aria-selected={tool===t.id} aria-controls={`developer-panel-${t.id}`} tabIndex={tool===t.id?0:-1} onClick={()=>chooseTool(t.id)} onKeyDown={e=>tabKeys(e,i)}><span className="developer-tool-number" aria-hidden="true">0{i+1}</span><span>{t.label}{t.id==='reports'&&<small>{pending} pending</small>}</span></button>)}</div>
        <div className="developer-task-guide" role="status"><strong>{toolGuidance[tool].title}</strong><p>{toolGuidance[tool].description}</p></div>
        <div className="developer-panel-scroll" ref={scrollPane} role="region" tabIndex={0} aria-label="Scrollable Developer tool content">
          <section id="developer-panel-edit" role="tabpanel" aria-labelledby="developer-tool-edit" hidden={tool!=='edit'} tabIndex={0}>
            <div ref={setControlsTarget} className="developer-edit-controls"/>
            {pointPhotos&&<PointPhotoEditor controller={pointPhotos} nodeId={photoPoint} select={setPhotoPoint} enabled={tool==='edit'&&baseline.dataset_version===current.dataset_version}/> }
            <details className="developer-history"><summary><span className="disclosure-title">Baseline dataset and publication history</span><small>Compare the published map with earlier versions</small></summary><label>Baseline dataset<select aria-label="Baseline dataset" value={baselineChoice} onChange={e=>setBaselineChoice(e.target.value)}><option value="current">Current published dataset — {current.dataset_version}</option>{state.snapshots.filter(s=>s.dataset_version!==current.dataset_version).map(s=><option key={s.dataset_version} value={s.dataset_version}>Historical — {s.dataset_version}</option>)}</select></label><p data-testid="current-dataset-metadata">{currentStudyArea(state).study_area_id} · {currentStudyArea(state).dataset_version} · updated {currentStudyArea(state).updated_at}</p><ol>{state.snapshots.map(s=><li key={s.dataset_version}>{s.dataset_version} · {s.change_summary} · {s.created_at}</li>)}</ol></details>
            <details className="developer-local"><summary><span className="disclosure-title">About this local demo</span><small>How saving and sharing work in this prototype</small></summary><p className="wf-local">Saved only in this browser origin/profile. Changes do not synchronise with another device, browser profile or person. No central database, authentication or institutional approval. Do not enter personal or identifying evidence.</p></details>
          </section>
          <section id="developer-panel-reports" role="tabpanel" aria-labelledby="developer-tool-reports" hidden={tool!=='reports'} tabIndex={0}>
            {reportFilter&&<button onClick={()=>setReportFilter(undefined)}>Show all Resident reports</button>}
            <ReportReview state={state} segmentId={reportFilter} commit={commit} onClose={returnBaseline} onShowRoute={showReportedRoute} onAccepted={showReportedRoute}/>
          </section>
          <section id="developer-panel-budget" role="tabpanel" aria-labelledby="developer-tool-budget" hidden={tool!=='budget'} tabIndex={0}>
            <details className="developer-planning-configuration"><summary>Planning method · {planningMethod==='footfall'?'Top 10 footfall paths':'Manual candidates'}</summary><label>Planning method<select aria-label="Planning method" value={planningMethod} onChange={e=>commit(s=>setPlanningMode(s,e.target.value as 'footfall'|'manual'))}><option value="footfall">Top 10 demo footfall paths — trees or roof</option><option value="manual">Manual candidate planning (saved proposals)</option></select></label><p>Footfall planning uses fictional counts. Earlier manual proposals are saved separately. Select map paths in Edit shade before assigning them to a manual proposal.</p></details>
            {planningMethod==='footfall'?<FootfallPlanningPanels {...planningProps} panel="budget" locate={locatePath}/>:<PlanningPanels {...planningProps} panel="budget" selection={planningSelection}/>}
          </section>
          <section id="developer-panel-scenario" role="tabpanel" aria-labelledby="developer-tool-scenario" hidden={tool!=='scenario'} tabIndex={0}>
            <p className="warning">Hypothetical shade on the latest published baseline. This does not publish to Residents. Developer drafts and report markers are excluded.</p>
            {!plan&&<button onClick={()=>chooseTool('budget')}>Open budget optimiser</button>}
            {planningMethod==='footfall'?<FootfallPlanningPanels {...planningProps} panel="scenario" locate={locatePath}/>:<PlanningPanels {...planningProps} panel="scenario" selection={planningSelection}/>}
          </section>
          <section id="developer-panel-footfall" role="tabpanel" aria-labelledby="developer-tool-footfall" hidden={tool!=='footfall'} tabIndex={0}>
            <FootfallPlanningPanels {...planningProps} panel="footfall" locate={locatePath}/>
          </section>
        </div>
      </aside>
    </div>
    <div className="developer-support-row"><section className="developer-publication-summary" aria-label="Published dataset and review status"><span className="eyebrow">PUBLICATION STATE</span><h2>What Residents currently see</h2><p className="developer-current-version">{current.dataset_version}</p><div className="developer-status-grid"><span><b>{pending}</b> pending reports</span><span><b>{state.map_shade_draft?.assignments.length??0}</b> draft links</span></div><p>Drafts and simulations are not published. The current Resident map changes only after the existing review and publication workflow.</p><button type="button" onClick={()=>{chooseTool('edit');showArea('developer-controls')}}>Open publication workflow ↗</button></section></div>
    <details className="developer-about" id="developer-about"><summary>About this demo and its data</summary><p>This is a local illustrative planning workspace. Campus paths remain unsurveyed; fictional footfall, assumed prices and simulated shade are labelled in their tools. Nothing here represents a construction approval or live measurement.</p></details>
    </section>
  </main>
}

function DeveloperEvidenceEmpty(){
  return <div className="developer-evidence-welcome">
    <div className="developer-evidence-welcome-main">
      <div className="developer-inspection-emblem" aria-hidden="true">
        <span className="developer-emblem-aura"/><span className="developer-emblem-ring developer-emblem-ring-outer"/><span className="developer-emblem-ring developer-emblem-ring-inner"/>
        <span className="developer-emblem-orbit developer-emblem-orbit-one"/><span className="developer-emblem-orbit developer-emblem-orbit-two"/>
        <span className="developer-emblem-core"><svg viewBox="0 0 48 48" fill="none"><path d="M24 42s13-12.1 13-23a13 13 0 0 0-26 0c0 10.9 13 23 13 23Z" fill="currentColor"/><circle cx="24" cy="19" r="5.3" fill="#47216d"/></svg></span>
      </div>
      <h2>Explore path intelligence</h2>
      <p>Select a walkway segment on the campus map to reveal its shade classification, source, history and supporting evidence.</p>
      <div className="developer-evidence-hint"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 2 2.8 16 3.6-4 4.4 6 2.8-2-4.4-6 5.4-.5L4 2Z" fill="currentColor"/></svg><span>Select a path to begin</span></div>
    </div>
    <small>Illustrative campus data · Not field-verified</small>
  </div>
}
