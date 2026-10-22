import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createCosmicSky } from './CosmicSky'

describe('Homepage cosmic sky', () => {
  it('stays behind the township and follows the camera without participating in raycasts', () => {
    const sky = createCosmicSky()
    const material = sky.mesh.material as THREE.ShaderMaterial
    const camera = new THREE.PerspectiveCamera()
    camera.position.set(12, 20, -8)
    sky.update(8.5, camera)
    expect(sky.mesh.position.toArray()).toEqual(camera.position.toArray())
    expect(sky.mesh.renderOrder).toBeLessThan(0)
    expect(material.side).toBe(THREE.BackSide)
    expect(material.depthTest).toBe(true)
    expect(material.depthWrite).toBe(false)
    expect(material.uniforms.uTime.value).toBe(8.5)
    const hits: THREE.Intersection[] = []
    sky.mesh.raycast(new THREE.Raycaster(), hits)
    expect(hits).toHaveLength(0)
    sky.mesh.geometry.dispose()
    material.dispose()
  })
})
