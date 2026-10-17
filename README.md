# CoolCorridor AI — Phase 0 prototype

An interactive, laptop-first prototype for the UTM Kuala Lumpur pilot: Resident route/evidence/report flow and Developer planning, budget optimisation, scenario and demo lifecycle flow.

Phase 0B adds an approved cinematic Home screen with a genuine Three.js 360° orbit around an original fictional township. Its two portals enter the existing Resident and Developer modes. See the [Home implementation and provenance notes](docs/LANDING_PHASE0B.md), [desktop screenshot](outputs/phase0b-desktop-1440.png), [mobile screenshot](outputs/phase0b-mobile-390.png) and [motion preview](outputs/phase0b-motion-preview.mp4).

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

On Home, use the chapter controls to inspect three camera views, click **360° tour** for a ten-second full camera revolution, drag the uncovered 3D world to orbit, pause motion, or choose High, Balanced or Fallback quality. The static fallback keeps both mode portals usable if WebGL is unavailable. Reduced-motion settings pause the camera and animated button surfaces on first load, and disable the automatic orbit tour.

## Scope and data status

- Resident and Developer use the bundled, operator-supplied UTM KL campus illustration (`public/maps/utmkul-campus-map.png`) with aligned interactive SVG overlays. No online map tiles are requested. The image is not georeferenced; its original creator/reuse licence is unconfirmed and permission must be checked before public deployment.
- All walkway overlay geometry, route results, shade values, footfall, costs and benefits currently use visibly labelled **DEMO / ILLUSTRATIVE** fixtures. They are not verified navigation or field observations.
- Optimisation is a deterministic exhaustive subset search that honours budget, exclusions and mutual constraints; overlapping segment benefits are not double-counted.
- Before/after outputs are **SIMULATED**, retain baseline data, and make no cooling, energy, carbon or beneficiary claim.
- Lifecycle actions are prototype-only and never real UTM approval/construction.
- The AI UI/service contract is reserved but no pretrained inference is yet integrated because no permitted imagery or model environment was supplied. See [data dictionary](docs/DATA_DICTIONARY.md).
- The Home world's route, buildings and shade cues are fictional concept art, separate from the supplied campus illustration used inside the modes. No UTM or Sime Darby Property logo or photo is used.

## Handoff boundaries

Shared types are in `src/types.ts`, fixtures in `src/fixtures.ts`, domain algorithms in `src/domain.ts`, and endpoint shapes in [API contracts](docs/API_CONTRACTS.md). Builders should preserve those stable IDs and status fields when replacing fixture seams.

## Campus map controls and provenance

Select a route card to outline its segment IDs in purple while retaining the shade colours. Select a segment by click/tap or Enter/Space to update the evidence inspector. Zoom from 100% to 300%, drag or use arrow keys when zoomed, and reset with Full map, Recenter or Home. Image-load errors hide overlays and offer a local retry; there is no online fallback.

Pixel display geometry is in `src/campusMapDisplay.ts`, separate from WGS84 geometry (currently unavailable). Both modes share the same image, segment IDs and display data. All paths and crossings require field checks. Legacy route distance/time fixtures are labelled DEMO and do not establish a shortest route. No route calculation, image inference or shade measurement was added by the map workstream.

See [map handoff, tests and source notes](docs/CAMPUS_MAP_HANDOFF.md) and [data dictionary](docs/DATA_DICTIONARY.md). The optional standalone review at `/review/campus-map.html` is available with the dev server; it is a test harness, not the operational app.
