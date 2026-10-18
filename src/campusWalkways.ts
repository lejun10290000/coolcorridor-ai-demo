/** Exact pixels of the operator's 1113x1414 annotated reference, received 18 Oct 2026.
 * Visible nodes are the drawn circle centres; additional graph junctions are invisible.
 * Alignment to a planning illustration is not field verification or georeferencing.
 */
export interface CampusRouteNode { id:string; x:number; y:number; label?:string; selectable?:boolean }
export interface CampusWalkLink { edge_id:string; segment_id:string; from:string; to:string; points:{x:number;y:number}[]; estimated_length_m:number; source:string }
// Keep the original coordinate frame; the edited background removes only the fixed route example.
export const referenceMap={width:1113,height:1414,asset:'maps/utmkul-reference-normal-points.png'}
export const illustrativeMetresPerPixel=0.2
// Labels describe nearby access, not surveyed building entrances. Unlabelled source circles
// remain neutral junctions rather than inventing a landmark for every dot.
export const campusRouteNodes:CampusRouteNode[]=[
 {id:'MAIN-GATE',x:216,y:922,label:'Pintu Masuk Utama'},
 {id:'INNER-GATE',x:325,y:913,label:'Menara Razak access'},
 {id:'RAZAK-ENTRANCE',x:394,y:913},
 {id:'DEWAN-AZMAN-HASHIM',x:325,y:995,label:'Dewan Azman Hashim access'},
 {id:'GATE-SOUTH-SPUR',x:276,y:949},
 {id:'RAZAK-EAST',x:546,y:891},
 {id:'ANJUNG-MENARA-RAZAK',x:622,y:976,label:'Anjung Menara Razak access'},
 {id:'MASJID-UTMKL',x:695,y:977,label:'Masjid UTMKL access'},
 {id:'PARKING-WEST',x:594,y:1088},
 {id:'PARKING-SOUTH',x:623,y:1164},
 {id:'MJIIT-SOUTH-EAST',x:819,y:887},
 {id:'CAFE-MJIIT',x:782,y:832,label:'Cafe / MJIIT east access'},
 {id:'RESIDENSI-UTMKL',x:939,y:731,label:'Residensi UTMKL access'},
 {id:'RESIDENSI-EAST',x:1027,y:749},
 {id:'RESIDENSI-NORTH-WEST',x:941,y:678},
 {id:'RESIDENSI-NORTH-EAST',x:1028,y:648},
 {id:'FIELD-EAST',x:901,y:609},
 {id:'FIELD-NORTH-EAST',x:850,y:550},
 {id:'FIELD-EAST-CORNER',x:919,y:518},
 {id:'FIELD-NORTH',x:795,y:488},
 {id:'REAR-GATE',x:977,y:456,label:'Pintu Masuk Belakang (Parking Bas UTM)'},
 {id:'ENGINEERING-SOUTH',x:852,y:403},
 {id:'Y2-EAST',x:769,y:442},
 {id:'Y2-NORTH',x:746,y:410},
 {id:'CAFE-V1',x:598,y:569,label:'Cafe (V1) access'},
 {id:'FIELD-NORTH-WEST',x:664,y:542},
 {id:'FIELD-WEST-SPUR',x:648,y:646},
 {id:'MJIIT',x:534,y:716,label:'MJIIT west access'},
 {id:'CICT',x:495,y:497,label:'CICT access'},
 {id:'CICT-WEST',x:420,y:532},
 {id:'DATARAN-ILMU',x:430,y:551},
 {id:'PA9-SPUR',x:231,y:666},
 {id:'LIBRARY-PSZ',x:226,y:501,label:'Library PSZ access'},
 {id:'CAFE-PEGAWAI',x:259,y:437,label:'Cafe Pegawai access'},
 {id:'WEST-UPPER',x:283,y:331},
 {id:'NORTH-WEST',x:394,y:179},
 {id:'L-NORTH-WEST',x:405,y:197},
 {id:'L1-ACCESS',x:557,y:138},
 {id:'M-NORTH',x:599,y:220},
 {id:'M1-NORTH',x:666,y:193},
 {id:'M2-NORTH',x:719,y:167},
 {id:'NORTH-JUNCTION',x:753,y:110},
 {id:'NORTH-EAST',x:875,y:100},
 {id:'TAMAN-ACCESS',x:866,y:171},
 {id:'M1-EAST',x:787,y:204},
 {id:'M4-SOUTH',x:852,y:242},
 {id:'CLINIC-NORTH-EAST',x:862,y:278},
 {id:'ENGINEERING-NORTH-EAST',x:920,y:256},
 {id:'ENGINEERING-NORTH',x:878,y:300},
 {id:'CLINIC-EAST',x:805,y:305},
 {id:'CLINIC-ROAD-JUNCTION',x:832,y:289},
 {id:'CLINIC-NORTH',x:818,y:259},
 {id:'M-EAST',x:645,y:310},
 {id:'M-SOUTH-EAST',x:651,y:329},
 {id:'KLINIK-UTM',x:747,y:317,label:'Klinik UTM'},
 {id:'B3-NORTH',x:572,y:366},
 {id:'B3-WEST',x:527,y:383},
 {id:'B3-SOUTH',x:566,y:466},
 {id:'P3-NORTH',x:631,y:478},
 {id:'ENGINEERING-EAST',x:912,y:370},
]
const junctions:CampusRouteNode[]=[
 {id:'J-GATE',x:270,y:883},{id:'J-J4',x:355,y:820},
 {id:'J-PA7',x:406,y:802},{id:'J-TENNIS',x:449,y:775},
 {id:'J-PA5',x:487,y:653},{id:'J-PA1',x:474,y:619},
 {id:'J-V1',x:581,y:574},{id:'J-P3',x:566,y:500},
 {id:'J-Y2',x:694,y:425},{id:'J-CLINIC',x:680,y:347},
 {id:'J-ENGINEERING',x:887,y:473},
 {id:'J-M1',x:625,y:263},{id:'J-M2',x:768,y:151},
 {id:'J-L',x:430,y:267},{id:'J-BLOCKS',x:450,y:328},
 {id:'J-BTMK',x:309,y:418},{id:'J-LIBRARY',x:374,y:517},
].map(n=>({...n,selectable:false}))
export const campusGraphNodes=[...campusRouteNodes,...junctions]
const byId=new Map(campusGraphNodes.map(n=>[n.id,n]))
const p=(x:number,y:number)=>({x,y})
// Corridors follow the visible grey/white paths; bends never become selectable dots.
const definitions:[string,string,{x:number;y:number}[]?][]=[
 ['MAIN-GATE','INNER-GATE',[p(269,913)]],['INNER-GATE','RAZAK-ENTRANCE'],
 ['INNER-GATE','DEWAN-AZMAN-HASHIM'],['INNER-GATE','GATE-SOUTH-SPUR',[p(325,949)]],
 ['RAZAK-EAST','ANJUNG-MENARA-RAZAK'],['ANJUNG-MENARA-RAZAK','MASJID-UTMKL'],
 ['ANJUNG-MENARA-RAZAK','PARKING-SOUTH'],['PARKING-SOUTH','PARKING-WEST',[p(623,1088)]],
 ['MJIIT-SOUTH-EAST','CAFE-MJIIT'],['CAFE-MJIIT','RESIDENSI-UTMKL'],
 ['RESIDENSI-UTMKL','RESIDENSI-EAST'],['RESIDENSI-UTMKL','RESIDENSI-NORTH-WEST'],
 ['RESIDENSI-NORTH-WEST','RESIDENSI-NORTH-EAST'],['RESIDENSI-NORTH-EAST','RESIDENSI-EAST'],
 ['RESIDENSI-NORTH-WEST','FIELD-EAST'],['FIELD-EAST','FIELD-NORTH-EAST'],
 ['FIELD-NORTH-EAST','FIELD-EAST-CORNER'],['FIELD-NORTH-EAST','FIELD-NORTH'],
 ['FIELD-NORTH','FIELD-NORTH-WEST'],['FIELD-NORTH-WEST','CAFE-V1'],
 ['CAFE-V1','FIELD-WEST-SPUR'],['FIELD-NORTH','J-ENGINEERING'],
 ['J-ENGINEERING','REAR-GATE'],['ENGINEERING-SOUTH','J-ENGINEERING'],
 ['J-ENGINEERING','FIELD-EAST-CORNER'],['ENGINEERING-SOUTH','Y2-EAST'],
 ['Y2-EAST','Y2-NORTH'],['Y2-EAST','FIELD-NORTH'],
 ['ENGINEERING-SOUTH','ENGINEERING-EAST'],['ENGINEERING-EAST','ENGINEERING-NORTH'],
 ['ENGINEERING-NORTH','CLINIC-NORTH-EAST'],['CLINIC-NORTH-EAST','ENGINEERING-NORTH-EAST'],
 ['CLINIC-NORTH-EAST','M4-SOUTH'],['M4-SOUTH','CLINIC-NORTH'],
 ['CLINIC-NORTH','CLINIC-ROAD-JUNCTION'],['CLINIC-ROAD-JUNCTION','CLINIC-NORTH-EAST'],
 ['CLINIC-ROAD-JUNCTION','CLINIC-EAST'],['CLINIC-EAST','KLINIK-UTM'],
 ['CLINIC-EAST','ENGINEERING-SOUTH'],
 ['M-EAST','M-SOUTH-EAST'],['M-SOUTH-EAST','J-CLINIC'],['J-CLINIC','KLINIK-UTM'],
 ['J-CLINIC','J-Y2',[p(692,381),p(700,409)]],['J-Y2','Y2-NORTH'],
 ['J-Y2','P3-NORTH',[p(676,439)]],['P3-NORTH','J-P3',[p(606,485)]],
 ['J-P3','J-V1',[p(575,530),p(582,553)]],['J-V1','CAFE-V1'],
 ['J-V1','J-PA1',[p(541,590),p(491,611)]],['J-PA1','J-PA5',[p(480,636)]],
 ['J-PA5','J-TENNIS',[p(484,671),p(439,693),p(434,710),p(453,746)]],
 ['J-TENNIS','J-PA7',[p(430,788)]],['J-PA7','J-J4'],
 ['J-J4','J-GATE',[p(310,848)]],['J-GATE','MAIN-GATE',[p(264,903),p(236,914)]],
 ['J-TENNIS','MJIIT'],['J-TENNIS','RAZAK-EAST',[p(487,821),p(522,863)]],
 ['J-PA5','MJIIT',[p(503,684)]],
 ['J-PA1','DATARAN-ILMU'],['DATARAN-ILMU','CICT-WEST'],['CICT-WEST','CICT'],
 ['CICT','B3-SOUTH'],['B3-SOUTH','P3-NORTH'],['B3-SOUTH','B3-WEST',[p(551,428)]],
 ['B3-WEST','B3-NORTH'],['B3-NORTH','M-SOUTH-EAST'],
 ['M-EAST','M-NORTH'],['M-EAST','J-M1'],['M-NORTH','J-M1'],
 ['J-M1','M1-EAST',[p(687,233)]],['M-NORTH','M1-NORTH'],['M1-NORTH','M2-NORTH'],
 ['M2-NORTH','J-M2'],['J-M2','NORTH-JUNCTION'],['J-M2','M1-EAST'],
 ['M1-EAST','CLINIC-NORTH'],['NORTH-JUNCTION','NORTH-EAST'],
 ['NORTH-EAST','ENGINEERING-NORTH-EAST',[p(899,240)]],
 ['M4-SOUTH','TAMAN-ACCESS',[p(885,219)]],
 ['NORTH-WEST','L1-ACCESS'],['NORTH-WEST','L-NORTH-WEST',[p(392,189)]],
 ['L-NORTH-WEST','L1-ACCESS'],['L1-ACCESS','M-NORTH'],
 ['L-NORTH-WEST','J-L'],['J-L','J-BLOCKS'],
 ['J-BLOCKS','B3-WEST',[p(514,331)]],['J-BLOCKS','J-BTMK',[p(371,365)]],
 ['J-BTMK','CAFE-PEGAWAI'],['J-BTMK','WEST-UPPER',[p(296,361)]],
 ['J-BTMK','J-LIBRARY',[p(336,465)]],['J-LIBRARY','CICT-WEST'],
 ['J-LIBRARY','LIBRARY-PSZ',[p(299,541),p(239,551)]],
 // PA9's west-side spur ends on the supplied image; no undocumented connection is invented.
]
const source='Circle/corridor visually traced in the operator-supplied annotated reference (1113x1414), 18 Oct 2026; not surveyed. Pixel alignment does not verify access, crossings or scale.'
function lineLength(points:{x:number;y:number}[]){return points.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-points[i].x,p.y-points[i].y),0)}
export function estimateCampusWalkLengthM(points:{x:number;y:number}[]){return Math.max(1,Math.round(lineLength(points)*illustrativeMetresPerPixel))}
export const campusWalkLinks:CampusWalkLink[]=definitions.map(([from,to,via=[]],index)=>{
 const a=byId.get(from),b=byId.get(to);if(!a||!b)throw Error('Reference graph has a missing node')
 const points=[a,...via,b].map(({x,y})=>({x,y}))
 return{edge_id:`EDGE-REF-${String(index+1).padStart(3,'0')}`,segment_id:`DEMO-REF-${String(index+1).padStart(3,'0')}`,from,to,points,estimated_length_m:estimateCampusWalkLengthM(points),source}
})
export function campusNodeName(node:CampusRouteNode){const index=campusRouteNodes.findIndex(n=>n.id===node.id);return node.label??(index<0?`Corridor junction ${node.id.slice(2)}`:`Reference junction ${String(index+1).padStart(2,'0')}`)}
