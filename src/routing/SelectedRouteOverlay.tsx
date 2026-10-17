import { segmentDisplays, shadeColours, svgPoints } from '../campusMapDisplay'
import type { WalkwaySegment } from '../types'

/** Mount after the complete shade layer so later segment strokes cannot erase selection.
 * Screen-space widths retain a visible halo and shade centre at ordinary full-map zoom.
 * Pointer events pass through to the map's existing inspection/hit-test handlers.
 */
export function SelectedRouteOverlay({segments,routeIds}:{segments:WalkwaySegment[];routeIds:string[]}){
  return <g className="campus-active-route" pointerEvents="none" aria-hidden="true">{routeIds.map((id,index)=>{
    const segment=segments.find(s=>s.segment_id===id),display=segmentDisplays[id]
    if(!segment||!display)return null
    const points=svgPoints(display.map_display_geometry)
    return <g key={id} data-route-overlay-id={id} data-route-order={index}>
      <polyline className="campus-line campus-route-halo" points={points} stroke="#fff" strokeWidth="11" vectorEffect="non-scaling-stroke"/>
      <polyline className="campus-line campus-route-outline" points={points} stroke="#55255b" strokeWidth="8" vectorEffect="non-scaling-stroke"/>
      <polyline className="campus-line campus-route-centre" points={points} stroke={shadeColours[segment.shade_label]} strokeWidth="3" vectorEffect="non-scaling-stroke"/>
    </g>
  })}</g>
}
