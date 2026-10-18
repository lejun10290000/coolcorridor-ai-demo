# Developer route shade editing and Resident publication

The later [route report workflow](ROUTE_REPORT_SYSTEM.md) adds one explicit publication action: accepting a valid Resident route report immediately publishes mixed/yellow shade for its saved path. It preserves any manual draft as stale. Repairs still use the manual editor described here and require a separate publication; acceptance does not mark a repair complete.

Feature branch `feature/developer-map-shade-publishing` starts from PR9 head `7d474151c15644b1225428760b7521ce72902ba4`. PR9 was checked open/unmerged before work. No main commit, automatic merge, force push or discarded work.

## Use in the normal app

1. Refresh `http://127.0.0.1:5174/` and enter Developer. Use the current Baseline view.
2. Under Edit map shade, choose From/To points using the lists or map dots. Selecting a From dot advances map input to To. Choose **Add route to selection**. Repeat for more paths; overlaps count once. The connection follows the existing shortest corridor network, without inventing a direct line. Select shorter point pairs to choose a particular corridor. Individual path taps add/remove the nearest link; disable selection to inspect without editing.
3. Choose **Unshaded**, **Mixed shaded** or **Fully shaded**, then **Apply shade to Developer draft**. Repeat with other selections/categories. Unknown/reset is also available. The draft persists across refresh and is previewed on the Developer map. The evidence inspector continues to show published baseline evidence, with draft changes listed separately.
4. Review the per-link current/draft table. Remove unwanted assignments or discard the whole draft if needed. Enter an operator label and publication note and check the DEMO review statement. Choose **Publish to Resident map** only when ready.
5. Enter Resident and select any two connected points. Both route objectives automatically use the published version. An already-open Resident tab at the same origin/profile updates automatically too. Drafts never affect its routes. The shortest objective uses distance alone; the most shaded practical objective minimizes exposure-ranking cost within the existing25% maximum detour.

The Main Gate and Klinik background circles are now ordinary small circles. Every visible SVG marker stays radius7, including selected endpoints. A larger transparent hit area helps selection without enlarging the visible point. Point coordinates, graph links and lengths remain unchanged.

## Provenance, publication and compatibility

Manual map classes are explicitly DEMO, with no observed timestamp. “Fully shaded” is the prototype shaded class, not a measured100% coverage claim. Weights remain exposed1, mixed.5, shaded0, unknown1. The existing field-observation/separate-reviewer/installation lifecycle is preserved and cannot be completed through this editor. Publication creates a separate audited map-classification record linked by `shade_source.map_publication_id` and a new immutable snapshot. Prior observations and published history remain inspectable, even if a later DEMO map class supersedes a displayed label.

Optional schema1 fields `map_shade_draft` and `map_shade_updates` are added without rewriting legacy evidence. Strict reload validation checks each publication against its parent snapshot and all assignments/sources; unrelated record changes and forged evidence are rejected. A draft tied to an older published version cannot be staged/published until the operator reviews the current-versus-draft table and explicitly uses the newest baseline. Shared optimistic storage handling continues to guard concurrent tab writes.

This is local browser storage, without production login/server synchronization. Another device or profile does not receive changes. All geometry, distances, crossings and accessibility remain illustrative/unsurveyed. Route calculation is deterministic graph optimization; this change does not add pretrained AI inference or establish AI-complete acceptance.

## Actual checks

- `npm test`: **95 passed across9 files**, including6 new batch tests. Covers connected/no-route selections, multi-category draft isolation and persistence, immutable confirmed publication, preserved reports/lifecycle/evidence, changing shaded routes within the cap, stale draft review, additive loading and forged-source rejection.
- `npm run build`: passed. Existing cinematic chunk-size warning remains.
- `review/check-developer-map-shade.cjs`: passed against the **normal production root** `http://127.0.0.1:4183/`, using fresh synthetic browser data. Two selected paths became unshaded, one mixed, two shaded. Drafts persisted without affecting an open Resident tab. Publication automatically changed the shaded route from DEMO-REF-080 to DEMO-REF-081→082; shortest stayed34 DEMO metres, shaded became38 (11.8% detour, under25%). Colors/overlay IDs agreed in both modes; history was read-only, reload preserved the published version, desktop/mobile had no horizontal overflow or page errors.
- `review/check-reference-alignment.cjs`: passed again for the new asset. Six retained coordinate-frame anchors, both role transforms/path strings, desktop/mobile resize/zoom/pan/reset, real dot clicks, calculated overlay IDs, report persistence, isolated no-route and scenario isolation passed. Raster landmark correspondence was visually reviewed; automated anchors check coordinate placement, not image recognition.
- Screenshots and JSON results: `outputs/developer-map-shade/` and `outputs/normal-points-alignment/`. Opened for visual QA. Original and intermediate map assets/screenshots remain available.

Reproduce after `npm run build` with the existing Vite preview on4183:

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
node review/check-developer-map-shade.cjs
node review/check-reference-alignment.cjs
```

No app dependency was added for browser testing. The underlying illustrated map still needs reuse permission before public deployment.
