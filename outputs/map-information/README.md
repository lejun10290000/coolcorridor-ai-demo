# Shared map information: actual validation

Tested 20 October 2026 against the normal production app entry at http://127.0.0.1:4183/ in isolated browser contexts.

- `npm test`: **154 tests passed in16 files**.
- `npm run build`: **passed**, with the existing550.74kB cinematic chunk warning.
- `node review/check-map-information.cjs`: **passed**. Actual measurements and assertions: browser-results.json.
- Existing `node review/check-reference-alignment.cjs`: **passed**. Actual result: alignment-regression.json.

Both roles have the same updated shade/route/photo key and actual endpoint names. Pending-report guidance appears only in Developer, and walkthrough rings only during a Resident walk. The obsolete printed fixed Main Gate/Klinik footer is excluded from the visible scene through layout, not bitmap modification. The source image hash, original1113×1414 image/SVG frame and graph geometry remain unchanged.

Alignment checks include original native coordinate anchors after crop, desktop/phone resize, zoom, pan and reset. The existing alignment suite also checks shared point/path geometry, calculated overlay IDs, report persistence and scenarios. These verify display transforms, not surveyed geography. No horizontal page overflow, browser errors or external requests were recorded.

Screenshots:

1. 01-resident-live-map-key.png — current Resident endpoint pair and updated key.
2. 02-developer-live-map-key.png — selected Developer path links; endpoint pickers clear after adding a pair, as before.
3. 03-resident-mobile-key.png — complete live key in the phone layout.
4. 04-developer-mobile-key.png — phone Developer key including pending-report badge explanation.

Reproduce by building and starting `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort`, then running the scripts with Playwright and Chrome available. Configure PLAYWRIGHT_MODULE, CHROME_PATH or ALIGNMENT_APP_URL as needed. No map props, saved schemas, dependencies, route algorithms or original image files changed. Full presentation contract: docs/MAP_INFORMATION.md.
