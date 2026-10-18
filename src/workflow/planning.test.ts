import { describe, expect, it } from 'vitest'
import { optimise } from '../domain'
import { compareRoutes } from '../routing/compare'
import { campusWideGraph } from '../routing/graph'
import { currentSnapshot, initialWorkflow } from './model'
import { publishMapShade, stageMapShade } from './mapShade'
import { calculatePlanning, planningWorkspace, updatePlanning, validPlanningWorkspace } from './planning'
import { decodeWorkflow, loadWorkflow } from './storage'
const now='2026-10-18T19:00:00+08:00',link='DEMO-REF-001',other='DEMO-REF-002'
const armed=()=>updatePlanning(initialWorkflow(),p=>({...p,has_calculated:true}))

describe('current campus budget and simulation workspace',()=>{
  it('maps proposals to visible reference links without rewriting historical candidates or baseline',()=>{
    const s=armed(),before=initialWorkflow(),r=calculatePlanning(s)
    expect(r.items.every(i=>i.segment_ids.every(id=>id.startsWith('DEMO-REF-')))).toBe(true)
    expect(s.items).toEqual(before.items);expect(s.snapshots).toEqual(before.snapshots)
    expect(r.plan.ids).toEqual(['INT-03']);expect(r.plan.cost).toBe(20000);expect(r.plan.benefit).toBe(92)
    expect(r.scenario.projections.map(p=>p.segment_id)).toEqual([link]);expect(r.scenario.segments).toEqual(currentSnapshot(s).segments)
  })
  it('recomputes budget, exclusions and candidate cost/score edits',()=>{
    let s=updatePlanning(armed(),p=>({...p,budget:'10000'}));expect(calculatePlanning(s).plan.ids).toEqual(['INT-02'])
    s=updatePlanning(s,p=>({...p,budget:'20000',excluded_ids:['INT-03']}));expect(calculatePlanning(s).plan.ids).toEqual(['INT-01'])
    s=updatePlanning(s,p=>({...p,candidates:{...p.candidates,'INT-04':{...p.candidates['INT-04'],benefit:'100',cost:'5000'}}}))
    expect(calculatePlanning(s).plan.ids).toContain('INT-04');expect(calculatePlanning(s).plan.cost).toBeLessThanOrEqual(20000);expect(calculatePlanning(s).plan.ids).not.toContain('INT-03')
  })
  it('handles zero budget and all exclusions; invalid raw numeric drafts remain correctable',()=>{
    for(const s of [updatePlanning(armed(),p=>({...p,budget:'0'})),updatePlanning(armed(),p=>({...p,excluded_ids:Object.keys(p.candidates)}))]){
      const r=calculatePlanning(s);expect(r.plan.ids).toEqual([]);expect(r.plan.cost).toBe(0);expect(r.scenario.segments).toEqual(currentSnapshot(s).segments)
    }
    for(const value of ['','-1','1.5','1000000001']){
      expect(()=>calculatePlanning(updatePlanning(armed(),p=>({...p,budget:value})))).toThrow(/whole RM/)
      expect(()=>calculatePlanning(updatePlanning(armed(),p=>({...p,candidates:{...p.candidates,'INT-01':{...p.candidates['INT-01'],cost:value}}})))).toThrow(/INT-01/)
    }
  })
  it('uses reassigned current multi-link targets without multiplying total benefit',()=>{
    const s=updatePlanning(armed(),p=>({...p,candidates:{...p.candidates,'INT-03':{...p.candidates['INT-03'],segment_ids:[link,other]}}}))
    const r=calculatePlanning(s);expect(r.plan.benefit).toBe(92);expect(r.scenario.projections.map(p=>p.segment_id)).toEqual([link,other])
    expect(()=>updatePlanning(s,p=>({...p,candidates:{...p.candidates,'INT-03':{...p.candidates['INT-03'],segment_ids:['DEMO-S01']}}}))).toThrow()
  })
  it('explicit projected colors never change Resident routing, published labels or input state',()=>{
    const s=armed(),before=JSON.stringify(s),base=currentSnapshot(s)
    const planned=updatePlanning(s,p=>({...p,assumptions:{[link]:'mostly_shaded'}})),r=calculatePlanning(planned),segment=r.scenario.segments.find(s=>s.segment_id===link)!
    expect(segment.shade_label).toBe('mostly_shaded');expect(segment.shade_data_status).toBe('simulated');expect(segment.shade_source).toBeUndefined()
    expect(currentSnapshot(planned)).toEqual(base);expect(JSON.stringify(s)).toBe(before)
    expect(compareRoutes(currentSnapshot(planned),campusWideGraph,'MAIN-GATE','KLINIK-UTM')).toEqual(compareRoutes(base,campusWideGraph,'MAIN-GATE','KLINIK-UTM'))
  })
  it('refreshes from new publications, excludes pending drafts and reapplies only explicit selected projections',()=>{
    const s=updatePlanning(armed(),p=>({...p,assumptions:{[link]:'mostly_shaded'}})),original=JSON.stringify(s.snapshots[0])
    const draft=stageMapShade(stageMapShade(s,[link],'mixed',now),[other],'mostly_exposed',now)
    expect(calculatePlanning(draft).scenario.baseline_version).toBe(s.current_version)
    expect(calculatePlanning(draft).scenario.segments.find(s=>s.segment_id===other)?.shade_label).toBe('unknown')
    const published=publishMapShade(draft,'Demo','Synthetic update',true,now),r=calculatePlanning(published)
    expect(r.scenario.baseline_version).toBe(published.current_version);expect(r.scenario.projections[0].baseline_label).toBe('mixed');expect(r.scenario.projections[0].projected_label).toBe('mostly_shaded')
    expect(r.scenario.segments.find(s=>s.segment_id===other)?.shade_label).toBe('mostly_exposed');expect(currentSnapshot(published).segments.find(s=>s.segment_id===link)?.shade_label).toBe('mixed');expect(JSON.stringify(published.snapshots[0])).toBe(original)
    expect(calculatePlanning(updatePlanning(published,p=>({...p,assumptions:{}}))).scenario.segments).toEqual(currentSnapshot(published).segments)
    const excluded=updatePlanning(published,p=>({...p,budget:'10000'}))
    expect(calculatePlanning(excluded).scenario.segments.find(s=>s.segment_id===link)?.shade_data_status).not.toBe('simulated');expect(planningWorkspace(excluded).assumptions[link]).toBe('mostly_shaded')
  })
  it('persists optional planning separately and recovers only damaged planning, preserving valid map/history',()=>{
    const s=publishMapShade(stageMapShade(armed(),[other],'mixed',now),'Demo','Synthetic',true,now)
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
    const bad={...s,planning_workspace:{...planningWorkspace(s),assumptions:{fake:'mostly_shaded'}}},loaded=loadWorkflow(JSON.stringify(bad))
    expect(loaded.warning).toContain('Published map and history were preserved');expect(loaded.state.snapshots).toEqual(s.snapshots);expect(loaded.state.current_version).toBe(s.current_version);expect(loaded.state.planning_workspace).toBeUndefined()
  })
  it('validates known unique candidate targets and exclusions',()=>{
    const s=armed(),p=planningWorkspace(s);expect(validPlanningWorkspace(p,s.items)).toBe(true)
    for(const bad of [{...p,excluded_ids:['INT-01','INT-01']},{...p,excluded_ids:['bad']},{...p,candidates:{}},{...p,candidates:{...p.candidates,'INT-03':{...p.candidates['INT-03'],segment_ids:[link,link]}}}])expect(validPlanningWorkspace(bad,s.items)).toBe(false)
  })
})
describe('portfolio overlap and exhaustive search',()=>{
  it('uses per-link maxima for partially overlapping proposals, with no duplicated score',()=>{
    const template=initialWorkflow().items[0],items=[{...template,intervention_id:'A',cost_rm:1,modelled_benefit:100,segment_ids:['A','B','B'],constraints:[]},{...template,intervention_id:'B',cost_rm:1,modelled_benefit:100,segment_ids:['B','C'],constraints:[]}]
    expect(optimise(items,1,[]).benefit).toBe(100);expect(optimise(items,2,[]).benefit).toBe(150);expect(optimise(items,2,[]).ids).toEqual(['A','B'])
  })
  it('beats the affordable highest-score-per-RM single-candidate heuristic at RM20,000',()=>{
    const items=initialWorkflow().items,bestRatio=[...items].filter(i=>i.cost_rm<=20000).sort((a,b)=>b.modelled_benefit/b.cost_rm-a.modelled_benefit/a.cost_rm)[0]
    expect(bestRatio.intervention_id).toBe('INT-01');expect(optimise(items,20000,[]).benefit).toBeGreaterThan(bestRatio.modelled_benefit)
  })
})
