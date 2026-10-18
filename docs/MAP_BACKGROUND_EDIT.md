# Remove the printed example route

On 18 October 2026 the operator requested removal of the dashed Main Gate–Klinik UTM line. This was baked into the reference JPEG, separate from the live calculated SVG route.

The built-in image generation/editing tool produced `public/maps/utmkul-reference-no-example-route.png`. The original JPEG is retained unchanged. The shared renderer uses the edited PNG in both Resident and Developer; selectable nodes, graph links, shade records and route calculation are unchanged. Only a selected calculated route receives purple casing. The small dashed sample in the original raster legend remains.

The edited PNG is 1113×1413; CSS fits it into the existing 1113×1414 coordinate frame (one pixel of height normalization). No graph coordinate or stored evidence is moved. Image editing is generative: visual comparison checks layout and landmark alignment, rather than claiming untouched pixels outside the edited path. This remains an illustrative, unsurveyed map.

## Final prompt (built-in edit, precise-object-edit)

Edit the attached campus map bitmap with extreme precision. Remove ONLY the thick dark grey dashed example route and its thick white casing running from Pintu Masuk Utama (Main Gate) at pixel (216,922) through PA7, PA1, CICT, Cafe V1, P1 to Klinik UTM at (747,317). Restore this corridor as a continuous thin solid grey walkway with the same thin white edging as all the other existing walkway lines, matching their width and colors. Preserve the Main Gate and Klinik endpoint circles, ALL other white reference circles, every building, printed word, label, arrow, terrain, road, border, legend and warning EXACTLY in its existing location and appearance. No new features. Do not change the map layout, perspective, proportions, crop, canvas size (1113 by 1414 pixels), or alignment. This is a surgical removal of the dashed example route only. The small dashed sample in the bottom legend can stay. Everything outside that route's narrow footprint must be identical to the input.

## Verification

Results and new screenshots are recorded in `outputs/map-without-example-route/`; `review/check-reference-alignment.cjs` checks the served edited asset, original coordinate frame, both roles, desktop/mobile resize/zoom/pan, live route selection, no-route handling, report persistence and scenario isolation. Automated anchor checks compare SVG placement with the retained coordinate frame; visual QA checks the image itself.
