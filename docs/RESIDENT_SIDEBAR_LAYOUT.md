# Resident map and route sidebar

Resident mode now keeps the campus map on the left at desktop/tablet widths of960px and above. Starting point, destination, map-dot selection mode, shortest/most-shaded route cards and report controls are on the right. The right column scrolls independently, so reviewing routes, reports or evidence does not move the map out of view. Map height fits the available viewport; zoom, pan and reset still use the existing image/overlay transform.

Route cards show distance/time, detour, unknown shade and ranking cost first. Full segment IDs, dataset metadata, known-label coverage, weights, warnings and provenance remain available under expandable details. Selecting a map path opens its evidence section in the sidebar. Map information/source and the full original legend are expandable beneath a permanently visible compact shade/route legend. The unsurveyed/not-for-navigation caution remains visible.

Below960px, panels stack with the map first. **Plan a route** and **View map** links let phone users move between the map and controls. Narrow screens use the normal page scroll rather than nested scrolling. This keeps controls and route cards readable without horizontal overflow.

The initial Resident sidebar change left Developer unchanged. Developer now has its own five-tool sidebar (see DEVELOPER_SIDEBAR_LAYOUT.md), preserving the editing, report and planning functions. Shared CampusImageMap.compactDetails remains optional (default false); both layouts opt in. RouteCards adds a compact presentation option used by Resident. Existing map geometry, node/segment IDs, shade colours, route calculations, the25% detour cap, report point independence and storage schemas are unchanged. No dependencies or startup changes.

## Review

Open the normal app and enter Resident Mode. Choose a start/destination on the right or select map dots. Choose either route card and confirm its matching path on the left. Scroll the right column and check the map stays in place. On a phone use the jump links. Reporting still captures only the map points chosen manually, independently of route dropdowns/cards.

`review/check-resident-sidebar.cjs` drives the normal production build in a fresh browser context. It checks column placement, independent scrolling, visible map bounds, both route highlights, cross-tab publication/recalculation, manual report autofill/submission, expandable source/evidence, Developer's separate five-tool layout without Resident style leakage, desktop1440/laptop1366/tablet1024/mobile390 widths, jump links and zoom/pan/reset. Actual screenshots/results are in outputs/resident-sidebar/. Existing alignment, report and shade-publication acceptance scripts remain applicable. Unit/build commands are unchanged: npm test and npm run build.
