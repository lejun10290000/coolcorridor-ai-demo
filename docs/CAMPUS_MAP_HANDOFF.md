# Campus image map — integrated handoff

## Delivery and coordination

PR #3 was checked before edits: open and unmerged, application branch `feature/phase0b-cinematic-landing` at `2eb5a9b7b293ff371d30ceeb80054666d2ec767f`. The separate `feature/campus-image-map` branch starts from that head and targets that application branch as a stacked PR. No merge or main commit was performed.

The complete supplied Markdown brief was read. While shared-file approval was pending, only independent component/test files were prepared. [Builder 1 (@npz5868b-afk) approved the integration in PR #3](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/3#issuecomment-6232136850) before shared files were changed. Existing shared interfaces, stable IDs, Resident/Developer workflows, Home/Three.js source and planning algorithms are preserved. Existing dependency manifests are unchanged.

Both operational modes now use the bundled PNG and the same image/SVG component through the `src/MapPanel.tsx` adapter. The active TileLayer, online tile URL, OSM attribution and Leaflet CSS import were removed. Unused Leaflet packages remain in the lockfile for separately coordinated cleanup.

## Files and display contract

- `public/maps/utmkul-campus-map.png`: exact supplied PNG, 1290 × 1640 pixels. SHA-256 `826872744A8F2CDDCCBA84D7C380E2288F0D52199235A9E928E46659F6EA4247`.
- `src/CampusImageMap.tsx` and `src/campus-map.css`: reusable image + SVG renderer, scoped styles, shared zoom/pan scene, keyboard/touch controls, loading/error/retry states, shade and selection strokes, endpoints, candidate sites and report badges.
- `src/campusMapDisplay.ts`: `MapDisplayPoint { x: number; y: number }` and `SegmentDisplayGeometry { segment_id, map_display_geometry, data_status, source }`. A separate display sidecar is keyed by existing `DEMO-S01`–`DEMO-S04` IDs.
- `src/MapPanel.tsx`: preserves the existing component prop contract by re-exporting the new renderer. Optional `reports` adds segment-linked DEMO report counts.
- `src/App.tsx`, `src/fixtures.ts`, `src/main.tsx`: map integration/copy, image source metadata, explicit unavailable geographic geometry, and unused CSS import removal. Report, optimisation, lifecycle and landing algorithms were not rewritten.
- README, data dictionary and API notes: active source, pixel/geographic separation, fixture limitations and rights.
- `src/campusMapDisplay.test.ts`, `review/`: coordinate contract tests, optional separate review entry and browser runners. The review page is a test harness, not a second application.
- `outputs/campus-map/integrated/`: full application Resident/Developer desktop/mobile screenshots and browser results. Parent-directory screenshots/results exercise the standalone component harness.

Image x increases right and y increases down. The SVG viewBox is `0 0 1290 1640`; the image and SVG occupy identical bounds and share one pan/zoom transform. No geographic projection or image-to-world calibration is known. Display points are not GeoJSON or WGS84 and no pixel-to-metres conversion is performed.

The old geographic coordinates were explicitly schematic, not sourced campus geometry. They were replaced by empty arrays (`[]`, meaning unavailable), preserving the existing `WalkwaySegment.geometry: Position[]` interface. No pixel point enters that field. A GIS builder can later add sourced `[longitude, latitude]` values independently. Existing shade/length/footfall/cost fixtures and planning logic remain intact.

## Route and evidence behaviour

Route A uses `DEMO-S01` + `DEMO-S02`; route B uses `DEMO-S03`. Both share A/Main Gate and B/Klinik endpoints. `DEMO-S04` is a grey unknown connector towards the rear entrance. The paths are visually traced illustration fixtures. Dashed paths disclose uncertain, unsurveyed connections, road crossings and clinic access. The illustration does not establish pedestrian access or a safe crossing.

The selected route has a purple outline while shade strokes remain visible: exposed red, mixed amber, shaded green, unknown grey. The selected segment has a dotted black outline. Accessible segment names and text legends accompany colours. External priority selection and map selection share the same `selected` / `onSelect` state and evidence inspector. Enter/Space, pointer release and assistive click activation are supported; pointer tracking avoids SVG focus changes losing the selected segment. Dragging when zoomed suppresses segment selection.

Candidate markers use the midpoint along their linked display polyline. They are labelled DEMO candidates or SIMULATED sites, never surveyed installation locations. Scenario display does not mutate baseline shade. Report counts remain linked by segment ID and separate from footfall. Empty candidate portfolios and missing display geometry have explicit messages. No invented footfall or priority marks are drawn.

## Source, truthfulness and limitations

The image is an operator-supplied crop from a lecturer-provided UTM KL campus-map PDF. Original creator and reuse licence are unconfirmed. Obtain permission before public deployment; no licence or OSM authorship is invented. The full PDF is not included.

All route and shade overlays remain DEMO / ILLUSTRATIVE. Green source artwork is not used to infer shade. Unknown shade remains grey, and the inspector shows no actual shade timestamp where none exists. No georeferencing, verified navigation, accessible route, cooling, AI inference or campus approval is claimed.

Existing route distances/times are retained as labelled legacy DEMO fixtures, not calculated values. A visible comparison warning explains that the 198 m “Shortest” fixture exceeds the 190 m alternative and does not establish shortest-path validity. The map workstream does not implement a new routing algorithm or alter planning metrics to disguise that limitation.

Original labels are small at full-map scale, especially on mobile; use zoom to read them. Field checks and proper route/shade evidence are still required. Lifecycle/report review remain prototype operations. The later Developer shade workflow replaces the Developer inspector's old inert report button with segment-filtered report review; Resident submission remains in Resident mode. See DEVELOPER_SHADE_WORKFLOW.md.

## Reproduce

Node.js 20+:

```sh
npm ci
npm run dev
```

Open the printed URL, enter Resident, select both routes and segments, submit a demo report, then return Home and enter Developer. Inspect priority selection, change RM20,000 to RM10,000/zero, optimise, toggle baseline/scenario, and review the report. Use +/−, Full map, Recenter, drag/arrow keys when zoomed, and Home while the map viewport has focus.

```sh
npm run build
npm test
npx vite preview --host 127.0.0.1 --port 4174 --strictPort
```

Optional Playwright runner against this production app:

```sh
node review/check-campus-app.cjs
```

The runner needs Playwright and Chromium supplied separately from app dependencies. Set `PLAYWRIGHT_MODULE` to the Playwright module path and `CHROME_PATH` to Chrome when needed. `CAMPUS_APP_URL` defaults to `http://127.0.0.1:4174`. Results are written to `outputs/campus-map/integrated/`.

The separate component harness is available under `/review/campus-map.html` with the dev server, or build it with `npx vite build --config review/campus-map.vite.config.ts`, serve using `npx vite preview --config review/campus-map.vite.config.ts --host 127.0.0.1 --port 4173 --strictPort`, then run `node review/check-campus-map.cjs`. `MAP_REVIEW_URL` defaults to `http://127.0.0.1:4173`. Production `/` always opens the actual application.

## Original map-integration validation (PR #4)

- `npm ci --fetch-timeout=30000 --fetch-retries=1`: installed the unchanged lockfile. It reported 6 existing audit findings (3 moderate, 1 high, 2 critical). No dependency upgrade or blanket audit fix was made.
- `npm run build`: passed; existing cinematic bundle still emits Vite's over-500-kB warning.
- `npm test`: 12 passed (6 existing domain tests + 6 display-coordinate/hit-testing contract tests).
- Separate component production build: passed; local PNG is copied into the output.
- Integrated browser run: passed against the production application. Checked both Home portals/fallback, route-card and highlight IDs, all segment selections and exact inspector IDs, pointer selection, unknown shade/timestamp, pending Resident report appearing in Developer, 1440px/390px image/SVG alignment and no overflow, zoom/pan/recenter, priority selection, RM budget recomputation, empty plan, scenario preserving shade, report review, existing lifecycle to published demo data, and failed-image retry. No external requests or page exceptions in the observed run. See `outputs/campus-map/integrated/browser-results.json`.
- Component browser runner checks mouse/keyboard/mobile touch selection, zoom limits/pan/reset, report/candidate binding, image error/retry, alignment and absence of external requests. See `outputs/campus-map/browser-results.json`.
- Screenshots were opened for visual inspection. These are prototype review evidence, not field validation or a presentation-laptop performance benchmark.

Operator review and merge approval remain outstanding. The PR is not merged automatically.

## Subsequent Developer workflow integration

The static PNG, pixel geometry, map prop contract, shade colours and navigation caveats are preserved. Per-segment accessible provenance labels now distinguish DEMO, UNKNOWN, manually OBSERVED, HUMAN REVIEWED and SIMULATED records. The map disclaimer no longer falsely calls a published manual field record a fictional shade fixture. Projected scenario colours receive copied records only; publication updates the authoritative dataset shared by both modes. See [Developer workflow handoff](DEVELOPER_SHADE_WORKFLOW.md) for the current tests, screenshots and persistence limits. Original map-test screenshots above remain historical evidence of the PR #4 delivery.
