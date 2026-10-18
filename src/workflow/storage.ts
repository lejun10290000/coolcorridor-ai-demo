import { candidates, segments, studyArea } from '../fixtures'
import { currentSnapshot, initialWorkflow, lifecycleNext, shadeLabels, validLocalTime, safeEvidenceReference, validReportTransition } from './model'
import type { WorkflowState } from './model'
import type { DataStatus, Lifecycle } from '../types'
import { mapShadeSource, validMapAssignments } from './mapShade'
import { routeReportCategories, validReportedRoute } from './routeReports'
import { validPlanningWorkspace } from './planning'

const statuses: DataStatus[]=['sample_observed','human_reviewed','model_estimate','demo_fixture','simulated','unknown']
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v)
const string=(v:unknown):v is string=>typeof v==='string'&&v.length<=4000
const time=(v:unknown):v is string=>typeof v==='string'&&validLocalTime(v)
const array=(v:unknown):v is unknown[]=>Array.isArray(v)&&v.length<=10000
const unique=(v:unknown[],key:string)=>v.every(object)&&new Set(v.map(x=>(x as Record<string,unknown>)[key])).size===v.length
const assert=(v:unknown)=>{if(!v)throw new Error('Stored workflow data is invalid or incompatible.')}

/**
 * Safe additive migration for local data saved before campus-wide walkway links existed.
 * Add only the new grey/unknown fixture records to each old snapshot. Existing snapshot
 * history, legacy segment evidence, observations, reports and lifecycle events are retained.
 * If the persisted structure is not an exact recognizable legacy shape, strict validation
 * below handles it as incompatible instead of guessing how to repair it.
 */
function migrateLegacyCampusSnapshots(value: Record<string, unknown>) {
  const snapshots=value.snapshots
  if(!Array.isArray(snapshots)||!snapshots.length)return
  // Recognize the exact original 4-record, PR7 72-record, or intermediate legacy+reference
  // ID set. Append absent known fixture records; never rewrite a retained record or evidence.
  const knownOrders=[segments.filter(s=>s.segment_id.startsWith('DEMO-S')).map(s=>s.segment_id),
    segments.filter(s=>!s.segment_id.startsWith('DEMO-REF-')).map(s=>s.segment_id),
    segments.filter(s=>!s.segment_id.startsWith('DEMO-WALK-')).map(s=>s.segment_id)]
  const matched=knownOrders.find(ids=>snapshots.every(snapshot=>object(snapshot)&&Array.isArray(snapshot.segments)&&JSON.stringify(snapshot.segments.map(s=>object(s)?s.segment_id:null))===JSON.stringify(ids)))
  if(!matched)return
  value.snapshots=snapshots.map(snapshot=>{
    const prior=snapshot as Record<string,unknown>,existing=prior.segments as Record<string,unknown>[]
    const byId=new Map(existing.map(s=>[s.segment_id,s]))
    return {...prior,segments:segments.map(s=>byId.get(s.segment_id)??{...s,dataset_version:prior.dataset_version})}
  })
}
/** Runtime validation is deliberately stricter than JSON.parse; no fixture is promoted on reload. */
export function decodeWorkflow(raw:string):WorkflowState {
  const value:unknown=JSON.parse(raw)
  assert(object(value));const s=value as Record<string,unknown>
  assert(s.schema_version===1&&Number.isSafeInteger(s.revision)&&Number(s.revision)>=0)
  migrateLegacyCampusSnapshots(s)
  for(const key of ['snapshots','observations','items','reports','report_events','lifecycle_events'])assert(array(s[key])&&unique(s[key] as unknown[],key==='snapshots'?'dataset_version':key==='items'?'intervention_id':key==='observations'?'observation_id':key==='reports'?'report_id':'event_id'))
  const state=value as WorkflowState
  // Additive optional fields: older saved observations, versions and reports are preserved.
  if(state.map_shade_updates===undefined)state.map_shade_updates=[]
  if(state.map_shade_draft===undefined)state.map_shade_draft=null
  assert(array(state.map_shade_updates)&&unique(state.map_shade_updates,'publication_id'))
  assert(state.map_shade_draft===null||object(state.map_shade_draft))
  if(state.map_shade_draft){const d=state.map_shade_draft;assert(string(d.base_dataset_version)&&state.snapshots.some(s=>s.dataset_version===d.base_dataset_version)&&time(d.updated_at)&&validMapAssignments(d.assignments))}
  assert(state.snapshots.length>0&&state.current_version===state.snapshots[state.snapshots.length-1].dataset_version)
  assert(JSON.stringify(state.snapshots[0])===JSON.stringify(initialWorkflow().snapshots[0]))
  assert(state.items.length===candidates.length)
  state.items.forEach(i=>{
    const original=candidates.find(c=>c.intervention_id===i.intervention_id)
    assert(original&&JSON.stringify({...i,lifecycle:original.lifecycle})===JSON.stringify(original)&&Object.keys(lifecycleNext).includes(i.lifecycle))
  })
  state.snapshots.forEach((snapshot,index)=>{
    assert(snapshot.study_area_id===studyArea.study_area_id&&string(snapshot.dataset_version)&&time(snapshot.created_at)&&string(snapshot.created_by_label)&&string(snapshot.change_summary))
    assert(snapshot.parent_dataset_version===(index?state.snapshots[index-1].dataset_version:null))
    assert(array(snapshot.warnings)&&snapshot.warnings.every(string)&&array(snapshot.segments)&&unique(snapshot.segments,'segment_id')&&snapshot.segments.length===segments.length)
    snapshot.segments.forEach(segment=>{
      const original=segments.find(s=>s.segment_id===segment.segment_id)
      assert(original&&segment.study_area_id===studyArea.study_area_id&&segment.dataset_version===snapshot.dataset_version&&shadeLabels.includes(segment.shade_label)&&statuses.includes(segment.shade_data_status))
      assert(segment.shade_observed_at===null||time(segment.shade_observed_at))
      // Publication can change only shade evidence and the snapshot version, never map/route facts.
      const {shade_source: _source,...withoutSource}=segment
      assert(JSON.stringify({...withoutSource,dataset_version:original!.dataset_version,shade_label:original!.shade_label,shade_observed_at:original!.shade_observed_at,shade_data_status:original!.shade_data_status})===JSON.stringify(original))
      if(segment.shade_source){const p=segment.shade_source;assert([p.observation_id,p.method,p.source_note,p.observer_label,p.reviewer_label,p.review_note,p.evidence_reference].every(string)&&time(p.published_at)&&safeEvidenceReference(p.evidence_reference))}
    })
  })
  state.observations.forEach(o=>{
    const item=state.items.find(i=>i.intervention_id===o.intervention_id)
    assert(string(o.observation_id)&&o.study_area_id===studyArea.study_area_id&&item?.segment_ids.includes(o.segment_id)&&shadeLabels.includes(o.shade_label))
    assert((o.record_kind==='demo'&&o.data_status==='demo_fixture'&&o.field_attested===false)||(o.record_kind==='field'&&o.data_status==='sample_observed'&&o.field_attested===true))
    assert(time(o.observed_at)&&time(o.created_at)&&Date.parse(o.observed_at)<=Date.parse(o.created_at))
    assert([o.method,o.source_note,o.observer_label,o.notes].every(v=>string(v)&&v.trim().length>0)&&safeEvidenceReference(o.evidence_reference))
    assert(['submitted','under_review','verified','rejected','published'].includes(o.review_status)&&array(o.reviews))
    let previous='submitted'
    o.reviews.forEach(r=>{assert(object(r)&&validReportTransition(previous as 'submitted',r.action)&&time(r.timestamp)&&[r.note,r.reviewer_label].every(v=>string(v)&&v.trim())&&shadeLabels.includes(r.shade_label));if(r.review_policy!==undefined){assert(r.review_policy==='separate-field-reviewer-v1');if(o.record_kind==='field'&&r.action==='verified')assert(r.reviewer_label.trim().toLowerCase()!==o.observer_label.trim().toLowerCase())}previous=r.action})
    assert(previous===(o.review_status==='published'?'verified':o.review_status))
    if(o.review_status==='published')assert(time(o.published_at)&&string(o.published_by_label)&&state.snapshots.some(s=>s.dataset_version===o.published_dataset_version&&s.segments.some(segment=>segment.shade_source?.observation_id===o.observation_id)))
    else assert(o.published_at===null&&o.published_by_label===null&&o.published_dataset_version===null)
  })
  state.map_shade_updates.forEach(update=>{
    assert(object(update)&&string(update.publication_id)&&update.publication_id.startsWith('MAP-SHADE-')&&time(update.created_at)&&[update.created_by_label,update.note].every(v=>string(v)&&v.trim().length>0)&&validMapAssignments(update.assignments))
    const index=state.snapshots.findIndex(s=>s.dataset_version===update.dataset_version),snapshot=state.snapshots[index],prior=state.snapshots[index-1]
    assert(index>0&&prior.dataset_version===update.base_dataset_version&&snapshot.parent_dataset_version===update.base_dataset_version&&snapshot.created_at===update.created_at&&snapshot.created_by_label===update.created_by_label)
    if(update.source_report_id!==undefined){
      const report=state.reports.find(r=>r.report_id===update.source_report_id),events=state.report_events.filter(e=>e.report_id===update.source_report_id),event=events[events.length-1]
      assert(string(update.source_report_id)&&report?.route&&report.review_status==='verified'&&report.accepted_publication_id===update.publication_id&&JSON.stringify(update.assignments.map(a=>a.segment_id))===JSON.stringify(report.route.segment_ids)&&update.assignments.every(a=>a.shade_label==='mixed')&&event?.to_status==='verified'&&event.reviewer_label===update.created_by_label&&event.timestamp===update.created_at&&event.note===update.note)
    }
    // Every changed record must be accounted for; non-selected evidence is carried forward intact.
    snapshot.segments.forEach(segment=>{
      const before=prior.segments.find(s=>s.segment_id===segment.segment_id)!,a=update.assignments.find(a=>a.segment_id===segment.segment_id)
      const expected=a?{...before,dataset_version:update.dataset_version,shade_label:a.shade_label,shade_observed_at:null,shade_data_status:'demo_fixture',shade_source:mapShadeSource(update)}:{...before,dataset_version:update.dataset_version}
      assert(JSON.stringify(segment)===JSON.stringify(expected))
    })
  })
  assert(new Set(state.map_shade_updates.map(u=>u.dataset_version)).size===state.map_shade_updates.length)
  state.snapshots.forEach((snapshot,index)=>snapshot.segments.forEach(segment=>{
    if(!segment.shade_source){const original=segments.find(s=>s.segment_id===segment.segment_id)!;assert(segment.shade_data_status===original.shade_data_status&&segment.shade_label===original.shade_label&&segment.shade_observed_at===original.shade_observed_at);return}
    if(segment.shade_source.map_publication_id!==undefined){
      const update=state.map_shade_updates!.find(u=>u.publication_id===segment.shade_source!.map_publication_id),a=update?.assignments.find(a=>a.segment_id===segment.segment_id)
      assert(update&&a&&state.snapshots.findIndex(s=>s.dataset_version===update.dataset_version)<=index&&segment.shade_label===a.shade_label&&segment.shade_data_status==='demo_fixture'&&segment.shade_observed_at===null&&JSON.stringify(segment.shade_source)===JSON.stringify(mapShadeSource(update)))
      return
    }
    const o=state.observations.find(o=>o.observation_id===segment.shade_source?.observation_id)
    assert(o?.review_status==='published'&&o.segment_id===segment.segment_id&&o.observed_at===segment.shade_observed_at&&o.reviews[o.reviews.length-1].shade_label===segment.shade_label&&segment.shade_data_status===(o.data_status==='demo_fixture'?'demo_fixture':'human_reviewed'))
    if(o){const source=segment.shade_source,review=o.reviews[o.reviews.length-1];assert(source.method===o.method&&source.source_note===o.source_note&&source.observer_label===o.observer_label&&source.reviewer_label===review.reviewer_label&&source.review_note===review.note&&source.evidence_reference===o.evidence_reference&&source.published_at===o.published_at)}
  }))
  assert(state.lifecycle_events.every(e=>state.items.some(i=>i.intervention_id===e.intervention_id)))
  assert(state.report_events.every(e=>state.reports.some(r=>r.report_id===e.report_id)))
  state.items.forEach(item=>{
    let previous:Lifecycle='proposed'
    state.lifecycle_events.filter(e=>e.intervention_id===item.intervention_id).forEach(e=>{assert(e.from_status===previous&&lifecycleNext[previous]===e.to_status&&time(e.timestamp)&&[e.actor_demo_label,e.note,e.event_id,e.evidence_reference].every(string)&&state.snapshots.some(s=>s.dataset_version===e.dataset_version));previous=e.to_status})
    assert(previous===item.lifecycle)
    if(item.lifecycle==='published')assert(item.segment_ids.every(id=>state.observations.some(o=>o.intervention_id===item.intervention_id&&o.segment_id===id&&o.review_status==='published')))
  })
  state.reports.forEach(r=>{
    assert(string(r.report_id)&&segments.some(s=>s.segment_id===r.segment_id)&&routeReportCategories.includes(r.category)&&time(r.created_at)&&string(r.comment_optional)&&string(r.review_note)&&r.data_status==='demo_fixture')
    if(r.route!==undefined){
      assert(validReportedRoute(state,r.route)&&r.segment_id===r.route.segment_ids[0]&&r.comment_optional.trim().length>0)
      if(r.review_status==='verified')assert(string(r.accepted_publication_id)&&state.map_shade_updates!.some(u=>u.publication_id===r.accepted_publication_id&&u.source_report_id===r.report_id))
      else assert(r.accepted_publication_id===undefined)
    }else assert(r.accepted_publication_id===undefined)
    let previous='submitted'
    state.report_events.filter(e=>e.report_id===r.report_id).forEach(e=>{assert(validReportTransition(previous as 'submitted',e.to_status)&&e.from_status===previous&&time(e.timestamp)&&[e.reviewer_label,e.note,e.event_id].every(string));previous=e.to_status})
    assert(previous===r.review_status)
  })
  assert(currentSnapshot(state))
  // A damaged optional simulation must not discard valid published map/history.
  if(state.planning_workspace!==undefined&&!validPlanningWorkspace(state.planning_workspace,state.items))delete state.planning_workspace
  return state
}
export function loadWorkflow(raw:string|null):{state:WorkflowState;warning:string} {
  if(raw===null)return {state:initialWorkflow(),warning:''}
  try{const state=decodeWorkflow(raw);return{state,warning:JSON.parse(raw).planning_workspace!==undefined&&state.planning_workspace===undefined?'Invalid saved planning inputs were reset. Published map and history were preserved.':''}}
  catch{return{state:initialWorkflow(),warning:'Saved local workflow data is corrupt or incompatible. Recovered the original DEMO baseline for this session. A new successful action will replace that invalid saved state.'}}
}
