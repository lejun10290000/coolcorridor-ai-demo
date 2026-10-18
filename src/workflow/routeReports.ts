import { campusNodeName, campusRouteNodes } from '../campusWalkways'
import { compareRoutes } from '../routing/compare'
import { campusWideGraph } from '../routing/graph'
import type { ReportedRoute, ResidentReport } from '../types'
import { reviewReport, validLocalTime } from './model'
import type { DatasetSnapshot, WorkflowState } from './model'
import { publishMapShadeAssignments } from './mapShade'

export const routeReportCategories=['broken shade structure','no shade','too hot at a stated time','blocked walkway','unsafe crossing','other']
const text=(s:unknown):s is string=>typeof s==='string'&&s.trim().length>0&&s.length<=2000
function requireValue(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(message)}
export function routePointName(id:string){const node=campusRouteNodes.find(n=>n.id===id);return node?campusNodeName(node):id}
export function reportedRouteLabel(route:ReportedRoute){return `${routePointName(route.from_node)} → ${routePointName(route.to_node)}`}
/** Reports connect only the independently captured map clicks, never the active routing card. */
export function manualReportRoute(snapshot:DatasetSnapshot,from:string,to:string):ReportedRoute|null {
  if(!from||!to||from===to||!campusRouteNodes.some(n=>n.id===from)||!campusRouteNodes.some(n=>n.id===to))return null
  const path=compareRoutes(snapshot,campusWideGraph,from,to).shortest
  return path?{from_node:from,to_node:to,objective:'shortest',segment_ids:[...path.segment_ids],node_ids:[...path.node_ids],dataset_version:path.dataset_version,selection_source:'map_points'}:null
}
export function validReportedRoute(state:WorkflowState,route:ReportedRoute):boolean {
  if(!route||typeof route!=='object'||!['shortest','exposure'].includes(route.objective)||!campusRouteNodes.some(n=>n.id===route.from_node)||!campusRouteNodes.some(n=>n.id===route.to_node)||route.from_node===route.to_node||!Array.isArray(route.segment_ids)||!Array.isArray(route.node_ids))return false
  if(route.selection_source!==undefined&&(route.selection_source!=='map_points'||route.objective!=='shortest'))return false
  const snapshot=state.snapshots.find(s=>s.dataset_version===route.dataset_version)
  if(!snapshot)return false
  const path=compareRoutes(snapshot,campusWideGraph,route.from_node,route.to_node)[route.objective]
  return !!path&&JSON.stringify(path.segment_ids)===JSON.stringify(route.segment_ids)&&JSON.stringify(path.node_ids)===JSON.stringify(route.node_ids)
}
export function submitRouteReport(state:WorkflowState,input:{route:ReportedRoute;category:string;description:string},now:string):WorkflowState {
  requireValue(validLocalTime(now),'Use a valid Malaysia timestamp.')
  requireValue(input.route?.dataset_version===state.current_version,'The published map changed. Review the selected route before submitting.')
  requireValue(validReportedRoute(state,input.route),'Choose two connected points and a valid calculated route to report.')
  requireValue(routeReportCategories.includes(input.category),'Choose a problem category.')
  requireValue(text(input.description),'Describe the problem (up to 2000 characters), such as a broken shade structure.')
  const route={...input.route,segment_ids:[...input.route.segment_ids],node_ids:[...input.route.node_ids]}
  const report:ResidentReport={report_id:`REPORT-${String(state.revision+1).padStart(6,'0')}`,segment_id:route.segment_ids[0],route,category:input.category,comment_optional:input.description.trim(),created_at:now,review_status:'submitted',review_note:'',data_status:'demo_fixture'}
  return {...state,revision:state.revision+1,reports:[...state.reports,report]}
}
export function acceptRouteReport(state:WorkflowState,id:string,reviewer:string,note:string,now:string):WorkflowState {
  const report=state.reports.find(r=>r.report_id===id)
  requireValue(report?.route&&validReportedRoute(state,report.route),'Choose a saved point-to-point report. Legacy single-link reports require separate review.')
  requireValue(report.review_status==='submitted'||report.review_status==='under_review','Only pending reports can be accepted. Accepted/rejected reports are final.')
  requireValue(validLocalTime(now)&&text(reviewer)&&text(note),'Enter a reviewer label and review note before accepting.')
  // One explicit Accept action records both review stages and publication atomically.
  const started=report.review_status==='submitted'?reviewReport(state,id,'under_review',reviewer,note,now):state
  const reviewed:WorkflowState={...started,revision:started.revision+1,reports:started.reports.map(r=>r.report_id===id?{...r,review_status:'verified',review_note:note.trim()}:r),report_events:[...started.report_events,{event_id:`REPORT-REVIEW-${String(started.revision+1).padStart(6,'0')}`,report_id:id,from_status:'under_review',to_status:'verified',reviewer_label:reviewer.trim(),note:note.trim(),timestamp:now}]}
  return publishMapShadeAssignments(reviewed,report.route.segment_ids.map(segment_id=>({segment_id,shade_label:'mixed'})),reviewer,note,now,id)
}
