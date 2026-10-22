import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createCosmicSky } from './CosmicSky'
import { createTownshipWorld, type LandingChapter, type LandingQuality } from './world'

interface Props {
  chapter: LandingChapter
  paused: boolean
  quality: LandingQuality
  orbitTourToken: number
  onUnavailable: () => void
}

const cameraView = { radius: 37, elevation: 20, target: new THREE.Vector3(1, 1, 0), fov: 45 }

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
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.className = 'township-canvas'
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D concept township. Drag the empty world area to orbit the camera.')
    renderer.domElement.setAttribute('role', 'img')
    mount.appendChild(renderer.domElement)
    const world = createTownshipWorld()
    const sky = createCosmicSky()
    world.scene.add(sky.mesh)
    world.setQuality(qualityRef.current)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 130)
    camera.position.set(25, 20, 27)
    camera.lookAt(cameraView.target)
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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
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
      // Explanation tabs never change the camera. Only drag, tour and ambient motion orbit it.
      camera.position.set(cameraView.target.x + Math.cos(orbitAngle) * cameraView.radius, cameraView.elevation, cameraView.target.z + Math.sin(orbitAngle) * cameraView.radius)
      camera.lookAt(cameraView.target)
      sky.update(reducedMotion.matches ? 0 : sceneSeconds, camera)
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
