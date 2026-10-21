import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { campusMapPoint, segmentDisplays, svgPoints } from '../campusMapDisplay'
import { campusGraphNodes } from '../campusWalkways'
import { currentSnapshot, initialWorkflow } from '../workflow/model'
import { compareRoutes } from './compare'
import { campusWideGraph } from './graph'
import { continuousRouteGeometry, orderedRouteGeometry } from './routeEnergy'
import { SelectedRouteOverlay } from './SelectedRouteOverlay'

describe('Resident route energy', () => {
  const snapshot = currentSnapshot(initialWorkflow())
  for (const [from, to] of [['MAIN-GATE', 'KLINIK-UTM'], ['KLINIK-UTM', 'MAIN-GATE']]) {
    it(`keeps the supplied segment geometry and travel direction for ${from} → ${to}`, () => {
      const route = compareRoutes(snapshot, campusWideGraph, from, to).shortest!
      const ordered = orderedRouteGeometry(route.segment_ids, route.node_ids)
      const joined = continuousRouteGeometry(route.segment_ids, route.node_ids)
      expect(ordered).toHaveLength(route.segment_ids.length)
      expect(joined.length).toBeGreaterThan(route.segment_ids.length)
      for (let i = 0; i < ordered.length; i++) {
        const source = campusMapPoint(campusGraphNodes.find(node => node.id === route.node_ids[i])!)
        const first = ordered[i][0], last = ordered[i][ordered[i].length - 1]
        const distance = (p: typeof first) => (p.x - source.x) ** 2 + (p.y - source.y) ** 2
        expect(distance(first)).toBeLessThanOrEqual(distance(last))
      }
      const supplied = route.segment_ids.flatMap(id => segmentDisplays[id].map_display_geometry)
      expect(joined.every(point => supplied.some(source => source.x === point.x && source.y === point.y))).toBe(true)
      const html = renderToStaticMarkup(<svg><SelectedRouteOverlay segments={snapshot.segments} routeIds={route.segment_ids} routeNodeIds={route.node_ids} living /></svg>)
      expect(html.match(/class="campus-line campus-route-energy-base" points="([^"]+)"/)?.[1]).toBe(svgPoints(joined))
      expect(html).toMatch(/class="campus-line campus-route-energy-base"[^>]*stroke-width="2"/)
      expect((html.match(/class="campus-line campus-route-silk-piece"/g) ?? []).length).toBeGreaterThan(50)
      expect(html).toMatch(/class="campus-line campus-route-silk-piece"[^>]*stroke-width="3.5"/)
      const silkPaths=[...html.matchAll(/class="campus-line campus-route-silk-piece" d="([^"]+)"/g)].map(match=>match[1])
      expect(silkPaths[0]).toContain(`M ${joined[0].x} ${joined[0].y} L `)
      expect(silkPaths[silkPaths.length-1]).toContain(` L ${joined[joined.length-1].x} ${joined[joined.length-1].y}`)
      expect(html).not.toContain('campus-route-wave')
      expect(html).not.toContain('campus-route-runner')
      expect((html.match(/data-route-overlay-id=/g) ?? []).length).toBe(route.segment_ids.length)
      const developerHtml = renderToStaticMarkup(<svg><SelectedRouteOverlay segments={snapshot.segments} routeIds={route.segment_ids} routeNodeIds={route.node_ids} living separateSegments /></svg>)
      expect((developerHtml.match(/class="campus-line campus-route-energy-base"/g) ?? []).length).toBe(route.segment_ids.length)
    })
  }
})
