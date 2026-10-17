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
