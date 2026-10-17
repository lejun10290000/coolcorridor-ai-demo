import { useMemo, useState } from 'react'
import { MapPanel } from '../MapPanel'
import { currentSnapshot, malaysiaNow, submitReport } from '../workflow/model'
import type { WorkflowState } from '../workflow/model'
import { SegmentEvidence } from '../workflow/SegmentEvidence'
import { compareRoutes } from './compare'
import { RouteCards } from './RouteCards'
import './routing.css'

// Normal app integration agreed by Builder 1 in PR #6, issuecomment-6234657305.
type Commit = (update: (state: WorkflowState) => WorkflowState) => boolean
export function CalculatedResident({ back, state, commit, notice }: { back: () => void; state: WorkflowState; commit: Commit; notice: string }) {
  const [selected, setSelected] = useState('DEMO-S01')
  const [route, setRoute] = useState<'shortest'|'exposure'>('shortest')
  const [openForm, setOpenForm] = useState(false)
  const [category, setCategory] = useState('no shade')
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [recenter, setRecenter] = useState(0)
  const current = currentSnapshot(state)
  const segment = current.segments.find(s => s.segment_id === selected)!
  const comparison = useMemo(()=>compareRoutes(current),[current])
  const chosen = comparison[route]?.segment_ids ?? []
  return <main className="wf-app"><header><button className="link" onClick={back}>← Home</button><div><span className="chip">DEMO ROUTING</span> <span className="chip wf-version">{current.dataset_version}</span></div></header>
    <section className="workspace resident"><div className="topbar"><div><div className="eyebrow">RESIDENT MODE</div><h1>Find a more comfortable walk</h1></div><button onClick={()=>setRecenter(r=>r+1)}>Recenter map</button></div>
      <p className="wf-local">Current shade dataset is shared with Developer mode only in this browser origin/profile. Local persistence does not synchronise with another device, browser profile or person; there is no shared backend. Campus paths remain illustrative and are not for navigation.</p>
      {notice&&<p className="warning" role="alert">{notice}</p>}
      <div className="endpoint"><label>From<select value="Main Gate" onChange={()=>{}}><option value="Main Gate">Pintu Masuk Utama (Main Gate)</option></select></label><label>To<select value="Klinik UTM" onChange={()=>{}}><option value="Klinik UTM">Pusat Kesihatan UTM Kuala Lumpur (Klinik UTM)</option></select></label>{message&&<span className="success" role="status">{message}</span>}</div>
      <p className="selected-route-status" data-testid="selected-route" role="status" data-route-version={comparison.dataset_version}>Selected route: {route==='shortest'?'Shortest':'Most shaded practical route'} · {chosen.length?chosen.join(' → '):'Unavailable'} · {comparison.dataset_version}</p>
      <div className="main-grid"><MapPanel segments={current.segments} selected={selected} onSelect={setSelected} routeIds={chosen} recenter={recenter} reports={state.reports}/><SegmentEvidence segment={segment} version={current.dataset_version} state={state} mode="resident" onAction={()=>setOpenForm(true)}/></div>
      <RouteCards comparison={comparison} selected={route} onSelect={setRoute}/>
      {openForm&&<div className="modal" role="dialog" aria-modal="true" aria-labelledby="report-heading" onKeyDown={e=>{
        if(e.key==='Escape')setOpenForm(false)
        if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button,select,textarea'));const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
      }}><form className="dialog" onSubmit={e=>{e.preventDefault();if(commit(s=>submitReport(s,{segment_id:selected,category,comment_optional:comment},malaysiaNow()))){setOpenForm(false);setComment('');setMessage('Report submitted with pending review status. Reports are not footfall.')}}}><button type="button" className="close" aria-label="Close report form" autoFocus onClick={()=>setOpenForm(false)}>×</button><h2 id="report-heading">Report walkway issue</h2><p>{selected}. Reports start submitted/pending review and are never pedestrian counts.</p><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{['no shade','too hot at a stated time','blocked walkway','unsafe crossing','other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Optional note<textarea maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></label><button type="submit">Submit demo report</button></form></div>}
    </section>
  </main>
}
