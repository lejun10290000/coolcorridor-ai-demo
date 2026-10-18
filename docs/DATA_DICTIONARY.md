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

`public/maps/utmkul-campus-map.png` is the exact supplied 1290 × 1640 PNG cropped from a lecturer-provided PDF. Original creator and reuse licence are unconfirmed; obtain permission before public deployment. This is the preserved historical basemap. The current shared background is the exact 1113 × 1414 annotated JPEG received on 18 October 2026 (see REFERENCE_MAP_ALIGNMENT.md). No OSM tile source or attribution remains in the map renderer.

`src/campusMapDisplay.ts` defines `MapDisplayPoint { x, y }` in intrinsic image pixels (right/down) and `SegmentDisplayGeometry { segment_id, map_display_geometry, data_status, source }`. Display records are `demo_fixture`, keyed by the existing segment IDs. No image-to-world transform is known. Pixel points must never be treated as geographic coordinates. The previously schematic geographic arrays were cleared to `[]` (unavailable), preserving `WalkwaySegment.geometry: Position[]` for future sourced WGS84 records. No field geometry is discarded because none was supplied.

Route A is DEMO-S01 + DEMO-S02; route B is DEMO-S03; DEMO-S04 is an unknown connector. The paths are traced illustration fixtures, with uncertain connections/crossings dashed. Shade colours come from segment records, not the colours of the source artwork. No observation time is invented. Legacy distance/time values remain DEMO fixtures and are not derived from pixels; the current normal app now computes shortest distance from these explicitly fictional metre inputs; no field/navigation validity is established.

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

## Calculated route records and selected map layer

`src/routing/graph.ts` defines an explicit DEMO graph: MAIN-GATE ↔ DEMO-JUNCTION viaS01/92m, junction ↔ KLINIK viaS02/106m, and gate ↔ KLINIK viaS03/190m. These are existing fictional metre fixtures; source PNG points are display-only. S04 remains grey/inspectable but excluded from search without defensible length and split connector topology.

`RouteComparison` retains both objectives, version/graph IDs, configuration/warnings, same-path flag, `distance_limit_m` and `exposure_improves_on_shortest`. `CalculatedRoute` stores ordered segment/node IDs, distance, estimated duration, ranking cost, known-label cost, unknown penalty, known/unknown length/coverage and observed-reviewed provenance length. Cost units are metre-equivalents, not measured exposed distance. Unknownweight1, mixed0.5, exposed1, shaded0 are prototype assumptions. Speed1.2m/s is assumed; duration is rounded up to whole seconds.

Shortest ignores shade even for equal-length ties. Practical considers every simple path within shortest×1.25, then minimises cost/distance/stable IDs. Same-path and no-better-within-cap states are explicit; unavailable paths are null, never fake zero metrics. Default initial bothS03/190m; after DEMO S03 exposure publication practicalS01+S02/198m/cost145,detour4.2%. No actual shade/temperature measurement follows from these values.

The final selected-route SVG overlay uses only computed ordered IDs; metadata links overlay/version to the same card/current snapshot. White halo/purple casing/shade centre paints after all base shade strokes. Other shade segments remain visible; grey remains grey. Root App uses one authoritative local workflow for Resident/Developer, with automatic same-origin/profile tab updates. No cross-device/profile/person synchronisation or backend exists.

New `ObservationReview.review_policy` is optional `separate-field-reviewer-v1`. Marked field verification events must have distinct observer/reviewer aliases after trim/case folding; unmarked legacy history stays readable without destructive reset. New publication cannot promote matching-alias legacy field verification; existing published matching-alias evidence warns about legacy policy. DEMO provenance never becomes genuine field evidence by verification. Schema/storage key remain1. Different aliases do not authenticate real people.

## Aligned annotated reference network

Current image: `public/maps/utmkul-reference-2026-10-18.jpeg` (1113×1414), byte-identical to the user-supplied annotated JPEG. `campusMap`/`referenceMap` supply that same asset/dimensions to both modes; SVG/viewBox/image fit together, without a two-anchor geographic transform. `campusRouteNodes` contains60 visible reference-circle centres; `campusGraphNodes` adds17 invisible connectivity junctions. No dot is placed at a hidden path bend.

New `DEMO-REF-001`–`DEMO-REF-092` records describe re-traced illustrative corridors. Each starts unknown/grey, no shade observation timestamp or footfall. Access labels identify nearby landmarks, not surveyed entrances. The isolated PA9 spur is left disconnected rather than inventing a connector. The source's printed dashed Main Gate→Klinik path is a fixed example; live selected routing is purple.

Original4 DEMO-S records and68 PR7 DEMO-WALK records remain unchanged, defined through the historical `legacyCampusWalkways.ts` fixture module. New reference records are appended by a strict recognized-ID migration to each old saved snapshot, preserving its existing records, observation/review/report/lifecycle history and current version. Historic geometry is not drawn on a different image. Four old intervention/report IDs retain declared visual proxies; no proxy is promoted into a surveyed location. Original metre facts are retained for old records; new lengths continue the explicit rough0.2m/pixel demo assumption, never a measured map scale or navigation distance.
