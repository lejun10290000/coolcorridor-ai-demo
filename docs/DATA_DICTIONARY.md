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

## Versioned manual shade-observation workflow

The original `StudyArea`, `WalkwaySegment`, report and candidate interfaces remain unchanged. New types live in `src/workflow/model.ts`:

| Record | Fields / provenance |
|---|---|
| `WorkflowState` | `schema_version: 1`, monotonically increasing action `revision`, `current_version`, immutable snapshots, observation/review records, intervention lifecycle events, existing reports and report-review events |
| `CurrentSegment` | Extends `WalkwaySegment` with optional `shade_source`: observation ID, method/source note, observer/reviewer labels, review note, evidence reference and publication time |
| `ShadeObservation` | Stable ID, existing segment/intervention/study-area IDs, `record_kind`, raw shade label, observed/created times, method/source, observer, notes/uncertainty and safe text evidence reference; review status, append-only review history and publication metadata |
| `ObservationReview` | Action (`under_review`, `verified`, `rejected`), reviewer, note, reviewed shade label and timestamp; corrections do not overwrite the raw observation |
| `DatasetSnapshot` | Version ID, parent version, study area, created-by/time, copied segment list, summary/warnings; all segments carry the snapshot version |
| `LifecycleEvent` | Event/intervention IDs, from/to status, demo actor label, timestamp, note/evidence reference and dataset version |
| `ReportEvent` | Existing report ID, from/to status, reviewer label, note and timestamp |
| `Scenario` | `status: simulated`, baseline version, selected intervention IDs, per-affected-segment baseline/projected labels and assumptions, copied display segments and warnings |

The authoritative study-area metadata is derived with `currentStudyArea(state)`; fixtures remain the immutable original baseline. Resident and Developer read the same `currentSnapshot(state)` unless Developer explicitly chooses a historical baseline for comparison.

Manual observation times are validated real calendar timestamps with `+08:00`; future observations are rejected against the client clock. Each entry requires method/source, observer label and notes/uncertainty. Field entries require explicit attestation that the observation is genuine and the linked segment/location was checked; this is manual input, not independent backend validation. No real field data has been supplied by this change.

Raw DEMO entries are `demo_fixture` permanently. Raw attested field entries are `sample_observed`; a separate human review may correct the classification. Only publication copies the reviewed label/time/source into the current segment, using `human_reviewed` for genuine field inputs and retaining `demo_fixture` for DEMO inputs. Verification alone never changes current shade. Unknown labels remain unknown/grey; an unknown observation can have a known observation time.

Lifecycle verification requires at least one verified observation for every linked segment. Publication selects the latest verified observation per linked segment; all raw entries/reviews remain in history. IDs use a local action revision; snapshot versions append incremented, padded `-v000001`, `-v000002`, etc. to the initial dataset ID and are checked for collisions. This strategy is scoped to one locally stored dataset, not globally coordinated IDs.

Local storage key `coolcorridor-shade-workflow-v1` includes an explicit schema version. Runtime validation checks IDs, fixture compatibility, version chains, review transitions, provenance, source-to-observation links and published snapshot consistency. Corrupt/incompatible data recovers to the original DEMO baseline with a visible warning; it is not silently accepted as observed data. A subsequent successful action replaces invalid saved state. Blocked/full storage retains changes in memory and warns that they will not survive refresh. Browser storage is user-editable, not a secure audit log.

Scenario assumptions and optimiser input/result drafts are view-local; they never become observations. Only explicit affected-segment projections change scenario colours, with `shade_data_status: simulated` and no observed timestamp/source. Unconfigured projections retain baseline labels. All campus paths/geographic limitations and map reuse caveats above still apply.
