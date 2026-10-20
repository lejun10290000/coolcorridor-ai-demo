import type { ReportReferencePhoto } from '../types'

/** Only bounded, browser-reencoded JPEG previews; never external URLs or active image formats. */
export function validReportPhoto(value:unknown):value is ReportReferencePhoto {
  if(!value||typeof value!=='object'||Array.isArray(value))return false
  const p=value as Record<string,unknown>
  return p.source==='resident_upload'&&p.capture_time===null&&typeof p.data_url==='string'&&p.data_url.length<=300000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(p.data_url)
}
