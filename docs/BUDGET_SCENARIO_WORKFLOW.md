# Budget optimiser and current-map simulation

The normal app now defaults to [top-ten fictional footfall planning](TOP_FOOTFALL_PLANNING.md). To use the manual-candidate workflow below, enter Developer Mode and choose **Manual candidate planning (saved proposals)** under **Planning method**. Its earlier saved inputs remain separate.

Use the existing Baseline route/path selection to select proposal locations. In Budget optimiser, use a candidate's **Use selected map paths** button. This assigns planning targets only; applying shade to a Developer draft is a separate action.

Keep or edit each proposal's assumed cost and total benefit score, tick eligible proposals, enter a budget and select **Optimise plan**. Further valid input changes automatically recalculate the entire portfolio. Constraints and overlaps affect selection together; individually affordable proposals need not be selected. Unknown field evidence stays unknown. Costs and benefits remain DEMO assumptions.

In **Baseline versus simulated scenario**, choose explicit shade projections for selected links, then **View simulated map**. Selected proposal markers and hypothetical colors appear on the current campus map with a simulation-specific inspector. Simulation has no shade publication controls or Developer draft/report overlays. **Return to baseline** restores normal manual map editing; pending manual selections/drafts are retained. Empty portfolios show the current baseline with no simulated effects.

Manual baseline editing still uses **Apply shade to Developer draft**, review/note, then **Publish to Resident map**. A draft never enters the simulation or Resident routes. Publication appends a new version and automatically refreshes an open simulated map, including another tab in the same browser origin/profile. Unprojected links use the new baseline; explicit hypothetical overrides are reapplied only to selected proposal links. The comparison table shows both the new baseline category/version and the explicit projection. Residents receive only published data and recalculate their routes as before. Clearing projections makes the simulation equal the latest baseline.

Planning inputs/targets/projections survive refresh in optional planning_workspace storage. Historical evidence, intervention fixtures, old snapshots and existing reports are retained. The normal app opens on Baseline after reload. There is no shared server or synchronization between different origins, profiles or devices.

## Validation

- `npm test` includes current-map targets, budget/candidate edits, invalid and empty portfolios, multi-link overlap scoring, no Resident data mutation, draft isolation, rebase on publication, persistence and optional-planning recovery.
- `npm run build` checks TypeScript and produces the normal app.
- `review/check-budget-scenario.cjs` drives that production entry in fresh Chromium contexts with synthetic data and writes screenshots plus actual results to `outputs/budget-scenario/`. Set `PLAYWRIGHT_MODULE` to an available Playwright module and optionally `CHROME_PATH` to Chrome; `ALIGNMENT_APP_URL` defaults to `http://127.0.0.1:4183`. It tests real map clicks, automatic recalculation, cross-tab draft/publication isolation, Resident baseline routing, saved inputs, invalid/empty portfolios and mobile overflow.
- Existing `review/check-developer-map-shade.cjs`, `review/check-route-reports.cjs` and `review/check-reference-alignment.cjs` cover manual publication/routing, reports and shared-map geometry.

No package or startup change. The existing large cinematic home-page bundle warning is unrelated to this workflow. Basemap/corridor positions, distances, shade classes, costs and benefit scores remain illustrative and unsurveyed.
