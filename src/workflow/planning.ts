import { legacySegmentDisplayAliases } from '../campusMapDisplay'
import { campusWalkLinks } from '../campusWalkways'
import { buildScenario, calculatePlan, currentSnapshot, parseBudget, shadeLabels } from './model'
import type { PlanningWorkspace, WorkflowState } from './model'
import type { InterventionCandidate } from '../types'

const linkIds = new Set(campusWalkLinks.map(s=>s.segment_id))
const object = (v:unknown):v is Record<string,unknown> => typeof v==='object'&&v!==null&&!Array.isArray(v)
const input = (v:unknown):v is string => typeof v==='string'&&v.length<=40
export function defaultPlanningWorkspace(items:InterventionCandidate[]):PlanningWorkspace {
  return {schema_version:1,budget:'20000',excluded_ids:[],has_calculated:false,
    candidates:Object.fromEntries(items.map(i=>[i.intervention_id,{cost:String(i.cost_rm),benefit:String(i.modelled_benefit),segment_ids:[...new Set(i.segment_ids.map(id=>legacySegmentDisplayAliases[id]??id))]}])),assumptions:{}}
}
/** Planning-only inputs. Historical intervention/evidence records are never rewritten. */
export function validPlanningWorkspace(v:unknown,items:InterventionCandidate[]):v is PlanningWorkspace {
  if(!object(v)||v.schema_version!==1||!input(v.budget)||typeof v.has_calculated!=='boolean'||!object(v.candidates)||!object(v.assumptions)||!Array.isArray(v.excluded_ids))return false
  const ids=items.map(i=>i.intervention_id),entries=Object.entries(v.candidates)
  return entries.length===ids.length&&entries.every(([id,c])=>ids.includes(id)&&object(c)&&input(c.cost)&&input(c.benefit)&&Array.isArray(c.segment_ids)&&c.segment_ids.length>0&&c.segment_ids.length<=linkIds.size&&new Set(c.segment_ids).size===c.segment_ids.length&&c.segment_ids.every(s=>typeof s==='string'&&linkIds.has(s)))
    &&new Set(v.excluded_ids).size===v.excluded_ids.length&&v.excluded_ids.every(id=>ids.includes(id))
    &&Object.entries(v.assumptions).every(([id,label])=>linkIds.has(id)&&(label===''||shadeLabels.includes(label as never)))
}
export function planningWorkspace(state:WorkflowState){return state.planning_workspace??defaultPlanningWorkspace(state.items)}
export function updatePlanning(state:WorkflowState,update:(p:PlanningWorkspace)=>PlanningWorkspace):WorkflowState {
  const workspace=update(structuredClone(planningWorkspace(state)))
  if(!validPlanningWorkspace(workspace,state.items))throw new Error('Invalid planning inputs or campus path selection.')
  return {...state,revision:state.revision+1,planning_workspace:workspace}
}
export function planningCandidates(state:WorkflowState):InterventionCandidate[] {
  const workspace=planningWorkspace(state)
  return state.items.map(i=>{
    const c=workspace.candidates[i.intervention_id],cost=parseBudget(c.cost),benefit=parseBudget(c.benefit)
    if(cost===null||benefit===null)throw new Error(`${i.intervention_id}: enter whole non-negative assumed cost and total benefit score, up to 1,000,000,000.`)
    return {...i,segment_ids:[...c.segment_ids],cost_rm:cost,modelled_benefit:benefit,cost_source_status:'demo_fixture',data_status:'simulated'}
  })
}
/** Always derive from the latest PUBLISHED snapshot. Unpublished drafts are excluded. */
export function calculatePlanning(state:WorkflowState) {
  const workspace=planningWorkspace(state),items=planningCandidates(state)
  const plan=calculatePlan(items,workspace.budget,workspace.excluded_ids)
  return {items,plan,scenario:buildScenario(currentSnapshot(state),items,plan.ids,workspace.assumptions)}
}
