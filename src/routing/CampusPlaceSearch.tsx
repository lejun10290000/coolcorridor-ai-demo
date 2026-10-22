import { useId, useMemo, useState } from 'react'
import { campusNodeName, campusRouteNodes } from '../campusWalkways'

const aliases: Record<string, string> = {
  'MAIN-GATE': 'main gate pintu masuk utama',
  'REAR-GATE': 'rear gate bus parking pintu masuk belakang',
  'KLINIK-UTM': 'clinic health centre pusat kesihatan klinik',
}
const normalize = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
export function findCampusPlaces(query: string) {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return []
  const rank = (node: typeof campusRouteNodes[number]) => words.every(word => normalize(campusNodeName(node)).includes(word)) ? 0 : words.every(word => normalize(aliases[node.id] ?? '').includes(word)) ? 1 : 2
  return campusRouteNodes.filter(node => {
    const searchable = normalize(`${campusNodeName(node)} ${node.id} ${aliases[node.id] ?? ''}`)
    return words.every(word => searchable.includes(word))
  }).sort((a, b) => rank(a) - rank(b))
}

export function CampusPlaceSearch({ onChoose, onClear, hasSelection }: { onChoose: (id: string, endpoint: 'from' | 'to') => void; onClear: () => void; hasSelection: boolean }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState('')
  const id = useId()
  const results = useMemo(() => findCampusPlaces(query), [query])
  function choose(nodeId: string, endpoint: 'from' | 'to') { onChoose(nodeId, endpoint); setQuery(''); setOpen(false) }
  return <div className="campus-place-search">
    <div className="route-utilities">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>⌕ Search campus places</button>
      <button type="button" disabled={!hasSelection} onClick={() => { onClear(); setQuery(''); setOpen(false) }}>Clear route</button>
    </div>
    {open && <section id={id} className="place-search-panel" aria-label="Campus place search">
      <label htmlFor={`${id}-input`}>Find a place by name<input autoFocus id={`${id}-input`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try Main Gate, clinic or MJIIT" autoComplete="off" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); event.currentTarget.closest('.campus-place-search')?.querySelector<HTMLButtonElement>('button')?.focus() } }}/></label>
      {!query.trim() ? <p className="place-search-hint">Search in English or use the campus place name, then choose where your walk starts or ends.</p> : <>
        <p className="place-search-hint" role="status">{results.length ? `${results.length} matching ${results.length === 1 ? 'place' : 'places'}${results.length > 6 ? ' · showing 6; type more to narrow the list' : ''}` : 'No matching places. Try a shorter name, clinic or Main Gate.'}</p>
        <ul className="place-search-results">{results.slice(0, 6).map(node => <li key={node.id} data-place-id={node.id}><strong>{campusNodeName(node)}</strong><div><button type="button" aria-label={`Set ${campusNodeName(node)} as start`} onClick={() => choose(node.id, 'from')}>Start here</button><button type="button" aria-label={`Set ${campusNodeName(node)} as destination`} onClick={() => choose(node.id, 'to')}>Go here →</button></div></li>)}</ul>
      </>}
    </section>}
  </div>
}
