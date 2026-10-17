# Developer shade workflow handoff

## Scope and coordination

The complete operator-supplied `CoolCorridor_AI_Builder2_Developer_Shade_Update_Codex_Brief.md` was read. PR #4 was confirmed merged; PR #3 was confirmed open/unmerged. This work branches from `feature/phase0b-cinematic-landing` at `0b0889449d505d41ee4f1e296d49fd25b3f7d6b2` into `feature/developer-shade-update-workflow` and targets the application branch in a separate stacked PR.

Builder 1 (@npz5868b-afk) [agreed to the proposed scope in PR #3](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/3#issuecomment-6232744875) before shared edits. Independent modules/tests were prepared first. No PR is merged by this work, no main commit is made, and no shared branch is overwritten or force-pushed.

Preserved: supplied campus PNG, all pixel display points, shared map props, stable segment IDs, original fixtures/shared interfaces, deterministic planning algorithms, Home/Three.js source and dependency manifests. No online tiles, GPS, geolocation permission or external upload service were added.

## What changed

- `src/App.tsx`: one authoritative `useWorkflow` state shared across roles, current snapshot passed into Resident/map/evidence, preserved Resident report categories and route selection, actual Malaysia report creation time, Developer integration. Legacy route metrics are explicitly not recalculated from published shade.
- `src/CampusImageMap.tsx`: minimal provenance/disclaimer text; colour still derives from each provided segment record. Published manual/field evidence is no longer automatically called DEMO, while route geometry remains unverified.
- `src/workflow/model.ts`: typed observations, reviews, immutable snapshots, report/lifecycle events, validation and pure transitions; validated adapter around the existing optimiser; separate explicit scenario projections.
- `src/workflow/storage.ts` / `useWorkflow.ts`: schema-versioned guarded local persistence, one shared current dataset, storage-failure notice, stale-tab detection and in-session recovery.
- `SegmentEvidence.tsx`, `ReportReview.tsx`, `ObservationWorkflow.tsx`, `DeveloperWorkspace.tsx`, `workflow.css`: role-specific actions, segment-filtered report review, clear portfolio states, baseline/scenario comparison, observation/review/publish forms and history, scoped responsive styles.
- Model/storage and server-rendered UI contract tests; production browser acceptance runner, screenshots and results under `outputs/developer-shade-workflow/`. The older `review/check-campus-app.cjs` entry delegates to the updated workflow checks.
- README/data/API/map handoff notes updated to describe actual behaviour and limitations.

## Authoritative data and provenance

`WorkflowState.current_version` identifies the current immutable `DatasetSnapshot`. `currentSnapshot(state)` supplies its segments to both modes; `currentStudyArea(state)` supplies consistent current study-area metadata. Fixtures remain the original baseline and are never edited by publication. All segments in a new snapshot receive its dataset version; unrelated shade evidence and all route/map facts remain unchanged.

Raw `ShadeObservation` records retain their original shade label, source/method, observed time, entry type/status and observer. Separate review entries store reviewer, action/time, note and reviewed label, so a correction does not erase the raw interpretation. Source references are text only, validated against control characters/embedded-script/image/file schemes and never fetched or uploaded. No photos or private field evidence are committed.

DEMO entry → raw/published `demo_fixture`, even after verification. Genuine field entry requires source/method/time/notes, an observer alias and attestation that the linked segment was checked on site; its raw status is `sample_observed`, and the reviewed published assessment is `human_reviewed`. This is manual input/review, not independently authenticated field validation. No real field observation was supplied or collected by this implementation. All browser screenshots use explicit fictional DEMO inputs.

Unknown remains unknown/grey. A new observation requires an observation time, including when its classification is unknown; missing original timestamps remain null and display Unknown. All workflow timestamps use `+08:00`; impossible calendar dates and future observations (against client time) are rejected.

Lifecycle remains `proposed → approved_demo → under_construction → installed_pending_verification → verified → published`. Only the first three advances are status buttons; verification requires reviewed observations for **every** linked segment, and publication is a distinct action. Lifecycle events record from/to, actor, note, timestamp, evidence reference and dataset version. These actions never establish actual UTM construction approval or installation.

Publication uses the latest verified observation per linked segment, creates a new snapshot/version, marks those observations published, and records actor/time. Earlier raw/verified records remain inspectable history; only the selected records supply the snapshot. Completed interventions and final reviews are terminal in this prototype; reopening/correcting a published intervention needs a separately designed follow-up workflow. Repeated/multi-segment observations can be entered while installation is pending verification.

IDs use the monotonically increasing local action revision. Dataset versions append incremented padded suffixes, e.g. `demo-baseline-2026-10-17-v000001`, `…-v000002`; uniqueness is checked. These are local dataset IDs, not globally coordinated identifiers.

## Reports and optimisation

Resident reports still start submitted/pending and never change footfall. Developer evidence opens **View reports for this segment**, filtered by the live selected segment. No unrelated segment report is shown. Submitted → under review → verified requires distinct actions; rejection is allowed from submitted or under review. Reviewer notes/actions/times are retained. Final verified/rejected reports cannot be moved backwards.

Whole RM only (0 to 1,000,000,000; default RM20,000). Checked candidates are eligible, not automatically selected. The candidate list shows source/type of cost, linked segments, feasibility, constraints and explicitly illustrative benefit units. Actual chosen/excluded/not-selected states use both text and visual borders. **Optimise plan** invokes the existing exhaustive solver after validation. Costs cannot exceed budget; exclusions, shared conflicts and maximum-per-segment overlapping benefits are preserved. Other candidates are honestly labelled “not selected in this portfolio”, without an unsupported single-cause explanation.

Budget/eligibility edits invalidate the displayed plan and hide old map/scenario site highlights until recalculation. Zero/no-eligible plans have an explanatory empty result. Published/installed lifecycle does not automatically change candidate eligibility; the UI identifies this as operator-controlled. Costs/benefits remain DEMO planning assumptions.

## Scenario and history

Baseline can follow the current published dataset or explicitly select a historical snapshot. Simulated scenario takes a **copy** of that baseline and accepts an explicit label projection only for affected segments in the calculated portfolio. Default is no change/no defensible projection; selecting/installing an intervention never turns a path green automatically.

The comparison table shows baseline versus assumed label and linked candidate IDs. The map uses scenario colours only while Simulated scenario is active; projected records are SIMULATED and have no observed timestamp/source. The inspector continues to show the selected baseline evidence, labelled historical when applicable. Returning to baseline immediately restores that snapshot's labels/version, never mutating the actual current dataset. Publishing returns Developer to the new current baseline. JSON scenario output includes baseline version, candidate IDs, per-segment assumptions and warnings.

## Persistence and limits

Local storage key: `coolcorridor-shade-workflow-v1`; `schema_version: 1`. Snapshots, observations/reviews, report/review history, candidate lifecycle and lifecycle events persist. Draft form text, optimiser calculations and scenario assumptions are view-local and reset on leaving the Developer view; they never become observations.

Parsing checks more than JSON shape: IDs, fixture compatibility, snapshot chains, valid transitions, per-snapshot segment versions, DEMO/field status consistency and published source links. Corrupt/incompatible storage recovers the original DEMO baseline with a visible warning; a later successful action replaces invalid saved data. Full/blocked storage retains successive actions in memory with a visible “in-session only” warning instead of silently reverting to older saved data. Existing valid saved publications are not silently reset on role switches.

Other-tab updates refresh the state with a notice and stale actions are refused when detected. Browser storage has no server transaction/lock, central sync, access control or tamper-proof audit guarantees; avoid simultaneous editing across tabs. User aliases are demo labels, not authenticated identities. Storage can be cleared by the browser. A production backend, secure evidence management and multi-user conflict resolution remain future work.

## Run and validation

Node.js 20+, unchanged lockfile/dependencies:

```sh
npm ci
npm run dev
npm run build
npm test
```

Actual results: production build passed (existing >500-kB cinematic chunk warning remains); **46 Vitest tests passed**, including the 12 existing tests and 34 workflow/model/storage/UI tests. No new testing/app dependencies were added. The new pure tests include sequential transitions, rejection/direct-publication guards, DEMO preservation, genuine-input attestation and separate human correction, repeated version creation, unknown preservation, immutable history, finite budget/exclusions/constraints, scenario copies and corrupt persistence.

Browser setup uses separately supplied Playwright/Chromium:

```sh
npx vite preview --host 127.0.0.1 --port 4180 --strictPort
# Separate terminal:
node review/check-developer-workflow.cjs
```

Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` if needed; `WORKFLOW_APP_URL` defaults to `http://127.0.0.1:4180`. Compatibility entry `node review/check-campus-app.cjs` defaults to port 4174, or `CAMPUS_APP_URL`; it delegates to the new workflow runner. The standalone image-component harness remains available separately.

Integrated production browser acceptance passed: report filtering/review, current plan versus eligibility, stale plan/invalid budget/zero/exclusions, explicit simulation without state mutation, sequential installation, submission/verification leaving shade unchanged, publication reflected in both roles, immutable old baseline, refresh persistence, field-attestation guard, unknown grey, desktop/mobile image/SVG alignment and no overflow, corrupt storage recovery, and successive session-only actions under simulated storage quota failure. No external requests or page exceptions in the observed run. See [recorded results](../outputs/developer-shade-workflow/browser-results.json). Screenshots were opened for visual QA.

## Operator acceptance path

1. Open Resident and inspect DEMO-S01. Submit a DEMO report; return Home → Developer. The same current version/label appears.
2. Choose View reports for this segment. Start review with a reviewer note, then verify. Choose another segment and confirm its report list is empty/matching.
3. Optimise at RM20,000, RM10,000 and zero. Edit inputs after calculation and confirm the stale warning and hidden old site marks. Whole-RM/invalid values must not break the app.
4. For an exposed-path scenario demonstration, restore RM20,000 and uncheck INT-03; optimise. With the supplied fixture portfolio INT-01 is selected. Open Simulated scenario; DEMO-S01 stays red until an explicit hypothetical label is chosen. Choose Mostly shaded, observe the hypothetical green overlay/table, then return to baseline red.
5. Manage INT-01, enter demo actor/note and advance the three sequential status steps to installed_pending_verification. This records a prototype state, not real construction.
6. Record an explicitly **DEMO exercise** observation for DEMO-S01. Enter a past Malaysia time, method/source, observer alias and uncertainty. Current shade remains unchanged.
7. Start observation review with a note, then verify. Publish stays blocked before verification. Verification alone still leaves current shade unchanged.
8. Publish with actor/note. Confirm new version/label/time/source in Developer; inspect the original snapshot using Baseline dataset history without changing current data.
9. Return Home → Resident and select DEMO-S01. Confirm the same published version/label and DEMO status. Expand evidence history; refresh and confirm saved local state persists.
10. Repeat on presentation hardware and mobile, inspect all screenshots, and verify field-data accuracy/rights separately before using real evidence or deployment. No location permission or online map tiles should be requested.

Operator acceptance and merge approval remain outstanding. Map geometry, navigation, accurate routing/exposure metrics, real field data, AI inference, reuse permission and production deployment remain outside this task.
