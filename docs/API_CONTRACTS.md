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

All coordinates are WGS84 `[longitude, latitude]`; Malaysia-local timestamps include `+08:00`.
