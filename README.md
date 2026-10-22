> Current map alignment: both modes now use the exact 1113 × 1414 annotated reference supplied on 18 October 2026. See [reference alignment and saved-data compatibility](docs/REFERENCE_MAP_ALIGNMENT.md). Earlier 1290 × 1640 map notes below describe the previous image. The old asset and evidence remain preserved.

# CoolCorridor AI — Phase 0 prototype

An interactive, laptop-first prototype for the UTM Kuala Lumpur pilot: Resident route/evidence/report flow and Developer manual map updates, report review, budget optimisation and scenarios.

Phase 0B adds an approved cinematic Home screen with a genuine Three.js 360° orbit around an original fictional township. Its two portals enter the existing Resident and Developer modes. See the [Home implementation and provenance notes](docs/LANDING_PHASE0B.md), [desktop screenshot](outputs/phase0b-desktop-1440.png), [mobile screenshot](outputs/phase0b-mobile-390.png) and [motion preview](outputs/phase0b-motion-preview.mp4).

## Run locally

Prerequisite: Node.js 24 LTS (the Vercel deployment also uses Node 24).

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

## Public hosting

The Vercel configuration builds with Node.js 24 and publishes only `dist/`, with a restrictive content security policy and browser security headers. Never expose the Vite development/preview server publicly. See [deployment instructions, security checks and limitations](docs/DEPLOYMENT_SECURITY.md). This remains a browser-local DEMO: Developer actions and reports do not synchronize between different visitors.

## Scope and data status

- Resident and Developer use the supplied campus reference with its printed Main Gate–Klinik example route removed and endpoint dots normalized (`public/maps/utmkul-reference-normal-points.png`), fitted to the original1113×1414 coordinate frame with aligned interactive SVG overlays. The original JPEG and earlier edits are retained. See [background edits and prompts](docs/MAP_BACKGROUND_EDIT.md). No online map tiles are requested. The image is not georeferenced; its original creator/reuse licence is unconfirmed and permission must be checked before public deployment.
- All walkway overlay geometry, route results, shade values, footfall, costs and benefits currently use visibly labelled **DEMO / ILLUSTRATIVE** fixtures. They are not verified navigation or field observations.
- Developer can select multiple point-to-point routes or individual path links, choose Unshaded / Mixed shaded / Fully shaded (DEMO classes), and save a Developer draft. Review the changes, enter a publication note and choose **Publish to Resident map** to create a new immutable version. Resident routing automatically recalculates from published versions, including in another tab at the same origin; drafts are excluded. See [editing and publication instructions](docs/DEVELOPER_MAP_SHADE.md).
- Resident reports use only the two points clicked manually on the map. The report form automatically shows those endpoints as read-only fields; routing dropdowns/cards do not set report points. Use **Choose report points on map** to start a fresh pair, then **Report selected route** and describe the problem (for example, a broken shade structure). Developer **Accept report** immediately publishes yellow/mixed shade for the saved path; rejection leaves shade unchanged. Resident maps show no report counts; Developer maps count only pending reports and clear their badges after acceptance/rejection. Reports remain in history. Repairs use the manual shade editor and a separate publication. See [report instructions and actual tests](docs/ROUTE_REPORT_SYSTEM.md).
- Optimisation is a deterministic exhaustive subset search that honours budget, exclusions and mutual constraints; overlapping segment benefits are not double-counted.
- Before/after outputs are **SIMULATED**, retain baseline data, and make no cooling, energy, carbon or beneficiary claim.
- The installation/observation/review/publish panel has been removed from Developer mode at the operator's request. Use manual map updates or accept route reports to publish shade changes; stored observation/lifecycle history is preserved.
- The AI UI/service contract is reserved but no pretrained inference is yet integrated because no permitted imagery or model environment was supplied. See [data dictionary](docs/DATA_DICTIONARY.md).
- The Home world's route, buildings and shade cues are fictional concept art, separate from the supplied campus illustration used inside the modes. No UTM or Sime Darby Property logo or photo is used.

## Handoff boundaries

Shared types are in `src/types.ts`, fixtures in `src/fixtures.ts`, domain algorithms in `src/domain.ts`, and endpoint shapes in [API contracts](docs/API_CONTRACTS.md). Builders should preserve those stable IDs and status fields when replacing fixture seams.

## Campus map controls and provenance

Select a route card to outline its segment IDs in purple while retaining the shade colours. Select a segment by click/tap or Enter/Space to update the evidence inspector. Zoom from 100% to 300%, drag or use arrow keys when zoomed, and reset with Full map, Recenter or Home. Image-load errors hide overlays and offer a local retry; there is no online fallback.

Pixel display geometry is in `src/campusMapDisplay.ts`, separate from WGS84 geometry (currently unavailable). Both modes share the same image, segment IDs and display data. All paths and crossings require field checks. The normal Resident entry calculates Shortest route and Most shaded practical route from the current published snapshot. The practical path minimises exposure-ranking cost within 25% of shortest distance; route metrics use legacy DEMO metre fixtures, never image pixels. The current reference network lets users choose two source circles; older S03/190m examples below are historical test fixtures. These are algorithm demonstrations, not surveyed navigation. Image inference and shade measurement remain unavailable.

See [map handoff, tests and source notes](docs/CAMPUS_MAP_HANDOFF.md) and [data dictionary](docs/DATA_DICTIONARY.md). The optional standalone review at `/review/campus-map.html` is available with the dev server; it is a test harness, not the operational app.

## Developer manual map updates and versioned publication

The Developer inbox lists all reports; the inspector can also filter to reports covering its selected link. New reports save the exact route links, endpoints, objective and source dataset. A Developer's explicit Accept action records review and publication atomically; older single-link reports retain their original review history and separate legacy review controls. Reports remain separate from footfall.

“Candidates eligible for optimisation” means checked candidates **may** be selected, not that they are in the calculated portfolio. Enter whole RM (0–1,000,000,000; default RM20,000) and click **Optimise plan**. Changing the budget/eligibility marks the plan stale and hides previous site highlights until recalculation. Benefit values are illustrative scores, never measured shade/cooling results.

Use **Baseline / Simulated scenario** and explicit per-segment projection controls to preview hypothetical shade classifications. No projection is assumed by default. Historical snapshots can be viewed without changing the current published dataset.

Use **Edit map shade** to select point-to-point paths, apply a category to the Developer draft, review the changes and choose **Publish to Resident map**. Accepting a valid route report also publishes its saved links as mixed shade. A repair requires a later manual update. Previous snapshots and stored evidence history remain inspectable; removing the old installation panel does not clear saved data.

State is persisted only in this browser under `coolcorridor-shade-workflow-v1`, with guarded schema validation and visible corruption/storage-failure warnings. It is not a central database, production authentication or tamper-proof audit log. Observation evidence remains a text reference. Point reference photos are prepared and saved separately in local IndexedDB; no photo is uploaded to a server. No GPS or location permissions are used.

See the [manual map workflow](docs/DEVELOPER_MAP_SHADE.md), [route reports](docs/ROUTE_REPORT_SYSTEM.md) and [schema/provenance](docs/DATA_DICTIONARY.md). The [older observation workflow handoff](docs/DEVELOPER_SHADE_WORKFLOW.md) documents retained historical functionality, not the current Developer screen.

To exercise the production workflow with the optional separately supplied Playwright/Chromium runtime:

```sh
npm run build
npm test
npx vite preview --host 127.0.0.1 --port 4183 --strictPort
# In another terminal, with Playwright and Chrome available:
node review/check-developer-map-shade.cjs
node review/check-route-reports.cjs
```

Set `PLAYWRIGHT_MODULE` / `CHROME_PATH` if they are outside the default lookup locations; `ALIGNMENT_APP_URL` defaults to `http://127.0.0.1:4183`. No app dependency installation changes are required.

## Calculated Resident routing

[Builder 1 approved the v4 App/map/documentation scope](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/6#issuecomment-6234657305). Open the ordinary app URL, enter Resident, and choose **Shortest route** or **Most shaded practical route**. Both cards remain when paths coincide. The selected route text, card IDs/version and final purple casing follow the same calculated result; white halo and shade-coloured centre preserve selection and evidence at full-map zoom.

Shortest uses distance alone, then stable IDs. Practical searches all loop-free paths no longer than shortest ×1.25, minimises ranking cost, then distance and stable IDs. Unknown weighs1×length and stays grey/Unknown, with separate unknown coverage/penalty; mixed0.5 is an assumption, not measured shade fraction. If no permitted path improves the shortest score, both cards show shortest with a reason. The small DEMO enumeration needs replacement before a large surveyed network.

Only current published snapshots drive Resident routes. Publication automatically recalculates the open Resident view, including another tab on the **same origin/profile**; scenarios and historical Developer views cannot change it. Publishing DEMO S03 as exposed gives shortestS03/190m and practicalS01+S02/198m, a4.2% detour. A genuine field record requires a different trimmed/case-folded reviewer alias after under_review; aliases are not authentication. Data never synchronises to another device/profile/person. Full/blocked storage is session-only with a warning.

See [current routing handoff and exact normal-entry acceptance commands](docs/DYNAMIC_ROUTING_HANDOFF.md). The separate review pages are optional test harnesses; users do not need them for calculated routing. No GPS, online tiles, backend or dependencies were added.

## Point photo references

Both maps use a live legend with the current From/To names, shade categories, selected paths and photo markers. The old printed fixed-route key is hidden without modifying the source image or graph coordinates. See [shared map information](docs/MAP_INFORMATION.md).

Click a campus point in either role to open its closable reference photo panel. Darker, slightly larger points have published photos. The15 operator-confirmed photos are included, including the corrected Klinik, Cafe/MJIIT, Library, Reference15 and Reference09 assignments. Photo-only corridor points do not become route endpoints.

In Developer, use **Edit shade / publish → Point photos / publish references**. Existing photos offer **Update photo** or **Delete published photo**; empty points offer **Upload photo**. Updating opens the file picker directly and keeps the current image visible until the replacement is reviewed and explicitly published to Residents. To remove a published reference, add a publication note, choose **Delete published photo**, then confirm. Deletion updates both roles, keeps the previous image in history and preserves any private replacement draft. Drafts remain private to the editor. Publication updates an already-open Resident tab on the same browser origin/profile; it does not change shade or routes. Photos are stored separately from shade/report history in IndexedDB. There is no remote publication service or production authentication.

See [point-photo workflow and source mapping](docs/POINT_REFERENCE_PHOTOS.md). Run `node review/check-point-photos.cjs` against the normal production preview for acceptance checks (including upload errors, concurrent edits, failed-save isolation and mobile panel closing).

## Resident report photos

Resident walkway reports can also include an **optional reference photo**. Preview or remove it before submitting; Developer can view/enlarge it beside the report when deciding to accept or reject. Photo attachments do not update map-point photos or shade automatically. See [report photo workflow and limits](docs/REPORT_REFERENCE_PHOTOS.md).

## Resident walkthrough

Choose your start and destination, select the shortest or most shaded route, then choose **Start selected route**. The route stays locked while the next graph point and its published photo appear. Press **Next** after reaching that point; use **Previous point** to correct an accidental advance. Confirm the destination and choose **Finish walk**, or **Exit walk / change route** to replan earlier. A new Developer baseline does not silently change a walk in progress; exit to use its recalculated routes. This is a manual illustrative preview without GPS or verified navigation. Refreshing or leaving the role ends walkthrough progress. See [workflow and validation](docs/RESIDENT_WALKTHROUGH.md).
