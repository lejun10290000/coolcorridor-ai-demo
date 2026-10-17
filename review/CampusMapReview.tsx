import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CampusImageMap } from '../src/CampusImageMap'
import { segments, candidates } from '../src/fixtures'
import { optimise } from '../src/domain'
import { shadeLabels } from '../src/campusMapDisplay'
import type { ResidentReport } from '../src/types'
import './campus-map-review.css'

function Review() {
  const [mode, setMode] = useState<'resident'|'developer'>('resident')
  const [selected, setSelected] = useState('DEMO-S01')
  const [route, setRoute] = useState('shortest')
  const [scenario, setScenario] = useState(false)
  const [budget, setBudget] = useState(20000)
  const [recenter, setRecenter] = useState(0)
  const [reports, setReports] = useState<ResidentReport[]>([])
  const segment = segments.find(s => s.segment_id === selected)!
  const plan = optimise(candidates, budget, [])
  const selectedSites = candidates.filter(c => plan.ids.includes(c.intervention_id))
  const routeIds = route === 'shortest' ? ['DEMO-S01','DEMO-S02'] : ['DEMO-S03']
  return <main className="map-review"><header><b>Campus map component review</b><p>Standalone component test harness. The integrated Resident and Developer application is at the site's root page.</p></header>
    <nav aria-label="Review mode"><button onClick={() => setMode('resident')} aria-pressed={mode === 'resident'}>Resident review</button><button onClick={() => setMode('developer')} aria-pressed={mode === 'developer'}>Developer review</button><button onClick={() => setRecenter(r => r+1)}>Recenter map</button></nav>
    <h1>{mode === 'resident' ? 'Resident' : 'Developer'} map review</h1>
    <p>DEMO: Main Gate → Klinik UTM. Display paths are illustrative; connections and crossings require survey.</p>
    {mode === 'resident' ? <div className="review-routes"><button aria-pressed={route === 'shortest'} onClick={() => setRoute('shortest')}>Shortest (illustrative)<small>DEMO-S01 + DEMO-S02</small></button><button aria-pressed={route === 'shade'} onClick={() => setRoute('shade')}>Lower estimated exposure<small>DEMO-S03 · shade is a fixture</small></button><p data-testid="route-ids">Selected route segments: {routeIds.join(', ')}</p></div> : <div className="review-routes"><label>Review budget (RM)<input type="number" value={budget} onChange={e => setBudget(Math.max(0,Number(e.target.value)))}/></label><button onClick={() => setScenario(s => !s)} aria-pressed={scenario}>Toggle SIMULATED sites</button><p data-testid="portfolio">DEMO candidates: {plan.ids.join(', ') || 'None'} · RM {plan.cost} selected</p></div>}
    <div className="review-grid"><CampusImageMap segments={segments} selected={selected} onSelect={setSelected} routeIds={mode === 'resident' ? routeIds : []} candidates={mode === 'developer' ? selectedSites : []} scenario={scenario} recenter={recenter} reports={mode === 'developer' ? reports : []}/>
      <aside data-testid="inspector" aria-live="polite"><h2>Segment evidence</h2><b>{segment.segment_id}</b><h3>{segment.name}</h3><p>{shadeLabels[segment.shade_label]}</p><p>{segment.shade_data_status === 'unknown' ? 'UNKNOWN / needs survey' : 'DEMO fixture'}</p><p>No observed shade timestamp. Walkability: pending field verification. Accessibility: {segment.accessibility_status}.</p><p>No field-verified shade observation or accessible-route assessment is available.</p><label>Select a segment from outside the map<select value={selected} onChange={e => setSelected(e.target.value)}>{segments.map(s => <option key={s.segment_id}>{s.segment_id}</option>)}</select></label><button onClick={() => setReports(r => [...r, { report_id:`REVIEW-${r.length}`, segment_id:selected, category:'no shade',comment_optional:'Review fixture',created_at:'2026-10-17T17:00:00+08:00',review_status:'submitted',review_note:'',data_status:'demo_fixture' }])}>Add pending DEMO report</button><p>{reports.filter(r => r.segment_id === selected).length} reports; pending review, not footfall.</p></aside>
    </div>
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Review/></React.StrictMode>)
