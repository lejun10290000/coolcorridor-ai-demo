# Budget and simulation acceptance — 18 October 2026

Tested the normal production-build entry at `http://127.0.0.1:4183/` in fresh Chrome contexts with synthetic local DEMO data. Existing user browser storage was not modified.

| Check actually run | Result |
|---|---|
| `npm test` | 114 tests passed in11 files, including10 new planning/overlap tests |
| `npm run build` | Passed TypeScript and Vite production build; existing cinematic bundle-size warning remains |
| `node review/check-budget-scenario.cjs` | See [browser-results.json](browser-results.json) for actual budget/scenario checks |
| `node review/check-developer-map-shade.cjs` | Passed; shortest34m unchanged, most shaded path changed34m→38m after publication, within25% |
| `node review/check-route-reports.cjs` | Passed; independent manual report points, pending badge cleanup, acceptance yellow, manual repair, retained history |
| `node review/check-reference-alignment.cjs` | Passed; same60 visible circles/92 links in both modes, desktop/mobile/zoom/pan alignment, no external requests |

Detailed results from the three existing acceptance scripts are copied into [regression-results.json](regression-results.json). Their temporary screenshots stay under ignored work/; the focused planning screenshots are included here.

Default exact portfolio: RM10,000 selects INT-02 (score35); RM20,000 selects INT-03 (score92). For a two-link INT-03 proposal its TOTAL remains92, rather than multiplying to184. Exclusions, costs, scores and target changes recompute after the first calculation. Scores and costs are assumed, not field measurements or quotes.

The scenario check publishes mixed shade to DEMO-REF-001 and exposed shade to DEMO-REF-002 in a second Developer tab. The first tab remains in simulation: its explicit green projection stays on001, the comparison baseline changes to mixed/yellow, and002 follows the new exposed/red baseline automatically. Residents see mixed001/exposed002 and the new route version. Original snapshots/candidates remain unchanged; unpublished drafts never enter the simulation.

## Screenshots

- [Initial simulated map and separate inspector](01-simulated-map-and-inspector.png)
- [Simulation after manual baseline publication](02-simulation-refreshed-after-publication.png)
- [Resident published baseline after the same update](03-resident-published-baseline.png)
- [Completed budget and comparison panels](04-budget-and-scenario-panels.png)
- [Simulated map and inspector on mobile](05-simulated-map-mobile.png)
- [Stacked planning and comparison controls on mobile](06-planning-panels-mobile.png)

Same browser origin/profile only. No backend, central account authentication, real construction approval or measured cooling outcome is established. Refer to [workflow instructions](../../docs/BUDGET_SCENARIO_WORKFLOW.md) and [data dictionary](../../docs/DATA_DICTIONARY.md) for the planning-only schema, formula and compatibility details.
