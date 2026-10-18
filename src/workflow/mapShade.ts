import { campusRouteNodes, campusWalkLinks } from '../campusWalkways'
import { compareRoutes } from '../routing/compare'
import { campusWideGraph } from '../routing/graph'
import { currentSnapshot, shadeLabels, validLocalTime } from './model'
import type { CurrentSegment, MapShadeAssignment, MapShadePublication, ShadeSource, WorkflowState } from './model'
import type { ShadeLabel } from '../types'

export const mapShadeLabels: Record<ShadeLabel,string> = {
  mostly_exposed:'Unshaded', mixed:'Mixed shaded', mostly_shaded:'Fully shaded', unknown:'Unknown / needs survey',
}
const referenceIds=new Set(campusWalkLinks.map(l=>l.segment_id))
function requireValue(ok:unknown,message:string):asserts ok { if(!ok)throw new Error(message) }
export function validMapAssignments(value:unknown):value is MapShadeAssignment[] {
  return Array.isArray(value)&&value.length>0&&value.length<=referenceIds.size&&new Set(value.map(a=>a?.segment_id)).size===value.length&&value.every(a=>a&&referenceIds.has(a.segment_id)&&shadeLabels.includes(a.shade_label)&&Object.keys(a).length===2)
}
/** Select existing connected corridors only; no straight-line shortcuts or shade-dependent selection. */
export function mapRouteSelection(state:WorkflowState,from:string,to:string):string[] {
  requireValue(campusRouteNodes.some(n=>n.id===from)&&campusRouteNodes.some(n=>n.id===to)&&from!==to,'Choose two different reference points.')
  const route=compareRoutes(currentSnapshot(state),campusWideGraph,from,to).shortest
  requireValue(route,'No connected route between these points. Choose another pair.')
  return route.segment_ids
}
export function stageMapShade(state:WorkflowState,ids:string[],label:ShadeLabel,now:string):WorkflowState {
  requireValue(validLocalTime(now),'Use a valid Malaysia timestamp.')
  requireValue(ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>referenceIds.has(id))&&shadeLabels.includes(label),'Select valid map corridors and a shade category.')
  requireValue(!state.map_shade_draft||state.map_shade_draft.base_dataset_version===state.current_version,'The published map changed. Review the draft against the latest map first.')
  const assignments=new Map((state.map_shade_draft?.assignments??[]).map(a=>[a.segment_id,a]))
  ids.forEach(id=>assignments.set(id,{segment_id:id,shade_label:label}))
  return {...state,revision:state.revision+1,map_shade_draft:{base_dataset_version:state.current_version,updated_at:now,assignments:[...assignments.values()].sort((a,b)=>a.segment_id.localeCompare(b.segment_id))}}
}
export function removeMapShadeDraft(state:WorkflowState,ids?:string[]):WorkflowState {
  const draft=state.map_shade_draft
  requireValue(draft,'No Developer draft to remove.')
  const assignments=ids?draft.assignments.filter(a=>!ids.includes(a.segment_id)):[]
  return {...state,revision:state.revision+1,map_shade_draft:assignments.length?{...draft,assignments}:null}
}
export function rebaseMapShadeDraft(state:WorkflowState,now:string):WorkflowState {
  requireValue(state.map_shade_draft&&validLocalTime(now),'No valid draft to review.')
  return {...state,revision:state.revision+1,map_shade_draft:{...state.map_shade_draft,base_dataset_version:state.current_version,updated_at:now}}
}
export function mapShadeSource(update:MapShadePublication):ShadeSource {
  return {map_publication_id:update.publication_id,observation_id:update.publication_id,method:'Manual Developer DEMO map classification',source_note:update.note,observer_label:update.created_by_label,reviewer_label:'',review_note:'Operator-confirmed DEMO classification; no field observation or independent field review claimed.',evidence_reference:'',published_at:update.created_at}
}
export function previewMapShade(state:WorkflowState):CurrentSegment[] {
  return currentSnapshot(state).segments.map(s=>{
    const a=state.map_shade_draft?.assignments.find(a=>a.segment_id===s.segment_id)
    return a?{...s,shade_label:a.shade_label,shade_data_status:'demo_fixture',shade_observed_at:null,shade_source:undefined}:s
  })
}
export function publishMapShade(state:WorkflowState,by:string,note:string,confirmed:boolean,now:string):WorkflowState {
  const draft=state.map_shade_draft,baseline=currentSnapshot(state)
  requireValue(draft&&validMapAssignments(draft.assignments),'Save at least one Developer shade edit before publishing.')
  requireValue(draft.base_dataset_version===state.current_version,'The published map changed. Review the draft against the latest map first.')
  requireValue(confirmed,'Confirm you reviewed these DEMO shade changes before publishing.')
  requireValue(validLocalTime(now)&&typeof by==='string'&&by.trim().length>0&&by.length<=2000&&typeof note==='string'&&note.trim().length>0&&note.length<=2000,'Enter an operator label and publication note, with a valid timestamp.')
  const version=`${state.snapshots[0].dataset_version}-v${String(state.snapshots.length).padStart(6,'0')}`
  requireValue(!state.snapshots.some(s=>s.dataset_version===version),'Dataset version already exists.')
  const update:MapShadePublication={publication_id:`MAP-SHADE-${String(state.revision+1).padStart(6,'0')}`,base_dataset_version:state.current_version,dataset_version:version,assignments:draft.assignments.map(a=>({...a})),created_at:now,created_by_label:by.trim(),note:note.trim()}
  const source=mapShadeSource(update)
  const snapshot={...baseline,dataset_version:version,parent_dataset_version:baseline.dataset_version,created_at:now,created_by_label:by.trim(),change_summary:`Developer map: ${note.trim()}`,warnings:['Manual DEMO shade classification; not field-observed shade, institutional approval or a measured cooling result. Geometry remains unsurveyed.'],segments:baseline.segments.map(s=>{
    const a=update.assignments.find(a=>a.segment_id===s.segment_id)
    return a?{...s,dataset_version:version,shade_label:a.shade_label,shade_observed_at:null,shade_data_status:'demo_fixture' as const,shade_source:{...source}}:{...s,dataset_version:version}
  })}
  return {...state,revision:state.revision+1,current_version:version,snapshots:[...state.snapshots,snapshot],map_shade_draft:null,map_shade_updates:[...(state.map_shade_updates??[]),update]}
}
