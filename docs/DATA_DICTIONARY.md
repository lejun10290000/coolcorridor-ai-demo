# Phase 0 data dictionary and provenance

The central TypeScript definitions are in `src/types.ts`. `study_area_id` is `utmkul-pilot`; all fixture segment IDs begin `DEMO-` and are shared between modes.

| Entity | Key fields | Current Phase 0 provenance |
|---|---|---|
| StudyArea | ID, name, dataset version, basemap attribution | Operator-supplied UTM KL campus illustration; non-georeferenced, original creator/reuse licence unconfirmed |
| WalkwaySegment | stable ID, geometry, length, shade, walkability | `DEMO-S01`–`DEMO-S04` remain shared IDs; WGS84 geometry unavailable (`[]`); separate pixel display fixtures are pending verification, not navigation data |
| FootfallObservation | count, duration, hourly-equivalent rate, window | `demo_fixture`; never unique people or all-day traffic |
| ResidentReport | category, comment, review status | locally-created demo data, initially `submitted` |
| InterventionCandidate | segment IDs, cost, benefit, constraints | assumed `demo_fixture`; benefits are simulated planning inputs |
| PlanningScenario | baseline version, selected IDs, cost, effects | `simulated`; never overwrites baseline |

Statuses: `sample_observed`, `human_reviewed`, `model_estimate`, `demo_fixture`, `simulated`, `unknown`. Missing values are `null` and displayed as Unknown/Needs survey.

## Vision integration status

No pretrained model weights or permitted walkway image were supplied in Phase 0. This prototype deliberately does **not** claim an AI inference result. Builder 2 should implement `POST /api/shade/analyze` with a permitted lightweight pretrained segmentation/classification model, document its model/version/licence and run an actual inference; it must retain raw output separately from a human shade review. Visible canopy is not ground-level shade or temperature.

## Campus image display geometry

`public/maps/utmkul-campus-map.png` is the exact supplied 1290 × 1640 PNG cropped from a lecturer-provided PDF. Original creator and reuse licence are unconfirmed; obtain permission before public deployment. This is the only active basemap in Resident and Developer modes. No OSM tile source or attribution remains in the map renderer.

`src/campusMapDisplay.ts` defines `MapDisplayPoint { x, y }` in intrinsic image pixels (right/down) and `SegmentDisplayGeometry { segment_id, map_display_geometry, data_status, source }`. Display records are `demo_fixture`, keyed by the existing segment IDs. No image-to-world transform is known. Pixel points must never be treated as geographic coordinates. The previously schematic geographic arrays were cleared to `[]` (unavailable), preserving `WalkwaySegment.geometry: Position[]` for future sourced WGS84 records. No field geometry is discarded because none was supplied.

Route A is DEMO-S01 + DEMO-S02; route B is DEMO-S03; DEMO-S04 is an unknown connector. The paths are traced illustration fixtures, with uncertain connections/crossings dashed. Shade colours come from segment records, not the colours of the source artwork. No observation time is invented. Legacy distance/time values remain DEMO fixtures and are not derived from pixels; the “Shortest” label does not establish shortest-path validity.

Candidate sites are positioned at display-polyline midpoints for review, carry DEMO/SIMULATED labels and never change baseline shade. Resident-report counts link to segment IDs and remain separate from footfall. See [map handoff](CAMPUS_MAP_HANDOFF.md) for approval, checks and limitations.
