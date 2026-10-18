# AGENTS.md — CoolCorridor AI shared Codex rules

Version: 1.0  
Project: CoolCorridor AI Demo App  
Pilot: UTM Kuala Lumpur (UTMKL), initial journey Main Gate → Pusat Kesihatan UTM Kuala Lumpur (Klinik UTM)  
Audience: Every builder and every Codex session working in this repository

These are repository-wide instructions for all AI coding agents. Read this file before changing any files. The operator is the product owner and final acceptance tester. Follow these rules even when a task prompt is shorter.

## 1. Product goal and approved decisions

Build one responsive, laptop-first web application with two demo modes sharing the same data and map:

- **Resident:** explore the campus map, compare shortest and lower-estimated-sun-exposure walking routes, inspect segment evidence, and submit a walkway report.
- **Developer:** open on a large interactive map; view shade and pedestrian evidence; inspect segments; analyse explainable priorities; select and optimise candidate shade interventions under a default RM20,000 budget; preview a simulated before/after scenario; manage the proposed → construction → installed → verification → published lifecycle; review resident reports.

Approved prototype decisions:
- Web application, responsive and laptop-first.
- Initial route: UTM KL Main Gate → Pusat Kesihatan UTM KL (Klinik UTM).
- Use a real campus basemap and verified pedestrian route geometry. Use clearly labelled demo shade/footfall records where real observations are unavailable.
- Run at least one actual pretrained computer-vision inference on a permitted image before the hackathon demo is called AI-complete.
- No production authentication in the prototype. A demo role selector is acceptable and must be clearly identified as demo-only.
- Simulate the full map-update approval lifecycle in Developer mode. Do not imply that any action approves a real UTM construction project.
- Default optimiser budget: RM20,000, adjustable by the user.
- The team may choose the simplest integrated technology stack, but agree it together before creating incompatible frameworks/services.

If the repository conflicts with a confirmed newer operator decision, do not guess or silently rewrite scope. Raise the conflict and wait for the operator to confirm the source of truth.

## 2. Non-negotiable truthfulness and data provenance rules

Never invent campus coordinates, buildings, pathways, crossings, route distances, shade observations, pedestrian counts, construction status, costs, model accuracy, cooling effects, or UTM approvals.

Every dataset record must indicate its source/status. Use these status values consistently where relevant:
- `sample_observed`: real field observation with method, timestamp and location.
- `human_reviewed`: a person reviewed/corrected a shade interpretation.
- `model_estimate`: estimated by a documented method; disclose inputs and uncertainty.
- `demo_fixture`: fictional data for UI and tests; visibly marked DEMO / ILLUSTRATIVE in the UI.
- `simulated`: hypothetical future intervention/scenario; visibly marked SIMULATED.
- `unknown`: no defensible data; display “Unknown” / “Needs survey”, never replace it with zero.

A source map or campus directory can support landmark identification but does not validate every pedestrian connection, accessible path, route length or shade condition. Main Gate → Klinik UTM geometry must be grounded in a permitted map/data source and checked before being presented as a verified route. If not yet verified, label it clearly and do not claim navigation reliability.

A visible tree canopy fraction is not automatically ground-level route shade percentage or air temperature. AI image inference supplies visual evidence only; human-reviewed shade condition and observation time must remain distinct.

A passage count is a count of events, not necessarily unique people, all-day volume or origin-destination route choices. App searches and reports are not pedestrian counts.

No claims of degrees-Celsius cooling, CO₂ saved, energy saved, people benefited, verified AI accuracy, approved construction works, or SDP/UTM partnership without appropriate evidence.

## 3. Shared map and data consistency

- Both modes MUST use the same `study_area_id`, `dataset_version` and stable `segment_id` values.
- GeoJSON coordinates use WGS84 order `[longitude, latitude]`.
- Every walkable segment must have real geometry, a stable ID, source/provenance, and a walkability/verification status.
- Do not draw routes as arbitrary straight lines through buildings, private areas or roads with no valid crossing.
- A map line, label, count or intervention highlight must refer to the record/segment it claims to show.
- Shade colour conventions: red = mostly exposed; yellow = mixed; green = mostly shaded; grey = unknown. Include a legend and text labels; do not rely on colour alone.
- Footfall labels must show the unit, time window and source/status. Never display a bare number such as “108 people”.
- Time-dependent data must not be shown for a time window that was not observed/modelled.
- Never overwrite observed baseline data with a planned scenario or simulated data.

Minimum shared data conventions:
- Times: ISO 8601 with explicit timezone; use Malaysia local offset `+08:00` when representing local observations.
- Distance: metres (`*_m`); duration explicitly in seconds/minutes.
- Money: numeric RM amounts (`*_rm`) and a source/type note (quoted, sourced estimate, assumed or demo fixture).
- Missing values: `null` plus an explicit unknown/warning state, not zero.
- Keep input/output schemas documented before modules integrate.

## 4. Product behaviour

### Resident mode
1. Choose a known origin and destination; initial demonstration route is Main Gate → Klinik UTM.
2. Calculate a shortest feasible pedestrian route and a lower-estimated-exposure alternative when evidence supports one.
3. Show the route geometry, distance, estimated walking time, detour, shade-evidence coverage and warnings. Route cards and map line must use the same segment IDs.
4. Unknown shade must remain unknown; show uncertainty rather than assigning zero exposure. Apply a documented detour cap if configured.
5. Clicking a segment opens its own evidence panel (shade status, timestamp, source, photo if available, footfall status, accessibility caveat).
6. Resident reports have categories such as no shade, too hot at a stated time, blocked path, unsafe crossing or other; newly submitted reports begin as `pending` and never count as footfall.

### Developer mode
1. Landing screen is a large interactive map, not only KPI cards.
2. Layers include shade, pedestrian/footfall evidence, priority, interventions, resident reports and scenario; layers with no data must show that honestly.
3. Clicking a segment shows that segment's evidence and data source.
4. Priority must expose its formula, input values, assumptions, confidence and reason. If required inputs are missing, show “Needs survey” / “Insufficient data” rather than a fake rank.
5. Candidate interventions need IDs, linked segment IDs/geometry, type, cost/source, assumed benefit, feasibility status and constraints. Unverified candidates are not construction-ready recommendations.
6. Optimiser must calculate a portfolio under the entered budget; it must not simply mark each individually affordable item as “affordable”.
7. Cost of selected candidates must never exceed budget. Honour exclusions and mutually-exclusive constraints; do not double-count overlapping benefits. If no eligible item fits, return an empty plan with a clear reason.
8. Changing the budget or candidate exclusions must trigger a real recomputation and update map highlights, cost totals and benefits.
9. Before/after is explicitly a simulated scenario and must not mutate the baseline.
10. Map-update lifecycle in demo: `proposed → approved (demo only) → under_construction → installed_pending_verification → verified → published`. Track who/when/evidence as demo records where real records do not exist. Only a verification/publish action in the prototype may update the displayed *current demo dataset*, and the UI must state it is a prototype operation; preserve history and baseline.
11. Resident reports can move through `submitted → under_review → verified/rejected`; never label as verified without review.

## 5. AI image inference requirements

- Use a pretrained vision/segmentation model with a compatible licence. Record model name/version and licence in documentation.
- Validate uploaded file type and size; handle inference errors visibly.
- Every inference response should include at least image ID, associated segment ID, model/version, detected supported visual classes or result, status, and warnings.
- Keep the original image and model output inspectable when possible.
- Human review is separate from raw model output and can correct the shade assessment.
- Include a repeatable example/test and document at least one known limitation or failure case.
- Do not hard-code a result while presenting it as real inference. If the model is not integrated yet, label the temporary UI as mock and do not call AI acceptance criteria complete.

## 6. Budget, priority and scenario logic

- Use a transparent, deterministic formula for priority; document units and caveats.
- A suggested exposure-demand proxy is observed passage-rate equivalent × estimated exposed length, but only where the inputs are defensible and time windows comparable. Unknown demand is not zero.
- For the first prototype, a real subset/knapsack search over 3–8 candidates is sufficient. Keep implementation simple and testable.
- Benefit must reflect model assumptions; overlapping intervention impacts must be aggregated by segment without double-counting.
- Compare the optimizer against at least one simple baseline when feasible and report what the comparison actually shows.
- Scenario outputs must carry `status: simulated`, the baseline dataset version and warnings about assumed costs/benefits.

## 7. Technology and architecture coordination

The stack is not pre-selected. Before major implementation, Builder 1 should propose the simplest stack the four builders can run locally and explain:
- frontend framework and map library;
- backend/runtime choice, if a backend is needed;
- how image inference is served;
- data storage and API approach;
- install/start/test commands.

The operator approves the stack after the builders confirm compatibility. Do not independently introduce a second frontend framework, duplicate backend, different mapping library or competing data store. Prefer a single runnable app with the fewest services compatible with the real AI requirement.

Create and agree on `docs/API_CONTRACTS.md` and `docs/DATA_DICTIONARY.md` early. For each endpoint/event define method, path, request, response, errors and data-status fields. Suggested capabilities:
- study area and segments;
- route comparison;
- image shade analysis and review;
- footfall records;
- resident feedback;
- priority analysis;
- intervention candidates and optimiser;
- scenarios;
- map-update status/verification/publish.

All modules use consistent IDs and schema fields. Use typed request/response validation if supported by the selected stack.

## 8. Builder ownership and file boundaries

Adjust names after the operator assigns actual people. These are the default workstreams:

- **Builder 1 — Frontend / app shell / integration:** home and demo-role selector, shared map UI, Resident and Developer pages, segment inspector, status/error/loading states, API client, run instructions, end-to-end integration.
- **Builder 2 — Vision AI:** model choice/licence, inference service, image validation, model output/result contract, human review support, inference tests and limitations.
- **Builder 3 — GIS / route graph:** sourced campus geography, pedestrian network and stable segment IDs, shortest and lower-exposure routing, route metrics, geometry/provenance and deterministic tests.
- **Builder 4 — Planning / optimisation / map updates:** priority scores, candidate interventions, real budget portfolio solver, scenarios, intervention lifecycle state transitions, report review support and tests.

Ownership is a guide to primary responsibility, not an exclusive boundary or permission gate. Any builder may inspect, edit, commit, and push changes to any project file on their own feature branch, and may create or update a pull request, without asking Builder 1 or the file owner for prior permission. This includes changes to another builder's main module and shared files (API contracts, common schemas, dependency manifests, and app config).

For visibility and safe integration, the PR description must explain cross-workstream changes, shared-contract/schema changes, migration or compatibility effects, and tests run/results. Tag or notify affected builders when practical, but notification is informational, not a request for permission or a veto. Preserve other people's work; do not silently overwrite or discard competing changes. If a real conflict occurs, resolve it through Git and the PR discussion rather than blocking a builder from starting or pushing their proposed change.

All builders should run in parallel once the interface contracts are agreed. Use clearly labelled fixture data to unblock UI/testing while real inputs are being collected. Replace fixtures with verified data when available, without disguising fixtures as observations.

## 9. GitHub workflow — required

- Keep `main` as the integrated, runnable version.
- Do not commit directly to `main`; work on feature branches and open small pull requests.
- Suggested branches: `feature/frontend`, `feature/vision`, `feature/gis-routing`, `feature/planning-optimizer`. Any builder may push commits to their own feature branch and open/update a PR without Builder 1's permission. If a branch already exists, inspect it first and avoid overwriting or discarding someone else's work; use your own branch when work may conflict.
- Never force-push shared branches, discard another person's work, reset someone else's changes or automatically merge a PR without operator approval.
- Every PR must state: purpose, changed files, how to run, tests run/results, known limitations, any schema/API changes and a screenshot or sample output when UI/model relevant.
- Keep changes focused. Do not combine unrelated modules in one PR.
- Update README/setup instructions whenever the run process, configuration or dependencies change.
- Resolve genuine merge conflicts openly and preserve other builders' work; the module owner does not have to grant permission for another builder to propose or push a change on a feature branch.
- The operator approves merge after review and passing checks/manual smoke test.

## 10. Required test and quality practices

Add tests appropriate to the selected stack. At minimum verify:
- valid and invalid origin/destination; no route found;
- route uses network segment IDs and route-card values match map geometry;
- missing shade/footfall remains unknown rather than zero;
- time windows and data status appear correctly;
- AI endpoint handles a valid image, unsupported file and inference error;
- priority explains its inputs and flags insufficient evidence;
- optimiser never exceeds the budget, honours exclusions, handles no eligible candidates and does not double-count overlap;
- changing RM10,000 to RM20,000 causes a genuine recalculation when inputs justify a different result;
- scenario never mutates baseline records;
- map-update lifecycle rejects invalid state changes and records verification status;
- resident report starts pending;
- app builds and starts following README instructions.

Run the relevant tests before claiming success. Never claim tests pass unless you ran them and saw the result. If execution is not available, state “not run” and provide the exact command for the operator.

## 11. Security, privacy, licences and UTMKL context

- Never commit passwords, tokens, API keys, private personal data, raw private survey answers or identifying photos.
- Put secrets in local environment variables and include only a safe `.env.example`; ensure real `.env` files are ignored by Git.
- Use permitted campus photos, map data and map tiles; preserve attribution and comply with the source/provider licence and usage limits.
- Minimise/blur identifiable faces, vehicle plates and private details where feasible; collect only what is necessary.
- Do not add CCTV, face recognition, persistent GPS tracking or identity tracking to this prototype.
- Do not claim that UTM has approved this prototype, its construction suggestions, or any actual works unless written evidence is supplied. Demo approval actions are not real institutional approval.
- Check third-party model and package licences before shipping them.

## 12. Shared delivery checkpoints

Use these as operator checkpoints, adapted to the current date and actual progress:
1. **Foundation:** runnable shell, shared map plan, approved stack, initial API/data contracts.
2. **Independent module demos:** real AI inference, verified route graph/calculations, functioning optimiser, field-data/fixture provenance.
3. **Integration:** both roles on shared segment IDs, clickable evidence, API-connected routes and planning.
4. **Full demo:** Resident route comparison → segment/AI evidence → Developer priority → RM budget optimise → simulated scenario → installation/verification/publish lifecycle.
5. **Feature freeze:** stop adding nonessential features; fix blockers and prepare a recorded fallback.
6. **Submission readiness:** verify competition portal requirements, check AI-use disclosures, licences and every public/pitch claim.

The dates in earlier project notes are proposed team milestones, not guaranteed official deadlines. The operator must verify the active submission portal and requirements.

## 13. Definition of done

A module is not done because a coding agent says it is done. It is done only when:
- its agreed behaviour exists in the code;
- tests and start instructions are provided;
- inputs/outputs follow shared contracts;
- missing/fictional/simulated information is labelled;
- it does not break other modules;
- the operator can reproduce and review the result.

When finishing a task, report:
1. what changed and file paths;
2. commands and tests actually run with results;
3. how the operator can verify it;
4. known bugs/limitations;
5. the next dependency or recommended step.

If an instruction is ambiguous, first inspect the repository and existing docs, then ask a concise question rather than inventing requirements. Do not generate code for unrelated features or expand scope without the operator's approval.
