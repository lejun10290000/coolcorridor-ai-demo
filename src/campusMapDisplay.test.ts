import { describe, expect, it } from 'vitest'
import { segments } from './fixtures'
import { campusMap, displayMidpoint, segmentDisplays } from './campusMapDisplay'

describe('campus image display geometry contract', () => {
  it('covers the existing shared segment IDs with explicit pixel-only fixture provenance', () => {
    expect(Object.keys(segmentDisplays).sort()).toEqual(segments.map(s => s.segment_id).sort())
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
  it('connects both route compositions from Main Gate to Klinik without gaps', () => {
    const a = segmentDisplays['DEMO-S01'].map_display_geometry
    const b = segmentDisplays['DEMO-S02'].map_display_geometry
    const alternative = segmentDisplays['DEMO-S03'].map_display_geometry
    expect(a[0]).toEqual(campusMap.origin)
    expect(a[a.length-1]).toEqual(b[0])
    expect(b[b.length-1]).toEqual(campusMap.destination)
    expect(alternative[0]).toEqual(campusMap.origin)
    expect(alternative[alternative.length-1]).toEqual(campusMap.destination)
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
})
