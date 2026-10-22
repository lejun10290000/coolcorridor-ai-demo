import { shadeColours, shadeLabels } from '../campusMapDisplay'
import type { CurrentSegment, Scenario } from './model'

export function ScenarioEvidence({segment,scenario,baseline}:{segment:CurrentSegment;scenario:Scenario;baseline:()=>void}){
  const projection=scenario.projections.find(p=>p.segment_id===segment.segment_id)
  return <aside className="wf-panel wf-evidence" aria-label="Simulated segment comparison"><span className="chip simulated">SIMULATED / ASSUMPTION</span><h2>{segment.name}</h2><p>{segment.segment_id}</p><p>Published baseline: {shadeLabels[segment.shade_label]}</p><p><span className="wf-swatch" style={{background:shadeColours[projection?.projected_label??segment.shade_label]}}/>Simulated: {shadeLabels[projection?.projected_label??segment.shade_label]}</p><p>{projection?.projected_label?'Hypothetical only; not published shade evidence.':'No projection for this link; published shade is shown.'}</p><p className="wf-version">Based on {scenario.baseline_version}</p><p>Planning-only. Resident routing still uses the published baseline.</p><button onClick={baseline}>Return to published map</button></aside>
}
