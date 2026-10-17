import type { DatasetSnapshot } from '../workflow/model'
import { defaultRoutingConfig, demoGraph } from './graph'
import type { RouteGraph, RoutingConfig, RoutingEdge } from './graph'
import type { ShadeLabel } from '../types'

export interface CalculatedRoute {
  objective: 'shortest'|'exposure'; dataset_version: string; graph_id: string; data_status: 'demo_fixture'
  segment_ids: string[]; node_ids: string[]; distance_m: number; duration_seconds: number
  exposure_cost_m: number; known_label_cost_m: number; unknown_penalty_m: number
  known_length_m: number; unknown_length_m: number; known_coverage_pct: number; unknown_coverage_pct: number; observed_reviewed_length_m: number
  edges: RoutingEdge[]; warnings: string[]
}
export interface RouteComparison {dataset_version:string;graph_id:string;shortest:CalculatedRoute|null;exposure:CalculatedRoute|null;identical_path:boolean;distance_limit_m:number|null;exposure_improves_on_shortest:boolean;warnings:string[];config:RoutingConfig}
interface Path {node:string;nodes:string[];edges:RoutingEdge[];distance:number;cost:number}
const labels:ShadeLabel[]=['mostly_exposed','mixed','mostly_shaded','unknown']
const statuses=['demo_fixture','sample_observed','human_reviewed','model_estimate','unknown','simulated']
const order=(a:string,b:string)=>a<b?-1:a>b?1:0
function compare(a:Path,b:Path,objective:'shortest'|'exposure') {
  const primary=objective==='shortest'?a.distance-b.distance:a.cost-b.cost
  // Equal-length shortest paths use IDs only: shade must never affect this objective.
  const secondary=objective==='shortest'?0:a.distance-b.distance
  return primary||secondary||order(a.edges.map(e=>e.segment_id).join('\u0000'),b.edges.map(e=>e.segment_id).join('\u0000'))
}
function search(edges:RoutingEdge[],origin:string,destination:string,objective:'shortest'|'exposure',config:RoutingConfig):Path|null {
  const open:Path[]=[{node:origin,nodes:[origin],edges:[],distance:0,cost:0}],best=new Map<string,Path>(),settled=new Set<string>()
  while(open.length){
    open.sort((a,b)=>compare(a,b,objective));const path=open.shift()!
    if(settled.has(path.node))continue
    if(path.node===destination)return path
    settled.add(path.node)
    for(const edge of edges){
      const next=edge.from===path.node?edge.to:edge.bidirectional&&edge.to===path.node?edge.from:null
      if(next===null||settled.has(next))continue
      const candidate:Path={node:next,nodes:[...path.nodes,next],edges:[...path.edges,edge],distance:path.distance+edge.length_m,cost:path.cost+edge.length_m*config.shade_weights[edge.shade_label]}
      if(!Number.isFinite(candidate.distance)||!Number.isFinite(candidate.cost))continue
      const old=best.get(next)
      if(!old||compare(candidate,old,objective)<0){best.set(next,candidate);open.push(candidate)}
    }
  }
  return null
}
export const maximumDetourRatio=1.25
/** Relative metre tolerance shared by all cap checks (including an exact 25% bound). */
export function withinDistanceLimit(distance:number,limit:number){return distance<=limit+1e-9*Math.max(1,limit)}
/** Enumerate loop-free paths under the cap. Correct for this tiny DEMO graph;
 * worst-case factorial in dense graphs (all simple paths), O(V) path depth. Replace with a constrained multi-label
 * algorithm before adopting a large surveyed network. Never discard only the
 * global cheapest path: a different within-cap path may be the best practical one.
 */
function practicalSearch(edges:RoutingEdge[],origin:string,destination:string,limit:number,config:RoutingConfig):Path|null{
  let best:Path|null=null
  function visit(path:Path){
    if(path.node===destination){if(!best||compare(path,best,'exposure')<0)best=path;return}
    for(const edge of edges){
      const next=edge.from===path.node?edge.to:edge.bidirectional&&edge.to===path.node?edge.from:null
      if(next===null||path.nodes.includes(next))continue
      const distance=path.distance+edge.length_m,cost=path.cost+edge.length_m*config.shade_weights[edge.shade_label]
      if(!Number.isFinite(distance)||!Number.isFinite(cost)||!withinDistanceLimit(distance,limit))continue
      visit({node:next,nodes:[...path.nodes,next],edges:[...path.edges,edge],distance,cost})
    }
  }
  visit({node:origin,nodes:[origin],edges:[],distance:0,cost:0})
  return best
}
function result(path:Path,objective:'shortest'|'exposure',snapshot:DatasetSnapshot,graph:RouteGraph,config:RoutingConfig):CalculatedRoute {
  const unknown=path.edges.filter(e=>e.shade_label==='unknown'||e.shade_data_status==='unknown').reduce((sum,e)=>sum+e.length_m,0)
  const observed=path.edges.filter(e=>e.shade_label!=='unknown'&&['sample_observed','human_reviewed'].includes(e.shade_data_status)).reduce((sum,e)=>sum+e.length_m,0)
  const known=path.distance-unknown
  const unknownPenalty=unknown*config.shade_weights.unknown
  return {objective,dataset_version:snapshot.dataset_version,graph_id:graph.graph_id,data_status:'demo_fixture',segment_ids:path.edges.map(e=>e.segment_id),node_ids:path.nodes,distance_m:path.distance,duration_seconds:Math.ceil(path.distance/config.walking_speed_mps),exposure_cost_m:path.cost,known_label_cost_m:path.cost-unknownPenalty,unknown_penalty_m:unknownPenalty,known_length_m:known,unknown_length_m:unknown,known_coverage_pct:known/path.distance*100,unknown_coverage_pct:unknown/path.distance*100,observed_reviewed_length_m:observed,edges:path.edges,warnings:[
    'DEMO / ILLUSTRATIVE graph and metre lengths. Not for navigation; no measured solar exposure or cooling outcome.',
    `Walking duration assumes ${config.walking_speed_mps} m/s, rounded up to a whole second.`,
    'Known-label coverage includes DEMO/model labels; it does not establish measured or field-verified shade coverage.',
    ...(unknown>0?[`${unknown} m of unknown shade is ranked conservatively at 1.0 × length, not described as measured exposed shade.`]:[]),
    ...path.edges.map(e=>`${e.segment_id}: ${e.shade_data_status}; shade time ${e.shade_observed_at??'unknown'}; ${e.shade_source}`),
  ]}
}
/** Snapshot is the sole source of lengths/shade. Hypothetical scenario records are refused. */
export function compareRoutes(snapshot:DatasetSnapshot,graph:RouteGraph=demoGraph,origin='MAIN-GATE',destination='KLINIK',config:RoutingConfig=defaultRoutingConfig):RouteComparison {
  const warnings=[...graph.warnings]
  const out:RouteComparison={dataset_version:snapshot.dataset_version,graph_id:graph.graph_id,shortest:null,exposure:null,identical_path:false,distance_limit_m:null,exposure_improves_on_shortest:false,warnings,config}
  const fail=(message:string)=>{warnings.push(message);return out}
  if(!Number.isFinite(config.walking_speed_mps)||config.walking_speed_mps<=0||labels.some(l=>!Number.isFinite(config.shade_weights[l])||config.shade_weights[l]<0||config.shade_weights[l]>1)||config.shade_weights.unknown!==1)return fail('Invalid routing configuration. Unknown shade must retain its confirmed conservative weight of 1.0.')
  if(new Set(graph.nodes).size!==graph.nodes.length||!graph.nodes.includes(origin)||!graph.nodes.includes(destination)||origin===destination)return fail('Choose distinct endpoints from the explicit graph; valid origin/destination topology is required.')
  if(new Set(graph.links.map(e=>e.edge_id)).size!==graph.links.length||new Set(graph.links.map(e=>e.segment_id)).size!==graph.links.length||graph.links.some(e=>e.from===e.to||!graph.nodes.includes(e.from)||!graph.nodes.includes(e.to)))return fail('Incomplete/ambiguous graph topology. No route or metric is fabricated.')
  if(new Set(snapshot.segments.map(s=>s.segment_id)).size!==snapshot.segments.length||snapshot.segments.some(s=>s.dataset_version!==snapshot.dataset_version))return fail('Inconsistent segment IDs or dataset versions; cannot calculate a coherent route comparison.')
  if(snapshot.segments.some(s=>s.shade_data_status==='simulated'))return fail('Simulated scenario inputs are not published evidence and cannot drive Resident routing.')
  const edges:RoutingEdge[]=[]
  for(const link of graph.links){
    const segment=snapshot.segments.find(s=>s.segment_id===link.segment_id)
    if(!segment){warnings.push(`${link.segment_id} missing from the published snapshot; edge excluded.`);continue}
    const length=segment.length_m
    if(length===null||!Number.isFinite(length)||length<=0||length>Number.MAX_SAFE_INTEGER){warnings.push(`${link.segment_id} has unknown/invalid metre length; edge excluded. Pixels are never substituted.`);continue}
    if(!['verified','pending_verification'].includes(segment.walkable_status)||!labels.includes(segment.shade_label)||!statuses.includes(segment.shade_data_status)){warnings.push(`${link.segment_id} has invalid walkability/shade metadata; edge excluded.`);continue}
    const shade=segment.shade_data_status==='unknown'?'unknown':segment.shade_label
    if(shade!==segment.shade_label)warnings.push(`${link.segment_id} has no defensible shade provenance; conservative unknown ranking is used.`)
    edges.push({...link,length_m:length,walkable_status:segment.walkable_status,shade_label:shade,shade_data_status:segment.shade_data_status,shade_observed_at:segment.shade_observed_at,shade_source:segment.shade_source?`${segment.shade_source.method}; ${segment.shade_source.source_note}`:segment.geometry_source})
  }
  const shortest=search(edges,origin,destination,'shortest',config)
  if(!shortest)return fail('No feasible illustrative path with complete, valid edge lengths connects these endpoints.')
  out.distance_limit_m=shortest.distance*maximumDetourRatio
  const practical=practicalSearch(edges,origin,destination,out.distance_limit_m,config)
  out.exposure_improves_on_shortest=practical!==null&&practical.cost<shortest.cost
  const exposure=out.exposure_improves_on_shortest?practical!:shortest
  if(!out.exposure_improves_on_shortest)warnings.push('No better-ranked alternative was found within the 25% detour cap; the practical route uses the shortest path.')
  out.shortest=result(shortest,'shortest',snapshot,graph,config);out.exposure=result(exposure,'exposure',snapshot,graph,config)
  out.identical_path=JSON.stringify(out.shortest.segment_ids)===JSON.stringify(out.exposure.segment_ids)
  return out
}
export function formatWalkingTime(seconds:number){const minutes=Math.floor(seconds/60),remaining=seconds%60;return minutes?`${minutes} min ${remaining} s`:`${remaining} s`}
