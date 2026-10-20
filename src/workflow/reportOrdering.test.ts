import { describe, expect, it } from 'vitest'
import { newestReportsFirst } from './reportOrdering'
import { initialWorkflow, submitReport } from './model'

function reports(){
  let state=initialWorkflow()
  for(const [date,comment] of [['2026-10-18T12:00:00+08:00','oldest'],['2026-10-20T12:00:00+08:00','newest'],['2026-10-19T12:00:00+08:00','middle']]){
    state=submitReport(state,{segment_id:'DEMO-S01',category:'no shade',comment_optional:comment},date)
  }
  return state.reports
}
describe('Resident report inbox ordering',()=>{
  it('orders by actual creation date rather than saved array order or ID and leaves storage untouched',()=>{
    const input=reports(),before=JSON.stringify(input)
    Object.freeze(input)
    expect(newestReportsFirst(input).map(r=>r.comment_optional)).toEqual(['newest','middle','oldest'])
    expect(JSON.stringify(input)).toBe(before)
  })
  it('resolves equal dates newest ID first, including numeric IDs beyond single digits',()=>{
    const base=reports()[0]
    expect(newestReportsFirst(['REPORT-2','REPORT-10','REPORT-1'].map(report_id=>({...base,report_id}))).map(r=>r.report_id)).toEqual(['REPORT-10','REPORT-2','REPORT-1'])
  })
  it('compares timezone-aware instants and handles an empty inbox',()=>{
    const base=reports()[0]
    expect(newestReportsFirst([{...base,report_id:'earlier',created_at:'2026-10-20T12:00:00+08:00'},{...base,report_id:'later',created_at:'2026-10-20T05:00:00+00:00'}]).map(r=>r.report_id)).toEqual(['later','earlier'])
    expect(newestReportsFirst([])).toEqual([])
  })
})
