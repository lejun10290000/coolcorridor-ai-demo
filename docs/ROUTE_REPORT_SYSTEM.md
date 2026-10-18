# Route problem reports, acceptance and manual repairs

Branch `feature/route-report-review` starts from PR10 head `5d8cd5b1bb21100657fa4b0c5852ffa4111d2c77`. PR10 was checked open/unmerged before work. The accepted map/editor/routing features are preserved; no main commit, force push or automatic merge.

## Resident

Choose two map dots or endpoint lists around the affected section and a route option, then choose **Report selected route**. Alternatively **Report a route** in the inspector opens the same form with endpoint lists. Selecting the first map dot advances input to the destination.

The form shows the calculated path and exact included link IDs. Choose the problem category (for example **broken shade structure**) and describe the problem. The description is required. Disconnected/same/unknown endpoints cannot be submitted. Submission saves the endpoints, route objective, ordered link/node IDs, source dataset and problem text. It leaves published map colours unchanged and starts Pending review. These are local DEMO reports, separate from footfall or field shade measurements.

## Developer review

Use **Review Resident reports** near the page heading. All reports appear in the inbox; the evidence inspector can also filter to reports covering a selected link. **Show reported route on map** highlights exactly the path saved at submission, using current published shade. A later shortest/most-shaded calculation does not move the report. Draft/scenario overlays are excluded from this preview; close it to resume manual editing.

After reviewing the path and description, enter a reviewer label/note and choose **Accept report**. That explicit action atomically records review and a new map version, marking every saved path link yellow/mixed shade in both modes. Existing status verified is displayed as Accepted. A Resident tab already open at the same origin/profile automatically refreshes its route version, costs and map colours. Accepted/rejected reports are final; accepting twice is refused.

**Reject report** records the review note and leaves the map unchanged. Old single-link reports retain their original review controls and history, and cannot silently acquire an invented point-to-point path.

Acceptance preserves an existing manual Developer draft without publishing or clearing it. The draft is now tied to an older version, so the operator must review it against the latest map before continuing. The accepted path preview displays the published yellow state rather than hiding it under that draft.

## After a repair

Acceptance does not mean repaired and never automatically changes the path to green. Close the report preview, use **Edit map shade** to select the repaired links, apply the appropriate manual category to the Developer draft, review it and choose **Publish to Resident map**. The accepted report, review events and yellow snapshot remain intact alongside the later manual update. No automatic repair event or construction verification is invented.

All geometry, lengths/accessibility and shade classifications remain DEMO/unsurveyed. Storage and automatic updates are limited to the same browser origin/profile; other devices require a backend. Field observation/separate-reviewer and installation lifecycle controls remain separate.

## Actual validation

- `npm test`: **102 passed across10 files**, including7 new route-report tests. Covers frozen path/descriptions, connected-path and current-version validation, no-map-change submission/rejection, atomic accepted publication, repeated/final/legacy refusal, preserved unrelated evidence, stable report location after rerouting, stale draft preservation, later manual repair and strict reload rejection of forged route/audit records.
- `npm run build`: passed; existing cinematic chunk-size warning remains.
- `review/check-route-reports.cjs`: passed against the **normal production root** `http://127.0.0.1:4183/`, using fresh synthetic data. Real Resident map clicks selected Main Gate→reference junction03 (DEMO-REF-001→002). The route was green before submission, stayed green while pending, changed to yellow after Developer acceptance, and stayed yellow until a later explicit manual repair publication. Exposure-ranking cost changed0→18→0, with automatic updates in the already-open Resident tab. These are DEMO algorithm costs, not measured exposure. Rejection did not change the map. An unrelated draft survived acceptance. Accepted yellow snapshot/report history survived repair and reload. No page errors or mobile horizontal overflow; the mobile form is scrollable with a reachable submit button and restores background scrolling on close.
- `review/check-developer-map-shade.cjs`: passed again on the same normal entry. Existing multi-route selection/draft/three-category/publication flow, cross-tab recalculation, 25% detour, history and mobile behavior remained intact. Shortest34 DEMO metres and shaded38,11.8% detour, remained reproducible.
- `review/check-reference-alignment.cjs`: passed again. Shared map geometry, normal marker sizes, reference anchors after zoom/pan/resize, both modes, route highlighting, revised report submission/filtering/persistence, isolated no-route and scenario isolation remained intact.
- Primary screenshots/results: `outputs/route-report-system/`; regression evidence: `outputs/route-report-regression-alignment/` and `outputs/route-report-regression-shade/`. Primary desktop/mobile report, review and yellow-map screenshots were opened for visual QA.

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
