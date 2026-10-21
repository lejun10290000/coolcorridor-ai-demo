import { useEffect, useState } from 'react'
import { segmentDisplays, shadeColours, svgPoints } from '../campusMapDisplay'
import type { MapDisplayPoint } from '../campusMapDisplay'
import type { WalkwaySegment } from '../types'
import { continuousRouteGeometry, orderedRouteGeometry } from './routeEnergy'

/** Small, touching pieces preserve the supplied centreline while phase-shifted
 * stroke colours form broad, continuous waves around its bends. */
function silkPieces(points: MapDisplayPoint[]) {
  const lengths=points.slice(1).map((point,index)=>Math.hypot(point.x-points[index].x,point.y-points[index].y))
  const total=lengths.reduce((sum,length)=>sum+length,0)
  if(!total)return []
  const pieces:{d:string;delay:string}[]=[]
  let travelled=0
  lengths.forEach((length,index)=>{
    if(!length)return
    const from=points[index],to=points[index+1],count=Math.ceil(length/12)
    for(let step=0;step<count;step++){
      const first=step/count,last=(step+1)/count
      const a={x:from.x+(to.x-from.x)*first,y:from.y+(to.y-from.y)*first}
      const b={x:from.x+(to.x-from.x)*last,y:from.y+(to.y-from.y)*last}
      const position=(travelled+length*(step+.5)/count)/total
      const phase=(1-(position*2.2)%1)%1
      pieces.push({d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,delay:`-${(phase*5.6).toFixed(3)}s`})
    }
    travelled+=length
  })
  return pieces
}

/** Mount after the complete shade layer so later segment strokes cannot erase selection.
 * Screen-space widths retain a visible halo and shade centre at ordinary full-map zoom.
 * Pointer events pass through to the map's existing inspection/hit-test handlers.
 */
export function SelectedRouteOverlay({segments,routeIds,routeNodeIds=[],completedCount=0,living=false,separateSegments=false}:{segments:WalkwaySegment[];routeIds:string[];routeNodeIds?:string[];completedCount?:number;living?:boolean;separateSegments?:boolean}){
  const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>setReduced(media.matches)
    media.addEventListener('change',update)
    update()
    return()=>media.removeEventListener('change',update)
  },[])
  const oriented=orderedRouteGeometry(routeIds,routeNodeIds)
  const flow=continuousRouteGeometry(routeIds,routeNodeIds)
  const visualFlows=separateSegments?oriented.filter(points=>points.length>1):[flow]
  return <g className="campus-active-route" pointerEvents="none" aria-hidden="true">{routeIds.map((id,index)=>{
    const segment=segments.find(s=>s.segment_id===id),display=segmentDisplays[id]
    if(!segment||!display)return null
    const points=svgPoints(display.map_display_geometry)
    const checkpoint=oriented[index]?.[oriented[index].length-1]
    return <g key={id} className={index<completedCount?'campus-route-completed':index===completedCount?'campus-route-next':''} data-route-overlay-id={id} data-route-order={index} data-route-version={segment.dataset_version}>
      <polyline className="campus-line campus-route-halo" points={points} stroke="#fff" strokeWidth="6" vectorEffect="non-scaling-stroke"/>
      <polyline className="campus-line campus-route-outline" points={points} stroke="#55255b" strokeWidth="4" vectorEffect="non-scaling-stroke"/>
      <polyline className="campus-line campus-route-centre" points={points} stroke={shadeColours[segment.shade_label]} strokeWidth="2" strokeDasharray="8 8" vectorEffect="non-scaling-stroke"/>
      {living&&checkpoint&&<circle className="campus-route-checkpoint" cx={checkpoint.x} cy={checkpoint.y} r="5" fill="#fff" stroke="#a838f8" strokeWidth="3" vectorEffect="non-scaling-stroke"/>}
    </g>
  })}{living&&visualFlows.map((points,flowIndex)=>points.length>1&&<g key={flowIndex} className="campus-route-flow">
    <polyline className="campus-line campus-route-energy-base" points={svgPoints(points)} stroke="#a943fa" strokeWidth="2" opacity=".9" vectorEffect="non-scaling-stroke"/>
    {!reduced&&<g className="campus-route-silk">{silkPieces(points).map((piece,index)=><path key={index} className="campus-line campus-route-silk-piece" d={piece.d} stroke="#a576e8" strokeWidth="3.5" vectorEffect="non-scaling-stroke" style={{animationDelay:piece.delay}}/>)}</g>}
  </g>)}</g>
}
