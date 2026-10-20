# Resident point-by-point walkthrough

Plan a journey by selecting a start and destination, choose **Shortest route** or **Most shaded practical route**, then choose **Start selected route**. A complete calculated route is required; missing, equal or disconnected endpoints cannot start a walk.

The walkthrough locks the chosen ordered segment IDs, graph node IDs and published dataset snapshot. It shows the next graph point, its current published reference photo (when available), and the last point confirmed by the Resident. The shared map keeps the entire chosen route highlighted. A blue ring marks the last confirmed point; an orange ring marks the next point. Internal graph junctions are included even though they are not selectable routing endpoints. No extra paths, positions or turn instructions are invented.

**Next** confirms arrival at the displayed next point and advances one edge. It does not read GPS or infer movement. The destination is presented as the final next point; only confirming that step produces **Destination reached**. **Previous point** corrects an accidental advance, including after arrival. **Finish walk** unlocks planning after arrival; **Exit walk / change route** exits at any earlier step. Map photo inspection, pan, zoom and reset stay available, but map clicks cannot change route endpoints or progress during the walkthrough. Route reporting and objective selection return after exit.

Published photos remain current independently of the route snapshot. A deleted or unavailable reference shows an honest no-photo state; a failed image load shows an error. Photos are reference views, not verified shade measurements or proof of safe access. This is an illustrative, manually advanced demo, not live navigation. Graph connections, route lengths, crossings and accessibility remain unsurveyed.

## Publication while walking

Developer shade publication still recalculates the underlying planning comparison from the latest baseline. An active walk deliberately retains its original route, map colours and version until exit. A newer-map notice explains this. Exiting reveals the latest recalculated comparison; a subsequent walk starts from that new version. Draft Developer changes and simulated scenarios never drive Resident routes.

## Integration and compatibility

- `walk.ts` defines `WalkSession { route, snapshot, next_index }` and pure begin/advance/previous/progress operations. `next_index` starts at 1 and ends at the node count. Begin validates point/edge order, directions, IDs and snapshot consistency, then copies route/snapshot data.
- `CalculatedResident` owns the walkthrough for the current role session. No walk progress is written to localStorage or IndexedDB. Refreshing, Home or leaving the role ends the session without changing persisted reports, shade or photos.
- `WalkPanel` shows progress and current published photos. It never mutates route or baseline records.
- `CampusImageMap` adds optional `walkPosition?: {current: string; next: string|null}` for point rings and visibility of internal junctions. Existing callers and Developer behavior remain unchanged when it is absent.
- No backend, dependencies, HTTP endpoints or persistent data schema changes were added. The existing 60/40 desktop layout and stacked phone layout are retained.

## Reproduce

Run `npm run dev` and enter Resident mode at the normal app URL. Choose Main Gate → Klinik UTM, select a route, start, and confirm the points through to arrival. Test a reverse journey and a short single-link journey. In another same-origin Developer tab, publish a baseline shade change during a walk, then verify the walk stays fixed until exit.

Automated checks: `npm test`, `npm run build`, and `node review/check-resident-walk.cjs` against a production preview at http://127.0.0.1:4183/. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` when needed. Browser checks use isolated contexts and synthetic publications. Results and screenshots are in outputs/resident-walk/.
