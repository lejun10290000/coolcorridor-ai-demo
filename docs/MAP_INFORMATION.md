# Shared live map information

Resident and Developer now use the same live map key beneath the campus view:

- Red: Unshaded; yellow: Mixed shade; green: Fully shaded; grey: Unknown / needs survey. These match the Developer's manual category labels, not measured shade percentages.
- Purple outline: selected route or selected Developer path links.
- Larger dark dots: a published point reference photo is available.
- From/To markers and names: current endpoint selection, not a fixed Main Gate → Klinik example. Developer adding a pair to a multi-path selection clears its endpoint pickers as before, so the key then returns to Not selected.
- Numbered pending-report badges: Developer only; accepted/rejected reports remain in history.
- Blue last-confirmed and orange next-point rings: shown only during an active Resident walkthrough.

The expandable information panel explains current interactions, photo-only corridor points, report attachments versus map-point photos, scenario isolation, manual walk confirmation and source limitations. The top caution and details retain unsurveyed/accessibility/field-check warnings. No field verification or live navigation claim is added.

## Replacing the obsolete printed footer

The supplied bitmap contains an obsolete grey/dashed example key with fixed Main Gate/Klinik endpoints. The renderer now clips that footer from the visible campus window and replaces it with live HTML. The campus image file is not edited, regenerated or overwritten. Its SHA256 remains `848ab2273286b8af8ee30142bd5595bd67c8608052b84f99c921edfa8fc5eab5`.

The visible window ends at native y1224, below the campus drawing/title and above the old footer. The inner image/SVG coordinate frame remains1113×1414, using the same1113×1413 bitmap fitted to it as before. Graph coordinates, point positions, link geometry, IDs, original image source and saved data are unchanged. The outer scene uses the campus-only aspect ratio for layout/zoom/pan; the inner frame retains full original coordinates. SVG explicitly fits that same frame (`preserveAspectRatio=none`) to avoid fractional CSS letterboxing relative to the filled image.

## Validation

`npm test` and `npm run build` pass. `node review/check-map-information.cjs` checks the normal app's shared key, dynamic endpoint names, role-specific badges, walk-ring information, clipped footer, unchanged image hash, image/SVG alignment, zoom/pan/reset, laptop and390px phone layout. Existing `check-reference-alignment.cjs` also passes its six original coordinate anchors within0.01 native pixel in both roles, identical graph geometry, route selection, reporting and scenario checks. These are display-coordinate checks, not image recognition or field verification. Actual results and screenshots are in outputs/map-information/.

No public map prop, persistent schema, dependency, backend or route algorithm changed. `campusMap.visibleHeight` is a display-only crop boundary; `referenceMap.height` and the SVG viewBox remain unchanged.
