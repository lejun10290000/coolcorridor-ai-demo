export type DataStatus = 'sample_observed' | 'human_reviewed' | 'model_estimate' | 'demo_fixture' | 'simulated' | 'unknown'
export type ShadeLabel = 'mostly_exposed' | 'mixed' | 'mostly_shaded' | 'unknown'
export type Position = [number, number]
export type Lifecycle = 'proposed' | 'approved_demo' | 'under_construction' | 'installed_pending_verification' | 'verified' | 'published'
export type ReportStatus = 'submitted' | 'under_review' | 'verified' | 'rejected'

export interface StudyArea { study_area_id: string; name: string; dataset_version: string; base_map_source: string; source_url: string; licence_or_attribution_note: string; updated_at: string }
export interface WalkwaySegment { study_area_id: string; dataset_version: string; segment_id: string; name: string; geometry: Position[]; length_m: number | null; walkable_status: 'pending_verification' | 'verified'; accessibility_status: string; geometry_source: string; shade_label: ShadeLabel; shade_observed_at: string | null; shade_data_status: DataStatus; footfall_observation_ids: string[] }
export interface FootfallObservation { observation_id: string; segment_id: string; pass_count: number; duration_min: number; passes_per_hour_equivalent: number; window_start: string; window_end: string; direction: string; method: string; data_status: DataStatus; source_note: string }
export interface ReportedRoute { from_node: string; to_node: string; objective: 'shortest'|'exposure'; segment_ids: string[]; node_ids: string[]; dataset_version: string; selection_source?: 'map_points' }
export interface ReportReferencePhoto {data_url:string;source:'resident_upload';capture_time:null}
export interface ResidentReport { report_id: string; segment_id: string; category: string; comment_optional: string; created_at: string; review_status: ReportStatus; review_note: string; data_status: DataStatus; route?: ReportedRoute; accepted_publication_id?: string; reference_photo?:ReportReferencePhoto }
export interface InterventionCandidate { intervention_id: string; segment_ids: string[]; type: string; cost_rm: number; cost_source_status: DataStatus; modelled_benefit: number; constraints: string[]; feasibility_status: string; data_status: DataStatus; notes: string; lifecycle: Lifecycle }
export interface Route { id: string; label: string; segment_ids: string[]; distance_m: number; duration_min: number; exposure_m: number | null; shade_coverage: number | null; warnings: string[] }
export interface Priority { segment_id: string; score: number | null; exposed_length_m: number | null; rate: number | null; reason: string; confidence: 'demo estimate' | 'needs survey' }
