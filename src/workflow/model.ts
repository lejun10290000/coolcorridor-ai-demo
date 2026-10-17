import { candidates, segments, studyArea } from '../fixtures'
import { optimise, validTransition } from '../domain'
import { requireObservationField } from './validationError'
import type { DataStatus, InterventionCandidate, Lifecycle, ReportStatus, ResidentReport, ShadeLabel, StudyArea, WalkwaySegment } from '../types'

export const shadeLabels: ShadeLabel[] = ['mostly_exposed', 'mixed', 'mostly_shaded', 'unknown']
export const storageKey = 'coolcorridor-shade-workflow-v1'
export const dataStatusText: Record<DataStatus, string> = { sample_observed: 'OBSERVED (manually entered)', human_reviewed: 'HUMAN REVIEWED', model_estimate: 'MODEL ESTIMATE', demo_fixture: 'DEMO', simulated: 'SIMULATED', unknown: 'UNKNOWN' }
export interface ShadeSource { observation_id: string; method: string; source_note: string; observer_label: string; reviewer_label: string; review_note: string; evidence_reference: string; published_at: string }
export interface CurrentSegment extends WalkwaySegment { shade_source?: ShadeSource }
export interface DatasetSnapshot { study_area_id: string; dataset_version: string; parent_dataset_version: string | null; created_at: string; created_by_label: string; segments: CurrentSegment[]; change_summary: string; warnings: string[] }
export interface ObservationReview { action: 'under_review' | 'verified' | 'rejected'; reviewer_label: string; note: string; timestamp: string; shade_label: ShadeLabel; review_policy?: 'separate-field-reviewer-v1' }
export interface ShadeObservation {
  observation_id: string; study_area_id: string; segment_id: string; intervention_id: string
  record_kind: 'demo' | 'field'; data_status: 'demo_fixture' | 'sample_observed'; field_attested: boolean
  shade_label: ShadeLabel; observed_at: string; method: string; source_note: string; observer_label: string; notes: string; evidence_reference: string; created_at: string
  review_status: 'submitted' | 'under_review' | 'verified' | 'rejected' | 'published'; reviews: ObservationReview[]
  published_at: string | null; published_by_label: string | null; published_dataset_version: string | null
}
export interface LifecycleEvent { event_id: string; intervention_id: string; from_status: Lifecycle; to_status: Lifecycle; actor_demo_label: string; timestamp: string; note: string; evidence_reference: string; dataset_version: string }
export interface ReportEvent { event_id: string; report_id: string; from_status: ReportStatus; to_status: ReportStatus; reviewer_label: string; note: string; timestamp: string }
export interface WorkflowState { schema_version: 1; revision: number; current_version: string; snapshots: DatasetSnapshot[]; observations: ShadeObservation[]; lifecycle_events: LifecycleEvent[]; items: InterventionCandidate[]; reports: ResidentReport[]; report_events: ReportEvent[] }
export interface ObservationInput { intervention_id: string; segment_id: string; record_kind: 'demo' | 'field'; field_attested: boolean; shade_label: ShadeLabel; observed_at: string; method: string; source_note: string; observer_label: string; notes: string; evidence_reference: string }
export type Plan = ReturnType<typeof optimise>
export interface Scenario { status: 'simulated'; baseline_version: string; selected_intervention_ids: string[]; projections: {segment_id: string; baseline_label: ShadeLabel; projected_label: ShadeLabel | null; assumption: string}[]; segments: CurrentSegment[]; warnings: string[] }
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const requireValue = (condition: unknown, message: string): void => { if (!condition) throw new Error(message) }
const text = (s: string) => typeof s === 'string' && s.trim().length > 0 && s.length <= 2000
export function malaysiaNow(date = new Date()) { return new Date(date.getTime() + 8 * 3600000).toISOString().slice(0,19) + '+08:00' }
export function validLocalTime(value: string) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+08:00$/.test(value) || !Number.isFinite(Date.parse(value))) return false
  return malaysiaNow(new Date(value)) === value
}
function timestamp(value: string) { requireValue(validLocalTime(value), 'Use a valid Malaysia timestamp with +08:00.') }
function actor(value: string) { requireValue(text(value), 'Enter an actor/reviewer label (no personal details needed).') }
function nextId(state: WorkflowState, prefix: string) { return `${prefix}-${String(state.revision+1).padStart(6,'0')}` }
export function currentSnapshot(state: WorkflowState) { return state.snapshots.find(s => s.dataset_version === state.current_version)! }
export function currentStudyArea(state: WorkflowState): StudyArea { const snapshot=currentSnapshot(state);return {...studyArea,dataset_version:snapshot.dataset_version,updated_at:snapshot.created_at} }
export function initialWorkflow(): WorkflowState {
  return { schema_version: 1, revision: 0, current_version: studyArea.dataset_version, snapshots: [{ study_area_id: studyArea.study_area_id, dataset_version: studyArea.dataset_version, parent_dataset_version: null, created_at: studyArea.updated_at, created_by_label: 'Initial DEMO fixtures', segments: copy(segments), change_summary: 'Original illustrative shade baseline; no field observations.', warnings: ['Campus image/paths and planning inputs are DEMO. No field-verified navigation.'] }], observations: [], lifecycle_events: [], items: copy(candidates), reports: [], report_events: [] }
}
export function reportsForSegment(reports: ResidentReport[], id: string) { return reports.filter(r => r.segment_id === id) }
export function submitReport(state: WorkflowState, input: {segment_id: string; category: string; comment_optional: string}, now: string): WorkflowState {
  timestamp(now); requireValue(currentSnapshot(state).segments.some(s => s.segment_id === input.segment_id), 'Unknown segment.')
  requireValue(['no shade','too hot at a stated time','blocked walkway','unsafe crossing','other'].includes(input.category), 'Choose a report category.')
  requireValue(typeof input.comment_optional === 'string' && input.comment_optional.length <= 2000, 'Report note is too long.')
  return { ...state, revision: state.revision+1, reports: [...state.reports, { ...input, report_id: nextId(state,'REPORT'), created_at: now, review_status: 'submitted', review_note: '', data_status: 'demo_fixture' }] }
}
export function validReportTransition(from: ReportStatus, to: ReportStatus) { return (from === 'submitted' && (to === 'under_review' || to === 'rejected')) || (from === 'under_review' && (to === 'verified' || to === 'rejected')) }
export function reviewReport(state: WorkflowState, id: string, to: ReportStatus, reviewer: string, note: string, now: string): WorkflowState {
  timestamp(now); actor(reviewer); requireValue(text(note), 'Add a review note.')
  const report = state.reports.find(r => r.report_id === id)
  requireValue(report && validReportTransition(report.review_status,to), 'Report review must follow submitted → under review → verified, or rejection.')
  const event: ReportEvent = {event_id:nextId(state,'REPORT-REVIEW'),report_id:id,from_status:report!.review_status,to_status:to,reviewer_label:reviewer.trim(),note:note.trim(),timestamp:now}
  return {...state,revision:state.revision+1,reports:state.reports.map(r=>r.report_id===id?{...r,review_status:to,review_note:note.trim()}:r),report_events:[...state.report_events,event]}
}
export const lifecycleNext: Record<Lifecycle, Lifecycle | null> = {proposed:'approved_demo',approved_demo:'under_construction',under_construction:'installed_pending_verification',installed_pending_verification:'verified',verified:'published',published:null}
function lifecycleEvent(state: WorkflowState, id: string, from: Lifecycle, to: Lifecycle, by: string, note: string, now: string, evidence = '', version = state.current_version): LifecycleEvent { return {event_id:nextId(state,`LIFE-${id}-${to}`),intervention_id:id,from_status:from,to_status:to,actor_demo_label:by.trim(),timestamp:now,note:note.trim(),evidence_reference:evidence,dataset_version:version} }
export function advanceInstallation(state: WorkflowState, id: string, to: Lifecycle, by: string, note: string, now: string): WorkflowState {
  timestamp(now); actor(by); requireValue(text(note),'Record a lifecycle note.')
  const item = state.items.find(i=>i.intervention_id===id)
  requireValue(item && validTransition(item.lifecycle,to) && ['approved_demo','under_construction','installed_pending_verification'].includes(to), 'Advance sequentially; verification and publication require reviewed shade evidence.')
  return {...state,revision:state.revision+1,items:state.items.map(i=>i.intervention_id===id?{...i,lifecycle:to}:i),lifecycle_events:[...state.lifecycle_events,lifecycleEvent(state,id,item!.lifecycle,to,by,note,now)]}
}
export function safeEvidenceReference(value: string) { return typeof value === 'string' && value.length <= 500 && !/[<>\x00-\x1f]/.test(value) && !/^(?:javascript|data|file|vbscript):/i.test(value.trim()) }
export function recordObservation(state: WorkflowState, input: ObservationInput, now: string): WorkflowState {
  timestamp(now)
  requireObservationField(validLocalTime(input.observed_at),'observed_at','Choose a valid observation date and time in Malaysia (+08:00).')
  requireObservationField(Date.parse(input.observed_at) <= Date.parse(now),'observed_at', 'Observation time cannot be in the future.')
  const item=state.items.find(i=>i.intervention_id===input.intervention_id)
  requireObservationField(item?.lifecycle==='installed_pending_verification','intervention_id','Record observations only after installation, before verification.')
  requireObservationField(item?.segment_ids.includes(input.segment_id) && currentSnapshot(state).segments.some(s=>s.segment_id===input.segment_id),'segment_id','Choose an existing segment linked to this intervention.')
  requireObservationField(shadeLabels.includes(input.shade_label),'shade_label','Choose a valid shade label.')
  requireObservationField(input.record_kind==='demo' || input.record_kind==='field','record_kind','Choose DEMO or genuine field entry.')
  requireObservationField(input.record_kind!=='field' || input.field_attested===true,'field_attested','Confirm this is a genuine field observation and the segment was checked on site.')
  requireObservationField(text(input.observer_label),'observer_label','Enter an observer label (no personal details needed).')
  requireObservationField(text(input.method),'method','Observation method is required.')
  requireObservationField(text(input.source_note),'source_note','Observation source / field record reference is required.')
  requireObservationField(text(input.notes),'notes','Notes and uncertainty are required.')
  requireObservationField(safeEvidenceReference(input.evidence_reference),'evidence_reference','Use a short safe evidence reference; no embedded images, scripts or file URLs.')
  const observation: ShadeObservation = {...input,field_attested:input.record_kind==='field'&&input.field_attested,observation_id:nextId(state,'OBS'),study_area_id:studyArea.study_area_id,data_status:input.record_kind==='demo'?'demo_fixture':'sample_observed',created_at:now,review_status:'submitted',reviews:[],published_at:null,published_by_label:null,published_dataset_version:null}
  return {...state,revision:state.revision+1,observations:[...state.observations,observation]}
}
export function verifiedForIntervention(state: WorkflowState, id: string) {
  const item=state.items.find(i=>i.intervention_id===id)
  return item?.segment_ids.map(segment=>[...state.observations].reverse().find(o=>o.intervention_id===id&&o.segment_id===segment&&o.review_status==='verified')) ?? []
}
export function reviewObservation(state: WorkflowState, id: string, action: ObservationReview['action'], reviewer: string, note: string, reviewedLabel: ShadeLabel, now: string): WorkflowState {
  timestamp(now)
  const obs=state.observations.find(o=>o.observation_id===id)
  if(obs?.record_kind==='field'&&action==='verified')requireObservationField(text(reviewer)&&reviewer.trim().toLowerCase()!==obs.observer_label.trim().toLowerCase(),'reviewer_label','Genuine field observations require a separate reviewer label, different from the observer (ignoring case and surrounding spaces).')
  requireObservationField(text(reviewer),'reviewer_label','Enter a reviewer label (no personal details needed).')
  requireObservationField(text(note),'review_note','A review note is required.');requireValue(shadeLabels.includes(reviewedLabel),'Choose a valid reviewed label.')
  requireValue(obs && validReportTransition(obs.review_status as ReportStatus,action),'Start a distinct review before verifying; final/rejected/published observations cannot be re-reviewed.')
  const updated: WorkflowState={...state,revision:state.revision+1,observations:state.observations.map(o=>o.observation_id===id?{...o,review_status:action,reviews:[...o.reviews,{action,reviewer_label:reviewer.trim(),note:note.trim(),timestamp:now,shade_label:reviewedLabel,review_policy:'separate-field-reviewer-v1'}]}:o)}
  const item=updated.items.find(i=>i.intervention_id===obs!.intervention_id)!
  const verified=verifiedForIntervention(updated,item.intervention_id)
  if(action==='verified'&&item.lifecycle==='installed_pending_verification'&&verified.length>0&&verified.every(Boolean)) {
    return {...updated,items:updated.items.map(i=>i.intervention_id===item.intervention_id?{...i,lifecycle:'verified'}:i),lifecycle_events:[...updated.lifecycle_events,lifecycleEvent(state,item.intervention_id,item.lifecycle,'verified',reviewer,`All linked segments have reviewed shade evidence. ${note}`,now,id)]}
  }
  return updated
}
export function publishIntervention(state: WorkflowState, id: string, by: string, note: string, now: string): WorkflowState {
  timestamp(now); actor(by); requireValue(text(note),'Add a publication note.')
  const item=state.items.find(i=>i.intervention_id===id)
  const verified=verifiedForIntervention(state,id)
  requireValue(item?.lifecycle==='verified'&&verified.length>0&&verified.every(Boolean),'Publishing requires a verified intervention and one verified observation per linked segment.')
  const observations=verified as ShadeObservation[]
  observations.forEach(o=>requireObservationField(o.record_kind!=='field'||o.reviews[o.reviews.length-1].reviewer_label.trim().toLowerCase()!==o.observer_label.trim().toLowerCase(),'reviewer_label','Genuine field observations require a separate reviewer before publication. Historical records are preserved; a matching observer/reviewer alias is not independent review.'))
  const baseline=currentSnapshot(state)
  const version=`${studyArea.dataset_version}-v${String(state.snapshots.length).padStart(6,'0')}`
  requireValue(!state.snapshots.some(s=>s.dataset_version===version),'Dataset version already exists.')
  const snapshot: DatasetSnapshot={study_area_id:studyArea.study_area_id,dataset_version:version,parent_dataset_version:baseline.dataset_version,created_at:now,created_by_label:by.trim(),change_summary:`${id}: ${note.trim()}`,warnings:['Local prototype only; manual entry/review, no institutional approval. Campus geometry and planning inputs remain DEMO.'],segments:baseline.segments.map(s=>{
    const observation=observations.find(o=>o.segment_id===s.segment_id)
    if(!observation)return {...copy(s),dataset_version:version}
    const review=observation.reviews[observation.reviews.length-1]
    return {...copy(s),dataset_version:version,shade_label:review.shade_label,shade_observed_at:observation.observed_at,shade_data_status:observation.data_status==='demo_fixture'?'demo_fixture':'human_reviewed',shade_source:{observation_id:observation.observation_id,method:observation.method,source_note:observation.source_note,observer_label:observation.observer_label,reviewer_label:review.reviewer_label,review_note:review.note,evidence_reference:observation.evidence_reference,published_at:now}}
  })}
  return {...state,revision:state.revision+1,current_version:version,snapshots:[...state.snapshots,snapshot],observations:state.observations.map(o=>observations.some(v=>v.observation_id===o.observation_id)?{...o,review_status:'published',published_at:now,published_by_label:by.trim(),published_dataset_version:version}:o),items:state.items.map(i=>i.intervention_id===id?{...i,lifecycle:'published'}:i),lifecycle_events:[...state.lifecycle_events,lifecycleEvent(state,id,'verified','published',by,note,now,observations.map(o=>o.observation_id).join(', '),version)]}
}
export function parseBudget(value: string): number | null { if(!/^\d+$/.test(value))return null;const n=Number(value);return Number.isSafeInteger(n)&&n>=0&&n<=1_000_000_000?n:null }
export function calculatePlan(items: InterventionCandidate[], value: string, excluded: string[]): Plan {
  const budget=parseBudget(value);requireValue(budget!==null,'Enter whole RM from 0 to 1,000,000,000.')
  requireValue(items.length<=20&&items.every(i=>Number.isSafeInteger(i.cost_rm)&&i.cost_rm>=0&&Number.isFinite(i.modelled_benefit)&&i.modelled_benefit>=0),'Candidate costs/benefits must be finite non-negative values.')
  return optimise(items,budget!,excluded)
}
export function buildScenario(baseline: DatasetSnapshot, items: InterventionCandidate[], selected: string[], assumptions: Record<string, ShadeLabel | ''>): Scenario {
  const affected=new Set(items.filter(i=>selected.includes(i.intervention_id)).flatMap(i=>i.segment_ids))
  const projections=baseline.segments.filter(s=>affected.has(s.segment_id)).map(s=>({segment_id:s.segment_id,baseline_label:s.shade_label,projected_label:shadeLabels.includes(assumptions[s.segment_id] as ShadeLabel)?assumptions[s.segment_id] as ShadeLabel:null,assumption:shadeLabels.includes(assumptions[s.segment_id] as ShadeLabel)?'Explicit operator SIMULATED assumption; not a measured result.':'No shade change assumed; insufficient evidence to project.'}))
  return {status:'simulated',baseline_version:baseline.dataset_version,selected_intervention_ids:[...selected],projections,segments:baseline.segments.map(s=>{const p=projections.find(p=>p.segment_id===s.segment_id);return p?.projected_label?{...copy(s),shade_label:p.projected_label,shade_observed_at:null,shade_data_status:'simulated',shade_source:undefined}:copy(s)}),warnings:['SIMULATED / ASSUMPTION. No construction, shade measurement or cooling outcome is established. Unconfigured projections preserve baseline labels.']}
}
