import { describe, expect, it } from 'vitest'
import { segments } from './fixtures'
import { campusMap, displayMidpoint, nearestDisplaySegment, segmentDisplays } from './campusMapDisplay'
import { compareRoutes } from './routing/compare'
import { campusWideGraph } from './routing/graph'
import { currentSnapshot, initialWorkflow } from './workflow/model'

describe('campus image display geometry contract', () => {
  it('covers the existing shared segment IDs with explicit pixel-only fixture provenance', () => {
    expect(Object.keys(segmentDisplays).filter(id=>id.startsWith('DEMO-REF-')).sort()).toEqual(segments.filter(s=>s.segment_id.startsWith('DEMO-REF-')).map(s=>s.segment_id).sort())
    expect(segmentDisplays['DEMO-WALK-01']).toBeUndefined() // retired coordinates are not painted on the new image
    Object.values(segmentDisplays).forEach(s => {
      expect(s.data_status).toBe('demo_fixture')
      expect(s.source).toContain('not surveyed')
      expect(s.map_display_geometry.length).toBeGreaterThan(1)
      s.map_display_geometry.forEach(p => {
        expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(campusMap.width)
        expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(campusMap.height)
      })
    })
  })
  it('connects the calculated reference path from the source entrance circle to Klinik', () => {
    const route=compareRoutes(currentSnapshot(initialWorkflow()),campusWideGraph,'MAIN-GATE','KLINIK-UTM').shortest!
    expect(route).not.toBeNull()
    let previous=campusMap.origin
    route.edges.forEach((edge,i)=>{
      const points=segmentDisplays[edge.segment_id].map_display_geometry
      const oriented=edge.from===route.node_ids[i]?points:[...points].reverse()
      expect(oriented[0]).toEqual(previous)
      previous=oriented[oriented.length-1]
    })
    expect(previous).toEqual(campusMap.destination)
  })
  it('anchors intervention marks halfway along a multi-edge line rather than at its start', () => {
    expect(displayMidpoint([{x:0,y:0},{x:100,y:0},{x:100,y:300}])).toEqual({x:100,y:100})
  })
  it('does not fabricate a marker for absent display geometry', () => {
    expect(displayMidpoint([])).toBeNull()
    expect(segmentDisplays['SURVEY-NOT-YET-MAPPED']).toBeUndefined()
  })
  it('keeps a stable anchor for a degenerate point without dividing by zero', () => {
    expect(displayMidpoint([{x:2,y:3},{x:2,y:3}])).toEqual({x:2,y:3})
  })
  it('selects only a nearby available pixel segment and rejects blank map space', () => {
    expect(nearestDisplaySegment({x:932,y:464},['DEMO-S01','DEMO-S04'])).toBe('DEMO-S04')
    expect(nearestDisplaySegment({x:932,y:464},['DEMO-S01'])).toBeNull()
    expect(nearestDisplaySegment({x:0,y:0},Object.keys(segmentDisplays))).toBeNull()
  })
})
