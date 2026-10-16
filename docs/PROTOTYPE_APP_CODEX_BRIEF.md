# CoolCorridor AI — Phase 0 Interactive Prototype Brief for Codex

**Document type:** Build brief for one builder's Codex session  
**Version:** 1.0  
**Project:** Sime Darby Property University Hackathon 2026 — *Township of Tomorrow*  
**Pilot:** Universiti Teknologi Malaysia, Kuala Lumpur (UTMKL)  
**Initial journey:** Main Gate → Pusat Kesihatan UTM Kuala Lumpur (Klinik UTM)  
**Product tagline:** *Smarter Shade. Cooler Journeys. Greener Townships.*

> **Read first:** Read the repository root `AGENTS.md` completely. It contains mandatory shared rules. This brief supplements it for the Phase 0 sample app; it does not replace or override `AGENTS.md` or any later operator decision.

---

## 1. Your assignment

Build the **first runnable, interactive sample app** for CoolCorridor AI so the operator can inspect the product experience and test whether the agreed features and workflows make sense before all four builders begin their separate modules.

This is a **Phase 0 prototype**, not a claim that CoolCorridor AI is already deployed, validated, approved by UTM or endorsed by Sime Darby Property. The prototype should look coherent and feel usable, and its important controls must perform a meaningful action. Use clearly labelled demo fixtures where evidence is not yet available. Do not fake factual campus data or claim that mocked outputs are real.

Start by inspecting the current repository and `AGENTS.md`. The repo may initially contain only a README and project rules. Propose the simplest stack that can be integrated by the four builders, then implement a working prototype on your own feature branch. Avoid a long design-only response: unless a genuine blocker or an ambiguous irreversible decision arises, build the sample app and provide the run/test instructions.

### Definition of success

The operator can launch the app locally, switch between Resident and Developer demo modes, explore the UTMKL pilot map, run through the resident route-comparison workflow, inspect a segment, try the Developer's priority/budget/scenario workflow, and test the intervention map-update lifecycle. The UI clearly separates real geography from demo observations and simulated future changes. A real pretrained computer-vision inference path is included for at least one permitted image or is explicitly reported as incomplete; never label a static mock result as real AI.

## 2. Hackathon problem and solution context

### The problem

Pedestrians in a Malaysian tropical campus environment may have to walk across sun-exposed paths between important destinations. The shortest route may not be the most comfortable, and users often cannot see which alternative has better-supported shade evidence. Campus/property managers also need to decide where to invest limited funds in trees, shelters or covered walkways. Those decisions should be supported by the condition of a walkway, credible pedestrian observations, costs, accessibility/site constraints and uncertainty.

### The proposed solution

**CoolCorridor AI is an AI-assisted pedestrian-shade mapping and planning app.** It has two demo user roles on one shared walkway network:

- **Resident:** compares a shortest feasible walking route with a route that has lower *estimated* sun exposure, inspects the supporting evidence and reports walkway problems.
- **Developer / Township Management:** opens a map-first planning dashboard, inspects shade and pedestrian evidence, assesses priorities, optimises candidate shade interventions under a budget, previews a simulated before/after scenario and records the lifecycle of projects after they are installed and verified.

The core differentiator is the complete workflow—not just a shade map:

**Map → Evidence → Priority → Candidate interventions → Budget optimisation → Simulated before/after → Verified map update.**

### Approved scope and assumptions

- Responsive web app, optimised for a laptop demonstration but usable on smaller screens.
- UTM Kuala Lumpur is the pilot area.
- Initial route endpoints: **Main Gate** and **Pusat Kesihatan UTM Kuala Lumpur (Klinik UTM)**.
- Use a real campus basemap and sourced, connected pedestrian geometry. Validate the exact route in the field before calling it verified.
- Demo shade, pedestrian counts, intervention costs and benefits are permitted where real evidence is missing, but must be persistently labelled `DEMO / ILLUSTRATIVE` or `SIMULATED`.
- Default demo optimisation budget: **RM20,000**, editable by the user.
- No production login: a demo role selector is acceptable and must say it is for prototype use only.
- Map-update and approval workflow is simulated inside Developer mode. No action in this prototype represents real UTM facilities approval or a real construction approval.
- At least one actual pretrained vision model inference on a permitted image is required for the real hackathon demo. The Phase 0 UI can use clearly labelled temporary fixtures for other modules while they are being integrated.

## 3. Design direction

Create a polished, believable university sustainability/planning product—not a generic AI dashboard or a flashy sci-fi control panel.

- Use a restrained dark-purple/plum primary accent, off-white/light neutral surfaces, readable dark text, clear spacing, modest borders and consistent typography.
- Use shade colours consistently: red = mostly exposed; yellow = mixed; green = mostly shaded; grey = unknown. Include text labels and a legend, not colour alone.
- Use a large, readable map as the primary working surface on Developer mode.
- Use compact metric cards only as supporting information. Avoid excessive gradients, glass effects, glow, animated decoration or AI-themed imagery.
- Show persistent status chips for `OBSERVED`, `HUMAN REVIEWED`, `MODEL ESTIMATE`, `DEMO`, `SIMULATED`, `UNKNOWN` and `NEEDS SURVEY` where relevant.
- Every button must have a meaningful action, a clear disabled/loading state where needed, and feedback for success/error/no data.
- Provide empty, loading and failure states. Do not show arbitrary placeholder numbers without a status label.
- Add map attribution and follow the map tile/data provider's terms and usage limits.

## 4. Pages and navigation

Build a single web application with a simple navigation model:

1. **Home / Role selection** — product name, UTMKL pilot label, short explanation, data status note, Resident and Developer entry points.
2. **Resident Map** — destination selectors, map and route comparison controls.
3. **Resident Route Results** — two route choices and supporting metrics; can be a panel on the same page if it is clearer.
4. **Resident Segment Details** — selected walkway evidence and reporting action.
5. **Developer Planning Map** — map-first dashboard with layer toggles, legend, budget summary and selected-segment inspector.
6. **Developer Priority & Interventions** — evidence-explained priority results and candidate selection; it may be integrated into the Developer map as side panels.
7. **Developer Scenario Comparison** — baseline versus proposed simulated scenario.
8. **Developer Intervention Lifecycle** — change a demo candidate through proposed, approved-demo, under-construction, installed-awaiting-verification, verified and published statuses.
9. **Developer Report Review** — view resident reports and mark under review, verified or rejected.

Prefer a few coherent pages with panels/sheets over a large number of thin pages. Preserve the ability to demo the complete flow quickly.

## 5. Functional requirements

### F1. Home and demo roles

- Show CoolCorridor AI, tagline, pilot study area UTMKL and the initial Main Gate → Klinik UTM journey.
- Resident and Developer controls navigate to their respective modes.
- Provide a clear “Demo mode” label; do not implement a fake login form.
- Provide a simple Home/role switch so the operator can change roles without losing the current demo data unexpectedly.

### F2. Shared interactive campus map

- Use an actual sourced campus basemap if the selected provider supports the area. Cite/attribute the provider in the UI as required.
- Represent verified pedestrian links as connected line segments with stable `segment_id` values.
- The lecturer's campus directory map and official campus maps are references for landmarks, not proof that every line is a walkable, accessible route. Do not digitise invented route lines and call them verified.
- If verified route geometry is not available yet, show the real base map and a visible message such as `Pedestrian network pending verification`. A temporary schematic may only be used for layout preview when strongly marked `ILLUSTRATIVE — NOT FOR NAVIGATION`. Do not show a fake line as a verified route.
- Include zoom, pan, recenter, selectable segments, consistent legend and toggles for shade, footfall/evidence, priority, interventions, reports and scenario.
- A click selects only the relevant segment and synchronises its map highlight with the inspector panel.
- Grey/unknown segments remain visible as unknown; do not silently convert missing data to green, red or zero.

### F3. Resident route comparison

- Set the default endpoints to Main Gate and Pusat Kesihatan UTM Kuala Lumpur (Klinik UTM).
- User can select available landmarks in start/end dropdowns or through a map selection; validate empty or identical endpoints.
- Shortest route minimises distance (or time, consistently documented) over the pedestrian graph.
- Lower-exposure route uses a documented edge cost and only available/defensible shade data; use a declared detour cap if implemented.
- Route outputs must identify the exact segment IDs and geometry that are drawn on the map.
- Show distance, estimated walking time (state the walking-speed assumption), detour versus shortest, estimated exposure metric/coverage and uncertainty warnings.
- If the two routes are the same, say so. If no valid route exists or shade data are insufficient, show a useful warning; do not invent an alternative.
- Any demo route record must be marked demo-only and must not be presented as field-verified campus navigation.

### F4. Clickable evidence inspector

For the selected segment, show where available:
- segment ID/name and length with measurement/source status;
- shade category and observation date/time;
- photo(s) with source/permission note and associated AI output if available;
- footfall source, passage count, duration, timestamp, direction and hourly-equivalent rate if calculable;
- report count separated by report review status;
- accessibility/field verification caveats;
- priority score and exact reasons, or `Insufficient evidence`;
- actions: view evidence, compare route, mark candidate, mark survey needed.

All fields must correspond to the selected segment. Missing values show `Unknown` or `Not collected` rather than made-up values.

### F5. Real pretrained computer vision path

- Provide an image upload/selection control for a permitted walkway photograph.
- Associate the image with an `image_id` and `segment_id`.
- Run real inference with a pretrained segmentation/classification model whose licence is documented. Select a lightweight, feasible model and record model name/version, supported classes and limitations.
- Show the source image, actual output (mask/labels/class scores as supported), model/version, status and warnings.
- Include a human-review control to confirm/correct the **walkway shade category**; keep raw model output and human-reviewed label separate.
- Do not equate visible canopy fraction with shade fraction on the ground or air temperature.
- Provide a reproducible inference example and tests for valid image, unsupported file/error handling and failed inference.
- If real model inference cannot run in this phase because weights, environment or permitted imagery are unavailable, preserve the integration seam and show a clear `AI INTEGRATION PENDING / DEMO OUTPUT` status. Report the blocker accurately. Never claim real inference is finished when only fixture output is displayed.

### F6. Footfall entry and evidence

- Provide an operator/developer demo form to enter count, observation start/end, duration, point/segment, direction, method, weather/note and source status.
- Calculate `pass_count / duration_min * 60` only for valid positive duration and count inputs.
- Label the result as an hourly-equivalent passage-event rate for that sampled window—not all-day traffic or unique people.
- Distinguish `sample_observed`, `model_estimate`, `demo_fixture`, `unknown`.
- Use same-window and comparable methods for meaningful A/B comparisons; warn when samples are incomparable.
- Resident report counts and route-search counts must never be used as pedestrian counts.

### F7. Priority analysis

- Provide an explicit `Analyse Priority` action that actually evaluates current records rather than only changing a badge.
- A possible initial proxy is sampled passage-rate equivalent × defensibly estimated exposed length. Document units and the caveat that it is not a medical/health outcome.
- Keep missing footfall/shade inputs unknown and mark such segments `Needs survey` instead of ranking them as low demand.
- Results must show rank/score, input values, data source/status, explanation and uncertainty. Clicking a ranked item highlights the exact segment on the shared map.

### F8. Intervention candidates and budget optimiser

- Provide 3–8 small example candidates for tree planting, shade canopy/shelter or covered walkway. Mark any unverified locations/costs/benefits as demo/assumption values.
- Each candidate has ID, linked segment IDs, location/geometry if verified, intervention type, cost in RM, cost source/status, modelled benefit, constraints, feasibility status and notes.
- Default budget = RM20,000; allow editing and candidate exclusion.
- `Optimise Plan` must calculate a selected subset of eligible candidates. Use an actual deterministic exhaustive subset/knapsack algorithm for a small candidate list, not hardcoded selection.
- Selected total cost must never exceed the budget. Honour exclusions and mutually-exclusive constraints; do not double-count overlapping benefits on the same segment.
- If no candidate is eligible/affordable, show an empty selection and explain why.
- Changing budget or exclusions must recompute selected IDs, total cost, remaining budget, benefit estimate and map highlights.
- Provide a transparent reason for each selection and label portfolio benefits as simulated/assumption-based.

### F9. Before/after scenario

- Compare the current baseline and selected intervention scenario side by side, split view or toggle.
- Show candidate sites and affected segment IDs on the map.
- Show selected cost and modelled changes using only defined assumptions, with a persistent `SIMULATED` label.
- The scenario must not overwrite the baseline data. Provide an obvious return-to-baseline action.
- Never show unsupported temperatures, carbon savings, energy savings or number of beneficiaries.

### F10. Intervention lifecycle and map updates

Simulate this lifecycle with valid state transitions:

`proposed → approved_demo → under_construction → installed_pending_verification → verified → published`

- `approved_demo` means only simulated prototype approval; say this clearly in UI copy.
- Record demo actor, timestamp, completion note and evidence photo/reference where available.
- `installed_pending_verification` means an installation was recorded, but shade benefits are not yet confirmed.
- Require a distinct verification action before the record can become verified/published.
- Verification creates a new current-data version/observation; preserve the original baseline and the intervention history.
- After a demo publish action, both Resident and Developer screens should reflect the updated **demo dataset version** and remain visibly marked prototype/demo if the observation itself is fictional.
- A future tree may provide little shade; do not automatically mark it mostly shaded just because the planting task is complete.
- Do not imply the real UTM facilities team approved or built anything.

### F11. Resident reports and review

- Categories: no shade, too hot at a specified time, blocked walkway, unsafe crossing, other.
- Optional short text; image upload only if permitted and safely handled.
- New reports start `submitted/pending`.
- Developer can move a report to `under_review`, `verified` or `rejected` and add a short review note.
- Reports remain separate from measured footfall. Protect identifying details and do not expose private raw data.

## 6. Suggested data model

Implement these models/types in a central place, adjusted for the agreed stack, and document them. Keep identifiers stable across modes.

### StudyArea
- `study_area_id`, `name`, `dataset_version`, `base_map_source`, `source_url`, `licence_or_attribution_note`, `updated_at`.

### WalkwaySegment
- `study_area_id`, `dataset_version`, `segment_id`, `name`, `geometry`, `length_m`, `walkable_status`, `accessibility_status`, `geometry_source`, `shade_label`, `shade_observed_at`, `shade_data_status`, `footfall_observation_ids`.

### ImageObservation
- `image_id`, `segment_id`, `captured_at`, `source_or_permission`, `model_name`, `model_version`, `model_output`, `human_review_label`, `review_status`, `data_status`, `warnings`.

### FootfallObservation
- `observation_id`, `segment_id` or observation point ID, `pass_count`, `duration_min`, `passes_per_hour_equivalent`, `window_start`, `window_end`, `direction`, `method`, `data_status`, `source_note`.

### ResidentReport
- `report_id`, `segment_id`, `category`, `comment_optional`, `created_at`, `review_status`, `review_note`, `data_status`.

### InterventionCandidate
- `intervention_id`, `segment_ids`, `type`, `geometry_or_location`, `cost_rm`, `cost_source_status`, `modelled_benefit`, `constraints`, `feasibility_status`, `data_status`.

### PlanningScenario
- `scenario_id`, `baseline_dataset_version`, `budget_rm`, `selected_intervention_ids`, `total_cost_rm`, `remaining_budget_rm`, `modelled_effects`, `status=simulated`, `warnings`.

### InterventionStatusEvent / ShadeReview
- `event_id`, `intervention_id`, `from_status`, `to_status`, `actor_demo_label`, `timestamp`, `evidence_reference`, `review_note`, `dataset_version`.

Conventions: GeoJSON coordinate order `[longitude, latitude]`; ISO 8601 times with Malaysia `+08:00` offset for local observations; metres for length; numeric RM costs; null + explicit unknown state for missing values.

## 7. Service/API boundaries

For Phase 0, keep the app simple. If a backend is needed for real vision inference, a small API is sufficient. Other prototype data may use a local service/fixture layer behind clear function boundaries. Avoid multiple competing services.

Agree on request/response shapes with the operator before hardening interfaces. Suggested capabilities/endpoints:

- `GET /api/study-area` — area identity, source, dataset version.
- `GET /api/segments?area_id=...` — GeoJSON segments and provenance.
- `POST /api/routes/compare` — origin, destination and preference; returns route segment IDs, geometry, distance, time and warnings.
- `POST /api/shade/analyze` — permitted image + segment ID; returns real model result, model/version and warnings.
- `POST /api/shade/review` — human-confirmed shade observation and review status.
- `GET/POST /api/footfall` — list or create sourced observation records.
- `POST /api/priorities/analyze` — priority output with per-segment inputs and reasons.
- `GET /api/interventions` and `POST /api/interventions/optimize` — candidates and chosen portfolio.
- `POST /api/scenarios/compare` — baseline and simulated scenario metrics.
- `POST /api/feedback` and a review action — resident reports and review statuses.
- `POST /api/interventions/{id}/status` — validate lifecycle transition and retain status history.
- `POST /api/interventions/{id}/verify` and `/publish` — prototype verification/version-publish actions.

Every response used by the UI should include stable IDs and relevant `data_status`, source/provenance and warnings. Errors should be structured enough to show a friendly UI message. Do not show successful results when a request failed.

## 8. Prototype architecture constraints

- Inspect `AGENTS.md`, repository structure, stack files and existing work before editing.
- Work on a feature branch such as `feature/phase0-interactive-prototype`; do not commit directly to `main`.
- Choose the simplest stack which can run reliably and be integrated by all four builders. Explain the choice in the PR.
- Keep shared models/types, data access and algorithms separate from UI components, even in a prototype, so other builders can replace a fixture with a real service later.
- Avoid introducing unnecessary frameworks, databases, infrastructure, authentication or hosting dependencies.
- Do not add secret keys, credentials, private images or raw identifying survey data to the repository.
- Use a safe `.env.example` only when configuration is genuinely needed; keep `.env` out of Git.
- Make the app runnable with one documented start path if possible. Document model downloads/setup if real CV needs them.
- Make demo writes persist during the demo and, if convenient with the stack, survive refresh locally. Do not persist sensitive material.
- Do not install or commit arbitrary packages without explaining why; choose maintained dependencies and respect licences.

## 9. Acceptance checklist for the operator

### App and map
- [ ] Clean start from README instructions on a fresh checkout.
- [ ] Home can switch into Resident and Developer demo modes.
- [ ] Developer opens on a large interactive map, not just KPI cards.
- [ ] Basemap source/attribution is visible where required.
- [ ] No path is called verified unless its geometry/source has been checked.
- [ ] Shade legend consistently uses red/yellow/green/grey and includes text labels.
- [ ] Clicking a segment synchronises its map highlight and inspector data.

### Resident
- [ ] Main Gate and Klinik UTM are selectable as endpoints.
- [ ] Invalid endpoints and no-route conditions are handled.
- [ ] Shortest and lower-exposure route options are calculated from graph edges, not merely drawn as arbitrary lines.
- [ ] Route cards and map use the same segment IDs and matching metrics.
- [ ] Unknown shade produces a warning/coverage note rather than zero exposure.
- [ ] Resident report is saved/represented with pending review status.

### AI and evidence
- [ ] A permitted image reaches an actual pretrained model inference path.
- [ ] Original image and actual output can be inspected.
- [ ] Model name/version and limitations are documented.
- [ ] Human review is separate from model output.
- [ ] Demo footfall is clearly marked and count math is tested.

### Developer planning
- [ ] Priority result explains source fields and missing data.
- [ ] Budget optimiser genuinely computes; total selected costs never exceed budget.
- [ ] Budget and exclusions recalculate plan and map highlights.
- [ ] Overlapping benefits are not double-counted.
- [ ] Scenario is marked simulated and never overwrites baseline.
- [ ] Intervention lifecycle requires verification before publish.
- [ ] Published demo update changes a versioned demo dataset visible in both roles.
- [ ] Report moderation does not convert reports into footfall.

### Quality and handoff
- [ ] Unit tests exist for route, rate calculation, optimiser and lifecycle transitions.
- [ ] Build/lint/test commands and actual results are in the PR.
- [ ] Known failures and not-yet-implemented features are stated truthfully.
- [ ] A screenshot or short screen recording of the prototype is attached to the PR.
- [ ] No credentials, identifying images or prohibited data have been committed.

## 10. Required delivery from this Codex session

Submit one focused pull request with:

1. A runnable Phase 0 interactive prototype implementing the screen flows and meaningful interactions described above.
2. Clear `DEMO`, `SIMULATED`, `UNKNOWN` and pending-verification indicators where applicable.
3. At least a minimal real pretrained vision inference path or a precise list of the blocker and the exact remaining work; do not misrepresent mock output as real inference.
4. Central models/fixture service and replaceable seams for route, vision, priority, optimisation and map-update functions.
5. README setup/run/test instructions, sources/attribution/licence notes and screenshots.
6. Tests for the key calculations and state transitions.
7. A pull-request summary listing changed files, commands actually run with results, remaining risks, and instructions for the operator to verify the demo.

### Final instruction

Build the smallest coherent app that demonstrates the product end to end. Prioritise truthful map/evidence behaviour, a working resident route flow, a useful Developer map, real budget recomputation and the simulated-to-verified map update lifecycle over animations or a large volume of extra screens. Do not declare work complete until the operator can launch it and manually verify these flows.