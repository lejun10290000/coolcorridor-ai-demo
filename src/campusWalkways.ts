/**
 * Campus-wide illustrative walking graph traced from the user-supplied UTM KL map.
 * Coordinates are pixels on the 1088 x 1382 reference image, NOT geographic coordinates.
 * The source has no defensible scale. Lengths are rough planning estimates (0.20 m per
 * reference-image pixel) to compare paths only; not for navigation. Every edge begins
 * UNSURVEYED / UNKNOWN.
 */
export interface CampusRouteNode { id: string; x: number; y: number; label?: string }
export interface CampusWalkLink {
  edge_id: string; segment_id: string; from: string; to: string
  points: { x: number; y: number }[]; estimated_length_m: number; source: string
}
export const referenceMap = { width: 1088, height: 1382 }
export const illustrativeMetresPerPixel = 0.2

export const campusRouteNodes: CampusRouteNode[] = [
  { id: 'MAIN-GATE', x: 212, y: 900, label: 'Pintu Masuk Utama' },
  { id: 'WEST-SOUTH-01', x: 205, y: 837 },
  { id: 'WEST-MIDDLE-01', x: 203, y: 750 },
  { id: 'WEST-MIDDLE-02', x: 205, y: 650 },
  { id: 'WEST-UPPER-01', x: 216, y: 550 },
  { id: 'CAFE-PEGAWAI', x: 252, y: 428, label: 'Cafe Pegawai' },
  { id: 'WEST-NORTH-01', x: 325, y: 328 },
  { id: 'NORTH-WEST-01', x: 388, y: 190 },
  { id: 'NORTH-WEST-02', x: 543, y: 133 },
  { id: 'NORTH-TOP-01', x: 735, y: 105 },
  { id: 'NORTH-TOP-02', x: 854, y: 96 },
  { id: 'NORTH-EAST-01', x: 854, y: 162 },
  { id: 'NORTH-EAST-02', x: 833, y: 238 },
  { id: 'NORTH-EAST-03', x: 902, y: 325 },
  { id: 'NORTH-EAST-04', x: 902, y: 444 },
  { id: 'REAR-GATE', x: 955, y: 445, label: 'Pintu Masuk Belakang (Parking Bas UTM)' },
  { id: 'EAST-UPPER-01', x: 1010, y: 609 },
  { id: 'FIELD-EAST-NORTH', x: 920, y: 640 },
  { id: 'RESIDENSI-UTMKL', x: 920, y: 733, label: 'Residensi UTMKL' },
  { id: 'FIELD-EAST-SOUTH', x: 904, y: 830 },
  { id: 'EAST-LOWER-01', x: 904, y: 1029 },
  { id: 'SOUTH-EAST-01', x: 729, y: 1090 },
  { id: 'SOUTH-BOTTOM-01', x: 610, y: 1132 },
  { id: 'SOUTH-CENTRE-01', x: 579, y: 1061 },
  { id: 'DEWAN-AZMAN-HASHIM', x: 431, y: 1020, label: 'Dewan Azman Hashim' },
  { id: 'SOUTH-WEST-01', x: 333, y: 976 },
  { id: 'RAZAK-SOUTH-01', x: 415, y: 924 },
  { id: 'MENARA-RAZAK', x: 415, y: 887, label: 'Menara Razak' },
  { id: 'ANJUNG-MENARA-RAZAK', x: 500, y: 930, label: 'Anjung Menara Razak' },
  { id: 'RAZAK-NORTH-01', x: 533, y: 871 },
  { id: 'RAZAK-EAST-01', x: 608, y: 956 },
  { id: 'RAZAK-EAST-02', x: 650, y: 955 },
  { id: 'MASJID-LOWER-01', x: 767, y: 1062 },
  { id: 'MASJID-UTMKL', x: 767, y: 968, label: 'Masjid UTMKL' },
  { id: 'MJIIT', x: 765, y: 812, label: 'MJIIT' },
  { id: 'CAFE-MJIIT', x: 703, y: 797, label: 'Cafe (MJIIT)' },
  { id: 'FIELD-SOUTH-WEST', x: 703, y: 960 },
  { id: 'FIELD-NORTH-WEST', x: 777, y: 477 },
  { id: 'FIELD-NORTH-EAST', x: 833, y: 493 },
  { id: 'FIELD-WEST-01', x: 648, y: 527 },
  { id: 'CAFE-V1', x: 585, y: 515, label: 'Cafe (V1)' },
  { id: 'CICT', x: 484, y: 531, label: 'CICT' },
  { id: 'CENTRAL-PA3-01', x: 470, y: 565 },
  { id: 'DEWAN-TAN-SRI-AINUDDIN-WAHID', x: 410, y: 606, label: 'Dewan Tan Sri Ainuddin Wahid' },
  { id: 'PA1-AREA-01', x: 442, y: 649 },
  { id: 'PA7-AREA-01', x: 415, y: 744 },
  { id: 'PA5-AREA-01', x: 525, y: 684 },
  { id: 'LAWN-AREA-01', x: 525, y: 750 },
  { id: 'MJIIT-WEST-01', x: 610, y: 780 },
  { id: 'BTMK', x: 315, y: 443, label: 'BTMK' },
  { id: 'LIBRARY-PSZ', x: 315, y: 515, label: 'Library PSZ' },
  { id: 'LIBRARY-EAST-01', x: 355, y: 555 },
  { id: 'KLINIK-APPROACH-01', x: 704, y: 358 },
  { id: 'KLINIK-APPROACH-02', x: 815, y: 292 },
  { id: 'KLINIK-UTM', x: 733, y: 308, label: 'Klinik UTM' },
  { id: 'EAST-CENTRE-01', x: 778, y: 447 },
  { id: 'EAST-CENTRE-02', x: 834, y: 395 },
  { id: 'WEST-CENTRE-01', x: 390, y: 560 },
  { id: 'INNER-GATE-01', x: 315, y: 888 },
]

const pairs: [string, string][] = [
  ['MAIN-GATE','WEST-SOUTH-01'],
  ['WEST-SOUTH-01','WEST-MIDDLE-01'],
  ['WEST-MIDDLE-01','WEST-MIDDLE-02'],
  ['WEST-MIDDLE-02','WEST-UPPER-01'],
  ['WEST-UPPER-01','CAFE-PEGAWAI'],
  ['CAFE-PEGAWAI','BTMK'],
  ['CAFE-PEGAWAI','WEST-NORTH-01'],
  ['WEST-NORTH-01','NORTH-WEST-01'],
  ['NORTH-WEST-01','NORTH-WEST-02'],
  ['NORTH-WEST-02','NORTH-TOP-01'],
  ['NORTH-TOP-01','NORTH-TOP-02'],
  ['NORTH-TOP-02','NORTH-EAST-01'],
  ['NORTH-EAST-01','NORTH-EAST-02'],
  ['NORTH-EAST-02','NORTH-EAST-03'],
  ['NORTH-EAST-03','NORTH-EAST-04'],
  ['NORTH-EAST-04','REAR-GATE'],
  ['REAR-GATE','EAST-UPPER-01'],
  ['EAST-UPPER-01','FIELD-EAST-NORTH'],
  ['FIELD-EAST-NORTH','RESIDENSI-UTMKL'],
  ['RESIDENSI-UTMKL','FIELD-EAST-SOUTH'],
  ['FIELD-EAST-SOUTH','EAST-LOWER-01'],
  ['EAST-LOWER-01','SOUTH-EAST-01'],
  ['SOUTH-EAST-01','SOUTH-BOTTOM-01'],
  ['SOUTH-BOTTOM-01','SOUTH-CENTRE-01'],
  ['SOUTH-CENTRE-01','DEWAN-AZMAN-HASHIM'],
  ['DEWAN-AZMAN-HASHIM','SOUTH-WEST-01'],
  ['SOUTH-WEST-01','MENARA-RAZAK'],
  ['MAIN-GATE','INNER-GATE-01'],
  ['INNER-GATE-01','MENARA-RAZAK'],
  ['MENARA-RAZAK','RAZAK-SOUTH-01'],
  ['RAZAK-SOUTH-01','ANJUNG-MENARA-RAZAK'],
  ['ANJUNG-MENARA-RAZAK','DEWAN-AZMAN-HASHIM'],
  ['MENARA-RAZAK','RAZAK-NORTH-01'],
  ['RAZAK-NORTH-01','RAZAK-EAST-01'],
  ['RAZAK-EAST-01','RAZAK-EAST-02'],
  ['RAZAK-EAST-02','FIELD-SOUTH-WEST'],
  ['FIELD-SOUTH-WEST','MASJID-UTMKL'],
  ['MASJID-UTMKL','MASJID-LOWER-01'],
  ['MASJID-LOWER-01','SOUTH-EAST-01'],
  ['MJIIT','CAFE-MJIIT'],
  ['MJIIT','FIELD-EAST-SOUTH'],
  ['MJIIT','FIELD-NORTH-WEST'],
  ['CAFE-MJIIT','MJIIT-WEST-01'],
  ['MJIIT-WEST-01','LAWN-AREA-01'],
  ['LAWN-AREA-01','PA5-AREA-01'],
  ['PA5-AREA-01','PA1-AREA-01'],
  ['PA1-AREA-01','PA7-AREA-01'],
  ['PA7-AREA-01','MENARA-RAZAK'],
  ['PA1-AREA-01','DEWAN-TAN-SRI-AINUDDIN-WAHID'],
  ['DEWAN-TAN-SRI-AINUDDIN-WAHID','WEST-CENTRE-01'],
  ['WEST-CENTRE-01','LIBRARY-EAST-01'],
  ['LIBRARY-EAST-01','LIBRARY-PSZ'],
  ['LIBRARY-PSZ','BTMK'],
  ['LIBRARY-PSZ','WEST-MIDDLE-02'],
  ['LIBRARY-PSZ','DEWAN-TAN-SRI-AINUDDIN-WAHID'],
  ['DEWAN-TAN-SRI-AINUDDIN-WAHID','CENTRAL-PA3-01'],
  ['CENTRAL-PA3-01','CICT'],
  ['CICT','CAFE-V1'],
  ['CAFE-V1','FIELD-WEST-01'],
  ['FIELD-WEST-01','FIELD-NORTH-WEST'],
  ['FIELD-NORTH-WEST','FIELD-NORTH-EAST'],
  ['FIELD-NORTH-EAST','FIELD-EAST-NORTH'],
  ['FIELD-WEST-01','KLINIK-APPROACH-01'],
  ['KLINIK-APPROACH-01','KLINIK-UTM'],
  ['KLINIK-UTM','KLINIK-APPROACH-02'],
  ['KLINIK-APPROACH-02','NORTH-EAST-02'],
  ['KLINIK-APPROACH-02','EAST-CENTRE-02'],
  ['EAST-CENTRE-02','REAR-GATE'],
  ['EAST-CENTRE-02','EAST-CENTRE-01'],
  ['EAST-CENTRE-01','FIELD-NORTH-WEST'],
]

const nodeById = new Map(campusRouteNodes.map(node => [node.id, node]))
const sourceNote = 'Illustrative connection visually traced from the supplied campus map. Walkability, crossings, access, width, surface, shade and scale are UNSURVEYED.'

function lineLength(points: { x: number; y: number }[]) {
  return points.slice(1).reduce((sum, p, index) => sum + Math.hypot(p.x - points[index].x, p.y - points[index].y), 0)
}
export function estimateCampusWalkLengthM(points: { x: number; y: number }[]) {
  return Math.max(1, Math.round(lineLength(points) * illustrativeMetresPerPixel))
}
export const campusWalkLinks: CampusWalkLink[] = pairs.map(([from, to], index) => {
  const a = nodeById.get(from), b = nodeById.get(to)
  if (!a || !b) throw new Error('Campus route graph references a missing node.')
  const points = [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]
  return {
    edge_id: 'EDGE-WALK-' + String(index + 1).padStart(2, '0'),
    segment_id: 'DEMO-WALK-' + String(index + 1).padStart(2, '0'),
    from, to, points,
    estimated_length_m: estimateCampusWalkLengthM(points),
    source: sourceNote,
  }
})
export function campusNodeName(node: CampusRouteNode) {
  if (node.label) return node.label
  const number = campusRouteNodes.filter(n => !n.label).findIndex(n => n.id === node.id) + 1
  return 'Unlabelled junction ' + String(number).padStart(2, '0')
}
