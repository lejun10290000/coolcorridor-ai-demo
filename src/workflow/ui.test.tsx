import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SegmentEvidence } from './SegmentEvidence'
import { DeveloperWorkspace } from './DeveloperWorkspace'
import { ReportReview } from './ReportReview'
import { currentSnapshot, initialWorkflow, submitReport } from './model'

describe('role-specific evidence and optimisation UI contract',()=>{
  it('offers submission only to residents and report review to developers',()=>{
    const state=initialWorkflow(),segment=currentSnapshot(state).segments[0]
    const common={state,segment,version:state.current_version,onAction:()=>{}}
    const resident=renderToStaticMarkup(<SegmentEvidence {...common} mode="resident"/>)
    const developer=renderToStaticMarkup(<SegmentEvidence {...common} mode="developer"/>)
    expect(resident).toContain('Report a route');expect(developer).not.toContain('Report a route');expect(developer).toContain('View reports for this segment')
  })
  it('never leaks another selected segment’s reports or enables direct verification',()=>{
    const state=submitReport(initialWorkflow(),{segment_id:'DEMO-S01',category:'no shade',comment_optional:'Unique segment-one report'},'2026-10-17T17:00:00+08:00')
    const own=renderToStaticMarkup(<ReportReview state={state} segmentId="DEMO-S01" commit={()=>false} onClose={()=>{}}/>)
    const other=renderToStaticMarkup(<ReportReview state={state} segmentId="DEMO-S02" commit={()=>false} onClose={()=>{}}/>)
    expect(own).toContain('Unique segment-one report');expect(own).toContain('Start report review');expect(own).not.toContain('Verify report')
    expect(other).not.toContain('Unique segment-one report');expect(other).toContain('No reports for this segment')
  })
  it('explains checkbox eligibility and does not present a plan before calculation',()=>{
    const html=renderToStaticMarkup(<DeveloperWorkspace state={{...initialWorkflow(),planning_mode:'manual'}} commit={()=>false} notice="" back={()=>{}}/>)
    expect(html).toContain('Candidates eligible for optimisation')
    expect(html).toContain('Checked candidates may be selected by the optimiser; they are not automatically selected.')
    expect(html).toContain('No current plan.');expect(html).toContain('illustrative score, not a measured shade/cooling result')
    expect(html).not.toContain('Report this walkway')
  })
  it('defaults to ten current-map footfall choices with fictional counts and both price estimates',()=>{
    const html=renderToStaticMarkup(<DeveloperWorkspace state={initialWorkflow()} commit={()=>false} notice="" back={()=>{}}/>)
    expect(html.match(/data-footfall-rank=/g)).toHaveLength(10)
    expect(html).toContain('FICTIONAL DEMO FOOTFALL &amp; PRICES');expect(html).toContain('Top 10 paths by demo footfall')
    expect(html).toContain('Assumed price per tree (RM)');expect(html).toContain('Assumed roof price per metre (RM)')
    expect(html).toContain('Footfall #1');expect(html).toContain('No current plan.')
    expect(html).not.toContain('Total assumed benefit for INT-01')
  })
})
