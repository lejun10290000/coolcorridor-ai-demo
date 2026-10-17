# Routing v4 independent progress and remaining integration

The complete operator-supplied v4 brief has been read. Work continues on `feature/dynamic-route-recalculation` / draft PR #6, stacked onto `feature/developer-shade-update-workflow` at `ed9ae4ddc72dc44a8c450077d3f9d7271b2b3438`. The inspected routing head before this update was `bb0e06c4bb98e81db9b6b7640f4b178fa7be8b4e`; a fetch confirmed that local HEAD matched the remote. PR #3, #5 and #6 were open/unmerged. No other builder's work was reset or overwritten.

**Production integration remains incomplete.** [Builder 1's v4 scope request](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/6#issuecomment-6233820074) is pending. The operator subsequently confirmed that independent work should continue while shared App/map/documentation files remain untouched. This update does not edit `App.tsx`, `CampusImageMap.tsx`, `MapPanel.tsx`, their shared CSS, README, API contracts or data dictionary. Existing ordinary Resident/Developer functionality remains on the parent implementation. No merge, main commit, force push, dependency, GPS, online map tile or backend was added.

This document records the current v4 policy. The earlier `DYNAMIC_ROUTING_HANDOFF.md` describes the historical v3 preview; its unrestricted exposure search and “no detour cap” statements are superseded by the independent v4 module, but its pending-integration status still applies.

## Completed independently

- `src/routing/compare.ts`: Shortest minimises distance with stable segment-ID ties; shade cannot influence selection, including equal-distance ties. Practical minimises ranking cost among **all loop-free paths within shortest × 1.25**, then distance, then stable IDs. It does not merely discard the unrestricted optimum. If no permitted path improves the shortest score, it returns the shortest path and a clear reason. `distance_limit_m` and `exposure_improves_on_shortest` are explicit result fields.
- Cap check: inclusive limit, tolerance `1e-9 × max(1, limit_m)` metres. Exactly 25% is permitted. The small graph uses simple-path enumeration with loop prevention and distance pruning. Dense-graph worst-case path count is factorial; recursion depth is O(V). Replace it with constrained multi-label search before adopting a large surveyed network.
- `RouteCards.tsx`: exactly two objective cards, **Shortest route** and **Most shaded practical route**; estimated time, distance, detour/cap, score, known/unknown coverage, segment sequence and version. Identical routes keep both cards and the exact agreed explanation. No better permitted alternative has an explicit fallback explanation. Detailed weights/provenance are expandable.
- `CalculatedResident.tsx`: selected-route text/status lists ordered calculated IDs and current version. Automatic snapshot-driven computation, reports and shared workflow contract are retained. This component remains in the separate preview until approved App integration.
- `SelectedRouteOverlay.tsx`: isolated prepared component. It paints a white 11px halo, purple 8px casing and original shade-colour 3px centre, with non-scaling SVG strokes. It takes only the selected calculated IDs, retains grey unknown centres and passes pointer events to existing map inspection handlers. It is designed to mount **after the entire shade layer**. It is not yet wired into the shared renderer.
- `review/map-highlighting.pending.patch`: checked zero-context patch to import/mount that overlay after base shade strokes and remove the older underlying route outline. Existing App integration patch remains prepared. Neither patch has been applied.
- Isolated `review/route-overlay.html` specimen demonstrates the component on the supplied PNG, using an explicitly fictional S03-exposed snapshot. It is not a publication or normal application entry. Existing graph metre fixtures and image display geometry remain unchanged; pixels never become routing lengths.

Unknown remains grey/unknown and has weight1, with unknown length/coverage/penalty separate from known-label cost and field-observed/reviewed provenance. DEMO stays DEMO. Separate-reviewer and future-date domain/UI validation remain intact. Persistence is local to one browser origin/profile and does not synchronise across devices, profiles or people. Different aliases do not authenticate different people.

## Actual checks in this update

- `npm test`: **79 passed across seven files**. New coverage includes shade-independent shortest ties, 26% exclusion, inclusive25% plus tolerance, crucial within-cap alternative despite an out-of-cap global optimum, no worse-score improvement claim, stable practical ties, fallback wording and overlay centre/casing contracts.
- `npm run build`: passed. The normal entry still uses legacy Resident cards; build success is not production routing acceptance. Existing cinematic chunk-size warning remains.
- `npx vite build --config review/vite.dynamic-routing.config.ts`: passed. It builds the independent workflow preview and separate overlay specimen into ignored `work/dynamic-routing-review`.
- `review/check-dynamic-routing.cjs` against the **explicit preview URL**: passed. Same-origin second-tab DEMO publication automatically recalculates mounted Resident without reload; shortestS03/190m, practicalS01+S02/198m, rankingcost145, detour4.2% within25%, card/highlight IDs/status/version agree. Scenario-only changes stay isolated. Year3333 inline error retains values/focus; separate field-reviewer rule works on synthetic test inputs. Desktop/mobile, refresh and zero external requests/page errors pass. The map in this workflow preview is still the existing renderer; this run does not establish the new casing integration.
- `review/check-developer-workflow.cjs` against the same preview: passed. Report review, budgets/exclusions, scenario, lifecycle, immutable publication/history, unknown grey, map alignment, corrupt/quota storage recovery and zero external requests/page errors pass.
- `review/check-route-overlay.cjs`: passed against the **isolated overlay specimen**. Selected IDs match computed objective, white/purple/shade layering and screen-space widths are present, final active overlay follows all shade paths, desktop/mobile no overflow. Screenshots were visually inspected. This does not establish integration, zoom/pan or inspection behavior in the shared renderer.
- Pending map/App patches pass `git apply --unidiff-zero --check`. Shared files remain unchanged. Normal-entry calculated-routing acceptance has **not** been run because integration is not approved/applied.

Results/screenshots: `outputs/routing-integration-v4/`, with `workflow-regression/` and `overlay-specimen/` subfolders. All entered data are synthetic browser tests; no genuine UTM field survey, navigation verification, cooling outcome or real installation/approval is claimed.

## Reproduce the independent checks

```powershell
npm test
npm run build
npx vite build --config review/vite.dynamic-routing.config.ts
npx vite preview --config review/vite.dynamic-routing.config.ts
```

In another terminal (Playwright/Chrome supplied separately, unchanged app dependencies):

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:ROUTING_ENTRY_URL='http://127.0.0.1:4181/review/dynamic-routing.html'
node review/check-dynamic-routing.cjs
node review/check-route-overlay.cjs
$env:WORKFLOW_APP_URL='http://127.0.0.1:4181'
$env:WORKFLOW_ENTRY_URL='http://127.0.0.1:4181/review/dynamic-routing.html'
$env:WORKFLOW_OUTPUT_DIR='outputs/routing-integration-v4/workflow-regression'
node review/check-developer-workflow.cjs
```

## Required after approval

1. Read Builder 1's recorded agreement/conditions on PR #6. Recheck parent/routing heads and current shared files for overlapping edits.
2. Review/apply the prepared App and map patches only within agreed scope. Update shared README/contracts/dictionary consistently. Preserve Home, Developer, map props/pixel asset, authoritative state and reports.
3. Test the **normal** Vite app entry. The dynamic runner now defaults to root `/`; remove the preview URL environment override. Point both runners to the ordinary built application's origin and root URL. Test both same-tab role switching and mounted second-tab publication, card/overlay/status/version coherence, scenario/history isolation, zoom/pan/reset/resize and inspection.
4. Capture screenshots/results from that normal entry, update PR #6 and only then describe production routing as integrated or ready for review. Operator controls merge.

The Word copy of the complete v4 brief is delivered separately; its wording was checked against the Markdown and all seven rendered pages were visually reviewed. That document is a copy of the requirements, not a claim that pending integration is finished.
