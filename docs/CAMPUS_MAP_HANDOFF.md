# Campus image map — independent component, pending integration

## Current delivery status

PR #3 was checked on 17 October 2026: open, unmerged, application branch `feature/phase0b-cinematic-landing` at `2eb5a9b7b293ff371d30ceeb80054666d2ec767f`. `feature/campus-image-map` starts from that application head, not the documentation-only `main`.

The complete supplied Markdown brief was read. This change prepares and tests **independent files only**. The operator explicitly instructed us to wait for Builder 1's approval in PR #3 before modifying shared files. [Coordination request](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/3#issuecomment-6232029276).

**The application still uses the original `src/MapPanel.tsx` and OSM tiles. This draft does not yet replace the operational Resident/Developer map.** It is not integration-complete and must not be merged as a finished map replacement. No shared files, existing fixtures, dependency manifests, landing scene or planning logic have been modified.

## Added files

- `public/maps/utmkul-campus-map.png`: exact supplied PNG, 1290 × 1640 pixels. SHA-256 `826872744A8F2CDDCCBA84D7C380E2288F0D52199235A9E928E46659F6EA4247`.
- `src/CampusImageMap.tsx`: reusable image + SVG component, compatible with existing `MapPanel` props. Optional `reports` prop supports segment-linked DEMO report badges.
- `src/campusMapDisplay.ts`: `MapDisplayPoint { x: number; y: number }`, `SegmentDisplayGeometry` and a separate sidecar keyed by `DEMO-S01`–`DEMO-S04`. Contains source, `demo_fixture` status and image-space `map_display_geometry`.
- `src/campus-map.css`: scoped map styles; shared image/SVG scene and zoom/pan transform, text legend, controls, loading/error states.
- `src/campusMapDisplay.test.ts`: display-coordinate contract tests.
- `review/`: standalone review entry, separate Vite build config, styles and optional Playwright acceptance runner. This is a component test harness, not a second application or routing service.
- `outputs/campus-map/`: review screenshots and browser check results.

## Coordinate and evidence contract

`map_display_geometry` uses intrinsic PNG pixels: x increases right, y increases down; the SVG `viewBox` is `0 0 1290 1640`. The image and SVG have identical bounds and share one transform. No geographic projection or image-to-world calibration is known. Display points are not GeoJSON or WGS84.

The original shared `WalkwaySegment.geometry` values remain untouched pending coordination. They are schematic fixtures and are **never read by the new map renderer**. A GIS builder can later supply sourced `[longitude, latitude]` geometry independently; no pixel coordinates should enter that field.

Route A uses `DEMO-S01` + `DEMO-S02`; route B uses `DEMO-S03`. Both share A/Main Gate and B/Klinik endpoints and are visually traced illustration fixtures. `DEMO-S04` is a grey unknown connector towards the rear entrance. Dashed display paths indicate uncertain, unsurveyed connections, including road crossings and the clinic approach. The illustration does not establish public pedestrian access or a safe crossing.

Shade strokes use each supplied segment record: exposed red, mixed amber, shaded green, unknown grey. The selected route has a purple outline, leaving the shade stroke visible; the selected segment has a dotted black outline. Text legends and accessible segment names accompany colours. Selection is controlled through `selected` / `onSelect`; Enter, Space, pointer release and assistive click activation are supported. Dragging when zoomed does not select a route segment.

Candidate markers are anchored halfway along their linked display polyline. They are labelled DEMO candidates or SIMULATED sites, never surveyed installation locations. Report badges use segment IDs, with review status retained in the parent evidence panel. Empty interventions and missing display geometry have explicit messages. This component does not invent footfall, priority marks or AI results.

## Image provenance and rights

The image was supplied by the operator, cropped from a lecturer-provided UTM KL campus-map PDF. The original creator and reuse licence are unconfirmed. Reuse permission must be confirmed before public deployment. The full PDF is not included. The new component contains no online tile source or OSM attribution and makes no external requests in the review checks.

Demo shade labels are not measurements derived from the printed artwork. No georeferencing, verified navigation, real accessible route, observed shade timestamp, cooling outcome or institutional approval is claimed. The review harness deliberately omits the old route distance/time fixtures; it performs no route calculation or pixel-to-metres conversion. Existing main-app fixture metrics, including the inconsistent shortest/alternative distances, still need honest labelling at integration.

## Reproduce the review

Node.js 20+ and the unchanged locked dependencies:

```sh
npm ci
npm run build
npm test
npx vite build --config review/campus-map.vite.config.ts
npx vite preview --config review/campus-map.vite.config.ts --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/review/campus-map.html`. This explicitly labelled review page is separate from `/`, which remains the original app. Alternatively, run `npm run dev` and open `/review/campus-map.html` on the printed development URL.

Use both route buttons and the four SVG segment controls, select a segment in the external selector, zoom from 100% to 300%, drag or use arrow keys, and reset with Home/Full map/Recenter. Switch to Developer review, vary the budget, toggle simulated sites and add a pending demo report. Baseline shade colours must stay unchanged. At mobile width use zoom to read the original map labels.

The optional browser runner requires Playwright and a Chromium installation, supplied separately from the app dependencies:

```sh
node review/check-campus-map.cjs
```

If they are not installed in the default locations, set `PLAYWRIGHT_MODULE` to the Playwright module path and `CHROME_PATH` to the Chrome executable. Optional `MAP_REVIEW_URL` defaults to `http://127.0.0.1:4173`. The runner uses only the local review server and writes screenshots/results under `outputs/campus-map/`.

## Checks actually run

- `npm ci --fetch-timeout=30000 --fetch-retries=1`: installed the unchanged lockfile. Reported 6 existing audit findings (3 moderate, 1 high, 2 critical); no dependency changes or blanket fixes.
- `npm run build`: passed. The existing cinematic chunk still produces Vite's over-500-kB warning.
- `npm test`: 11 passed (6 existing domain tests + 5 new coordinate contract tests).
- `npx vite build --config review/campus-map.vite.config.ts`: passed; the supplied PNG is copied into the separate production review output.
- `node review/check-campus-map.cjs` using bundled Playwright and installed Chrome: passed against the separate production review build. Tests route-highlight IDs, exact inspector ID after keyboard/mouse/touch selection, external selection, grey unknown status, 1440px/390px alignment, zoom/pan/reset, RM20,000/RM10,000/zero-budget marker updates, scenario preservation of baseline shade, segment-linked reports and failed-image retry. No external requests or page exceptions were observed in that review run. See `outputs/campus-map/browser-results.json`.
- Desktop/mobile screenshots were opened and visually inspected. These show the **standalone review component**, not a completed main-app replacement.

## Integration after Builder 1 approval — not applied

1. Recheck PR #3, the application branch head and ownership of any in-flight shared-file edits. Preserve them; do not force-push or reset anyone's work.
2. Update `src/MapPanel.tsx` to use/re-export `CampusImageMap` while preserving its public props. Both application modes then use the same new renderer. Remove the active `TileLayer` and all tile URLs as part of that switch.
3. Update only map-related copy/calls in `src/App.tsx`: supplied campus illustration, demo comparison labels, real layer/empty-state descriptions, and optional reports prop. Preserve report/budget/lifecycle flows. Route cards must continue to use the same stable segment IDs; explain that old metrics are illustrative and not calculated.
4. Agree how to mark old geographic fixture geometry unavailable (for example nullable geographic geometry) and update shared metadata in `src/fixtures.ts` / `src/types.ts` together if needed. Keep pixel data in its distinct sidecar. No new dependency is required.
5. Update README, data dictionary and API contract notes to identify the active image source, separate display geometry and unconfirmed rights. Remove the unused Leaflet CSS import with approval; dependency cleanup can be separate.
6. Run build/tests and full Resident/Developer/Home smoke checks, verify no external tile requests from either mode, capture **integrated** screenshots, and update the PR's completion status.

Builder 1's recorded approval is the remaining prerequisite for these shared edits. Only the operator can approve a merge; neither PR #3 nor this map PR has been merged by this work.
