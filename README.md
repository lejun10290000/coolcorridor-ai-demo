# CoolCorridor AI — Phase 0 prototype

An interactive, laptop-first prototype for the UTM Kuala Lumpur pilot: Resident route/evidence/report flow and Developer planning, budget optimisation, scenario and demo lifecycle flow.

## Run locally

Prerequisite: Node.js 20+.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build and run tests:

```powershell
npm run build
npm test
```

## Scope and data status

- The basemap is OpenStreetMap, attributed inside the map.
- All walkway overlay geometry, route results, shade values, footfall, costs and benefits currently use visibly labelled **DEMO / ILLUSTRATIVE** fixtures. They are not verified navigation or field observations.
- Optimisation is a deterministic exhaustive subset search that honours budget, exclusions and mutual constraints; overlapping segment benefits are not double-counted.
- Before/after outputs are **SIMULATED**, retain baseline data, and make no cooling, energy, carbon or beneficiary claim.
- Lifecycle actions are prototype-only and never real UTM approval/construction.
- The AI UI/service contract is reserved but no pretrained inference is yet integrated because no permitted imagery or model environment was supplied. See [data dictionary](docs/DATA_DICTIONARY.md).

## Handoff boundaries

Shared types are in `src/types.ts`, fixtures in `src/fixtures.ts`, domain algorithms in `src/domain.ts`, and endpoint shapes in [API contracts](docs/API_CONTRACTS.md). Builders should preserve those stable IDs and status fields when replacing fixture seams.
