# Phase 0 data dictionary and provenance

The central TypeScript definitions are in `src/types.ts`. `study_area_id` is `utmkul-pilot`; all fixture segment IDs begin `DEMO-` and are shared between modes.

| Entity | Key fields | Current Phase 0 provenance |
|---|---|---|
| StudyArea | ID, name, dataset version, basemap attribution | OpenStreetMap basemap; overlay data is separate |
| WalkwaySegment | stable ID, geometry, length, shade, walkability | `DEMO-S01`–`DEMO-S04` are illustrative layout fixtures, pending verification, not navigation data |
| FootfallObservation | count, duration, hourly-equivalent rate, window | `demo_fixture`; never unique people or all-day traffic |
| ResidentReport | category, comment, review status | locally-created demo data, initially `submitted` |
| InterventionCandidate | segment IDs, cost, benefit, constraints | assumed `demo_fixture`; benefits are simulated planning inputs |
| PlanningScenario | baseline version, selected IDs, cost, effects | `simulated`; never overwrites baseline |

Statuses: `sample_observed`, `human_reviewed`, `model_estimate`, `demo_fixture`, `simulated`, `unknown`. Missing values are `null` and displayed as Unknown/Needs survey.

## Vision integration status

No pretrained model weights or permitted walkway image were supplied in Phase 0. This prototype deliberately does **not** claim an AI inference result. Builder 2 should implement `POST /api/shade/analyze` with a permitted lightweight pretrained segmentation/classification model, document its model/version/licence and run an actual inference; it must retain raw output separately from a human shade review. Visible canopy is not ground-level shade or temperature.
