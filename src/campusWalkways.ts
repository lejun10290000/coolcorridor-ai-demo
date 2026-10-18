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
export const referenceMap = { width: 1290, height: 1640 }
export const illustrativeMetresPerPixel = 0.2

export const campusRouteNodes: CampusRouteNode[] = [
  { id: 'MAIN-GATE', x: 285, y: 1075, label: 'Pintu Masuk Utama' },
  { id: 'WEST-SOUTH-01', x: 275, y: 1000 },
  { id: 'WEST-MIDDLE-01', x: 265, y: 880 },
  { id: 'WEST-MIDDLE-02', x: 265, y: 745 },
  { id: 'WEST-UPPER-01', x: 270, y: 620 },
  { id: 'CAFE-PEGAWAI', x: 275, y: 495, label: 'Cafe Pegawai' },
  { id: 'WEST-NORTH-01', x: 330, y: 420 },
  { id: 'NORTH-WEST-01', x: 420, y: 290 },
  { id: 'NORTH-WEST-02', x: 560, y: 220 },
  { id: 'NORTH-TOP-01', x: 765, y: 140 },
  { id: 'NORTH-TOP-02', x: 940, y: 130 },
  { id: 'NORTH-EAST-01', x: 1010, y: 225 },
  { id: 'NORTH-EAST-02', x: 980, y: 335 },
  { id: 'NORTH-EAST-03', x: 1080, y: 425 },
  { id: 'NORTH-EAST-04', x: 1115, y: 500 },
  { id: 'REAR-GATE', x: 1131, y: 522, label: 'Pintu Masuk Belakang (Parking Bas UTM)' },
  { id: 'EAST-UPPER-01', x: 1160, y: 650 },
  { id: 'FIELD-EAST-NORTH', x: 975, y: 690 },
  { id: 'RESIDENSI-UTMKL', x: 1030, y: 885, label: 'Residensi UTMKL' },
  { id: 'FIELD-EAST-SOUTH', x: 970, y: 1000 },
  { id: 'EAST-LOWER-01', x: 970, y: 1135 },
  { id: 'SOUTH-EAST-01', x: 870, y: 1285 },
  { id: 'SOUTH-BOTTOM-01', x: 720, y: 1350 },
  { id: 'SOUTH-CENTRE-01', x: 640, y: 1190 },
  { id: 'DEWAN-AZMAN-HASHIM', x: 480, y: 1210, label: 'Dewan Azman Hashim' },
  { id: 'SOUTH-WEST-01', x: 345, y: 1245 },
  { id: 'RAZAK-SOUTH-01', x: 390, y: 1045 },
  { id: 'MENARA-RAZAK', x: 415, y: 1010, label: 'Menara Razak' },
  { id: 'ANJUNG-MENARA-RAZAK', x: 570, y: 1100, label: 'Anjung Menara Razak' },
  { id: 'RAZAK-NORTH-01', x: 500, y: 985 },
  { id: 'RAZAK-EAST-01', x: 625, y: 1110 },
  { id: 'RAZAK-EAST-02', x: 690, y: 1115 },
  { id: 'MASJID-LOWER-01', x: 900, y: 1200 },
  { id: 'MASJID-UTMKL', x: 920, y: 1155, label: 'Masjid UTMKL' },
  { id: 'MJIIT', x: 710, y: 900, label: 'MJIIT' },
  { id: 'CAFE-MJIIT', x: 830, y: 930, label: 'Cafe (MJIIT)' },
  { id: 'FIELD-SOUTH-WEST', x: 780, y: 1000 },
  { id: 'FIELD-NORTH-WEST', x: 770, y: 625 },
  { id: 'FIELD-NORTH-EAST', x: 930, y: 650 },
  { id: 'FIELD-WEST-01', x: 700, y: 620 },
  { id: 'CAFE-V1', x: 720, y: 600, label: 'Cafe (V1)' },
  { id: 'CICT', x: 600, y: 615, label: 'CICT' },
  { id: 'CENTRAL-PA3-01', x: 560, y: 655 },
  { id: 'DEWAN-TAN-SRI-AINUDDIN-WAHID', x: 475, y: 690, label: 'Dewan Tan Sri Ainuddin Wahid' },
  { id: 'PA1-AREA-01', x: 500, y: 750 },
  { id: 'PA7-AREA-01', x: 470, y: 820 },
  { id: 'PA5-AREA-01', x: 610, y: 760 },
  { id: 'LAWN-AREA-01', x: 600, y: 830 },
  { id: 'MJIIT-WEST-01', x: 610, y: 900 },
  { id: 'BTMK', x: 395, y: 530, label: 'BTMK' },
  { id: 'LIBRARY-PSZ', x: 350, y: 590, label: 'Library PSZ' },
  { id: 'LIBRARY-EAST-01', x: 390, y: 620 },
  { id: 'KLINIK-APPROACH-01', x: 820, y: 400 },
  { id: 'KLINIK-APPROACH-02', x: 850, y: 340 },
  { id: 'KLINIK-UTM', x: 884, y: 312, label: 'Klinik UTM' },
  { id: 'EAST-CENTRE-01', x: 875, y: 490 },
  { id: 'EAST-CENTRE-02', x: 930, y: 430 },
  { id: 'WEST-CENTRE-01', x: 470, y: 630 },
  { id: 'INNER-GATE-01', x: 360, y: 1080 },
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
const sourceNote = 'Illustrative connection visually traced from the supplied campus map; not surveyed. Walkability, crossings, access, width, surface, shade and scale remain UNSURVEYED.'

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
