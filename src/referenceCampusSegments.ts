import type { StudyArea, WalkwaySegment } from './types'
import { campusGraphNodes, campusNodeName, campusWalkLinks } from './campusWalkways'

/** Add a versioned reference network; old PR7 segment IDs remain intact for saved evidence. */
export function referenceSegments(area:StudyArea):WalkwaySegment[]{
  return campusWalkLinks.map(link=>({study_area_id:area.study_area_id,dataset_version:area.dataset_version,
    segment_id:link.segment_id,name:`${campusNodeName(campusGraphNodes.find(n=>n.id===link.from)!)} ↔ ${campusNodeName(campusGraphNodes.find(n=>n.id===link.to)!)} (reference illustration)`,
    geometry:[],length_m:link.estimated_length_m,walkable_status:'pending_verification',accessibility_status:'Unknown / UNSURVEYED',
    geometry_source:link.source+' Length is a rough demo scale assumption, not a survey.',
    shade_label:'unknown',shade_observed_at:null,shade_data_status:'unknown',footfall_observation_ids:[],
  }))
}
