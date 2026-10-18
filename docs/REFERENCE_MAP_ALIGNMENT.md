# Alignment to the supplied annotated map

This correction traces the JPEG supplied by the operator on 18 October 2026, rather than the previous PDF crop. The earlier points were not traced to its circles. Both Resident and Developer use the same reference coordinate frame, visible points and corridor geometry through the shared CampusImageMap component. A later operator request removed the printed example route from the displayed background; the original source is preserved.

## Source and anchors

- Preserved original: `public/maps/utmkul-reference-2026-10-18.jpeg`,1113×1414 pixels. Its bytes are unchanged.
- Original SHA256: `88fb162710ce201571c382124a61d5f02031b1d636772689398498a87e7f38f6`.
- Current displayed asset: `public/maps/utmkul-reference-no-example-route.png`,1113×1413 pixels; SHA256 `4af68c229360add5614cd85a8b7afa016cebba617219d6f31b20f771f36aea60`. This built-in image edit removes the printed dashed route. It is fitted to the original1113×1414 coordinate frame. See MAP_BACKGROUND_EDIT.md for the full prompt and generative-edit limits.
- Source anchors read in the image: Main Gate(216,922),Klinik(747,317),rear gate(977,456),Residensi access(939,731),north-east circle(875,100),south parking circle(623,1164).
- Sixty visible reference circles are selectable. Seventeen internal corridor junctions support connectivity without adding visible dots at arbitrary bends. Access labels describe nearby landmarks, not surveyed building entrances.
- Ninety-two illustrative corridor links are re-traced. No white/grey line is treated as proof of pedestrian permission or accessibility. PA9's isolated western spur has no documented connection; it can return unavailable instead of creating a shortcut.

The SVG viewBox and displayed image frame use identical1113×1414 dimensions. The edited bitmap is normalized by one pixel in height to that retained frame. The scene's aspect ratio and contained width derive from shared metadata, including at mobile sizes. Zoom/pan transforms apply to the single scene containing both image and SVG. There is no geographic coordinate conversion.

The source's printed dashed Main Gate→Klinik path has been removed from the displayed background. The live selected route is purple and follows calculated ordered link IDs. Developer uses the same asset/nodes/links as Resident, including during scenario view; only mode-specific selections/evidence differ.

## Preserve prior work and local data

Branch: `feature/reference-map-alignment`, based on PR #7 head `bba7b0a9ad359b8e2546ba8fc03a0e7e00b9ee53`. PR #7 was checked open/unmerged before work. The active AGENTS permits feature-branch changes; a coordination note was posted on PR #7. No main commit, force push or merge.

The old campus network is retained in `legacyCampusWalkways.ts` solely to reproduce its original fixture records. All4 original DEMO-S records and68 previous DEMO-WALK records, including their IDs/names/metre facts and evidence history, remain intact. The corrected network uses new `DEMO-REF-001`–`DEMO-REF-092` IDs. It starts unknown/grey, with null observation times and no invented footfall.

Recognized old snapshot ID sets are migrated additively. New unknown reference records are appended to every version, while prior segment records, observations/reviews, reports, intervention lifecycle events and current version are preserved. Old geometry is not painted on a different image. Four legacy intervention/report IDs have explicitly declared visual proxies, labelled as unsurveyed display proxies; this never relocates their source records or invents a verified site. Other retired map records remain historical evidence and are not arbitrarily assigned new coordinates.

Original PNG, shared public types, Home/Three.js, planning solver, review/publication rules, dependencies and original footprint records are preserved. `currentStudyArea` exposes the new display-source URL without mutating the old fixture objects. Resident/Developer default inspectors now refer to a visible reference segment.

## Actual verification

- `npm test`: **89 passed in eight files**. Includes source anchors, graph endpoint coordinate equality (without incorrectly comparing x/y points to metadata-rich node objects), connected-component handling, calculated path continuity, unknown handling and history-preserving migration from a published72-record saved workflow. Original planning/review/date/storage/routing tests pass.
- `npm run build`: passed; existing cinematic chunk-size warning remains.
- `review/check-reference-alignment.cjs`: rerun and passed against the normal production entry at `http://127.0.0.1:4183/` after background removal. It verifies served edited PNG bytes/dimensions, six retained coordinate anchors within0.01 frame pixel after resize/zoom/pan/reset on desktop/mobile, identical Resident/Developer node transforms and path strings, real dot selection, calculated overlay IDs, arbitrary endpoints, safe no-route output for the isolated spur, report persistence/Developer filtering and scenario geometry isolation. This coordinate check does not recognize landmarks in the edited raster. No horizontal overflow, external requests or page errors observed.
- New screenshots in `outputs/map-without-example-route/` were opened for visual inspection of both modes at desktop/mobile. They confirm the static dashed path is removed and reference circles remain aligned. `browser-results.json` records the actual check result. Previous screenshots in `outputs/reference-map-alignment/` retain historical evidence.

Browser reproduction with separately supplied Playwright/Chrome (no new app dependency):

```powershell
npm run build
npx vite preview --host 127.0.0.1 --port 4183 --strictPort
# Separate terminal:
$env:PLAYWRIGHT_MODULE='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
node review/check-reference-alignment.cjs
```

For normal use run `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`, then open that root URL. Choose Resident and select any two reference circles, or enter Developer to inspect the same map. A refresh updates an existing dev tab; no clearing local storage is required for recognized valid old data.

## Limits

This is manual alignment to an annotated planning illustration, not survey/georeferencing/navigation verification. Circles were read to image-pixel precision; low-resolution source markings and paths still need operator/field acceptance. The copied source's reference example is never a current shade observation. The inherited0.2m/pixel convention remains an explicitly rough DEMO assumption for new link lengths, not a measured map scale; no real distance/time/cooling claim is made. Legacy measured-looking fixtures remain DEMO. Reuse permission for the underlying illustration needs confirmation before public deployment. Storage stays local to browser origin/profile; no GPS, online tiles, backend or cross-device sharing is added.
