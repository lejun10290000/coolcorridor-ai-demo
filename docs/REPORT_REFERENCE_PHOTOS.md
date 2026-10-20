# Optional Resident report photo

Residents select two map points and describe the walkway problem as before. The report form now offers **Reference photo (optional)**. JPEG, PNG or WebP files up to 10 MB can be selected, previewed, enlarged or removed before submission. Reports without photos remain valid. Unsupported, corrupt or oversized files show an error; **Continue without photo** clears the failed attachment and allows a text-only report.

The browser reuses the existing image preparation pipeline: decode, downscale to at most 1200 px on the long edge, re-encode to JPEG, strip EXIF/location metadata, and bound the encoded preview to 300000 characters. Original filenames/files are not stored. There is no image inference or automatic shade classification. Remove identifying faces/plates before attaching; privacy redaction is not automatic.

The optional `ResidentReport.reference_photo` field contains `{data_url, source: resident_upload, capture_time: null}`. Submission copies the attachment into its exact saved report, preserving independently selected map points and route IDs. The capture time is unknown; the report's created_at is submission time, not photo capture time. Bounded JPEG data and fixed source metadata are validated both at submission and saved-state loading. External URLs, SVG, scripts and malformed metadata are refused. Existing reports without this field remain readable; no migration is required.

Developer **Resident reports** shows the photo beside its report description/path and review controls, with **View larger photo**. It is labelled Resident-provided, capture time unknown and not verified. The Developer decides whether to accept or reject after considering the path, description and reference. Uploading a photo never accepts the report or changes shade. Acceptance still explicitly publishes mixed/yellow shade on the saved route; rejection leaves the map unchanged. The attachment remains with the report after either decision and after reload.

Report attachments never become published map-point photos. The Developer's separate point-photo Update/Delete/Upload workflow and its IndexedDB library are unchanged.

## Persistence and failure handling

Report attachments are stored with the existing local WorkflowState in localStorage, so the report and photo save together. They are shared only between tabs on the same origin/browser profile. There is no server upload, multi-device transfer or production authentication. The optional field is additive under schema1; all tabs should use the new build to display attachments.

Image previews consume local storage quota. If a new report with a photo cannot be saved persistently, submission fails without updating in-memory reports, changing map shade or closing the form. Its description and preview remain for retry or removal. Existing text-only and other workflow actions retain their original session-only fallback/warning behavior when storage is unavailable. No data is silently pruned to make space.

## Validation

Run `npm test`, `npm run build`, and `node review/check-report-photos.cjs` against a production preview at http://127.0.0.1:4183/. Existing report behavior is covered by `node review/check-route-reports.cjs`. Configure PLAYWRIGHT_MODULE/CHROME_PATH when needed. The browser script uses isolated synthetic reports and prepared reference assets, not user storage. Actual results/screenshots are in outputs/report-photos/.
