> Current map alignment: both modes now use the exact 1113 × 1414 annotated reference supplied on 18 October 2026. See [reference alignment and saved-data compatibility](docs/REFERENCE_MAP_ALIGNMENT.md). Earlier 1290 × 1640 map notes below describe the previous image. The old asset and evidence remain preserved.

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

- Resident and Developer use the supplied campus reference with its printed Main Gate–Klinik example route removed and endpoint dots normalized (`public/maps/utmkul-reference-normal-points.png`), fitted to the original1113×1414 coordinate frame with aligned interactive SVG overlays. The original JPEG and earlier edits are retained. See [background edits and prompts](docs/MAP_BACKGROUND_EDIT.md). No online map tiles are requested. The image is not georeferenced; its original creator/reuse licence is unconfirmed and permission must be checked before public deployment.
- All walkway overlay geometry, route results, shade values, footfall, costs and benefits currently use visibly labelled **DEMO / ILLUSTRATIVE** fixtures. They are not verified navigation or field observations.
- Developer can select multiple point-to-point routes or individual path links, choose Unshaded / Mixed shaded / Fully shaded (DEMO classes), and save a Developer draft. Review the changes, enter a publication note and choose **Publish to Resident map** to create a new immutable version. Resident routing automatically recalculates from published versions, including in another tab at the same origin; drafts are excluded. See [editing and publication instructions](docs/DEVELOPER_MAP_SHADE.md).
- Resident can report a selected point-to-point route with a required problem description (for example, a broken shade structure). Developer reviews it in **Review Resident reports**, previews the saved path, and chooses **Accept report** to immediately publish yellow/mixed shade for that exact path in both modes. Rejection leaves shade unchanged. After a repair, use the manual shade editor and publish a separate update. See [route report instructions and actual tests](docs/ROUTE_REPORT_SYSTEM.md).
- Optimisation is a deterministic exhaustive subset search that honours budget, exclusions and mutual constraints; overlapping segment benefits are not double-counted.
- Before/after outputs are **SIMULATED**, retain baseline data, and make no cooling, energy, carbon or beneficiary claim.
- Lifecycle actions are prototype-only and never real UTM approval/construction.
- The AI UI/service contract is reserved but no pretrained inference is yet integrated because no permitted imagery or model environment was supplied. See [data dictionary](docs/DATA_DICTIONARY.md).
- The Home world's route, buildings and shade cues are fictional concept art, separate from the supplied campus illustration used inside the modes. No UTM or Sime Darby Property logo or photo is used.

## Handoff boundaries

Shared types are in `src/types.ts`, fixtures in `src/fixtures.ts`, domain algorithms in `src/domain.ts`, and endpoint shapes in [API contracts](docs/API_CONTRACTS.md). Builders should preserve those stable IDs and status fields when replacing fixture seams.

## Campus map controls and provenance

Select a route card to outline its segment IDs in purple while retaining the shade colours. Select a segment by click/tap or Enter/Space to update the evidence inspector. Zoom from 100% to 300%, drag or use arrow keys when zoomed, and reset with Full map, Recenter or Home. Image-load errors hide overlays and offer a local retry; there is no online fallback.

Pixel display geometry is in `src/campusMapDisplay.ts`, separate from WGS84 geometry (currently unavailable). Both modes share the same image, segment IDs and display data. All paths and crossings require field checks. The normal Resident entry calculates Shortest route and Most shaded practical route from the current published snapshot. The practical path minimises exposure-ranking cost within 25% of shortest distance; route metrics use legacy DEMO metre fixtures, never image pixels. The current reference network lets users choose two source circles; older S03/190m examples below are historical test fixtures. These are algorithm demonstrations, not surveyed navigation. Image inference and shade measurement remain unavailable.

See [map handoff, tests and source notes](docs/CAMPUS_MAP_HANDOFF.md) and [data dictionary](docs/DATA_DICTIONARY.md). The optional standalone review at `/review/campus-map.html` is available with the dev server; it is a test harness, not the operational app.

## Developer shade observations and versioned publication

The Developer inbox lists all reports; the inspector can also filter to reports covering its selected link. New reports save the exact route links, endpoints, objective and source dataset. A Developer's explicit Accept action records review and publication atomically; older single-link reports retain their original review history and separate legacy review controls. Reports remain separate from footfall.

“Candidates eligible for optimisation” means checked candidates **may** be selected, not that they are in the calculated portfolio. Enter whole RM (0–1,000,000,000; default RM20,000) and click **Optimise plan**. Changing the budget/eligibility marks the plan stale and hides previous site highlights until recalculation. Benefit values are illustrative scores, never measured shade/cooling results.

Use **Baseline / Simulated scenario** and explicit per-segment projection controls to preview hypothetical shade classifications. No projection is assumed by default. Historical snapshots can be viewed without changing the current published dataset.

For an installed prototype intervention: record a documented DEMO or genuinely observed shade entry → start review → verify/reject → explicitly publish. Publishing creates a new immutable snapshot/version shared immediately by Resident and Developer. Raw observations and review/lifecycle history remain inspectable. DEMO entries stay DEMO; an attested field entry is stored as `sample_observed` and its separately reviewed, published assessment as `human_reviewed`. No actual field records have been supplied or collected by this implementation.

State is persisted only in this browser under `coolcorridor-shade-workflow-v1`, with guarded schema validation and visible corruption/storage-failure warnings. It is not a central database, production authentication or tamper-proof audit log. Evidence is a text reference only; no photos are uploaded. No GPS or location permissions are used.

See the [Developer workflow handoff and manual acceptance path](docs/DEVELOPER_SHADE_WORKFLOW.md), [schema/provenance](docs/DATA_DICTIONARY.md), and [browser results/screenshots](outputs/developer-shade-workflow/browser-results.json).

To exercise the production workflow with the optional separately supplied Playwright/Chromium runtime:

```sh
npm run build
npm test
npx vite preview --host 127.0.0.1 --port 4180 --strictPort
# In another terminal, with Playwright and Chrome available:
node review/check-developer-workflow.cjs
```

Set `PLAYWRIGHT_MODULE` / `CHROME_PATH` if they are outside the default lookup locations; `WORKFLOW_APP_URL` defaults to `http://127.0.0.1:4180`. The older `review/check-campus-app.cjs` entry delegates to this workflow runner and retains port 4174 (or `CAMPUS_APP_URL`) for compatibility. No app dependency installation changes are required.

## Calculated Resident routing

[Builder 1 approved the v4 App/map/documentation scope](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/6#issuecomment-6234657305). Open the ordinary app URL, enter Resident, and choose **Shortest route** or **Most shaded practical route**. Both cards remain when paths coincide. The selected route text, card IDs/version and final purple casing follow the same calculated result; white halo and shade-coloured centre preserve selection and evidence at full-map zoom.

Shortest uses distance alone, then stable IDs. Practical searches all loop-free paths no longer than shortest ×1.25, minimises ranking cost, then distance and stable IDs. Unknown weighs1×length and stays grey/Unknown, with separate unknown coverage/penalty; mixed0.5 is an assumption, not measured shade fraction. If no permitted path improves the shortest score, both cards show shortest with a reason. The small DEMO enumeration needs replacement before a large surveyed network.

Only current published snapshots drive Resident routes. Publication automatically recalculates the open Resident view, including another tab on the **same origin/profile**; scenarios and historical Developer views cannot change it. Publishing DEMO S03 as exposed gives shortestS03/190m and practicalS01+S02/198m, a4.2% detour. A genuine field record requires a different trimmed/case-folded reviewer alias after under_review; aliases are not authentication. Data never synchronises to another device/profile/person. Full/blocked storage is session-only with a warning.

See [current routing handoff and exact normal-entry acceptance commands](docs/DYNAMIC_ROUTING_HANDOFF.md). The separate review pages are optional test harnesses; users do not need them for calculated routing. No GPS, online tiles, backend or dependencies were added.
