import { describe, expect, it } from 'vitest'
import { clampMapOffset, mapAxisBounds, zoomAroundCursor } from './mapViewport'

describe('campus map viewport geometry', () => {
  it('allows movement in both axes even while a zoomed image is narrower than the stage', () => {
    expect(mapAxisBounds(900, 600, 650)).toEqual({ min: -350, max: -50 })
    expect(mapAxisBounds(600, 1200, 300)).toEqual({ min: -300, max: 300 })
    expect(clampMapOffset({ x: -200, y: 80 }, { x: 900, y: 600 }, { x: 600, y: 900 }, { x: 650, y: 300 })).toEqual({ x: -200, y: 80 })
  })

  it('clamps the image to a reachable edge rather than letting it vanish', () => {
    expect(clampMapOffset({ x: -900, y: 900 }, { x: 900, y: 600 }, { x: 600, y: 900 }, { x: 650, y: 300 })).toEqual({ x: -350, y: 150 })
  })

  it('holds the point beneath the cursor during a wheel zoom', () => {
    const result = zoomAroundCursor({ x: 350, y: 180 }, { x: 500, y: 300 }, { x: -80, y: 20 }, 1.5, 2)
    expect(result.x).toBeCloseTo(-56.667, 2)
    expect(result.y).toBeCloseTo(66.667, 2)
  })
})
