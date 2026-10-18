import { describe, expect, it } from 'vitest'
import { currentSnapshot, initialWorkflow } from './workflow/model'
import { campusRouteNodes, campusWalkLinks, campusNodeName } from './campusWalkways'
import { campusWideGraph } from './routing/graph'
import { compareRoutes } from './routing/compare'

describe('campus-wide selectable unsurveyed walkway network', () => {
  it('has a unique, connected set of selectable dots and valid link references', () => {
    const ids = campusRouteNodes.map(node => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(campusWalkLinks.map(link => link.segment_id)).size).toBe(campusWalkLinks.length)
    expect(campusWalkLinks.every(link => ids.includes(link.from) && ids.includes(link.to) && link.from !== link.to)).toBe(true)
    const adjacency = new Map(ids.map(id => [id, [] as string[]]))
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
    expect(visited.size).toBe(ids.length)
  })

  it('names the map-marked landmarks without forcing a label on every junction', () => {
    const labels = campusRouteNodes.filter(node => node.label).map(node => node.label)
    expect(labels).toEqual(expect.arrayContaining([
      'Pintu Masuk Utama',
      'Pintu Masuk Belakang (Parking Bas UTM)',
      'Cafe Pegawai',
      'BTMK',
      'Library PSZ',
      'CICT',
      'Cafe (V1)',
      'Dewan Tan Sri Ainuddin Wahid',
      'Klinik UTM',
      'MJIIT',
      'Cafe (MJIIT)',
      'Residensi UTMKL',
      'Menara Razak',
      'Anjung Menara Razak',
      'Dewan Azman Hashim',
      'Masjid UTMKL',
    ]))
    const unnamed = campusRouteNodes.find(node => !node.label)!
    expect(campusNodeName(unnamed)).toMatch(/^Unlabelled junction \d+$/)
  })

  it('routes between any two connected nodes and keeps every new segment unknown/grey', () => {
    const snapshot = currentSnapshot(initialWorkflow())
    const route = compareRoutes(snapshot, campusWideGraph, 'CICT', 'RESIDENSI-UTMKL')
    expect(route.shortest).not.toBeNull()
    expect(route.shortest!.node_ids[0]).toBe('CICT')
    expect(route.shortest!.node_ids.at(-1)).toBe('RESIDENSI-UTMKL')
    expect(route.shortest!.segment_ids.length).toBeGreaterThan(1)
    expect(route.shortest!.edges.every(edge => edge.shade_label === 'unknown' && edge.shade_data_status === 'unknown')).toBe(true)
    expect(route.shortest!.unknown_coverage_pct).toBe(100)
    expect(route.identical_path).toBe(true)
    expect(route.warnings.join(' ')).toContain('not for navigation')
  })

  it('routes in either direction and refuses the same point as both endpoints', () => {
    const snapshot = currentSnapshot(initialWorkflow())
    const forward = compareRoutes(snapshot, campusWideGraph, 'MAIN-GATE', 'KLINIK-UTM')
    const reverse = compareRoutes(snapshot, campusWideGraph, 'KLINIK-UTM', 'MAIN-GATE')
    expect(forward.shortest?.distance_m).toBe(reverse.shortest?.distance_m)
    expect(forward.shortest?.segment_ids).toEqual([...reverse.shortest!.segment_ids].reverse())
    expect(compareRoutes(snapshot, campusWideGraph, 'CICT', 'CICT').shortest).toBeNull()
  })
})
