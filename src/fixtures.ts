import { referenceSegments } from './referenceCampusSegments'
import type { FootfallObservation, InterventionCandidate, StudyArea, WalkwaySegment } from './types'
import { campusNodeName, campusRouteNodes, campusWalkLinks } from './legacyCampusWalkways'

export const studyArea: StudyArea = { study_area_id: 'utmkul-pilot', name: 'UTM Kuala Lumpur pilot', dataset_version: 'demo-baseline-2026-10-17', base_map_source: 'Operator-supplied UTM KL campus illustration', source_url: '/maps/utmkul-campus-map.png', licence_or_attribution_note: 'Lecturer-provided PDF crop; original creator and reuse licence unconfirmed. Display overlays are DEMO, not georeferenced or navigation data.', updated_at: '2026-10-17T09:00:00+08:00' }
// No sourced WGS84 geometry is available. Empty arrays preserve the shared interface.
// Image-only display geometry is separate in campusMapDisplay.ts; never use it as GeoJSON.
export const segments: WalkwaySegment[] = [
  { study_area_id: studyArea.study_area_id, dataset_version: studyArea.dataset_version, segment_id: 'DEMO-S01', name: 'Illustrative approach A', geometry: [], length_m: 92, walkable_status: 'pending_verification', accessibility_status: 'Needs field survey', geometry_source: 'WGS84 geometry unavailable; DEMO image-space path in campusMapDisplay.ts; not navigation verified', shade_label: 'mostly_exposed', shade_observed_at: null, shade_data_status: 'demo_fixture', footfall_observation_ids: ['FF-01'] },
  { study_area_id: studyArea.study_area_id, dataset_version: studyArea.dataset_version, segment_id: 'DEMO-S02', name: 'Illustrative approach B', geometry: [], length_m: 106, walkable_status: 'pending_verification', accessibility_status: 'Needs field survey', geometry_source: 'WGS84 geometry unavailable; DEMO image-space path in campusMapDisplay.ts; not navigation verified', shade_label: 'mixed', shade_observed_at: null, shade_data_status: 'demo_fixture', footfall_observation_ids: ['FF-02'] },
  { study_area_id: studyArea.study_area_id, dataset_version: studyArea.dataset_version, segment_id: 'DEMO-S03', name: 'Illustrative sheltered alternative', geometry: [], length_m: 190, walkable_status: 'pending_verification', accessibility_status: 'Needs field survey', geometry_source: 'WGS84 geometry unavailable; DEMO image-space path in campusMapDisplay.ts; not navigation verified', shade_label: 'mostly_shaded', shade_observed_at: null, shade_data_status: 'demo_fixture', footfall_observation_ids: [] },
  { study_area_id: studyArea.study_area_id, dataset_version: studyArea.dataset_version, segment_id: 'DEMO-S04', name: 'Illustrative unknown connector', geometry: [], length_m: null, walkable_status: 'pending_verification', accessibility_status: 'Unknown', geometry_source: 'WGS84 geometry unavailable; DEMO image-space path in campusMapDisplay.ts; not navigation verified', shade_label: 'unknown', shade_observed_at: null, shade_data_status: 'unknown', footfall_observation_ids: [] },
  ...campusWalkLinks.map((link): WalkwaySegment => {
    const from = campusRouteNodes.find(node => node.id === link.from)!
    const to = campusRouteNodes.find(node => node.id === link.to)!
    return {
      study_area_id: studyArea.study_area_id,
      dataset_version: studyArea.dataset_version,
      segment_id: link.segment_id,
      name: campusNodeName(from) + ' ↔ ' + campusNodeName(to) + ' (unsurveyed walkway)',
      geometry: [],
      length_m: link.estimated_length_m,
      walkable_status: 'pending_verification',
      accessibility_status: 'Unknown / UNSURVEYED',
      geometry_source: link.source + ' Length is a pixel-scale assumption, not a survey.',
      shade_label: 'unknown',
      shade_observed_at: null,
      shade_data_status: 'unknown',
      footfall_observation_ids: [],
    }
  }),
  ...referenceSegments(studyArea),
]
export const footfall: FootfallObservation[] = [
  { observation_id: 'FF-01', segment_id: 'DEMO-S01', pass_count: 18, duration_min: 15, passes_per_hour_equivalent: 72, window_start: '2026-10-17T12:00:00+08:00', window_end: '2026-10-17T12:15:00+08:00', direction: 'both directions', method: 'manual tally', data_status: 'demo_fixture', source_note: 'Illustrative fixture; not an observed UTM count.' },
  { observation_id: 'FF-02', segment_id: 'DEMO-S02', pass_count: 12, duration_min: 15, passes_per_hour_equivalent: 48, window_start: '2026-10-17T12:00:00+08:00', window_end: '2026-10-17T12:15:00+08:00', direction: 'both directions', method: 'manual tally', data_status: 'demo_fixture', source_note: 'Illustrative fixture; not an observed UTM count.' }
]
export const candidates: InterventionCandidate[] = [
  { intervention_id: 'INT-01', segment_ids: ['DEMO-S01'], type: 'Shade canopy', cost_rm: 12000, cost_source_status: 'demo_fixture', modelled_benefit: 65, constraints: ['utility-check'], feasibility_status: 'unverified', data_status: 'demo_fixture', notes: 'Assumed cost/benefit for UI testing only.', lifecycle: 'proposed' },
  { intervention_id: 'INT-02', segment_ids: ['DEMO-S02'], type: 'Tree planting', cost_rm: 8000, cost_source_status: 'demo_fixture', modelled_benefit: 35, constraints: ['utility-check'], feasibility_status: 'unverified', data_status: 'demo_fixture', notes: 'Overlaps the same constraint group as INT-01.', lifecycle: 'proposed' },
  { intervention_id: 'INT-03', segment_ids: ['DEMO-S03'], type: 'Covered walkway', cost_rm: 20000, cost_source_status: 'demo_fixture', modelled_benefit: 92, constraints: ['heritage-review'], feasibility_status: 'unverified', data_status: 'demo_fixture', notes: 'Assumed cost/benefit for UI testing only.', lifecycle: 'proposed' },
  { intervention_id: 'INT-04', segment_ids: ['DEMO-S01'], type: 'Shade sail', cost_rm: 6000, cost_source_status: 'demo_fixture', modelled_benefit: 30, constraints: [], feasibility_status: 'unverified', data_status: 'demo_fixture', notes: 'Benefit overlaps INT-01 on DEMO-S01; portfolio counts the higher benefit only.', lifecycle: 'proposed' }
]
