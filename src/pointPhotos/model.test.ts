import { describe, expect, it } from 'vitest'
import { campusRouteNodes } from '../campusWalkways'
import { initialWorkflow } from '../workflow/model'
import { seedPointPhotos, seedPhotoAssignments } from './catalog'
import { decodePhotoLibrary, discardPointPhoto, initialPhotoLibrary, publishedPhotos, publishPointPhoto, rebasePointPhoto, stagePointPhoto } from './model'
const now='2026-10-20T14:00:00+08:00'
const proposed={...seedPointPhotos['MAIN-GATE'],caption:'Replacement reference',publication_id:'unpublished-draft',published_at:null}
describe('point-photo reference publication',()=>{
 it('keeps all fifteen corrected photo-to-point mappings and does not turn hidden junctions into routing endpoints',()=>{
  expect(seedPhotoAssignments).toHaveLength(15);expect(Object.keys(seedPointPhotos)).toHaveLength(15)
  expect(seedPointPhotos['KLINIK-UTM'].src).toBe('point-photos/klinik.jpg');expect(seedPointPhotos['CAFE-MJIIT'].src).toBe('point-photos/cafe-mjiit.jpg')
  expect(seedPointPhotos['J-LIBRARY'].src).toContain('corridor-library');expect(seedPointPhotos['RESIDENSI-NORTH-WEST'].src).toContain('reference-15');expect(seedPointPhotos['PARKING-WEST'].src).toContain('reference-09')
  expect(campusRouteNodes).toHaveLength(60);expect(campusRouteNodes.some(n=>n.id==='J-V1')).toBe(false)
 })
 it('stages a copied draft without changing published references or existing shade/report state',()=>{
  const original=initialPhotoLibrary(),workflow=JSON.stringify(initialWorkflow()),next=stagePointPhoto(original,'MAIN-GATE',proposed)
  expect(publishedPhotos(next)).toEqual(seedPointPhotos);expect(original.drafts).toEqual({});expect(next.drafts['MAIN-GATE'].photo.caption).toBe('Replacement reference')
  expect(JSON.stringify(initialWorkflow())).toBe(workflow);expect(next.history).toEqual([])
 })
 it('requires a saved draft, actor, note, explicit review and valid local timestamp',()=>{
  const s=stagePointPhoto(initialPhotoLibrary(),'MAIN-GATE',proposed)
  for(const [actor,note,review,time] of [['','Check',true,now],['Demo','',true,now],['Demo','Check',false,now],['Demo','Check',true,'invalid']] as const)expect(()=>publishPointPhoto(s,'MAIN-GATE',actor,note,review,time)).toThrow()
  expect(()=>publishPointPhoto(initialPhotoLibrary(),'MAIN-GATE','Demo','Check',true,now)).toThrow()
 })
 it('publishes only the chosen point and preserves the previous reference and publication history',()=>{
  const draft=stagePointPhoto(stagePointPhoto(initialPhotoLibrary(),'MAIN-GATE',proposed),'KLINIK-UTM',{...proposed,caption:'Another pending replacement'})
  const next=publishPointPhoto(draft,'MAIN-GATE','Demo','Checked reference',true,now)
  expect(next.drafts['MAIN-GATE']).toBeUndefined();expect(next.drafts['KLINIK-UTM']).toBeDefined()
  expect(publishedPhotos(next)['MAIN-GATE'].caption).toBe('Replacement reference');expect(publishedPhotos(next)['KLINIK-UTM']).toEqual(seedPointPhotos['KLINIK-UTM'])
  expect(next.history[0].previous).toEqual(seedPointPhotos['MAIN-GATE']);expect(next.history[0].photo).toEqual(next.published['MAIN-GATE'])
  expect(decodePhotoLibrary(structuredClone(next))).toEqual(next)
 })
 it('discards drafts without changing published images',()=>{
  const draft=stagePointPhoto(initialPhotoLibrary(),'MAIN-GATE',proposed),next=discardPointPhoto(draft,'MAIN-GATE')
  expect(next.drafts).toEqual({});expect(publishedPhotos(next)).toEqual(seedPointPhotos)
 })
 it('refuses stale photo drafts, including a point that originally had no photo, until explicitly rebased',()=>{
  const first=stagePointPhoto(initialPhotoLibrary(),'J-GATE',proposed),published=publishPointPhoto(first,'J-GATE','Demo','First photo',true,now)
  const stale={...published,drafts:first.drafts}
  expect(()=>publishPointPhoto(stale,'J-GATE','Demo','Old draft',true,now)).toThrow(/changed/)
  expect(stagePointPhoto(stale,'J-GATE',proposed).drafts['J-GATE'].base_publication_id).toBeNull()
  expect(publishPointPhoto(rebasePointPhoto(stale,'J-GATE'),'J-GATE','Demo','Reviewed new reference',true,now).history).toHaveLength(2)
 })
 it('refuses invented nodes, unsafe URLs, SVG, bad data and corrupt photo storage',()=>{
  for(const src of ['https://example.com/tracker.jpg','javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','data:image/jpeg;base64,bm90YW5pbWFnZQ==','point-photos/not-a-seed.jpg'])expect(()=>stagePointPhoto(initialPhotoLibrary(),'MAIN-GATE',{...proposed,src})).toThrow()
  expect(()=>stagePointPhoto(initialPhotoLibrary(),'invented',proposed)).toThrow();expect(()=>decodePhotoLibrary({revision:0})).toThrow()
  expect(()=>decodePhotoLibrary({...initialPhotoLibrary(),published:{'invented':proposed}})).toThrow()
 })
 it('preserves independent point updates and accepts a clean first-run library',()=>{
  const a=publishPointPhoto(stagePointPhoto(initialPhotoLibrary(),'MAIN-GATE',proposed),'MAIN-GATE','Demo','A',true,now)
  const b=publishPointPhoto(stagePointPhoto(a,'KLINIK-UTM',{...proposed,caption:'Clinic new photo'}),'KLINIK-UTM','Demo','B',true,now)
  expect(Object.keys(b.published).sort()).toEqual(['KLINIK-UTM','MAIN-GATE']);expect(b.history).toHaveLength(2);expect(decodePhotoLibrary(initialPhotoLibrary())).toEqual(initialPhotoLibrary())
 })
})
