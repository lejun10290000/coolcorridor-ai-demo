import type { ResidentReport } from '../types'

/** Sort a copy; report IDs resolve equal timestamps with the newest sequence first. */
export function newestReportsFirst(reports: ResidentReport[]): ResidentReport[] {
  return [...reports].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    || b.report_id.localeCompare(a.report_id, undefined, { numeric: true }))
}
