import { campusWalkLinks } from '../campusWalkways'
import { demoCampusFootfall, demoFootfallWindow } from '../demoFootfall'
import type { FootfallObservation, InterventionCandidate, ShadeLabel } from '../types'
import { buildScenario, calculatePlan, currentSnapshot, parseBudget } from './model'
import type { CurrentSegment, DatasetSnapshot, FootfallPlanningWorkspace, FootfallTreatment, WorkflowState } from './model'

const referenceIds=new Set(campusWalkLinks.map(l=>l.segment_id))
export const treatmentLabels={trees:'Tree planting',roof:'Roof / canopy',none:'No proposal'}
export const treatmentProjection:{trees:ShadeLabel;roof:ShadeLabel}={trees:'mixed',roof:'mostly_shaded'}
const weights={mostly_exposed:1,mixed:0.5,mostly_shaded:0}
export const treeSpacingM=8
export function topFootfall(snapshot:DatasetSnapshot,records:FootfallObservation[]=demoCampusFootfall){
  const seen=new Set<string>()
  return records.filter(f=>{
    if(seen.has(f.segment_id)||!referenceIds.has(f.segment_id)||!snapshot.segments.some(s=>s.segment_id===f.segment_id)||!Number.isSafeInteger(f.pass_count)||f.pass_count<0||f.duration_min!==15||f.passes_per_hour_equivalent!==f.pass_count*4||f.window_start!==demoFootfallWindow.start||f.window_end!==demoFootfallWindow.end)return false
    seen.add(f.segment_id);return true
  }).sort((a,b)=>b.passes_per_hour_equivalent-a.passes_per_hour_equivalent||a.segment_id.localeCompare(b.segment_id)).slice(0,10).map((record,index)=>({rank:index+1,record,segment:snapshot.segments.find(s=>s.segment_id===record.segment_id)!}))
}
const allTopIds=()=>[...demoCampusFootfall].sort((a,b)=>b.passes_per_hour_equivalent-a.passes_per_hour_equivalent||a.segment_id.localeCompare(b.segment_id)).slice(0,10).map(f=>f.segment_id)
export function defaultFootfallPlanning():FootfallPlanningWorkspace {
  return {schema_version:1,budget:'20000',tree_unit_cost_rm:'500',roof_unit_cost_rm:'200',has_calculated:false,assume_unknown_exposed:true,choices:Object.fromEntries(allTopIds().map(id=>[id,'trees']))}
}
export function footfallPlanningWorkspace(state:WorkflowState){return state.footfall_planning_workspace??defaultFootfallPlanning()}
export function validFootfallPlanning(v:unknown):v is FootfallPlanningWorkspace {
  if(typeof v!=='object'||v===null||Array.isArray(v))return false
  const p=v as Record<string,unknown>,ids=allTopIds()
  if(p.schema_version!==1||![p.budget,p.tree_unit_cost_rm,p.roof_unit_cost_rm].every(x=>typeof x==='string'&&x.length<=40)||typeof p.has_calculated!=='boolean'||typeof p.assume_unknown_exposed!=='boolean'||!p.choices||typeof p.choices!=='object'||Array.isArray(p.choices))return false
  const choices=Object.entries(p.choices)
  return choices.length===ids.length&&choices.every(([id,t])=>ids.includes(id)&&['trees','roof','none'].includes(t))
}
export function updateFootfallPlanning(state:WorkflowState,update:(p:FootfallPlanningWorkspace)=>FootfallPlanningWorkspace):WorkflowState {
  const next=update(structuredClone(footfallPlanningWorkspace(state)))
  if(!validFootfallPlanning(next))throw new Error('Invalid top-ten footfall planning inputs.')
  return {...state,revision:state.revision+1,footfall_planning_workspace:next}
}
export function setPlanningMode(state:WorkflowState,mode:'footfall'|'manual'):WorkflowState {
  if(mode!=='footfall'&&mode!=='manual')throw new Error('Unknown planning method.')
  return {...state,revision:state.revision+1,planning_mode:mode}
}
export function treatmentEstimate(segment:CurrentSegment,treatment:FootfallTreatment,p:FootfallPlanningWorkspace){
  const length=segment.length_m
  if(treatment==='none')return {quantity:0,unit_cost_rm:0,cost_rm:0}
  const unit=parseBudget(treatment==='trees'?p.tree_unit_cost_rm:p.roof_unit_cost_rm)
  if(length===null||!Number.isFinite(length)||length<=0||unit===null)return null
  const quantity=treatment==='trees'?Math.ceil(length/treeSpacingM):Math.ceil(length)
  return {quantity,unit_cost_rm:unit,cost_rm:quantity*unit}
}
export function footfallBenefit(segment:CurrentSegment,rate:number,treatment:FootfallTreatment,assumeUnknown:boolean){
  if(treatment==='none')return {benefit:0,baseline_weight:null,projected_label:segment.shade_label,avoided_exposure_m:0}
  const weight=segment.shade_label==='unknown'?(assumeUnknown?1:null):weights[segment.shade_label]
  if(weight===null||segment.length_m===null||!Number.isFinite(segment.length_m)||segment.length_m<=0)return null
  const projected=treatmentProjection[treatment],gain=Math.max(0,weight-weights[projected as keyof typeof weights]),avoided=segment.length_m*gain
  return {benefit:rate*avoided,baseline_weight:weight,projected_label:gain>0?projected:segment.shade_label,avoided_exposure_m:avoided}
}
export function footfallRows(state:WorkflowState){
  const p=footfallPlanningWorkspace(state)
  return topFootfall(currentSnapshot(state)).map(row=>({...row,treatment:p.choices[row.segment.segment_id],tree:treatmentEstimate(row.segment,'trees',p),roof:treatmentEstimate(row.segment,'roof',p),estimate:treatmentEstimate(row.segment,p.choices[row.segment.segment_id],p),effect:footfallBenefit(row.segment,row.record.passes_per_hour_equivalent,p.choices[row.segment.segment_id],p.assume_unknown_exposed)}))
}
export function calculateFootfallPlanning(state:WorkflowState){
  const p=footfallPlanningWorkspace(state)
  if(parseBudget(p.tree_unit_cost_rm)===null||parseBudget(p.roof_unit_cost_rm)===null)throw new Error('Enter whole RM from 0 to 1,000,000,000 for tree and roof unit costs.')
  const rows=footfallRows(state),items:InterventionCandidate[]=rows.filter(r=>r.treatment!=='none'&&r.estimate&&r.effect).map(r=>({intervention_id:`FF-${r.segment.segment_id}-${r.treatment}`,segment_ids:[r.segment.segment_id],type:treatmentLabels[r.treatment],cost_rm:r.estimate!.cost_rm,cost_source_status:'demo_fixture',modelled_benefit:r.effect!.benefit,constraints:[`site:${r.segment.segment_id}`],feasibility_status:'unverified',data_status:'simulated',notes:'Fictional footfall, assumed costs and shade projections. Site/engineering checks are not performed.',lifecycle:'proposed'}))
  const plan=calculatePlan(items,p.budget,[])
  const assumptions=Object.fromEntries(rows.filter(r=>items.some(i=>plan.ids.includes(i.intervention_id)&&i.segment_ids[0]===r.segment.segment_id)).map(r=>[r.segment.segment_id,r.effect!.projected_label]))
  const scenario=buildScenario(currentSnapshot(state),items,plan.ids,assumptions)
  scenario.warnings.push('Fictional DEMO footfall and prices; benefit = passage events/hour equivalent × assumed reduction in exposed metres. Not unique people or measured cooling.',p.assume_unknown_exposed?'Unknown baseline shade uses an explicit planning-only exposed weight of1; published shade remains unknown.':'Unknown baseline shade is excluded from benefit calculation.')
  return {rows,items,plan,scenario}
}
export type FootfallPlanResult=ReturnType<typeof calculateFootfallPlanning>
