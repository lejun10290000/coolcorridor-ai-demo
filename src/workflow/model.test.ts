import { describe, expect, it } from 'vitest'
import { footfall } from '../fixtures'
import { advanceInstallation, buildScenario, calculatePlan, currentSnapshot, currentStudyArea, initialWorkflow, parseBudget, publishIntervention, recordObservation, reportsForSegment, reviewObservation, reviewReport, submitReport, validLocalTime } from './model'
import type { ObservationInput, WorkflowState } from './model'
import { decodeWorkflow, loadWorkflow } from './storage'
import { ObservationValidationError, observationLocalTimestamp } from './validationError'

const now='2026-10-17T17:00:00+08:00'
const input:ObservationInput={intervention_id:'INT-01',segment_id:'DEMO-S01',record_kind:'demo',field_attested:false,shade_label:'mostly_shaded',observed_at:'2026-10-17T12:00:00+08:00',method:'DEMO form exercise',source_note:'Fictional exercise only',observer_label:'Demo operator',notes:'Not a field measurement; test input.',evidence_reference:'DEMO-NOTE-1'}
function installed(){let s=initialWorkflow();for(const to of ['approved_demo','under_construction','installed_pending_verification'] as const)s=advanceInstallation(s,'INT-01',to,'Demo operator','Prototype lifecycle exercise',now);return s}
function submitted(real=false){return recordObservation(installed(),real?{...input,record_kind:'field',field_attested:true,method:'Manual field assessment',source_note:'Operator-supplied field notebook',notes:'Single time sample; location checked by operator.'}:input,now)}
function verified(real=false){let s=submitted(real);const id=s.observations[0].observation_id;s=reviewObservation(s,id,'under_review','Reviewer','Inspect supplied record',input.shade_label,now);return reviewObservation(s,id,'verified','Reviewer','Record checked; no navigation/temperature claim',input.shade_label,now)}
function freeze<T>(v:T):T{if(v&&typeof v==='object'){Object.freeze(v);Object.values(v).forEach(freeze)}return v}

describe('resident reports remain separate from field evidence',()=>{
  it('starts pending, filters exactly and leaves footfall untouched',()=>{
    const before=JSON.stringify(footfall);const base=initialWorkflow()
    const s=submitReport(base,{segment_id:'DEMO-S01',category:'no shade',comment_optional:'Fixture report'},now)
    expect(s.reports[0].review_status).toBe('submitted');expect(base.reports).toHaveLength(0)
    expect(reportsForSegment(s.reports,'DEMO-S02')).toEqual([]);expect(reportsForSegment(s.reports,'DEMO-S01')).toHaveLength(1)
    expect(JSON.stringify(footfall)).toBe(before)
  })
  it('requires a distinct review before verification and makes final reviews terminal',()=>{
    let s=submitReport(initialWorkflow(),{segment_id:'DEMO-S01',category:'other',comment_optional:''},now);const id=s.reports[0].report_id
    expect(()=>reviewReport(s,id,'verified','Reviewer','Checked',now)).toThrow()
    s=reviewReport(s,id,'under_review','Reviewer','Inspecting',now);s=reviewReport(s,id,'verified','Reviewer','Checked',now)
    expect(s.report_events).toHaveLength(2);expect(()=>reviewReport(s,id,'rejected','Reviewer','No',now)).toThrow()
  })
  it('supports rejection from submitted with a note and rejects invalid segments',()=>{
    const s=submitReport(initialWorkflow(),{segment_id:'DEMO-S04',category:'blocked walkway',comment_optional:''},now)
    expect(reviewReport(s,s.reports[0].report_id,'rejected','Reviewer','Not substantiated',now).reports[0].review_status).toBe('rejected')
    expect(()=>submitReport(s,{segment_id:'NONEXISTENT',category:'other',comment_optional:''},now)).toThrow()
  })
})
describe('budget and scenario integrity',()=>{
  it.each(['','-1','NaN','Infinity','1.5','1e4','1000000001'])('rejects invalid integer-RM budget %s',v=>{expect(parseBudget(v)).toBeNull();expect(()=>calculatePlan(initialWorkflow().items,v,[])).toThrow()})
  it('uses subset search, constraints/exclusions and never overdraws representative budgets',()=>{
    const items=initialWorkflow().items
    for(const budget of ['0','10000','20000','50000']){const p=calculatePlan(items,budget,[]);expect(p.cost).toBeLessThanOrEqual(Number(budget));expect(p.remaining).toBe(Number(budget)-p.cost);expect(!(p.ids.includes('INT-01')&&p.ids.includes('INT-02'))).toBe(true)}
    expect(calculatePlan(items,'10000',[]).ids).not.toEqual(calculatePlan(items,'20000',[]).ids)
    expect(calculatePlan(items,'20000',['INT-03']).benefit).toBe(65)
    expect(calculatePlan(items,'20000',items.map(i=>i.intervention_id)).ids).toEqual([])
  })
  it('does not equate checked eligibility with algorithm selection',()=>{
    const s=initialWorkflow(),p=calculatePlan(s.items,'20000',[])
    expect(p.ids).toEqual(['INT-03']);expect(p.ids.length).toBeLessThan(s.items.length)
  })
  it('has no implicit shade improvement, including unknowns',()=>{
    const s=initialWorkflow(),baseline=freeze(currentSnapshot(s)),scenario=buildScenario(baseline,s.items,['INT-01'],{})
    expect(scenario.segments).toEqual(baseline.segments);expect(scenario.projections[0].projected_label).toBeNull()
    expect(scenario.warnings.join()).toContain('SIMULATED')
    expect(scenario.segments.find(s=>s.segment_id==='DEMO-S04')?.shade_label).toBe('unknown')
  })
  it('applies only explicit affected projections to copied simulated records',()=>{
    const s=initialWorkflow(),baseline=freeze(currentSnapshot(s)),before=JSON.stringify(baseline)
    const scenario=buildScenario(baseline,s.items,['INT-01'],{'DEMO-S01':'mostly_shaded','DEMO-S04':'mostly_shaded'})
    expect(scenario.segments[0].shade_label).toBe('mostly_shaded');expect(scenario.segments[0].shade_data_status).toBe('simulated');expect(scenario.segments[0].shade_observed_at).toBeNull()
    expect(scenario.segments[3].shade_label).toBe('unknown');expect(JSON.stringify(baseline)).toBe(before)
    expect(scenario.baseline_version).toBe(baseline.dataset_version)
  })
})
describe('observation, verification and publication',()=>{
  it('rejects lifecycle jumps and observations before installation',()=>{
    expect(()=>advanceInstallation(initialWorkflow(),'INT-01','published','Demo','Skip',now)).toThrow()
    expect(()=>recordObservation(initialWorkflow(),input,now)).toThrow()
    expect(()=>advanceInstallation(installed(),'INT-01','verified','Demo','Skip review',now)).toThrow()
  })
  it('requires a valid linked segment, real Malaysia date/time and non-future observation',()=>{
    const s=installed()
    for(const patch of [{segment_id:'DEMO-S04'},{observed_at:'2026-02-30T12:00:00+08:00'},{observed_at:'2026-10-18T12:00:00+08:00'},{method:''},{notes:''},{evidence_reference:'javascript:alert(1)'}])expect(()=>recordObservation(s,{...input,...patch},now)).toThrow()
    expect(validLocalTime('2026-10-17T12:00:00Z')).toBe(false)
  })
  it('requires genuine field attestation and prevents forged demo provenance',()=>{
    expect(()=>recordObservation(installed(),{...input,record_kind:'field'},now)).toThrow()
    const forged={...input,data_status:'sample_observed'}
    expect(recordObservation(installed(),forged,now).observations[0].data_status).toBe('demo_fixture')
  })
  it('does not change current shade on submission or verification',()=>{
    const s=verified();expect(currentSnapshot(s).segments[0].shade_label).toBe('mostly_exposed')
    expect(s.items[0].lifecycle).toBe('verified');expect(s.snapshots).toHaveLength(1)
    expect(s.observations[0].reviews).toHaveLength(2);expect(s.observations[0].shade_label).toBe(input.shade_label)
  })
  it('blocks publication of submitted/under-review/rejected evidence',()=>{
    const submittedState=submitted();const id=submittedState.observations[0].observation_id
    for(const s of [submittedState,reviewObservation(submittedState,id,'under_review','Reviewer','Review started',input.shade_label,now),reviewObservation(submittedState,id,'rejected','Reviewer','Rejected',input.shade_label,now)])expect(()=>publishIntervention(s,'INT-01','Publisher','Publish',now)).toThrow()
  })
  it('publishes a new immutable snapshot, preserves raw observation and leaves fixtures DEMO',()=>{
    const s=freeze(verified()),old=JSON.stringify(s)
    const next=publishIntervention(s,'INT-01','Publisher','Prototype publish',now)
    expect(JSON.stringify(s)).toBe(old);expect(next.snapshots).toHaveLength(2);expect(next.current_version).not.toBe(s.current_version)
    const segment=currentSnapshot(next).segments[0]
    expect(segment.shade_label).toBe('mostly_shaded');expect(segment.shade_observed_at).toBe(input.observed_at);expect(segment.shade_data_status).toBe('demo_fixture')
    expect(segment.shade_source?.reviewer_label).toBe('Reviewer');expect(next.observations[0].data_status).toBe('demo_fixture')
    expect(next.snapshots[0]).toEqual(s.snapshots[0]);expect(next.observations[0].shade_label).toBe(input.shade_label)
    expect(next.items[0].lifecycle).toBe('published');expect(next.lifecycle_events).toHaveLength(5)
    expect(currentSnapshot(next).segments.every(s=>s.dataset_version===next.current_version)).toBe(true)
    expect(currentStudyArea(next).dataset_version).toBe(next.current_version)
    expect(()=>publishIntervention(next,'INT-01','Publisher','Again',now)).toThrow()
  })
  it('keeps genuine raw observations distinct from the human-reviewed published assessment',()=>{
    let s=submitted(true);const id=s.observations[0].observation_id
    s=reviewObservation(s,id,'under_review','Reviewer','Checking',input.shade_label,now)
    s=reviewObservation(s,id,'verified','Reviewer','Corrected after review','mixed',now)
    s=publishIntervention(s,'INT-01','Publisher','Publish reviewed field record',now)
    expect(s.observations[0].shade_label).toBe('mostly_shaded');expect(s.observations[0].data_status).toBe('sample_observed')
    expect(currentSnapshot(s).segments[0].shade_label).toBe('mixed');expect(currentSnapshot(s).segments[0].shade_data_status).toBe('human_reviewed')
  })
  it('creates distinct versions for later publications and preserves a new unknown assessment as grey/unknown data',()=>{
    let s=publishIntervention(verified(),'INT-01','Publisher','First publication',now)
    const first=s.current_version
    for(const to of ['approved_demo','under_construction','installed_pending_verification'] as const)s=advanceInstallation(s,'INT-04',to,'Demo','Later prototype record',now)
    s=recordObservation(s,{...input,intervention_id:'INT-04',shade_label:'unknown',observed_at:'2026-10-17T12:15:00+08:00'},now)
    const id=s.observations[s.observations.length-1].observation_id
    s=reviewObservation(s,id,'under_review','Reviewer','Review later sample','unknown',now)
    s=reviewObservation(s,id,'verified','Reviewer','Unknown remains unknown','unknown',now)
    s=publishIntervention(s,'INT-04','Publisher','Second publication',now)
    expect(s.current_version).not.toBe(first);expect(s.snapshots.map(s=>s.segments[0].shade_label)).toEqual(['mostly_exposed','mostly_shaded','unknown'])
    expect(currentSnapshot(s).segments[0].shade_data_status).toBe('demo_fixture');expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it('requires reviewed evidence for every affected segment',()=>{
    let s=initialWorkflow();s={...s,items:s.items.map(i=>i.intervention_id==='INT-01'?{...i,segment_ids:['DEMO-S01','DEMO-S02']}:i)}
    for(const to of ['approved_demo','under_construction','installed_pending_verification'] as const)s=advanceInstallation(s,'INT-01',to,'Demo','Test',now)
    s=recordObservation(s,input,now);const id=s.observations[0].observation_id;s=reviewObservation(s,id,'under_review','R','Review',input.shade_label,now);s=reviewObservation(s,id,'verified','R','Verified',input.shade_label,now)
    expect(s.items[0].lifecycle).toBe('installed_pending_verification');expect(()=>publishIntervention(s,'INT-01','P','Missing second segment',now)).toThrow()
  })
})
describe('guarded local persistence',()=>{
  it('round-trips verified/published and reviewed-report histories',()=>{
    let s=publishIntervention(verified(true),'INT-01','Publisher','Publish',now)
    s=submitReport(s,{segment_id:'DEMO-S02',category:'other',comment_optional:''},now);s=reviewReport(s,s.reports[0].report_id,'under_review','Reviewer','Inspect',now)
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
  })
  it.each(['{','null','[]','{}','{"schema_version":99}'])('recovers safely from corrupt/unexpected input %s',raw=>{
    const loaded=loadWorkflow(raw);expect(loaded.warning).toContain('corrupt or incompatible');expect(loaded.state).toEqual(initialWorkflow())
  })
  it('rejects demo provenance promotion and mismatched segment versions',()=>{
    const s=publishIntervention(verified(),'INT-01','Publisher','Publish',now)
    const corrupt:WorkflowState=JSON.parse(JSON.stringify(s));corrupt.observations[0].data_status='sample_observed'
    expect(loadWorkflow(JSON.stringify(corrupt)).warning).not.toBe('')
    const other:WorkflowState=JSON.parse(JSON.stringify(s));other.snapshots[1].segments[0].dataset_version='wrong'
    expect(loadWorkflow(JSON.stringify(other)).warning).not.toBe('')
  })
  it('rejects a fabricated shade update without published source evidence',()=>{
    const s=publishIntervention(verified(),'INT-01','Publisher','Publish',now)
    s.snapshots[1].segments[1].shade_label='mostly_shaded'
    expect(loadWorkflow(JSON.stringify(s)).warning).not.toBe('')
  })
})

// Synthetic isolated inputs exercise policy; no genuine campus survey is claimed.
describe('separate field reviewer and actionable validation',()=>{
  it.each(['Demo operator','  DEMO OPERATOR  ',''])('rejects field verification by observer/blank alias %s',reviewer=>{
    let s=submitted(true);const id=s.observations[0].observation_id
    s=reviewObservation(s,id,'under_review','Reviewer','Review started',input.shade_label,now)
    const before=JSON.stringify(s)
    try{reviewObservation(s,id,'verified',reviewer,'Reviewed',input.shade_label,now);throw Error('Expected rejection')}
    catch(error){expect(error).toBeInstanceOf(ObservationValidationError);expect((error as ObservationValidationError).field).toBe('reviewer_label');expect((error as Error).message).toContain('separate reviewer')}
    expect(JSON.stringify(s)).toBe(before)
  })
  it('accepts a distinct reviewer and persists the new policy marker',()=>{
    const s=verified(true),review=s.observations[0].reviews[s.observations[0].reviews.length-1]
    expect(review.review_policy).toBe('separate-field-reviewer-v1')
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
    const corrupt=structuredClone(s);corrupt.observations[0].reviews[corrupt.observations[0].reviews.length-1].reviewer_label='  DEMO OPERATOR '
    expect(()=>decodeWorkflow(JSON.stringify(corrupt))).toThrow()
  })
  it('retains legacy history but blocks new publication with a matching observer alias',()=>{
    const s=verified(true)
    for(const r of s.observations[0].reviews){delete r.review_policy;r.reviewer_label='Demo operator'}
    expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
    expect(()=>publishIntervention(s,'INT-01','Publisher','Legacy record',now)).toThrow(/separate|different|independent/i)
  })
  it('still permits DEMO exercises without promoting them to field evidence',()=>{
    let s=submitted();const id=s.observations[0].observation_id
    s=reviewObservation(s,id,'under_review','Demo operator','DEMO review',input.shade_label,now)
    s=reviewObservation(s,id,'verified','Demo operator','DEMO only',input.shade_label,now)
    s=publishIntervention(s,'INT-01','Publisher','DEMO only',now)
    expect(currentSnapshot(s).segments[0].shade_data_status).toBe('demo_fixture')
  })
  it('rejects year 3333 with the exact field error and leaves state unchanged',()=>{
    const s=installed(),before=JSON.stringify(s)
    try{recordObservation(s,{...input,observed_at:observationLocalTimestamp('3333-01-01T12:00')},now);throw Error('Expected rejection')}
    catch(error){expect(error).toBeInstanceOf(ObservationValidationError);expect((error as ObservationValidationError).field).toBe('observed_at');expect((error as Error).message).toBe('Observation time cannot be in the future.')}
    expect(JSON.stringify(s)).toBe(before)
    expect(observationLocalTimestamp('')).toBe('')
    expect(observationLocalTimestamp('2026-10-17T12:00')).toBe(input.observed_at)
    expect(observationLocalTimestamp('2026-10-17T12:00:00')).toBe(input.observed_at)
  })
})


describe('saved workflow migration for campus-wide routes', () => {
  it('adds new grey/unknown campus walkways without dropping existing local reports or legacy data', () => {
    const original = initialWorkflow()
    const originalLegacySegments = original.snapshots[0].segments.filter(segment => !segment.segment_id.startsWith('DEMO-WALK-'))
    const oldSaved = submitReport(original, {
      segment_id: 'DEMO-S01',
      category: 'no shade',
      comment_optional: 'Keep this pre-upgrade report.',
    }, now)
    const olderLocalState: WorkflowState = {
      ...oldSaved,
      snapshots: oldSaved.snapshots.map(snapshot => ({
        ...snapshot,
        segments: snapshot.segments.filter(segment => !segment.segment_id.startsWith('DEMO-WALK-')),
      })),
    }

    const restored = loadWorkflow(JSON.stringify(olderLocalState))
    expect(restored.warning).toBe('')
    expect(restored.state.reports).toEqual(oldSaved.reports)
    expect(restored.state.snapshots[0].segments.filter(segment => !segment.segment_id.startsWith('DEMO-WALK-'))).toEqual(originalLegacySegments)
    const added = restored.state.snapshots[0].segments.filter(segment => segment.segment_id.startsWith('DEMO-WALK-'))
    expect(added).toHaveLength(initialWorkflow().snapshots[0].segments.filter(segment => segment.segment_id.startsWith('DEMO-WALK-')).length)
    expect(added.every(segment => segment.shade_label === 'unknown' && segment.shade_data_status === 'unknown' && segment.shade_observed_at === null)).toBe(true)
    expect(added.every(segment => segment.dataset_version === restored.state.current_version)).toBe(true)
  })
})
