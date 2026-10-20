# Developer photo actions: validation

Tested on 20 October 2026 against the normal production app entry at http://127.0.0.1:4183/, using fresh isolated browser storage. User browser data was untouched.

- `npm run build`: passed; existing cinematic chunk warning remains.
- `node review/check-photo-actions.cjs`: passed. Actual results are in browser-results.json.

The browser test clicks the visible buttons and handles the native file chooser. It verifies existing-photo Update/Delete choices, empty-point Upload only, direct replacement without prior deletion, Resident isolation until publish, draft discard, one replacement history entry without a delete entry, separate deletion cancel/confirm, switching back to Upload after deletion, first upload on an empty point, retained drafts, unchanged shade/report storage, and phone layout. No page errors.

Screenshots:

1. 01-existing-photo-actions.png — Update and Delete offered for a published image.
2. 02-update-without-deleting.png — current image and its private replacement preview.
3. 03-empty-point-upload.png — Upload offered for a point without an image.
4. 04-mobile-photo-actions.png — actions after publication on a phone-width layout.

The replacement screenshot intentionally uses the Klinik photo as a synthetic Main Gate replacement in isolated test storage. Seed assignments and the user's app data are unchanged. Publication remains local to one browser profile/origin.

To reproduce: build, start `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort`, and run the browser script with Playwright and Chrome available. Set PLAYWRIGHT_MODULE, CHROME_PATH or ALIGNMENT_APP_URL for custom installations. No data schemas or dependencies changed; this follow-up adjusts the Developer editor actions only.
