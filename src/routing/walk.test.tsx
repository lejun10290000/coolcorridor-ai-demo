import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { currentSnapshot, initialWorkflow } from '../workflow/model'
import { seedPointPhotos } from '../pointPhotos/catalog'
import { campusWideGraph } from './graph'
import { compareRoutes } from './compare'
import { advanceWalk, beginWalk, previousWalkPoint, walkProgress } from './walk'
import { WalkPanel } from './WalkPanel'

const snapshot=()=>currentSnapshot(initialWorkflow())
function trip(from='MAIN-GATE',to='KLINIK-UTM'){
  const s=snapshot(),route=compareRoutes(s,campusWideGraph,from,to).shortest!
  return {s,route,walk:beginWalk(route,s)}
}
describe('Resident manual point-by-point walkthrough',()=>{
 it('starts with the next connected graph point, including internal corridor junctions',()=>{
  const {walk,route}=trip(),p=walkProgress(walk)
  expect(p.current).toBe('MAIN-GATE');expect(p.next).toBe(route.node_ids[1]);expect(p.confirmed).toBe(0)
  expect(walk.route.node_ids).toContain('J-TENNIS');expect(walk.route.node_ids).toContain('J-CLINIC')
 })
 it('advances exactly once per confirmation and includes the destination before completing',()=>{
  let {walk,route}=trip()
  for(let i=1;i<route.node_ids.length;i++){
   expect(walkProgress(walk)).toMatchObject({complete:false,current:route.node_ids[i-1],next:route.node_ids[i]})
   walk=advanceWalk(walk)
  }
  expect(walkProgress(walk)).toMatchObject({complete:true,current:'KLINIK-UTM',next:null,confirmed:route.segment_ids.length})
  expect(advanceWalk(walk)).toEqual(walk)
 })
 it('supports reverse routes and moving back without skipping or underflowing',()=>{
  const {walk,route}=trip('KLINIK-UTM','MAIN-GATE')
  expect(walkProgress(walk).next).toBe(route.node_ids[1]);expect(previousWalkPoint(walk)).toEqual(walk)
  expect(previousWalkPoint(advanceWalk(walk))).toEqual(walk)
 })
 it('copies the chosen route and dataset so publication cannot silently reroute the walk',()=>{
  const {s,route,walk}=trip(),copy=structuredClone(walk)
  s.segments[0].shade_label='mostly_shaded';route.node_ids.reverse();route.segment_ids.reverse()
  expect(walk).toEqual(copy)
  expect(advanceWalk(walk).route).toEqual(copy.route)
 })
 it('rejects incomplete, disconnected, wrong-version and simulated routes',()=>{
  const {s,route}=trip()
  for(const invalid of [{...route,node_ids:[]},{...route,dataset_version:'other'},{...route,segment_ids:route.segment_ids.slice(1)},{...route,node_ids:[...route.node_ids].reverse()}])expect(()=>beginWalk(invalid,s)).toThrow()
  const simulated=structuredClone(s);simulated.segments.find(x=>x.segment_id===route.segment_ids[0])!.shade_data_status='simulated'
  expect(()=>beginWalk(route,simulated)).toThrow()
 })
 it('shows the exact next-point reference and honest missing-photo fallback',()=>{
  const {walk}=trip('MAIN-GATE','INNER-GATE'),props={walk,photos:seedPointPhotos,currentVersion:walk.route.dataset_version,next:()=>{},previous:()=>{},exit:()=>{}}
  const empty=renderToStaticMarkup(<WalkPanel {...props}/>);expect(empty).toContain('No reference photo is published for this point')
  const {walk:reverse}=trip('INNER-GATE','MAIN-GATE'),withPhoto=renderToStaticMarkup(<WalkPanel {...props} walk={reverse}/>)
  expect(withPhoto).toContain('/point-photos/main-gate.jpg');expect(withPhoto).toContain('This does not track your location')
 })
 it('marks the Klinik UTM reference for its portrait-aware presentation',()=>{
  let {walk}=trip()
  while(walkProgress(walk).next!=='KLINIK-UTM') walk=advanceWalk(walk)
  const html=renderToStaticMarkup(<WalkPanel walk={walk} photos={seedPointPhotos} currentVersion={walk.route.dataset_version} next={()=>{}} previous={()=>{}} exit={()=>{}}/>)
  expect(html).toContain('resident-walk-photo--klinik')
  expect(html).toContain('/point-photos/klinik.jpg')
 })
 it('shows completion and newer-map notice without presenting another next step',()=>{
  let {walk}=trip('MAIN-GATE','INNER-GATE');walk=advanceWalk(walk)
  const html=renderToStaticMarkup(<WalkPanel walk={walk} photos={{}} currentVersion="new-version" next={()=>{}} previous={()=>{}} exit={()=>{}}/> )
  expect(html).toContain('Destination reached');expect(html).toContain('Finish walk');expect(html).toContain('A newer map is published');expect(html).not.toContain('>Next</button>')
 })
})
