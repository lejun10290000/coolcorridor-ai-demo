# Resident walkthrough: actual validation

Tested 20 October 2026 through the normal production entry at http://127.0.0.1:4183/ in fresh browser contexts. Existing user browser storage was untouched.

- `npm test`: **148 passed across 15 files**, including seven walkthrough tests.
- `npm run build`: **passed**. The pre-existing 550.74 kB cinematic chunk warning remains.
- `node review/check-resident-walk.cjs`: **passed**. Includes Main Gate → Klinik UTM through all 12 graph links, reverse and single-link walks, photo matching/missing references, point rings, route/control locking, manual Next/Previous/arrival/Finish, publication during walking, exit/recalculation, phone layout and refresh boundaries. No page errors.
- `node review/check-route-reports.cjs`: **passed**. Existing manual point reporting, Developer acceptance/rejection, yellow shade publication, subsequent manual repair and phone flows remain functional.
- `node review/check-point-photos.cjs`: **passed**. All 15 assignments, photo publication/deletion, failed-save isolation, cross-tab refresh and phone references remain functional.

browser-results.json records the exact node order and matching photo assets. It also records the route-lock test: an active most-shaded walkthrough keeps DEMO-REF-080 after a Developer publication; exiting reveals the new optimum DEMO-REF-081/082. Both regression results are in regression-results.json. All publications and replacement photos in these tests are synthetic inputs in isolated storage.

## Screenshots

1. 01-resident-next-photo.png — locked Main Gate → Klinik route, next Tennis corridor point and its confirmed reference photo.
2. 02-destination-reached.png — destination confirmation and Finish action.
3. 03-published-map-route-lock.png — notice of a newer baseline while the selected route retains its original map version.
4. 04-mobile-walk.png — reverse journey with Clinic corridor reference and manual controls on a 390 px viewport.

## Reproduce

Build and start `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort`, then run the scripts with Playwright and Chrome available. Set PLAYWRIGHT_MODULE and CHROME_PATH when installed at custom locations. ALIGNMENT_APP_URL can change the entry URL.

Progress is manual and session-only. Refreshing or leaving the role ends it. Photos without supplied references are shown as unavailable. This remains an illustrative walkthrough over an unsurveyed planning graph, with no GPS, verified directions or automatic arrival detection. Developer UI and saved schemas are unchanged; the only shared map addition is an optional point-ring prop. Full details: docs/RESIDENT_WALKTHROUGH.md.
