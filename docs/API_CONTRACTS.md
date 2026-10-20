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
| `submitReport`, `reviewReport` | legacy segment/category/note; review actor/action/time | Legacy single-link review remains submitted → under_review → verified, or rejection. New route reports use submitRouteReport/acceptRouteReport below; reviewReport cannot verify a route report without its map publication |
| `advanceInstallation` | intervention, requested next status, actor/note/time | Sequential prototype-only status event through installed_pending_verification; verified/published require evidence operations |
| `recordObservation` | `ObservationInput` + creation time | Stable linked observation, raw DEMO/attested field provenance, submitted queue entry; current snapshot unchanged |
| `reviewObservation` | observation, separate review action, reviewer/note, reviewed label/time | Append-only review; raw label/status unchanged; intervention becomes verified only when every linked segment has verified evidence |
| `publishIntervention` | verified intervention, actor/note/time | New current snapshot/version, published observation metadata and lifecycle event; updates only relevant shade fields/source, preserves earlier versions |
| `calculatePlan` | candidates, integer-RM budget text, exclusions | Exhaustive solver after validation; total candidate scores split across unique links, maximum share at overlaps, shared constraint groups mutually exclusive, lower cost breaks ties |
| `buildScenario` | chosen baseline snapshot, candidates, calculated IDs, explicit label assumptions | Separate simulated output with baseline version, linked projections/warnings and copied segments; no mutation/publish |
| `planningWorkspace`, `updatePlanning` | workflow state; planning input update | Optional persistent planning-only inputs, validated candidate/reference IDs; increment action revision without changing snapshots/current version |
| `planningCandidates`, `calculatePlanning` | workflow state with planning inputs | Candidate copies with current reference targets and assumed costs/scores; constrained plan and scenario always based on latest currentSnapshot; reject invalid numbers, exclude unpublished drafts |
| `topFootfall`, `footfallRows` | current snapshot and fictional current-map sidecar records; footfall settings | Ten busiest current links, ranked by comparable hourly passage equivalents; tree/roof cost breakdowns and calculated demand/exposure benefits |
| `updateFootfallPlanning`, `setPlanningMode` | workflow state and settings/method | Optional settings/method save increments revision only; manual planning inputs and published/history records preserved |
| `calculateFootfallPlanning` | workflow state with budget, unit prices, per-link tree/roof/none choices and explicit unknown-shade assumption | Exhaustive portfolio over at most10 proposals plus a simulated current-map overlay; benefit derives from footfall × assumed exposed-length reduction; excludes unknown benefit when assumption off and zero-benefit proposals; always refreshes from latest published snapshot |
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

### Point-to-point Resident reports and acceptance

These are local TypeScript operations, not a deployed feedback API:

- `submitRouteReport(state, {route, category, description}, now)` requires two distinct connected selectable endpoints, a current-version calculated path (shortest or exposure), exact ordered segment/node IDs, a supported category and nonempty description (maximum2000 characters). It stores the route immutably and creates a submitted report without changing shade. Category `broken shade structure` is supported. Unknown/disconnected/stale/forged paths are refused.
- `acceptRouteReport(state, reportId, reviewer, note, now)` is the explicit Developer review decision. For a submitted report it records submitted→under_review→verified; for one already under review it records verified. In the same atomic state update it appends an audited map publication setting every saved path link to mixed shade, updates the current dataset, and links the report by accepted_publication_id. It cannot be repeated for a final report. Stored verified status is displayed as Accepted for route reports.
- Rejection uses `reviewReport(..., 'rejected', ...)` and changes no map data. Legacy single-link reports remain reviewable but cannot be promoted through route acceptance, because no exact point-to-point path was saved.
- Acceptance uses `publishMapShadeAssignments` without publishing/clearing a pending manual draft. The draft remains based on its earlier version, requiring review before a later manual publication. `MapShadePublication.source_report_id` distinguishes acceptance from a repair/manual edit; published source notes retain this link. It remains DEMO, with no observed shade timestamp or construction verification.
- Resident automatically recalculates against the new snapshot. A later manual shade edit/publication is required after repairs; acceptance never automatically turns the route green or marks repair complete. The report, review events, accepted yellow snapshot and subsequent manual versions remain inspectable.

`reportsForSegment` includes route reports that cover any link in their saved path, with no unrelated-path leakage. The normal Developer inbox provides all reports and an exact-path preview using the current published shade, independent of draft/scenario colours. No server synchronization, authentication or package was added.

Latest UI contract: `CampusImageMap.showReportNumbers` is optional and defaults false; Developer explicitly enables it. Even when enabled, only submitted/under-review reports contribute to numbers. Acceptance/rejection updates map badges immediately while retaining report/audit records. Resident does not pass reports to its map and shows no count summary.

Resident presentation adds optional `CampusImageMap.compactDetails` (default false) to collapse extended legend/source notes while retaining a visible shade/route legend and caution. Developer now also opts into the compact variant in its five-tool sidebar. Optional `RouteCards.compact` presents summary metrics first; all segment/version/evidence details remain inspectable. These are presentation props only; no routing, storage or HTTP contract changes. See RESIDENT_SIDEBAR_LAYOUT.md for the left-map/right-controls layout and responsive behaviour.

Report selection is separate from main routing endpoints/cards. Only map-dot click/keyboard activation captures report points; a fresh From clears the old report To. `manualReportRoute(snapshot, from, to)` derives a connected path between those points with `objective: shortest` and `selection_source: map_points`. The form displays read-only automatically filled names and has no routing objective/endpoint picker. New map-point provenance requires shortest corridor semantics on validation; older unflagged reports remain compatible. No top-level saved-state migration or dependency is required.

### Developer five-tool presentation seam

DeveloperWorkspace keeps the shared map on the left and selects one right-side tool: edit/publish, reports, budget, scenario or footfall. DeveloperMapEditor adds optional controlsTarget?: HTMLElement|null (portal host, inline fallback) and viewLabel?: string. FootfallPlanningPanels adds optional panel: all|budget|scenario|footfall; PlanningPanels adds all|budget|scenario; both default to all. They do not modify model contracts. Reports render through newestReportsFirst, sorting a copy by created_at descending and numeric-aware report_id descending for ties. Records, IDs and audit history retain their stored order. No storage/HTTP/schema/dependency changes. See DEVELOPER_SIDEBAR_LAYOUT.md.

### Point reference photo library (local IndexedDB, no HTTP endpoint)

The new PointPhotoController is owned by App and shared across normal role entries. Resident receives published references; Developer alone renders upload/draft/publication controls. CampusImageMap adds optional pointPhotos?: Record<string,PointPhoto>, photoPoint?: string|null and onPhotoPointChange?: (id:string|null)=>void. These control an independent closable photo panel and marker availability; existing route-node selection still runs for routable points. Five existing corridor nodes become photo-only visible markers, without changing graph topology or routing endpoint eligibility.

PointPhoto fields: src (a bundled allowlisted asset or validated bounded JPEG data URL), caption, source_note, publication_id, published_at (nullable Malaysia-local timestamp). Source notes identify operator-provided location references; images do not establish observed shade/accessibility. PhotoLibrary schema1 contains revision, published overrides, per-node drafts with base_publication_id, and publication history with previous photo/operator/note/timestamp. stagePointPhoto/discardPointPhoto change only drafts; publishPointPhoto requires review, actor/note/time and a matching current point publication. rebasePointPhoto explicitly reviews a stale draft against the latest reference. Atomic IndexedDB transactions preserve concurrent distinct-point edits and reject failures without partial publication.

The database coolcorridor-point-photos-v1 and its library/current record are separate from WorkflowState/localStorage. There is no shade/report migration or shade dataset-version change when publishing photos. BroadcastChannel/localStorage revision events refresh open same-origin tabs; no cross-device service or production authentication is implemented. JPEG/PNG/WebP uploads are browser-decoded, downscaled, stripped of location metadata and stored as JPEG previews. See POINT_REFERENCE_PHOTOS.md for limits, full corrected source mapping and validation.

Developer deletion extends schema1 published overrides to `PointPhoto|null`: an explicit null suppresses the bundled seed as well as uploaded references. `publishedPhotos` filters these tombstones before passing data to maps. `deletePublishedPointPhoto` requires the currently reviewed publication ID, operator, note and Malaysia-local timestamp. It atomically writes the null override and a history entry with `action: delete`, `photo: null`, and the previous image. Existing history without action is interpreted as publish and remains readable; new publish entries can retain that shape. Drafts are preserved, and a draft based on the removed image must be explicitly rebased before publication. The new reader accepts all existing schema1 libraries without migration; older app builds cannot read deletion records, so use the updated build in all tabs. No shade/report contract changes.

PointPhotoEditor chooses actions from the current published library: a photo offers Update/Delete; no photo offers Upload. Update and Upload trigger the same validated file-input pipeline and stage a private draft. Update never invokes deletion; the current image remains published until replacement publication. The accessible input name remains `Upload reference photo` for existing browser checks. This is presentation-only: no controller, storage, model or HTTP contract change.

### Optional report reference attachment

`ResidentReport` adds optional `reference_photo?: ReportReferencePhoto`, with `data_url: string` (JPEG data URL, max300000 characters), `source: resident_upload`, and `capture_time: null`. `submitRouteReport` accepts and copies the optional field; `validReportPhoto` validates it at submission and decodeWorkflow loading. Older reports remain unchanged. There is no schema-version bump, migration or HTTP endpoint. Attachments stay in WorkflowState/localStorage, separate from the point-photo IndexedDB library, and survive acceptance/rejection.

RouteReportForm reuses the browser image preparation pipeline, blocks submission while preparing or after an invalid attachment, and supports clearing the photo. Its existing commit callback can receive optional `onFailure(error)` for visible in-dialog errors. useWorkflow refuses session-only fallback for a newly submitted report with an attachment when the persistent write fails: no report is added, the form stays open and preview/text remain. Other commits keep their existing fallback behavior. Developer ReportReview renders a labelled, expandable reference image; it does not infer validity or automatically publish shade/map photos. See REPORT_REFERENCE_PHOTOS.md.

### Resident walkthrough presentation seam

`CalculatedResident` can begin an in-memory `WalkSession {route: CalculatedRoute, snapshot: DatasetSnapshot, next_index: number}` from the selected comparison route. It copies the route and snapshot, preserving ordered nodes/segments and map version until exit. `beginWalk` validates connectivity and snapshot consistency; `advanceWalk`/`previousWalkPoint` move one confirmed graph point with bounded progress. `walkProgress` derives current/next/completion. Existing comparison APIs and automatic publication recalculation are unchanged outside the locked session. A newer-baseline notice offers exit/replanning; photo references remain the latest published library.

`CampusImageMap` adds optional `walkPosition?: {current:string; next:string|null}`. It draws last-confirmed/next rings and exposes existing internal junctions as needed, without creating route endpoints or changing graph topology. Developer callers omit the prop. Walk progress is not persisted, sent to a server or read from GPS. No storage schema or migration is needed. See RESIDENT_WALKTHROUGH.md.
