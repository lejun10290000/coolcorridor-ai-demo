# Calculated routing v4 integration handoff

Calculated routing and the final selected-route overlay are integrated in the **normal application entry**. Builder 1 (@npz5868b-afk) [agreed to the exact App/map/shared-documentation scope on PR #6](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/6#issuecomment-6234657305) before shared edits. No conditions were added. The routing head ec168b0 and parent ed9ae4d were rechecked against GitHub/fetch before applying the prepared patches. PR #3/#5/#6 remained open/unmerged. Work stays on feature/dynamic-route-recalculation, stacked onto feature/developer-shade-update-workflow. No main commit, merge, force-push or discarded work.

## Integrated behavior

`App.tsx` now uses `CalculatedResident`; the obsolete Resident implementation and hard-coded route IDs/metrics are removed. Home/Three.js and DeveloperWorkspace still use the existing root useWorkflow state. Resident receives the authoritative currentSnapshot, recomputes on entry and snapshot change, and never consumes simulated or historical Developer selections. Both objective cards, status text, route metrics and SVG IDs/version derive from the same RouteComparison.

- **Shortest route** minimises summed positive metre lengths; equal-distance ties use stable segment IDs, never shade.
- **Most shaded practical route** searches every loop-free path within computed shortest distance ×1.25, then minimises ranking cost, distance and stable IDs. It does not simply reject the unrestricted optimum. Exactly25% is accepted with tolerance1e-9×max(1,limit_m) metres. If no permitted score improves shortest, both cards show shortest and explain the fallback.
- Both cards remain for identical ordered paths, with the exact explanation: Both criteria select the same illustrative path with current data.
- Initial bothS03/190m. Publishing DEMO S03 as exposed gives shortestS03/190m, practicalS01+S02/198m, detour8m/4.2%, cap237.5m, rankingcost145 metre-equivalents. Duration assumes1.2m/s, rounded up:2min39s/2min45s.
- Weights: exposed1,mixed0.5,shaded0,unknown1. Mixed is a prototype assumption; unknown remains grey with separate metres/coverage/penalty. Cost is not measured exposed distance/shade percentage/temperature. Known DEMO/model classifications are not field evidence; manually observed/reviewed provenance length is separate.
- The explicit graph uses original fictional metre fixtures; PNG display points never become metres/GPS. S04 is drawable/inspectable but excluded without length/split connector topology. Invalid/no-path inputs return unavailable results/warnings, not fake zero metrics.

The small DEMO graph uses constrained simple-path enumeration with distance pruning/loop prevention; dense graphs have factorial path counts and O(V) depth. Replace this with constrained multi-label search before a large surveyed network. No navigation readiness is claimed.

## Map selection and interaction

CampusImageMap mounts SelectedRouteOverlay **after the entire base shade layer**. Each selected calculated segment has an11px white halo,8px purple casing and3px original shade centre, with non-scaling SVG strokes and ordered-ID/version metadata. The previous underlying purple outline is removed. Nonselected shade paths remain visible. Pointer events pass through to existing segment inspection/hit testing. Endpoints/candidates/reports retain their existing placement and behavior. No map prop/public type/PNG/pixel-geometry change was required.

The selected-route status lists the active objective, ordered IDs and current dataset version. Desktop/mobile screenshots show the route casing at full-map zoom. Normal-entry browser acceptance checks actual rendered overlays against card IDs/version, retained shade colours, final-layer order, pointer inspection, image/SVG alignment after zoom/pan/reset/resize, no overflow and immediate objective switching.

## Publication and validation

Publishing a verified observation creates a new immutable current snapshot. Both same-tab Developer→Home→Resident switching and another same-origin/profile tab's publication use the latest version automatically, without a route-refresh button/reload. Scenario projections and historical baseline selection cannot change Resident recommendations; submission/verification alone do not update current shade. Original snapshots and DEMO provenance remain intact.

Existing inline future-date validation (including year3333), retained values/focus/ARIA associations and separate trimmed/case-folded field-reviewer guard remain tested. Verification follows under_review. New reviews optionally carry review_policy=separate-field-reviewer-v1; old unmarked history remains readable without reset. Matching-alias legacy field evidence cannot be newly published; older published evidence is disclosed. Aliases are not identity authentication.

Persistence is local to the browser origin/profile, never another device/profile/person. No backend/cloud database/authentication was added. Full/blocked storage retains session state with an explicit warning; it does not establish durable or cross-device sharing. Reports remain separate from footfall.

## Actual checks against normal production root

- `npm test`: **79 tests passed across seven files**. Includes 26% rejection, inclusive25%, the crucial in-cap alternative when the global optimum exceeds the cap, shade-independent ties, stable practical ties, no-worse-score fallback, unknown/invalid/no-path/scenario/publication, reviewer/date/storage and UI contracts.
- `npm run build`: passed. Existing cinematic >500kB chunk warning remains.
- `npx vite build --config review/vite.dynamic-routing.config.ts`: passed for optional review pages.
- `review/check-dynamic-routing.cjs` at **http://127.0.0.1:4182/**: passed. Actual normal entry renders two calculated cards, no obsolete Compare demo routes button. Mounted Resident automatically changes after second-tab publication; same-tab role switching, history/scenario isolation, selected SVG IDs/status/version, shade centres/paint order, mouse inspection, desktop/mobile zoom/pan/reset/resize/alignment, refresh persistence and inline validation all pass. Zero external requests/page errors observed.
- `review/check-developer-workflow.cjs` at that same **normal root**: passed. Resident reports/Developer filtering/review,RM20k/RM10k/zero/exclusions/stale plan,scenario,lifecycle,immutable publication/history,unknown grey,map alignment,corrupt/quota recovery and zero external requests/page errors.
- PNG SHA256 remains826872744A8F2CDDCCBA84D7C380E2288F0D52199235A9E928E46659F6EA4247. Protected fixtures/types/solver/Home/dependencies unchanged.

All browser inputs are synthetic; no genuine UTM field survey, construction approval, measured cooling or AI inference is claimed. Normal-entry integration is tested; field/navigation/presentation-hardware acceptance remains separate.

Results and screenshots: `outputs/routing-normal-entry/`, including initial map/cards, post-publication shortest/practical maps, both objective selections at desktop/mobile, zoom/pan captures, future-date/reviewer errors and matching Developer workflow history in workflow-regression/. Screenshots were opened for visual review. Earlier v3/v4 independent-output folders remain historical preview evidence, not the proof of this normal-entry integration.

## Run and reproduce

```powershell
npm install
npm run dev
# Open the ordinary URL printed by Vite and enter Resident.
npm test
npm run build
npx vite preview --host 127.0.0.1 --port 4182 --strictPort
```

In a separate terminal, using the externally supplied browser runtime (no new app dependencies):

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:ROUTING_APP_URL='http://127.0.0.1:4182'
$env:ROUTING_ENTRY_URL='http://127.0.0.1:4182/'
$env:ROUTING_OUTPUT_DIR='outputs/routing-normal-entry'
node review/check-dynamic-routing.cjs
$env:WORKFLOW_APP_URL='http://127.0.0.1:4182'
$env:WORKFLOW_ENTRY_URL='http://127.0.0.1:4182/'
$env:WORKFLOW_OUTPUT_DIR='outputs/routing-normal-entry/workflow-regression'
node review/check-developer-workflow.cjs
```

The separate review page and overlay specimen remain optional. Applied pending patch files were removed to prevent accidental reapplication.

## Operator acceptance

1. Open normal app→Resident. Both cards initiallyS03/190m; select each and inspect status/map. UnknownS04 remains grey.
2. Open Developer in another same-origin tab. Optimise at RM20k; change a hypothetical S03 scenario and confirm Resident stays unchanged.
3. Move INT-03 sequentially to installed. Record a clearly fictional DEMO S03-exposed observation with valid past Malaysia time, then start review, verify and publish. Only publication changes current shade.
4. The already-open Resident updates without refresh: shortestS03/190m; practicalS01+S02/198m within cap. Select each, inspect matched outlines, zoom/pan/reset, and test mobile layout.
5. Inspect old baseline/history, switch modes in the same tab, then refresh; current local version persists when storage works. Try year3333 to see the inline retained-input error. Do not enter synthetic test inputs as real field data.

PR #6 is for operator review. Do not merge PR #3/#5/#6 automatically. Map reuse permission, surveyed walkability/accessibility/lengths, genuine shade evidence, AI inference, multiuser backend and hardware/manual acceptance remain outstanding beyond this routing task.
