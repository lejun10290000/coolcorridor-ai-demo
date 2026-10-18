# Route problem reports, acceptance and manual repairs

Branch `feature/route-report-review` starts from PR10 head `5d8cd5b1bb21100657fa4b0c5852ffa4111d2c77`. PR10 was checked open/unmerged before work. The accepted map/editor/routing features are preserved; no main commit, force push or automatic merge.

## Resident

Choose two map dots around the affected section, then choose **Report selected route**. Alternatively **Report a route** in the inspector opens the same form. **Choose report points on map** resets report selection to From; the first click saves the start and advances to To, and the second saves the destination. Selecting a new map start clears the old report destination so an earlier endpoint cannot leak into a fresh pair.

The form automatically fills read-only start/destination names from manual map clicks. Main routing dropdowns and route cards have independent state and never fill or overwrite report points. The form has no route-option selector or editable endpoint lists. Without two distinct connected map-clicked points, submission is disabled; the form offers a return-to-map selection action.

Existing shortest corridor links connect the manual points without inventing a straight line; this is independent of the active most-shaded/shortest journey card above. The report shows the exact included links. Choose the problem category (for example **broken shade structure**) and describe the problem. The description is required. Submission saves the endpoints, ordered link/node IDs, source dataset, `selection_source: map_points` and problem text. It leaves colours unchanged and starts Pending review. These are local DEMO reports, separate from footfall or field shade measurements. Older reports with a saved routing objective remain readable and reviewable.

Resident maps show no report-number circles or report-count legend/inspector summary. Developer maps count only submitted/under-review reports on each covered link. Acceptance/rejection automatically removes that report from map counts; another pending report on the same link keeps its badge. Final reports and accepted-shade provenance remain in history, and accepted links remain yellow until a later manual shade update.

## Developer review

Use **Review Resident reports** near the page heading. All reports appear in the inbox; the evidence inspector can also filter to reports covering a selected link. **Show reported route on map** highlights exactly the path saved at submission, using current published shade. A later shortest/most-shaded calculation does not move the report. Draft/scenario overlays are excluded from this preview; close it to resume manual editing.

After reviewing the path and description, enter a reviewer label/note and choose **Accept report**. That explicit action atomically records review and a new map version, marking every saved path link yellow/mixed shade in both modes. Existing status verified is displayed as Accepted. A Resident tab already open at the same origin/profile automatically refreshes its route version, costs and map colours. Accepted/rejected reports are final; accepting twice is refused.

**Reject report** records the review note and leaves the map unchanged. Old single-link reports retain their original review controls and history, and cannot silently acquire an invented point-to-point path.

Acceptance preserves an existing manual Developer draft without publishing or clearing it. The draft is now tied to an older version, so the operator must review it against the latest map before continuing. The accepted path preview displays the published yellow state rather than hiding it under that draft.

## After a repair

Acceptance does not mean repaired and never automatically changes the path to green. Close the report preview, use **Edit map shade** to select the repaired links, apply the appropriate manual category to the Developer draft, review it and choose **Publish to Resident map**. The accepted report, review events and yellow snapshot remain intact alongside the later manual update. No automatic repair event or construction verification is invented.

All geometry, lengths/accessibility and shade classifications remain DEMO/unsurveyed. Storage and automatic updates are limited to the same browser origin/profile; other devices require a backend. Field observation/separate-reviewer and installation lifecycle controls remain separate.

## Actual validation

- Latest `npm test`: **104 passed across10 files**, including9 route-report tests. Adds independent manual map-point capture, empty/partial/disconnected handling, compatibility and persistence of map-point provenance; earlier frozen-path, acceptance, history, repair and tamper checks also pass.
- `npm run build`: passed; existing cinematic chunk-size warning remains.
- `review/check-route-reports.cjs`: passed against the **normal production root** `http://127.0.0.1:4183/`, using fresh synthetic data. Real Resident map clicks selected Main Gate→reference junction03 (DEMO-REF-001→002). The route was green before submission, stayed green while pending, changed to yellow after Developer acceptance, and stayed yellow until a later explicit manual repair publication. Exposure-ranking cost changed0→18→0, with automatic updates in the already-open Resident tab. These are DEMO algorithm costs, not measured exposure. Rejection did not change the map. An unrelated draft survived acceptance. Accepted yellow snapshot/report history survived repair and reload. No page errors or mobile horizontal overflow; the mobile form is scrollable with a reachable submit button and restores background scrolling on close.
- `review/check-developer-map-shade.cjs`: passed again on the same normal entry. Existing multi-route selection/draft/three-category/publication flow, cross-tab recalculation, 25% detour, history and mobile behavior remained intact. Shortest34 DEMO metres and shaded38,11.8% detour, remained reproducible.
- `review/check-reference-alignment.cjs`: passed again. Shared map geometry, normal marker sizes, reference anchors after zoom/pan/resize, both modes, route highlighting, revised report submission/filtering/persistence, isolated no-route and scenario isolation remained intact.
- Latest manual-point/badge screenshots and results: `outputs/manual-report-map-selection/`; alignment regression: `outputs/manual-report-alignment/`. Browser checks cover dropdown-only reports blocked, independent autofill despite later routing/card changes, read-only fields with no report route selector, Resident counts always absent, overlapping Developer counts2→1→0 on acceptance/rejection and cleared after reload, plus the previous yellow/publication/manual-repair flow. Older evidence remains in the preceding output folders.

Reproduce with the production build served by the existing Vite preview on4183:

```powershell
npm test
npm run build
$env:PLAYWRIGHT_MODULE='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
node review/check-route-reports.cjs
$env:ALIGNMENT_OUTPUT_DIR='outputs/route-report-regression-alignment'
node review/check-reference-alignment.cjs
$env:MAP_SHADE_OUTPUT_DIR='outputs/route-report-regression-shade'
node review/check-developer-map-shade.cjs
```

For normal use run `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`, refresh that URL and enter either mode. Valid existing local state is preserved; no storage clearing is needed. No app dependency or remote API was added.

To save a new run separately from historical evidence, set `ROUTE_REPORT_OUTPUT_DIR=outputs/manual-report-map-selection` and `ALIGNMENT_OUTPUT_DIR=outputs/manual-report-alignment` before running the corresponding browser scripts.
