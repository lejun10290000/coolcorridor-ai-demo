# Resident sidebar acceptance — 20 October 2026

Normal production-build entry at http://127.0.0.1:4183/, tested in fresh Chrome contexts using synthetic local DEMO updates/reports. User browser storage was not modified. [Layout notes](../../docs/RESIDENT_SIDEBAR_LAYOUT.md).

- npm test:127/127 tests passed across12 files.
- npm run build: TypeScript and Vite passed; existing cinematic bundle-size warning remains.
- review/check-resident-sidebar.cjs: passed; [actual results](browser-results.json) include responsive coordinates and zero page errors.
- Existing map alignment, route-report review and manual shade publication/routing scripts were run as regressions; results are recorded separately in regression-results.json.

The focused browser run verified map-left/control-right placement, independent right-column scroll with unchanged map position, image visibility within desktop/laptop viewports, identical selected-card/overlay segment IDs, automatic publication-driven route updates, manual map report autofill/submission, hidden Resident report counts, accessible source/evidence and zoom/pan/reset. It checked1440×1000,1366×768,1024×768 and390×844 without horizontal overflow. At phone width the map and controls stack; jump links reach both sections.

Developer has no Resident layout classes or compact map details. Its original700px viewport at1440×1000, expanded map information, manual shade controls and ten footfall entries were checked. Geometry and IDs remain unchanged.

Screenshots:

- [Desktop left map / right route controls and comparison](01-resident-desktop-split.png)
- [Developer map with original layout](02-developer-map-unchanged.png)
- [Right-side comparison after publication changes the shaded route](03-comparison-after-publication.png)
- [Laptop1366](04-resident-1366.png)
- [Tablet1024](04-resident-1024.png)
- [Phone390 with jump navigation](04-resident-390.png)

Counts, routes, lengths and shade labels retain their existing DEMO/unsurveyed caveats. This is a local prototype; no deployment, data migration or cross-device synchronization was added.
