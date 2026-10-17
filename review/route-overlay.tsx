// Isolated visual specimen, not a second application or production integration.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { campusMap, segmentDisplays, shadeColours, svgPoints } from '../src/campusMapDisplay'
import { currentSnapshot, initialWorkflow } from '../src/workflow/model'
import { compareRoutes } from '../src/routing/compare'
import { SelectedRouteOverlay } from '../src/routing/SelectedRouteOverlay'
import '../src/campus-map.css'
const snapshot=currentSnapshot(initialWorkflow())
// Explicitly fictional specimen to show distinct objective paths; not a field publication.
snapshot.segments=snapshot.segments.map(s=>s.segment_id==='DEMO-S03'?{...s,shade_label:'mostly_exposed'}:s)
const comparison=compareRoutes(snapshot)
function Specimen(){
  const [objective,setObjective]=useState<'shortest'|'exposure'>('shortest'),route=comparison[objective]!
  return <main style={{maxWidth:700,margin:'auto',fontFamily:'Arial',padding:16}}><h1>Selected route styling specimen</h1><p>Isolated component specimen — calculated routing is also available in the normal app. DEMO labels and paths, not for navigation.</p><button onClick={()=>setObjective('shortest')}>Shortest</button> <button onClick={()=>setObjective('exposure')}>Most shaded practical</button><p role="status">Selected route: {objective} · {route.segment_ids.join(', ')}</p><div style={{position:'relative'}}><img style={{width:'100%',display:'block'}} src={'/'+campusMap.asset} alt="Supplied campus illustration"/><svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox={`0 0 ${campusMap.width} ${campusMap.height}`}>
    {snapshot.segments.map(s=><polyline key={s.segment_id} className="campus-line" points={svgPoints(segmentDisplays[s.segment_id].map_display_geometry)} stroke={shadeColours[s.shade_label]} strokeWidth={11} strokeDasharray="20 9"/>)}
    <SelectedRouteOverlay segments={snapshot.segments} routeIds={route.segment_ids}/>
  </svg></div></main>
}
createRoot(document.getElementById('root')!).render(<Specimen/> )
