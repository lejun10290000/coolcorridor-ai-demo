import { describe, expect, it } from 'vitest'
import { campusWalkLinks } from '../campusWalkways'
import { compareRoutes } from '../routing/compare'
import { campusWideGraph } from '../routing/graph'
import { currentSnapshot, initialWorkflow, submitReport } from './model'
import { mapRouteSelection, previewMapShade, publishMapShade, rebaseMapShadeDraft, removeMapShadeDraft, stageMapShade } from './mapShade'
import { decodeWorkflow } from './storage'
const now='2026-10-18T18:00:00+08:00'
function publish(ids:string[],label:'mostly_exposed'|'mixed'|'mostly_shaded'='mostly_shaded'){
  return publishMapShade(stageMapShade(initialWorkflow(),ids,label,now),'Demo operator','Synthetic test classifications',true,now)
}
function freeze<T>(v:T):T{if(v&&typeof v==='object'){Object.freeze(v);Object.values(v).forEach(freeze)}return v}
describe('Developer map shade batches',()=>{
  it('selects connected existing paths, deduplicates overlaps and rejects isolated/same/unknown points',()=>{
    const s=initialWorkflow(),route=mapRouteSelection(s,'MAIN-GATE','KLINIK-UTM')
    expect(route.length).toBeGreaterThan(1);expect(route.every(id=>campusWalkLinks.some(l=>l.segment_id===id))).toBe(true)
    for(const [a,b] of [['PA9-SPUR','MAIN-GATE'],['MAIN-GATE','MAIN-GATE'],['unknown','KLINIK-UTM']])expect(()=>mapRouteSelection(s,a,b)).toThrow()
    let draft=stageMapShade(s,route,'mostly_exposed',now)
    draft=stageMapShade(draft,[route[0]],'mixed',now)
    expect(draft.map_shade_draft?.assignments).toHaveLength(route.length)
    expect(draft.map_shade_draft?.assignments.find(a=>a.segment_id===route[0])?.shade_label).toBe('mixed')
    expect(()=>stageMapShade(s,[route[0],route[0]],'mixed',now)).toThrow()
    expect(()=>stageMapShade(s,['DEMO-S01'],'mixed',now)).toThrow()
  })
  it('persists multi-category draft previews without changing published evidence or Resident routes',()=>{
    const base=freeze(initialWorkflow()),before=JSON.stringify(base),ids=['DEMO-REF-001','DEMO-REF-002','DEMO-REF-003']
    let s=stageMapShade(base,[ids[0]],'mostly_exposed',now)
    s=stageMapShade(s,[ids[1]],'mixed',now);s=stageMapShade(s,[ids[2]],'mostly_shaded',now)
    expect(previewMapShade(s).filter(p=>ids.includes(p.segment_id)).map(p=>p.shade_label)).toEqual(['mostly_exposed','mixed','mostly_shaded'])
    expect(currentSnapshot(s)).toEqual(currentSnapshot(base));expect(JSON.stringify(base)).toBe(before)
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
    expect(compareRoutes(currentSnapshot(s),campusWideGraph,'MAIN-GATE','KLINIK-UTM')).toEqual(compareRoutes(currentSnapshot(base),campusWideGraph,'MAIN-GATE','KLINIK-UTM'))
  })
  it('publishes an immutable version only on explicit confirmation and retains reports/lifecycle/evidence',()=>{
    const base=submitReport(initialWorkflow(),{segment_id:'DEMO-REF-001',category:'other',comment_optional:'Synthetic report'},now)
    const draft=freeze(stageMapShade(base,['DEMO-REF-001'],'mostly_shaded',now)),before=JSON.stringify(draft)
    expect(()=>publishMapShade(draft,'Demo','Test',false,now)).toThrow()
    expect(()=>publishMapShade(draft,'Demo','',true,now)).toThrow()
    const s=publishMapShade(draft,'Demo','Test demo update',true,now),segment=currentSnapshot(s).segments.find(p=>p.segment_id==='DEMO-REF-001')!
    expect(JSON.stringify(draft)).toBe(before);expect(s.snapshots[0]).toEqual(draft.snapshots[0]);expect(s.current_version).not.toBe(base.current_version)
    expect(s.map_shade_draft).toBeNull();expect(segment.shade_label).toBe('mostly_shaded');expect(segment.shade_data_status).toBe('demo_fixture');expect(segment.shade_observed_at).toBeNull()
    expect(segment.shade_source?.map_publication_id).toBe(s.map_shade_updates![0].publication_id)
    for(const key of ['items','lifecycle_events','observations','reports','report_events'] as const)expect(s[key]).toEqual(base[key])
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it('recalculates most shaded route within 25% while shortest is unchanged',()=>{
    // Existing northern triangle: direct corridor or a slightly longer connection via L.
    const base=initialWorkflow(),a='NORTH-WEST',b='L1-ACCESS'
    const before=compareRoutes(currentSnapshot(base),campusWideGraph,a,b)
    const shaded=campusWalkLinks.filter(l=>(l.from==='NORTH-WEST'&&l.to==='L-NORTH-WEST')||(l.from==='L-NORTH-WEST'&&l.to==='L1-ACCESS')).map(l=>l.segment_id)
    const s=publish(shaded),after=compareRoutes(currentSnapshot(s),campusWideGraph,a,b)
    expect(after.shortest!.segment_ids).toEqual(before.shortest!.segment_ids)
    expect(after.exposure!.segment_ids).not.toEqual(before.exposure!.segment_ids)
    expect(after.exposure!.exposure_cost_m).toBeLessThan(after.shortest!.exposure_cost_m)
    expect(after.exposure!.distance_m).toBeLessThanOrEqual(after.shortest!.distance_m*1.25+1e-9)
    expect(after.dataset_version).toBe(s.current_version)
  })
  it('can remove/discard a draft and requires reviewing stale edits before publication',()=>{
    let s=stageMapShade(initialWorkflow(),['DEMO-REF-001','DEMO-REF-002'],'mixed',now)
    s=removeMapShadeDraft(s,['DEMO-REF-001']);expect(s.map_shade_draft?.assignments).toHaveLength(1)
    const oldDraft=s.map_shade_draft;s=publishMapShade(s,'Demo','First',true,now)
    s={...s,map_shade_draft:oldDraft}
    expect(()=>publishMapShade(s,'Demo','Stale',true,now)).toThrow(/published map changed/)
    s=rebaseMapShadeDraft(s,now);s=publishMapShade(s,'Demo','Reviewed against latest',true,now)
    expect(s.snapshots).toHaveLength(3);expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
    s=stageMapShade(s,['DEMO-REF-001'],'mixed',now);const version=s.current_version;s=removeMapShadeDraft(s)
    expect(s.map_shade_draft).toBeNull();expect(s.current_version).toBe(version)
  })
  it('loads older state additively and rejects forged publication labels, sources and unrelated changes',()=>{
    const old=initialWorkflow();delete old.map_shade_draft;delete old.map_shade_updates
    const loaded=decodeWorkflow(JSON.stringify(old));expect(loaded.map_shade_draft).toBeNull();expect(loaded.map_shade_updates).toEqual([]);expect(loaded.snapshots).toEqual(old.snapshots)
    for(const mutate of [
      (s:ReturnType<typeof initialWorkflow>)=>{currentSnapshot(s).segments.find(p=>p.segment_id==='DEMO-REF-001')!.shade_label='mixed'},
      (s:ReturnType<typeof initialWorkflow>)=>{s.map_shade_updates![0].assignments[0].segment_id='DEMO-S01'},
      (s:ReturnType<typeof initialWorkflow>)=>{currentSnapshot(s).segments.find(p=>p.segment_id==='DEMO-REF-001')!.shade_source!.reviewer_label='Fake field reviewer'},
      (s:ReturnType<typeof initialWorkflow>)=>{currentSnapshot(s).segments.find(p=>p.segment_id==='DEMO-REF-002')!.shade_label='mixed'},
    ]){const s=publish(['DEMO-REF-001']);mutate(s);expect(()=>decodeWorkflow(JSON.stringify(s))).toThrow()}
  })
})
