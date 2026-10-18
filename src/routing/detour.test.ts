import { describe, expect, it } from 'vitest'
import { currentSnapshot, initialWorkflow } from '../workflow/model'
import type { ShadeLabel } from '../types'
import type { RouteGraph } from './graph'
import { compareRoutes, withinDistanceLimit } from './compare'

// Entirely synthetic parallel paths, not invented campus links/measurements.
function routes(paths:{id:string;length:number;shade:ShadeLabel}[]){
  const snapshot=currentSnapshot(initialWorkflow()),template=snapshot.segments[0]
  snapshot.segments=paths.map(p=>({...template,segment_id:p.id,length_m:p.length,shade_label:p.shade}))
  const graph:RouteGraph={graph_id:'SYNTHETIC-CAP-TEST',nodes:['O','D'],warnings:['Synthetic test only'],links:paths.map(p=>({edge_id:p.id,segment_id:p.id,from:'O',to:'D',bidirectional:true,data_status:'demo_fixture',verification:'pending_verification',source:'Synthetic cap test'}))}
  return compareRoutes(snapshot,graph,'O','D')
}
describe('25 percent constrained practical routing',()=>{
  it('keeps shortest distance-only, including equal-length ties, regardless of shade',()=>{
    const paths=[{id:'A',length:100,shade:'mostly_exposed' as const},{id:'B',length:100,shade:'mostly_shaded' as const}]
    for(const input of [paths,[...paths].reverse()]){
      const r=routes(input);expect(r.shortest?.segment_ids).toEqual(['A']);expect(r.exposure?.segment_ids).toEqual(['B'])
    }
    const swapped=routes(paths.map(p=>({...p,shade:p.id==='A'?'mostly_shaded':'mostly_exposed'})))
    expect(swapped.shortest?.segment_ids).toEqual(['A'])
  })
  it('rejects the globally shaded path at a 26 percent detour and explains fallback',()=>{
    const r=routes([{id:'A',length:100,shade:'mostly_exposed'},{id:'B',length:126,shade:'mostly_shaded'}])
    expect(r.distance_limit_m).toBe(125);expect(r.exposure?.segment_ids).toEqual(['A'])
    expect(r.identical_path).toBe(true);expect(r.exposure_improves_on_shortest).toBe(false)
    expect(r.warnings.join()).toContain('No better-ranked alternative')
  })
  it('accepts a path exactly at the inclusive 25 percent bound',()=>{
    const r=routes([{id:'A',length:100,shade:'mostly_exposed'},{id:'B',length:125,shade:'mostly_shaded'}])
    expect(r.exposure?.segment_ids).toEqual(['B']);expect(r.exposure?.distance_m).toBe(125)
    expect(withinDistanceLimit(125+1e-8,125)).toBe(true)
    expect(withinDistanceLimit(125.001,125)).toBe(false)
  })
  it('searches all within-cap paths rather than discarding only the global optimum',()=>{
    const r=routes([{id:'A',length:100,shade:'mostly_exposed'},{id:'B',length:120,shade:'mixed'},{id:'C',length:140,shade:'mostly_shaded'}])
    expect(r.exposure?.segment_ids).toEqual(['B']);expect(r.exposure?.exposure_cost_m).toBe(60)
    expect(r.exposure_improves_on_shortest).toBe(true)
    expect(r.exposure!.distance_m).toBeLessThanOrEqual(r.shortest!.distance_m*1.25)
  })
  it('does not present a worse score as a shade improvement',()=>{
    const r=routes([{id:'A',length:100,shade:'mixed'},{id:'B',length:110,shade:'mostly_exposed'}])
    expect(r.exposure?.segment_ids).toEqual(['A']);expect(r.exposure_improves_on_shortest).toBe(false)
  })
  it('breaks permitted equal-cost ties by distance then stable IDs',()=>{
    const paths=[{id:'C',length:125,shade:'mostly_shaded' as const},{id:'B',length:120,shade:'mostly_shaded' as const},{id:'A',length:120,shade:'mostly_shaded' as const},{id:'S',length:100,shade:'mostly_exposed' as const}]
    for(const input of [paths,[...paths].reverse()])expect(routes(input).exposure?.segment_ids).toEqual(['A'])
  })
})
