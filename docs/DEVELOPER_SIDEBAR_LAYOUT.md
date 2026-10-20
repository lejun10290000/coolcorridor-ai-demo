# Developer map and five tools

Developer mode uses a persistent campus map on the left and five accessible buttons/tabs on the right at widths of960px and above. Both Resident and Developer use a60% map /40% controls split of the available column space (excluding the gap). Only the selected tool is visible; its content scrolls independently while the map and five buttons stay in place.

1. **Edit shade / publish:** select one or several point-to-point paths, classify shade in a Developer draft, review and explicitly publish to the Resident baseline. Baseline history remains expandable and historical snapshots are read only.
2. **Resident reports:** newest creation date first, regardless of stored array order. Equal timestamps use the higher numeric report ID first. Pending counts remain on the Developer map; acceptance/rejection removes their contribution without deleting audit history. Accepting a route still publishes mixed/yellow shade, and repairs still require a separate manual update.
3. **Budget optimiser:** ten fictional-footfall paths in two columns by five rows on desktop. Each retains tree/roof estimates, treatment selection, funding status and locate-on-map action. Budget/prices and assumptions retain their existing calculations. Earlier manual candidates remain available under Planning method and keep their independent saved settings.
4. **Simulated scenario:** projects the selected plan on the latest published baseline. It excludes drafts and report markers, never publishes, and automatically rebuilds after a baseline publication. Without a valid calculated plan it shows the baseline and a link to the optimiser.
5. **Footfall:** the same top ten fictional counts in two columns by five rows, with units, demand/exposure explanation and map-location actions.

Draft assignments, selected edit links, in-progress publication/review notes and treatment choices survive switching tabs. Map clicks show selected path evidence in an expandable section directly below the left-hand map. The evidence is shared across the five tools; on desktop its expanded contents scroll within a bounded panel, and on phones it appears between the map and tools. Editing is active only in the current-baseline shade editor; tapping a path in the other tools inspects evidence. The shared map's compact legend/source presentation preserves the visible unsurveyed caution. Resident layout and route logic remain unchanged.

Below960px, map and tools stack, with normal page scrolling. At620px and below the ten-entry grids become a single column for readability. Open tools / View map links support moving between sections. Tabs support click, Tab, Left/Right arrows, Home and End. No new dependency, data schema or HTTP API; storage remains local to the same browser origin/profile. This work builds on the Resident sidebar feature from PR17 and does not merge either PR automatically.

## Implementation and compatibility

- DeveloperWorkspace owns active-tool/navigation and map mode. Hidden panels remain mounted to preserve review inputs.
- DeveloperMapEditor accepts optional controlsTarget (HTMLElement or null) for a React portal into the shade-edit tab and optional viewLabel for map state text. Without a target it keeps the previous inline presentation. Its state and map stay mounted across all tools.
- FootfallPlanningPanels accepts optional panel: all (default), budget, scenario or footfall; PlanningPanels accepts all (default), budget or scenario. The default combined presentation remains available for other callers. These props select presentation only; the existing shared workflow model remains authoritative.
- newestReportsFirst sorts a copy of report records by creation instant descending, then numeric-aware report ID descending. Filtering still uses exact saved segment IDs; storage ordering/history are untouched.
- Developer styling is scoped in developer-layout.css. No Resident component, routing algorithm, map geometry, fixture count, price formula or publication model changed.

## Run and verify

Run npm install if dependencies are missing, then `npm run dev -- --host 127.0.0.1 --port 5174`. Open the printed local URL and select Enter Developer Mode. Refresh an already open page to load the new layout. Start production preview with `npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort` after npm run build.

For browser checks, set PLAYWRIGHT_MODULE to the installed Playwright module, CHROME_PATH to Chrome if required, and ALIGNMENT_APP_URL to the preview origin. Run node review/check-developer-sidebar.cjs. The script uses fresh isolated browser storage and synthetic reports only; chronological test fixtures deliberately have out-of-order dates. It checks all five sections, desktop grid coordinates, independent scrolling, preserved inputs, report order/review, current-baseline refresh, scenario isolation, legacy manual planning, keyboard controls and1440/1366/1024/390px widths. Screenshot evidence and actual results are in outputs/developer-sidebar/.

Additional normal-entry regression scripts cover Resident sidebar, map shade/publication, route reports, top-footfall planning and reference alignment. Actual results, commands and known limitations are recorded with the review artifacts. No real pedestrian survey, quoted construction price, cross-device sync or production backend is implied. The pre-existing cinematic scene chunk-size warning remains.
