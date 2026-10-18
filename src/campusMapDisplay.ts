/** Image pixels only. No image-to-WGS84 transform is known or implied. */
import { campusWalkLinks } from './campusWalkways'
export interface MapDisplayPoint { x: number; y: number }
export interface SegmentDisplayGeometry {
  segment_id: string
  map_display_geometry: MapDisplayPoint[]
  data_status: 'demo_fixture'
  source: string
}
export const campusMap = {
  width: 1290, height: 1640, asset: 'maps/utmkul-campus-map.png',
  source: 'Operator-supplied UTM KL campus illustration from a lecturer-provided PDF. Original creator and reuse licence unconfirmed.',
  origin: { x: 285, y: 1075 }, destination: { x: 884, y: 312 },
}
// Node/link coordinates use the same aspect ratio as this map image. Keep one uniform
// proportional transform: independently anchoring Main Gate and Klinik stretches the
// drawing and causes the other walkway dots to drift away from their paths. Image pixels
// only; there is no georeferencing or map-scale claim.
export function campusMapPoint(point: { x: number; y: number }): MapDisplayPoint {
  return {
    x: point.x * campusMap.width / 1088,
    y: point.y * campusMap.height / 1382,
  }
}
const points = (pairs: [number, number][]): MapDisplayPoint[] => pairs.map(([x, y]) => ({ x, y }))
const source = 'Visually traced on supplied 1290 × 1640 campus illustration; uncertain connections, crossings and building approach are DEMO, not surveyed.'
/** Separate sidecar keyed by existing IDs; never derived from schematic geographic fixtures. */
const legacySegmentDisplays: Record<string, SegmentDisplayGeometry> = Object.fromEntries([
  ['DEMO-S01', points([[285,1075],[335,1020],[420,972],[525,905]])],
  ['DEMO-S02', points([[525,905],[625,835],[740,760],[705,701],[685,665],[790,615],[920,560],[948,480],[927,399],[913,370],[869,386],[852,355],[884,340],[884,312]])],
  ['DEMO-S03', points([[285,1075],[252,1020],[242,920],[239,795],[245,680],[279,651],[345,650],[440,625],[507,604],[472,520],[535,488],[603,465],[650,446],[698,430],[752,411],[801,387],[837,375],[869,360],[884,340],[884,312]])],
  ['DEMO-S04', points([[920,560],[1010,540],[1080,531],[1131,522]])],
].map(([id, geometry]) => [id, { segment_id: id as string, map_display_geometry: geometry as MapDisplayPoint[], data_status: 'demo_fixture', source }]))

const campusSegmentDisplays: Record<string, SegmentDisplayGeometry> = Object.fromEntries(campusWalkLinks.map(link => [link.segment_id, {
  segment_id: link.segment_id,
  map_display_geometry: link.points.map(p => campusMapPoint(p)),
  data_status: 'demo_fixture' as const,
  source: link.source,
}]))
export const segmentDisplays: Record<string, SegmentDisplayGeometry> = { ...legacySegmentDisplays, ...campusSegmentDisplays }

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
