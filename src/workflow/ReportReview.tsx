import { useState } from 'react'
import { malaysiaNow, reportsForSegment, reviewReport } from './model'
import type { WorkflowState } from './model'
import type { ResidentReport } from '../types'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
function ReportRecord({report,commit}:{report:ResidentReport;commit:Commit}){
  const [reviewer,setReviewer]=useState('Demo reviewer'),[note,setNote]=useState('')
  const canReview=report.review_status==='submitted'||report.review_status==='under_review'
  return <article className="wf-record" data-report-id={report.report_id}><h3>{report.report_id}</h3><p>{report.segment_id} · {report.category} · <b>{report.review_status}</b></p><p>Created: {report.created_at} · DEMO report (not footfall)</p><p>{report.comment_optional||'No comment'}</p>{report.review_note&&<p>Latest reviewer note: {report.review_note}</p>}
    {canReview&&<><label>Report reviewer label — {report.report_id}<input value={reviewer} maxLength={100} onChange={e=>setReviewer(e.target.value)}/></label><label>Report review note — {report.report_id}<textarea value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label><div className="wf-actions">
      {report.review_status==='submitted'?<button onClick={()=>commit(s=>reviewReport(s,report.report_id,'under_review',reviewer,note,malaysiaNow()))}>Start report review</button>:<button onClick={()=>commit(s=>reviewReport(s,report.report_id,'verified',reviewer,note,malaysiaNow()))}>Verify report</button>}
      <button onClick={()=>commit(s=>reviewReport(s,report.report_id,'rejected',reviewer,note,malaysiaNow()))}>Reject report</button>
    </div></>}
  </article>
}
export function ReportReview({state,segmentId,commit,onClose}:{state:WorkflowState;segmentId:string;commit:Commit;onClose:()=>void}){
  const reports=reportsForSegment(state.reports,segmentId)
  return <section className="wf-panel" aria-label="Reports for selected segment"><div className="wf-section-heading"><h2>Reports for {segmentId}</h2><button onClick={onClose}>Close reports</button></div><p>Submitted reports require a distinct review before verification. Rejected/verified reports are final in this prototype.</p>
    {reports.length?reports.map(r=><ReportRecord key={r.report_id} report={r} commit={commit}/>):<p>No reports for this segment.</p>}
    <details><summary>Report review history for {segmentId}</summary>{state.report_events.filter(e=>reports.some(r=>r.report_id===e.report_id)).map(e=><p key={e.event_id}>{e.report_id}: {e.from_status} → {e.to_status} · {e.reviewer_label} · {e.timestamp}<br/>{e.note}</p>)}</details>
  </section>
}
