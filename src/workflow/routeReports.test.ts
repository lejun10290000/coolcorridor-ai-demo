import { describe, expect, it } from 'vitest'
import { compareRoutes } from '../routing/compare'
import { campusWideGraph } from '../routing/graph'
import type { ReportedRoute } from '../types'
import { currentSnapshot, initialWorkflow, reportsForSegment, reviewReport, submitReport } from './model'
import type { WorkflowState } from './model'
import { publishMapShade, rebaseMapShadeDraft, stageMapShade } from './mapShade'
import { acceptRouteReport, manualReportRoute, submitRouteReport, validReportedRoute } from './routeReports'
import { decodeWorkflow } from './storage'
const now='2026-10-18T19:00:00+08:00'
function path(s:WorkflowState,from='MAIN-GATE',to='RAZAK-ENTRANCE',objective:'shortest'|'exposure'='shortest'):ReportedRoute{
  const p=compareRoutes(currentSnapshot(s),campusWideGraph,from,to)[objective]!
  return {from_node:from,to_node:to,objective,segment_ids:[...p.segment_ids],node_ids:[...p.node_ids],dataset_version:p.dataset_version}
}
function submitted(s=initialWorkflow(),route=path(s)){
  return submitRouteReport(s,{route,category:'broken shade structure',description:'Synthetic report: canopy broken along this selected path.'},now)
}
function publish(s:WorkflowState,ids:string[],label:'mostly_shaded'|'mostly_exposed'){
  return publishMapShade(stageMapShade(s,ids,label,now),'Demo','Manual demo map change',true,now)
}
function freeze<T>(v:T):T{if(v&&typeof v==='object'){Object.freeze(v);Object.values(v).forEach(freeze)}return v}
describe('Resident point-to-point reports and Developer acceptance',()=>{
  it('builds a report from independent map points using connected corridors, regardless of the shaded-route choice',()=>{
    const s=publish(initialWorkflow(),['DEMO-REF-081','DEMO-REF-082'],'mostly_shaded'),snapshot=currentSnapshot(s)
    expect(compareRoutes(snapshot,campusWideGraph,'NORTH-WEST','L1-ACCESS').exposure!.segment_ids).toEqual(['DEMO-REF-081','DEMO-REF-082'])
    const route=manualReportRoute(snapshot,'NORTH-WEST','L1-ACCESS')!
    expect(route.segment_ids).toEqual(['DEMO-REF-080']);expect(route.selection_source).toBe('map_points');expect(route.objective).toBe('shortest')
    const reported=submitted(s,route);expect(decodeWorkflow(JSON.stringify(reported))).toEqual(reported)
    expect(validReportedRoute(s,{...route,objective:'exposure'})).toBe(false)
  })
  it('requires both distinct connected manual report points and rejects unsupported selection provenance',()=>{
    const s=initialWorkflow(),snapshot=currentSnapshot(s)
    for(const [from,to] of [['',''],['MAIN-GATE',''],['MAIN-GATE','MAIN-GATE'],['PA9-SPUR','MAIN-GATE'],['invented','MAIN-GATE']])expect(manualReportRoute(snapshot,from,to)).toBeNull()
    const route=manualReportRoute(snapshot,'MAIN-GATE','INNER-GATE')!
    expect(validReportedRoute(s,{...route,selection_source:'routing_lists'} as unknown as ReportedRoute)).toBe(false)
    const accepted=acceptRouteReport(submitted(s,route),'REPORT-000001','Demo','Accept saved manual points',now)
    expect(accepted.reports[0].route!.selection_source).toBe('map_points');expect(decodeWorkflow(JSON.stringify(accepted))).toEqual(accepted)
  })
  it('freezes the exact selected route and description without changing published shade',()=>{
    const base=freeze(initialWorkflow()),route=path(base),s=submitted(base,route)
    expect(s.snapshots).toEqual(base.snapshots);expect(s.current_version).toBe(base.current_version)
    expect(s.reports[0].route).toEqual(route);expect(s.reports[0].review_status).toBe('submitted')
    route.segment_ids.reverse();expect(s.reports[0].route!.segment_ids).not.toEqual(route.segment_ids)
    for(const id of s.reports[0].route!.segment_ids)expect(reportsForSegment(s.reports,id)).toHaveLength(1)
    expect(reportsForSegment(s.reports,'DEMO-REF-003')).toEqual([])
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it('rejects missing description, invalid category, stale version, invented/empty/reversed paths and invalid endpoints',()=>{
    const base=initialWorkflow(),route=path(base),input={route,category:'broken shade structure',description:'Synthetic issue'}
    for(const patch of [{description:'  '},{description:'x'.repeat(2001)},{category:'invented category'},{route:{...route,dataset_version:'stale'}},{route:{...route,segment_ids:[]}},{route:{...route,segment_ids:[...route.segment_ids].reverse()}},{route:{...route,to_node:route.from_node}},{route:{...route,to_node:'PA9-SPUR'}}])expect(()=>submitRouteReport(base,{...input,...patch},now)).toThrow()
  })
  it('accepts once, records review stages and publishes all saved links mixed without changing unrelated evidence',()=>{
    const base=freeze(submitted()),before=JSON.stringify(base),id=base.reports[0].report_id
    expect(()=>acceptRouteReport(base,id,'Demo','',now)).toThrow()
    expect(()=>reviewReport(base,id,'verified','Demo','Bypass',now)).toThrow()
    const s=acceptRouteReport(base,id,'Demo reviewer','Checked the reported path; demo acceptance',now)
    expect(JSON.stringify(base)).toBe(before);expect(s.snapshots).toHaveLength(2);expect(s.snapshots[0]).toEqual(base.snapshots[0])
    const r=s.reports[0];expect(r.review_status).toBe('verified');expect(r.accepted_publication_id).toBe(s.map_shade_updates![0].publication_id)
    expect(s.report_events.map(e=>e.to_status)).toEqual(['under_review','verified'])
    for(const segment of currentSnapshot(s).segments){
      if(r.route!.segment_ids.includes(segment.segment_id)){expect(segment.shade_label).toBe('mixed');expect(segment.shade_observed_at).toBeNull();expect(segment.shade_data_status).toBe('demo_fixture')}
      else expect({...segment,dataset_version:base.current_version}).toEqual(currentSnapshot(base).segments.find(p=>p.segment_id===segment.segment_id))
    }
    expect(s.items).toEqual(base.items);expect(s.observations).toEqual(base.observations);expect(s.lifecycle_events).toEqual(base.lifecycle_events)
    expect(()=>acceptRouteReport(s,id,'Demo','Again',now)).toThrow();expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it('supports acceptance after review and rejection with no map change; rejects final/legacy acceptance',()=>{
    const base=submitted(),id=base.reports[0].report_id,reviewed=reviewReport(base,id,'under_review','Demo','Checking',now)
    expect(acceptRouteReport(reviewed,id,'Demo','Checked',now).report_events).toHaveLength(2)
    const rejected=reviewReport(base,id,'rejected','Demo','Not supported',now)
    expect(rejected.snapshots).toEqual(base.snapshots);expect(()=>acceptRouteReport(rejected,id,'Demo','No',now)).toThrow()
    const legacy=submitReport(initialWorkflow(),{segment_id:'DEMO-S01',category:'other',comment_optional:'Old report'},now)
    expect(()=>acceptRouteReport(legacy,legacy.reports[0].report_id,'Demo','No saved route',now)).toThrow();expect(decodeWorkflow(JSON.stringify(legacy))).toEqual(legacy)
  })
  it('accepts the original frozen path even after routing selects a different path',()=>{
    let s=publish(initialWorkflow(),['DEMO-REF-081','DEMO-REF-082'],'mostly_shaded')
    const route=path(s,'NORTH-WEST','L1-ACCESS','exposure');expect(route.segment_ids).toEqual(['DEMO-REF-081','DEMO-REF-082'])
    s=submitted(s,route);s=publish(s,['DEMO-REF-081','DEMO-REF-082'],'mostly_exposed');s=publish(s,['DEMO-REF-080'],'mostly_shaded')
    expect(path(s,'NORTH-WEST','L1-ACCESS','exposure').segment_ids).toEqual(['DEMO-REF-080'])
    s=acceptRouteReport(s,s.reports[0].report_id,'Demo','Accept saved path only',now)
    expect(s.map_shade_updates!.slice(-1)[0].assignments.map(a=>a.segment_id)).toEqual(route.segment_ids)
    expect(currentSnapshot(s).segments.find(p=>p.segment_id==='DEMO-REF-080')!.shade_label).toBe('mostly_shaded')
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it('preserves a manual draft as stale, then permits a separate manual repair publication',()=>{
    let s=submitted();const r=s.reports[0],ids=r.route!.segment_ids
    s=stageMapShade(s,['DEMO-REF-003'],'mostly_exposed',now);const draft=s.map_shade_draft
    s=acceptRouteReport(s,r.report_id,'Demo','Valid report',now);const yellowVersion=s.current_version
    expect(s.map_shade_draft).toEqual(draft);expect(()=>publishMapShade(s,'Demo','Stale draft',true,now)).toThrow()
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
    s=rebaseMapShadeDraft(s,now);s=publish(s,ids,'mostly_shaded')
    expect(s.reports[0].review_status).toBe('verified');expect(s.reports[0].accepted_publication_id).toBeDefined()
    for(const id of ids){expect(currentSnapshot(s).segments.find(p=>p.segment_id===id)!.shade_label).toBe('mostly_shaded');expect(s.snapshots.find(p=>p.dataset_version===yellowVersion)!.segments.find(p=>p.segment_id===id)!.shade_label).toBe('mixed')}
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it('rejects forged accepted reports, missing audit links, non-mixed acceptance and tampered saved routes on reload',()=>{
    for(const mutate of [
      (s:WorkflowState)=>{delete s.reports[0].accepted_publication_id},
      (s:WorkflowState)=>{s.reports[0].route!.segment_ids=['DEMO-REF-003']},
      (s:WorkflowState)=>{s.map_shade_updates![0].source_report_id='missing-report'},
      (s:WorkflowState)=>{s.map_shade_updates![0].assignments[0].shade_label='mostly_shaded'},
      (s:WorkflowState)=>{s.reports[0].review_status='rejected'},
    ]){const base=submitted(),s=acceptRouteReport(base,base.reports[0].report_id,'Demo','Checked',now);mutate(s);expect(()=>decodeWorkflow(JSON.stringify(s))).toThrow()}
  })
})
