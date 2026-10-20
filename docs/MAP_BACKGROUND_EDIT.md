# Remove the printed example route

20 October display update: both roles now hide the obsolete printed footer through a campus-only layout crop and show a shared live HTML legend. No further bitmap editing was performed; the current image bytes and original coordinate frame are unchanged. See MAP_INFORMATION.md for the render boundary and alignment tests. The earlier generative edits below remain historical provenance.

Current displayed asset is now `public/maps/utmkul-reference-normal-points.png`, a second built-in edit that replaces the oversized Main Gate/Klinik bullseyes with ordinary reference circles. The first edit described below remains preserved as input/history. Both modes use the new asset; SVG markers also keep the same radius7 when selected. New PNG dimensions1113×1413, SHA256 `848ab2273286b8af8ee30142bd5595bd67c8608052b84f99c921edfa8fc5eab5`; the original1113×1414 coordinate frame is retained. This is a generative bitmap edit, with visual QA rather than a claim of identical untouched pixels.

## Final prompt for normal endpoint circles (built-in edit)

Use case: precise-object-edit. Edit target: attached campus map. Change ONLY the two oversized dark endpoint circles: Main Gate at reference pixel (216,922) and Klinik UTM at (747,317), in the 1113x1413 input. Replace each oversized bullseye with a normal small grey walkway circle with a thin white edge, outer radius approximately 7 pixels, centered at exactly the same point, matching the other small reference circles. Restore underlying road/walkway/background within each old large circle's footprint. Do not move the centers. Preserve all other circles, labels, map geometry, typography, colors, canvas bounds and proportions. No dashed route is to be added. The bottom legend can stay unchanged. Keep everything else unchanged. Output same 1113x1413 canvas, no crop.

Normal-entry browser evidence is in `outputs/developer-map-shade/` and `outputs/normal-points-alignment/`. See DEVELOPER_MAP_SHADE.md for the integrated editing/publication workflow.

## Previous dashed-line removal

On 18 October 2026 the operator requested removal of the dashed Main Gate–Klinik UTM line. This was baked into the reference JPEG, separate from the live calculated SVG route.

The built-in image generation/editing tool produced `public/maps/utmkul-reference-no-example-route.png`. The original JPEG is retained unchanged. The shared renderer uses the edited PNG in both Resident and Developer; selectable nodes, graph links, shade records and route calculation are unchanged. Only a selected calculated route receives purple casing. The small dashed sample in the original raster legend remains.

The edited PNG is 1113×1413; CSS fits it into the existing 1113×1414 coordinate frame (one pixel of height normalization). No graph coordinate or stored evidence is moved. Image editing is generative: visual comparison checks layout and landmark alignment, rather than claiming untouched pixels outside the edited path. This remains an illustrative, unsurveyed map.

## Final prompt (built-in edit, precise-object-edit)

Edit the attached campus map bitmap with extreme precision. Remove ONLY the thick dark grey dashed example route and its thick white casing running from Pintu Masuk Utama (Main Gate) at pixel (216,922) through PA7, PA1, CICT, Cafe V1, P1 to Klinik UTM at (747,317). Restore this corridor as a continuous thin solid grey walkway with the same thin white edging as all the other existing walkway lines, matching their width and colors. Preserve the Main Gate and Klinik endpoint circles, ALL other white reference circles, every building, printed word, label, arrow, terrain, road, border, legend and warning EXACTLY in its existing location and appearance. No new features. Do not change the map layout, perspective, proportions, crop, canvas size (1113 by 1414 pixels), or alignment. This is a surgical removal of the dashed example route only. The small dashed sample in the bottom legend can stay. Everything outside that route's narrow footprint must be identical to the input.

## Verification

Results and new screenshots are recorded in `outputs/map-without-example-route/`; `review/check-reference-alignment.cjs` checks the served edited asset, original coordinate frame, both roles, desktop/mobile resize/zoom/pan, live route selection, no-route handling, report persistence and scenario isolation. Automated anchor checks compare SVG placement with the retained coordinate frame; visual QA checks the image itself.
