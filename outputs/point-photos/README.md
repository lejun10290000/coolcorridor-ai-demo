# Point reference photos: actual validation

Tested on 20 October 2026 against the normal production app entry at http://127.0.0.1:4183/, using fresh isolated browser contexts. The user's existing browser data was not changed by these tests.

- `npm test`: 138 tests passed across 14 files, including eight new photo model tests.
- `npm run build`: passed. The existing 550.74 kB cinematic chunk warning remains.
- `node review/check-point-photos.cjs`: passed. See browser-results.json for the actual checks.
- Four existing browser regressions passed: reference alignment, Developer shade editing/publication, Resident route reports, and Resident sidebar layout. See regression-results.json.

The photo acceptance script checks all 15 corrected source assignments, photo markers, nearby route points, close/Escape/focus, Developer-only controls, invalid/corrupt/oversized uploads, private drafts, explicit publication into an already-open Resident panel, reload, concurrent edits, simulated storage failure, independent shade publication, scenario views, and phone layouts. No browser page errors were recorded.

## Screenshots

1. 01-resident-reference-panel.png — published Klinik UTM reference in the normal Resident app.
2. 02-developer-photo-draft.png — Developer upload controls with an unpublished test replacement.
3. 03-resident-after-photo-publication.png — the same isolated test replacement after explicit publication.
4. 04-resident-mobile.png — closable photo reference on a phone viewport.
5. 05-developer-mobile.png — published photo panel in Developer mode on a phone viewport.

Screenshots 2 and 3 intentionally use the Klinik preview as a synthetic replacement for Main Gate to make draft/publication isolation observable. This is test data only. The bundled Main Gate and Klinik assignments remain correct; no such replacement was applied to the user's app storage.

## Reproduce

Build, then run `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort` in one terminal. Run the scripts in another terminal with Playwright and Chrome installed. `PLAYWRIGHT_MODULE` and `CHROME_PATH` can point to their local installations. `ALIGNMENT_APP_URL` optionally changes the normal entry URL.

Photos are location references, not verified shade observations. Prepared seed copies have selected identifying areas blurred and metadata removed; original supplied files are untouched. Developer uploads require privacy review. Publication remains local to one browser profile and origin, with no server authentication or multi-device sharing. The complete mapping and storage contract are documented in docs/POINT_REFERENCE_PHOTOS.md.
