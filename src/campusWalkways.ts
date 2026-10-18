/**
 * Campus-wide illustrative walking graph traced from the user-supplied UTM KL map.
 * Coordinates are native pixels on the 1290 x 1640 campus map image, NOT geographic coordinates.
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
  { id: 'CAFE-PEGAWAI', x: 310, y: 510, label: 'Cafe Pegawai' },
  { id: 'WEST-NORTH-01', x: 330, y: 420 },
  { id: 'NORTH-WEST-01', x: 365, y: 300 },
  { id: 'NORTH-WEST-02', x: 580, y: 165 },
  { id: 'NORTH-TOP-01', x: 765, y: 140 },
  { id: 'NORTH-TOP-02', x: 940, y: 130 },
  { id: 'NORTH-EAST-01', x: 1010, y: 225 },
  { id: 'NORTH-EAST-02', x: 980, y: 335 },
  { id: 'NORTH-EAST-03', x: 1080, y: 425 },
  { id: 'NORTH-EAST-04', x: 1115, y: 500 },
  { id: 'REAR-GATE', x: 1131, y: 522, label: 'Pintu Masuk Belakang (Parking Bas UTM)' },
  { id: 'EAST-UPPER-01', x: 1160, y: 650 },
  { id: 'FIELD-EAST-NORTH', x: 1010, y: 700 },
  { id: 'RESIDENSI-UTMKL', x: 1110, y: 960, label: 'Residensi UTMKL' },
  { id: 'FIELD-EAST-SOUTH', x: 1000, y: 1005 },
  { id: 'EAST-LOWER-01', x: 1085, y: 1135 },
  { id: 'SOUTH-EAST-01', x: 930, y: 1290 },
  { id: 'SOUTH-BOTTOM-01', x: 720, y: 1350 },
  { id: 'SOUTH-CENTRE-01', x: 640, y: 1190 },
  { id: 'DEWAN-AZMAN-HASHIM', x: 420, y: 1220, label: 'Dewan Azman Hashim' },
  { id: 'SOUTH-WEST-01', x: 350, y: 1185 },
  { id: 'RAZAK-SOUTH-01', x: 510, y: 1040 },
  { id: 'MENARA-RAZAK', x: 490, y: 1000, label: 'Menara Razak' },
  { id: 'ANJUNG-MENARA-RAZAK', x: 585, y: 1110, label: 'Anjung Menara Razak' },
  { id: 'RAZAK-NORTH-01', x: 500, y: 985 },
  { id: 'RAZAK-EAST-01', x: 625, y: 1110 },
  { id: 'RAZAK-EAST-02', x: 690, y: 1115 },
  { id: 'MASJID-LOWER-01', x: 960, y: 1210 },
  { id: 'MASJID-UTMKL', x: 1000, y: 1150, label: 'Masjid UTMKL' },
  { id: 'MJIIT', x: 805, y: 850, label: 'MJIIT' },
  { id: 'CAFE-MJIIT', x: 860, y: 935, label: 'Cafe (MJIIT)' },
  { id: 'FIELD-SOUTH-WEST', x: 780, y: 1000 },
  { id: 'FIELD-NORTH-WEST', x: 760, y: 590 },
  { id: 'FIELD-NORTH-EAST', x: 990, y: 650 },
  { id: 'FIELD-WEST-01', x: 700, y: 610 },
  { id: 'CAFE-V1', x: 740, y: 615, label: 'Cafe (V1)' },
  { id: 'CICT', x: 635, y: 640, label: 'CICT' },
  { id: 'CENTRAL-PA3-01', x: 600, y: 690 },
  { id: 'DEWAN-TAN-SRI-AINUDDIN-WAHID', x: 500, y: 715, label: 'Dewan Tan Sri Ainuddin Wahid' },
  { id: 'PA1-AREA-01', x: 540, y: 785 },
  { id: 'PA7-AREA-01', x: 450, y: 820 },
  { id: 'PA5-AREA-01', x: 590, y: 760 },
  { id: 'LAWN-AREA-01', x: 540, y: 830 },
  { id: 'MJIIT-WEST-01', x: 570, y: 875 },
  { id: 'BTMK', x: 410, y: 565, label: 'BTMK' },
  { id: 'LIBRARY-PSZ', x: 390, y: 615, label: 'Library PSZ' },
  { id: 'LIBRARY-EAST-01', x: 420, y: 620 },
  { id: 'KLINIK-APPROACH-01', x: 820, y: 375 },
  { id: 'KLINIK-APPROACH-02', x: 930, y: 365 },
  { id: 'KLINIK-UTM', x: 895, y: 345, label: 'Klinik UTM' },
  { id: 'EAST-CENTRE-01', x: 920, y: 480 },
  { id: 'EAST-CENTRE-02', x: 990, y: 420 },
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
  ['EAST-CENTRE-02','EAST-CENTRE-01'],
  ['EAST-CENTRE-01','FIELD-NORTH-WEST'],
]

const nodeById = new Map(campusRouteNodes.map(node => [node.id, node]))
const sourceNote = 'Illustrative connection visually traced from the supplied campus map; not surveyed. Walkability, crossings, access, width, surface, shade and scale remain UNSURVEYED.'

// Bends keep longer links on the visible pedestrian corridors instead of drawing straight
// chords across campus buildings or the football field. Coordinates are native image pixels.
const viaByPair: Record<string, { x: number; y: number }[]> = {
  'WEST-UPPER-01::CAFE-PEGAWAI': [{x:280,y:585},{x:295,y:545}],
  'CICT::CAFE-V1': [{x:675,y:625},{x:710,y:620}],
  'CAFE-PEGAWAI::BTMK': [{x:335,y:520},{x:365,y:545},{x:395,y:560}],
  'CAFE-PEGAWAI::WEST-NORTH-01': [{x:305,y:475},{x:315,y:445}],
  'WEST-NORTH-01::NORTH-WEST-01': [{x:330,y:385},{x:340,y:350}],
  'NORTH-WEST-01::NORTH-WEST-02': [{x:365,y:260},{x:385,y:220},{x:415,y:185},{x:460,y:155},{x:520,y:150}],
  'NORTH-WEST-02::NORTH-TOP-01': [{x:620,y:155},{x:680,y:150},{x:725,y:145}],
  'NORTH-TOP-02::NORTH-EAST-01': [{x:970,y:155},{x:995,y:185}],
  'NORTH-EAST-01::NORTH-EAST-02': [{x:1000,y:270}],
  'NORTH-EAST-02::NORTH-EAST-03': [{x:1015,y:365},{x:1055,y:395}],
  'NORTH-EAST-03::NORTH-EAST-04': [{x:1095,y:455}],
  'EAST-UPPER-01::FIELD-EAST-NORTH': [{x:1140,y:665},{x:1100,y:685},{x:1060,y:695}],
  'FIELD-EAST-NORTH::RESIDENSI-UTMKL': [{x:1030,y:745},{x:1060,y:805},{x:1090,y:865},{x:1105,y:920}],
  'RESIDENSI-UTMKL::FIELD-EAST-SOUTH': [{x:1100,y:985},{x:1060,y:1000}],
  'EAST-LOWER-01::SOUTH-EAST-01': [{x:1065,y:1170},{x:1020,y:1220},{x:975,y:1260}],
  'SOUTH-EAST-01::SOUTH-BOTTOM-01': [{x:875,y:1320},{x:810,y:1340},{x:760,y:1345}],
  'SOUTH-BOTTOM-01::SOUTH-CENTRE-01': [{x:700,y:1310},{x:665,y:1260},{x:645,y:1220}],
  'SOUTH-CENTRE-01::DEWAN-AZMAN-HASHIM': [{x:600,y:1195},{x:550,y:1205},{x:470,y:1215}],
  'DEWAN-AZMAN-HASHIM::SOUTH-WEST-01': [{x:395,y:1230},{x:365,y:1215}],
  'MAIN-GATE::INNER-GATE-01': [{x:315,y:1075},{x:340,y:1078}],
  'INNER-GATE-01::MENARA-RAZAK': [{x:385,y:1055},{x:425,y:1030},{x:450,y:1020}],
  'RAZAK-SOUTH-01::ANJUNG-MENARA-RAZAK': [{x:525,y:1055},{x:550,y:1080},{x:575,y:1095}],
  'ANJUNG-MENARA-RAZAK::DEWAN-AZMAN-HASHIM': [{x:550,y:1135},{x:515,y:1170},{x:470,y:1200}],
  'MENARA-RAZAK::RAZAK-NORTH-01': [{x:495,y:990}],
  'RAZAK-NORTH-01::RAZAK-EAST-01': [{x:535,y:1020},{x:575,y:1060},{x:610,y:1090}],
  'RAZAK-EAST-02::FIELD-SOUTH-WEST': [{x:710,y:1080},{x:740,y:1040}],
  'FIELD-SOUTH-WEST::MASJID-UTMKL': [{x:815,y:1030},{x:855,y:1070},{x:900,y:1115},{x:940,y:1140}],
  'MASJID-UTMKL::MASJID-LOWER-01': [{x:970,y:1180}],
  'MASJID-LOWER-01::SOUTH-EAST-01': [{x:955,y:1240}],
  'MJIIT::CAFE-MJIIT': [{x:815,y:875},{x:830,y:900}],
  'MJIIT::FIELD-EAST-SOUTH': [{x:835,y:870},{x:890,y:910},{x:945,y:960},{x:980,y:990}],
  'MJIIT::FIELD-NORTH-WEST': [{x:780,y:810},{x:765,y:765},{x:760,y:710},{x:760,y:650},{x:760,y:610}],
  'CAFE-MJIIT::MJIIT-WEST-01': [{x:855,y:915},{x:845,y:885},{x:820,y:845},{x:780,y:820},{x:740,y:820},{x:700,y:830},{x:650,y:850},{x:600,y:870}],
  'MJIIT-WEST-01::LAWN-AREA-01': [{x:565,y:855},{x:555,y:835}],
  'LAWN-AREA-01::PA5-AREA-01': [{x:555,y:790},{x:575,y:770}],
  'PA5-AREA-01::PA1-AREA-01': [{x:570,y:755},{x:555,y:770}],
  'PA7-AREA-01::MENARA-RAZAK': [{x:440,y:850},{x:435,y:900},{x:435,y:950},{x:445,y:985}],
  'PA1-AREA-01::DEWAN-TAN-SRI-AINUDDIN-WAHID': [{x:550,y:765},{x:540,y:735},{x:520,y:715}],
  'DEWAN-TAN-SRI-AINUDDIN-WAHID::WEST-CENTRE-01': [{x:480,y:670},{x:475,y:645}],
  'WEST-CENTRE-01::LIBRARY-EAST-01': [{x:445,y:620}],
  'LIBRARY-EAST-01::LIBRARY-PSZ': [{x:395,y:610},{x:380,y:600}],
  'LIBRARY-PSZ::BTMK': [{x:375,y:575},{x:390,y:560}],
  'LIBRARY-PSZ::WEST-MIDDLE-02': [{x:320,y:625},{x:290,y:675},{x:270,y:715}],
  'LIBRARY-PSZ::DEWAN-TAN-SRI-AINUDDIN-WAHID': [{x:395,y:635},{x:430,y:655},{x:460,y:680}],
  'DEWAN-TAN-SRI-AINUDDIN-WAHID::CENTRAL-PA3-01': [{x:505,y:685},{x:535,y:670}],
  'CAFE-V1::FIELD-WEST-01': [{x:715,y:615}],
  'FIELD-NORTH-WEST::FIELD-NORTH-EAST': [{x:800,y:585},{x:855,y:590},{x:920,y:615},{x:965,y:640}],
  'FIELD-NORTH-EAST::FIELD-EAST-NORTH': [{x:950,y:655},{x:980,y:675}],
  'FIELD-WEST-01::KLINIK-APPROACH-01': [{x:720,y:575},{x:740,y:525},{x:770,y:475},{x:800,y:435}],
  'KLINIK-APPROACH-01::KLINIK-UTM': [{x:845,y:360}],
  'KLINIK-UTM::KLINIK-APPROACH-02': [{x:910,y:350},{x:920,y:360}],
  'KLINIK-APPROACH-02::NORTH-EAST-02': [{x:955,y:355},{x:970,y:345}],
  'KLINIK-APPROACH-02::EAST-CENTRE-02': [{x:950,y:385},{x:970,y:405}],
  'EAST-CENTRE-02::EAST-CENTRE-01': [{x:965,y:445},{x:940,y:465}],
  'EAST-CENTRE-01::FIELD-NORTH-WEST': [{x:890,y:510},{x:850,y:540},{x:820,y:575},{x:785,y:610}],
}

function lineLength(points: { x: number; y: number }[]) {
  return points.slice(1).reduce((sum, p, index) => sum + Math.hypot(p.x - points[index].x, p.y - points[index].y), 0)
}
export function estimateCampusWalkLengthM(points: { x: number; y: number }[]) {
  return Math.max(1, Math.round(lineLength(points) * illustrativeMetresPerPixel))
}
export const campusWalkLinks: CampusWalkLink[] = pairs.map(([from, to], index) => {
  const a = nodeById.get(from), b = nodeById.get(to)
  if (!a || !b) throw new Error('Campus route graph references a missing node.')
  const points = [a, ...(viaByPair[from + '::' + to] ?? []), b].map(({x,y}) => ({x,y}))
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
