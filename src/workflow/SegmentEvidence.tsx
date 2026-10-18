import { footfall } from '../fixtures'
import { shadeColours, shadeLabels } from '../campusMapDisplay'
import { dataStatusText, reportsForSegment } from './model'
import type { CurrentSegment, WorkflowState } from './model'

export function SegmentEvidence({segment,version,state,mode,onAction,historical=false}:{segment:CurrentSegment;version:string;state:WorkflowState;mode:'resident'|'developer';onAction:()=>void;historical?:boolean}){
  const f=footfall.find(f=>f.segment_id===segment.segment_id),source=segment.shade_source
  const observations=state.observations.filter(o=>o.segment_id===segment.segment_id)
  return <aside className="inspector wf-evidence" aria-label="Segment evidence" aria-live="polite">
    <div className="eyebrow">SEGMENT EVIDENCE {historical?'· HISTORICAL':''}</div><h2>{segment.name}</h2><code>{segment.segment_id}</code>
    <p><span className="chip">{dataStatusText[segment.shade_data_status]}</span></p><p><i className="wf-swatch" style={{background:shadeColours[segment.shade_label]}}/>{shadeLabels[segment.shade_label]}</p>
    <dl><dt>{historical?'Historical dataset version':'Current dataset version'}</dt><dd className="wf-version">{version}</dd><dt>Shade observation time</dt><dd>{segment.shade_observed_at??'Unknown / no observed timestamp'}</dd><dt>Shade source / method</dt><dd>{source?`${source.method} · ${source.source_note}`:'Initial illustrative fixture; no field observation source.'}</dd>
      {source&&(source.map_publication_id?<><dt>Developer map publication</dt><dd>{source.map_publication_id} · operator: {source.observer_label}</dd><dt>Classification status</dt><dd>{source.review_note}</dd><dt>Published at</dt><dd>{source.published_at}</dd></>:<><dt>Observation</dt><dd>{source.observation_id} · observer: {source.observer_label}</dd><dt>Human review</dt><dd>{source.reviewer_label}: {source.review_note}</dd><dt>Evidence reference (not uploaded)</dt><dd>{source.evidence_reference||'No evidence reference supplied'}</dd><dt>Published at</dt><dd>{source.published_at}</dd></>)}
      <dt>Walkability / accessibility</dt><dd>{segment.walkable_status.replaceAll('_',' ')} · {segment.accessibility_status}</dd><dt>Route geometry</dt><dd>{segment.geometry_source}</dd><dt>Length</dt><dd>{segment.length_m===null?'Unknown / needs survey':`${segment.length_m} m — legacy DEMO fixture`}</dd>
      <dt>Footfall</dt><dd>{f?`${f.passes_per_hour_equivalent} passage events/hour equivalent (${f.pass_count} in ${f.duration_min} min); ${f.window_start} to ${f.window_end}; DEMO. ${f.source_note}`:'Unknown / not collected'}</dd><dt>Resident reports</dt><dd>{reportsForSegment(state.reports,segment.segment_id).length} (separate from footfall)</dd>
    </dl><p className="warning">{segment.shade_data_status==='demo_fixture'||segment.shade_data_status==='unknown'?'No field shade observation is claimed for this record. ':'Shade record entered/reviewed manually in this local prototype. '}Campus geometry and accessible-route verification remain unavailable. Shade is time-specific and does not establish temperature reduction.</p>
    {source&&segment.shade_data_status==='human_reviewed'&&source.reviewer_label.trim().toLowerCase()===source.observer_label.trim().toLowerCase()&&<p className="warning">Legacy history: reviewer and observer aliases match. This older record does not establish separate review under the current policy; history is preserved.</p>}
    <button onClick={onAction}>{mode==='resident'?'Report a route':'View reports for this segment'}</button>
    <details className="wf-history"><summary>Shade and dataset history</summary>{state.snapshots.map(snapshot=>{const s=snapshot.segments.find(s=>s.segment_id===segment.segment_id);return s&&<article key={snapshot.dataset_version}><b>{snapshot.dataset_version}</b><p>{shadeLabels[s.shade_label]} · {dataStatusText[s.shade_data_status]}<br/>{s.shade_observed_at??'Unknown / no observed timestamp'}</p><small>{snapshot.change_summary} · {snapshot.created_at}</small></article>})}
      {observations.map(o=><article key={o.observation_id}><b>{o.observation_id} · {o.review_status}</b><p>Raw: {shadeLabels[o.shade_label]} · {dataStatusText[o.data_status]} · {o.observed_at}</p><p>{o.method}; {o.source_note}; {o.notes}</p><p>Evidence reference: {o.evidence_reference||'None'}</p>{o.reviews.map((r,i)=><p key={i}>{r.action} · {r.reviewer_label} · {r.timestamp}<br/>{shadeLabels[r.shade_label]} · {r.note}</p>)}{o.published_at&&<p>Published {o.published_at} by {o.published_by_label}: {o.published_dataset_version}</p>}</article>)}
    </details>
  </aside>
}
