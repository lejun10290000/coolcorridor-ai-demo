# Dynamic routing v3 — independent implementation and pending integration

Branch: `feature/dynamic-route-recalculation`, based on PR #5 head `ed9ae4ddc72dc44a8c450077d3f9d7271b2b3438`. PR #3 and #5 were open/unmerged when checked; PR #4 had merged into the application branch. No main commit, merge, force push or shared-branch overwrite is part of this delivery.

**Integration is pending Builder 1 agreement.** The production `src/App.tsx` is unchanged and still contains the parent PR's legacy Resident cards. The working calculated Resident is `src/routing/CalculatedResident.tsx`; an independent review entry exercises it with the existing Developer workspace and the same authoritative `useWorkflow` state. This is a tested preview, not a claim that the production entry is integrated. Coordination: [PR #5 request](https://github.com/lejun10290000/coolcorridor-ai-demo/pull/5#issuecomment-6233434860). The operator explicitly required waiting for agreement before shared-file edits; AGENTS.md §8 also requires agreement. The previous PR #3 agreement covered the earlier workflow scope.

After agreement, recheck the parent head and overlapping edits, then review/apply `review/app-integration.pending.patch` (check with `git apply --unidiff-zero --check` first). Apply this zero-context patch with `git apply --unidiff-zero` only after comparing the current App with parent ed9ae4d. It replaces only the legacy Resident implementation with the prepared component; the Home role selector, root shared state and Developer workspace remain. Rerun both acceptance runners against the production entry before marking ready. Existing README/API/data-dictionary updates should then link this document; those shared files are intentionally not edited before coordination.

## Run the preview

From the repository root, with existing dependencies installed:

```powershell
npm test
npm run build
npx vite build --config review/vite.dynamic-routing.config.ts
npx vite preview --config review/vite.dynamic-routing.config.ts
```

Open `http://127.0.0.1:4181/review/dynamic-routing.html`. This separate production review build lives in ignored `work/dynamic-routing-review`; it does not replace `dist` or the production HTML entry. `npm run dev` continues to show the parent application until approved integration.

Browser acceptance uses Playwright/Chrome supplied externally, with no new application dependency:

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
node review/check-dynamic-routing.cjs
$env:WORKFLOW_APP_URL='http://127.0.0.1:4181'
$env:WORKFLOW_ENTRY_URL='http://127.0.0.1:4181/review/dynamic-routing.html'
$env:WORKFLOW_OUTPUT_DIR='outputs/dynamic-route-recalculation/workflow-regression'
node review/check-developer-workflow.cjs
```

## Five confirmed decisions

1. Unknown shade has ranking weight **1.0 × metre length**. It remains grey/Unknown, with unknown metres and coverage reported separately. This penalty is not measured exposed distance.
2. Calculations run on Resident entry and whenever the current snapshot changes. There is no refresh/compare button. A successful same-origin publication from another tab updates an already mounted Resident through the existing guarded storage listener.
3. Both objective cards remain. Identical segment sequences show: “Both criteria select the same illustrative path with current data”. Initially both select S03 at 190 m; the old 198 m “Shortest” label is removed in the preview.
4. Field verification requires a reviewer alias different from the observer after trim/case folding, enforced in the domain and publication guard. Verification follows `under_review`. Defaults are Demo observer/Demo reviewer. Different aliases do not authenticate different people. DEMO entries remain DEMO.
5. Persistence is local to the same browser origin/profile. It does not synchronise to another computer, phone, profile or person. There is no backend/authentication. Browser refresh retains saved data when storage works; blocked/full storage retains session changes with the existing warning.

## Routing contract and provenance

`compareRoutes(snapshot, graph?, origin?, destination?, config?)` is a pure synchronous local function, not an HTTP endpoint. It returns dataset/graph versions, both objective results or null, same-path flag, configuration and warnings. Each result includes ordered segment/node IDs, distance, duration, exposure ranking cost, separate known-label cost and unknown penalty, known/unknown metres and percentages, observed/reviewed provenance metres, edge evidence and warnings. `RouteCards` and `MapPanel.routeIds` consume the same selected result. No separate maintained route-ID list drives highlights.

The DEMO graph is explicitly configured in `src/routing/graph.ts`:

| Segment | Illustrative endpoints | Existing DEMO length |
|---|---|---:|
| DEMO-S01 | MAIN-GATE ↔ DEMO-JUNCTION | 92 m |
| DEMO-S02 | DEMO-JUNCTION ↔ KLINIK | 106 m |
| DEMO-S03 | MAIN-GATE ↔ KLINIK | 190 m |

S04 remains drawable/inspectable but is excluded from search: it meets the interior of S02 in the illustration and lacks split network topology and a defensible length. No pixel coordinates become metres, GPS coordinates or surveyed topology. These legacy metre values are fictional test inputs. Pending pedestrian verification is allowed only as an explicitly illustrative graph; blocked/unusable, missing or invalid-length edges are excluded. Graph/access/crossings/accessibility still need survey before navigation use.

Dijkstra search minimizes summed length for Shortest, and summed `length × shade_weight` for Lower estimated sun exposure. Defaults: exposed 1, mixed 0.5, shaded 0, unknown 1. Mixed 0.5 is a chosen algorithmic assumption, not a measured shade fraction. Unknown weight must remain 1. Weights and walking speed are validated configuration. Ties use the other objective, then stable segment-ID order. Duration is `ceil(distance / 1.2 m/s)`: 190 m → 2 min 39 s; 198 m → 2 min 45 s. No detour cap is currently configured. A future configured cap must be explicit.

The current published snapshot supplies edge lengths, labels, source/status and observation times. Simulated inputs are refused. Missing length is never zero. Disconnected/invalid inputs yield warnings and unavailable results, not fabricated metrics. Known-label coverage includes fictional DEMO classifications and is not field-evidence coverage; observed/reviewed provenance length is separate. No solar/temperature model is claimed.

## Review, validation and storage contract additions

`commit(update, onFailure?)` still returns boolean; optional `onFailure` receives the same Error used for the global notice. `ObservationValidationError` adds a field name while preserving the authoritative domain message. Failed submissions keep the form/values open and focus the failing input. The date input has a current Malaysia maximum; domain validation rejects impossible, malformed and future dates even when native validation is bypassed. Year3333 produces exactly “Observation time cannot be in the future.” near the form with `role=alert`, `aria-invalid` and an associated description. Success copy is emitted only after a true commit.

New review events include optional `review_policy: 'separate-field-reviewer-v1'`. Schema version/storage key remain 1/`coolcorridor-shade-workflow-v1`: no reset or destructive migration. The decoder validates this marker and its separate-alias rule. Unmarked historical events remain readable so older published snapshots are not discarded. Legacy matching-alias field records cannot be newly published, and their evidence panel warns that the older record does not establish separate review. This local integrity check is not tamper-resistant authentication.

Installation, raw observation, human review and publication stay distinct. Only publication creates the next immutable current snapshot. Reports stay separate from footfall. Explicit simulated projections affect only copied scenario overlays. The existing optimiser, fixtures, shared public types, map PNG/pixel geometry, Home/Three.js and dependency manifests remain intact.

## Actual validation

- `npm test`: 72 tests passed across six files, including routing invalid inputs/no path, unknown penalty/coverage, deterministic ties, publish-triggered change, separate-reviewer rejection and date regression.
- `npm run build`: passed; existing cinematic chunk-size warning remains.
- Independent Vite review build: passed.
- `review/check-dynamic-routing.cjs`: passed against the built preview. Checks automatic updates in an already mounted Resident after second-tab publication, matching rendered route outlines, scenario isolation, preserved future-date input/focus, alias rejection and separate-alias acceptance, local refresh, desktop/mobile layout and zero external requests/page errors.
- Existing full Developer workflow runner: passed against that same preview, including report review, RM20k/RM10k/zero/exclusions, scenario, immutable publication/history, unknown grey, map alignment, corrupt storage and quota recovery. Outputs are saved separately from the parent PR's screenshots.

All browser/domain inputs are synthetic test fixtures. No real campus survey, genuine field observation, construction approval or pretrained vision inference was performed in this routing task. AI-complete and navigation-ready claims remain unsupported.

## Evidence and manual acceptance

New screenshots/results: `outputs/dynamic-route-recalculation/`. The `workflow-regression` subfolder includes report review, optimiser, scenario map/comparison, observation form, verified unpublished state, published Developer dataset and Resident evidence/history.

In the preview, start Resident: both cards use S03/190m. Open Developer in another same-origin tab, optimise and edit an S03 hypothetical projection; Resident must stay unchanged. Move INT-03 sequentially to installed, enter a clearly fictional DEMO S03 exposed observation at a valid past Malaysia time, submit, start review, verify and publish. Before publish, Resident stays unchanged. After publish, its open cards automatically become shortest S03/190m and exposure S01+S02/198m, cost145. Click each and inspect matching purple map outlines. Compare historical baseline, then refresh and confirm saved version. The automated browser fixture also demonstrates future-date and reviewer-alias failures; its field-mode fixture is synthetic, not genuine field evidence.

Remaining dependency: recorded Builder 1 agreement and approved production-entry integration/retest. No PR is to be merged automatically.
