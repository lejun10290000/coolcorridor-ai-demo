import { shadeLabels } from '../campusMapDisplay'
import { currentSnapshot, parseBudget } from './model'
import type { Plan, PlanningWorkspace, Scenario, WorkflowState } from './model'
import { planningWorkspace, updatePlanning } from './planning'
import type { ShadeLabel } from '../types'

type Commit=(update:(s:WorkflowState)=>WorkflowState)=>boolean
export function PlanningPanels({state,commit,plan,error,scenario,selection,preview,baseline,panel='all'}:{state:WorkflowState;commit:Commit;plan:Plan|null;error:string;scenario:Scenario;selection:string[];preview:()=>void;baseline:()=>void;panel?:'all'|'budget'|'scenario'}){
  const workspace=planningWorkspace(state),current=currentSnapshot(state)
  function update(change:(p:PlanningWorkspace)=>PlanningWorkspace){commit(s=>updatePlanning(s,change))}
  function candidate(id:string,field:'cost'|'benefit',value:string){update(p=>({...p,candidates:{...p.candidates,[id]:{...p.candidates[id],[field]:value}}}))}
  return <div className={panel==='all'?'wf-two-col':'wf-single-panel'}>
    {(panel==='all'||panel==='budget')&&<section className="wf-panel" aria-label="Budget optimisation"><h2>Budget optimiser</h2>
      <label>Available budget (whole RM)<input type="number" min="0" max="1000000000" step="1" value={workspace.budget} onChange={e=>update(p=>({...p,budget:e.target.value}))} aria-invalid={parseBudget(workspace.budget)===null}/></label>
      <p>Whole RM only, from 0 to 1,000,000,000. Default RM20,000. After the first calculation, changing budget, eligibility, costs, scores or linked paths automatically recalculates the portfolio.</p>
      <h3>Candidates eligible for optimisation</h3><p>Checked candidates may be selected by the optimiser; they are not automatically selected.</p>
      <p>Select paths on the current Baseline map, then use a candidate’s “Use selected map paths” button to place that proposal. Defaults are illustrative map proxies. This only changes planning inputs.</p>
      <p data-testid="planning-path-selection">{selection.length} current map links available for assignment.</p>
      {state.items.map(i=>{
        const c=workspace.candidates[i.intervention_id],excluded=workspace.excluded_ids.includes(i.intervention_id),ineligible=i.feasibility_status==='ineligible',picked=!!plan?.ids.includes(i.intervention_id)
        return <article className={`wf-candidate ${picked?'wf-selected':excluded||ineligible?'wf-excluded':''}`} key={i.intervention_id} data-candidate-id={i.intervention_id}>
          <label className="wf-check"><input type="checkbox" checked={!excluded&&!ineligible} disabled={ineligible} onChange={()=>update(p=>({...p,excluded_ids:excluded?p.excluded_ids.filter(id=>id!==i.intervention_id):[...p.excluded_ids,i.intervention_id]}))}/><b>Eligible: {i.intervention_id} — {i.type}</b></label>
          <div className="wf-editor-grid"><label>Assumed cost for {i.intervention_id} (RM)<input type="number" min="0" max="1000000000" step="1" value={c.cost} aria-invalid={parseBudget(c.cost)===null} onChange={e=>candidate(i.intervention_id,'cost',e.target.value)}/></label><label>Total assumed benefit for {i.intervention_id}<input type="number" min="0" max="1000000000" step="1" value={c.benefit} aria-invalid={parseBudget(c.benefit)===null} onChange={e=>candidate(i.intervention_id,'benefit',e.target.value)}/></label></div>
          <p>DEMO assumed cost and illustrative score, not a measured shade/cooling result. Score is shared across this candidate’s links; overlaps count the highest link score once.</p>
          <details><summary>Linked map paths ({c.segment_ids.length})</summary><ul>{c.segment_ids.map(id=><li key={id}>{id} · {current.segments.find(s=>s.segment_id===id)?.name}</li>)}</ul></details>
          <button type="button" disabled={!selection.length} aria-label={`Use selected map paths for ${i.intervention_id}`} onClick={()=>update(p=>({...p,candidates:{...p.candidates,[i.intervention_id]:{...p.candidates[i.intervention_id],segment_ids:[...selection]}}}))}>Use selected map paths</button>
          <p>Feasibility: {i.feasibility_status} · shared constraint group: {i.constraints.join(', ')||'None listed'}. Candidates in the same group cannot both be selected.</p>
          <strong>{ineligible?'Ineligible':excluded?'Excluded by operator':picked?'Selected in current optimised plan':plan?'Eligible; not selected in this portfolio':'Eligible for consideration; no current calculated selection'}</strong>
        </article>
      })}
      <button onClick={()=>update(p=>({...p,has_calculated:true}))}>Optimise plan</button>
      {error&&<p className="warning" role="alert">{error} Portfolio and simulation preview are unavailable until inputs are valid.</p>}
      {plan?<div className="wf-plan-result" data-testid="plan-result" aria-live="polite"><h3>Current optimised plan</h3><p>Selected: {plan.ids.join(', ')||'No selected interventions'}</p><p>RM {plan.cost.toLocaleString()} total · RM {plan.remaining.toLocaleString()} remaining</p><p>{Number(plan.benefit.toFixed(2))} assumed illustrative benefit score — not measured shade or cooling.</p><p>{plan.reason}</p><button onClick={preview}>Preview optimised scenario</button></div>:!workspace.has_calculated&&<p>No current plan. Enter valid inputs and choose Optimise plan.</p>}
    </section>}
    {(panel==='all'||panel==='scenario')&&<section className="wf-panel" aria-label="Scenario comparison"><h2>Baseline versus simulated scenario</h2><span className="chip simulated">SIMULATED / ASSUMPTION</span>
      <p>Baseline: <span className="wf-version" data-testid="scenario-baseline-version">{scenario.baseline_version}</span>. Nothing in this panel publishes or changes current observations.</p>
      <p role="status" data-testid="scenario-sync-status">Always based on the latest published map. Developer publications refresh this simulation automatically; explicit projections stay applied to their selected links. Unpublished drafts are excluded.</p>
      {plan?.ids.length?<><p>Selected intervention links:</p><ul>{plan.ids.map(id=><li key={id}>{id} → {workspace.candidates[id].segment_ids.join(', ')}</li>)}</ul>
        <div className="wf-table-wrap"><table className="wf-scenario-table"><thead><tr><th>Map path</th><th>Latest baseline label</th><th>Explicit projection</th></tr></thead><tbody>{scenario.projections.map(p=><tr key={p.segment_id} data-projection-segment={p.segment_id}><th scope="row">{p.segment_id}<p>{current.segments.find(s=>s.segment_id===p.segment_id)?.name}</p></th><td data-column="Latest baseline label" data-baseline-label={p.baseline_label}>{shadeLabels[p.baseline_label]}</td><td><label>Simulated shade projection for {p.segment_id}<select aria-label={`Simulated shade projection for ${p.segment_id}`} value={workspace.assumptions[p.segment_id]??''} onChange={e=>{const value=e.target.value as ShadeLabel|'';update(w=>({...w,assumptions:{...w.assumptions,[p.segment_id]:value}}))}}><option value="">No change / use latest baseline</option>{Object.entries(shadeLabels).map(([key,text])=><option key={key} value={key}>{text}</option>)}</select></label><p>{p.projected_label?`${shadeLabels[p.projected_label]} — SIMULATED / ASSUMPTION`:'No shade change assumed; follows latest published baseline.'}</p></td></tr>)}</tbody></table></div>
        <p>{scenario.projections.filter(p=>p.projected_label!==null).length} explicit projections across {scenario.projections.length} selected map links. A projection is an assumption, including when it matches the baseline label.</p>
      </>:<p>{plan?'Empty portfolio: the simulated map matches the latest published baseline.':'No selected portfolio. Optimise an eligible plan before defining a projection.'}</p>}
      <div className="wf-actions"><button disabled={!plan} onClick={preview}>View simulated map</button><button onClick={baseline}>Return to baseline</button><button disabled={!Object.keys(workspace.assumptions).length} onClick={()=>update(p=>({...p,assumptions:{}}))}>Clear simulated projections</button></div>
      <p>Inputs and assumptions are saved locally. A removed or excluded candidate’s projections are inactive; they are reapplied only when its links are selected again.</p>
      <details><summary>Scenario output record</summary><pre>{JSON.stringify({status:scenario.status,baseline_version:scenario.baseline_version,selected_intervention_ids:scenario.selected_intervention_ids,projections:scenario.projections,warnings:scenario.warnings},null,2)}</pre></details>
    </section>}
  </div>
}
