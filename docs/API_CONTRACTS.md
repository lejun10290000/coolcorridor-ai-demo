# Phase 0 API contracts

The initial app uses a local service/fixture seam. Builders replace these functions with API calls without changing UI models. Every response must include stable IDs, `dataset_version`, relevant `data_status`, provenance and `warnings`.

| Capability | Method/path when served | Input | Output / errors |
|---|---|---|---|
| Study area | `GET /api/study-area` | — | `StudyArea` |
| Segments | `GET /api/segments?area_id=` | area ID | `WalkwaySegment[]`; 404 area not found |
| Route comparison | `POST /api/routes/compare` | origin, destination, preference | two `Route`s, segment IDs, geometry, warnings; 400 invalid/same endpoint; 422 no route |
| Shade analysis | `POST /api/shade/analyze` | image file, segment ID | `ImageObservation`; 400 unsupported file, 413 too large, 502 inference failure |
| Shade review | `POST /api/shade/review` | image ID, reviewed label | review record; 404 image |
| Footfall | `GET/POST /api/footfall` | observation on POST | `FootfallObservation`; 400 invalid count/duration |
| Priority | `POST /api/priorities/analyze` | study area/version | `Priority[]`; missing inputs return `score: null` and needs-survey reason |
| Portfolio | `POST /api/interventions/optimize` | budget RM, excluded IDs | selected IDs, cost, remaining, simulated benefit, warnings |
| Scenario | `POST /api/scenarios/compare` | portfolio | `PlanningScenario`, always `status: simulated` |
| Reports | `POST /api/feedback` + review | report / review status | `ResidentReport`; new reports always `submitted` |
| Lifecycle | `POST /api/interventions/:id/status` | next status, actor, note | status event; 409 invalid transition |

Geographic `WalkwaySegment.geometry` coordinates are WGS84 `[longitude, latitude]`; `[]` currently means geographic geometry is unavailable. Malaysia-local timestamps include `+08:00`.

The local display sidecar in `src/campusMapDisplay.ts` uses a separate `map_display_geometry: MapDisplayPoint[]` contract in intrinsic 1290 × 1640 image pixels, keyed by stable segment IDs with `demo_fixture` provenance. It is not GeoJSON and is not returned as geographic route geometry. No endpoints or existing shared TypeScript interfaces changed for the image-map integration.

## Implemented local Developer workflow seam

There is still **no HTTP backend** for these actions. The endpoint table above is a future integration contract. `src/workflow/model.ts` implements deterministic local operations returning a new `WorkflowState` or a validation error; `useWorkflow.ts` owns persistence and cross-role sharing.

| Operation | Inputs | Result / guards |
|---|---|---|
| `currentSnapshot`, `currentStudyArea` | shared state | Current segment snapshot and consistent current study-area version; original fixtures are not mutated |
| `submitReport`, `reviewReport` | valid segment/category/note; review actor/action/time | Existing `ResidentReport` plus review-event history; submitted → under_review → verified, or submitted/under_review → rejected; no direct verification |
| `advanceInstallation` | intervention, requested next status, actor/note/time | Sequential prototype-only status event through installed_pending_verification; verified/published require evidence operations |
| `recordObservation` | `ObservationInput` + creation time | Stable linked observation, raw DEMO/attested field provenance, submitted queue entry; current snapshot unchanged |
| `reviewObservation` | observation, separate review action, reviewer/note, reviewed label/time | Append-only review; raw label/status unchanged; intervention becomes verified only when every linked segment has verified evidence |
| `publishIntervention` | verified intervention, actor/note/time | New current snapshot/version, published observation metadata and lifecycle event; updates only relevant shade fields/source, preserves earlier versions |
| `calculatePlan` | candidates, integer-RM budget text, exclusions | Existing exhaustive solver result after validation; finite non-negative costs/benefits, constraints and overlapping-benefit semantics preserved |
| `buildScenario` | chosen baseline snapshot, candidates, calculated IDs, explicit label assumptions | Separate simulated output with baseline version, linked projections/warnings and copied segments; no mutation/publish |
| `decodeWorkflow`, `loadWorkflow` | versioned stored JSON | Runtime validation / recoverable warning and original baseline on corrupt or incompatible storage |

All timestamps generated/accepted by this workflow include Malaysia `+08:00`. Missing initial shade time stays `null`. Evidence references are safe text only, never fetched/uploaded. `sample_observed` is assigned only by an attested manual field entry; DEMO input cannot be promoted by verification. The published field assessment is `human_reviewed` while its raw `sample_observed` record remains inspectable. There is no GPS API or location request.

## Implemented local route comparison

The normal Resident entry calls `compareRoutes(snapshot, graph?, origin?, destination?, config?)` in `src/routing/compare.ts`; no HTTP request/backend is implemented. The future route endpoint table remains a reserved server contract. `RouteComparison` is a dedicated local result, preserving the original shared `Route` interface.

Inputs use current published `DatasetSnapshot` lengths/shade/provenance, explicit illustrative graph/node/segment IDs, prototype weights and walking speed. Simulated records, invalid endpoints/topology/versions/configuration return unavailable results with warnings. Invalid/missing positive metre lengths and unusable edges are excluded, never replaced by pixels/zero.

Output: dataset/graph IDs, nullable `shortest`/`exposure` results, `identical_path`, nullable `distance_limit_m`, `exposure_improves_on_shortest`, warnings/config. Internal `exposure` is displayed as **Most shaded practical route**. Shortest minimises distance only then stable IDs; practical enumerates loop-free paths under inclusive shortest×1.25 (tolerance1e-9×max(1,limit) metres), ranks cost then distance/IDs, and falls back to shortest if no score improvement exists. Dense-graph enumeration is factorial; only the small DEMO graph is supported as a practical workload.

Each route carries ordered segment/node IDs, summed distance/estimated seconds, exposure-ranking cost, separate known-label cost/unknown penalty, known/unknown metres/percentages, observed-reviewed provenance metres, edges and warnings. Unknownweight1 retains grey/Unknown. Known DEMO/model labels are not field evidence. Map `routeIds`, selected text and cards derive from the same result. Final SVG overlay carries each segment's dataset version and paints after base shade paths. Snapshot changes automatically recompute; scenarios/history choices do not change the authoritative current snapshot.

`commit(update,onFailure?)` preserves boolean success, optionally delivers the same domain Error to inline forms. `ObservationValidationError.field` supports focus/ARIA association; future dates retain input and show the precise error. Field verification/publication rejects identical trimmed/case-folded observer/reviewer aliases. New review events add optional `review_policy: separate-field-reviewer-v1`; legacy events/snapshots remain readable. Storage/schema1 remain unchanged. These are local prototype guards, not identity authentication or cross-device sharing.

## Annotated reference alignment

The current display contract retains the original1113×1414 coordinate frame, identically in Resident/Developer. `/maps/utmkul-reference-normal-points.png` removes the printed Main Gate–Klinik example and normalizes its endpoint dots, fitting its1113×1413 bitmap to that frame; original and previous assets remain available. Earlier1290×1640 notes are historical. Public map props remain stable. Visible source circles and hidden graph junctions are separate; route overlay IDs use the new DEMO-REF namespace. Old evidence IDs/records are retained and a recognized-ID additive migration appends the new unknown reference records to every saved snapshot. `currentStudyArea` exposes the current image source URL without rewriting historical fixture records. Live calculated routes retain purple casing. See REFERENCE_MAP_ALIGNMENT.md and MAP_BACKGROUND_EDIT.md for source anchors, checks and limitations.

### Local Developer map-edit operations (no HTTP endpoint)

- `mapRouteSelection(state, from, to)` returns existing shortest-corridor segment IDs between distinct selectable points, or rejects an unavailable pair. Multiple selections are unioned; individual links can be toggled.
- `stageMapShade(state, ids, shadeLabel, now)` saves/merges a persistent Developer-only draft against the current version. The last explicitly applied category wins on overlaps. It never mutates the published snapshot.
- `removeMapShadeDraft` removes specified edits or discards the draft; `rebaseMapShadeDraft` explicitly reviews stale assignments against the latest version.
- `publishMapShade(state, operator, note, confirmed, now)` requires a nonempty valid draft, matching base version, operator/note and explicit confirmation. It appends a new immutable DEMO snapshot plus publication audit record, clears the draft, and changes `current_version`. It cannot promote labels to observed/human-reviewed evidence or advance installation lifecycle.
- Resident continues to consume only `currentSnapshot(state)`. The existing shared state/storage listener causes both route objectives and overlay IDs to recalculate after publication without another calculate action. Storage is limited to the same browser profile/origin; no remote-user synchronization is provided.

Optional saved fields and provenance are specified in DATA_DICTIONARY.md. No public HTTP/API dependency or package was added. Existing observation review and intervention publication remain separate and continue to work.
