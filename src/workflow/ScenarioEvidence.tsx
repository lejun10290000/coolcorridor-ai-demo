import { shadeColours, shadeLabels } from '../campusMapDisplay'
import type { CurrentSegment, Scenario } from './model'

export function ScenarioEvidence({segment,scenario,baseline}:{segment:CurrentSegment;scenario:Scenario;baseline:()=>void}){
  const projection=scenario.projections.find(p=>p.segment_id===segment.segment_id)
  return <aside className="wf-panel wf-evidence" aria-label="Simulated segment comparison"><span className="chip simulated">SIMULATED / ASSUMPTION</span><h2>{segment.name}</h2><p>{segment.segment_id}</p><p>Latest published baseline: {shadeLabels[segment.shade_label]}</p><p><span className="wf-swatch" style={{background:shadeColours[projection?.projected_label??segment.shade_label]}}/>Simulated map: {shadeLabels[projection?.projected_label??segment.shade_label]}</p><p>{projection?.projected_label?'Explicit hypothetical projection; not published shade evidence.':'No active projection for this link. It follows the latest published baseline.'}</p><p className="wf-version">Based on {scenario.baseline_version}</p><p>Scenario changes stay in this planning workspace. Resident routing uses published baseline shade.</p><button onClick={baseline}>Return to published map</button></aside>
}
