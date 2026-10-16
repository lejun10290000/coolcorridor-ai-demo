import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import type { InterventionCandidate, WalkwaySegment } from './types'

const colours = { mostly_exposed: '#c4473a', mixed: '#bd8b16', mostly_shaded: '#35745a', unknown: '#707580' }
function Recenter({ tick }: { tick: number }) { const map = useMap(); useEffect(() => { map.setView([3.17555, 101.72505], 16) }, [map, tick]); return null }
export function MapPanel({ segments, selected, onSelect, routeIds = [], candidates = [], scenario = false, recenter }: { segments: WalkwaySegment[]; selected?: string; onSelect: (id: string) => void; routeIds?: string[]; candidates?: InterventionCandidate[]; scenario?: boolean; recenter: number }) {
  return <div className="map-wrap"><MapContainer center={[3.17555, 101.72505]} zoom={16} scrollWheelZoom className="map"><Recenter tick={recenter}/><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {segments.map(s => <Polyline key={s.segment_id} positions={s.geometry.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: routeIds.includes(s.segment_id) ? '#55255b' : colours[s.shade_label], weight: selected === s.segment_id ? 10 : routeIds.includes(s.segment_id) ? 7 : 5, opacity: s.walkable_status === 'verified' ? 1 : .75, dashArray: s.walkable_status === 'verified' ? undefined : '8 7' }} eventHandlers={{ click: () => onSelect(s.segment_id) }} />)}
    {scenario && candidates.flatMap(c => c.segment_ids).map(id => { const s = segments.find(x => x.segment_id === id); return s ? <Marker key={id} position={[s.geometry[0][1], s.geometry[0][0]]} /> : null })}
  </MapContainer><div className="map-notice">ILLUSTRATIVE overlay — pedestrian network pending field verification. Not for navigation.</div></div>
}
