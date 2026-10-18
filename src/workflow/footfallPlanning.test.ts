import { describe, expect, it } from 'vitest'
import { demoCampusFootfall, demoFootfallWindow, footfallForSegment } from '../demoFootfall'
import { campusWalkLinks } from '../campusWalkways'
import { calculateFootfallPlanning, defaultFootfallPlanning, footfallBenefit, footfallPlanningWorkspace, footfallRows, setPlanningMode, topFootfall, treatmentEstimate, updateFootfallPlanning, validFootfallPlanning } from './footfallPlanning'
import { currentSnapshot, initialWorkflow } from './model'
import { decodeWorkflow, loadWorkflow } from './storage'
import { publishMapShade, stageMapShade } from './mapShade'
import { updatePlanning } from './planning'
import { compareRoutes } from '../routing/compare'
import { campusWideGraph } from '../routing/graph'
const now='2026-10-18T20:00:00+08:00'
const armed=()=>updateFootfallPlanning(initialWorkflow(),p=>({...p,has_calculated:true}))
const rankOne=()=>topFootfall(currentSnapshot(initialWorkflow()))[0]

describe('fictional current-map footfall inputs',()=>{
  it('covers exactly the current map with reproducible, properly labelled comparable counts',()=>{
    expect(demoCampusFootfall).toHaveLength(campusWalkLinks.length)
    expect(new Set(demoCampusFootfall.map(f=>f.segment_id)).size).toBe(92)
    for(const f of demoCampusFootfall){expect(f.data_status).toBe('demo_fixture');expect(f.passes_per_hour_equivalent).toBe(f.pass_count*60/f.duration_min);expect(f.window_start).toBe(demoFootfallWindow.start);expect(f.window_end).toBe(demoFootfallWindow.end);expect(f.source_note).toContain('Fictional DEMO')}
    expect(footfallForSegment('DEMO-REF-008')?.passes_per_hour_equivalent).toBe(796)
    expect(footfallForSegment('DEMO-S01')?.passes_per_hour_equivalent).toBe(72)
    expect(footfallForSegment('missing')).toBeUndefined()
  })
  it('offers precisely ten busiest existing paths in stable order, independent of record order',()=>{
    const snapshot=currentSnapshot(initialWorkflow()),rows=topFootfall(snapshot)
    expect(rows).toHaveLength(10);expect(rows.map(r=>r.rank)).toEqual([1,2,3,4,5,6,7,8,9,10])
    expect(rows[0].record.passes_per_hour_equivalent).toBe(796);expect(rows[9].record.passes_per_hour_equivalent).toBe(728)
    expect(topFootfall(snapshot,[...demoCampusFootfall].reverse())).toEqual(rows)
    const lowest=rows[9].record.passes_per_hour_equivalent
    expect(demoCampusFootfall.filter(f=>!rows.some(r=>r.record.segment_id===f.segment_id)).every(f=>f.passes_per_hour_equivalent<=lowest)).toBe(true)
  })
  it('does not rank missing, invalid, incomparable or duplicate counts as real zero',()=>{
    const base=demoCampusFootfall[0],snapshot=currentSnapshot(initialWorkflow())
    expect(topFootfall(snapshot,[])).toEqual([])
    for(const bad of [{...base,segment_id:'missing'},{...base,pass_count:-1},{...base,passes_per_hour_equivalent:NaN},{...base,duration_min:0},{...base,window_start:'2026-10-18T13:00:00+08:00'}])expect(topFootfall(snapshot,[bad])).toEqual([])
    expect(topFootfall(snapshot,[base,base])).toHaveLength(1)
  })
})
describe('footfall-weighted treatment funding',()=>{
  it('itemises fictional trees and roof prices from current link length',()=>{
    const segment=rankOne().segment,p=defaultFootfallPlanning()
    expect(segment.length_m).toBe(21)
    expect(treatmentEstimate(segment,'trees',p)).toEqual({quantity:3,unit_cost_rm:500,cost_rm:1500})
    expect(treatmentEstimate(segment,'roof',p)).toEqual({quantity:21,unit_cost_rm:200,cost_rm:4200})
    expect(treatmentEstimate({...segment,length_m:null},'trees',p)).toBeNull()
  })
  it('connects exact footfall, length and category improvement rather than editable arbitrary scores',()=>{
    const row=rankOne(),s={...row.segment,shade_label:'mostly_exposed' as const}
    expect(footfallBenefit(s,796,'trees',false)?.benefit).toBe(796*21*0.5)
    expect(footfallBenefit(s,796,'roof',false)?.benefit).toBe(796*21)
    expect(footfallBenefit(s,398,'roof',false)?.benefit).toBe(398*21)
    expect(footfallBenefit({...s,shade_label:'mixed'},796,'trees',false)?.benefit).toBe(0)
    expect(footfallBenefit({...s,shade_label:'mostly_shaded'},796,'roof',false)?.benefit).toBe(0)
  })
  it('keeps unknown evidence unknown and requires the explicit planning-only assumption for its benefit',()=>{
    const s=armed(),row=rankOne(),before=JSON.stringify(s.snapshots)
    expect(footfallBenefit(row.segment,796,'trees',false)).toBeNull()
    expect(footfallBenefit(row.segment,796,'trees',true)?.benefit).toBe(8358)
    const noAssumption=updateFootfallPlanning(s,p=>({...p,assume_unknown_exposed:false})),r=calculateFootfallPlanning(noAssumption)
    expect(r.plan.ids).toEqual([]);expect(r.scenario.segments).toEqual(currentSnapshot(s).segments)
    expect(JSON.stringify(s.snapshots)).toBe(before)
  })
  it('genuinely recalculates budget, treatment, price and no-proposal exclusions without exceeding budget',()=>{
    let s=armed(),initial=calculateFootfallPlanning(s),id=rankOne().segment.segment_id
    expect(initial.rows).toHaveLength(10);expect(initial.plan.cost).toBe(10000)
    s=updateFootfallPlanning(s,p=>({...p,choices:Object.fromEntries(Object.keys(p.choices).map(id=>[id,'roof']))}))
    const roofs=calculateFootfallPlanning(s);expect(roofs.items.find(i=>i.segment_ids.includes(id))?.cost_rm).toBe(4200)
    const lower=calculateFootfallPlanning(updateFootfallPlanning(s,p=>({...p,budget:'10000'})))
    expect(lower.plan.ids).not.toEqual(roofs.plan.ids)
    for(const r of [lower,roofs])expect(r.plan.cost).toBeLessThanOrEqual(Number(r===lower?'10000':'20000'))
    const expensive=calculateFootfallPlanning(updateFootfallPlanning(s,p=>({...p,roof_unit_cost_rm:'1000'})))
    expect(expensive.plan.ids).not.toEqual(roofs.plan.ids)
    const excluded=calculateFootfallPlanning(updateFootfallPlanning(s,p=>({...p,choices:{...p.choices,[id]:'none'}})))
    expect(excluded.items.some(i=>i.segment_ids.includes(id))).toBe(false)
    expect(new Set(roofs.items.flatMap(i=>i.segment_ids)).size).toBe(roofs.items.length)
  })
  it('matches independent integer-budget dynamic programming and beats an affordable-single baseline',()=>{
    const s=updateFootfallPlanning(armed(),p=>({...p,budget:'7000',choices:Object.fromEntries(Object.keys(p.choices).map(id=>[id,'roof']))})),r=calculateFootfallPlanning(s)
    const dp=Array(7001).fill(0)
    for(const c of r.items)for(let b=7000;b>=c.cost_rm;b--)dp[b]=Math.max(dp[b],dp[b-c.cost_rm]+c.modelled_benefit)
    expect(r.plan.benefit).toBe(dp[7000]);expect(r.plan.benefit).toBeGreaterThan(Math.max(...r.items.filter(c=>c.cost_rm<=7000).map(c=>c.modelled_benefit)))
  })
  it('returns empty plans for zero budget/all excluded; rejects invalid numeric drafts',()=>{
    const s=armed()
    for(const p of [updateFootfallPlanning(s,p=>({...p,budget:'0'})),updateFootfallPlanning(s,p=>({...p,choices:Object.fromEntries(Object.keys(p.choices).map(id=>[id,'none']))}))])expect(calculateFootfallPlanning(p).plan.ids).toEqual([])
    for(const value of ['','-1','1.5','1000000001']){
      expect(()=>calculateFootfallPlanning(updateFootfallPlanning(s,p=>({...p,budget:value})))).toThrow(/whole RM/)
      expect(()=>calculateFootfallPlanning(updateFootfallPlanning(s,p=>({...p,tree_unit_cost_rm:value})))).toThrow(/whole RM/)
    }
  })
  it('rebuilds funding and projections after baseline publication, excluding unpublished drafts and already-shaded paths',()=>{
    const s=armed(),id=rankOne().segment.segment_id,initial=calculateFootfallPlanning(s),before=JSON.stringify(s.snapshots[0])
    expect(initial.scenario.projections.find(p=>p.segment_id===id)?.projected_label).toBe('mixed')
    const draft=stageMapShade(s,[id],'mostly_shaded',now)
    expect(calculateFootfallPlanning(draft).plan).toEqual(initial.plan)
    const pub=publishMapShade(draft,'Demo','Synthetic fully shaded baseline',true,now),r=calculateFootfallPlanning(pub)
    expect(r.scenario.baseline_version).toBe(pub.current_version);expect(r.plan.ids.some(i=>i.includes(id))).toBe(false)
    expect(r.scenario.segments.find(p=>p.segment_id===id)?.shade_label).toBe('mostly_shaded');expect(r.plan.cost).toBeLessThan(initial.plan.cost)
    expect(JSON.stringify(pub.snapshots[0])).toBe(before);expect(pub.items).toEqual(s.items)
  })
  it('does not publish or alter Resident routes when treatments/footfall settings change',()=>{
    const s=initialWorkflow(),before=JSON.stringify(s),next=updateFootfallPlanning(s,p=>({...p,has_calculated:true})),r=calculateFootfallPlanning(next)
    expect(JSON.stringify(s)).toBe(before);expect(next.snapshots).toEqual(s.snapshots);expect(next.current_version).toBe(s.current_version)
    expect(r.scenario.segments.some(p=>p.shade_data_status==='simulated')).toBe(true)
    expect(compareRoutes(currentSnapshot(next),campusWideGraph,'MAIN-GATE','KLINIK-UTM')).toEqual(compareRoutes(currentSnapshot(s),campusWideGraph,'MAIN-GATE','KLINIK-UTM'))
  })
  it('persists settings and mode separately from saved manual proposals and safely recovers damaged optional inputs',()=>{
    let s=updatePlanning(armed(),p=>({...p,budget:'10000',has_calculated:true}))
    s=setPlanningMode(s,'footfall');s=updateFootfallPlanning(s,p=>({...p,budget:'7000'}))
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s);expect(s.planning_workspace?.budget).toBe('10000');expect(footfallPlanningWorkspace(s).budget).toBe('7000')
    s=publishMapShade(stageMapShade(s,[rankOne().segment.segment_id],'mixed',now),'Demo','Synthetic',true,now)
    const bad={...s,footfall_planning_workspace:{...footfallPlanningWorkspace(s),choices:{bad:'roof'}}},loaded=loadWorkflow(JSON.stringify(bad))
    expect(loaded.warning).toContain('Published map and history were preserved');expect(loaded.state.snapshots).toEqual(s.snapshots);expect(loaded.state.planning_workspace).toEqual(s.planning_workspace);expect(loaded.state.footfall_planning_workspace).toBeUndefined()
    expect(validFootfallPlanning(defaultFootfallPlanning())).toBe(true)
    expect(footfallRows(loaded.state)).toHaveLength(10)
  })
})
