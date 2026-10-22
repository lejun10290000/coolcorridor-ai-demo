/// <reference types="vite/client" />
import { useEffect, useId, useRef, useState } from 'react'
import type { InterventionCandidate, ResidentReport, WalkwaySegment } from './types'
import { campusMap, campusMapPoint, displayMidpoint, legacySegmentDisplayAliases, nearestDisplaySegment, segmentDisplays, shadeColours, shadeLabels, svgPoints } from './campusMapDisplay'
import { campusNodeName, campusRouteNodes, campusGraphNodes, campusWalkLinks } from './campusWalkways'
import { dataStatusText, reportsForSegment } from './workflow/model'
import './campus-map.css'
import { PointPhotoPanel } from './pointPhotos/PointPhotoPanel'
import type { PointPhoto } from './pointPhotos/catalog'
import { SelectedRouteOverlay } from './routing/SelectedRouteOverlay'
import { MapLegend } from './MapLegend'
import { clampMapOffset, zoomAroundCursor } from './mapViewport'

export interface CampusImageMapProps {
  segments: WalkwaySegment[]; selected?: string; onSelect: (id: string) => void
  routeIds?: string[]; routeNodeIds?: string[]; candidates?: InterventionCandidate[]; scenario?: boolean; recenter: number
  reports?: ResidentReport[]
  showReportNumbers?: boolean
  fromNode?: string
  toNode?: string
  endpointSelectMode?: 'from' | 'to'
  onNodeSelect?: (nodeId: string) => void
  pointPhotos?: Record<string,PointPhoto>
  photoPoint?: string|null
  onPhotoPointChange?: (id:string|null)=>void
  walkPosition?: {current:string;next:string|null;confirmed?:number}
  compactDetails?: boolean
  presentation?: 'default'|'resident'|'developer'
}
export function CampusImageMap({ segments, selected, onSelect, routeIds = [], routeNodeIds = [], candidates = [], scenario = false, recenter, reports = [], showReportNumbers = false, fromNode, toNode, onNodeSelect, pointPhotos, photoPoint, onPhotoPointChange, walkPosition, compactDetails = false, presentation='default' }: CampusImageMapProps) {
  const [localPhotoPoint,setLocalPhotoPoint]=useState<string|null>(null)
  const activePhotoPoint=onPhotoPointChange?photoPoint:localPhotoPoint
  const setPhotoPoint=onPhotoPointChange??setLocalPhotoPoint
  const closePhoto=()=>{setPhotoPoint(null);requestAnimationFrame(()=>{const node=overlay.current?.querySelector<SVGGElement>(`[data-campus-node-id="${activePhotoPoint}"]`);if(node)node.focus();else viewport.current?.focus({preventScroll:true})})}
  const photoNodes=campusGraphNodes.filter(n=>n.selectable===false&&(pointPhotos?.[n.id]||n.id===activePhotoPoint||n.id===walkPosition?.current||n.id===walkPosition?.next))
  function activateNode(id:string){
    const node=campusGraphNodes.find(n=>n.id===id)
    if(pointPhotos)setPhotoPoint(id)
    if(node?.selectable!==false)onNodeSelect?.(id)
  }
  const labelId = useId()
  const viewport = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const overlay = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const pressedSegment = useRef<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  const reset = () => { zoomRef.current = 1; panRef.current = { x: 0, y: 0 }; setZoom(1); setPan({ x: 0, y: 0 }) }
  // In the Resident map, show the campus-wide network as the base layer. Legacy edges
  // appear only when selected or when an existing DEMO intervention references them.
  const referenceIds=new Set(campusWalkLinks.map(s=>s.segment_id))
  const visibleSegments=segments.filter(s=>referenceIds.has(s.segment_id))
  const pendingReports=reports.filter(r=>r.review_status==='submitted'||r.review_status==='under_review')
  useEffect(() => { reset() }, [recenter])
  // A resize resets the shared scene so a formerly visible path cannot remain offscreen.
  useEffect(() => { const observer = new ResizeObserver(reset); if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect() }, [])
  function mapGeometry() {
    if (!viewport.current || !scene.current) return
    const v = viewport.current.getBoundingClientRect()
    const s = scene.current
    return {
      view: { x: v.width, y: v.height },
      scene: { x: s.offsetWidth, y: s.offsetHeight },
      center: { x: s.offsetLeft + s.offsetWidth / 2, y: s.offsetTop + s.offsetHeight / 2 },
      origin: { x: v.left, y: v.top },
    }
  }
  function move(x: number, y: number) {
    const geometry = mapGeometry()
    if (!geometry || zoomRef.current === 1) return
    const next = clampMapOffset({ x, y }, geometry.view, { x: geometry.scene.x * zoomRef.current, y: geometry.scene.y * zoomRef.current }, geometry.center)
    panRef.current = next
    setPan(next)
  }
  function changeZoom(delta: number, cursor?: { x: number; y: number }) {
    const geometry = mapGeometry()
    if (!geometry) return
    const previous = zoomRef.current
    const next = Math.max(1, Math.min(3, Math.round((previous + delta) * 100) / 100))
    if (next === previous) return
    const focus = cursor ?? { x: geometry.view.x / 2, y: geometry.view.y / 2 }
    const nextPan = next === 1 ? { x: 0, y: 0 } : clampMapOffset(
      zoomAroundCursor(focus, geometry.center, panRef.current, previous, next),
      geometry.view,
      { x: geometry.scene.x * next, y: geometry.scene.y * next },
      geometry.center,
    )
    zoomRef.current = next
    panRef.current = nextPan
    setZoom(next)
    setPan(nextPan)
  }
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const wheel = (event: WheelEvent) => {
      const direction = -Math.sign(event.deltaY)
      if (!direction || (zoomRef.current === 1 && direction < 0) || (zoomRef.current === 3 && direction > 0)) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? rect.height : 1
      changeZoom(Math.max(-.35, Math.min(.35, -event.deltaY * unit * .002)), { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])
  const choose = (id: string) => { if (!suppressClick.current) onSelect(id) }
  function hitSegment(clientX: number, clientY: number) {
    const matrix = overlay.current?.getScreenCTM()
    if (!matrix) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    return nearestDisplaySegment(p, visibleSegments.map(s => s.segment_id))
  }
  const missing=segments.filter(s=>s.segment_id.startsWith('DEMO-REF-')&&!segmentDisplays[s.segment_id])
  const mapLegend=<MapLegend from={fromNode} to={toNode} photos={!!pointPhotos} reports={showReportNumbers} walk={walkPosition}/>
  const mapInformation=<>
    <p className="campus-map-note">{walkPosition?'The selected walk is locked. Next confirms arrival manually; it does not track your location. Exit the walk to choose another route.':scenario?'SIMULATED preview: hypothetical shade changes do not publish to the baseline. Proposal sites are marked S.':'Use connected From and To points to select a route. Purple outlines show the selected route or Developer path selection; a black dotted outline marks an inspected path.'}</p>
    <p className="campus-map-note">{pointPhotos?'Click a dot to view its published reference photo, where available. Some corridor photo dots are not route endpoints. ':''}Named dots follow landmarks on the supplied illustration; unnamed dots are reference junctions. The isolated PA9 spur has no documented connection.</p>
    <p className="campus-map-note">Click a path for its shade category and source when inspection is available. Report photos remain with their reports and do not automatically replace map-point photos. {showReportNumbers?'Only pending reports have numbered map badges; accepted/rejected reports stay in review history.':''}</p>
    <p className="campus-map-note">□ I: DEMO intervention · ■ S: SIMULATED site. All walkway geometry, crossings and accessibility need field checks. Distances and walking times are demo estimates. NOT FOR NAVIGATION.</p>
    {missing.length > 0 && <p role="status">No image-display geometry for {missing.map(s => s.segment_id).join(', ')}. These segments are not drawn.</p>}
    {candidates.length === 0 && <p className="campus-map-note">No selected intervention sites.</p>}
    <p className="campus-map-source">{campusMap.source} No georeferencing. Reuse permission needs confirmation before public deployment.</p>
  </>
  return <section className={`campus-map ${presentation==='resident'?'campus-map-resident':''}`} aria-labelledby={labelId}>
    <div className="campus-map-toolbar"><strong id={labelId}>UTM KL campus illustration</strong><div className="campus-map-controls">
      <button type="button" aria-label="Zoom out campus map" disabled={zoom === 1} onClick={() => changeZoom(-.5)}>−</button>
      <output aria-label="Campus map zoom">{Math.round(zoom * 100)}%</output>
      <button type="button" aria-label="Zoom in campus map" disabled={zoom === 3} onClick={() => changeZoom(.5)}>+</button>
      <button type="button" onClick={reset}>Full map</button>
    </div></div>
    <p className="campus-map-caution">ILLUSTRATIVE ROUTES — NOT FOR NAVIGATION. {scenario ? 'SIMULATED / ASSUMPTION shade overlay.' : 'Walkway geometry is UNSURVEYED. Shade provenance is shown per segment.'} Paths remain unverified.</p>
    <div className="campus-map-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Campus map. Zoom with mouse wheel or buttons; when zoomed, drag or use arrow keys to pan. Home resets."
      onKeyDown={e => {
        if (e.target !== e.currentTarget) return
        const keys: Record<string, [number, number]> = { ArrowLeft: [60,0], ArrowRight: [-60,0], ArrowUp: [0,60], ArrowDown: [0,-60] }
        if (e.key === 'Home') { e.preventDefault(); reset() }
        else if (keys[e.key] && zoom > 1) { e.preventDefault(); move(pan.x + keys[e.key][0], pan.y + keys[e.key][1]) }
      }}
      onPointerDown={e => { const target=e.target as Element; const node=target.closest('[data-campus-node-id]'); if(activePhotoPoint)setPhotoPoint(null); pressedSegment.current = node ? null : hitSegment(e.clientX,e.clientY); if (e.button !== 0 || zoomRef.current === 1 || node) return; if (e.pointerType === 'mouse') e.preventDefault(); suppressClick.current = false; drag.current = { x: e.clientX, y: e.clientY, px: panRef.current.x, py: panRef.current.y, moved: false } }}
      onPointerMove={e => {
        const d = drag.current
        if (!d) return
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) { d.moved = true; suppressClick.current = true; e.currentTarget.setPointerCapture(e.pointerId) }
        if (d.moved) move(d.px + e.clientX - d.x, d.py + e.clientY - d.y)
      }}
      onPointerUp={e => { const target=e.target as Element; const nodeId=target.closest('[data-campus-node-id]')?.getAttribute('data-campus-node-id'); const id = nodeId ? null : (pressedSegment.current ?? hitSegment(e.clientX,e.clientY)); if (e.button === 0 && nodeId && !suppressClick.current) activateNode(nodeId); else if (e.button === 0 && id && !suppressClick.current) choose(id); pressedSegment.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); drag.current = null; setTimeout(() => { suppressClick.current = false }, 0) }}
      onPointerCancel={() => { pressedSegment.current = null; drag.current = null; suppressClick.current = false }}
      style={{ touchAction: zoom > 1 ? 'none' : 'pan-y', cursor: zoom > 1 ? 'grab' : 'auto' }}>
      {imageState === 'loading' && <p className="campus-map-message" role="status">Loading supplied campus image…</p>}
      {imageState === 'error' && <div className="campus-map-message" role="alert"><p>Campus image could not load. Map overlays are hidden.</p><button type="button" onClick={() => { setImageState('loading'); setRetry(r => r+1) }}>Retry campus image</button></div>}
      <div className="campus-map-scene" ref={scene} data-map-visible-height={campusMap.visibleHeight} style={{ aspectRatio:`${campusMap.width}/${campusMap.visibleHeight}`, width:`min(100%, calc(var(--map-height) * ${campusMap.width} / ${campusMap.visibleHeight}))`, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, visibility: imageState === 'ready' ? 'visible' : 'hidden' }}>
        <div className="campus-map-coordinate-frame" style={{height:`${campusMap.height/campusMap.visibleHeight*100}%`}}>
        <img key={retry} src={`${import.meta.env.BASE_URL}${campusMap.asset}${retry ? `?retry=${retry}` : ''}`} alt="Operator-supplied UTM Kuala Lumpur campus illustration" width={campusMap.width} height={campusMap.height} draggable={false} onLoad={() => setImageState('ready')} onError={() => setImageState('error')} />
        {imageState === 'ready' && <svg ref={overlay} className="campus-map-overlay" preserveAspectRatio="none" viewBox={`0 0 ${campusMap.width} ${campusMap.height}`} aria-label="Illustrative walkway segments and endpoints">
          {visibleSegments.map(s => {
            const display = segmentDisplays[s.segment_id]
            if (!display) return null
            const p = svgPoints(display.map_display_geometry)
            const routeSelected = routeIds.includes(s.segment_id)
            const label = `${s.segment_id}: ${s.name}. ${shadeLabels[s.shade_label]}. ${dataStatusText[s.shade_data_status]}. Route geometry pending field verification.`
            return <g key={s.segment_id} data-segment-id={s.segment_id} data-route-selected={routeSelected} className="campus-segment" role="button" tabIndex={0} aria-label={label} aria-pressed={selected === s.segment_id} onPointerDown={e => { if (e.button === 0) pressedSegment.current = s.segment_id }} onClick={e => { if (e.detail === 0) choose(s.segment_id) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.segment_id) } }}>
              <title>{label}</title>
              <polyline className="campus-line" points={p} stroke="#fff" strokeWidth="5" />
              {selected === s.segment_id && <polyline className="campus-line campus-selection" points={p} stroke="#17131b" strokeWidth="25" strokeDasharray="3 10" />}
              <polyline className="campus-line campus-shade-stroke" points={p} stroke={shadeColours[s.shade_label]} strokeWidth="3" />
              <polyline className="campus-hit-area" points={p} strokeWidth="46" />
            </g>
          })}
          <SelectedRouteOverlay segments={segments} routeIds={routeIds} routeNodeIds={routeNodeIds} completedCount={walkPosition?.confirmed} living={presentation!=='default'} separateSegments={presentation==='developer'}/>
          {candidates.flatMap(c => c.segment_ids.map(id => {
            const displayId = legacySegmentDisplayAliases[id] ?? id
            const p = displayMidpoint(segmentDisplays[displayId]?.map_display_geometry ?? [])
            return p && segments.some(s => s.segment_id === id) ? <g key={`${c.intervention_id}-${id}`} className="campus-candidate" data-intervention-id={c.intervention_id} data-scenario={scenario} role="button" tabIndex={0} aria-label={`${scenario ? 'SIMULATED' : 'DEMO candidate'} ${c.intervention_id}: ${c.type}, source ${id}, visual proxy ${displayId}`} onClick={() => choose(id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id) } }} transform={`translate(${p.x},${p.y})`}>
              <title>{scenario ? 'SIMULATED' : 'DEMO candidate'} {c.intervention_id}: {c.type} — source record {id}; shown at illustrative campus link {displayId}. Not a surveyed installation location.</title>
              <rect x="-18" y="-18" width="36" height="36" rx="5" fill={scenario ? '#8250ad' : '#fff'} stroke="#55255b" strokeWidth="5"/>
              <text y="6" textAnchor="middle" fill={scenario ? '#fff' : '#55255b'} fontSize="22" fontWeight="bold">{scenario ? 'S' : 'I'}</text>
            </g> : null
          }))}
          {showReportNumbers&&segments.map(s => {
            const count = reportsForSegment(pendingReports,s.segment_id).length
            const displayId = legacySegmentDisplayAliases[s.segment_id] ?? s.segment_id
            const p = displayMidpoint(segmentDisplays[displayId]?.map_display_geometry ?? [])
            return count && p ? <g className="campus-report" key={s.segment_id} data-report-segment-id={s.segment_id} data-report-count={count} transform={`translate(${p.x+38},${p.y-26})`}><title>{count} pending DEMO reports for {s.segment_id}; displayed at illustrative link {displayId}. Not footfall. Accepted/rejected reports remain in history.</title><circle r="20" fill="#fff" stroke="#805107" strokeWidth="4"/><text y="7" textAnchor="middle" fontSize="22" fill="#805107">{count}</text></g> : null
          })}
          {[...campusRouteNodes,...photoNodes].map(node => {
            const mapped=campusMapPoint(node), x=mapped.x, y=mapped.y
            const isFrom=node.id===fromNode, isTo=node.id===toNode
            const walkState=node.id===walkPosition?.next?'next':node.id===walkPosition?.current?'current':undefined
            const hasPhoto=!!pointPhotos?.[node.id],interactive=!!pointPhotos||(!!onNodeSelect&&node.selectable!==false)
            const name=campusNodeName(node)
            return <g key={node.id} className={`campus-route-node ${hasPhoto?'campus-photo-point':''}`} data-campus-node-id={node.id} data-has-photo={hasPhoto} data-walk-point={walkState} transform={`translate(${x},${y})`}
              role={interactive ? 'button' : 'img'} tabIndex={interactive ? 0 : -1}
              aria-label={`${name}${isFrom?', selected start':''}${isTo?', selected destination':''}${walkState==='next'?', next walk point':walkState==='current'?', last confirmed walk point':''}${hasPhoto?', reference photo available':''}${node.selectable===false?', photo reference only; not a route endpoint':''}. Walkway point is illustrative and unverified.`}
              aria-pressed={interactive?Boolean(isFrom||isTo||node.id===activePhotoPoint):undefined}
              style={{ pointerEvents: interactive ? 'auto' : 'none' }}
              onKeyDown={interactive ? e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();activateNode(node.id)} } : undefined}>
              <title>{name}. {isFrom?'Selected start. ':''}{isTo?'Selected destination. ':''}Illustrative point; access and nearby paths are UNSURVEYED.</title>
              <circle className="campus-node-hit" r={node.selectable===false?10:18} fill="transparent"/>
              {walkState&&<circle className="campus-walk-ring" r="14" fill="none" stroke={walkState==='next'?'#b86205':'#1c4d6b'} strokeWidth="3" vectorEffect="non-scaling-stroke" pointerEvents="none"/>}
              <circle className="campus-point-marker" r={hasPhoto?9:7} fill={isFrom?'#55255b':isTo?'#bd8b16':hasPhoto?'#55255b':'#fff'} stroke={isFrom||isTo?'#fff':hasPhoto?'#2f1638':'#707580'} strokeWidth="1.5"/>
              <circle r="2" fill={isFrom||isTo||hasPhoto?'#fff':'#707580'}/>

            </g>
          })}
        </svg>}
        </div>
      </div>
      {pointPhotos&&activePhotoPoint&&<PointPhotoPanel align={(campusGraphNodes.find(n=>n.id===activePhotoPoint)?.x??0)<campusMap.width/2?'right':'left'} key={activePhotoPoint} nodeId={activePhotoPoint} photo={pointPhotos[activePhotoPoint]} close={closePhoto}/>}
    </div>
    {mapLegend}
    {compactDetails?<>
      <details className="campus-map-details"><summary><span className="disclosure-title">Map information and source</span><small>Map key, data sources and what is still unverified</small></summary>{mapInformation}</details>
    </>:mapInformation}
  </section>
}
