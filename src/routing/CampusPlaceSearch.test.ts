import { describe, expect, it } from 'vitest'
import { findCampusPlaces } from './CampusPlaceSearch'

describe('campus place discovery', () => {
  it('supports the English names visitors use for the existing gate and clinic', () => {
    expect(findCampusPlaces('MAIN gate').map(n => n.id)).toContain('MAIN-GATE')
    expect(findCampusPlaces('clinic').map(n => n.id)).toContain('KLINIK-UTM')
    expect(findCampusPlaces('clinic')[0].id).toBe('KLINIK-UTM')
    expect(findCampusPlaces('pintu utama').map(n => n.id)).toContain('MAIN-GATE')
  })
  it('matches all query words and keeps unknown places unavailable', () => {
    expect(findCampusPlaces('MJIIT east').map(n => n.id)).toContain('CAFE-MJIIT')
    expect(findCampusPlaces('main clinic')).toEqual([])
    expect(findCampusPlaces('not a real building')).toEqual([])
    expect(findCampusPlaces('   ')).toEqual([])
  })
})
