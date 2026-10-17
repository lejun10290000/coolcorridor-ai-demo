import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { currentSnapshot, initialWorkflow } from '../workflow/model'
import { compareRoutes } from './compare'
import { RouteCards } from './RouteCards'
describe('calculated route presentation',()=>{
  it('retains both objective cards and explains identical paths',()=>{
    const comparison=compareRoutes(currentSnapshot(initialWorkflow()))
    const html=renderToStaticMarkup(<RouteCards comparison={comparison} selected="shortest" onSelect={()=>{}}/>)
    expect(html).toContain('Both criteria select the same illustrative path with current data')
    expect(html.match(/data-route-objective=/g)).toHaveLength(2)
    expect(html.match(/data-route-segments="DEMO-S03"/g)).toHaveLength(2)
  })
  it('reports unknown coverage separately from known classifications and never calls it measured exposure',()=>{
    const snapshot=currentSnapshot(initialWorkflow())
    snapshot.segments=snapshot.segments.map(s=>({...s,shade_label:'unknown'}))
    const comparison=compareRoutes(snapshot)
    const html=renderToStaticMarkup(<RouteCards comparison={comparison} selected="exposure" onSelect={()=>{}}/>)
    expect(html).toContain('Unknown shade: 190 m (100.0%)')
    expect(html).toContain('Known-label length: 0 m (0.0%)')
    expect(html).toContain('conservative unknown penalty: 190.0')
    expect(html).toContain('not measured exposed distance')
  })
  it('does not fabricate cards or metrics when no feasible route exists',()=>{
    const snapshot=currentSnapshot(initialWorkflow())
    snapshot.segments=snapshot.segments.map(s=>({...s,length_m:null}))
    const html=renderToStaticMarkup(<RouteCards comparison={compareRoutes(snapshot)} selected="shortest" onSelect={()=>{}}/>)
    expect(html).toContain('Unavailable: no defensible complete path/metrics')
    expect(html).not.toContain('data-route-objective=')
  })
})
