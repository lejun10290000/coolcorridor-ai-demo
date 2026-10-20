import { campusGraphNodes, campusNodeName } from './campusWalkways'
import { shadeColours } from './campusMapDisplay'

const labels={mostly_exposed:'Unshaded',mixed:'Mixed shade',mostly_shaded:'Fully shaded',unknown:'Unknown / needs survey'} as const
function name(id?:string){const node=campusGraphNodes.find(n=>n.id===id);return node?campusNodeName(node):'Not selected'}

export function MapLegend({from,to,photos,reports,walk}:{from?:string;to?:string;photos:boolean;reports:boolean;walk?:{current:string;next:string|null}}){
  return <div className="campus-map-key" aria-label="Campus map key">
    <div className="campus-map-legend" aria-label="Map legend">
      {Object.entries(labels).map(([key,label])=><span key={key}><i style={{background:shadeColours[key as keyof typeof labels]}}/>{label}</span>)}
      <span><i className="campus-route-key"/>Purple outline: selected route / paths</span>
      {photos&&<span><i className="campus-photo-key"/>Larger dark dots: photo available</span>}
      {reports&&<span><i className="campus-report-key">#</i>Numbered badges: pending reports</span>}
      {walk&&<><span><i className="campus-walk-key" style={{borderColor:'#1c4d6b'}}/>Blue ring: last confirmed point</span><span><i className="campus-walk-key" style={{borderColor:'#b86205'}}/>Orange ring: next point</span></>}
    </div>
    <div className="campus-map-endpoints" aria-label="Map route endpoints"><span><i className="campus-from-key"/><b>From:</b> <span data-map-key-from={from??''}>{name(from)}</span></span><span><i className="campus-to-key"/><b>To:</b> <span data-map-key-to={to??''}>{name(to)}</span></span></div>
    <p className="campus-map-key-note">Shade categories describe the displayed map view; manual classifications are DEMO labels, not measured shade percentages. Paths and distances remain illustrative and unsurveyed.</p>
  </div>
}
