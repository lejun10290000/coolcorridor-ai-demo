export type MapOffset = { x: number; y: number }
export type MapAxisBounds = { min: number; max: number }

/** Keep the complete illustration reachable without letting it disappear off-stage. */
export function mapAxisBounds(viewSize: number, sceneSize: number, sceneCenter: number): MapAxisBounds {
  const left = sceneCenter - sceneSize / 2
  const right = sceneCenter + sceneSize / 2
  return sceneSize <= viewSize
    ? { min: -left, max: viewSize - right }
    : { min: viewSize - right, max: -left }
}

export function clampMapOffset(offset: MapOffset, view: MapOffset, scene: MapOffset, center: MapOffset): MapOffset {
  const x = mapAxisBounds(view.x, scene.x, center.x)
  const y = mapAxisBounds(view.y, scene.y, center.y)
  return {
    x: Math.min(x.max, Math.max(x.min, offset.x)),
    y: Math.min(y.max, Math.max(y.min, offset.y)),
  }
}

/** Hold the illustration location under the pointer while changing scale. */
export function zoomAroundCursor(cursor: MapOffset, center: MapOffset, pan: MapOffset, previousZoom: number, nextZoom: number): MapOffset {
  return {
    x: cursor.x - center.x - ((cursor.x - center.x - pan.x) / previousZoom) * nextZoom,
    y: cursor.y - center.y - ((cursor.y - center.y - pan.y) / previousZoom) * nextZoom,
  }
}
