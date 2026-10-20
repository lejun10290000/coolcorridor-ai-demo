import { useState } from 'react'
import { malaysiaNow, reportsForSegment, reviewReport } from './model'
import type { WorkflowState } from './model'
import type { ResidentReport } from '../types'
import { newestReportsFirst } from './reportOrdering'
import { acceptRouteReport, reportedRouteLabel } from './routeReports'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
function ReportRecord({report,commit,onShowRoute,onAccepted}:{report:ResidentReport;commit:Commit;onShowRoute?:(r:ResidentReport)=>void;onAccepted?:(r:ResidentReport)=>void}){
  const [reviewer,setReviewer]=useState('Demo reviewer'),[note,setNote]=useState('')
  const [message,setMessage]=useState('')
  const canReview=report.review_status==='submitted'||report.review_status==='under_review'
  const status=report.route&&report.review_status==='verified'?'Accepted':report.review_status==='submitted'?'Pending review':report.review_status.replace('_',' ')
  return <article className="wf-record" data-report-id={report.report_id} data-report-status={report.review_status}><h3>{report.report_id} · {status}</h3><p><b>{report.route?reportedRouteLabel(report.route):`Legacy single-link report: ${report.segment_id}`}</b> · {report.category}</p><p>Created: {report.created_at} · DEMO report (not footfall)</p><p className="wf-report-description">{report.comment_optional||'No comment'}</p>{report.review_note&&<p>Latest reviewer note: {report.review_note}</p>}
    {report.route&&<><p>{report.route.selection_source==='map_points'?'Manual map-point selection':`Saved ${report.route.objective==='shortest'?'shortest':'most shaded practical'} path`} · {report.route.segment_ids.length} links · source dataset {report.route.dataset_version}</p><details><summary>Exact reported path links</summary><p>{report.route.segment_ids.join(' → ')}</p></details>{onShowRoute&&<button type="button" onClick={()=>onShowRoute(report)}>Show reported route on map</button>}</>}
    {report.accepted_publication_id&&<p className="warning">Accepted and marked yellow/mixed shade in {report.accepted_publication_id}. After repairs, select these links in Edit map shade and publish a manual update. Accepting does not mark the route repaired; later manual publications may change its current colour.</p>}
    {message&&<p role="status" className="success">{message}</p>}
    {canReview&&<><label>Report reviewer label — {report.report_id}<input value={reviewer} maxLength={100} onChange={e=>setReviewer(e.target.value)}/></label><label>Report review note — {report.report_id}<textarea aria-label={`Report review note — ${report.report_id}`} value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label><div className="wf-actions">
      {report.route?<button disabled={!reviewer.trim()||!note.trim()} onClick={()=>{if(commit(s=>acceptRouteReport(s,report.report_id,reviewer,note,malaysiaNow()))){setMessage('Accepted. The saved route is now yellow/mixed shade in both modes. Update it manually after repair.');onAccepted?.(report)}}}>Accept report</button>:report.review_status==='submitted'?<button onClick={()=>commit(s=>reviewReport(s,report.report_id,'under_review',reviewer,note,malaysiaNow()))}>Start report review</button>:<button onClick={()=>commit(s=>reviewReport(s,report.report_id,'verified',reviewer,note,malaysiaNow()))}>Verify legacy report</button>}
      <button disabled={!reviewer.trim()||!note.trim()} onClick={()=>{if(commit(s=>reviewReport(s,report.report_id,'rejected',reviewer,note,malaysiaNow())))setMessage('Report rejected. Map shade is unchanged.')}}>Reject report</button>
    </div></>}
  </article>
}
export function ReportReview({state,segmentId,commit,onClose,onShowRoute,onAccepted}:{state:WorkflowState;segmentId?:string;commit:Commit;onClose:()=>void;onShowRoute?:(r:ResidentReport)=>void;onAccepted?:(r:ResidentReport)=>void}){
  const reports=newestReportsFirst(segmentId?reportsForSegment(state.reports,segmentId):state.reports)
  return <section className="wf-panel wf-report-inbox" aria-label={segmentId?'Reports for selected segment':'Resident report inbox'}><div className="wf-section-heading"><h2>{segmentId?`Reports for ${segmentId}`:'Resident route reports'}</h2><button onClick={onClose}>Close reports</button></div><p>Review the saved path and problem description. Accepting a valid route report immediately publishes yellow/mixed shade for all its saved links in both modes. Rejection leaves map shade unchanged. Repairs require a separate manual map update.</p>
    <p className="wf-report-order">Newest reports first · {reports.length} {reports.length===1?'report':'reports'}</p>
    {reports.length?reports.map(r=><ReportRecord key={r.report_id} report={r} commit={commit} onShowRoute={onShowRoute} onAccepted={onAccepted}/>):<p>{segmentId?'No reports for this segment.':'No Resident reports yet.'}</p>}
    <details><summary>Report review history{segmentId?` for ${segmentId}`:''}</summary>{state.report_events.filter(e=>reports.some(r=>r.report_id===e.report_id)).map(e=><p key={e.event_id}>{e.report_id}: {e.from_status} → {e.to_status} · {e.reviewer_label} · {e.timestamp}<br/>{e.note}</p>)}</details>
  </section>
}
