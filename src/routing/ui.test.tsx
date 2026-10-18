import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { currentSnapshot, initialWorkflow } from '../workflow/model'
import { compareRoutes } from './compare'
import { RouteCards } from './RouteCards'
import { SelectedRouteOverlay } from './SelectedRouteOverlay'
import { shadeColours } from '../campusMapDisplay'
describe('calculated route presentation',()=>{
  it('retains both objective cards and explains identical paths',()=>{
    const comparison=compareRoutes(currentSnapshot(initialWorkflow()))
    const html=renderToStaticMarkup(<RouteCards comparison={comparison} selected="shortest" onSelect={()=>{}}/>)
    expect(html).toContain('No better-ranked alternative was found within the 25% detour cap')
    expect(html).toContain('Most shaded practical route')
    expect(html).toContain('Maximum detour: 25%')
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
  it('preserves grey shade centres and screen-space casing in the isolated selection overlay',()=>{
    const segments=currentSnapshot(initialWorkflow()).segments
    const html=renderToStaticMarkup(<svg><SelectedRouteOverlay segments={segments} routeIds={['DEMO-S03','DEMO-S04']}/></svg>)
    expect(html).toContain('data-route-overlay-id="DEMO-S03"')
    expect(html).toContain('data-route-overlay-id="DEMO-S04"')
    expect(html).not.toContain('data-route-overlay-id="DEMO-S01"')
    expect(html).toContain(`stroke="${shadeColours.unknown}"`)
    expect(html).toContain('vector-effect="non-scaling-stroke"')
    expect(html.indexOf('campus-route-halo')).toBeLessThan(html.indexOf('campus-route-outline'))
    expect(html.indexOf('campus-route-outline')).toBeLessThan(html.indexOf('campus-route-centre'))
  })
  it('does not fabricate cards or metrics when no feasible route exists',()=>{
    const snapshot=currentSnapshot(initialWorkflow())
    snapshot.segments=snapshot.segments.map(s=>({...s,length_m:null}))
    const html=renderToStaticMarkup(<RouteCards comparison={compareRoutes(snapshot)} selected="shortest" onSelect={()=>{}}/>)
    expect(html).toContain('Unavailable: no defensible complete path/metrics')
    expect(html).not.toContain('data-route-objective=')
  })
})
