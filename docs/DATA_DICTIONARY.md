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

The original `StudyArea`, `WalkwaySegment` and candidate interfaces remain unchanged. Original report fields remain compatible; later route-report optional fields are documented below. Workflow types live in `src/workflow/model.ts`:

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

Scenario assumptions and optimiser inputs are saved in optional `WorkflowState.planning_workspace`, separately from published snapshots and evidence. They never become observations. Only explicit affected-segment projections change scenario colours, with `shade_data_status: simulated` and no observed timestamp/source. Unconfigured projections retain the latest published baseline labels. All campus paths/geographic limitations and map reuse caveats above still apply.

### Current-map planning workspace

The normal Developer entry now defaults to **Top 10 demo footfall paths**. The manual candidate workspace described below remains selectable under **Planning method**, with its existing saved inputs intact. See [top-footfall planning contract](TOP_FOOTFALL_PLANNING.md) for the added sidecar/settings and calculated funding model.

`PlanningWorkspace` schema1 contains raw `budget` text, `excluded_ids`, `has_calculated`, `candidates` keyed by intervention ID, and `assumptions` keyed by current `DEMO-REF` link ID. Each candidate input contains raw whole-RM `cost` text, raw whole non-negative total illustrative `benefit` text and unique current `segment_ids`. Empty/invalid numeric drafts persist so the operator can correct them; calculation rejects values outside0–1,000,000,000. Targets must be nonempty known current reference links. Assumptions contain a `ShadeLabel` or empty/no projection. Planning saves increment action revision without adding snapshots or changing current_version.

Older saved payloads omit this optional field and use default RM20,000 and existing candidate costs/scores. Only planning copies remap the legacy target IDs using the four declared display proxies; historical `items`, evidence, geometry and snapshots are unchanged. Operators can replace proposal targets with a multi-link selection from the Baseline map. Default proposal sites and all costs/scores remain illustrative assumptions, not surveyed construction locations or quotes.

Each candidate's score is a TOTAL, split equally across its unique target links; the portfolio sums the maximum share per link. This avoids multiplying a score by route length or double-counting overlaps. Shared constraint groups remain mutually exclusive; exhaustive search maximises the aggregated score under budget, with cheaper cost breaking ties. The formula is a transparent planning assumption, not measured cooling. With the unchanged default costs/targets, RM10,000 selects INT-02 (score35); RM20,000 selects INT-03 (score92). Highest score-per-RM single-candidate selection picks INT-01 (score65) at RM20,000, illustrating why the exact portfolio calculation matters for these fixtures.

Once calculated, valid input changes automatically recompute. Invalid inputs hide the portfolio and disable simulation until corrected. Scenario output is rebuilt from `currentSnapshot(state)` on every publication, including same-origin storage events; unpublished map drafts never enter it. Explicit assumptions remain active only on selected portfolio links. Clearing an assumption restores that link's latest baseline value. Historical map selection cannot pin simulation to an old snapshot. Resident routing always uses the published snapshot. Reload preserves planning inputs and assumptions but opens the baseline map first.

Runtime validation drops only an invalid optional planning workspace and warns, preserving valid published map/history and other workflow records. Core record corruption retains the existing recovery policy. Storage remains scoped to one origin/profile; there is no backend or cross-device scenario synchronization.

### Fictional footfall and top-ten planning

`src/demoFootfall.ts` defines92 deterministic fictional `FootfallObservation` sidecar records, one per current DEMO-REF link. Count =20+(zero-based link index×47+31) modulo181; each represents a fictional15-minute window from2026-10-18T12:00:00+08:00 to12:15:00+08:00. Hourly equivalent=count×4. Every record is demo_fixture with a fictional-count method/source note. Counts are reproducible, not observed. Existing legacy counts and all published snapshots remain unchanged. Inspector lookup uses stable segment ID; the sidecar is not a new field observation or a modification to snapshot footfall_observation_ids.

Optional `planning_mode` is footfall/manual (default footfall). Optional `footfall_planning_workspace` contains schema_version1, raw budget/tree_unit_cost_rm/roof_unit_cost_rm strings, has_calculated, assume_unknown_exposed and a top-ten segment-ID→trees/roof/none choices record. Default budget20000, tree unit500, roof unit200; defaults and all estimates are fictional RM allowances. A tree quantity is ceil(illustrative_length_m/8), roof quantity ceil(illustrative_length_m). Unit price changes recalculate estimates. Treatment choice makes one proposal per path eligible; no proposal excludes it.

Sort descending by fictional hourly equivalent, then stable ID. Current top-ten rates are796,792,784,776,768,764,756,748,736,728. Rank1 is DEMO-REF-008,21 illustrative metres,199 fictional events/15min. Its default estimate is3 assumed trees×RM500=RM1500 or21 assumed roof metres×RM200=RM4200. These are not supplier quotes or construction-ready dimensions. The original four manual intervention fixtures are never remapped or overwritten by this planner.

Calculated benefit = hourly equivalent × illustrative length × max(0, baseline exposure weight−treatment target weight). Exposed/mixed/shaded weights are1/.5/0; trees target mixed, roof targets mostly shaded. An explicit planning-only switch defaults unknown baseline weight to1 for this fictional demo; disabling it leaves unknown benefit unavailable and excludes the link rather than inventing zero evidence. Already-shaded links have no additional benefit and receive no funding. Published shade stays unchanged. At most10 proposals enter the existing constrained exhaustive solver; lower total cost breaks equal-benefit ties.

Current baseline publication recalculates benefits, funding and copied simulated segment labels. This may remove funding from a path whose new baseline already provides the proposed shade category. Unpublished drafts do not affect the planner. Scenario records retain simulated status, source baseline version and formula/assumption warnings. Resident routing consumes only published snapshots. Settings/method reload locally; invalid optional footfall settings reset with a visible warning while other valid manual inputs, published maps and history remain intact.

## Calculated route records and selected map layer

`src/routing/graph.ts` defines an explicit DEMO graph: MAIN-GATE ↔ DEMO-JUNCTION viaS01/92m, junction ↔ KLINIK viaS02/106m, and gate ↔ KLINIK viaS03/190m. These are existing fictional metre fixtures; source PNG points are display-only. S04 remains grey/inspectable but excluded from search without defensible length and split connector topology.

`RouteComparison` retains both objectives, version/graph IDs, configuration/warnings, same-path flag, `distance_limit_m` and `exposure_improves_on_shortest`. `CalculatedRoute` stores ordered segment/node IDs, distance, estimated duration, ranking cost, known-label cost, unknown penalty, known/unknown length/coverage and observed-reviewed provenance length. Cost units are metre-equivalents, not measured exposed distance. Unknownweight1, mixed0.5, exposed1, shaded0 are prototype assumptions. Speed1.2m/s is assumed; duration is rounded up to whole seconds.

Shortest ignores shade even for equal-length ties. Practical considers every simple path within shortest×1.25, then minimises cost/distance/stable IDs. Same-path and no-better-within-cap states are explicit; unavailable paths are null, never fake zero metrics. Default initial bothS03/190m; after DEMO S03 exposure publication practicalS01+S02/198m/cost145,detour4.2%. No actual shade/temperature measurement follows from these values.

The final selected-route SVG overlay uses only computed ordered IDs; metadata links overlay/version to the same card/current snapshot. White halo/purple casing/shade centre paints after all base shade strokes. Other shade segments remain visible; grey remains grey. Root App uses one authoritative local workflow for Resident/Developer, with automatic same-origin/profile tab updates. No cross-device/profile/person synchronisation or backend exists.

New `ObservationReview.review_policy` is optional `separate-field-reviewer-v1`. Marked field verification events must have distinct observer/reviewer aliases after trim/case folding; unmarked legacy history stays readable without destructive reset. New publication cannot promote matching-alias legacy field verification; existing published matching-alias evidence warns about legacy policy. DEMO provenance never becomes genuine field evidence by verification. Schema/storage key remain1. Different aliases do not authenticate real people.

## Aligned annotated reference network

Current image: `public/maps/utmkul-reference-normal-points.png` (1113×1413), an edited derivative removing the printed Main Gate–Klinik example route and normalizing those endpoint circles. The original user-supplied JPEG is retained unchanged. `campusMap`/`referenceMap` supply the same asset and retained1113×1414 coordinate frame to both modes; CSS fits the image to that frame, without a geographic transform. `campusRouteNodes` contains60 visible reference-circle centres; `campusGraphNodes` adds17 invisible connectivity junctions. No dot is placed at a hidden path bend. All visible SVG point markers have radius7; selection changes color, not size.

New `DEMO-REF-001`–`DEMO-REF-092` records describe re-traced illustrative corridors. Each starts unknown/grey, no shade observation timestamp or footfall. Access labels identify nearby landmarks, not surveyed entrances. The isolated PA9 spur is left disconnected rather than inventing a connector. The printed dashed Main Gate→Klinik example is removed from the displayed background; live selected routing is purple. No segment data changes were needed for this image edit.

### Developer map classifications

Optional schema1 additions: `map_shade_draft` contains `base_dataset_version`, unique `{segment_id, shade_label}` assignments and `updated_at`; `map_shade_updates` contains immutable publications with publication/base/new-version IDs, assignments, actor, time and note. Older payloads acquire empty defaults; existing snapshots, evidence and reports are preserved. Only the92 current reference IDs can be classified in this editor.

UI labels Unshaded / Mixed shaded / Fully shaded map to existing `mostly_exposed` / `mixed` / `mostly_shaded` enums. They are DEMO ranking classes (weights1/.5/0), not measured shade percentages. Unknown remains weight1. On publication changed segments retain `shade_data_status: demo_fixture` and `shade_observed_at: null`. `shade_source.map_publication_id` links to the recorded manual classification; it is distinguished from field observations in the inspector. Geometry, lengths, footfall, field observation/review history and intervention states are not changed. The new snapshot carries all unedited records forward. A stale draft must be explicitly reviewed against the newest published version before applying/publishing.

Original4 DEMO-S records and68 PR7 DEMO-WALK records remain unchanged, defined through the historical `legacyCampusWalkways.ts` fixture module. New reference records are appended by a strict recognized-ID migration to each old saved snapshot, preserving its existing records, observation/review/report/lifecycle history and current version. Historic geometry is not drawn on a different image. Four old intervention/report IDs retain declared visual proxies; no proxy is promoted into a surveyed location. Original metre facts are retained for old records; new lengths continue the explicit rough0.2m/pixel demo assumption, never a measured map scale or navigation distance.

### Resident route reports

`ResidentReport.route` is optional for backward compatibility and contains `from_node`, `to_node`, `objective` (shortest/exposure), ordered `segment_ids`, ordered `node_ids` (including hidden graph junctions) and source `dataset_version`. New reports add optional `selection_source: map_points` and internally use shortest connected corridors between independent manual map clicks; they do not copy the active journey card. The flag is UI provenance, not authenticated proof of clicking. Read-only form endpoints fill automatically. Older unflagged shortest/exposure records remain valid. It stores the path rather than recalculating report location later. A problem description is required, retained in `comment_optional`. `segment_id` is the first saved link for compatibility. Categories include `broken shade structure` and the original five options.

Developer map counts use the full saved route but only submitted/under-review reports. Accepted/rejected reports are omitted from badges, not deleted from storage/history. Resident maps and their evidence summary do not show counts. Inspector history and accepted-shade source records are preserved.

`accepted_publication_id` is present only for accepted route reports. Existing stored status `verified` is displayed as **Accepted**; `submitted` as Pending review. Acceptance records the normal review-event sequence and a new `MapShadePublication` with optional `source_report_id`, assigning every saved link `mixed`. The report/publication/reviewer/time/note are cross-validated at reload. A route report cannot be stored as accepted without its matching mixed-shade publication; forged route IDs, unsupported endpoints or source links are rejected.

Manual map repair publications keep their existing schema and do not change the accepted report into a repaired/closed record. Earlier accepted yellow snapshots and the original report remain historical evidence. Acceptance sets DEMO classifications with null observed timestamp; it never changes footfall, measured geometry or intervention lifecycle. Older reports without route metadata retain their prior shape/status/history, and are explicitly labelled legacy single-link reports in Developer.

## Point reference photos

A separate local IndexedDB PhotoLibrary schema1 stores revision, published overrides keyed by existing graph node ID, drafts with the point's base_publication_id, and append-only publication records including the previous image. PointPhoto has src, caption, source_note, publication_id and nullable published_at. Fifteen bundled operator-labelled references have unknown capture times; those images are not shade observations and do not change footfall, routing or dataset snapshots. Developer uploads become bounded JPEG previews without EXIF/GPS metadata. Drafts remain separate from published photos; only an explicit reviewed photo publication updates the reference seen by Resident. Existing WorkflowState schema1 and saved shade/report data are unchanged. See POINT_REFERENCE_PHOTOS.md and public/point-photos/manifest.json for mapping, source and privacy preparation details.
