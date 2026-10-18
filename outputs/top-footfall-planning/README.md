# Footfall-connected shade planning acceptance — 18 October 2026

Normal production-build entry: http://127.0.0.1:4183/. All browser tests use fresh Chrome contexts and synthetic local records, preserving the user's browser storage. [Workflow and schema](../../docs/TOP_FOOTFALL_PLANNING.md).

| Actually executed | Result |
|---|---|
| npm test | 127 tests passed in12 files, including12 new footfall model tests and a new default-view UI contract test |
| npm run build | TypeScript and Vite passed; existing cinematic home bundle-size warning remains |
| review/check-top-footfall-planning.cjs | Passed normal-entry footfall ranking, treatment/prices, budget changes, map lookup, separate simulation, publication-driven recalculation, reload and mobile checks; see browser-results.json |
| review/check-budget-scenario.cjs | Passed prior manual-candidate workflow after explicitly selecting its retained planning method |
| review/check-developer-map-shade.cjs | Passed manual drafts/publication/Resident routing, 34m shortest unchanged and most-shaded route38m within25% detour cap |
| review/check-route-reports.cjs | Passed manual map report points, acceptance/rejection badges2→1→0, yellow acceptance, separate manual repair/history and mobile |
| review/check-reference-alignment.cjs | Passed same60 circles/92 links across roles, zoom/pan/resize/mobile; no external requests |

[Focused actual browser results](browser-results.json). [Four prior-flow regression results](regression-results.json). All browser runs reported zero page errors. The model tests include comparison against an independent dynamic-programming optimiser and an affordable-single-proposal baseline.

The fictional top ten hourly-equivalent passage rates are796,792,784,776,768,764,756,748,736,728. Rank1 is DEMO-REF-008:199 fictional events/15min,21 illustrative metres. Default prices are3 trees×RM500=RM1500 or21 roof metres×RM200=RM4200. Screenshot1 demonstrates the editable roof rate changed toRM250/m, givingRM5250, while the tree estimate staysRM1500. These are fictional allowances, not real quotations.

Default RM20,000 can fund all ten default tree proposals for RM10,000. Changing rank1 to a roof makes the totalRM12,700; price changes and lower budgets recalculate immediately. Disabling the unknown-shade assumption leaves all initial unknown links' benefit unavailable, producing an empty portfolio instead of inventing measured shade. Turning it back on restores the explicit fictional planning assumptions.

The cross-tab publication test starts with ten funded tree proposals. A second Developer tab publishes rank1 mostly shaded plus a separate mixed link. The open simulation refreshes its baseline/version, stops funding rank1 because its additional shade benefit is zero, and funds nine paths for RM8500. The newly shaded path appears green from baseline; its former simulated tree overlay is removed. Residents receive only published shade/version. Original snapshots/candidates and separately saved manual-planning settings remain intact after reload.

## Screenshots

- [Rank1 choices and itemised prices after a unit-price edit](01-rank-one-tree-and-roof-prices.png)
- [All ten ranked paths and exact benefit formulas](02-ten-ranked-footfall-paths.png)
- [Funded budget portfolio](03-funded-budget-plan.png)
- [Simulated funded tree plan](04-simulated-tree-plan-map.png)
- [Simulation after baseline publication removes unnecessary funding](05-simulation-recalculated-after-publication.png)
- [Baseline/treatment comparison](06-funded-treatment-comparison.png)
- [Tree/roof prices on mobile](07-price-options-mobile.png)
- [Readable stacked comparison on mobile](08-comparison-mobile.png)

All counts, prices, tree spacing and treatment category effects are DEMO assumptions. Geometry/lengths remain unsurveyed. No installation/repair approval, actual cooling, unique people benefited, backend or cross-device synchronization is established. Only manual map publication changes Resident shade; planning settings and simulations remain separate.
