import { describe, expect, it } from 'vitest'
import { currentSnapshot, initialWorkflow } from './workflow/model'
import { campusRouteNodes, campusGraphNodes, campusWalkLinks, campusNodeName } from './campusWalkways'
import { campusWideGraph } from './routing/graph'
import { compareRoutes } from './routing/compare'
import { campusMap, legacySegmentDisplayAliases, segmentDisplays } from './campusMapDisplay'

describe('campus-wide selectable unsurveyed walkway network', () => {
  it('has a unique, connected set of selectable dots and valid link references', () => {
    const ids = campusGraphNodes.map(node => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(campusWalkLinks.map(link => link.segment_id)).size).toBe(campusWalkLinks.length)
    expect(campusWalkLinks.every(link => ids.includes(link.from) && ids.includes(link.to) && link.from !== link.to)).toBe(true)
    const adjacency = new Map<string, string[]>(ids.map(id => [id, []] as [string, string[]]))
    for (const link of campusWalkLinks) {
      adjacency.get(link.from)!.push(link.to)
      adjacency.get(link.to)!.push(link.from)
    }
    const visited = new Set<string>([ids[0]])
    const pending = [ids[0]]
    while (pending.length) for (const next of adjacency.get(pending.shift()!) ?? []) if (!visited.has(next)) {
      visited.add(next)
      pending.push(next)
    }
    expect(visited.size).toBe(ids.length-1)
    expect(visited.has('PA9-SPUR')).toBe(false) // visible isolated stub; never invent a link
    expect(compareRoutes(currentSnapshot(initialWorkflow()),campusWideGraph,'PA9-SPUR','MAIN-GATE').shortest).toBeNull()
  })

  it('names the map-marked landmarks without forcing a label on every junction', () => {
    const labels = campusRouteNodes.filter(node => node.label).map(node => node.label)
    expect(labels).toEqual(expect.arrayContaining(['Pintu Masuk Utama','Klinik UTM','Cafe Pegawai access','MJIIT west access','Residensi UTMKL access']))
    const unnamed = campusRouteNodes.find(node => !node.label)!
    expect(campusNodeName(unnamed)).toMatch(/^Reference junction \d+$/)
  })

  it('routes between any two connected nodes and keeps every new segment unknown/grey', () => {
    const snapshot = currentSnapshot(initialWorkflow())
    const route = compareRoutes(snapshot, campusWideGraph, 'CICT', 'RESIDENSI-UTMKL')
    expect(route.shortest).not.toBeNull()
    expect(route.shortest!.node_ids[0]).toBe('CICT')
    expect(route.shortest!.node_ids[route.shortest!.node_ids.length - 1]).toBe('RESIDENSI-UTMKL')
    expect(route.shortest!.segment_ids.length).toBeGreaterThan(1)
    expect(route.shortest!.edges.every(edge => edge.shade_label === 'unknown' && edge.shade_data_status === 'unknown')).toBe(true)
    expect(route.shortest!.unknown_coverage_pct).toBe(100)
    expect(route.identical_path).toBe(true)
    expect(route.warnings.join(' ')).toContain('Not for navigation')
  })


  it('keeps selectable dots and shaped walkway paths aligned to the native map image', () => {
    const byId = new Map(campusGraphNodes.map(node => [node.id, node]))
    for (const node of campusRouteNodes) {
      expect(node.x).toBeGreaterThanOrEqual(0)
      expect(node.x).toBeLessThanOrEqual(campusMap.width)
      expect(node.y).toBeGreaterThanOrEqual(0)
      expect(node.y).toBeLessThanOrEqual(campusMap.height)
    }
    for (const link of campusWalkLinks) {
      expect(link.points[0]).toMatchObject({x:byId.get(link.from)!.x,y:byId.get(link.from)!.y})
      expect(link.points[link.points.length - 1]).toMatchObject({x:byId.get(link.to)!.x,y:byId.get(link.to)!.y})
      expect(link.points.length).toBeGreaterThanOrEqual(2)
      expect(link.points.every(point =>
        point.x >= 0 && point.x <= campusMap.width && point.y >= 0 && point.y <= campusMap.height
      )).toBe(true)
      expect(segmentDisplays[link.segment_id].map_display_geometry).toEqual(link.points)
    }
  })


  it('keeps legacy developer markers on the shared campus network instead of drawing old shortcut paths', () => {
    const campusIds = new Set(campusWalkLinks.map(link => link.segment_id))
    expect(Object.keys(legacySegmentDisplayAliases)).toEqual(expect.arrayContaining([
      'DEMO-S01', 'DEMO-S02', 'DEMO-S03', 'DEMO-S04',
    ]))
    expect(Object.values(legacySegmentDisplayAliases).every(id => campusIds.has(id))).toBe(true)
    expect(Object.values(legacySegmentDisplayAliases).every(id => Boolean(segmentDisplays[id]))).toBe(true)
  })

  it('locks physical source-image anchors instead of stretching two endpoints',()=>{
    const node=(id:string)=>campusRouteNodes.find(n=>n.id===id)!
    expect([campusMap.width,campusMap.height]).toEqual([1113,1414])
    expect(node('MAIN-GATE')).toMatchObject({x:216,y:922})
    expect(node('KLINIK-UTM')).toMatchObject({x:747,y:317})
    expect(node('REAR-GATE')).toMatchObject({x:977,y:456})
    expect(node('RESIDENSI-UTMKL')).toMatchObject({x:939,y:731})
    expect(node('NORTH-EAST')).toMatchObject({x:875,y:100})
    expect(node('PARKING-SOUTH')).toMatchObject({x:623,y:1164})
    expect(new Set(campusRouteNodes.map(n=>`${n.x},${n.y}`)).size).toBe(campusRouteNodes.length)
  })
  it('routes in either direction and refuses the same point as both endpoints', () => {
    const snapshot = currentSnapshot(initialWorkflow())
    const forward = compareRoutes(snapshot, campusWideGraph, 'MAIN-GATE', 'KLINIK-UTM')
    const reverse = compareRoutes(snapshot, campusWideGraph, 'KLINIK-UTM', 'MAIN-GATE')
    expect(forward.shortest?.distance_m).toBe(reverse.shortest?.distance_m)
    expect(reverse.shortest?.node_ids[0]).toBe('KLINIK-UTM')
    expect(reverse.shortest?.node_ids[reverse.shortest!.node_ids.length - 1]).toBe('MAIN-GATE')
    expect(compareRoutes(snapshot, campusWideGraph, 'CICT', 'CICT').shortest).toBeNull()
  })
})
