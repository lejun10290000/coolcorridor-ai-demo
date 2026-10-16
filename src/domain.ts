import type { InterventionCandidate, Lifecycle, Priority, WalkwaySegment } from './types'

export const hourlyEquivalent = (count: number, duration: number) => count >= 0 && duration > 0 ? count / duration * 60 : null
export const validTransition = (from: Lifecycle, to: Lifecycle) => ({ proposed: 'approved_demo', approved_demo: 'under_construction', under_construction: 'installed_pending_verification', installed_pending_verification: 'verified', verified: 'published', published: null }[from] === to)
export function optimise(candidates: InterventionCandidate[], budget: number, excluded: string[]) {
  const eligible = candidates.filter(c => !excluded.includes(c.intervention_id) && c.feasibility_status !== 'ineligible')
  let best = { ids: [] as string[], cost: 0, benefit: 0 }
  for (let mask = 0; mask < 1 << eligible.length; mask++) {
    const picked = eligible.filter((_, i) => mask & 1 << i)
    const cost = picked.reduce((sum, c) => sum + c.cost_rm, 0)
    const constraints = picked.flatMap(c => c.constraints)
    if (cost > budget || new Set(constraints).size !== constraints.length) continue
    const perSegment = new Map<string, number>()
    picked.forEach(c => c.segment_ids.forEach(id => perSegment.set(id, Math.max(perSegment.get(id) ?? 0, c.modelled_benefit))))
    const benefit = [...perSegment.values()].reduce((a, b) => a + b, 0)
    if (benefit > best.benefit || benefit === best.benefit && cost < best.cost) best = { ids: picked.map(c => c.intervention_id), cost, benefit }
  }
  return { ...best, remaining: budget - best.cost, reason: best.ids.length ? 'Deterministic exhaustive search; overlapping segment benefits use the maximum only.' : 'No eligible portfolio fits the current budget and exclusions.' }
}
export function priorities(segments: WalkwaySegment[], rates: Record<string, number>): Priority[] {
  return segments.map(s => {
    const rate = rates[s.segment_id]; const exposed = s.shade_label === 'mostly_exposed' ? s.length_m : s.shade_label === 'mixed' && s.length_m ? s.length_m / 2 : null
    if (rate === undefined || exposed === null) return { segment_id: s.segment_id, score: null, rate: rate ?? null, exposed_length_m: exposed, reason: 'Needs survey: comparable footfall or defensible exposed length is unavailable.', confidence: 'needs survey' as const }
    return { segment_id: s.segment_id, score: rate * exposed, rate, exposed_length_m: exposed, reason: 'Demo proxy = hourly-equivalent passage events × estimated exposed length; not a health outcome.', confidence: 'demo estimate' as const }
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
}
