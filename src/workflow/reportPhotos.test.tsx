import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReportReferencePhoto } from '../types'
import { initialWorkflow, currentSnapshot, reviewReport } from './model'
import { manualReportRoute, submitRouteReport, acceptRouteReport } from './routeReports'
import { decodeWorkflow } from './storage'
import { validReportPhoto } from './reportPhotos'
import { ReportReview } from './ReportReview'

const now='2026-10-20T16:00:00+08:00'
// Bounded JPEG-signature fixture for model validation; browser tests use a real decoded JPEG.
const photo:ReportReferencePhoto={data_url:'data:image/jpeg;base64,/9j/AAAA',source:'resident_upload',capture_time:null}
function submit(reference_photo?:ReportReferencePhoto){const s=initialWorkflow();return submitRouteReport(s,{route:manualReportRoute(currentSnapshot(s),'MAIN-GATE','INNER-GATE')!,category:'broken shade structure',description:'Synthetic broken canopy report.',...(reference_photo?{reference_photo}:{})},now)}
describe('optional Resident report reference photo',()=>{
 it('keeps reports without photos compatible and does not add an empty attachment',()=>{
  const s=submit();expect(s.reports[0].reference_photo).toBeUndefined();expect(decodeWorkflow(JSON.stringify(s))).toEqual(s)
 })
 it('copies a valid optional attachment and persists it with the exact saved report',()=>{
  const original={...photo},s=submit(original);original.data_url='changed'
  expect(s.reports[0].reference_photo).toEqual(photo);expect(s.reports[0].review_status).toBe('submitted')
  expect(decodeWorkflow(JSON.stringify(s))).toEqual(s);expect(s.snapshots).toEqual(initialWorkflow().snapshots)
 })
 it('rejects external, active, unsupported, oversized or invalid photo metadata',()=>{
  for(const invalid of [null,{}, {...photo,data_url:'https://example.com/image.jpg'}, {...photo,data_url:'data:image/svg+xml;base64,PHN2Zz4='},{...photo,data_url:'data:image/jpeg;base64,not-an-image'}, {...photo,data_url:'data:image/jpeg;base64,/9j/'+'A'.repeat(300000)},{...photo,source:'verified'},{...photo,capture_time:now}]){
   expect(validReportPhoto(invalid)).toBe(false)
   const s=initialWorkflow(),route=manualReportRoute(currentSnapshot(s),'MAIN-GATE','INNER-GATE')!
   expect(()=>submitRouteReport(s,{route,category:'other',description:'Issue',reference_photo:invalid as ReportReferencePhoto},now)).toThrow()
  }
 })
 it('validates attachments on reload instead of trusting saved data',()=>{
  const s=submit(photo);s.reports[0].reference_photo!.data_url='javascript:alert(1)'
  expect(()=>decodeWorkflow(JSON.stringify(s))).toThrow()
 })
 it('preserves reference images after acceptance or rejection without publishing them as map photos',()=>{
  const s=submit(photo),id=s.reports[0].report_id
  const accepted=acceptRouteReport(s,id,'Reviewer','Reviewed path and attached image',now),rejected=reviewReport(s,id,'rejected','Reviewer','Reference does not substantiate the issue',now)
  for(const next of [accepted,rejected]){expect(next.reports[0].reference_photo).toEqual(photo);expect(decodeWorkflow(JSON.stringify(next))).toEqual(next)}
  expect(currentSnapshot(accepted).segments.find(x=>x.segment_id==='DEMO-REF-001')!.shade_label).toBe('mixed')
  expect(rejected.snapshots).toEqual(s.snapshots)
 })
 it('shows the attachment next to Developer review controls with unverified source context',()=>{
  const html=renderToStaticMarkup(<ReportReview state={submit(photo)} commit={()=>true} onClose={()=>{}}/> )
  expect(html).toContain('Resident reference photo for REPORT-');expect(html).toContain(photo.data_url);expect(html).toContain('View larger photo');expect(html).toContain('capture time unknown');expect(html).toContain('Accept report');expect(html).toContain('Reject report')
 })
})
