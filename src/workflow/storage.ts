import { candidates, segments, studyArea } from '../fixtures'
import { currentSnapshot, initialWorkflow, lifecycleNext, shadeLabels, validLocalTime, safeEvidenceReference, validReportTransition } from './model'
import type { WorkflowState } from './model'
import type { DataStatus, Lifecycle } from '../types'

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
  const snapshots = value.snapshots
  if (!Array.isArray(snapshots)) return
  const currentCampusSegments = segments.filter(segment => segment.segment_id.startsWith('DEMO-WALK-'))
  const legacySegments = segments.filter(segment => !segment.segment_id.startsWith('DEMO-WALK-'))
  if (!currentCampusSegments.length) return
  const isOldSnapshot = (snapshot: unknown) => object(snapshot)
    && Array.isArray(snapshot.segments)
    && snapshot.segments.length === legacySegments.length
    && JSON.stringify(snapshot.segments.map((segment: unknown) => object(segment) ? segment.segment_id : null))
      === JSON.stringify(legacySegments.map(segment => segment.segment_id))
  // Migrate only if every stored version has the same known pre-campus-wide segment set.
  if (!snapshots.every(isOldSnapshot)) return
  value.snapshots = snapshots.map((snapshot: unknown) => {
    const prior = snapshot as Record<string, unknown>
    if (typeof prior.dataset_version !== 'string') return prior
    return {
      ...prior,
      segments: [
        ...(prior.segments as unknown[]),
        ...currentCampusSegments.map(segment => ({ ...segment, dataset_version: prior.dataset_version })),
      ],
    }
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
  state.snapshots.forEach(snapshot=>snapshot.segments.forEach(segment=>{
    if(!segment.shade_source){const original=segments.find(s=>s.segment_id===segment.segment_id)!;assert(segment.shade_data_status===original.shade_data_status&&segment.shade_label===original.shade_label&&segment.shade_observed_at===original.shade_observed_at);return}
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
    assert(string(r.report_id)&&segments.some(s=>s.segment_id===r.segment_id)&&['no shade','too hot at a stated time','blocked walkway','unsafe crossing','other'].includes(r.category)&&time(r.created_at)&&string(r.comment_optional)&&string(r.review_note)&&r.data_status==='demo_fixture')
    let previous='submitted'
    state.report_events.filter(e=>e.report_id===r.report_id).forEach(e=>{assert(validReportTransition(previous as 'submitted',e.to_status)&&e.from_status===previous&&time(e.timestamp)&&[e.reviewer_label,e.note,e.event_id].every(string));previous=e.to_status})
    assert(previous===r.review_status)
  })
  assert(currentSnapshot(state))
  return state
}
export function loadWorkflow(raw:string|null):{state:WorkflowState;warning:string} {
  if(raw===null)return {state:initialWorkflow(),warning:''}
  try{return{state:decodeWorkflow(raw),warning:''}}
  catch{return{state:initialWorkflow(),warning:'Saved local workflow data is corrupt or incompatible. Recovered the original DEMO baseline for this session. A new successful action will replace that invalid saved state.'}}
}
