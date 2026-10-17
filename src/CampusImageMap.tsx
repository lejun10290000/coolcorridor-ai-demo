/// <reference types="vite/client" />
import { useEffect, useId, useRef, useState } from 'react'
import type { InterventionCandidate, ResidentReport, WalkwaySegment } from './types'
import { campusMap, displayMidpoint, segmentDisplays, shadeColours, shadeLabels, svgPoints } from './campusMapDisplay'
import './campus-map.css'

export interface CampusImageMapProps {
  segments: WalkwaySegment[]; selected?: string; onSelect: (id: string) => void
  routeIds?: string[]; candidates?: InterventionCandidate[]; scenario?: boolean; recenter: number
  reports?: ResidentReport[]
}
export function CampusImageMap({ segments, selected, onSelect, routeIds = [], candidates = [], scenario = false, recenter, reports = [] }: CampusImageMapProps) {
  const labelId = useId()
  const viewport = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  useEffect(() => { reset() }, [recenter])
  // A resize resets the shared scene so a formerly visible path cannot remain offscreen.
  useEffect(() => { const observer = new ResizeObserver(reset); if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect() }, [])
  function move(x: number, y: number) {
    if (!viewport.current || !scene.current) return
    const v = viewport.current.getBoundingClientRect()
    const s = scene.current.getBoundingClientRect()
    const limitX = Math.max(0, (s.width - v.width) / 2)
    const limitY = Math.max(0, (s.height - v.height) / 2)
    setPan({ x: Math.max(-limitX, Math.min(limitX, x)), y: Math.max(-limitY, Math.min(limitY, y)) })
  }
  const changeZoom = (delta: number) => { setZoom(z => Math.max(1, Math.min(3, z + delta))); setPan({ x: 0, y: 0 }) }
  const choose = (id: string) => { if (!suppressClick.current) onSelect(id) }
  const missing = segments.filter(s => !segmentDisplays[s.segment_id])
  return <section className="campus-map" aria-labelledby={labelId}>
    <div className="campus-map-toolbar"><strong id={labelId}>UTM KL campus illustration</strong><div className="campus-map-controls">
      <button type="button" aria-label="Zoom out campus map" disabled={zoom === 1} onClick={() => changeZoom(-.5)}>−</button>
      <output aria-label="Campus map zoom">{Math.round(zoom * 100)}%</output>
      <button type="button" aria-label="Zoom in campus map" disabled={zoom === 3} onClick={() => changeZoom(.5)}>+</button>
      <button type="button" onClick={reset}>Full map</button>
    </div></div>
    <p className="campus-map-caution">ILLUSTRATIVE ROUTES — NOT FOR NAVIGATION. Shade colours and paths are DEMO fixtures, not field observations.</p>
    <div className="campus-map-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Campus map. Zoom with buttons; when zoomed, drag or use arrow keys to pan. Home resets."
      onKeyDown={e => {
        if (e.target !== e.currentTarget) return
        const keys: Record<string, [number, number]> = { ArrowLeft: [60,0], ArrowRight: [-60,0], ArrowUp: [0,60], ArrowDown: [0,-60] }
        if (e.key === 'Home') { e.preventDefault(); reset() }
        else if (keys[e.key] && zoom > 1) { e.preventDefault(); move(pan.x + keys[e.key][0], pan.y + keys[e.key][1]) }
      }}
      onPointerDown={e => { if (e.button !== 0 || zoom === 1) return; suppressClick.current = false; drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false } }}
      onPointerMove={e => {
        const d = drag.current
        if (!d) return
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) { d.moved = true; suppressClick.current = true; e.currentTarget.setPointerCapture(e.pointerId) }
        if (d.moved) move(d.px + e.clientX - d.x, d.py + e.clientY - d.y)
      }}
      onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); drag.current = null; setTimeout(() => { suppressClick.current = false }, 0) }}
      onPointerCancel={() => { drag.current = null; suppressClick.current = false }}
      style={{ touchAction: zoom > 1 ? 'none' : 'pan-y', cursor: zoom > 1 ? 'grab' : 'auto' }}>
      {imageState === 'loading' && <p className="campus-map-message" role="status">Loading supplied campus image…</p>}
      {imageState === 'error' && <div className="campus-map-message" role="alert"><p>Campus image could not load. Map overlays are hidden.</p><button type="button" onClick={() => { setImageState('loading'); setRetry(r => r+1) }}>Retry campus image</button></div>}
      <div className="campus-map-scene" ref={scene} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, visibility: imageState === 'ready' ? 'visible' : 'hidden' }}>
        <img key={retry} src={`${import.meta.env.BASE_URL}${campusMap.asset}${retry ? `?retry=${retry}` : ''}`} alt="Operator-supplied UTM Kuala Lumpur campus illustration" width={campusMap.width} height={campusMap.height} draggable={false} onLoad={() => setImageState('ready')} onError={() => setImageState('error')} />
        {imageState === 'ready' && <svg className="campus-map-overlay" viewBox={`0 0 ${campusMap.width} ${campusMap.height}`} aria-label="Illustrative walkway segments and endpoints">
          {segments.map(s => {
            const display = segmentDisplays[s.segment_id]
            if (!display) return null
            const p = svgPoints(display.map_display_geometry)
            const routeSelected = routeIds.includes(s.segment_id)
            const label = `${s.segment_id}: ${s.name}. ${shadeLabels[s.shade_label]}. ${s.shade_data_status === 'unknown' ? 'UNKNOWN' : 'DEMO'}. Pending field verification.`
            return <g key={s.segment_id} data-segment-id={s.segment_id} data-route-selected={routeSelected} className="campus-segment" role="button" tabIndex={0} aria-label={label} aria-pressed={selected === s.segment_id} onPointerUp={() => choose(s.segment_id)} onClick={e => { if (e.detail === 0) choose(s.segment_id) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.segment_id) } }}>
              <title>{label}</title>
              <polyline className="campus-line" points={p} stroke="#fff" strokeWidth="24" />
              {routeSelected && <polyline className="campus-line campus-route-outline" points={p} stroke="#55255b" strokeWidth="20" />}
              {selected === s.segment_id && <polyline className="campus-line campus-selection" points={p} stroke="#17131b" strokeWidth="25" strokeDasharray="3 10" />}
              <polyline className="campus-line campus-shade-stroke" points={p} stroke={shadeColours[s.shade_label]} strokeWidth="11" strokeDasharray="20 9" />
              <polyline className="campus-hit-area" points={p} strokeWidth="46" />
            </g>
          })}
          {candidates.flatMap(c => c.segment_ids.map(id => {
            const p = displayMidpoint(segmentDisplays[id]?.map_display_geometry ?? [])
            return p && segments.some(s => s.segment_id === id) ? <g key={`${c.intervention_id}-${id}`} className="campus-candidate" data-intervention-id={c.intervention_id} data-scenario={scenario} role="button" tabIndex={0} aria-label={`${scenario ? 'SIMULATED' : 'DEMO candidate'} ${c.intervention_id}: ${c.type}, ${id}`} onClick={() => choose(id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id) } }} transform={`translate(${p.x},${p.y})`}>
              <title>{scenario ? 'SIMULATED' : 'DEMO candidate'} {c.intervention_id}: {c.type} — {id}. Unverified display location.</title>
              <rect x="-18" y="-18" width="36" height="36" rx="5" fill={scenario ? '#8250ad' : '#fff'} stroke="#55255b" strokeWidth="5"/>
              <text y="6" textAnchor="middle" fill={scenario ? '#fff' : '#55255b'} fontSize="22" fontWeight="bold">{scenario ? 'S' : 'I'}</text>
            </g> : null
          }))}
          {segments.map(s => {
            const count = reports.filter(r => r.segment_id === s.segment_id).length
            const p = displayMidpoint(segmentDisplays[s.segment_id]?.map_display_geometry ?? [])
            return count && p ? <g className="campus-report" key={s.segment_id} transform={`translate(${p.x+38},${p.y-26})`}><title>{count} DEMO reports for {s.segment_id}; review status is in the inspector. Not footfall.</title><circle r="20" fill="#fff" stroke="#805107" strokeWidth="4"/><text y="7" textAnchor="middle" fontSize="22" fill="#805107">{count}</text></g> : null
          })}
          {[{ ...campusMap.origin, label: 'Start: Pintu Masuk Utama (Main Gate)', symbol: 'A' }, { ...campusMap.destination, label: 'Destination: Klinik UTM', symbol: 'B' }].map(p => <g className="campus-endpoint" key={p.symbol} transform={`translate(${p.x},${p.y})`} role="img" aria-label={p.label}><title>{p.label}</title><circle r="21" fill="#fff" stroke="#25212a" strokeWidth="5"/><text textAnchor="middle" y="8" fontSize="24" fontWeight="bold">{p.symbol}</text></g>)}
        </svg>}
      </div>
    </div>
    <div className="campus-map-legend" aria-label="Map legend">{Object.entries(shadeLabels).map(([key, label]) => <span key={key}><i style={{ background: shadeColours[key as keyof typeof shadeColours] }}/>{label}</span>)}<span><i className="campus-route-key"/>Purple outline: selected route</span><span>Black dots: selected segment · dashed: uncertain DEMO path</span><span>□ I: DEMO intervention · ■ S: SIMULATED site · numbered circles: DEMO reports</span></div>
    <p className="campus-map-note">A: Pintu Masuk Utama → B: Klinik UTM. Connections and crossings need survey. Zoom to read labels; drag or use arrow keys when zoomed. Select any segment with click, tap, Enter or Space.</p>
    {missing.length > 0 && <p role="status">No image-display geometry for {missing.map(s => s.segment_id).join(', ')}. These segments are not drawn.</p>}
    {candidates.length === 0 && <p className="campus-map-note">No selected intervention sites.</p>}
    <p className="campus-map-source">{campusMap.source} No georeferencing. Reuse permission needs confirmation before public deployment.</p>
  </section>
}
