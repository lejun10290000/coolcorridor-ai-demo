# Optional report reference photos: actual validation

Tested 20 October 2026 against the normal production app entry at http://127.0.0.1:4183/ using fresh isolated browser contexts. User browser data was untouched.

- `npm test`: **154 tests passed in 16 files**, including six report-photo tests.
- `npm run build`: **passed**, with the existing 550.74 kB cinematic chunk warning.
- `node review/check-report-photos.cjs`: **passed**. Exact results: browser-results.json.
- Existing `node review/check-route-reports.cjs`: **passed**, covering manual report endpoints, review, yellow/mixed publication, rejection, later manual repair, counts and phone flows. Results: route-report-regression.json.

The photo browser checks cover optional submission without an image, preview/removal, unsupported/corrupt/oversized files, continuing without a photo, persistent-save failure with no partial report, Developer image matching and enlargement, reload, acceptance/rejection retaining attachments, separate map-point photos, and phone layouts/scroll restoration. The tested JPEG preview was 196863 characters; no page errors were recorded.

## Screenshots

1. 01-resident-optional-photo.png — Resident report form with an optional preview.
2. 02-developer-reference-review.png — Developer review with its attachment preview and decision controls (larger view was also tested).
3. 03-mobile-report-photo.png — optional report photo on a 390 px phone viewport.
4. 04-mobile-developer-review.png — retained attachment after rejection on a phone layout.

Images and descriptions are synthetic test references using an existing privacy-prepared corridor image. They do not claim a real broken canopy or field observation. No raw user upload is committed.

## Reproduce and limits

Build and start `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort`, then run the browser scripts with Playwright and Chrome available. Set PLAYWRIGHT_MODULE, CHROME_PATH and optionally ALIGNMENT_APP_URL for custom installations.

The photo is an optional bounded JPEG preview stored with its report in localStorage. It is not a map-point photo or automatically accepted shade evidence. Capture time is unknown. Storage is limited to the same browser profile/origin, with no server authentication or multi-device delivery. A failed new photo-report save leaves the form/preview intact for retry/removal. See docs/REPORT_REFERENCE_PHOTOS.md for the shared contract, limits and compatibility details.
