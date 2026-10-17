import { useState } from 'react'
import { shadeLabels as labelText } from '../campusMapDisplay'
import { advanceInstallation, dataStatusText, lifecycleNext, malaysiaNow, publishIntervention, recordObservation, reviewObservation, shadeLabels, verifiedForIntervention } from './model'
import type { ObservationInput, ShadeObservation, WorkflowState } from './model'
import type { ShadeLabel } from '../types'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
function ObservationRecord({observation:o,commit}:{observation:ShadeObservation;commit:Commit}){
  const [reviewer,setReviewer]=useState('Demo reviewer'),[note,setNote]=useState(''),[reviewedLabel,setReviewedLabel]=useState(o.shade_label)
  return <article className="wf-record" data-observation-id={o.observation_id}><h3>{o.observation_id} · {o.review_status}</h3><p>{o.intervention_id} · {o.segment_id} · <b>{dataStatusText[o.data_status]}</b></p><p>Raw label: {labelText[o.shade_label]} · observed {o.observed_at}<br/>Created {o.created_at} · observer: {o.observer_label}</p><p>Method: {o.method}<br/>Source: {o.source_note}<br/>Notes / uncertainty: {o.notes}<br/>Evidence reference: {o.evidence_reference||'None supplied (no files uploaded)'}</p>
    {o.reviews.map((r,i)=><p key={i}>{r.action} · {r.reviewer_label} · {r.timestamp}<br/>Reviewed label: {labelText[r.shade_label]} · {r.note}</p>)}
    {(o.review_status==='submitted'||o.review_status==='under_review')&&<div className="wf-review-form"><label>Observation reviewer label — {o.observation_id}<input value={reviewer} maxLength={100} onChange={e=>setReviewer(e.target.value)}/></label><label>Observation review note — {o.observation_id}<textarea value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label><label>Reviewed shade label — {o.observation_id}<select value={reviewedLabel} onChange={e=>setReviewedLabel(e.target.value as ShadeLabel)}>{shadeLabels.map(label=><option value={label} key={label}>{labelText[label]}</option>)}</select></label><div className="wf-actions">
      {o.review_status==='submitted'?<button onClick={()=>commit(s=>reviewObservation(s,o.observation_id,'under_review',reviewer,note,reviewedLabel,malaysiaNow()))}>Start observation review</button>:<button onClick={()=>commit(s=>reviewObservation(s,o.observation_id,'verified',reviewer,note,reviewedLabel,malaysiaNow()))}>Verify shade observation</button>}
      <button onClick={()=>commit(s=>reviewObservation(s,o.observation_id,'rejected',reviewer,note,reviewedLabel,malaysiaNow()))}>Reject observation</button>
    </div><p>Verification records a human review; it does not update the current map. DEMO entries stay DEMO.</p></div>}
    {o.published_at&&<p>Published at {o.published_at} by {o.published_by_label} · {o.published_dataset_version}</p>}
  </article>
}
export function ObservationWorkflow({state,commit,onPublished}:{state:WorkflowState;commit:Commit;onPublished:()=>void}){
  const [intervention,setIntervention]=useState(state.items[0].intervention_id),[filter,setFilter]=useState('all'),[formOpen,setFormOpen]=useState(false)
  const [actor,setActor]=useState('Demo operator'),[lifecycleNote,setLifecycleNote]=useState(''),[message,setMessage]=useState('')
  const item=state.items.find(i=>i.intervention_id===intervention)!
  const [form,setForm]=useState<ObservationInput>({intervention_id:item.intervention_id,segment_id:item.segment_ids[0],record_kind:'demo',field_attested:false,shade_label:'unknown',observed_at:'',method:'',source_note:'',observer_label:'Demo observer',notes:'',evidence_reference:''})
  const set=<K extends keyof ObservationInput>(key:K,value:ObservationInput[K])=>setForm(f=>({...f,[key]:value}))
  const pending=state.observations.filter(o=>o.intervention_id===item.intervention_id&&(filter==='all'||o.segment_id===filter))
  const ready=verifiedForIntervention(state,item.intervention_id)
  const publishable=item.lifecycle==='verified'&&ready.length>0&&ready.every(Boolean)
  return <section className="wf-panel" aria-label="Installation and shade observations"><h2>Installation → observation → review → publish</h2><p>Prototype lifecycle only. Recording an installation status does not establish real construction, institutional approval or a shade change.</p>
    <div className="wf-fields"><label>Intervention to manage<select aria-label="Intervention to manage" value={intervention} onChange={e=>{const id=e.target.value;setIntervention(id);setFilter('all');setFormOpen(false);setMessage('');const item=state.items.find(i=>i.intervention_id===id)!;setForm(f=>({...f,intervention_id:id,segment_id:item.segment_ids[0]}))}}>{state.items.map(i=><option key={i.intervention_id} value={i.intervention_id}>{i.intervention_id} — {i.type}</option>)}</select></label><label>Lifecycle / publication actor label<input value={actor} maxLength={100} onChange={e=>setActor(e.target.value)}/></label><label>Lifecycle / publication note<textarea value={lifecycleNote} maxLength={2000} onChange={e=>setLifecycleNote(e.target.value)}/></label></div>
    <p className="wf-lifecycle-status" data-testid="lifecycle-status">{item.intervention_id}: <b>{item.lifecycle}</b> · linked segments: {item.segment_ids.join(', ')}</p>
    {['proposed','approved_demo','under_construction'].includes(item.lifecycle)&&<button onClick={()=>{if(commit(s=>advanceInstallation(s,item.intervention_id,lifecycleNext[item.lifecycle]!,actor,lifecycleNote,malaysiaNow())))setMessage('Prototype status recorded. Current shade is unchanged.')}}>Advance to {lifecycleNext[item.lifecycle]!.replaceAll('_',' ')}</button>}
    {item.lifecycle==='installed_pending_verification'&&<button onClick={()=>{setFormOpen(!formOpen);setMessage('')}}>Record post-installation shade observation</button>}
    {formOpen&&item.lifecycle==='installed_pending_verification'&&<form className="wf-observation-form" onSubmit={e=>{e.preventDefault();const time=form.observed_at.length===16?`${form.observed_at}:00+08:00`:`${form.observed_at}+08:00`;if(commit(s=>recordObservation(s,{...form,intervention_id:item.intervention_id,observed_at:time},malaysiaNow()))){setFormOpen(false);setMessage('Observation submitted to review queue. Current published shade is unchanged.');setForm(f=>({...f,observed_at:'',method:'',source_note:'',notes:'',evidence_reference:''}))}}}>
      <h3>Post-installation observation</h3><p>Observation ID assigned on save: OBS-{String(state.revision+1).padStart(6,'0')}</p><div className="wf-fields">
      <label>Observed segment<select aria-label="Observed segment" value={form.segment_id} onChange={e=>set('segment_id',e.target.value)}>{item.segment_ids.map(id=><option key={id}>{id}</option>)}</select></label>
      <label>Record type<select aria-label="Record type" value={form.record_kind} onChange={e=>setForm(f=>({...f,record_kind:e.target.value as 'demo'|'field',field_attested:false}))}><option value="demo">DEMO exercise — fictional entry</option><option value="field">Genuine manually observed field record</option></select></label>
      <label>Observed shade label<select aria-label="Observed shade label" value={form.shade_label} onChange={e=>set('shade_label',e.target.value as ShadeLabel)}>{shadeLabels.map(label=><option key={label} value={label}>{labelText[label]}</option>)}</select></label>
      <label>Observed date and time (Malaysia +08:00)<input required type="datetime-local" step="1" value={form.observed_at} onChange={e=>set('observed_at',e.target.value)}/></label>
      <label>Observation method<input required maxLength={500} value={form.method} onChange={e=>set('method',e.target.value)}/></label><label>Source / field record reference<input required maxLength={500} value={form.source_note} onChange={e=>set('source_note',e.target.value)}/></label>
      <label>Observer label (no personal details needed)<input required maxLength={100} value={form.observer_label} onChange={e=>set('observer_label',e.target.value)}/></label><label>Notes and uncertainty<textarea required maxLength={2000} value={form.notes} onChange={e=>set('notes',e.target.value)}/></label><label>Optional safe evidence reference<input maxLength={500} value={form.evidence_reference} onChange={e=>set('evidence_reference',e.target.value)}/></label>
      </div><p>Reference text only; no photo upload or external service. Do not enter identifying personal content. Canopy is not proof of ground-level shade or cooling.</p>
      {form.record_kind==='field'&&<label className="wf-check"><input type="checkbox" checked={form.field_attested} onChange={e=>set('field_attested',e.target.checked)}/>I confirm this is a genuine field observation and I checked the linked segment/location on site; it is not a demo exercise.</label>}
      <button type="submit">Submit shade observation for review</button>
    </form>}
    <div className="wf-publish"><h3>Publish reviewed shade evidence</h3><p>Requires a verified observation for every linked segment. Publishes the latest verified record per linked segment into a new immutable local dataset version.</p>
      {ready.filter(Boolean).map(o=>o&&<p key={o.observation_id}>{o.observation_id} · {o.segment_id} · {labelText[o.reviews[o.reviews.length-1].shade_label]} · {o.data_status==='demo_fixture'?'DEMO will remain DEMO':'Field record will be HUMAN REVIEWED'}</p>)}
      <button disabled={!publishable} onClick={()=>{if(commit(s=>publishIntervention(s,item.intervention_id,actor,lifecycleNote,malaysiaNow()))){setMessage('New current dataset published locally. Both Resident and Developer now use the new version.');onPublished()}}}>Publish verified shade update</button>
      {!publishable&&<p>{item.lifecycle==='published'?'This intervention’s observations are published.':'Not publishable yet: installation and verified observations are required.'}</p>}
    </div>{message&&<p role="status" className="success">{message}</p>}
    <h3>Observation review queue / history</h3><label>Observation segment filter<select aria-label="Observation segment filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All linked segments</option>{item.segment_ids.map(id=><option key={id}>{id}</option>)}</select></label>
    {pending.length?pending.map(o=><ObservationRecord key={o.observation_id} observation={o} commit={commit}/>):<p>No observations for this intervention/segment.</p>}
    <details><summary>Lifecycle event history</summary>{state.lifecycle_events.filter(e=>e.intervention_id===item.intervention_id).map(e=><article key={e.event_id}><b>{e.event_id}</b><p>{e.from_status} → {e.to_status} · {e.actor_demo_label} · {e.timestamp}<br/>{e.note}<br/>Evidence: {e.evidence_reference||'None (prototype status only)'}<br/>{e.dataset_version}</p></article>)}</details>
  </section>
}
