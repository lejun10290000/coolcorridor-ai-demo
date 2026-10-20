import type { CalculatedRoute } from './compare'
import type { DatasetSnapshot } from '../workflow/model'

export interface WalkSession {route:CalculatedRoute;snapshot:DatasetSnapshot;next_index:number}

/** Keep the chosen path and its evidence fixed until the Resident exits the walkthrough. */
export function beginWalk(route:CalculatedRoute,snapshot:DatasetSnapshot):WalkSession {
  const nodes=route.node_ids
  if(route.dataset_version!==snapshot.dataset_version||nodes.length<2||nodes.length!==route.segment_ids.length+1||route.edges.length!==route.segment_ids.length||new Set(nodes).size!==nodes.length)throw new Error('Choose a complete connected route before starting the walk.')
  for(let i=0;i<route.edges.length;i++){
    const edge=route.edges[i],segment=snapshot.segments.find(s=>s.segment_id===route.segment_ids[i])
    if(edge.segment_id!==route.segment_ids[i]||!segment||segment.dataset_version!==snapshot.dataset_version||segment.shade_data_status==='simulated'||!(edge.from===nodes[i]&&edge.to===nodes[i+1]||edge.bidirectional&&edge.to===nodes[i]&&edge.from===nodes[i+1]))throw new Error('Route points do not match the selected map path.')
  }
  return {route:structuredClone(route),snapshot:structuredClone(snapshot),next_index:1}
}
export function walkProgress(walk:WalkSession){
  const nodes=walk.route.node_ids,complete=walk.next_index===nodes.length
  return {complete,current:nodes[walk.next_index-1],next:complete?null:nodes[walk.next_index],confirmed:walk.next_index-1,total:nodes.length-1}
}
export const advanceWalk=(walk:WalkSession):WalkSession=>({...walk,next_index:Math.min(walk.route.node_ids.length,walk.next_index+1)})
export const previousWalkPoint=(walk:WalkSession):WalkSession=>({...walk,next_index:Math.max(1,walk.next_index-1)})
