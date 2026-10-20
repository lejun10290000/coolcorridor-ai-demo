/** Image pixels only. No image-to-WGS84 transform is known or implied. */
import { campusWalkLinks, referenceMap } from './campusWalkways'
export interface MapDisplayPoint { x: number; y: number }
export interface SegmentDisplayGeometry {
  segment_id: string
  map_display_geometry: MapDisplayPoint[]
  data_status: 'demo_fixture'
  source: string
}
export const campusMap = {
  ...referenceMap,
  // Display only the campus portion; replace the obsolete printed footer with live HTML.
  visibleHeight:1224,
  source:'Operator-supplied campus reference, received 18 October 2026; background edited to remove the printed Main Gate–Klinik example route and normalize its endpoint circles. Original creator/reuse licence unconfirmed. Paths remain illustrative and unsurveyed.',
  origin:{x:216,y:922},destination:{x:747,y:317},
}
// Route-node coordinates are now traced directly in the native base-image pixel space.
// This is a display transform only; it does not georeference the map.
export function campusMapPoint(point: { x: number; y: number }): MapDisplayPoint {
  return { x: point.x, y: point.y }
}
const campusSegmentDisplays: Record<string, SegmentDisplayGeometry> = Object.fromEntries(campusWalkLinks.map(link => [link.segment_id, {
  segment_id: link.segment_id,
  map_display_geometry: link.points.map(p => campusMapPoint(p)),
  data_status: 'demo_fixture' as const,
  source: link.source,
}]))
// Legacy IDs retain their historical evidence; these four declared proxies are display-only.
export const legacySegmentDisplayAliases:Record<string,string>={
 'DEMO-S01':'DEMO-REF-055','DEMO-S02':'DEMO-REF-042',
 'DEMO-S03':'DEMO-REF-001','DEMO-S04':'DEMO-REF-023',
}
export const segmentDisplays:Record<string,SegmentDisplayGeometry>={...campusSegmentDisplays}
for(const [legacy,id] of Object.entries(legacySegmentDisplayAliases))segmentDisplays[legacy]={...campusSegmentDisplays[id],segment_id:legacy,source:'Legacy evidence shown at a declared illustrative visual proxy; not surveyed. Original source record is retained.'}

export const shadeColours = { mostly_exposed: '#C4473A', mixed: '#BD8B16', mostly_shaded: '#35745A', unknown: '#707580' }
export const shadeLabels = { mostly_exposed: 'Mostly exposed', mixed: 'Mixed shade', mostly_shaded: 'Mostly shaded', unknown: 'Unknown / needs survey' }
export const svgPoints = (geometry: MapDisplayPoint[]) => geometry.map(p => `${p.x},${p.y}`).join(' ')
/** Pixel-space hit testing also handles SVG strokes that lose DOM focus during a tap. */
export function nearestDisplaySegment(point: MapDisplayPoint, ids: string[], tolerance = 23): string | null {
  let best: string | null = null, distance = tolerance
  for (const id of ids) {
    const geometry = segmentDisplays[id]?.map_display_geometry ?? []
    for (let i = 1; i < geometry.length; i++) {
      const a = geometry[i-1], b = geometry[i], dx = b.x-a.x, dy = b.y-a.y
      const lengthSquared = dx*dx+dy*dy
      const t = lengthSquared ? Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/lengthSquared)) : 0
      const d = Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy)
      if (d < distance) { distance = d; best = id }
    }
  }
  return best
}
/** Halfway along the display polyline, not a surveyed installation location. */
export function displayMidpoint(geometry: MapDisplayPoint[]): MapDisplayPoint | null {
  if (!geometry.length) return null
  const lengths = geometry.slice(1).map((p, i) => Math.hypot(p.x - geometry[i].x, p.y - geometry[i].y))
  let remaining = lengths.reduce((a, b) => a + b, 0) / 2
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const t = remaining / lengths[i]
      return { x: geometry[i].x + t * (geometry[i+1].x - geometry[i].x), y: geometry[i].y + t * (geometry[i+1].y - geometry[i].y) }
    }
    remaining -= lengths[i]
  }
  return geometry[0]
}
