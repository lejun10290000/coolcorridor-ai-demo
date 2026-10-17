import type { DataStatus, ShadeLabel, WalkwaySegment } from '../types'

export interface GraphLink { edge_id: string; segment_id: string; from: string; to: string; bidirectional: boolean; data_status: 'demo_fixture'; verification: 'pending_verification'; source: string }
export interface RouteGraph { graph_id: string; nodes: string[]; links: GraphLink[]; warnings: string[] }
/** Explicit ILLUSTRATIVE topology only. No image points or pixel-derived distances. */
export const demoGraph: RouteGraph = {
  graph_id: 'utmkul-illustrative-graph-v1',
  nodes: ['MAIN-GATE', 'DEMO-JUNCTION', 'KLINIK'],
  links: [
    {edge_id:'EDGE-S01',segment_id:'DEMO-S01',from:'MAIN-GATE',to:'DEMO-JUNCTION',bidirectional:true,data_status:'demo_fixture',verification:'pending_verification',source:'Illustrative Main Gate → junction topology; uses supplied legacy segment length, not image scale.'},
    {edge_id:'EDGE-S02',segment_id:'DEMO-S02',from:'DEMO-JUNCTION',to:'KLINIK',bidirectional:true,data_status:'demo_fixture',verification:'pending_verification',source:'Illustrative junction → Klinik topology; crossings and access unverified.'},
    {edge_id:'EDGE-S03',segment_id:'DEMO-S03',from:'MAIN-GATE',to:'KLINIK',bidirectional:true,data_status:'demo_fixture',verification:'pending_verification',source:'Illustrative alternative topology; legacy metre fixture, not surveyed length.'},
  ],
  warnings: [
    'DEMO graph and legacy metre lengths are algorithm inputs, not surveyed pedestrian navigation. Crossings, walkability and accessibility require field checks.',
    'DEMO-S04 is not routed: it joins the interior of the drawn S02 connector, but no split topology or defensible connector length is supplied.',
  ],
}
export interface RoutingConfig { shade_weights: Record<ShadeLabel, number>; walking_speed_mps: number }
export const defaultRoutingConfig: RoutingConfig = { shade_weights: {mostly_exposed:1,mixed:.5,mostly_shaded:0,unknown:1}, walking_speed_mps:1.2 }
export interface RoutingEdge extends GraphLink { length_m: number; walkable_status: WalkwaySegment['walkable_status']; shade_label: ShadeLabel; shade_data_status: DataStatus; shade_observed_at: string|null; shade_source: string }
