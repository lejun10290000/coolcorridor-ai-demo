import { campusWalkLinks } from './campusWalkways'
import { footfall as legacyFootfall } from './fixtures'
import type { FootfallObservation } from './types'

export const demoFootfallWindow={start:'2026-10-18T12:00:00+08:00',end:'2026-10-18T12:15:00+08:00'}
/** Fixed fictional counts: deliberately reproducible, never presented as a survey. */
export const demoCampusFootfall:FootfallObservation[]=campusWalkLinks.map((link,index)=>{
  const count=20+(index*47+31)%181
  return {observation_id:`DEMO-FF-${link.segment_id}`,segment_id:link.segment_id,pass_count:count,duration_min:15,passes_per_hour_equivalent:count*4,window_start:demoFootfallWindow.start,window_end:demoFootfallWindow.end,direction:'both directions',method:'Deterministic fictional demo count, seed v1',data_status:'demo_fixture',source_note:'Fictional DEMO passage events for planning UI only; no real count was observed. Hourly equivalent is not all-day traffic or unique pedestrians.'}
})
export function footfallForSegment(id:string){return demoCampusFootfall.find(f=>f.segment_id===id)??legacyFootfall.find(f=>f.segment_id===id)}
