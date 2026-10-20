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
import type { PointPhotoController } from '../pointPhotos/usePointPhotos'
import './workflow.css'
import './developer-layout.css'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
const tools = [
  {id:'edit',label:'Edit shade / publish'},
  {id:'reports',label:'Resident reports'},
  {id:'budget',label:'Budget optimiser'},
  {id:'scenario',label:'Simulated scenario'},
  {id:'footfall',label:'Footfall'},
] as const
type Tool = typeof tools[number]['id']

export function DeveloperWorkspace({state,commit,notice,back,pointPhotos}:{state:WorkflowState;commit:Commit;notice:string;back:()=>void;pointPhotos?:PointPhotoController}){
  const [photoPoint,setPhotoPoint]=useState<string|null>(null)
  const [selected,setSelected]=useState(''),[recenter,setRecenter]=useState(0),[tool,setTool]=useState<Tool>('edit')
  const [reportFilter,setReportFilter]=useState<string|undefined>(),[reportPreview,setReportPreview]=useState<ResidentReport|null>(null)
  const [controlsTarget,setControlsTarget]=useState<HTMLDivElement|null>(null),[evidenceOpen,setEvidenceOpen]=useState(false)
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
  const selectedSegment=baseline.segments.find(s=>s.segment_id===selected)??baseline.segments.find(s=>s.segment_id==='DEMO-REF-001')??baseline.segments[0]
  const pending=state.reports.filter(r=>r.review_status==='submitted'||r.review_status==='under_review').length
  function chooseTool(next:Tool){setTool(next);if(next!=='reports')setReportPreview(null);if(next!=='edit')setBaselineChoice('current');if(next==='reports')setReportFilter(undefined);if(scrollPane.current)scrollPane.current.scrollTop=0}
  function tabKeys(e:KeyboardEvent<HTMLButtonElement>,index:number){
    const next=e.key==='ArrowRight'?(index+1)%tools.length:e.key==='ArrowLeft'?(index+tools.length-1)%tools.length:e.key==='Home'?0:e.key==='End'?tools.length-1:null
    if(next===null)return;e.preventDefault();chooseTool(tools[next].id);document.getElementById(`developer-tool-${tools[next].id}`)?.focus()
  }
  function openReports(id?:string){chooseTool('reports');setReportFilter(id)}
  function showReportedRoute(report:ResidentReport){if(!report.route)return;setReportPreview(report);setSelected(report.route.segment_ids[0]);setBaselineChoice('current');setRecenter(r=>r+1)}
  function previewScenario(){chooseTool('scenario')}
  function returnBaseline(){chooseTool('edit')}
  function locatePath(id:string){setSelected(id);setEvidenceOpen(true);setReportPreview(null);setRecenter(r=>r+1)}
  function inspectPath(id:string){setSelected(id);setEvidenceOpen(true)}
  const planningProps={state,commit,plan,error:calculated.error,scenario,preview:previewScenario,baseline:returnBaseline}
  return <main className="wf-app developer-app"><header><button className="link" onClick={back}>← Home</button><div><span className="chip">DEMO PLANNING</span> <span className="chip wf-version">{state.current_version}</span></div></header>
    <section className="workspace developer-workflow"><div className="topbar developer-topbar"><div><div className="eyebrow">DEVELOPER MODE</div><h1>Campus shade workspace</h1><p>Edit the baseline, review reports and explore planning scenarios beside the map.</p></div><div className="wf-actions"><a href="#developer-controls">Open tools</a><a href="#developer-campus-map">View map</a><button onClick={()=>setRecenter(r=>r+1)}>Recenter</button></div></div>
    {notice&&<p role="alert" className="warning">{notice}</p>}
    <div className="developer-layout">
      <div className="developer-map-pane" id="developer-campus-map" tabIndex={-1}>
        <DeveloperMapEditor pointPhotos={pointPhotos?.published??seedPointPhotos} photoPoint={photoPoint} onPhotoPointChange={setPhotoPoint} state={state} commit={commit} controlsTarget={controlsTarget} viewLabel={`${scenarioActive?'SIMULATED / ASSUMPTION':tool==='scenario'?'BASELINE — calculate a plan to preview a scenario':tool==='reports'&&reportPreview?'REPORTED ROUTE — CURRENT PUBLISHED SHADE':tool==='edit'&&baseline.dataset_version===current.dataset_version&&state.map_shade_draft?'DEVELOPER DRAFT PREVIEW — not published to Residents':'BASELINE — PUBLISHED MAP'} · ${scenarioActive?scenario.baseline_version:baseline.dataset_version}${baseline.dataset_version!==current.dataset_version?' · historical; read only':''}`} canEdit={tool==='edit'&&baseline.dataset_version===current.dataset_version} compactDetails segments={mapSegments} selected={selected} onSelect={inspectPath} recenter={recenter} onSelectionChange={setPlanningSelection} candidates={scenarioActive?calculated.result?.items.filter(i=>plan?.ids.includes(i.intervention_id)):[]} scenario={scenarioActive} reports={tool==='scenario'?[]:state.reports} reportPreview={tool==='reports'?reportPreview:null} onCloseReportPreview={()=>setReportPreview(null)}/>
        <details className="developer-path-evidence" open={evidenceOpen} onToggle={e=>setEvidenceOpen(e.currentTarget.open)}><summary>Selected map path evidence</summary>{scenarioActive?<ScenarioEvidence segment={current.segments.find(s=>s.segment_id===selected)??current.segments[0]} scenario={scenario} baseline={returnBaseline}/>:<SegmentEvidence segment={selectedSegment} version={baseline.dataset_version} state={state} mode="developer" historical={baseline.dataset_version!==current.dataset_version} onAction={()=>openReports(selectedSegment.segment_id)}/>}</details>
      </div>
      <aside className="developer-right-pane" id="developer-controls" aria-label="Developer controls" tabIndex={-1}>
        <div className="developer-tool-tabs" role="tablist" aria-label="Developer tools">{tools.map((t,i)=><button key={t.id} id={`developer-tool-${t.id}`} role="tab" aria-selected={tool===t.id} aria-controls={`developer-panel-${t.id}`} tabIndex={tool===t.id?0:-1} onClick={()=>chooseTool(t.id)} onKeyDown={e=>tabKeys(e,i)}><span className="developer-tool-number" aria-hidden="true">0{i+1}</span><span>{t.label}{t.id==='reports'&&<small>{pending} pending</small>}</span></button>)}</div>
        <div className="developer-panel-scroll" ref={scrollPane}>
          <section id="developer-panel-edit" role="tabpanel" aria-labelledby="developer-tool-edit" hidden={tool!=='edit'} tabIndex={0}>
            <div ref={setControlsTarget} className="developer-edit-controls"/>
            {pointPhotos&&<PointPhotoEditor controller={pointPhotos} nodeId={photoPoint} select={setPhotoPoint} enabled={tool==='edit'&&baseline.dataset_version===current.dataset_version}/> }
            <details className="developer-history"><summary>Baseline dataset and publication history</summary><label>Baseline dataset<select aria-label="Baseline dataset" value={baselineChoice} onChange={e=>setBaselineChoice(e.target.value)}><option value="current">Current published dataset — {current.dataset_version}</option>{state.snapshots.filter(s=>s.dataset_version!==current.dataset_version).map(s=><option key={s.dataset_version} value={s.dataset_version}>Historical — {s.dataset_version}</option>)}</select></label><p data-testid="current-dataset-metadata">{currentStudyArea(state).study_area_id} · {currentStudyArea(state).dataset_version} · updated {currentStudyArea(state).updated_at}</p><ol>{state.snapshots.map(s=><li key={s.dataset_version}>{s.dataset_version} · {s.change_summary} · {s.created_at}</li>)}</ol></details>
            <details className="developer-local"><summary>About this local demo</summary><p className="wf-local">Saved only in this browser origin/profile. Changes do not synchronise with another device, browser profile or person. No central database, authentication or institutional approval. Do not enter personal or identifying evidence.</p></details>
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
    </section>
  </main>
}
