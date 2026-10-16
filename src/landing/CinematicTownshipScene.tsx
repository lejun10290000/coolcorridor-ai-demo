import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createTownshipWorld, type LandingChapter, type LandingQuality } from './world'

interface Props {
  chapter: LandingChapter
  paused: boolean
  quality: LandingQuality
  orbitTourToken: number
  onUnavailable: () => void
}

const views = [
  { radius: 37, elevation: 20, target: new THREE.Vector3(1, 1, 0), fov: 45, yawOffset: 0 },
  { radius: 27, elevation: 6.5, target: new THREE.Vector3(-4, 1, -1), fov: 48, yawOffset: 2.53 },
  { radius: 32, elevation: 28, target: new THREE.Vector3(1, 0.5, 0), fov: 43, yawOffset: 0 },
] as const

export function CinematicTownshipScene({ chapter, paused, quality, orbitTourToken, onUnavailable }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const chapterRef = useRef(chapter)
  const pausedRef = useRef(paused)
  const qualityRef = useRef(quality)
  const orbitTourTokenRef = useRef(orbitTourToken)
  const unavailableRef = useRef(onUnavailable)
  const [ready, setReady] = useState(false)
  chapterRef.current = chapter
  pausedRef.current = paused
  qualityRef.current = quality
  orbitTourTokenRef.current = orbitTourToken
  unavailableRef.current = onUnavailable

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || qualityRef.current === 'fallback') return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      unavailableRef.current()
      return
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.42
    renderer.shadowMap.enabled = qualityRef.current === 'high'
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'township-canvas'
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D concept township. Drag the empty world area to orbit the camera.')
    renderer.domElement.setAttribute('role', 'img')
    mount.appendChild(renderer.domElement)
    const world = createTownshipWorld()
    world.setQuality(qualityRef.current)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 130)
    camera.position.set(25, 20, 27)
    camera.lookAt(views[0].target)
    const size = () => {
      if (!mount.isConnected) return
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityRef.current === 'high' ? 1.5 : 1))
      renderer.setSize(width, height, false)
    }
    const resize = new ResizeObserver(size)
    resize.observe(mount)
    size()
    let frame = 0
    let previous = performance.now()
    let lastRender = 0
    let sceneSeconds = 0
    let orbitAngle = 0.73
    let observedTourToken = orbitTourTokenRef.current
    let tourRemaining = 0
    let dragStart: { x: number; yaw: number } | null = null
    let dragging = false
    const pointerDown = (event: PointerEvent) => {
      dragStart = { x: event.clientX, yaw: orbitAngle }
      dragging = true
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    const pointerMove = (event: PointerEvent) => {
      if (!dragStart) return
      orbitAngle = dragStart.yaw + (event.clientX - dragStart.x) * 0.009
    }
    const pointerUp = () => { dragStart = null; dragging = false }
    const contextLost = (event: Event) => { event.preventDefault(); unavailableRef.current() }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('pointercancel', pointerUp)
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    const currentTarget = views[0].target.clone()
    let currentRadius = views[0].radius
    let currentElevation = views[0].elevation
    let currentFov = views[0].fov
    let currentYawOffset = 0
    let qualityLast: LandingQuality = qualityRef.current
    let hasRendered = false
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate)
      const qualityNow = qualityRef.current
      if (qualityNow !== qualityLast) {
        qualityLast = qualityNow
        renderer.shadowMap.enabled = qualityNow === 'high'
        world.setQuality(qualityNow)
        size()
      }
      if (qualityNow === 'balanced' && now - lastRender < 33) return
      const delta = Math.max(0, Math.min((now - previous) / 1000, 0.25))
      previous = now
      lastRender = now
      if (orbitTourTokenRef.current !== observedTourToken) {
        observedTourToken = orbitTourTokenRef.current
        tourRemaining = 10
      }
      if (!pausedRef.current) {
        sceneSeconds += delta
        if (!dragging) {
          if (tourRemaining > 0) {
            const step = Math.min(delta, tourRemaining)
            orbitAngle += step * Math.PI * 2 / 10
            tourRemaining -= step
          } else orbitAngle += delta * 0.081 // ambient 360° orbit takes about 78 seconds
        }
      }
      const view = views[chapterRef.current]
      const blend = 1 - Math.exp(-delta * 1.55)
      currentRadius += (view.radius - currentRadius) * blend
      currentElevation += (view.elevation - currentElevation) * blend
      currentFov += (view.fov - currentFov) * blend
      currentYawOffset += (view.yawOffset - currentYawOffset) * blend
      currentTarget.lerp(view.target, blend)
      camera.fov = currentFov
      camera.updateProjectionMatrix()
      camera.position.set(currentTarget.x + Math.cos(orbitAngle + currentYawOffset) * currentRadius, currentElevation, currentTarget.z + Math.sin(orbitAngle + currentYawOffset) * currentRadius)
      camera.lookAt(currentTarget)
      world.update(sceneSeconds, chapterRef.current)
      renderer.render(world.scene, camera)
      if (!hasRendered) { hasRendered = true; setReady(true) }
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      renderer.domElement.removeEventListener('pointerdown', pointerDown)
      renderer.domElement.removeEventListener('pointermove', pointerMove)
      renderer.domElement.removeEventListener('pointerup', pointerUp)
      renderer.domElement.removeEventListener('pointercancel', pointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      world.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
    // The renderer is intentionally mounted once; chapter, pause and quality are live refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (quality === 'fallback') return <div className="township-fallback" role="img" aria-label="Static fictional future township concept. 3D orbit is unavailable." />
  return <div className="township-render" ref={mountRef}>{!ready && <div className="scene-loading">Preparing the future township…</div>}</div>
}
