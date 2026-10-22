import { campusMapPoint, segmentDisplays } from '../campusMapDisplay'
import type { MapDisplayPoint } from '../campusMapDisplay'
import { campusGraphNodes } from '../campusWalkways'

const distanceSquared = (a: MapDisplayPoint, b: MapDisplayPoint) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2

/** Orient existing image-space segment geometry into one trace; never invent new waypoints. */
export function orderedRouteGeometry(routeIds: string[], nodeIds: string[] = []): MapDisplayPoint[][] {
  const previous: MapDisplayPoint[] = []
  return routeIds.map((id, index) => {
    const original = segmentDisplays[id]?.map_display_geometry ?? []
    if (original.length < 2) return []
    const startNode = campusGraphNodes.find(node => node.id === nodeIds[index])
    const anchor = startNode ? campusMapPoint(startNode) : previous[previous.length - 1]
    const points = anchor && distanceSquared(original[original.length - 1], anchor) < distanceSquared(original[0], anchor)
      ? [...original].reverse()
      : [...original]
    previous.push(...points)
    return points
  })
}

export function continuousRouteGeometry(routeIds: string[], nodeIds: string[] = []): MapDisplayPoint[] {
  const joined: MapDisplayPoint[] = []
  for (const points of orderedRouteGeometry(routeIds, nodeIds)) {
    if (!points.length) continue
    const duplicate = joined.length && distanceSquared(joined[joined.length - 1], points[0]) < 1
    joined.push(...(duplicate ? points.slice(1) : points))
  }
  return joined
}
