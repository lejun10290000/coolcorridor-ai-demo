# Developer five-tool sidebar review

Normal application entry: http://127.0.0.1:4183/ (production preview). Local development preview remains http://127.0.0.1:5174/. Refresh and select **Enter Developer Mode**.

The new Developer layout keeps the image map left, with five buttons on the right: Edit shade / publish, Resident reports, Budget optimiser, Simulated scenario, Footfall. Reports are newest first. Budget and footfall each use two columns by five rows on desktop; cards stack on phones. The panel scrolls while the map and tool tabs stay visible. Resident presentation is preserved.

All screenshots come from isolated browser contexts with fictional/synthetic DEMO inputs, not the operator’s stored reports. The out-of-order report creation dates in the chronology test were deliberately set in that isolated context to prove sorting by date rather than insertion order/ID. Full-grid screenshots use taller browser windows to show all ten entries without clipping the scroll container.

## Actual validation

- npm test: **130 passed, 13 files**. Includes three ordering cases covering non-mutating date sort, equal-time numeric-ID ties and timezone instants.
- npm run build: **passed**. Existing cinematic scene550.74kB chunk warning remains; no new dependency.
- node review/check-developer-sidebar.cjs: see browser-results.json for the complete normal-entry layout, grid, input retention, publication, report, scenario and responsive results.
- Five additional normal-entry browser regressions: **passed**, recorded in regression-results.json (shade editing/publication, route reports/acceptance/manual repair, top-footfall budget/scenario, Resident sidebar, reference alignment).
- Browser scenarios inspect DOM coordinates at1440/1366/1024/390px, map SVG IDs/colours, local dataset versions, route recalculation, baseline immutability and page errors. Zero JavaScript page errors in the completed suites.

## Screenshots

- 01-edit-shade-publish.png — map left, edit/publication controls right; unpublished draft preview.
- 02-reports-newest-first.png — inbox ordered by deliberately unordered creation dates.
- 03-budget-two-column-grid.png — viewport view with two-column options beside the map.
- 03b-budget-two-by-five.png — all ten budget cards, two across and five down.
- 04-simulated-scenario.png — simulated map and comparison; baseline publication is separate.
- 05-footfall-two-column-grid.png — footfall tab beside the map.
- 05b-footfall-two-by-five.png — all ten evidence cards, two across and five down.
- 06-developer-1366.png / 06-developer-1024.png / 06-developer-390.png — responsive page views.
- 07-mobile-tools.png — phone tools after using the Open tools jump link.

## Scope and limitations

This branch builds on the unmerged Resident sidebar branch from PR17. Review the Developer-only diff against that branch, then integrate in dependency order. No PR is merged automatically. No schema/storage migration, HTTP API, routing algorithm, campus map asset, fixture count/price formula or Resident component changes. New presentation props are backward compatible; shared changes are detailed in docs/API_CONTRACTS.md and docs/DEVELOPER_SIDEBAR_LAYOUT.md.

Storage remains local to the same browser origin/profile. Footfall and prices are fictional, paths/lengths are unsurveyed, projections are assumptions, and no construction or field verification is claimed. Below960px the map and tools stack; below620px grids become a single column for readability.

## Evidence placement follow-up

Selected map path evidence now appears directly below the left-hand Developer map, outside the five tools. It remains expandable, follows the selected segment and switches to simulated evidence in the scenario view. Desktop map height reserves room for the collapsed evidence header; expanded evidence scrolls within its panel. Phone evidence uses normal document flow between map and tools. Resident layout and data behaviour are unchanged.

The production build passed after this move. A focused browser probe against the normal production entry passed desktop/mobile position, selected-path updates across tabs, simulated comparison, the selected-segment report link and absence of horizontal overflow/JavaScript errors. Actual results and three new screenshots are in map-evidence/. Earlier screenshots above document the original five-tool layout.
