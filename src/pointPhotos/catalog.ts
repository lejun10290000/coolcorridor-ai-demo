import { campusGraphNodes, campusNodeName } from '../campusWalkways'

export interface PointPhoto {
  src: string
  caption: string
  source_note: string
  publication_id: string
  published_at: string | null
}
export const photoPoints=campusGraphNodes
export const pointName=(id:string)=>{const node=photoPoints.find(n=>n.id===id);return node?campusNodeName(node):id}
export const seedPhotoAssignments=[
  [1,'FIELD-NORTH','reference-20.jpg'],[2,'RAZAK-EAST','reference-06.jpg'],
  [3,'RESIDENSI-UTMKL','residensi.jpg'],[4,'REAR-GATE','bus-parking.jpg'],
  [5,'MAIN-GATE','main-gate.jpg'],[6,'J-V1','corridor-v1.jpg'],
  [7,'J-CLINIC','corridor-clinic.jpg'],[8,'KLINIK-UTM','klinik.jpg'],
  [9,'CAFE-MJIIT','cafe-mjiit.jpg'],[10,'MASJID-UTMKL','masjid.jpg'],
  [11,'J-TENNIS','corridor-tennis.jpg'],[12,'J-PA5','corridor-pa5.jpg'],
  [13,'J-LIBRARY','corridor-library.jpg'],[14,'RESIDENSI-NORTH-WEST','reference-15.jpg'],
  [15,'PARKING-WEST','reference-09.jpg'],
] as const
export const seedPointPhotos:Record<string,PointPhoto>=Object.fromEntries(seedPhotoAssignments.map(([number,id,file])=>[id,{
  src:`point-photos/${file}`,caption:pointName(id),publication_id:`supplied-photo-${number}`,
  source_note:`Operator-supplied reference photo ${number}; location label confirmed by the operator on 20 October 2026. Privacy-redacted preview; capture time and route shade are not verified.`,published_at:null,
}]))
export const photoURL=(photo:PointPhoto)=>photo.src.startsWith('data:')?photo.src:`${import.meta.env.BASE_URL}${photo.src}`
