import { describe, expect, it } from 'vitest'
import { currentSnapshot, initialWorkflow, buildScenario, advanceInstallation, recordObservation, reviewObservation, publishIntervention } from '../workflow/model'
import { compareRoutes } from './compare'
import { defaultRoutingConfig, demoGraph } from './graph'
import type { DatasetSnapshot } from '../workflow/model'
import type { ShadeLabel } from '../types'

function snapshot(patches:Record<string,{length_m?:number|null;shade_label?:ShadeLabel}>={}):DatasetSnapshot {
  const base=currentSnapshot(initialWorkflow())
  return {...base,segments:base.segments.map(s=>({...s,...patches[s.segment_id]}))}
}
describe('deterministic illustrative shortest and exposure routes',()=>{
  it('calculates 190 m as shortest and retains two same-path objective results',()=>{
    const r=compareRoutes(snapshot())
    expect(r.shortest?.segment_ids).toEqual(['DEMO-S03']);expect(r.shortest?.distance_m).toBe(190)
    expect(r.exposure?.segment_ids).toEqual(['DEMO-S03']);expect(r.identical_path).toBe(true)
    expect(r.shortest?.duration_seconds).toBe(159);expect(r.exposure?.exposure_cost_m).toBe(0)
    expect(r.warnings.join()).toContain('S04 is not routed')
  })
  it('searches by summed lengths rather than a fixed path ID',()=>{
    const r=compareRoutes(snapshot({'DEMO-S01':{length_m:40},'DEMO-S02':{length_m:50},'DEMO-S03':{length_m:120}}))
    expect(r.shortest?.segment_ids).toEqual(['DEMO-S01','DEMO-S02']);expect(r.shortest?.distance_m).toBe(90)
    expect(r.shortest?.duration_seconds).toBe(75)
  })
  it('reads current shade labels to choose a different exposure path and exact metrics',()=>{
    const r=compareRoutes(snapshot({'DEMO-S01':{shade_label:'mostly_shaded'},'DEMO-S02':{shade_label:'mostly_shaded'},'DEMO-S03':{shade_label:'mostly_exposed'}}))
    expect(r.shortest?.segment_ids).toEqual(['DEMO-S03']);expect(r.exposure?.segment_ids).toEqual(['DEMO-S01','DEMO-S02'])
    expect(r.exposure?.distance_m).toBe(198);expect(r.exposure?.exposure_cost_m).toBe(0);expect(r.exposure?.duration_seconds).toBe(165)
    expect(r.identical_path).toBe(false)
  })
  it('keeps unknown separate from exposure evidence, with its confirmed conservative penalty',()=>{
    const r=compareRoutes(snapshot({'DEMO-S01':{shade_label:'unknown'},'DEMO-S02':{shade_label:'mixed'},'DEMO-S03':{length_m:null}}))
    expect(r.exposure?.segment_ids).toEqual(['DEMO-S01','DEMO-S02'])
    expect(r.exposure?.unknown_length_m).toBe(92);expect(r.exposure?.unknown_penalty_m).toBe(92)
    expect(r.exposure?.known_label_cost_m).toBe(53);expect(r.exposure?.exposure_cost_m).toBe(145)
    expect(r.exposure?.known_length_m).toBe(106);expect(r.exposure?.known_coverage_pct).toBeCloseTo(106/198*100)
    expect(r.exposure?.edges[0].shade_label).toBe('unknown');expect(r.exposure?.warnings.join()).toContain('not described as measured exposed')
  })
  it('does not treat DEMO known-label coverage as measured shade evidence',()=>{
    const r=compareRoutes(snapshot());expect(r.exposure?.known_coverage_pct).toBe(100)
    expect(r.exposure?.observed_reviewed_length_m).toBe(0);expect(r.exposure?.warnings.join()).toContain('does not establish measured')
  })
  it('uses distance then stable IDs to break equal exposure ties',()=>{
    const same=snapshot({'DEMO-S01':{shade_label:'mostly_shaded'},'DEMO-S02':{shade_label:'mostly_shaded'},'DEMO-S03':{shade_label:'mostly_shaded',length_m:198}})
    for(const links of [demoGraph.links,[...demoGraph.links].reverse()])expect(compareRoutes(same,{...demoGraph,links}).exposure?.segment_ids).toEqual(['DEMO-S01','DEMO-S02'])
    expect(compareRoutes({...same,segments:same.segments.map(s=>s.segment_id==='DEMO-S03'?{...s,length_m:197}:s)}).exposure?.segment_ids).toEqual(['DEMO-S03'])
  })
  it.each([null,NaN,Infinity,0,-1])('never substitutes image pixels for invalid length %s',length=>{
    const r=compareRoutes(snapshot({'DEMO-S01':{length_m:length},'DEMO-S03':{length_m:length}}))
    expect(r.shortest).toBeNull();expect(r.exposure).toBeNull();expect(r.warnings.join()).toContain('No feasible illustrative path')
  })
  it('rejects invalid endpoints, incomplete topology, mixed versions and duplicate IDs',()=>{
    expect(compareRoutes(snapshot(),demoGraph,'MAIN-GATE','MAIN-GATE').shortest).toBeNull()
    expect(compareRoutes(snapshot(),demoGraph,'NO-NODE','KLINIK').shortest).toBeNull()
    expect(compareRoutes(snapshot(),{...demoGraph,nodes:['MAIN-GATE','KLINIK']}).shortest).toBeNull()
    const mixed=snapshot();mixed.segments[0].dataset_version='old'
    expect(compareRoutes(mixed).shortest).toBeNull()
    const duplicate=snapshot();duplicate.segments.push(duplicate.segments[0]);expect(compareRoutes(duplicate).shortest).toBeNull()
    expect(compareRoutes(snapshot(),{...demoGraph,links:[]}).shortest).toBeNull()
  })
  it('supports reversed endpoint traversal using graph connectivity',()=>{
    const r=compareRoutes(snapshot({'DEMO-S03':{length_m:null}}),demoGraph,'KLINIK','MAIN-GATE')
    expect(r.shortest?.segment_ids).toEqual(['DEMO-S02','DEMO-S01']);expect(r.shortest?.node_ids).toEqual(['KLINIK','DEMO-JUNCTION','MAIN-GATE'])
  })
  it('has configurable prototype weights but cannot set unknown to zero',()=>{
    const r=compareRoutes(snapshot({'DEMO-S03':{length_m:null}}),demoGraph,'MAIN-GATE','KLINIK',{...defaultRoutingConfig,shade_weights:{...defaultRoutingConfig.shade_weights,mixed:.25}})
    expect(r.exposure?.exposure_cost_m).toBe(92+106*.25)
    expect(compareRoutes(snapshot(),demoGraph,'MAIN-GATE','KLINIK',{...defaultRoutingConfig,shade_weights:{...defaultRoutingConfig.shade_weights,unknown:0}}).shortest).toBeNull()
  })
  it('refuses scenario inputs and does not mutate published source data',()=>{
    const state=initialWorkflow(),base=currentSnapshot(state),before=JSON.stringify(base)
    const scenario=buildScenario(base,state.items,['INT-03'],{'DEMO-S03':'mostly_exposed'})
    expect(compareRoutes({...base,segments:scenario.segments}).shortest).toBeNull()
    expect(compareRoutes(base).exposure?.exposure_cost_m).toBe(0);expect(JSON.stringify(base)).toBe(before)
  })
  it('recalculates a coherent new result only after actual publication',()=>{
    let state=initialWorkflow();const original=compareRoutes(currentSnapshot(state))
    for(const to of ['approved_demo','under_construction','installed_pending_verification'] as const)state=advanceInstallation(state,'INT-03',to,'Demo','Exercise','2026-10-17T18:00:00+08:00')
    state=recordObservation(state,{intervention_id:'INT-03',segment_id:'DEMO-S03',record_kind:'demo',field_attested:false,shade_label:'mostly_exposed',observed_at:'2026-10-17T12:00:00+08:00',method:'DEMO',source_note:'Synthetic test',observer_label:'Demo observer',notes:'Fictional test only',evidence_reference:''},'2026-10-17T18:00:00+08:00')
    const id=state.observations[0].observation_id
    state=reviewObservation(state,id,'under_review','Demo reviewer','Review','mostly_exposed','2026-10-17T18:00:00+08:00')
    state=reviewObservation(state,id,'verified','Demo reviewer','Verified DEMO','mostly_exposed','2026-10-17T18:00:00+08:00')
    expect(compareRoutes(currentSnapshot(state))).toEqual(original)
    state=publishIntervention(state,'INT-03','Demo','Publish DEMO','2026-10-17T18:00:00+08:00')
    const changed=compareRoutes(currentSnapshot(state))
    expect(changed.dataset_version).toBe(state.current_version);expect(changed.exposure?.segment_ids).toEqual(['DEMO-S01','DEMO-S02'])
    expect(changed.exposure?.exposure_cost_m).toBe(145);expect(changed.exposure?.edges.map(e=>e.segment_id)).toEqual(changed.exposure?.segment_ids)
    expect(changed.shortest?.distance_m).toBe(190)
  })
})
