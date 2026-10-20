# Campus point reference photos

Both normal app roles can click or keyboard-activate a map point to expand a closable photo reference panel. Close or Escape returns focus to the map. Existing From/To selection remains active: selecting a routable point also follows the current endpoint control. On narrow screens close the photo panel before choosing the next covered point. Choosing a new report-selection mode or From/To control dismisses the previous photo panel.

Published-photo points are darker purple with radius9 rather than the ordinary radius7. Existing route-point hit targets remain unchanged; the five added photo-only junctions use radius10 hit targets so they do not cover nearby route points. The legend and accessible point label identify reference availability. Points with no published image display a clear empty state. Five existing hidden corridor junctions with supplied photos are now visible as photo-only markers; they remain non-routable endpoints. Their graph positions and all route edges are unchanged. Baseline/history/scenario maps use the same current published reference library; an image never asserts a simulated future installation.

## Confirmed source mapping

These assignments follow the operator's final corrections, not an automated image-location inference. Received20 October2026; actual capture times are unknown. The duplicated Main Gate clipboard image was excluded from the Klinik assignment.

| Picture | Confirmed label | Existing graph node | Prepared asset |
|---|---|---|---|
|1|Reference junction20|FIELD-NORTH|reference-20.jpg|
|2|Reference junction06|RAZAK-EAST|reference-06.jpg|
|3|Residensi UTMKL|RESIDENSI-UTMKL|residensi.jpg|
|4|Parking Bus UTM|REAR-GATE|bus-parking.jpg|
|5|Main Gate|MAIN-GATE|main-gate.jpg|
|6|Corridor junction V1|J-V1|corridor-v1.jpg|
|7|Corridor junction CLINIC|J-CLINIC|corridor-clinic.jpg|
|8|Klinik UTM|KLINIK-UTM|klinik.jpg|
|9|Cafe / MJIIT east access|CAFE-MJIIT|cafe-mjiit.jpg|
|10|Masjid UTMKL access|MASJID-UTMKL|masjid.jpg|
|11|Corridor junction TENNIS|J-TENNIS|corridor-tennis.jpg|
|12|Corridor junction PA5|J-PA5|corridor-pa5.jpg|
|13|Corridor junction LIBRARY|J-LIBRARY|corridor-library.jpg|
|14|Reference junction15|RESIDENSI-NORTH-WEST|reference-15.jpg|
|15|Reference junction09|PARKING-WEST|reference-09.jpg|

Assets in public/point-photos/ are downscaled reference previews with selected face/vehicle-plate areas blurred and location metadata removed. Original supplied files are untouched and are not committed. manifest.json records original basenames, node associations, preview dimensions and privacy-processing rectangles. Some supplied pictures are Street View screenshots; supplied source attribution remains where present. Reuse permission for wider public deployment still needs checking. No identity, GPS or shade inference is performed.

## Developer workflow

Open **Edit shade / publish**, then **Point photos / publish references** underneath shade controls. Choose a point (or click its marker), upload a JPEG/PNG/WebP image, review the published and draft previews, add an operator label/note and confirm review. **Publish point photo to Residents** commits only that point. **Discard photo draft** leaves its published picture intact. The previous photo, actor, note and Malaysia-local publication timestamp remain in history.

A draft is private to the Developer editor; opening the map photo panel always shows the published reference. If another tab published that same point after the draft began, publication is refused until the Developer explicitly reviews the latest image. Different-point updates from two tabs use atomic read/update/write transactions so they cannot overwrite each other's edits. A failed write reports an error and commits neither image nor history.

Input is limited to10MB and50 megapixels; the browser decodes and re-encodes to JPEG, at most1200px on the long edge and300000 characters of image data. Unsupported, corrupt and excessively detailed images are rejected. EXIF/location metadata is not retained. Uploaded images are not automatically privacy-redacted; remove identifying people/plates first. The reference label is not a field-survey, accessibility or shade measurement.

## Storage and shared seams

No backend or dependency was introduced. The shade/report WorkflowState and coolcorridor-shade-workflow-v1 localStorage entry are unchanged. The separate IndexedDB database coolcorridor-point-photos-v1 stores one versioned library record: published overrides, saved drafts, revision and immutable publication records containing previous images. Missing storage starts with the15 bundled references. Invalid storage is reported without overwriting it. This avoids consuming shade/report localStorage quota with image data.

App owns usePointPhotos and passes published references to Resident; only Developer receives the editor controls. BroadcastChannel and a small localStorage revision notification refresh other tabs; focus refresh is a fallback. Sharing is limited to the same browser origin/profile. This is a demo role gate, not server authentication, multi-device sync or a tamper-proof audit service. Browser quotas apply; write failures do not publish, and history is not silently pruned (maximum2000 local publications).

CampusImageMap adds optional pointPhotos, photoPoint and onPhotoPointChange props. Without pointPhotos its old inline-map contract remains. Normal pages opt in; current controlled selection is also used by the Developer point picker. Existing routing and report endpoints remain the60 route nodes, with65 initial visible markers after adding the five photo-only junctions.

## Run and validation

Startup commands are unchanged: npm run dev, npm test, npm run build. Open the normal URL and enter either role. Browser acceptance: build, serve with `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort`, then node review/check-point-photos.cjs with PLAYWRIGHT_MODULE/CHROME_PATH configured when needed. ALIGNMENT_APP_URL defaults to http://127.0.0.1:4183/.

The acceptance script uses fresh isolated browser storage and intentionally synthetic replacements. It checks all15 corrected images, marker styles, corridor semantics, close/Escape/focus, invalid uploads, draft isolation, explicit publication into an already-open Resident panel, unchanged shade/routing state, concurrent point edits, simulated quota failure, independent shade publication, reload, scenarios and phone layouts. Actual results/screenshots are in outputs/point-photos/. The separate route-report, shade-publication and reference-alignment regressions are retained.
